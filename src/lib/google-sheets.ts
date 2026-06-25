export interface SheetDataResponse {
  headers: string[];
  rows: Record<string, string>[];
}

/**
 * Helper to extract friendly error message from Google API responses
 */
async function handleGoogleError(response: Response, defaultMsg: string): Promise<never> {
  const errText = await response.text();
  try {
    const parsed = JSON.parse(errText);
    if (parsed.error?.message) {
      throw new Error(parsed.error.message);
    }
  } catch (err: any) {
    if (err.message && !err.message.includes("JSON")) {
      throw err;
    }
  }
  throw new Error(`${defaultMsg}: Status ${response.status} - ${errText}`);
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
    await handleGoogleError(response, "Google Sheet API returned an error");
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
    await handleGoogleError(response, "Failed to update Google Sheet row");
  }
}

/**
 * Fetch all sheets (tab titles) in a spreadsheet
 */
export async function getSpreadsheetSheets(
  accessToken: string,
  sheetId: string
): Promise<string[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties.title`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    await handleGoogleError(response, "Failed to fetch spreadsheet sheets list");
  }

  const data = await response.json();
  const sheets = data.sheets || [];
  return sheets.map((s: any) => s.properties?.title).filter(Boolean);
}

/**
 * Fetch header names (first row) from a Google Sheet tab
 */
export async function getSheetHeadersOnly(
  accessToken: string,
  sheetId: string,
  sheetName: string
): Promise<string[]> {
  const range = `${sheetName}!1:1`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    await handleGoogleError(response, "Failed to fetch sheet headers");
  }

  const data = await response.json();
  const values: string[][] = data.values || [];
  if (values.length === 0) return [];
  return values[0].map(h => (h || "").trim()).filter(Boolean);
}
