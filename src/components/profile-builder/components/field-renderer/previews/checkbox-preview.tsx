"use client";

import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FieldInputProps } from "../shared";

/** Renders a "checkbox" field — interactive or read-only preview */
export function CheckboxPreview({ field, sampleRow, onUpdateField }: FieldInputProps) {
  const sampleValue = sampleRow?.[field.label];
  const checkboxVal =
    field.value !== undefined && field.value !== ""
      ? field.value
      : sampleValue !== undefined && sampleValue !== null
      ? String(sampleValue)
      : "false";

  if (field.isEditable) {
    const isChecked = checkboxVal === "true";
    return (
      <div className="flex items-center gap-2 py-1">
        <Checkbox
          id={`pb-checkbox-${field.id}`}
          checked={isChecked}
          disabled={field.locked}
          onCheckedChange={(checked) => {
            onUpdateField({ ...field, value: checked ? "true" : "false" });
          }}
        />
        <Label
          htmlFor={`pb-checkbox-${field.id}`}
          className="text-xs text-muted-foreground font-normal cursor-pointer select-none"
        >
          {field.placeholder || "Ceklis item ini"}
        </Label>
      </div>
    );
  }

  const isCheckedPreview =
    checkboxVal === "true" || sampleValue === true || sampleValue === "true";
  return (
    <div className="flex items-center gap-2 py-1 bg-muted/40 border border-border/50 rounded-lg px-2.5 min-h-7 w-full">
      <Checkbox checked={isCheckedPreview} disabled className="opacity-70" />
      <span
        className={`text-xs ${
          isCheckedPreview ? "text-foreground font-medium" : "text-muted-foreground/50 italic"
        }`}
      >
        {isCheckedPreview
          ? field.placeholder || "Terceklis"
          : field.placeholder || "Tidak terceklis"}
      </span>
    </div>
  );
}
