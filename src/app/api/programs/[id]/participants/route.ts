import { db } from "@/lib/db";
import { auth } from "@/lib/auth/auth";
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
      if (!query) {
        return NextResponse.json({ matches: [] });
      }

      const matchesRaw = await db.$queryRaw<Array<{
        batchIndex: number;
        row: any;
        rowIndex: number;
      }>>`
        SELECT "batchIndex", "elem" as "row", ("idx" - 1)::int as "rowIndex"
        FROM "ParticipantData",
        jsonb_array_elements("rows") WITH ORDINALITY AS arr("elem", "idx")
        WHERE "programId" = ${id}
          AND EXISTS (
            SELECT 1
            FROM jsonb_each_text("elem") AS kv("key", "val")
            WHERE LEFT("key", 1) <> '_' AND "val" ILIKE ${`%${query}%`}
          )
        ORDER BY "batchIndex" ASC, "rowIndex" ASC
        LIMIT 100
      `;

      const matches = matchesRaw.map((m) => ({
        globalIndex: m.batchIndex * 500 + m.rowIndex,
        row: m.row,
      }));

      return NextResponse.json({ matches });
    }

    const pageParam = searchParams.get("page");
    const page = pageParam ? parseInt(pageParam, 10) : 0;

    if (isNaN(page) || page < 0) {
      return NextResponse.json({ error: "Invalid page parameter" }, { status: 400 });
    }

    const batchIndex = Math.floor(page / 500);
    const rowIndex = page % 500;

    const result = await db.$queryRaw<Array<{ row: any }>>`
      SELECT "rows"->CAST(${rowIndex} AS integer) as row
      FROM "ParticipantData"
      WHERE "programId" = ${id} AND "batchIndex" = ${batchIndex}
      LIMIT 1
    `;

    const participant = result[0]?.row || null;

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
        name: true,
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
      _evaluationStatus: status || "VERIFIED",
      _verifiedByName: session.user.name || session.user.email,
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
      const uniqueKey = Object.keys(mergedParticipant).find(k => !k.startsWith('_')) || "ID";
      const uniqueValue = mergedParticipant[uniqueKey] || "Unknown";
      const details = `Memverifikasi data peserta (${uniqueKey}: ${uniqueValue}).${
        description ? ` Catatan: ${description}` : ""
      }`;

      await db.activityLog.create({
        data: {
          programId: id,
          userId: session.user.id,
          action: "VERIFIED",
          details,
        },
      });
    } catch (logError) {
      console.error("Failed to write activity log:", logError);
    }

    return NextResponse.json({ success: true, participant: mergedParticipant });
  } catch (error) {
    console.error("PATCH /api/programs/[id]/participants error:", error);
    return NextResponse.json({ error: "Failed to save evaluation" }, { status: 500 });
  }
}
