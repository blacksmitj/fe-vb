/**
 * Safely parse a date string or Date object in a cross-browser compatible way,
 * specifically handling Safari/Apple WebKit quirks.
 */
export function safeParseDate(val: string | Date | number | undefined | null): Date | null {
  if (!val) return null;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }
  if (typeof val === "number") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }

  const str = String(val).trim();
  if (!str) return null;

  // Try standard parsing first
  let date = new Date(str);
  if (!isNaN(date.getTime())) {
    return date;
  }

  // Apple/Safari fix:
  // 1. Convert "YYYY-MM-DD HH:mm:ss" -> "YYYY-MM-DDTHH:mm:ss"
  let formattedStr = str;
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(formattedStr)) {
    formattedStr = formattedStr.replace(/\s+/, "T");
    date = new Date(formattedStr);
    if (!isNaN(date.getTime())) return date;
  }

  // 2. Replace all dashes with slashes if there's no T separator (Safari prefers "YYYY/MM/DD")
  // e.g. "2023-10-27" -> "2023/10/27" or "2023-10-27 15:30:00" -> "2023/10/27 15:30:00"
  if (!formattedStr.includes("T")) {
    const withSlashes = formattedStr.replace(/-/g, "/");
    date = new Date(withSlashes);
    if (!isNaN(date.getTime())) return date;
  }

  // 3. Handle DD/MM/YYYY or DD-MM-YYYY (Indonesian common formats)
  const dmyMatch = formattedStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (dmyMatch) {
    const [_, d, m, y, hr, min, sec] = dmyMatch;
    const year = y;
    const month = m.padStart(2, "0");
    const day = d.padStart(2, "0");
    const hours = (hr || "00").padStart(2, "0");
    const minutes = (min || "00").padStart(2, "0");
    const seconds = (sec || "00").padStart(2, "0");
    
    // Construct ISO string
    date = new Date(`${year}-${month}-${day}T${hours}:${minutes}:${seconds}`);
    if (!isNaN(date.getTime())) return date;
  }

  return null;
}

/**
 * Format a date value into a localized string.
 *
 * @param val       - Raw date value (string, Date, or undefined)
 * @param mode      - 'date-only' shows day/month/year; 'date-time' also shows hours & minutes
 * @param locale    - 'id' for Indonesian (id-ID), 'en' for English (en-US)
 * @returns         Formatted date string, or empty string if val is empty/invalid
 */
export function formatLocalDate(
  val: string | Date | undefined,
  mode: "date-only" | "date-time" = "date-only",
  locale: "id" | "en" = "id"
): string {
  if (!val) return "";
  const dateObj = safeParseDate(val);
  if (!dateObj) return String(val);

  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  };

  if (mode === "date-time") {
    options.hour = "2-digit";
    options.minute = "2-digit";
  }

  const localeStr = locale === "en" ? "en-US" : "id-ID";
  return dateObj.toLocaleDateString(localeStr, options);
}

/**
 * Format a date string for use in list/table displays (short format).
 * Uses Indonesian locale with 2-digit day, short month, year + time.
 *
 * @param dateString - ISO date string
 * @returns          Short formatted date string
 */
export function formatShortDate(dateString: string): string {
  const dateObj = safeParseDate(dateString);
  if (!dateObj) return dateString;
  return dateObj.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

