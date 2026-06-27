/**
 * Parse a raw value into an array of strings (for "array-pills" field type).
 *
 * Handles the following input formats:
 * - undefined / null / "" → []
 * - Array<any>            → each element stringified and trimmed
 * - JSON array string     → parsed, then each element stringified
 * - Plain delimited string → split by `sep`, trimmed, empty items removed
 *
 * @param val  - Raw value (from field.value or sampleRow)
 * @param sep  - Separator character (default: ",")
 * @returns    Array of non-empty strings
 */
export function parseArrayPills(val: unknown, sep: string = ","): string[] {
  if (val === undefined || val === null || val === "") return [];

  if (Array.isArray(val)) {
    return val.map((i) => String(i).trim()).filter(Boolean);
  }

  if (typeof val === "string") {
    const trimmed = val.trim();

    // Try JSON array format: ["a", "b", "c"]
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((i) => String(i).trim()).filter(Boolean);
        }
      } catch (_) {
        // fall through to plain string split
      }
    }

    return trimmed
      .split(sep)
      .map((i) => i.trim())
      .filter(Boolean);
  }

  return [String(val).trim()].filter(Boolean);
}
