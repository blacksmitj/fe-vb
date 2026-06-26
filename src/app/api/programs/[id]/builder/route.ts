import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [program, firstParticipant, schema] = await Promise.all([
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

      // Hanya ambil headers dan data dari participant pertama
      db.participant.findFirst({
        where: { programId: id },
        orderBy: { rowIndex: "asc" },
        select: { headers: true, data: true },
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

    const headers = (firstParticipant?.headers as string[]) ?? [];
    const sampleRow = (firstParticipant?.data as Record<string, unknown>) ?? {};

    return NextResponse.json({
      program,
      headers,
      sampleRow, // hanya baris pertama untuk preview field
      schema: schema?.sections ?? [],
      schemaVersion: schema?.version ?? 0,
    });
  } catch (error) {
    console.error("GET /api/programs/[id]/builder error:", error);
    return NextResponse.json({ error: "Failed to fetch builder data" }, { status: 500 });
  }
}
