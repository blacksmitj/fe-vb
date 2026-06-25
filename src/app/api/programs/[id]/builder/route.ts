import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [program, firstBatch, schema] = await Promise.all([
      // Metadata saja — tanpa relasi berat
      db.program.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          description: true,
          totalRows: true,
          fieldCount: true,
          errorCount: true,
          createdAt: true,
        },
      }),

      // Hanya batch pertama untuk headers + satu sampleRow
      db.participantData.findFirst({
        where: { programId: id, batchIndex: 0 },
        select: { headers: true, rows: true },
      }),

      // Konfigurasi layout
      db.profileSchema.findUnique({
        where: { programId: id },
        select: { sections: true, version: true },
      }),
    ]);

    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    const headers = (firstBatch?.headers as string[]) ?? [];
    const allRows = (firstBatch?.rows as Record<string, unknown>[]) ?? [];

    return NextResponse.json({
      program,
      headers,
      sampleRow: allRows[0] ?? {}, // hanya baris pertama untuk preview field
      schema: schema?.sections ?? [],
      schemaVersion: schema?.version ?? 0,
    });
  } catch (error) {
    console.error("GET /api/programs/[id]/builder error:", error);
    return NextResponse.json({ error: "Failed to fetch builder data" }, { status: 500 });
  }
}
