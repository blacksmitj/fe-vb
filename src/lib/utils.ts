import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Shared Utilities ────────────────────────────────────────────────────────
export { formatLocalDate, formatShortDate } from "./utils/format-date";
export { parseArrayPills } from "./utils/parse-array-pills";
