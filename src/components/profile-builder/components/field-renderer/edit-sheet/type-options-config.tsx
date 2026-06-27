"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldType } from "../../../types";

interface TypeOptionsConfigProps {
  editType: FieldType;
  editDateMode: "date-only" | "date-time";
  editDateLocale: "id" | "en";
  editPreviewFontMode: "sans" | "mono";
  editStatusStyle: "success" | "warning" | "danger" | "info" | "default";
  editPillsSeparator: string;
  editMediaSubType: "auto" | "image" | "video" | "pdf" | "link";
  onDateModeChange: (v: "date-only" | "date-time") => void;
  onDateLocaleChange: (v: "id" | "en") => void;
  onPreviewFontModeChange: (v: "sans" | "mono") => void;
  onStatusStyleChange: (v: "success" | "warning" | "danger" | "info" | "default") => void;
  onPillsSeparatorChange: (v: string) => void;
  onMediaSubTypeChange: (v: "auto" | "image" | "video" | "pdf" | "link") => void;
}

/**
 * Renders the type-specific configuration options in the field edit sheet.
 * Shows the relevant section depending on editType.
 */
export function TypeOptionsConfig({
  editType,
  editDateMode,
  editDateLocale,
  editPreviewFontMode,
  editStatusStyle,
  editPillsSeparator,
  editMediaSubType,
  onDateModeChange,
  onDateLocaleChange,
  onPreviewFontModeChange,
  onStatusStyleChange,
  onPillsSeparatorChange,
  onMediaSubTypeChange,
}: TypeOptionsConfigProps) {
  return (
    <>
      {/* Media sub-type override */}
      {editType === "media" && (
        <div className="grid gap-2">
          <Label htmlFor="editMediaSubType">Media Sub-type Override</Label>
          <Select value={editMediaSubType} onValueChange={(v) => onMediaSubTypeChange(v as any)}>
            <SelectTrigger id="editMediaSubType">
              <SelectValue placeholder="Select media override" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto-detect (Default)</SelectItem>
              <SelectItem value="image">Force Image</SelectItem>
              <SelectItem value="video">Force Video</SelectItem>
              <SelectItem value="pdf">Force PDF</SelectItem>
              <SelectItem value="link">Force Link</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Date options */}
      {editType === "date" && (
        <>
          <div className="grid gap-2">
            <Label htmlFor="editDateMode">Date Form Mode</Label>
            <Select value={editDateMode} onValueChange={(v) => onDateModeChange(v as any)}>
              <SelectTrigger id="editDateMode">
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-only">Date Only</SelectItem>
                <SelectItem value="date-time">Date with Hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="editDateLocale">Locale Display</Label>
            <Select value={editDateLocale} onValueChange={(v) => onDateLocaleChange(v as any)}>
              <SelectTrigger id="editDateLocale">
                <SelectValue placeholder="Select locale" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="id">Indonesian (ID)</SelectItem>
                <SelectItem value="en">English (EN)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {/* Font mode for text/textarea */}
      {(editType === "text" || editType === "textarea") && (
        <div className="grid gap-2">
          <Label htmlFor="editPreviewFont">Font Mode</Label>
          <Select value={editPreviewFontMode} onValueChange={(v) => onPreviewFontModeChange(v as any)}>
            <SelectTrigger id="editPreviewFont">
              <SelectValue placeholder="Select font style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sans">Standard Sans</SelectItem>
              <SelectItem value="mono">Monospace Mono (Numbers)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Badge status color */}
      {editType === "badge-status" && (
        <div className="grid gap-2">
          <Label htmlFor="editStatusStyle">Status Badge Color</Label>
          <Select value={editStatusStyle} onValueChange={(v) => onStatusStyleChange(v as any)}>
            <SelectTrigger id="editStatusStyle">
              <SelectValue placeholder="Select style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Slate (Default)</SelectItem>
              <SelectItem value="success">Green (Success/Active)</SelectItem>
              <SelectItem value="warning">Yellow (Warning/Pending)</SelectItem>
              <SelectItem value="danger">Red (Danger/Rejected)</SelectItem>
              <SelectItem value="info">Blue (Info)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Pills separator */}
      {editType === "array-pills" && (
        <div className="grid gap-2">
          <Label htmlFor="editPillsSep">Pills Separator Character</Label>
          <Input
            id="editPillsSep"
            value={editPillsSeparator}
            onChange={(e) => onPillsSeparatorChange(e.target.value)}
            placeholder="e.g. , or ; or |"
          />
        </div>
      )}
    </>
  );
}
