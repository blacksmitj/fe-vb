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
  const dateObj = new Date(val);
  if (isNaN(dateObj.getTime())) return String(val);

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
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
