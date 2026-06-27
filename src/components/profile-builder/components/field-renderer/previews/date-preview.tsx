"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Calendar } from "lucide-react";
import { formatLocalDate } from "@/lib/utils";
import { FieldInputProps } from "../shared";

/** Renders a "date" field — date/datetime picker or formatted read-only display */
export function DatePreview({ field, sampleRow, onUpdateField }: FieldInputProps) {
  const sampleValue = sampleRow?.[field.label];
  const rawDateVal =
    field.value !== undefined && field.value !== ""
      ? field.value
      : sampleValue !== undefined && sampleValue !== null
      ? String(sampleValue)
      : "";
  const formattedDateStr = formatLocalDate(rawDateVal, field.dateMode, field.dateLocale);

  if (field.isEditable) {
    return (
      <div className="space-y-1 w-full">
        <Input
          type={field.dateMode === "date-time" ? "datetime-local" : "date"}
          value={field.value || ""}
          disabled={field.locked}
          onChange={(e) => onUpdateField({ ...field, value: e.target.value })}
          className={field.locked ? "bg-muted cursor-not-allowed h-7 text-xs px-2" : "h-7 text-xs px-2"}
        />
        {formattedDateStr && (
          <div className="text-[9px] text-muted-foreground flex items-center gap-1 px-0.5">
            <span className="font-semibold text-foreground/70">Formatted:</span>
            <span className="font-medium bg-secondary/80 px-1 py-0 rounded text-secondary-foreground border border-border/40">
              {formattedDateStr}
            </span>
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="min-h-7 py-1 px-2.5 bg-muted/40 border border-border/50 rounded-lg text-xs select-all flex items-center gap-1.5">
      <Calendar className="h-3.5 w-3.5 text-muted-foreground/75" />
      <span className="text-foreground/80 font-medium font-sans">
        {formattedDateStr || "Belum ada tanggal"}
      </span>
    </div>
  );
}
