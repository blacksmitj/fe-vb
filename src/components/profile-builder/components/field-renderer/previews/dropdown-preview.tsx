"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { SearchableCombobox } from "../searchable-combobox";
import { dropdownColorMap, FieldInputProps } from "../shared";

/** Renders a "dropdown" field — searchable combobox or read-only display */
export function DropdownPreview({ field, sampleRow, onUpdateField }: FieldInputProps) {
  const sampleValue = sampleRow?.[field.label];
  const dropdownVal =
    field.value !== undefined && field.value !== ""
      ? field.value
      : sampleValue !== undefined && sampleValue !== null
      ? String(sampleValue)
      : "";
  const selectOptions = field.options || [];
  const selectedColorKey = field.optionColors?.[dropdownVal];
  const selectedDotClass = selectedColorKey ? dropdownColorMap[selectedColorKey] : undefined;

  if (field.isEditable) {
    return (
      <SearchableCombobox
        value={dropdownVal}
        options={selectOptions}
        optionColors={field.optionColors}
        placeholder={field.placeholder}
        onValueChange={(val) => onUpdateField({ ...field, value: val })}
        disabled={field.locked}
      />
    );
  }

  const hasValue = dropdownVal !== "";
  const textVal = hasValue ? dropdownVal : field.placeholder || "Belum diisi";
  return (
    <div className="min-h-7 flex items-center py-1 px-2.5 bg-muted/40 border border-border/50 rounded-lg text-xs select-all gap-2">
      {hasValue && selectedDotClass && (
        <span className={cn("h-2 w-2 rounded-full shrink-0", selectedDotClass)} />
      )}
      <span
        className={`tracking-tight font-medium ${
          hasValue ? "text-foreground/80" : "text-muted-foreground/50 italic"
        }`}
      >
        {textVal}
      </span>
    </div>
  );
}
