import { db } from "@/lib/db";
import { auth } from "@/lib/auth/auth";
import { pushRowToSheet } from "@/lib/sync-service";
import { headers as getHeaders } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    
    // Check if it's a search query
    const searchQuery = searchParams.get("search");
    
    if (searchQuery !== null) {
      const query = searchQuery.trim().toLowerCase();
      const batches = await db.participantData.findMany({
        where: { programId: id },
        orderBy: { batchIndex: "asc" },
        select: { batchIndex: true, rows: true },
      });

      const matches = [];
      for (const batch of batches) {
        const rows = (batch.rows as any[]) || [];
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const matchesQuery = Object.values(row).some((val) =>
            String(val).toLowerCase().includes(query)
          );
          if (matchesQuery) {
            matches.push({
              globalIndex: batch.batchIndex * 500 + i,
              row,
            });
          }
          // Limit search results for performance
          if (matches.length >= 100) break;
        }
        if (matches.length >= 100) break;
      }

      return NextResponse.json({ matches });
    }

    const pageParam = searchParams.get("page");
    const page = pageParam ? parseInt(pageParam, 10) : 0;

    if (isNaN(page) || page < 0) {
      return NextResponse.json({ error: "Invalid page parameter" }, { status: 400 });
    }

    const batchIndex = Math.floor(page / 500);
    const rowIndex = page % 500;

    const batch = await db.participantData.findFirst({
      where: { programId: id, batchIndex },
      select: { rows: true },
    });

    if (!batch) {
      return NextResponse.json({ participant: null, message: "No participant data found for this page" });
    }

    const rows = (batch.rows as any[]) || [];
    const participant = rows[rowIndex] || null;

    // Get total rows count from the program
    const program = await db.program.findUnique({
      where: { id },
      select: { totalRows: true },
    });

    return NextResponse.json({ 
      participant,
      totalRows: program?.totalRows ?? 0
    });
  } catch (error) {
    console.error("GET /api/programs/[id]/participants error:", error);
    return NextResponse.json({ error: "Failed to fetch participant" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({
    headers: await getHeaders(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const pageParam = searchParams.get("page");
    const page = pageParam ? parseInt(pageParam, 10) : 0;

    if (isNaN(page) || page < 0) {
      return NextResponse.json({ error: "Invalid page parameter" }, { status: 400 });
    }

    const { status, description, participant } = await req.json();

    const batchIndex = Math.floor(page / 500);
    const rowIndex = page % 500;

    const program = await db.program.findUnique({
      where: { id },
      select: { 
        sheetId: true,
        sheetUniqueKey: true,
      },
    });

    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    const batch = await db.participantData.findFirst({
      where: { programId: id, batchIndex },
    });

    if (!batch) {
      return NextResponse.json({ error: "Participant data not found" }, { status: 404 });
    }

    const rows = (batch.rows as any[]) || [];
    if (!rows[rowIndex]) {
      return NextResponse.json({ error: "Participant row not found" }, { status: 404 });
    }

    // Prepare updated row
    const mergedParticipant = {
      ...rows[rowIndex],
      ...(participant || {}),
      _evaluationStatus: status,
      _evaluationDescription: description || "",
      _evaluatedAt: new Date().toISOString(),
    };



    // Save back to db
    await db.participantData.update({
      where: { id: batch.id },
      data: { rows: rows.map((r, idx) => idx === rowIndex ? mergedParticipant : r) },
    });

    // Create activity log
    try {
      const uniqueKey = program.sheetUniqueKey || Object.keys(mergedParticipant)[0] || "ID";
      const uniqueValue = mergedParticipant[uniqueKey] || "Unknown";
      const details = `Mengubah status verifikasi peserta (${uniqueKey}: ${uniqueValue}) menjadi "${status}".${
        description ? ` Catatan: ${description}` : ""
      }`;

      await db.activityLog.create({
        data: {
          programId: id,
          userId: session.user.id,
          action: `VERIFICATION_${status}`,
          details,
        },
      });
    } catch (logError) {
      console.error("Failed to write activity log:", logError);
    }

    // PUSH: If Google Sheet integration is configured, push the change
    if (program.sheetId && program.sheetUniqueKey) {
      const uniqueKeyValue = String(mergedParticipant[program.sheetUniqueKey] || "").trim();
      if (uniqueKeyValue) {
        try {
          await pushRowToSheet(id, uniqueKeyValue, mergedParticipant, session.user.id);
        } catch (sheetError: any) {
          console.error("Error pushing to Google Sheet on save:", sheetError);
          // Return warning in output but keep db save successful
          return NextResponse.json({ 
            success: true, 
            participant: mergedParticipant,
            warning: `Data saved locally, but failed to sync to Google Sheet: ${sheetError.message || sheetError}`
          });
        }
      }
    }

    return NextResponse.json({ success: true, participant: mergedParticipant });
  } catch (error) {
    console.error("PATCH /api/programs/[id]/participants error:", error);
    return NextResponse.json({ error: "Failed to save evaluation" }, { status: 500 });
  }
}
