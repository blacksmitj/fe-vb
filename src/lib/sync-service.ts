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

    console.log(`Starting Sheet -> DB Pull for program: ${program.name}`);
    const { headers, rows } = await getSheetRows(token, sheetId, sheetName);

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
    await db.$transaction(async (tx) => {
      // Clear old data
      await tx.participantData.deleteMany({
        where: { programId },
      });

      // Insert new parsed data from sheet
      await tx.participantData.create({
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
      await tx.program.update({
        where: { id: programId },
        data: {
          totalRows: rows.length,
          fieldCount: headers.length,
          errorCount: errorsList.length,
          sheetLastSyncAt: new Date(),
        },
      });
    });

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

    return { 
      success: true, 
      rowsSynced: rows.length, 
      message: `Successfully synced ${rows.length} rows.` 
    };

  } catch (error: any) {
    console.error("Error pulling from Google Sheet:", error);
    
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
