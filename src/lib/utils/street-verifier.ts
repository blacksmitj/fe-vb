/**
 * Module Verifikasi & Formatting Alamat Jalan
 */

// Regex untuk mendeteksi angka romawi (I, V, X, L, C, D, M) baik sendiri maupun kombinasi
const ROMAN_REGEX = /^(m{0,4})(cm|cd|d?c{0,3})(xc|xl|l?x{0,3})(ix|iv|v?i{0,3})$/i;

// Daftar singkatan yang wajib memiliki titik (Blok tidak ada di sini)
const ABBREVIATIONS = ["no", "komp", "jl", "jln", "gg", "kav"];

export interface ParsedAddress {
  /** Alamat utama yang sudah diformat Title Case tanpa RT/RW */
  mainAddr: string;
  /** Nilai RT 3 digit (contoh: "001" atau "000") */
  rt: string;
  /** Nilai RW 3 digit (contoh: "005" atau "000") */
  rw: string;
  /** Alamat lengkap terformat: "mainAddr RT. xxx RW. yyy" */
  formattedAddress: string;
}

/**
 * Mengubah string alamat menjadi format Title Case sesuai aturan penulisan alamat Indonesia:
 * 1. Menghapus seluruh tanda koma (,)
 * 2. Mengubah kata "Jalan" -> "Jl."
 * 3. Menghapus titik pada kata "Blok" ("Blok." -> "Blok")
 * 4. Normalisasi singkatan (no., komp., jl., jln., gg., kav.)
 * 5. Mempertahankan ANGKA ROMAWI dalam HURUF KAPITAL (misal: XV, IV, XII)
 * 6. Mengatur spasi setelah tanda titik (.)
 */
export function toTitleCase(str: string): string {
  if (!str) return "";

  // 0. Hapus semua koma (,) dan ganti dengan spasi jika tidak dipisahkan spasi
  str = str.replace(/,/g, " ");

  // 1. SEBELUM PROSES: Hapus semua titik yang menempel di belakang kata "Blok"
  // Contoh: "Blok. A" atau "Blok... A" -> "Blok A"
  str = str.replace(/\bblok\.+/gi, "Blok");

  // 2. Bersihkan titik ganda (.. atau ...) pada kata lain menjadi satu titik saja
  str = str.replace(/\.{2,}/g, ".");

  // 3. Ubah kata "Jalan" menjadi "Jl.", sedangkan "Jln" dibiarkan tetap "Jln"
  str = str.replace(/\bjalan\b/gi, "Jl.");

  // 4. Pisahkan titik yang menempel dengan huruf/angka agar menjadi kata terpisah
  str = str.replace(/\.([a-zA-Z0-9])/g, ". $1");

  // 5. Pecah teks berdasarkan spasi dan proses per kata
  const words = str
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const cleanWord = word.replace(/[^a-zA-Z0-9]/g, "");

      // Jika angka Romawi, jadikan HURUF BESAR SEMUA
      if (cleanWord.length > 0 && ROMAN_REGEX.test(cleanWord)) {
        return word.toUpperCase();
      }

      // Ubah kata biasa menjadi Title Case
      let processedWord = word.charAt(0).toUpperCase() + word.slice(1);

      // Jika masuk daftar singkatan, pastikan diakhiri titik (kecuali jika kata berupa angka murni)
      if (ABBREVIATIONS.includes(cleanWord) && !/^\d+$/.test(cleanWord)) {
        if (!processedWord.endsWith(".")) {
          processedWord = processedWord + ".";
        }
      }

      return processedWord;
    })
    .join(" ");

  // 6. SETELAH PROSES: Pastikan kembali hanya ada tepat satu spasi setelah tanda titik (.)
  let result = words.replace(/\.\s+/g, ". ");

  // Pembersihan akhir untuk memastikan tidak ada titik ganda atau titik di kata Blok yang lolos
  result = result.replace(/\bBlok\.+/gi, "Blok");
  result = result.replace(/\.{2,}/g, ".");

  // 7. Bersihkan titik yang menempel langsung setelah angka di pola "No. xx." -> "No. xx"
  result = result.replace(/\b(No\.\s*[0-9]+)\./gi, "$1");

  // Rapikan spasi ganda
  result = result.replace(/\s{2,}/g, " ").trim();

  return result;
}

/**
 * Mendeteksi & mengabstraksi RT, RW, serta memformat alamat utama secara lengkap
 */
export function parseAndFormatAddress(rawAddress: string): ParsedAddress {
  const trimmedRaw = (rawAddress || "").trim();

  if (!trimmedRaw) {
    return {
      mainAddr: "",
      rt: "000",
      rw: "000",
      formattedAddress: "",
    };
  }

  let rt = "000";
  let rw = "000";

  // 1. Cek format kombinasi RT/RW 009/002 atau RT/RW 9/2
  const rtrwCombinedMatch = trimmedRaw.match(
    /(?:RT[\/\s]*RW|RT\s*[\/]\s*RW)\.?\s*([0-9]+)\s*[\/\-]\s*([0-9]+)/i
  );

  if (rtrwCombinedMatch) {
    rt = ("000" + rtrwCombinedMatch[1]).slice(-3);
    rw = ("000" + rtrwCombinedMatch[2]).slice(-3);
  } else {
    const rtMatch = trimmedRaw.match(/\bRT\.?\s*([0-9]+)/i);
    const rwMatch = trimmedRaw.match(/\bRW\.?\s*([0-9]+)/i);

    if (rtMatch) {
      rt = ("000" + rtMatch[1]).slice(-3);
    }
    if (rwMatch) {
      rw = ("000" + rwMatch[1]).slice(-3);
    }
  }

  let mainAddr = trimmedRaw;
  mainAddr = mainAddr.replace(
    /,?\s*(?:RT|RW|RT\/RW|RW\/RT)\.?\s*[0-9\-]+(?:\s*[\/]\s*[0-9\-]+)?/gi,
    ""
  );
  mainAddr = mainAddr.replace(/,?\s*[0-9]{3}\/[0-9]{3}/g, "");
  mainAddr = mainAddr.replace(/,?\s*rt\s*[0-9]+\s*rw\s*[0-9]+/gi, "");
  mainAddr = mainAddr.replace(/,?\s*rt\s*[0-9]+/gi, "");
  mainAddr = mainAddr.replace(/,?\s*rw\s*[0-9]+/gi, "");

  mainAddr = mainAddr.replace(/^[\s,\/]+|[\s,\/]+$/g, "").trim();

  // Ubah alamat utama menjadi Title Case
  mainAddr = toTitleCase(mainAddr);

  const formattedAddress = `${mainAddr} RT. ${rt} RW. ${rw}`.trim();

  return {
    mainAddr,
    rt,
    rw,
    formattedAddress,
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Memvalidasi apakah alamat memenuhi standar:
 * 1. Tidak boleh kosong
 * 2. Harus sudah diformat / sesuai standar title case (jika belum, sarankan Magic Wand)
 * Note: RT. 000 RW. 000 adalah VALID jika alamat tidak memiliki RT/RW.
 */
export function validateStreetAddress(
  rawAddress: string,
  isFormatted: boolean = false
): ValidationResult {
  const errors: string[] = [];
  const trimmed = (rawAddress || "").trim();

  if (!trimmed) {
    return {
      isValid: false,
      errors: ["Alamat tidak boleh kosong."],
    };
  }

  const parsed = parseAndFormatAddress(trimmed);

  // Cek apakah RT/RW jika tertulis di input awal belum 3 digit
  const rtMatch = trimmed.match(/\bRT\.?\s*([0-9]+)/i);
  const rwMatch = trimmed.match(/\bRW\.?\s*([0-9]+)/i);
  const hasValidRtDigits = !rtMatch || rtMatch[1].length === 3;
  const hasValidRwDigits = !rwMatch || rwMatch[1].length === 3;

  // Cek: Teks belum diformat / belum sesuai standar Magic Wand (Kecuali jika full CAPITAL dan RT/RW sudah 3 digit)
  const isFullUppercase = trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed);
  if (!isFormatted && (!isFullUppercase || !hasValidRtDigits || !hasValidRwDigits) && trimmed !== parsed.formattedAddress) {
    errors.push("Format alamat belum sesuai standar. Klik tombol Magic Wand untuk memformat.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
