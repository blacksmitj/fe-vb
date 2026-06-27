import { Field, FieldType } from "../../types";

// ── Shared color map for dropdown options ────────────────────────────────────
export const dropdownColorMap: Record<string, string> = {
  gray: "bg-slate-400 dark:bg-slate-500",
  green: "bg-emerald-500",
  yellow: "bg-amber-500",
  red: "bg-red-500",
  blue: "bg-sky-500",
  purple: "bg-violet-500",
};

// ── Props shared by all preview/input sub-components ────────────────────────
export interface FieldInputProps {
  field: Field;
  sampleRow?: Record<string, any>;
  onUpdateField: (updatedField: Field) => void;
}

// ── Props for the full field renderer ───────────────────────────────────────
export interface FieldRendererProps {
  field: Field;
  index: number;
  column: "left" | "right";
  sectionId: string;
  onUpdateField: (updatedField: Field) => void;
  onDeleteField: (fieldId: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onMoveColumn?: (column: "left" | "right") => void;
  isFirst?: boolean;
  isLast?: boolean;
  showColumnMove?: boolean;
  sampleRow?: Record<string, any>;
  isOverlay?: boolean;
}

// ── Helper: get display icon per field type (string key, resolved in renderer)
export type FieldIconKey = FieldType;
