"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { FieldInputProps } from "../shared";

/** Renders a "number" field — editable input or read-only monospace display */
export function NumberPreview({ field, sampleRow, onUpdateField }: FieldInputProps) {
  const sampleValue = sampleRow?.[field.label];
  const hasValue =
    (field.value !== undefined && field.value !== "") ||
    (sampleValue !== undefined && sampleValue !== null && String(sampleValue) !== "");
  const textVal = hasValue
    ? field.value !== undefined && field.value !== ""
      ? field.value
      : String(sampleValue)
    : field.placeholder || "Belum diisi";

  if (field.isEditable) {
    return (
      <Input
        type="number"
        placeholder={field.placeholder || "Enter number..."}
        value={
          field.value !== undefined && field.value !== ""
            ? field.value
            : sampleValue !== undefined && sampleValue !== null
            ? String(sampleValue)
            : ""
        }
        disabled={field.locked}
        onChange={(e) => onUpdateField({ ...field, value: e.target.value })}
        className={
          field.locked
            ? "bg-muted cursor-not-allowed font-mono h-7 text-xs px-2"
            : "font-mono h-7 text-xs px-2"
        }
      />
    );
  }
  return (
    <div
      className={`min-h-7 flex items-center py-1 px-2.5 bg-muted/40 border border-border/50 rounded-lg text-xs select-all font-mono font-medium ${
        hasValue ? "text-foreground/80" : "text-muted-foreground/50 italic"
      }`}
    >
      {textVal}
    </div>
  );
}
