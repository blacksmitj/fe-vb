"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { parseArrayPills } from "@/lib/utils";
import { FieldInputProps } from "../shared";

/** Renders an "array-pills" field — editable input or pill badges */
export function ArrayPillsPreview({ field, sampleRow, onUpdateField }: FieldInputProps) {
  const sampleValue = sampleRow?.[field.label];
  const splitChar = field.pillsSeparator || ",";
  const rawValue =
    field.value !== undefined && field.value !== "" ? field.value : sampleValue;
  const itemsList = parseArrayPills(rawValue, splitChar);

  if (field.isEditable) {
    const editableVal = Array.isArray(rawValue)
      ? rawValue.join(splitChar)
      : typeof rawValue === "string" &&
        rawValue.startsWith("[") &&
        rawValue.endsWith("]")
      ? parseArrayPills(rawValue, splitChar).join(splitChar)
      : rawValue !== undefined && rawValue !== null
      ? String(rawValue)
      : "";

    return (
      <Input
        placeholder={field.placeholder || `Enter items separated by "${splitChar}"...`}
        value={field.value !== undefined && field.value !== "" ? field.value : editableVal}
        disabled={field.locked}
        onChange={(e) => onUpdateField({ ...field, value: e.target.value })}
        className={field.locked ? "bg-muted cursor-not-allowed h-7 text-xs px-2" : "h-7 text-xs px-2"}
      />
    );
  }

  const finalItems = itemsList.length > 0 ? itemsList : ["Sample Item A", "Sample Item B"];
  return (
    <div className="flex flex-wrap gap-1 py-0.5">
      {finalItems.map((pillItem, idx) => (
        <Badge
          key={idx}
          variant="secondary"
          className="px-1.5 py-0 rounded-md text-[10px] font-semibold border border-border/40 bg-secondary/60 hover:bg-secondary/80 text-foreground/80 transition-colors select-none"
        >
          {pillItem}
        </Badge>
      ))}
      {finalItems.length === 0 && (
        <span className="text-[10px] italic text-muted-foreground">Empty list</span>
      )}
    </div>
  );
}
