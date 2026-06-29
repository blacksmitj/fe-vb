import { db } from "@/lib/db";
import { auth } from "@/lib/auth/auth";
import { headers as getHeaders } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(
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

    // Validate ADMIN membership
    const membership = await db.programMember.findUnique({
      where: {
        programId_userId: {
          programId: id,
          userId: session.user.id,
        },
      },
    });

    if (!membership || membership.role !== "ADMIN" || membership.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Hanya Admin program yang diperbolehkan meng-reupload data." },
        { status: 403 }
      );
    }

    const {
      uniqueKeyColumn,
      totalRows,
      fieldCount,
      errorCount,
      fileName,
      headers,
      filterMode = "ALL", // "ALL" | "UNVERIFIED" | "VERIFIED" | "REJECTED"
    } = await req.json();

    if (!uniqueKeyColumn) {
      return NextResponse.json({ error: "Kolom ID Unik wajib diisi." }, { status: 400 });
    }
    if (!headers || !Array.isArray(headers) || headers.length === 0) {
      return NextResponse.json({ error: "Headers wajib diisi." }, { status: 400 });
    }

    const result = await db.$transaction(async (tx) => {
      let allowedUniqueKeys: string[] = [];
      let existingHeaders: string[] = [];

      // Ambil data program yang ada saat ini
      const existingProgram = await tx.program.findUnique({
        where: { id },
        select: { headers: true, uniqueKeyColumn: true },
      });

      if (!existingProgram) {
        throw new Error("Program tidak ditemukan.");
      }

      existingHeaders = existingProgram.headers;

      if (filterMode === "ALL") {
        // Hapus semua peserta lama jika mode ALL
        await tx.participant.deleteMany({
          where: { programId: id },
        });

        // Update program metadata
        await tx.program.update({
          where: { id },
          data: {
            totalRows: totalRows || 0,
            fieldCount: fieldCount || 0,
            errorCount: errorCount || 0,
            uniqueKeyColumn,
            headers,
          },
        });
      } else {
        // Jika mode filter, cari peserta yang boleh diupdate sesuai filterMode
        const whereClause: any = { programId: id };
        if (filterMode === "UNVERIFIED") {
          whereClause.evalStatus = null;
        } else if (filterMode === "VERIFIED") {
          whereClause.evalStatus = "VERIFIED";
        } else if (filterMode === "REJECTED") {
          whereClause.evalStatus = "REJECTED";
        }

        const participants = await tx.participant.findMany({
          where: whereClause,
          select: { uniqueKey: true },
        });

        allowedUniqueKeys = participants.map((p) => p.uniqueKey);
      }

      // Create Reupload Import Log
      const filterLabel = 
        filterMode === "ALL" ? "Semua data" :
        filterMode === "UNVERIFIED" ? "Hanya yang belum dievaluasi" :
        filterMode === "VERIFIED" ? "Hanya yang VERIFIED" : "Hanya yang REJECTED";

      await tx.importLog.create({
        data: {
          programId: id,
          fileName: fileName || "file_reupload",
          totalRows: totalRows || 0,
          errorCount: errorCount || 0,
          status: errorCount > 0 ? "PARTIAL" : "COMPLETED",
          notes: `Reupload data (${filterLabel}). ${
            errorCount > 0
              ? `${errorCount} baris memiliki masalah validasi.`
              : "Berhasil diperbarui."
          }`,
        },
      });

      // Create Activity Log
      await tx.activityLog.create({
        data: {
          programId: id,
          userId: session.user.id,
          action: "REUPLOAD_DATA",
          details: `Meng-upload ulang database peserta (${filterLabel}) menggunakan file "${fileName || "file_reupload"}" (${totalRows} baris, ${errorCount} validasi error).`,
        },
      });

      return {
        programId: id,
        allowedUniqueKeys,
        existingHeaders,
      };
    }, {
      maxWait: 15000,
      timeout: 30000,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST /api/programs/[id]/reupload/start error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menginisiasi reupload." },
      { status: 500 }
    );
  }
}
