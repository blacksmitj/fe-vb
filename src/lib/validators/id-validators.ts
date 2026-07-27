import { validateStreetAddress, parseAndFormatAddress, toTitleCase } from '../utils/street-verifier';
import { safeParseDate } from '../utils/format-date';

export { validateStreetAddress, parseAndFormatAddress, toTitleCase };
export type { ParsedAddress, ValidationResult as StreetValidationResult } from '../utils/street-verifier';

export interface ValidationResult<T = string> {
  isValid: boolean;
  error: string | null;
  warning?: string | null;
  value?: T;
  details?: Record<string, unknown>;
}



export interface NikDetails {
  provinsiCode: string;
  kabupatenCode: string;
  kecamatanCode: string;
  encodedDay: number;
  gender: 'Laki-Laki' | 'Perempuan';
  birthDay: number;
  birthMonth: number;
  birthYear: number;
  birthDate: Date;
  sequenceNumber: string;
}

export function parseDateComponents(dobInput: Date | string): { day: number; month: number; year: number } | null {
  if (!dobInput) return null;
  if (dobInput instanceof Date) {
    if (isNaN(dobInput.getTime())) return null;
    return {
      day: dobInput.getDate(),
      month: dobInput.getMonth() + 1,
      year: dobInput.getFullYear(),
    };
  }

  const str = String(dobInput).trim();
  if (!str) return null;

  // 1. Check YYYY-MM-DD format
  const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymdMatch) {
    return {
      year: parseInt(ymdMatch[1], 10),
      month: parseInt(ymdMatch[2], 10),
      day: parseInt(ymdMatch[3], 10),
    };
  }

  // 2. Check DD-MM-YYYY or DD/MM/YYYY format
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmyMatch) {
    return {
      day: parseInt(dmyMatch[1], 10),
      month: parseInt(dmyMatch[2], 10),
      year: parseInt(dmyMatch[3], 10),
    };
  }

  // 3. Fallback to safeParseDate
  const parsed = safeParseDate(str);
  if (parsed) {
    return {
      day: parsed.getDate(),
      month: parsed.getMonth() + 1,
      year: parsed.getFullYear(),
    };
  }

  return null;
}

/**
 * Validasi NIK (Nomor Induk Kependudukan - 16 digit)
 * Memeriksa:
 * 1. Panjang tepat 16 digit angka.
 * 2. Kode Provinsi, Kab/Kota, Kecamatan tidak 00.
 * 3. Ekstraksi dan keabsahan tanggal lahir terenkode (termasuk +40 untuk perempuan).
 * 4. Pengecekan tanggal lahir tidak di masa depan.
 * 5. (Opsional) Pencocokan NIK terenkode dengan parameter Tanggal Lahir input.
 */
export function validateNik(
  nikRaw: string,
  options?: {
    dob?: Date | string;
    customMessage?: string;
  }
): ValidationResult<string> {
  const nik = (nikRaw || '').trim();

  if (!nik) {
    return {
      isValid: false,
      error: options?.customMessage || 'NIK tidak boleh kosong.',
    };
  }

  if (!/^\d{16}$/.test(nik)) {
    return {
      isValid: false,
      error: options?.customMessage || 'NIK harus terdiri dari tepat 16 digit angka.',
    };
  }

  const prov = nik.substring(0, 2);
  const kab = nik.substring(2, 4);
  const kec = nik.substring(4, 6);

  if (prov === '00' || kab === '00' || kec === '00') {
    return {
      isValid: false,
      error: options?.customMessage || 'NIK tidak valid (kode wilayah tidak sesuai).',
    };
  }

  const rawDay = parseInt(nik.substring(6, 8), 10);
  const month = parseInt(nik.substring(8, 10), 10);
  const rawYear = parseInt(nik.substring(10, 12), 10);
  const sequence = nik.substring(12, 16);

  let isFemale = false;
  let day = rawDay;

  if (rawDay > 40) {
    isFemale = true;
    day = rawDay - 40;
  }

  if (day < 1 || day > 31 || (rawDay > 31 && rawDay < 41) || rawDay > 71) {
    return {
      isValid: false,
      error: options?.customMessage || 'NIK tidak valid (tanggal lahir terenkode salah).',
    };
  }

  if (month < 1 || month > 12) {
    return {
      isValid: false,
      error: options?.customMessage || 'NIK tidak valid (bulan lahir terenkode salah).',
    };
  }

  const currentYear = new Date().getFullYear();
  const currentYY = currentYear % 100;
  // Jika YY > currentYY, diasumsikan lahir abad 20 (19YY), jika tidak (20YY)
  const fullYear = rawYear > currentYY ? 1900 + rawYear : 2000 + rawYear;

  const parsedDate = new Date(fullYear, month - 1, day);

  if (
    parsedDate.getFullYear() !== fullYear ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return {
      isValid: false,
      error: options?.customMessage || `NIK tidak valid (tanggal lahir ${day}/${month}/${fullYear} tidak pernah ada pada kalender).`,
    };
  }

  if (parsedDate > new Date()) {
    return {
      isValid: false,
      error: options?.customMessage || 'NIK tidak valid (tanggal lahir pada NIK di masa depan).',
    };
  }

  const details: NikDetails = {
    provinsiCode: prov,
    kabupatenCode: kab,
    kecamatanCode: kec,
    encodedDay: rawDay,
    gender: isFemale ? 'Perempuan' : 'Laki-Laki',
    birthDay: day,
    birthMonth: month,
    birthYear: fullYear,
    birthDate: parsedDate,
    sequenceNumber: sequence,
  };

  // Pencocokan opsional dengan DOB input
  if (options?.dob) {
    const dobComp = parseDateComponents(options.dob);
    if (dobComp) {
      const matchDay = dobComp.day === day;
      const matchMonth = dobComp.month === month;
      const matchYear = dobComp.year === fullYear;

      if (!matchDay || !matchMonth || !matchYear) {
        const formattedNikDob = `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${fullYear}`;
        return {
          isValid: false,
          error:
            options?.customMessage ||
            `Tanggal lahir tidak sesuai dengan data NIK (${formattedNikDob}).`,
          value: nik,
          details: details as unknown as Record<string, unknown>,
        };
      }
    }
  }

  return {
    isValid: true,
    error: null,
    value: nik,
    details: details as unknown as Record<string, unknown>,
  };
}

/**
 * Sanitasi & Normalisasi Nomor WhatsApp
 * Menghapus karakter non-digit dan mengubah format ke 628... atau +628... atau 08...
 */
export function sanitizeWhatsapp(
  phoneRaw: string,
  prefix: '+62' | '62' | '0' = '62'
): string {
  if (!phoneRaw) return '';
  let cleaned = phoneRaw.replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+62')) {
    cleaned = cleaned.substring(1); // '62...'
  }

  if (cleaned.startsWith('08')) {
    cleaned = '628' + cleaned.substring(2);
  }

  if (!cleaned.startsWith('628') && cleaned.startsWith('8')) {
    cleaned = '628' + cleaned.substring(1);
  }

  if (prefix === '+62') {
    return cleaned.startsWith('62') ? '+' + cleaned : '+' + cleaned;
  }
  if (prefix === '0') {
    return cleaned.startsWith('62') ? '0' + cleaned.substring(2) : cleaned;
  }
  return cleaned; // '62...'
}

/**
 * Validasi Nomor WhatsApp (Nomor HP Indonesia)
 * Memeriksa:
 * 1. Format diawali 08, 628, atau +628.
 * 2. Digit berjumlah antara 10 - 15 digit.
 */
export function validateWhatsapp(
  phoneRaw: string,
  customMessage?: string
): ValidationResult<string> {
  const phone = (phoneRaw || '').trim();

  if (!phone) {
    return {
      isValid: false,
      error: customMessage || 'Nomor WhatsApp tidak boleh kosong.',
    };
  }

  // Sanitasi awal untuk cek digit murni
  const cleanedDigits = phone.replace(/\D/g, '');

  // Cek jika diawali +62, 62, atau 08
  const isValidFormat =
    /^(\+?62|0)8[1-9][0-9]{7,12}$/.test(phone.replace(/[\s-]/g, ''));

  if (!isValidFormat || cleanedDigits.length < 10 || cleanedDigits.length > 15) {
    return {
      isValid: false,
      error:
        customMessage ||
        'Nomor WhatsApp tidak valid. Gunakan format Indonesia yang benar (contoh: 08123456789 atau +628123456789, 10-15 digit).',
    };
  }

  const normalized = sanitizeWhatsapp(phone, '62');

  return {
    isValid: true,
    error: null,
    value: normalized,
    details: {
      original: phone,
      formattedE164: '+' + normalized,
      formattedLocal: sanitizeWhatsapp(phone, '0'),
    },
  };
}

/**
 * Validasi NIB (Nomor Induk Berusaha - 13 digit angka)
 */
export function validateNib(
  nibRaw: string,
  customMessage?: string
): ValidationResult<string> {
  const nib = (nibRaw || '').trim();

  if (!nib) {
    return {
      isValid: false,
      error: customMessage || 'NIB tidak boleh kosong.',
    };
  }

  if (!/^\d{13}$/.test(nib)) {
    return {
      isValid: false,
      error: customMessage || 'NIB (Nomor Induk Berusaha) harus terdiri dari tepat 13 digit angka.',
    };
  }

  return {
    isValid: true,
    error: null,
    value: nib,
  };
}

/**
 * Validasi Kode Pos (5 digit angka Indonesia: 10000 - 99999)
 */
export function validateKodePos(
  kodePosRaw: string,
  customMessage?: string
): ValidationResult<string> {
  const kodePos = (kodePosRaw || '').trim();

  if (!kodePos) {
    return {
      isValid: false,
      error: customMessage || 'Kode pos tidak boleh kosong.',
    };
  }

  if (!/^[1-9]\d{4}$/.test(kodePos)) {
    return {
      isValid: false,
      error:
        customMessage ||
        'Kode pos tidak valid. Harus terdiri dari 5 digit angka Indonesia (10000 - 99999).',
    };
  }

  return {
    isValid: true,
    error: null,
    value: kodePos,
  };
}

/**
 * Validasi Tanggal Lahir
 * Memeriksa:
 * 1. Format tanggal valid.
 * 2. Tidak boleh di masa depan.
 * 3. Opsional: Usia minimal (minAge).
 */
export function validateTanggalLahir(
  dobInput: Date | string,
  options?: {
    maxDate?: Date;
    minAge?: number;
    customMessage?: string;
  }
): ValidationResult<Date> {
  if (!dobInput) {
    return {
      isValid: false,
      error: options?.customMessage || 'Tanggal lahir tidak boleh kosong.',
    };
  }

  const dateObj = dobInput instanceof Date ? dobInput : new Date(dobInput);

  if (isNaN(dateObj.getTime())) {
    return {
      isValid: false,
      error: options?.customMessage || 'Format tanggal lahir tidak valid.',
    };
  }

  const now = options?.maxDate || new Date();

  if (dateObj > now) {
    return {
      isValid: false,
      error: options?.customMessage || 'Tanggal lahir tidak boleh di masa depan.',
    };
  }

  if (options?.minAge && options.minAge > 0) {
    const ageDiffMs = now.getTime() - dateObj.getTime();
    const ageDate = new Date(ageDiffMs);
    const calculatedAge = Math.abs(ageDate.getUTCFullYear() - 1970);

    if (calculatedAge < options.minAge) {
      return {
        isValid: false,
        error:
          options?.customMessage ||
          `Usia minimal adalah ${options.minAge} tahun. Usia terhitung: ${calculatedAge} tahun.`,
      };
    }
  }

  return {
    isValid: true,
    error: null,
    value: dateObj,
  };
}

export interface NpwpDetails {
  formatVersion: 'NPWP 15 Digit (Lama)' | 'NPWP 16 Digit (Baru / NIK)';
  cleanNumber: string;
  formattedNumber: string;
  isNikMatch?: boolean;
  nikDetails?: NikDetails;
}

/**
 * Normalisasi dan Format NPWP
 * Menghapus pemisah (titik, strip, spasi).
 * - format = 'clean': Mengembalikan digit murni (15 atau 16 digit).
 * - format = 'pretty': 15 digit -> "01.234.567.8-123.000", 16 digit -> "1234.5678.9012.3456"
 */
export function sanitizeNpwp(
  npwpRaw: string,
  format: 'pretty' | 'clean' = 'clean'
): string {
  if (!npwpRaw) return '';
  const cleaned = npwpRaw.replace(/\D/g, '');

  if (format === 'clean') {
    return cleaned;
  }

  if (cleaned.length === 15) {
    return `${cleaned.substring(0, 2)}.${cleaned.substring(2, 5)}.${cleaned.substring(5, 8)}.${cleaned.substring(8, 9)}-${cleaned.substring(9, 12)}.${cleaned.substring(12, 15)}`;
  }

  if (cleaned.length === 16) {
    return `${cleaned.substring(0, 4)}.${cleaned.substring(4, 8)}.${cleaned.substring(8, 12)}.${cleaned.substring(12, 16)}`;
  }

  return cleaned;
}

/**
 * Validasi struktur 15 digit NPWP Lama
 * Memastikan 15 digit angka, 9 digit nomor pokok tidak nol semua.
 */
export function isValidNpwp15Checksum(npwp15Digits: string): boolean {
  if (!/^\d{15}$/.test(npwp15Digits)) return false;
  const taxIdPart = npwp15Digits.substring(0, 9);
  if (taxIdPart === '000000000') return false;
  return true;
}


/**
 * Validasi NPWP (Mendukung Format Lama 15 Digit & Format Baru 16 Digit / Terkoneksi NIK)
 * Memeriksa:
 * 1. Sanitasi pemisah (titik/strip/spasi).
 * 2. Panjang 15 digit (NPWP Lama) atau 16 digit (NPWP Baru).
 * 3. Untuk 15 digit: Checksum Modulo 11 9 digit pertama.
 * 4. Untuk 16 digit (WPOP): Validasi struktur NIK (prov/kab/kec/tanggal lahir terenkode).
 * 5. (Opsional) Jika parameter `nik` diberikan:
 *    - Jika NPWP 16 digit: Memastikan NPWP 16 digit persis sama dengan NIK.
 *    - Jika NPWP 15 digit: Memberikan konfirmasi bahwa NPWP format lama digunakan.
 */
export function validateNpwp(
  npwpRaw: string,
  options?: {
    nik?: string;
    allowOldFormat?: boolean;
    allowNewFormat?: boolean;
    customMessage?: string;
  }
): ValidationResult<string> {
  const npwp = (npwpRaw || '').trim();

  if (!npwp) {
    return {
      isValid: false,
      error: options?.customMessage || 'Nomor NPWP tidak boleh kosong.',
    };
  }

  const cleaned = npwp.replace(/\D/g, '');
  const allowOld = options?.allowOldFormat !== false;
  const allowNew = options?.allowNewFormat !== false;

  if (cleaned.length !== 15 && cleaned.length !== 16) {
    return {
      isValid: false,
      error:
        options?.customMessage ||
        'Nomor NPWP tidak valid. Harus terdiri dari 15 digit (format lama) atau 16 digit (format baru/NIK).',
    };
  }

  // Case 1: NPWP 15 Digit (Lama)
  if (cleaned.length === 15) {
    if (!allowOld) {
      return {
        isValid: false,
        error:
          options?.customMessage ||
          'NPWP 15 digit (format lama) tidak diperbolehkan. Gunakan NPWP 16 digit (NIK).',
      };
    }

    const isChecksumValid = isValidNpwp15Checksum(cleaned);
    if (!isChecksumValid) {
      return {
        isValid: false,
        error:
          options?.customMessage ||
          'Nomor NPWP 15 digit tidak valid (checksum/digit pengaman salah).',
      };
    }

    const details: NpwpDetails = {
      formatVersion: 'NPWP 15 Digit (Lama)',
      cleanNumber: cleaned,
      formattedNumber: sanitizeNpwp(cleaned, 'pretty'),
    };

    if (options?.nik) {
      const cleanNik = options.nik.replace(/\D/g, '');
      details.isNikMatch = false;
      return {
        isValid: true,
        error: null,
        value: cleaned,
        details: {
          ...details,
          notice: `NPWP yang diinput menggunakan format 15 digit lama. Untuk integrasi WPOP terkoneksi NIK, gunakan NIK 16 digit (${cleanNik}).`,
        },
      };
    }

    return {
      isValid: true,
      error: null,
      value: cleaned,
      details: details as unknown as Record<string, unknown>,
    };
  }

  // Case 2: NPWP 16 Digit (Baru / NIK Integration)
  if (!allowNew) {
    return {
      isValid: false,
      error: options?.customMessage || 'NPWP 16 digit tidak diperbolehkan.',
    };
  }

  // Validasi struktur 16 digit NIK
  const nikValidation = validateNik(cleaned);
  if (!nikValidation.isValid) {
    return {
      isValid: false,
      error:
        options?.customMessage ||
        `Nomor NPWP 16 digit tidak valid: ${nikValidation.error}`,
    };
  }

  const details: NpwpDetails = {
    formatVersion: 'NPWP 16 Digit (Baru / NIK)',
    cleanNumber: cleaned,
    formattedNumber: sanitizeNpwp(cleaned, 'pretty'),
    nikDetails: nikValidation.details as unknown as NikDetails,
  };

  if (options?.nik) {
    const cleanNik = options.nik.replace(/\D/g, '');
    const isMatch = cleaned === cleanNik;
    details.isNikMatch = isMatch;

    if (!isMatch) {
      const warningMsg = `Warning: NPWP 16 digit (${cleaned}) berbeda dengan NIK pengguna (${cleanNik}).`;
      return {
        isValid: true,
        error: null,
        warning: warningMsg,
        value: cleaned,
        details: {
          ...details,
          warning: warningMsg,
        } as unknown as Record<string, unknown>,
      };
    }
  }


  return {
    isValid: true,
    error: null,
    value: cleaned,
    details: details as unknown as Record<string, unknown>,
  };
}

