export interface AppsScriptOptions {
  origin: string;
  apiKey: string;
  profileFields: string[];
  enableProtection?: boolean;
}

/**
 * Generates modular and clean Google Apps Script code for Google Sheets sync
 */
export function generateAppsScriptTemplate({
  origin,
  apiKey,
  profileFields,
  enableProtection = false,
}: AppsScriptOptions): string {
  const protectionCall = enableProtection ? "\n    protectSyncedRange(sheet);" : "";
  const protectionFunction = enableProtection
    ? `\n\n/**
 * Helper: Mengunci sel rentang data API (Kolom A s.d. Kolom Terakhir) agar tidak dapat diubah oleh user lain
 */
function protectSyncedRange(sheet) {
  const colCount = HEADERS.length;
  const lastRow = Math.max(sheet.getLastRow(), 1);
  const dataRange = sheet.getRange(1, 1, lastRow, colCount);

  // 1. Hapus proteksi lama VerifBuilder (jika ada) untuk diperbarui
  const existingProtections = sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE);
  existingProtections.forEach(function(p) {
    if (p.getDescription() === "VerifBuilder Locked Data") {
      p.remove();
    }
  });

  // 2. Buat proteksi baru untuk rentang data API
  const protection = dataRange.protect().setDescription("VerifBuilder Locked Data");

  // 3. Batasi izin edit hanya untuk akun pemilik skrip ini
  const me = Session.getEffectiveUser();
  protection.addEditor(me);

  // Hapus editor lain dari daftar akses edit rentang ini
  const currentEditors = protection.getEditors();
  currentEditors.forEach(function(editor) {
    if (editor.getEmail() !== me.getEmail()) {
      protection.removeEditor(editor);
    }
  });

  if (protection.canDomainEdit()) {
    protection.setDomainEdit(false);
  }
}`
    : "";

  return `/**
 * Script Google Apps Script untuk Import Data VerifBuilder ke Google Sheets
 * Di-generate otomatis sesuai dengan Field Profile Builder Program
 */

// 1. KONFIGURASI UTAMA
const CONFIG = {
  API_URL: "${origin}/api/v1/export/participants",
  API_KEY: "${apiKey}",
};

// 2. DAFTAR FIELD PROFILE BUILDER (${profileFields.length} Field)
const PROFILE_FIELDS = ${JSON.stringify(profileFields, null, 2)};

// 3. DAFTAR HEADER KOLOM LENGKAP (Unique Key -> Profile Fields -> Meta Verifikasi)
const HEADERS = [
  "ID Unique",
  ...PROFILE_FIELDS,
  "Status Verifikasi",
  "Catatan Verifikasi",
  "Diverifikasi Oleh",
  "Waktu Verifikasi"
];

/**
 * Menambahkan Menu Khusus di Google Sheets untuk Sinkronisasi Manual 1-Klik
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('VerifBuilder')
    .addItem('⚡ Sinkronkan Data Sekarang', 'syncVerifBuilderData')
    .addToUi();
}

/**
 * Fungsi Utama Sinkronisasi Data
 */
function syncVerifBuilderData() {
  try {
    const result = fetchParticipants();
    if (!result.success || !result.data) {
      Browser.msgBox("Error", "Gagal mengambil data: " + (result.message || "Unauthorized"), Browser.Buttons.OK);
      return;
    }

    const participants = result.data;
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    writeHeaders(sheet);

    if (participants.length === 0) {
      Browser.msgBox("Info", "Data peserta kosong.", Browser.Buttons.OK);
      return;
    }

    const rowsData = buildRows(participants);
    writeRows(sheet, rowsData);${protectionCall}

    Logger.log("Berhasil menyinkronkan " + rowsData.length + " data peserta.");
    Browser.msgBox("Sukses", "Berhasil menyinkronkan " + rowsData.length + " data peserta!", Browser.Buttons.OK);
  } catch (e) {
    Logger.log("Error syncVerifBuilderData: " + e.toString());
    Browser.msgBox("Error", "Terjadi kesalahan: " + e.toString(), Browser.Buttons.OK);
  }
}

/**
 * Helper: Mengambil data dari API VerifBuilder
 */
function fetchParticipants() {
  const options = {
    method: "GET",
    headers: {
      "x-api-key": CONFIG.API_KEY,
      "Content-Type": "application/json"
    },
    muteHttpExceptions: true
  };
  const response = UrlFetchApp.fetch(CONFIG.API_URL, options);
  return JSON.parse(response.getContentText());
}

/**
 * Helper: Menuliskan Header di Baris 1 (Mulai Kolom A)
 */
function writeHeaders(sheet) {
  const colCount = HEADERS.length;
  const headerRange = sheet.getRange(1, 1, 1, colCount);
  headerRange.setValues([HEADERS]);
  headerRange.setBackground("#1e293b").setFontColor("#ffffff").setFontWeight("bold");
}

/**
 * Helper: Mengubah array participants menjadi matriks baris untuk Sheet
 */
function buildRows(participants) {
  const tz = Session.getScriptTimeZone();
  return participants.map(function(item) {
    const row = [item.uniqueKey || "-"];

    PROFILE_FIELDS.forEach(function(fieldLabel) {
      row.push(item.data ? (item.data[fieldLabel] || "-") : "-");
    });

    row.push(item.evalStatus || "BELUM_DIVERIFIKASI");
    row.push(item.evalDescription || "-");
    row.push(item.evalByUserName || "-");
    row.push(item.evalAt
      ? Utilities.formatDate(new Date(item.evalAt), tz, "dd/MM/yyyy HH:mm:ss")
      : "-"
    );

    return row;
  });
}

/**
 * Helper: Menuliskan baris data ke Sheet (Mulai Kolom A) & membersihkan baris lama secara tepat
 */
function writeRows(sheet, rowsData) {
  const colCount = HEADERS.length;
  const lastRow = sheet.getLastRow();

  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, colCount).clearContent();
  }

  sheet.getRange(2, 1, rowsData.length, colCount).setValues(rowsData);
}${protectionFunction}`;
}
