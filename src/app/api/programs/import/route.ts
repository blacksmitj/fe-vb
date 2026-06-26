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

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await getHeaders(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const name = formData.get("name") as string | null;
    const description = formData.get("description") as string | null;
    const sheetName = formData.get("sheetName") as string | null;
    const sheetUniqueKey = formData.get("sheetUniqueKey") as string | null;
    const file = formData.get("file") as File | null;

    if (!name) {
      return NextResponse.json({ error: "Nama program wajib diisi." }, { status: 400 });
    }
    if (!sheetUniqueKey) {
      return NextResponse.json({ error: "Kolom ID Unik wajib diisi." }, { status: 400 });
    }
    if (!file) {
      return NextResponse.json({ error: "File spreadsheet wajib diunggah." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Parse using the shared utility
    const { headers: cleanHeaders, rows, errors: errorsList } = await parseExcelFile(
      buffer,
      file.name,
      sheetUniqueKey,
      sheetName
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "File spreadsheet tidak memiliki baris data." }, { status: 400 });
    }

    // Create Program and Participants in a transaction
    const program = await db.$transaction(async (tx) => {
      // Create program metadata including uniqueKeyColumn
      const prog = await tx.program.create({
        data: {
          name,
          description: description || "",
          totalRows: rows.length,
          fieldCount: cleanHeaders.length,
          errorCount: errorsList.length,
          uniqueKeyColumn: sheetUniqueKey,
          programMembers: {
            create: {
              userId: session.user.id,
              role: "ADMIN",
              status: "APPROVED",
            },
          },
        },
      });

      // Prepare all participant records
      const participantRecords = rows.map((row, rowIndex) => {
        const { [sheetUniqueKey]: uniqueKeyValue, __sheetRowIndex, ...rest } = row;
        return {
          programId: prog.id,
          rowIndex,
          uniqueKey: String(uniqueKeyValue ?? "").trim(),
          data: rest as any,
          headers: cleanHeaders,
          searchText: buildSearchText(rest),
        };
      });

      // Insert all participants using createMany
      await tx.participant.createMany({
        data: participantRecords,
      });

      // Initialize empty profile schema
      await tx.profileSchema.create({
        data: {
          programId: prog.id,
          sections: [],
          version: 1,
        },
      });

      // Create Import Log
      await tx.importLog.create({
        data: {
          programId: prog.id,
          fileName: file.name,
          totalRows: rows.length,
          errorCount: errorsList.length,
          status: errorsList.length > 0 ? "PARTIAL" : "COMPLETED",
          notes: errorsList.length > 0 ? `${errorsList.length} baris memiliki masalah validasi.` : "Berhasil di-import dengan bersih.",
        },
      });

      return prog;
    }, {
      maxWait: 15000,
      timeout: 30000,
    });

    return NextResponse.json(program);
  } catch (error: any) {
    console.error("POST /api/programs/import error:", error);
    return NextResponse.json({ error: error.message || "Gagal meng-import program." }, { status: 500 });
  }
}
