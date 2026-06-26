"use client";

import React, { useState } from "react";
import { Section, Field } from "../types";
import ProfileBuilderFieldRenderer from "./profile-builder-field-renderer";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  Grid2X2,
  Columns2,
  Edit3,
  Check,
  Contact2,
  Info,
} from "lucide-react";
import { toast } from "sonner";

interface ProfileBuilderSectionProps {
  section: Section;
  index: number;
  isActive: boolean;
  onSelectActive: () => void;
  onUpdateSection: (updatedSection: Section) => void;
  onDeleteSection: (sectionId: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMoveField: (fieldId: string, direction: "up" | "down") => void;
  onMoveFieldColumn: (fieldId: string, column: "left" | "right") => void;
  isFirst: boolean;
  isLast: boolean;
  sampleRow?: Record<string, any>;
}

export default function ProfileBuilderSection({
  section,
  index,
  isActive,
  onSelectActive,
  onUpdateSection,
  onDeleteSection,
  onMoveUp,
  onMoveDown,
  onMoveField,
  onMoveFieldColumn,
  isFirst,
  isLast,
  sampleRow,
}: ProfileBuilderSectionProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(section.title);
  const [leftParentRef] = useAutoAnimate();
  const [rightParentRef] = useAutoAnimate();

  const leftFields = section.fields.filter((f) => f.column !== "right");
  const rightFields = section.fields.filter((f) => f.column === "right");

  const handleSaveTitle = () => {
    if (!titleValue.trim()) {
      toast.error("Section title cannot be empty");
      return;
    }
    onUpdateSection({ ...section, title: titleValue });
    setIsEditingTitle(false);
  };

  const handleUpdateField = (updatedField: Field) => {
    const updatedFields = section.fields.map((f) =>
      f.id === updatedField.id ? updatedField : f,
    );
    onUpdateSection({ ...section, fields: updatedFields });
  };

  const handleDeleteField = (fieldId: string) => {
    const updatedFields = section.fields.filter((f) => f.id !== fieldId);
    onUpdateSection({ ...section, fields: updatedFields });
    toast.success("Field deleted");
  };

  const toggleLayout = (layout: "1-col" | "2-col") => {
    onUpdateSection({ ...section, layout });
  };

  return (
    <div onClick={onSelectActive}>
      <Card
        className={`group relative border bg-card shadow-sm rounded-xl transition-all hover:shadow-md cursor-pointer ${
          isActive ? "border-primary ring-2 ring-primary/20" : "border-border"
        }`}
      >
        <CardHeader className="flex flex-row items-center justify-between border-b border-border px-4 py-2 bg-muted/20 rounded-t-xl shrink-0 space-y-0">
          <div className="flex items-center gap-2">
            {isEditingTitle ? (
              <div
                className="flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <Input
                  className="h-7 w-64 text-xs font-semibold"
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveTitle();
                    if (e.key === "Escape") {
                      setTitleValue(section.title);
                      setIsEditingTitle(false);
                    }
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleSaveTitle}
                >
                  <Check className="h-3.5 w-3.5 text-green-600" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold text-foreground">
                  {section.title}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingTitle(true);
                  }}
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
                {isActive && (
                  <span className="text-[9px] bg-primary text-primary-foreground font-bold px-1.5 py-0.5 rounded shadow-sm shrink-0">
                    Active
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Section Actions */}
          <div
            className="flex items-center gap-0.5 text-muted-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Reordering */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={isFirst}
              onClick={onMoveUp}
              title="Move Section Up"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={isLast}
              onClick={onMoveDown}
              title="Move Section Down"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>

            <span className="w-px h-3.5 bg-border mx-1"></span>

            {/* Layout Columns toggle */}
            <Button
              variant={section.layout === "1-col" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7 text-foreground"
              onClick={() => toggleLayout("1-col")}
              title="1 Column Layout"
            >
              <Grid2X2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={section.layout === "2-col" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7 text-foreground"
              onClick={() => toggleLayout("2-col")}
              title="2 Column Layout"
            >
              <Columns2 className="h-3.5 w-3.5" />
            </Button>

            <span className="w-px h-3.5 bg-border mx-1"></span>

            {/* Delete section */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDeleteSection(section.id)}
              title="Delete Section"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-3.5" onClick={(e) => e.stopPropagation()}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {/* Left panel / Fields container */}
            <div
              ref={leftParentRef}
              className={
                section.layout === "1-col"
                  ? "md:col-span-2 space-y-2 min-h-[60px]"
                  : "space-y-2 min-h-[60px]"
              }
            >
              <div
                className="border border-dashed border-border/50 rounded-lg p-4 flex flex-col items-center justify-center text-center text-muted-foreground/45 bg-muted/5 h-full min-h-[50px]"
                style={{ display: leftFields.length === 0 ? "flex" : "none" }}
              >
                <p className="text-[11px] font-medium">
                  Belum ada field di kolom ini
                </p>
                <p className="text-[9px] text-muted-foreground/60 mt-0.5">
                  Klik item di sidebar untuk menambahkan field.
                </p>
              </div>
              {leftFields.map((field, fieldIndex) => (
                <ProfileBuilderFieldRenderer
                  key={field.id}
                  field={field}
                  index={fieldIndex}
                  column="left"
                  sectionId={section.id}
                  onUpdateField={handleUpdateField}
                  onDeleteField={handleDeleteField}
                  onMoveUp={() => onMoveField(field.id, "up")}
                  onMoveDown={() => onMoveField(field.id, "down")}
                  onMoveColumn={(col) => onMoveFieldColumn(field.id, col)}
                  isFirst={fieldIndex === 0}
                  isLast={fieldIndex === leftFields.length - 1}
                  showColumnMove={section.layout === "2-col"}
                  sampleRow={sampleRow}
                />
              ))}
            </div>

            {/* Right panel (if 2-col, render second field column or empty zone) */}
            {section.layout === "2-col" && (
              <div className="h-full min-h-[60px]">
                <div ref={rightParentRef} className="space-y-2 h-full min-h-[60px]">
                  <div
                    className="border border-dashed border-border/75 rounded-lg p-4 flex flex-col items-center justify-center text-center text-muted-foreground/60 bg-muted/10 h-full min-h-[60px] hover:bg-muted/15 transition-all"
                    style={{
                      display: rightFields.length === 0 ? "flex" : "none",
                    }}
                  >
                    <p className="text-[11px] font-medium">
                      Kolom kanan kosong
                    </p>
                    <p className="text-[9px] text-muted-foreground/50 mt-0.5">
                      Gunakan tombol panah pada field untuk memindahkan ke kolom
                      kanan.
                    </p>
                  </div>
                  {rightFields.map((field, fieldIndex) => (
                    <ProfileBuilderFieldRenderer
                      key={field.id}
                      field={field}
                      index={fieldIndex}
                      column="right"
                      sectionId={section.id}
                      onUpdateField={handleUpdateField}
                      onDeleteField={handleDeleteField}
                      onMoveUp={() => onMoveField(field.id, "up")}
                      onMoveDown={() => onMoveField(field.id, "down")}
                      onMoveColumn={(col) => onMoveFieldColumn(field.id, col)}
                      isFirst={fieldIndex === 0}
                      isLast={fieldIndex === rightFields.length - 1}
                      showColumnMove={section.layout === "2-col"}
                      sampleRow={sampleRow}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
