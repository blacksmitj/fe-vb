import { db } from "@/lib/db";
import { getGoogleAccessToken } from "@/lib/auth/get-google-token";
import { getSheetRows, updateSheetRow } from "@/lib/google-sheets";

export interface SyncResult {
  success: boolean;
  rowsSynced: number;
  message?: string;
  error?: string;
}

/**
 * PULL: Google Sheet -> Database Cache
 * Uses sheetUniqueKey as unique identifier for upsert.
 */
export async function pullFromSheet(programId: string, userId: string): Promise<SyncResult> {
  const t0 = performance.now();
  try {
    const program = await db.program.findUnique({
      where: { id: programId },
    });

    if (!program) {
      return { success: false, rowsSynced: 0, error: "Program not found" };
    }

    const { sheetId, sheetName, sheetUniqueKey } = program;

    if (!sheetId || !sheetName || !sheetUniqueKey) {
      return { 
        success: false, 
        rowsSynced: 0, 
        error: "Google Sheet connection is not fully configured for this program." 
      };
    }

    const token = await getGoogleAccessToken(userId);
    if (!token) {
      return { 
        success: false, 
        rowsSynced: 0, 
        error: "Failed to authenticate with Google. Please re-authenticate." 
      };
    }

    console.log(`[sync] Starting Sheet -> DB Pull for program: "${program.name}" (programId: ${programId})`);
    const tFetch0 = performance.now();
    const { headers, rows } = await getSheetRows(token, sheetId, sheetName);
    console.log(`[sync] Google Sheets API fetch done in ${(performance.now() - tFetch0).toFixed(0)}ms | rows=${rows.length} headers=${headers.length}`);

    if (headers.length === 0 || rows.length === 0) {
      return { success: true, rowsSynced: 0, message: "Sheet is empty." };
    }

    // Verify key exists in headers
    if (!headers.includes(sheetUniqueKey)) {
      return { 
        success: false, 
        rowsSynced: 0, 
        error: `Unique key "${sheetUniqueKey}" is not found in the sheet headers.` 
      };
    }

    // We store the data structure in a single ParticipantData entry or process individual upserts
    // Since verification builder shows participants, we will map them into the JSON structure
    // Let's format the rows into standard format and record validation errors if any
    
    // Check if participantData table already has records. We will upsert.
    // In our system, ParticipantData represents the entire dataset or batches.
    // Let's clear and write, or merge. Since we reset, we'll save this as batchIndex 0
    const errorsList: any[] = [];
    
    // Validate uniqueness of key in sheet data
    const keyMap = new Map<string, number>();
    rows.forEach((row, i) => {
      const keyValue = String(row[sheetUniqueKey] || "").trim();
      if (!keyValue) {
        errorsList.push({
          row: i + 2,
          column: sheetUniqueKey,
          message: "Unique Key is empty."
        });
      } else if (keyMap.has(keyValue)) {
        errorsList.push({
          row: i + 2,
          column: sheetUniqueKey,
          message: `Duplicate unique key value: "${keyValue}" (already seen on row ${keyMap.get(keyValue)})`
        });
      } else {
        keyMap.set(keyValue, i + 2);
      }
    });

    // Update database
    const tDb0 = performance.now();
    
    // Clear old data
    await db.participantData.deleteMany({
      where: { programId },
    });

    // Insert new parsed data from sheet
    await db.participantData.create({
      data: {
        programId,
        headers: headers as any,
        rows: rows as any,
        batchIndex: 0,
        totalInBatch: rows.length,
        errorDetails: errorsList.length > 0 ? (errorsList as any) : null,
      },
    });

    // Update program stats
    await db.program.update({
      where: { id: programId },
      data: {
        totalRows: rows.length,
        fieldCount: headers.length,
        errorCount: errorsList.length,
        sheetLastSyncAt: new Date(),
      },
    });
    console.log(`[sync] DB sequential updates done in ${(performance.now() - tDb0).toFixed(0)}ms`);

    // Create sync log
    await db.syncLog.create({
      data: {
        programId,
        direction: "PULL",
        status: errorsList.length > 0 ? "PARTIAL" : "SUCCESS",
        rowsAffected: rows.length,
        error: errorsList.length > 0 ? `${errorsList.length} rows have validation issues` : null,
      },
    });

    console.log(`[sync] pullFromSheet completed in ${(performance.now() - t0).toFixed(0)}ms total`);
    return { 
      success: true, 
      rowsSynced: rows.length, 
      message: `Successfully synced ${rows.length} rows.` 
    };

  } catch (error: any) {
    console.error(`[sync] pullFromSheet FAILED after ${(performance.now() - t0).toFixed(0)}ms:`, error);
    
    // Attempt to log failure
    try {
      await db.syncLog.create({
        data: {
          programId,
          direction: "PULL",
          status: "FAILED",
          error: error.message || String(error),
        },
      });
    } catch (_) {}

    return { 
      success: false, 
      rowsSynced: 0, 
      error: error.message || "Failed to pull data from Google Sheet." 
    };
  }
}

/**
 * PUSH: DB row -> Google Sheet
 * Triggered on save evaluation / editing.
 */
export async function pushRowToSheet(
  programId: string,
  participantUniqueValue: string,
  updatedRowData: Record<string, any>,
  userId: string
): Promise<void> {
  const program = await db.program.findUnique({
    where: { id: programId },
  });

  if (!program || !program.sheetId || !program.sheetName || !program.sheetUniqueKey) {
    return; // Program is not sheets-linked
  }

  const token = await getGoogleAccessToken(userId);
  if (!token) {
    throw new Error("Unable to authenticate with Google to push changes.");
  }

  // Fetch current ParticipantData to get the exact sheetRowIndex
  const pData = await db.participantData.findFirst({
    where: { programId },
  });

  if (!pData) return;

  const rows = pData.rows as Record<string, any>[];
  const headers = pData.headers as string[];

  const targetRow = rows.find(r => String(r[program.sheetUniqueKey!] || "").trim() === participantUniqueValue);

  if (!targetRow || !targetRow["__sheetRowIndex"]) {
    throw new Error(`Participant row with ID ${participantUniqueValue} could not be located for Google Sheet update.`);
  }

  const sheetRowIndex = parseInt(targetRow["__sheetRowIndex"], 10);

  // Sync to Google Sheet
  await updateSheetRow(
    token,
    program.sheetId,
    program.sheetName,
    sheetRowIndex,
    headers,
    updatedRowData
  );

  // Log success
  await db.syncLog.create({
    data: {
      programId,
      direction: "PUSH",
      status: "SUCCESS",
      rowsAffected: 1,
    },
  });
}
