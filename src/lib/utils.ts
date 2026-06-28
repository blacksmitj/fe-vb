import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export { formatLocalDate, formatShortDate, safeParseDate } from "./utils/format-date"
export { parseArrayPills } from "./utils/parse-array-pills"
