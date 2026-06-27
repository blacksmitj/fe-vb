"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FieldInputProps } from "../shared";

/** Renders a "text" or "textarea" field — editable or read-only preview */
export function TextPreview({ field, sampleRow, onUpdateField }: FieldInputProps) {
  const sampleValue = sampleRow?.[field.label];
  const hasValue =
    (field.value !== undefined && field.value !== "") ||
    (sampleValue !== undefined && sampleValue !== null && String(sampleValue) !== "");
  const textVal = hasValue
    ? field.value !== undefined && field.value !== ""
      ? field.value
      : String(sampleValue)
    : field.placeholder || "Belum diisi";

  if (field.type === "textarea") {
    if (field.isEditable) {
      return (
        <Textarea
          placeholder={field.placeholder || "Enter details..."}
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
              ? "bg-muted cursor-not-allowed min-h-[50px] text-xs px-2 py-1"
              : "min-h-[50px] text-xs px-2 py-1"
          }
        />
      );
    }
    return (
      <div className="min-h-[50px] py-1 px-2.5 bg-muted/40 border border-border/50 rounded-lg text-xs select-all whitespace-pre-wrap">
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

  // type === "text"
  if (field.isEditable) {
    return (
      <Input
        placeholder={field.placeholder || "Enter text..."}
        value={
          field.value !== undefined && field.value !== ""
            ? field.value
            : sampleValue !== undefined && sampleValue !== null
            ? String(sampleValue)
            : ""
        }
        disabled={field.locked}
        onChange={(e) => onUpdateField({ ...field, value: e.target.value })}
        className={field.locked ? "bg-muted cursor-not-allowed h-7 text-xs px-2" : "h-7 text-xs px-2"}
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
