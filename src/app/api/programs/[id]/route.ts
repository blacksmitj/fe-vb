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
      // Fetch only the first batch for headers and preview data (sliced to 10 rows on DB side)
      const previewResult = await db.$queryRaw<Array<{ headers: string; previewRows: string }>>`
        SELECT "headers", jsonb_path_query_array("rows"::jsonb, '$[0 to 9]') as "previewRows"
        FROM "ParticipantData"
        WHERE "programId" = ${id} AND "batchIndex" = 0
        LIMIT 1
      `;
      const firstBatch = previewResult[0] || null;
      
      // Parse headers and preview rows safely
      headers = typeof firstBatch?.headers === 'string'
        ? JSON.parse(firstBatch.headers)
        : (firstBatch?.headers as unknown as string[]) ?? [];
        
      data = typeof firstBatch?.previewRows === 'string'
        ? JSON.parse(firstBatch.previewRows)
        : (firstBatch?.previewRows as unknown as Record<string, any>[]) ?? [];
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

