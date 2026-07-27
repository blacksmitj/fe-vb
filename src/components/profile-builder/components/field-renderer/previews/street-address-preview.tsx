"use client";

import React from "react";
import { StreetAddressInput } from "@/components/ui/street-address-input";
import { FieldInputProps } from "../shared";

/** Renders a "street-address" field with Magic Wand support */
export function StreetAddressPreview({ field, sampleRow, onUpdateField }: FieldInputProps) {
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
      <StreetAddressInput
        placeholder={field.placeholder || "Masukkan nama jalan, no, blok, RT/RW..."}
        value={
          field.value !== undefined && field.value !== ""
            ? field.value
            : sampleValue !== undefined && sampleValue !== null
            ? String(sampleValue)
            : ""
        }
        disabled={field.locked}
        onChange={(newValue) => onUpdateField({ ...field, value: newValue })}
        showHelperText={false}
      />
    );
  }

  return (
    <div className="min-h-7 flex items-center py-1 px-2.5 bg-muted/40 border border-border/50 rounded-lg text-xs select-all">
      <span
        className={`${field.previewFontMode === "mono" ? "font-mono " : ""}tracking-tight font-medium ${
          hasValue ? "text-foreground/80" : "text-muted-foreground/50 italic"
        }`}
      >
        {textVal}
      </span>
    </div>
  );
}
