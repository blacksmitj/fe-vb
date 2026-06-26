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
        profileSchema: true,
      }
    });

    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const includePreview = searchParams.get("preview") === "true";

    let headers: string[] = [];
    let data: Record<string, any>[] = [];

    if (includePreview) {
      // Fetch headers from the first participant
      const firstParticipant = await db.participant.findFirst({
        where: { programId: id },
        orderBy: { rowIndex: "asc" },
        select: { headers: true },
      });

      headers = firstParticipant?.headers || [];

      // Fetch first 10 rows for preview
      const previewRows = await db.participant.findMany({
        where: { programId: id },
        orderBy: { rowIndex: "asc" },
        take: 10,
        select: { data: true },
      });
        
      data = previewRows.map(p => (p.data as Record<string, any>) || {});
    }

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

