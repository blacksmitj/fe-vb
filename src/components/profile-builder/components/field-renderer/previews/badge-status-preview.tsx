"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FieldInputProps } from "../shared";

function getBadgeStyle(style?: string): string {
  switch (style) {
    case "success": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    case "warning": return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    case "danger":  return "bg-red-500/10 text-red-600 border-red-500/20";
    case "info":    return "bg-sky-500/10 text-sky-600 border-sky-500/20";
    default:        return "bg-slate-500/10 text-slate-600 border-slate-500/20";
  }
}

function getDotStyle(style?: string): string {
  switch (style) {
    case "success": return "bg-emerald-500";
    case "warning": return "bg-amber-500";
    case "danger":  return "bg-red-500";
    case "info":    return "bg-sky-500";
    default:        return "bg-slate-500";
  }
}

/** Renders a "badge-status" field — editable text input or styled badge */
export function BadgeStatusPreview({ field, sampleRow, onUpdateField }: FieldInputProps) {
  const sampleValue = sampleRow?.[field.label];
  const statusText =
    field.value !== undefined && field.value !== ""
      ? field.value
      : sampleValue !== undefined && sampleValue !== null
      ? String(sampleValue)
      : "Pending";

  if (field.isEditable) {
    return (
      <Input
        placeholder={field.placeholder || "Enter status text..."}
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
    <div className="flex items-center py-0.5">
      <Badge
        variant="outline"
        className={`px-2 py-0.5 flex items-center gap-1 text-[10px] font-semibold rounded-full border ${getBadgeStyle(field.statusStyle)}`}
      >
        <span className={`h-1 w-1 rounded-full ${getDotStyle(field.statusStyle)}`} />
        {statusText}
      </Badge>
    </div>
  );
}
