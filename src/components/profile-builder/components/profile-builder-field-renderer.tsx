"use client";

import React, { useState } from "react";
import { Field, FieldType } from "../types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Type, 
  AlignLeft, 
  Trash2, 
  Edit3, 
  Lock, 
  Check, 
  X,
  Play,
  Volume2,
  Maximize,
  Contact2,
  Eye,
  Calendar,
  Hash,
  Tag,
  Bookmark,
  Link2,
  Globe,
  FileText,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  List,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import { detectMediaType } from "../utils/detect-media-type";

interface FieldRendererProps {
  field: Field;
  index: number;
  column: "left" | "right";
  sectionId: string;
  onUpdateField: (updatedField: Field) => void;
  onDeleteField: (fieldId: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onMoveColumn?: (column: "left" | "right") => void;
  isFirst?: boolean;
  isLast?: boolean;
  showColumnMove?: boolean;
  sampleRow?: Record<string, any>;
  isOverlay?: boolean;
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
}: FieldRendererProps) {
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelValue, setLabelValue] = useState(field.label);

  // Dialog state to edit field details
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editType, setEditType] = useState<FieldType>(field.type);
  const [editLabel, setEditLabel] = useState(field.label);
  const [editPlaceholder, setEditPlaceholder] = useState(field.placeholder || "");
  const [editDateMode, setEditDateMode] = useState<'date-only' | 'date-time'>(field.dateMode || 'date-only');
  const [editDateLocale, setEditDateLocale] = useState<'id' | 'en'>(field.dateLocale || 'id');
  const [editPreviewFontMode, setEditPreviewFontMode] = useState<'sans' | 'mono'>(field.previewFontMode || 'sans');
  const [editStatusStyle, setEditStatusStyle] = useState<'success' | 'warning' | 'danger' | 'info' | 'default'>(field.statusStyle || 'default');
  const [editPillsSeparator, setEditPillsSeparator] = useState(field.pillsSeparator || ',');
  const [editMediaSubType, setEditMediaSubType] = useState<'auto' | 'image' | 'video' | 'pdf' | 'link'>(
    field.mediaSubType || 'auto'
  );
  const [editOptions, setEditOptions] = useState<string[]>(field.options || []);
  const [newOptionText, setNewOptionText] = useState("");
  const [optionsBulkText, setOptionsBulkText] = useState("");

  const handleOpenEditModal = () => {
    setEditType(field.type);
    setEditLabel(field.label);
    setEditPlaceholder(field.placeholder || "");
    setEditDateMode(field.dateMode || 'date-only');
    setEditDateLocale(field.dateLocale || 'id');
    setEditPreviewFontMode(field.previewFontMode || 'sans');
    setEditStatusStyle(field.statusStyle || 'default');
    setEditPillsSeparator(field.pillsSeparator || ',');
    setEditMediaSubType(field.mediaSubType || 'auto');
    
    const initialOptions = field.options || [];
    setEditOptions(initialOptions);
    setNewOptionText("");
    setOptionsBulkText(initialOptions.join("\n"));
    
    setIsEditModalOpen(true);
  };

  const handleBulkOptionsChange = (text: string) => {
    setOptionsBulkText(text);
    const parsed = text
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    setEditOptions(parsed);
  };

  const handleAddOption = () => {
    if (!newOptionText.trim()) return;
    const updated = [...editOptions, newOptionText.trim()];
    setEditOptions(updated);
    setOptionsBulkText(updated.join("\n"));
    setNewOptionText("");
  };

  const handleRemoveOption = (index: number) => {
    const updated = editOptions.filter((_, idx) => idx !== index);
    setEditOptions(updated);
    setOptionsBulkText(updated.join("\n"));
  };

  const handleSaveFieldSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLabel.trim()) {
      toast.error("Label cannot be empty");
      return;
    }
    onUpdateField({
      ...field,
      type: editType,
      label: editLabel,
      placeholder: editPlaceholder,
      dateMode: editDateMode,
      dateLocale: editDateLocale,
      previewFontMode: editPreviewFontMode,
      statusStyle: editStatusStyle,
      pillsSeparator: editPillsSeparator,
      mediaSubType: editMediaSubType === 'auto' ? undefined : editMediaSubType,
      options: editType === 'dropdown' ? editOptions : undefined,
    });
    setIsEditModalOpen(false);
    toast.success("Field settings updated");
  };

  const handleSaveLabel = () => {
    if (!labelValue.trim()) {
      toast.error("Label cannot be empty");
      return;
    }
    onUpdateField({ ...field, label: labelValue });
    setIsEditingLabel(false);
  };

  const getFieldIcon = () => {
    switch (field.type) {
      case "text":
        return <Type className="h-4.5 w-4.5 text-primary" />;
      case "textarea":
        return <AlignLeft className="h-4.5 w-4.5 text-primary" />;
      case "media":
        return <Link2 className="h-4.5 w-4.5 text-indigo-500" />;
      case "number":
        return <Hash className="h-4.5 w-4.5 text-orange-500" />;
      case "date":
        return <Calendar className="h-4.5 w-4.5 text-blue-500" />;
      case "badge-status":
        return <Tag className="h-4.5 w-4.5 text-amber-500" />;
      case "array-pills":
        return <Bookmark className="h-4.5 w-4.5 text-emerald-500" />;
      case "dropdown":
        return <List className="h-4.5 w-4.5 text-indigo-500" />;
    }
  };

  const formatLocalDate = (
    val: string | Date | undefined,
    mode: "date-only" | "date-time" = "date-only",
    locale: "id" | "en" = "id"
  ) => {
    if (!val) return "";
    const dateObj = new Date(val);
    if (isNaN(dateObj.getTime())) return String(val);

    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    if (mode === "date-time") {
      options.hour = "2-digit";
      options.minute = "2-digit";
    }

    const localeStr = locale === "en" ? "en-US" : "id-ID";
    return dateObj.toLocaleDateString(localeStr, options);
  };

  const renderInput = () => {
    const sampleValue = sampleRow?.[field.label];
    switch (field.type) {
      case "text":
        if (field.isEditable) {
          return (
            <Input
              placeholder={field.placeholder || "Enter text..."}
              value={field.value !== undefined && field.value !== "" ? field.value : (sampleValue !== undefined && sampleValue !== null ? String(sampleValue) : "")}
              disabled={field.locked}
              onChange={(e) => onUpdateField({ ...field, value: e.target.value })}
              className={field.locked ? "bg-muted cursor-not-allowed h-7 text-xs px-2" : "h-7 text-xs px-2"}
            />
          );
        } else {
          const hasValue = (field.value !== undefined && field.value !== "") || (sampleValue !== undefined && sampleValue !== null && String(sampleValue) !== "");
          const textVal = hasValue 
            ? (field.value !== undefined && field.value !== "" ? field.value : String(sampleValue)) 
            : (field.placeholder || "Belum diisi");
          return (
            <div className="min-h-7 flex items-center py-1 px-2.5 bg-muted/40 border border-border/50 rounded-lg text-xs select-all">
              <span className={`${field.previewFontMode === "mono" ? "font-mono " : ""}tracking-tight font-medium ${hasValue ? "text-foreground/80" : "text-muted-foreground/50 italic"}`}>
                {textVal}
              </span>
            </div>
          );
        }
      case "textarea":
        if (field.isEditable) {
          return (
            <Textarea
              placeholder={field.placeholder || "Enter details..."}
              value={field.value !== undefined && field.value !== "" ? field.value : (sampleValue !== undefined && sampleValue !== null ? String(sampleValue) : "")}
              disabled={field.locked}
              onChange={(e) => onUpdateField({ ...field, value: e.target.value })}
              className={field.locked ? "bg-muted cursor-not-allowed min-h-[50px] text-xs px-2 py-1" : "min-h-[50px] text-xs px-2 py-1"}
            />
          );
        } else {
          const hasValue = (field.value !== undefined && field.value !== "") || (sampleValue !== undefined && sampleValue !== null && String(sampleValue) !== "");
          const textVal = hasValue 
            ? (field.value !== undefined && field.value !== "" ? field.value : String(sampleValue)) 
            : (field.placeholder || "Belum diisi");
          return (
            <div className="min-h-[50px] py-1 px-2.5 bg-muted/40 border border-border/50 rounded-lg text-xs select-all whitespace-pre-wrap">
              <span className={`${field.previewFontMode === "mono" ? "font-mono " : ""}tracking-tight font-medium ${hasValue ? "text-foreground/80" : "text-muted-foreground/50 italic"}`}>
                {textVal}
              </span>
            </div>
          );
        }
      case "media":
        const mediaUrl = field.value !== undefined && field.value !== "" ? field.value : (sampleValue !== undefined && sampleValue !== null ? String(sampleValue) : "");
        const detectedType = detectMediaType(mediaUrl);
        const mediaSub = detectedType !== "link" ? detectedType : (field.mediaSubType || "link");

        if (!mediaUrl) {
          return (
            <div className="border border-dashed border-border rounded-lg bg-muted/5 p-2 min-h-[70px] flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-muted-foreground/10 rounded flex items-center justify-center border border-border/40 shrink-0">
                  <Contact2 className="h-4 w-4 text-muted-foreground/40" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold text-foreground/75 truncate">
                    No Media/Document Source
                  </div>
                  <div className="h-1 bg-muted-foreground/10 rounded w-2/3 mt-1" />
                </div>
              </div>
            </div>
          );
        }

        switch (mediaSub) {
          case "image":
            return (
              <div className="border border-border rounded-lg overflow-hidden bg-muted/20 flex items-center justify-center p-1 min-h-[80px]">
                <img 
                  src={mediaUrl} 
                  alt={field.label}
                  className="max-h-[90px] max-w-full object-contain rounded-md shadow-sm"
                />
              </div>
            );
          case "video":
            return (
              <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-border bg-slate-950 flex flex-col justify-between p-1.5 group/video shadow-md min-h-[80px]">
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover/video:bg-black/45 transition-colors">
                  <button className="h-7 w-7 rounded-full bg-white/90 hover:bg-white text-slate-950 flex items-center justify-center shadow-lg transition-transform transform group-hover/video:scale-105">
                    <Play className="h-3 w-3 fill-slate-950 ml-0.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between z-10 opacity-0 group-hover/video:opacity-100 transition-opacity duration-200">
                  <span className="text-[8px] font-medium text-white/90 truncate bg-slate-900/60 px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                    {mediaUrl.split('/').pop() || "Video Embed"}
                  </span>
                </div>
                <div className="w-full space-y-1 z-10 pt-2 mt-auto">
                  <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-primary" />
                  </div>
                  <div className="flex items-center justify-between text-[8px] text-white/80">
                    <div className="flex items-center gap-1">
                      <Play className="h-2 w-2 fill-white" />
                      <span>0:32 / 1:45</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Volume2 className="h-2.5 w-2.5" />
                      <Maximize className="h-2 w-2" />
                    </div>
                  </div>
                </div>
              </div>
            );
          case "pdf":
            const pdfName = mediaUrl.split('/').pop() || "document_attachment.pdf";
            return (
              <div className="border border-border rounded-lg bg-card p-2 shadow-sm flex flex-col min-h-[80px] justify-between relative group/pdf overflow-hidden">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-8 bg-red-500/10 rounded flex items-center justify-center border border-red-500/20 shrink-0">
                    <FileText className="h-4.5 w-4.5 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-semibold text-foreground/80 truncate">
                        {pdfName}
                      </span>
                      <Badge variant="outline" className="text-[8px] uppercase px-1 py-0 border-red-500/30 text-red-500 bg-red-500/5 scale-90">
                        PDF
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1 pt-1 border-t border-border/40 text-[9px] text-muted-foreground">
                  <span>Page 1 of 3 (452 KB)</span>
                  <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary/85 flex items-center gap-0.5 hover:underline cursor-pointer">
                    <Eye className="h-2.5 w-2.5" /> View
                  </a>
                </div>
              </div>
            );
          case "link":
          default:
            return (
              <div className="border border-border rounded-lg bg-card p-2 shadow-sm flex flex-col min-h-[60px] justify-between relative overflow-hidden group/link">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-indigo-500/10 rounded flex items-center justify-center border border-indigo-500/20 shrink-0">
                    <Globe className="h-4 w-4 text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-semibold text-foreground/80 truncate" title={mediaUrl}>
                        {mediaUrl}
                      </span>
                      <Badge variant="outline" className="text-[8px] uppercase px-1 py-0 border-indigo-500/30 text-indigo-500 bg-indigo-500/5 scale-90 shrink-0">
                        LINK
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end mt-1 pt-1 border-t border-border/40 text-[9px]">
                  <a 
                    href={mediaUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="font-semibold text-primary/85 flex items-center gap-0.5 hover:underline cursor-pointer"
                  >
                    Open <Link2 className="h-2.5 w-2.5" />
                  </a>
                </div>
              </div>
            );
        }
      case "number":
        if (field.isEditable) {
          return (
            <Input
              type="number"
              placeholder={field.placeholder || "Enter number..."}
              value={field.value !== undefined && field.value !== "" ? field.value : (sampleValue !== undefined && sampleValue !== null ? String(sampleValue) : "")}
              disabled={field.locked}
              onChange={(e) => onUpdateField({ ...field, value: e.target.value })}
              className={field.locked ? "bg-muted cursor-not-allowed font-mono h-7 text-xs px-2" : "font-mono h-7 text-xs px-2"}
            />
          );
        } else {
          const hasValue = (field.value !== undefined && field.value !== "") || (sampleValue !== undefined && sampleValue !== null && String(sampleValue) !== "");
          const textVal = hasValue 
            ? (field.value !== undefined && field.value !== "" ? field.value : String(sampleValue)) 
            : (field.placeholder || "Belum diisi");
          return (
            <div className={`min-h-7 flex items-center py-1 px-2.5 bg-muted/40 border border-border/50 rounded-lg text-xs select-all font-mono font-medium ${hasValue ? "text-foreground/80" : "text-muted-foreground/50 italic"}`}>
              {textVal}
            </div>
          );
        }
      case "date":
        const rawDateVal = field.value !== undefined && field.value !== "" ? field.value : (sampleValue !== undefined && sampleValue !== null ? String(sampleValue) : "");
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
        } else {
          return (
            <div className="min-h-7 py-1 px-2.5 bg-muted/40 border border-border/50 rounded-lg text-xs select-all flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground/75" />
              <span className="text-foreground/80 font-medium font-sans">
                {formattedDateStr || "Belum ada tanggal"}
              </span>
            </div>
          );
        }
      case "badge-status":
        const statusText = field.value !== undefined && field.value !== "" ? field.value : (sampleValue !== undefined && sampleValue !== null ? String(sampleValue) : "Pending");
        if (field.isEditable) {
          return (
            <Input
              placeholder={field.placeholder || "Enter status text..."}
              value={field.value !== undefined && field.value !== "" ? field.value : (sampleValue !== undefined && sampleValue !== null ? String(sampleValue) : "")}
              disabled={field.locked}
              onChange={(e) => onUpdateField({ ...field, value: e.target.value })}
              className={field.locked ? "bg-muted cursor-not-allowed h-7 text-xs px-2" : "h-7 text-xs px-2"}
            />
          );
        } else {
          const getBadgeStyle = (style?: string) => {
            switch (style) {
              case "success":
                return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
              case "warning":
                return "bg-amber-500/10 text-amber-600 border-amber-500/20";
              case "danger":
                return "bg-red-500/10 text-red-600 border-red-500/20";
              case "info":
                return "bg-sky-500/10 text-sky-600 border-sky-500/20";
              default:
                return "bg-slate-500/10 text-slate-600 border-slate-500/20";
            }
          };
          const getDotStyle = (style?: string) => {
            switch (style) {
              case "success":
                return "bg-emerald-500";
              case "warning":
                return "bg-amber-500";
              case "danger":
                return "bg-red-500";
              case "info":
                return "bg-sky-500";
              default:
                return "bg-slate-500";
            }
          };
          return (
            <div className="flex items-center py-0.5">
              <Badge variant="outline" className={`px-2 py-0.5 flex items-center gap-1 text-[10px] font-semibold rounded-full border ${getBadgeStyle(field.statusStyle)}`}>
                <span className={`h-1 w-1 rounded-full ${getDotStyle(field.statusStyle)}`} />
                {statusText}
              </Badge>
            </div>
          );
        }
      case "array-pills":
        const splitChar = field.pillsSeparator || ",";
        const parseArrayPillsForRenderer = (val: any, sep: string = ",") => {
          if (val === undefined || val === null || val === "") return [];
          if (Array.isArray(val)) return val.map(i => String(i).trim()).filter(Boolean);
          if (typeof val === "string") {
            const trimmed = val.trim();
            if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
              try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) return parsed.map(i => String(i).trim()).filter(Boolean);
              } catch (e) {}
            }
            return trimmed.split(sep).map(i => i.trim()).filter(Boolean);
          }
          return [String(val).trim()].filter(Boolean);
        };
        const rawValue = field.value !== undefined && field.value !== "" ? field.value : sampleValue;
        const itemsList = parseArrayPillsForRenderer(rawValue, splitChar);
        if (field.isEditable) {
          const editableVal = Array.isArray(rawValue) 
            ? rawValue.join(splitChar) 
            : (typeof rawValue === "string" && rawValue.startsWith("[") && rawValue.endsWith("]")
                ? parseArrayPillsForRenderer(rawValue, splitChar).join(splitChar)
                : (rawValue !== undefined && rawValue !== null ? String(rawValue) : ""));
          return (
            <Input
              placeholder={field.placeholder || `Enter items separated by "${splitChar}"...`}
              value={field.value !== undefined && field.value !== "" ? field.value : editableVal}
              disabled={field.locked}
              onChange={(e) => onUpdateField({ ...field, value: e.target.value })}
              className={field.locked ? "bg-muted cursor-not-allowed h-7 text-xs px-2" : "h-7 text-xs px-2"}
            />
          );
        } else {
          const finalItems = itemsList.length > 0 ? itemsList : ["Sample Item A", "Sample Item B"];
          return (
            <div className="flex flex-wrap gap-1 py-0.5">
              {finalItems.map((pillItem, idx) => (
                <Badge key={idx} variant="secondary" className="px-1.5 py-0 rounded-md text-[10px] font-semibold border border-border/40 bg-secondary/60 hover:bg-secondary/80 text-foreground/80 transition-colors select-none">
                  {pillItem}
                </Badge>
              ))}
              {finalItems.length === 0 && (
                <span className="text-[10px] italic text-muted-foreground">Empty list</span>
              )}
            </div>
          );
        }
      case "dropdown":
        const dropdownVal = field.value !== undefined && field.value !== "" ? field.value : (sampleValue !== undefined && sampleValue !== null ? String(sampleValue) : "");
        const selectOptions = field.options || [];
        if (field.isEditable) {
          return (
            <Select
              value={dropdownVal}
              disabled={field.locked}
              onValueChange={(val) => onUpdateField({ ...field, value: val })}
            >
              <SelectTrigger className="h-7 text-xs px-2 w-full">
                <SelectValue placeholder={field.placeholder || "Select option..."} />
              </SelectTrigger>
              <SelectContent>
                {selectOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
                {selectOptions.length === 0 && (
                  <div className="text-[10px] text-muted-foreground p-2 text-center">
                    No options defined. Edit field to add options.
                  </div>
                )}
              </SelectContent>
            </Select>
          );
        } else {
          const hasValue = dropdownVal !== "";
          const textVal = hasValue ? dropdownVal : (field.placeholder || "Belum diisi");
          return (
            <div className="min-h-7 flex items-center py-1 px-2.5 bg-muted/40 border border-border/50 rounded-lg text-xs select-all">
              <span className={`tracking-tight font-medium ${hasValue ? "text-foreground/80" : "text-muted-foreground/50 italic"}`}>
                {textVal}
              </span>
            </div>
          );
        }
    }
  };

  return (
    <div className="w-full">
      <div 
        className="group/field relative flex items-start gap-1.5 rounded-lg border p-1 transition-all border-transparent hover:border-border/50 hover:bg-muted/5"
      >
        {/* Compact Move Controls (Up/Down and Left/Right if in 2-col) */}
        {!isOverlay && !field.locked && (
          <div className="flex flex-col gap-0.5 mt-1.5 opacity-0 group-hover/field:opacity-100 transition-opacity z-10 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-5 w-5 p-0 hover:bg-muted text-muted-foreground hover:text-foreground"
              disabled={isFirst}
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp?.();
              }}
              title="Move Up"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-5 w-5 p-0 hover:bg-muted text-muted-foreground hover:text-foreground"
              disabled={isLast}
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown?.();
              }}
              title="Move Down"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
            {showColumnMove && onMoveColumn && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-5 p-0 hover:bg-muted text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveColumn(column === "left" ? "right" : "left");
                }}
                title={column === "left" ? "Move to Right Column" : "Move to Left Column"}
              >
                {column === "left" ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
              </Button>
            )}
          </div>
        )}

        <div className="flex-1 space-y-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            {/* Tag & Type Label */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div 
                onClick={() => !field.locked && !isOverlay && handleOpenEditModal()}
                className={`flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase text-muted-foreground tracking-wider transition-colors select-none ${
                  field.locked || isOverlay ? "cursor-default" : "cursor-pointer hover:bg-muted/80 hover:text-foreground"
                }`}
                title={field.locked ? "Locked" : isOverlay ? undefined : "Click to change field settings"}
              >
                {getFieldIcon()}
                <span>{field.type}</span>
              </div>
            </div>

            {/* Editable / Readonly Label and lock symbol */}
            <div className="flex items-center gap-1.5 min-w-0 justify-end">
              {isEditingLabel ? (
                <div className="flex items-center gap-1 shrink-0">
                  <Input
                    size={12}
                    className="h-6 w-32 px-1.5 py-0.5 text-[10px]"
                    value={labelValue}
                    onChange={(e) => setLabelValue(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveLabel();
                      if (e.key === "Escape") {
                        setLabelValue(field.label);
                        setIsEditingLabel(false);
                      }
                    }}
                  />
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleSaveLabel}>
                    <Check className="h-3 w-3 text-green-600" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1 min-w-0 justify-end">
                  <span 
                    className="text-[11px] font-semibold text-foreground/80 truncate max-w-[120px] sm:max-w-[180px] md:max-w-[220px]"
                    title={field.label}
                  >
                    {field.label}
                  </span>
                  {!field.locked && !isOverlay && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 opacity-0 group-hover/field:opacity-100 transition-opacity text-muted-foreground hover:text-primary shrink-0"
                      onClick={() => setIsEditingLabel(true)}
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  )}
                  {field.locked && (
                    <span title="Read-only field" className="shrink-0">
                      <Lock className="h-2.5 w-2.5 text-muted-foreground/60" />
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Render actual Input/Select/Upload Box */}
          {renderInput()}

          {/* Switch below the input */}
          {!field.locked && field.type !== "media" && !isOverlay && (
            <div className="flex items-center gap-1 select-none bg-muted/20 px-1.5 py-0 rounded border border-border/30 w-fit mt-0.5">
              <span className="text-[8px] text-muted-foreground font-semibold uppercase tracking-wider scale-90 origin-left">Editable</span>
              <Switch
                checked={field.isEditable ?? false}
                onCheckedChange={(checked) => {
                  onUpdateField({ ...field, isEditable: checked });
                }}
                className="h-3 w-5 [&>span]:h-2 [&>span]:w-2 [&>span]:data-[state=checked]:translate-x-2"
              />
            </div>
          )}
        </div>

        {/* Delete field option */}
         {!field.locked && !isOverlay && (
          <Button
            variant="ghost"
            size="icon"
            className="mt-0.5 h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover/field:opacity-100 transition-opacity"
            onClick={() => onDeleteField(field.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}

        {/* Edit Field Sheet */}
        <Sheet open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <SheetContent className="sm:max-w-[480px] p-6 overflow-y-auto flex flex-col h-full">
            <form onSubmit={handleSaveFieldSettings} className="flex flex-col h-full justify-between gap-6">
              <div>
                <SheetHeader className="p-0 pb-2">
                  <SheetTitle>Edit Field: {field.label}</SheetTitle>
                  <SheetDescription>
                    Modify the properties, type, or label for this field.
                  </SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="editFieldType">Field Type</Label>
                    <Select
                      value={editType}
                      onValueChange={(val) => setEditType(val as FieldType)}
                    >
                      <SelectTrigger id="editFieldType">
                        <SelectValue placeholder="Select field type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text Input</SelectItem>
                        <SelectItem value="textarea">Text Area</SelectItem>
                        <SelectItem value="number">Number Input</SelectItem>
                        <SelectItem value="date">Date picker</SelectItem>
                        <SelectItem value="badge-status">Badge Status</SelectItem>
                        <SelectItem value="array-pills">Array Pills</SelectItem>
                        <SelectItem value="media">Media / Dokumen (Auto-detect)</SelectItem>
                        <SelectItem value="dropdown">Dropdown Input</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {editType === "media" && (
                    <div className="grid gap-2">
                      <Label htmlFor="editMediaSubType">Media Sub-type Override</Label>
                      <Select
                        value={editMediaSubType}
                        onValueChange={(val) => setEditMediaSubType(val as any)}
                      >
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
                  <div className="grid gap-2">
                    <Label htmlFor="editLabel">Field Label</Label>
                    <Input
                      id="editLabel"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      placeholder="e.g. Phone Number, Date of Birth"
                    />
                  </div>
                  {(editType === "text" || editType === "textarea" || editType === "number") && (
                    <div className="grid gap-2">
                      <Label htmlFor="editPlaceholder">Placeholder Text</Label>
                      <Input
                        id="editPlaceholder"
                        value={editPlaceholder}
                        onChange={(e) => setEditPlaceholder(e.target.value)}
                        placeholder="e.g. Enter value..."
                      />
                    </div>
                  )}

                  {/* Dropdown Options Configuration */}
                  {editType === "dropdown" && (
                    <div className="space-y-4 border border-border/50 rounded-lg p-3.5 bg-muted/25">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold flex items-center gap-1.5">
                          <List className="h-3.5 w-3.5 text-primary" />
                          Dropdown Options Config
                        </Label>
                        <p className="text-[10px] text-muted-foreground leading-normal">
                          Manage options for the dropdown field. You can paste multiple values in bulk (one per line) or add them one-by-one.
                        </p>
                      </div>

                      {/* Bulk Options Textarea */}
                      <div className="grid gap-1.5">
                        <Label htmlFor="editBulkOptions" className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wide">
                          Bulk Input (One option per line)
                        </Label>
                        <Textarea
                          id="editBulkOptions"
                          rows={4}
                          value={optionsBulkText}
                          onChange={(e) => handleBulkOptionsChange(e.target.value)}
                          placeholder="Option 1&#10;Option 2&#10;Option 3"
                          className="text-xs font-mono font-medium resize-y"
                        />
                      </div>

                      {/* Interactive Add Option */}
                      <div className="grid gap-1.5">
                        <Label className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wide">
                          Add Single Option
                        </Label>
                        <div className="flex gap-1.5">
                          <Input
                            value={newOptionText}
                            onChange={(e) => setNewOptionText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddOption();
                              }
                            }}
                            placeholder="Type option value..."
                            className="h-8 text-xs"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleAddOption}
                            className="h-8 gap-1 text-xs shrink-0 bg-primary/95 text-primary-foreground hover:bg-primary"
                          >
                            <Plus className="h-3 w-3" /> Add
                          </Button>
                        </div>
                      </div>

                      {/* Interactive List */}
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wide flex items-center justify-between">
                          <span>Options List ({editOptions.length})</span>
                          {editOptions.length > 0 && (
                            <span className="text-[9px] text-muted-foreground normal-case font-normal italic">
                              shows up to 40 items
                            </span>
                          )}
                        </Label>
                        <div className="max-h-[160px] overflow-y-auto border border-border/40 bg-background/50 rounded-md p-1.5 divide-y divide-border/30">
                          {editOptions.map((opt, idx) => (
                            <div key={idx} className="flex items-center justify-between py-1 px-1.5 group/opt hover:bg-muted/30 rounded text-xs">
                              <span className="font-medium truncate text-foreground/80 max-w-[85%]">
                                <span className="text-[10px] text-muted-foreground font-mono mr-1.5">{idx + 1}.</span>
                                {opt}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 text-muted-foreground hover:text-destructive hover:bg-destructive/15 transition-colors"
                                onClick={() => handleRemoveOption(idx)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          {editOptions.length === 0 && (
                            <div className="text-[10px] text-muted-foreground/60 text-center py-4 italic">
                              No options. Add options above.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Date Options */}
                  {editType === "date" && (
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="editDateMode">Date Form Mode</Label>
                        <Select
                          value={editDateMode}
                          onValueChange={(val) => setEditDateMode(val as 'date-only' | 'date-time')}
                        >
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
                        <Select
                          value={editDateLocale}
                          onValueChange={(val) => setEditDateLocale(val as 'id' | 'en')}
                        >
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

                  {/* Text Preview Options */}
                  {(editType === "text" || editType === "textarea") && (
                    <div className="grid gap-2">
                      <Label htmlFor="editPreviewFont">Font Mode</Label>
                      <Select
                        value={editPreviewFontMode}
                        onValueChange={(val) => setEditPreviewFontMode(val as 'sans' | 'mono')}
                      >
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

                  {/* Badge Status Options */}
                  {editType === "badge-status" && (
                    <div className="grid gap-2">
                      <Label htmlFor="editStatusStyle">Status Badge Color</Label>
                      <Select
                        value={editStatusStyle}
                        onValueChange={(val) => setEditStatusStyle(val as any)}
                      >
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

                  {/* Array Pills Options */}
                  {editType === "array-pills" && (
                    <div className="grid gap-2">
                      <Label htmlFor="editPillsSep">Pills Separator Character</Label>
                      <Input
                        id="editPillsSep"
                        value={editPillsSeparator}
                        onChange={(e) => setEditPillsSeparator(e.target.value)}
                        placeholder="e.g. , or ; or |"
                      />
                    </div>
                  )}
                </div>
              </div>
              <SheetFooter className="border-t pt-4 shrink-0">
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} className="h-9">
                  Cancel
                </Button>
                <Button type="submit" className="h-9">Save Changes</Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
