import { db } from "@/lib/db";
import { auth } from "@/lib/auth/auth";
import { headers as getHeaders } from "next/headers";
import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { Readable } from "stream";

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
    const workbook = new ExcelJS.Workbook();
    const filename = file.name.toLowerCase();

    if (filename.endsWith(".csv")) {
      const stream = Readable.from(buffer);
      await workbook.csv.read(stream);
    } else {
      await workbook.xlsx.load(buffer as any);
    }

    // Find the correct worksheet
    let worksheet = workbook.worksheets[0];
    if (sheetName) {
      const found = workbook.worksheets.find(s => s.name === sheetName);
      if (found) worksheet = found;
    }

    if (!worksheet) {
      return NextResponse.json({ error: "Spreadsheet tidak memiliki worksheet." }, { status: 400 });
    }

    // 1. Find Header Row
    let headerRow = worksheet.getRow(1);
    let headerRowNumber = 1;
    for (let i = 1; i <= Math.min(worksheet.rowCount, 10); i++) {
      const row = worksheet.getRow(i);
      const rowValues = row.values;
      if (rowValues && (Array.isArray(rowValues) ? rowValues.some(v => v !== null && v !== undefined) : Object.keys(rowValues).length > 0)) {
        headerRow = row;
        headerRowNumber = i;
        break;
      }
    }

    const headersList: string[] = [];
    headerRow.eachCell({ includeEmpty: false }, (cell) => {
      const value = cell.value;
      if (value !== null && value !== undefined) {
        if (typeof value === "object" && "text" in value) {
          headersList.push(String(value.text).trim());
        } else {
          headersList.push(String(value).trim());
        }
      }
    });

    const cleanHeaders = Array.from(new Set(headersList.filter(h => h.length > 0)));

    if (!cleanHeaders.includes(sheetUniqueKey)) {
      return NextResponse.json(
        { error: `Kolom ID Unik "${sheetUniqueKey}" tidak ditemukan di file.` },
        { status: 400 }
      );
    }

    // 2. Parse Rows
    const rows: Record<string, any>[] = [];
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber <= headerRowNumber) return;

      const rowData: Record<string, any> = {};
      cleanHeaders.forEach((header, idx) => {
        const cell = row.getCell(idx + 1);
        let val = cell.value;
        if (val !== null && val !== undefined) {
          if (typeof val === "object") {
            if ("text" in val) {
              val = val.text;
            } else if ("result" in val) {
              val = val.result;
            } else if (val instanceof Date) {
              // Keep Date
            } else {
              val = JSON.stringify(val);
            }
          }
          rowData[header] = typeof val === "string" ? val.trim() : val;
        } else {
          rowData[header] = "";
        }
      });

      rowData["__sheetRowIndex"] = rowNumber;
      rows.push(rowData);
    });

    if (rows.length === 0) {
      return NextResponse.json({ error: "File spreadsheet tidak memiliki baris data." }, { status: 400 });
    }

    // 3. Validation: Unique Key Check
    const errorsList: any[] = [];
    const keyMap = new Map<string, number>();

    rows.forEach((row) => {
      const keyValue = String(row[sheetUniqueKey] || "").trim();
      const currentSheetRow = row["__sheetRowIndex"];
      if (!keyValue) {
        errorsList.push({
          row: currentSheetRow,
          column: sheetUniqueKey,
          message: "Unique Key kosong."
        });
      } else if (keyMap.has(keyValue)) {
        errorsList.push({
          row: currentSheetRow,
          column: sheetUniqueKey,
          message: `Duplikasi Unique Key: "${keyValue}" (sudah ada di baris ${keyMap.get(keyValue)})`
        });
      } else {
        keyMap.set(keyValue, currentSheetRow);
      }
    });

    // 4. Update Program in Transaction (Delete old and replace)
    const updatedProgram = await db.$transaction(async (tx) => {
      // Delete old ParticipantData
      await tx.participantData.deleteMany({
        where: { programId: id },
      });

      // Update program metadata
      const prog = await tx.program.update({
        where: { id },
        data: {
          totalRows: rows.length,
          fieldCount: cleanHeaders.length,
          errorCount: errorsList.length,
        },
      });

      // Prepare all batch records
      const participantDataRecords = [];
      const batchSize = 500;
      for (let i = 0; i < rows.length; i += batchSize) {
        const chunk = rows.slice(i, i + batchSize);
        const batchIndex = Math.floor(i / batchSize);
        
        // Filter errors that belong to this batch
        const startRow = i + headerRowNumber + 1;
        const endRow = startRow + chunk.length - 1;
        const batchErrors = errorsList.filter(e => e.row >= startRow && e.row <= endRow);

        participantDataRecords.push({
          programId: id,
          headers: cleanHeaders as any,
          rows: chunk as any,
          batchIndex,
          totalInBatch: chunk.length,
          errorDetails: batchErrors.length > 0 ? (batchErrors as any) : null,
        });
      }

      // Insert new batches
      await tx.participantData.createMany({
        data: participantDataRecords,
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
