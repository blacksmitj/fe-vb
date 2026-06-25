"use client";

import React, { useState } from "react";
import { Field, FieldType } from "./types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  GripHorizontal,
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
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { useSortable } from "@dnd-kit/react/sortable";
import { detectMediaType } from "./detect-media-type";

interface FieldRendererProps {
  field: Field;
  index: number;
  column: "left" | "right";
  sectionId: string;
  onUpdateField: (updatedField: Field) => void;
  onDeleteField: (fieldId: string) => void;
  sampleRow?: Record<string, any>;
}

export default function ProfileBuilderFieldRenderer({
  field,
  index,
  column,
  sectionId,
  onUpdateField,
  onDeleteField,
  sampleRow,
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
    setIsEditModalOpen(true);
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
    });
    setIsEditModalOpen(false);
    toast.success("Field settings updated");
  };

  const { ref, handleRef } = useSortable({
    id: field.id,
    index,
    type: "field",
    accept: "field",
    group: `${sectionId}-${column}`,
  });

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
              className={field.locked ? "bg-muted cursor-not-allowed" : ""}
            />
          );
        } else {
          const textVal = field.value !== undefined && field.value !== "" ? field.value : (sampleValue !== undefined && sampleValue !== null ? String(sampleValue) : "-");
          return (
            <div className="py-2.5 px-3 bg-muted/40 border border-border/50 rounded-lg text-sm select-all">
              <span className={field.previewFontMode === "mono" ? "font-mono tracking-tight text-foreground/80 font-medium" : "text-foreground/80 font-medium"}>
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
              className={field.locked ? "bg-muted cursor-not-allowed min-h-[80px]" : "min-h-[80px]"}
            />
          );
        } else {
          const textVal = field.value !== undefined && field.value !== "" ? field.value : (sampleValue !== undefined && sampleValue !== null ? String(sampleValue) : "-");
          return (
            <div className="py-2.5 px-3 bg-muted/40 border border-border/50 rounded-lg text-sm select-all whitespace-pre-wrap">
              <span className={field.previewFontMode === "mono" ? "font-mono tracking-tight text-foreground/80 font-medium" : "text-foreground/80 font-medium"}>
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
            <div className="border border-dashed border-border rounded-xl bg-muted/10 p-5 min-h-[160px] flex flex-col justify-between">
              <div className="flex items-start gap-4">
                <div className="w-16 h-20 bg-muted-foreground/10 rounded-md flex items-center justify-center border border-border/40 shrink-0">
                  <Contact2 className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <div className="flex-1 space-y-2.5 pt-1">
                  <div className="text-xs font-semibold text-foreground/80 truncate max-w-[150px]">
                    No Media/Document Source
                  </div>
                  <div className="h-2 bg-muted-foreground/10 rounded w-full" />
                  <div className="h-2 bg-muted-foreground/10 rounded w-5/6" />
                </div>
              </div>
            </div>
          );
        }

        switch (mediaSub) {
          case "image":
            return (
              <div className="border border-border rounded-lg overflow-hidden bg-muted/20 flex items-center justify-center p-2 min-h-[160px]">
                <img 
                  src={mediaUrl} 
                  alt={field.label}
                  className="max-h-[180px] max-w-full object-contain rounded-md shadow-sm"
                />
              </div>
            );
          case "video":
            return (
              <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-border bg-slate-950 flex flex-col justify-between p-3 group/video shadow-md min-h-[160px]">
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover/video:bg-black/45 transition-colors">
                  <button className="h-12 w-12 rounded-full bg-white/90 hover:bg-white text-slate-950 flex items-center justify-center shadow-lg transition-transform transform group-hover/video:scale-110">
                    <Play className="h-5 w-5 fill-slate-950 ml-0.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between z-10 opacity-0 group-hover/video:opacity-100 transition-opacity duration-200">
                  <span className="text-[10px] font-medium text-white/90 truncate bg-slate-900/60 px-2 py-0.5 rounded-full backdrop-blur-sm">
                    {mediaUrl.split('/').pop() || "Video Embed Stream"}
                  </span>
                </div>
                <div className="w-full space-y-2 z-10 pt-8 mt-auto">
                  <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-primary" />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-white/80">
                    <div className="flex items-center gap-2">
                      <Play className="h-3 w-3 fill-white" />
                      <span>0:32 / 1:45</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-3.5 w-3.5" />
                      <Maximize className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              </div>
            );
          case "pdf":
            const pdfName = mediaUrl.split('/').pop() || "document_attachment.pdf";
            return (
              <div className="border border-border rounded-xl bg-card p-4 shadow-sm flex flex-col min-h-[165px] justify-between relative group/pdf overflow-hidden">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-12 bg-red-500/10 rounded-lg flex items-center justify-center border border-red-500/20 shrink-0">
                    <FileText className="h-6 w-6 text-red-500" />
                  </div>
                  <div className="flex-1 space-y-2 pt-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground/80 truncate max-w-[150px]">
                        {pdfName}
                      </span>
                      <Badge variant="outline" className="text-[9px] uppercase px-1 py-0 border-red-500/30 text-red-500 bg-red-500/5">
                        PDF
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="h-1.5 bg-muted rounded w-full" />
                      <div className="h-1.5 bg-muted rounded w-11/12" />
                      <div className="h-1.5 bg-muted rounded w-4/5" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-2.5 border-t border-border/40 text-[10px] text-muted-foreground">
                  <span>Page 1 of 3 (452 KB)</span>
                  <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary/85 flex items-center gap-1 hover:underline cursor-pointer">
                    <Eye className="h-3.5 w-3.5" /> View Document
                  </a>
                </div>
                <div className="absolute right-0 bottom-0 top-0 w-24 bg-linear-to-l from-muted/5 to-transparent pointer-events-none" />
              </div>
            );
          case "link":
          default:
            return (
              <div className="border border-border rounded-xl bg-card p-4 shadow-sm flex flex-col min-h-[110px] justify-between relative overflow-hidden group/link">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-indigo-500/10 rounded-lg flex items-center justify-center border border-indigo-500/20 shrink-0">
                    <Globe className="h-5 w-5 text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-foreground/80 truncate w-full" title={mediaUrl}>
                        {mediaUrl}
                      </span>
                      <Badge variant="outline" className="text-[9px] uppercase px-1 py-0 border-indigo-500/30 text-indigo-500 bg-indigo-500/5 shrink-0">
                        LINK
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate mt-1">
                      {mediaUrl}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end mt-2 pt-2 border-t border-border/40 text-[10px]">
                  <a 
                    href={mediaUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="font-semibold text-primary/85 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    Open Link <Link2 className="h-3 w-3" />
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
              className={field.locked ? "bg-muted cursor-not-allowed font-mono" : "font-mono"}
            />
          );
        } else {
          const textVal = field.value !== undefined && field.value !== "" ? field.value : (sampleValue !== undefined && sampleValue !== null ? String(sampleValue) : "-");
          return (
            <div className="py-2.5 px-3 bg-muted/40 border border-border/50 rounded-lg text-sm select-all font-mono text-foreground/80 font-medium">
              {textVal}
            </div>
          );
        }
      case "date":
        const rawDateVal = field.value !== undefined && field.value !== "" ? field.value : (sampleValue !== undefined && sampleValue !== null ? String(sampleValue) : "");
        const formattedDateStr = formatLocalDate(rawDateVal, field.dateMode, field.dateLocale);
        if (field.isEditable) {
          return (
            <div className="space-y-1.5 w-full">
              <Input
                type={field.dateMode === "date-time" ? "datetime-local" : "date"}
                value={field.value || ""}
                disabled={field.locked}
                onChange={(e) => onUpdateField({ ...field, value: e.target.value })}
                className={field.locked ? "bg-muted cursor-not-allowed" : ""}
              />
              {formattedDateStr && (
                <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 px-1 mt-1">
                  <span className="font-semibold text-foreground/70">Formatted ({field.dateLocale === "en" ? "EN" : "ID"}):</span>
                  <span className="font-medium bg-secondary/80 px-2 py-0.5 rounded text-secondary-foreground border border-border/40">
                    {formattedDateStr}
                  </span>
                </div>
              )}
            </div>
          );
        } else {
          return (
            <div className="py-2.5 px-3 bg-muted/40 border border-border/50 rounded-lg text-sm select-all flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground/75" />
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
              className={field.locked ? "bg-muted cursor-not-allowed" : ""}
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
            <div className="flex items-center py-1">
              <Badge variant="outline" className={`px-3 py-1 flex items-center gap-1.5 text-xs font-semibold rounded-full border ${getBadgeStyle(field.statusStyle)}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${getDotStyle(field.statusStyle)}`} />
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
              className={field.locked ? "bg-muted cursor-not-allowed" : ""}
            />
          );
        } else {
          const finalItems = itemsList.length > 0 ? itemsList : ["Sample Item A", "Sample Item B"];
          return (
            <div className="flex flex-wrap gap-1.5 py-1">
              {finalItems.map((pillItem, idx) => (
                <Badge key={idx} variant="secondary" className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold border border-border/40 bg-secondary/60 hover:bg-secondary/80 text-foreground/80 transition-colors select-none">
                  {pillItem}
                </Badge>
              ))}
              {finalItems.length === 0 && (
                <span className="text-[11px] italic text-muted-foreground">Empty list</span>
              )}
            </div>
          );
        }
    }
  };

  return (
    <div className="w-full">
      <div 
        ref={ref}
        className="group/field relative flex items-start gap-3 rounded-lg border border-transparent p-2 hover:border-border/50 hover:bg-muted/10 transition-all"
      >
        {/* Small drag handle indicator for aesthetics */}
        <div 
          ref={handleRef}
          className="mt-7 opacity-0 group-hover/field:opacity-40 transition-opacity cursor-grab text-muted-foreground p-1 z-10"
        >
          <GripHorizontal className="h-4 w-4" />
        </div>

        <div className="flex-1 space-y-1.5 min-w-0">
          <div className="flex items-center justify-between gap-4">
            {/* Tag & Type Label */}
            <div className="flex items-center gap-3 shrink-0">
              <div 
                onClick={() => !field.locked && handleOpenEditModal()}
                className={`flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground tracking-wider transition-colors select-none ${
                  field.locked ? "cursor-not-allowed" : "cursor-pointer hover:bg-muted/80 hover:text-foreground"
                }`}
                title={field.locked ? "Locked" : "Click to change field settings"}
              >
                {getFieldIcon()}
                <span>{field.type}</span>
              </div>
            </div>

            {/* Editable / Readonly Label and lock symbol */}
            <div className="flex items-center gap-2 min-w-0 justify-end">
              {isEditingLabel ? (
                <div className="flex items-center gap-1 shrink-0">
                  <Input
                    size={12}
                    className="h-6 w-32 px-1.5 py-0.5 text-xs"
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
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 min-w-0 justify-end">
                  <span 
                    className="text-xs font-semibold text-foreground/80 truncate max-w-[120px] sm:max-w-[180px] md:max-w-[220px]"
                    title={field.label}
                  >
                    {field.label}
                  </span>
                  {!field.locked && (
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
                      <Lock className="h-3 w-3 text-muted-foreground/60" />
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Render actual Input/Select/Upload Box */}
          {renderInput()}

          {/* Switch below the input */}
          {!field.locked && field.type !== "media" && (
            <div className="flex items-center gap-1.5 select-none bg-muted/30 px-2 py-0.5 rounded border border-border/40 w-fit mt-1.5">
              <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Editable</span>
              <Switch
                checked={field.isEditable ?? false}
                onCheckedChange={(checked) => {
                  onUpdateField({ ...field, isEditable: checked });
                }}
                className="h-3.5 w-6 [&>span]:h-2.5 [&>span]:w-2.5 [&>span]:data-[state=checked]:translate-x-2.5"
              />
            </div>
          )}
        </div>

        {/* Delete field option */}
        {!field.locked && (
          <Button
            variant="ghost"
            size="icon"
            className="mt-6 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover/field:opacity-100 transition-opacity"
            onClick={() => onDeleteField(field.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}

        {/* Edit Field Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSaveFieldSettings}>
              <DialogHeader>
                <DialogTitle>Edit Field: {field.label}</DialogTitle>
                <DialogDescription>
                  Modify the properties, type, or label for this field.
                </DialogDescription>
              </DialogHeader>
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
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
