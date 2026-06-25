export interface SheetDataResponse {
  headers: string[];
  rows: Record<string, string>[];
}

/**
 * Fetch rows and headers from a Google Sheet tab
 */
export async function getSheetRows(
  accessToken: string,
  sheetId: string,
  sheetName: string
): Promise<SheetDataResponse> {
  const range = encodeURIComponent(sheetName);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Sheet API returned status ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const values: string[][] = data.values || [];

  if (values.length === 0) {
    return { headers: [], rows: [] };
  }

  // Row 1 is header
  const headers = values[0].map(h => (h || "").trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < values.length; i++) {
    const rowValues = values[i];
    const rowObject: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      if (header) {
        rowObject[header] = rowValues[index] !== undefined ? String(rowValues[index]) : "";
      }
    });

    // Save the actual 1-based sheet row number (index + 1) in a hidden meta key for direct updates
    rowObject["__sheetRowIndex"] = String(i + 1);
    rows.push(rowObject);
  }

  return { headers, rows };
}

/**
 * Update cell values for a specific row in Google Sheet
 */
export async function updateSheetRow(
  accessToken: string,
  sheetId: string,
  sheetName: string,
  sheetRowIndex: number,
  headers: string[],
  updatedData: Record<string, any>
): Promise<void> {
  // To avoid cell mismatch, we construct the entire row array in the original header order
  const rowValues = headers.map(header => {
    const val = updatedData[header];
    return val !== undefined && val !== null ? String(val) : "";
  });

  // Target specific row range: TabName!A[rowIndex]:[LastColumnLetter][rowIndex]
  const range = `${sheetName}!A${sheetRowIndex}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      values: [rowValues],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to update Google Sheet row: ${errText}`);
  }
}
