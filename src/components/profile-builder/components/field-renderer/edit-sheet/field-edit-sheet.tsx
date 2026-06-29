"use client";

import React, { useState } from "react";
import { Field, FieldType } from "../../../types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { DropdownOptionsConfig } from "./dropdown-options-config";
import { TypeOptionsConfig } from "./type-options-config";

interface FieldEditSheetProps {
  field: Field;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateField: (updatedField: Field) => void;
}

/** Sheet panel for editing all settings of a single field */
export function FieldEditSheet({ field, isOpen, onOpenChange, onUpdateField }: FieldEditSheetProps) {
  const [editType, setEditType] = useState<FieldType>(field.type);
  const [editLabel, setEditLabel] = useState(field.label);
  const [editIsEditable, setEditIsEditable] = useState(field.isEditable ?? false);
  const [editIsRequired, setEditIsRequired] = useState(field.isRequired ?? false);
  const [editPlaceholder, setEditPlaceholder] = useState(field.placeholder || "");
  const [editDescription, setEditDescription] = useState(field.description || "");
  const [editDateMode, setEditDateMode] = useState<"date-only" | "date-time">(field.dateMode || "date-only");
  const [editDateLocale, setEditDateLocale] = useState<"id" | "en">(field.dateLocale || "id");
  const [editPreviewFontMode, setEditPreviewFontMode] = useState<"sans" | "mono">(field.previewFontMode || "sans");
  const [editStatusStyle, setEditStatusStyle] = useState<"success" | "warning" | "danger" | "info" | "default">(field.statusStyle || "default");
  const [editPillsSeparator, setEditPillsSeparator] = useState(field.pillsSeparator || ",");
  const [editMediaSubType, setEditMediaSubType] = useState<"auto" | "image" | "video" | "pdf" | "link">(field.mediaSubType || "auto");
  const [editOptions, setEditOptions] = useState<string[]>(field.options || []);
  const [editOptionColors, setEditOptionColors] = useState<Record<string, string>>(field.optionColors || {});
  const [newOptionText, setNewOptionText] = useState("");
  const [optionsBulkText, setOptionsBulkText] = useState((field.options || []).join("\n"));

  // Sync from field prop when sheet opens
  React.useEffect(() => {
    if (isOpen) {
      setEditType(field.type);
      setEditLabel(field.label);
      setEditIsEditable(field.isEditable ?? false);
      setEditIsRequired(field.isRequired ?? false);
      setEditPlaceholder(field.placeholder || "");
      setEditDescription(field.description || "");
      setEditDateMode(field.dateMode || "date-only");
      setEditDateLocale(field.dateLocale || "id");
      setEditPreviewFontMode(field.previewFontMode || "sans");
      setEditStatusStyle(field.statusStyle || "default");
      setEditPillsSeparator(field.pillsSeparator || ",");
      setEditMediaSubType(field.mediaSubType || "auto");
      const initialOptions = field.options || [];
      setEditOptions(initialOptions);
      setEditOptionColors(field.optionColors || {});
      setNewOptionText("");
      setOptionsBulkText(initialOptions.join("\n"));
    }
  }, [isOpen, field]);

  const handleBulkOptionsChange = (text: string) => {
    setOptionsBulkText(text);
    setEditOptions(text.split("\n").map((item) => item.trim()).filter(Boolean));
  };

  const handleAddOption = () => {
    if (!newOptionText.trim()) return;
    const updated = [...editOptions, newOptionText.trim()];
    setEditOptions(updated);
    setOptionsBulkText(updated.join("\n"));
    setNewOptionText("");
  };

  const handleRemoveOption = (index: number) => {
    const optToRemove = editOptions[index];
    const updated = editOptions.filter((_, idx) => idx !== index);
    setEditOptions(updated);
    setOptionsBulkText(updated.join("\n"));
    if (optToRemove) {
      const updatedColors = { ...editOptionColors };
      delete updatedColors[optToRemove];
      setEditOptionColors(updatedColors);
    }
  };

  const handleColorChange = (opt: string, colorKey: string) => {
    setEditOptionColors({ ...editOptionColors, [opt]: colorKey });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLabel.trim()) {
      toast.error("Label cannot be empty");
      return;
    }
    onUpdateField({
      ...field,
      type: editType,
      label: editLabel,
      isEditable: editType !== "media" ? editIsEditable : false,
      isRequired: editIsRequired,
      placeholder: editPlaceholder,
      description: editDescription.trim() || undefined,
      dateMode: editDateMode,
      dateLocale: editDateLocale,
      previewFontMode: editPreviewFontMode,
      statusStyle: editStatusStyle,
      pillsSeparator: editPillsSeparator,
      mediaSubType: editMediaSubType === "auto" ? undefined : editMediaSubType,
      options: editType === "dropdown" ? editOptions : undefined,
      optionColors: editType === "dropdown" ? editOptionColors : undefined,
    });
    onOpenChange(false);
    toast.success("Field settings updated");
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[480px] p-6 overflow-y-auto flex flex-col h-full">
        <form onSubmit={handleSave} className="flex flex-col h-full justify-between gap-6">
          <div>
            <SheetHeader className="p-0 pb-2">
              <SheetTitle>Edit Field: {field.label}</SheetTitle>
              <SheetDescription>
                Modify the properties, type, or label for this field.
              </SheetDescription>
            </SheetHeader>

            <div className="grid gap-4 py-4">
              {/* Field Type */}
              <div className="grid gap-2">
                <Label htmlFor="editFieldType">Field Type</Label>
                <Select value={editType} onValueChange={(val) => setEditType(val as FieldType)}>
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
                    <SelectItem value="checkbox">Ceklis / Checkbox</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Type-specific top options (media sub-type) */}
              <TypeOptionsConfig
                editType={editType}
                editDateMode={editDateMode}
                editDateLocale={editDateLocale}
                editPreviewFontMode={editPreviewFontMode}
                editStatusStyle={editStatusStyle}
                editPillsSeparator={editPillsSeparator}
                editMediaSubType={editMediaSubType}
                onDateModeChange={setEditDateMode}
                onDateLocaleChange={setEditDateLocale}
                onPreviewFontModeChange={setEditPreviewFontMode}
                onStatusStyleChange={setEditStatusStyle}
                onPillsSeparatorChange={setEditPillsSeparator}
                onMediaSubTypeChange={setEditMediaSubType}
              />

              {/* Field Label */}
              <div className="grid gap-2">
                <Label htmlFor="editLabel">Field Label</Label>
                <Input
                  id="editLabel"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  placeholder="e.g. Phone Number, Date of Birth"
                />
              </div>

              {/* Editable toggle */}
              {editType !== "media" && (
                <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <Label htmlFor="editIsEditable" className="text-sm font-medium">
                      Editable Field
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Allow users/verifiers to edit the value of this field during validation.
                    </p>
                  </div>
                  <Switch id="editIsEditable" checked={editIsEditable} onCheckedChange={setEditIsEditable} />
                </div>
              )}

              {/* Required toggle */}
              <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <Label htmlFor="editIsRequired" className="text-sm font-medium">
                    Required Field
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Make this field mandatory. Verification cannot be saved if this field is empty.
                  </p>
                </div>
                <Switch id="editIsRequired" checked={editIsRequired} onCheckedChange={setEditIsRequired} />
              </div>

              {/* Description */}
              <div className="grid gap-2">
                <Label htmlFor="editDescription">
                  Description
                  <span className="ml-1.5 text-[10px] text-muted-foreground font-normal normal-case tracking-normal">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="editDescription"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="e.g. Hint or helper text for this field"
                />
              </div>

              {/* Placeholder (text/textarea/number/checkbox) */}
              {(editType === "text" || editType === "textarea" || editType === "number" || editType === "checkbox") && (
                <div className="grid gap-2">
                  <Label htmlFor="editPlaceholder">
                    {editType === "checkbox" ? "Label Samping Ceklis" : "Placeholder Text"}
                  </Label>
                  <Input
                    id="editPlaceholder"
                    value={editPlaceholder}
                    onChange={(e) => setEditPlaceholder(e.target.value)}
                    placeholder={editType === "checkbox" ? "e.g. Setuju / Selesai" : "e.g. Enter value..."}
                  />
                </div>
              )}

              {/* Dropdown options */}
              {editType === "dropdown" && (
                <DropdownOptionsConfig
                  editOptions={editOptions}
                  editOptionColors={editOptionColors}
                  optionsBulkText={optionsBulkText}
                  newOptionText={newOptionText}
                  onBulkChange={handleBulkOptionsChange}
                  onNewOptionChange={setNewOptionText}
                  onAddOption={handleAddOption}
                  onRemoveOption={handleRemoveOption}
                  onColorChange={handleColorChange}
                />
              )}
            </div>
          </div>

          <SheetFooter className="border-t pt-4 shrink-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-9">
              Cancel
            </Button>
            <Button type="submit" className="h-9">
              Save Changes
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
