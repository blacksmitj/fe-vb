"use client";

import React, { useState } from "react";
import { Field } from "../../types";
import { Button } from "@/components/ui/button";
import { Lock, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { Type, AlignLeft, Link2, Hash, Calendar, Tag, Bookmark, List, CheckSquare } from "lucide-react";
import { FieldRendererProps } from "./shared";
import { FieldEditSheet } from "./edit-sheet";
import {
  TextPreview,
  NumberPreview,
  DatePreview,
  BadgeStatusPreview,
  ArrayPillsPreview,
  CheckboxPreview,
  DropdownPreview,
  MediaPreview,
} from "./previews";

function getFieldIcon(field: Field) {
  switch (field.type) {
    case "text":         return <Type className="h-4.5 w-4.5 text-primary" />;
    case "textarea":     return <AlignLeft className="h-4.5 w-4.5 text-primary" />;
    case "media":        return <Link2 className="h-4.5 w-4.5 text-indigo-500" />;
    case "number":       return <Hash className="h-4.5 w-4.5 text-orange-500" />;
    case "date":         return <Calendar className="h-4.5 w-4.5 text-blue-500" />;
    case "badge-status": return <Tag className="h-4.5 w-4.5 text-amber-500" />;
    case "array-pills":  return <Bookmark className="h-4.5 w-4.5 text-emerald-500" />;
    case "dropdown":     return <List className="h-4.5 w-4.5 text-indigo-500" />;
    case "checkbox":     return <CheckSquare className="h-4.5 w-4.5 text-emerald-500" />;
  }
}

function renderInput(field: Field, sampleRow: Record<string, any> | undefined, onUpdateField: (f: Field) => void) {
  const props = { field, sampleRow, onUpdateField };
  switch (field.type) {
    case "text":
    case "textarea":     return <TextPreview {...props} />;
    case "number":       return <NumberPreview {...props} />;
    case "date":         return <DatePreview {...props} />;
    case "badge-status": return <BadgeStatusPreview {...props} />;
    case "array-pills":  return <ArrayPillsPreview {...props} />;
    case "checkbox":     return <CheckboxPreview {...props} />;
    case "dropdown":     return <DropdownPreview {...props} />;
    case "media":        return <MediaPreview field={field} sampleRow={sampleRow} />;
    default:             return null;
  }
}

export default function ProfileBuilderFieldRenderer({
  field,
  index,
  column,
  sectionId,
  onUpdateField,
  onDeleteField,
  onMoveUp,
  onMoveDown,
  onMoveColumn,
  isFirst = false,
  isLast = false,
  showColumnMove = false,
  sampleRow,
  isOverlay = false,
  programHeaders,
}: FieldRendererProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Check if header exists in program spreadsheet (case-sensitive)
  const isHeaderMissing = React.useMemo(() => {
    if (!programHeaders) return false;
    return !programHeaders.includes(field.label);
  }, [programHeaders, field.label]);

  return (
    <div className="w-full">
      <div className="group/field relative flex items-start gap-1.5 rounded-lg border p-1 transition-all border-transparent hover:border-border/50 hover:bg-muted/5">

        {/* Move Controls */}
        {!isOverlay && !field.locked && (
          <div className="flex flex-col gap-0.5 mt-1.5 opacity-0 group-hover/field:opacity-100 transition-opacity z-10 shrink-0">
            <Button type="button" variant="ghost" size="icon"
              className="h-5 w-5 p-0 hover:bg-muted text-muted-foreground hover:text-foreground"
              disabled={isFirst} onClick={(e) => { e.stopPropagation(); onMoveUp?.(); }} title="Move Up"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="icon"
              className="h-5 w-5 p-0 hover:bg-muted text-muted-foreground hover:text-foreground"
              disabled={isLast} onClick={(e) => { e.stopPropagation(); onMoveDown?.(); }} title="Move Down"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
            {showColumnMove && onMoveColumn && (
              <Button type="button" variant="ghost" size="icon"
                className="h-5 w-5 p-0 hover:bg-muted text-muted-foreground hover:text-foreground"
                onClick={(e) => { e.stopPropagation(); onMoveColumn(column === "left" ? "right" : "left"); }}
                title={column === "left" ? "Move to Right Column" : "Move to Left Column"}
              >
                {column === "left" ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
              </Button>
            )}
          </div>
        )}

        <div className="flex-1 space-y-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            {/* Type tag (click to open edit sheet) */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div
                onClick={() => !field.locked && !isOverlay && setIsEditModalOpen(true)}
                className={`flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase text-muted-foreground tracking-wider transition-colors select-none ${
                  field.locked || isOverlay ? "cursor-default" : "cursor-pointer hover:bg-muted/80 hover:text-foreground"
                }`}
                title={field.locked ? "Locked" : isOverlay ? undefined : "Click to change field settings"}
              >
                {getFieldIcon(field)}
                <span>{field.type}</span>
              </div>
              {isHeaderMissing && (
                <span className="bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20 px-1 rounded text-[8px] font-bold tracking-wide uppercase select-none">
                  Tidak ada di Header
                </span>
              )}
            </div>

            {/* Label + lock icon */}
            <div className="flex items-center gap-1.5 min-w-0 justify-end">
              <span
                className="text-[11px] font-semibold text-foreground/80 truncate max-w-[120px] sm:max-w-[180px] md:max-w-[220px]"
                title={field.label}
              >
                {field.label}
              </span>
              {field.locked && (
                <span title="Read-only field" className="shrink-0">
                  <Lock className="h-2.5 w-2.5 text-muted-foreground/60" />
                </span>
              )}
            </div>
          </div>

          {/* Field input/preview */}
          {renderInput(field, sampleRow, onUpdateField)}

          {/* Optional description */}
          {field.description && (
            <p className="text-[10px] text-muted-foreground/70 leading-snug px-0.5 mt-0.5 italic">
              {field.description}
            </p>
          )}
        </div>

        {/* Delete button */}
        {!field.locked && !isOverlay && (
          <Button
            variant="ghost" size="icon"
            className="mt-0.5 h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover/field:opacity-100 transition-opacity"
            onClick={() => onDeleteField(field.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}

        {/* Edit sheet */}
        <FieldEditSheet
          field={field}
          isOpen={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          onUpdateField={onUpdateField}
        />
      </div>
    </div>
  );
}
