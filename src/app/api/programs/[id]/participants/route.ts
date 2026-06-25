import { db } from "@/lib/db";
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

    // Update the row evaluation properties and merge edited fields
    rows[rowIndex] = {
      ...rows[rowIndex],
      ...(participant || {}),
      _evaluationStatus: status,
      _evaluationDescription: description || "",
      _evaluatedAt: new Date().toISOString(),
    };

    // Save back to db
    await db.participantData.update({
      where: { id: batch.id },
      data: { rows },
    });

    return NextResponse.json({ success: true, participant: rows[rowIndex] });
  } catch (error) {
    console.error("PATCH /api/programs/[id]/participants error:", error);
    return NextResponse.json({ error: "Failed to save evaluation" }, { status: 500 });
  }
}
