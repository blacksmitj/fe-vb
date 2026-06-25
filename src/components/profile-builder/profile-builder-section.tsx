"use client";

import React, { useState } from "react";
import { Section, Field } from "./types";
import ProfileBuilderFieldRenderer from "./profile-builder-field-renderer";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ChevronUp, 
  ChevronDown, 
  Trash2, 
  Grid2X2, 
  Columns2, 
  Edit3, 
  Check, 
  Contact2,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { useDroppable } from "@dnd-kit/react";

interface ProfileBuilderSectionProps {
  section: Section;
  index: number;
  onUpdateSection: (updatedSection: Section) => void;
  onDeleteSection: (sectionId: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  sampleRow?: Record<string, any>;
}

export default function ProfileBuilderSection({
  section,
  index,
  onUpdateSection,
  onDeleteSection,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  sampleRow,
}: ProfileBuilderSectionProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(section.title);

  const leftCol = useDroppable({
    id: `${section.id}-left`,
    type: "column",
    accept: "field",
  });

  const rightCol = useDroppable({
    id: `${section.id}-right`,
    type: "column",
    accept: "field",
  });

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
      f.id === updatedField.id ? updatedField : f
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
    <div>
      <Card className="group relative border border-border bg-card shadow-sm rounded-xl transition-all hover:shadow-md">

      <CardHeader className="flex flex-row items-center justify-between border-b border-border px-6 py-4 bg-muted/20 rounded-t-xl shrink-0 space-y-0">
        <div className="flex items-center gap-2">
          {isEditingTitle ? (
            <div className="flex items-center gap-1">
              <Input
                className="h-8 w-64 text-sm font-semibold"
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
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSaveTitle}>
                <Check className="h-4 w-4 text-green-600" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                onClick={() => setIsEditingTitle(true)}
              >
                <Edit3 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Section Actions */}
        <div className="flex items-center gap-1 text-muted-foreground">
          {/* Reordering */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={isFirst}
            onClick={onMoveUp}
            title="Move Section Up"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={isLast}
            onClick={onMoveDown}
            title="Move Section Down"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>

          <span className="w-px h-4 bg-border mx-1"></span>

          {/* Layout Columns toggle */}
          <Button
            variant={section.layout === "1-col" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8 text-foreground"
            onClick={() => toggleLayout("1-col")}
            title="1 Column Layout"
          >
            <Grid2X2 className="h-4 w-4" />
          </Button>
          <Button
            variant={section.layout === "2-col" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8 text-foreground"
            onClick={() => toggleLayout("2-col")}
            title="2 Column Layout"
          >
            <Columns2 className="h-4 w-4" />
          </Button>

          <span className="w-px h-4 bg-border mx-1"></span>

          {/* Delete section */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDeleteSection(section.id)}
            title="Delete Section"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left panel / Fields container */}
          <div 
            ref={leftCol.ref}
            className={section.layout === "1-col" ? "md:col-span-2 space-y-4 min-h-[150px]" : "space-y-4 min-h-[150px]"}
          >
            <div 
              className="border border-dashed border-border/50 rounded-lg p-6 flex flex-col items-center justify-center text-center text-muted-foreground/45 bg-muted/5 h-full min-h-[120px]"
              style={{ display: leftFields.length === 0 ? "flex" : "none" }}
            >
              <p className="text-xs">Drag fields here</p>
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
                sampleRow={sampleRow}
              />
            ))}
          </div>

          {/* Right panel (if 2-col, render either KTP Preview or second field column or empty drop zone) */}
          {section.layout === "2-col" && (
            <div ref={rightCol.ref} className="h-full min-h-[150px]">
              <div className="space-y-4 h-full min-h-[150px]">
                <div 
                  className="border border-dashed border-border/75 rounded-lg p-8 flex flex-col items-center justify-center text-center text-muted-foreground/60 bg-muted/10 h-full min-h-[150px] hover:bg-muted/15 transition-all"
                  style={{ display: rightFields.length === 0 ? "flex" : "none" }}
                >
                  <p className="text-xs font-medium">Secondary column content area</p>
                  <p className="text-[10px] text-muted-foreground/50 mt-1">
                    Drag field elements here.
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
