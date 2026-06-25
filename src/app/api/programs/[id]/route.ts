import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const program = await db.program.findUnique({
      where: { id },
      include: {
        participantData: {
          orderBy: { batchIndex: "asc" }
        },
        profileSchema: true,
      }
    });

    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    // Combine headers and rows from participantData (only up to 10 rows for preview)
    const firstBatch = program.participantData.find((p) => p.batchIndex === 0);
    const headers = (firstBatch?.headers as string[]) ?? [];
    
    // Return only the first 10 rows for preview/builder page sample usage
    const data = firstBatch ? ((firstBatch.rows as Record<string, any>[]) ?? []).slice(0, 10) : [];

    return NextResponse.json({
      id: program.id,
      name: program.name,
      description: program.description,
      totalRows: program.totalRows,
      fieldCount: program.fieldCount,
      errorCount: program.errorCount,
      createdAt: program.createdAt.toISOString(),
      updatedAt: program.updatedAt.toISOString(),
      headers,
      data,
      profileSchema: program.profileSchema?.sections ?? [],
    });
  } catch (error) {
    console.error("GET /api/programs/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch program" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.program.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/programs/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete program" }, { status: 500 });
  }
}

