import ExcelJS from "exceljs";
import { Readable } from "stream";

export interface ParsedExcelResult {
  headers: string[];
  rows: Record<string, any>[];
  errors: { row: number; column: string; message: string }[];
}

/**
 * Parse file Excel/CSV, extract headers, rows, and perform unique key validation.
 * @param buffer - File Buffer
 * @param filename - Name of the file to determine CSV/XLSX format
 * @param uniqueKey - Column name used as the unique identifier
 * @param sheetName - Optional sheet name to target
 */
export async function parseExcelFile(
  buffer: Buffer,
  filename: string,
  uniqueKey: string,
  sheetName?: string | null
): Promise<ParsedExcelResult> {
  const workbook = new ExcelJS.Workbook();
  const fileLower = filename.toLowerCase();

  if (fileLower.endsWith(".csv")) {
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
    throw new Error("Spreadsheet tidak memiliki worksheet.");
  }

  // 1. Find Header Row (look in first 10 rows)
  let headerRow = worksheet.getRow(1);
  let headerRowNumber = 1;
  for (let i = 1; i <= Math.min(worksheet.rowCount, 10); i++) {
    const row = worksheet.getRow(i);
    const rowValues = row.values;
    if (
      rowValues &&
      (Array.isArray(rowValues)
        ? rowValues.some(v => v !== null && v !== undefined)
        : Object.keys(rowValues).length > 0)
    ) {
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

  if (!cleanHeaders.includes(uniqueKey)) {
    throw new Error(`Kolom ID Unik "${uniqueKey}" tidak ditemukan di file.`);
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

  // 3. Validation: Unique Key Check
  const errorsList: { row: number; column: string; message: string }[] = [];
  const keyMap = new Map<string, number>();

  rows.forEach((row) => {
    const keyValue = String(row[uniqueKey] || "").trim();
    const currentSheetRow = row["__sheetRowIndex"];
    if (!keyValue) {
      errorsList.push({
        row: currentSheetRow,
        column: uniqueKey,
        message: "Unique Key kosong."
      });
    } else if (keyMap.has(keyValue)) {
      errorsList.push({
        row: currentSheetRow,
        column: uniqueKey,
        message: `Duplikasi Unique Key: "${keyValue}" (sudah ada di baris ${keyMap.get(keyValue)})`
      });
    } else {
      keyMap.set(keyValue, currentSheetRow);
    }
  });

  return {
    headers: cleanHeaders,
    rows,
    errors: errorsList
  };
}
