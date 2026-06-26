import { db } from "@/lib/db";
import { auth } from "@/lib/auth/auth";
import { headers as getHeaders } from "next/headers";
import { NextResponse } from "next/server";
import { parseExcelFile } from "@/lib/excel-parser";

function buildSearchText(data: Record<string, any>): string {
  return Object.values(data)
    .filter((v) => v != null && v !== "")
    .map((v) => String(v))
    .join(" ");
}

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

    // Check if program exists and user is ADMIN
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

    const formData = await req.formData();
    const sheetName = formData.get("sheetName") as string | null;
    const sheetUniqueKey = formData.get("sheetUniqueKey") as string | null;
    const file = formData.get("file") as File | null;

    if (!sheetUniqueKey) {
      return NextResponse.json({ error: "Kolom ID Unik wajib diisi." }, { status: 400 });
    }
    if (!file) {
      return NextResponse.json({ error: "File spreadsheet wajib diunggah." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Parse Excel using the shared utility
    const { headers: cleanHeaders, rows, errors: errorsList } = await parseExcelFile(
      buffer,
      file.name,
      sheetUniqueKey,
      sheetName
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "File spreadsheet tidak memiliki baris data." }, { status: 400 });
    }

    // Update Program and Participants in transaction (Delete old and replace)
    const updatedProgram = await db.$transaction(async (tx) => {
      // Delete old Participant records
      await tx.participant.deleteMany({
        where: { programId: id },
      });

      // Update program metadata
      const prog = await tx.program.update({
        where: { id },
        data: {
          totalRows: rows.length,
          fieldCount: cleanHeaders.length,
          errorCount: errorsList.length,
          uniqueKeyColumn: sheetUniqueKey,
          headers: cleanHeaders,
        },
      });

      // Prepare all participant records
      const participantRecords = rows.map((row, rowIndex) => {
        const { [sheetUniqueKey]: uniqueKeyValue, __sheetRowIndex, ...rest } = row;
        return {
          programId: id,
          rowIndex,
          uniqueKey: String(uniqueKeyValue ?? "").trim(),
          data: rest as any,
          searchText: buildSearchText(rest),
        };
      });

      // Insert new participants
      await tx.participant.createMany({
        data: participantRecords,
      });

      // Create Reupload Import Log
      await tx.importLog.create({
        data: {
          programId: id,
          fileName: file.name,
          totalRows: rows.length,
          errorCount: errorsList.length,
          status: errorsList.length > 0 ? "PARTIAL" : "COMPLETED",
          notes: `Reupload data. ${
            errorsList.length > 0 ? `${errorsList.length} baris memiliki masalah validasi.` : "Berhasil diperbarui dengan bersih."
          }`,
        },
      });

      // Create Activity Log
      await tx.activityLog.create({
        data: {
          programId: id,
          userId: session.user.id,
          action: "REUPLOAD_DATA",
          details: `Meng-upload ulang database peserta menggunakan file "${file.name}" (${rows.length} baris, ${errorsList.length} validasi error).`,
        },
      });

      return prog;
    }, {
      maxWait: 15000,
      timeout: 30000,
    });

    return NextResponse.json(updatedProgram);
  } catch (error: any) {
    console.error("POST /api/programs/[id]/reupload error:", error);
    return NextResponse.json({ error: error.message || "Gagal meng-update program data." }, { status: 500 });
  }
}
