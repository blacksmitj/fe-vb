import { auth } from "@/lib/auth/auth";
import { headers as getHeaders } from "next/headers";
import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { Readable } from "stream";

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await getHeaders(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
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

    const sheets = workbook.worksheets.map((s) => s.name);
    if (sheets.length === 0) {
      return NextResponse.json({ error: "File spreadsheet kosong." }, { status: 400 });
    }

    const sheetName = formData.get("sheetName") as string | null;

    // Get the worksheet
    let worksheet = workbook.worksheets[0];
    if (sheetName) {
      const found = workbook.worksheets.find(s => s.name === sheetName);
      if (found) worksheet = found;
    }

    const headers: string[] = [];

    // Find the first row that actually has cells/data
    let headerRow = worksheet.getRow(1);
    let headerRowNumber = 1;
    for (let i = 1; i <= Math.min(worksheet.rowCount, 10); i++) {
      const row = worksheet.getRow(i);
      const rowValues = row.values;
      // ExcelJS row.values can be an array or object
      if (rowValues && (Array.isArray(rowValues) ? rowValues.some(v => v !== null && v !== undefined) : Object.keys(rowValues).length > 0)) {
        headerRow = row;
        headerRowNumber = i;
        break;
      }
    }

    // Read cells in the header row
    headerRow.eachCell({ includeEmpty: false }, (cell) => {
      const value = cell.value;
      if (value !== null && value !== undefined) {
        // Handle RichText or object values
        if (typeof value === "object" && "text" in value) {
          headers.push(String(value.text).trim());
        } else {
          headers.push(String(value).trim());
        }
      }
    });

    // Remove duplicates or empty strings from headers
    const cleanHeaders = Array.from(new Set(headers.filter(h => h.length > 0)));

    const sheetUniqueKey = formData.get("sheetUniqueKey") as string | null;

    let stats = null;
    let previewRows: any[] = [];
    let errors: any[] = [];

    if (sheetUniqueKey) {
      if (!cleanHeaders.includes(sheetUniqueKey)) {
        return NextResponse.json({ error: `Kolom ID Unik "${sheetUniqueKey}" tidak ditemukan di file.` }, { status: 400 });
      }

      // Parse all rows
      const rows: Record<string, any>[] = [];
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        // ExcelJS row rowNumber is 1-indexed. headerRowNumber is the row where cleanHeaders were found.
        if (rowNumber <= (headerRowNumber || 1)) return;

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
                // Keep date
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

      // Validation
      const keyMap = new Map<string, number>();
      rows.forEach((row) => {
        const keyValue = String(row[sheetUniqueKey] || "").trim();
        const currentSheetRow = row["__sheetRowIndex"];
        if (!keyValue) {
          errors.push({
            row: currentSheetRow,
            column: sheetUniqueKey,
            message: "Unique Key kosong."
          });
        } else if (keyMap.has(keyValue)) {
          errors.push({
            row: currentSheetRow,
            column: sheetUniqueKey,
            message: `Duplikasi Unique Key: "${keyValue}" (sudah ada di baris ${keyMap.get(keyValue)})`
          });
        } else {
          keyMap.set(keyValue, currentSheetRow);
        }
      });

      stats = {
        totalRows: rows.length,
        totalColumns: cleanHeaders.length,
        errorCount: errors.length,
      };

      // Slice preview rows (e.g. first 10 rows)
      previewRows = rows.slice(0, 10);
    }

    return NextResponse.json({
      sheets,
      headers: cleanHeaders,
      stats,
      previewRows,
      errors,
    });
  } catch (error: any) {
    console.error("POST /api/programs/import/preview error:", error);
    return NextResponse.json({ error: error.message || "Gagal membaca file spreadsheet." }, { status: 500 });
  }
}
