import { db } from "@/lib/db";
import { auth } from "@/lib/auth/auth";
import { headers as getHeaders } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await getHeaders(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if the user is an APPROVED member of the program
    const membership = await db.programMember.findUnique({
      where: {
        programId_userId: {
          programId: id,
          userId: session.user.id,
        },
      },
    });

    if (!membership || membership.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Forbidden: Hanya anggota program yang disetujui." },
        { status: 403 }
      );
    }

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
          headers: true,
        },
      }),

      // Hanya ambil data dari participant pertama
      db.participant.findFirst({
        where: { programId: id },
        orderBy: { rowIndex: "asc" },
        select: { data: true },
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

    const headers = program.headers ?? [];
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
