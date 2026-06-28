"use client";

import React from "react";
import { Section } from "../types";
import ProfileBuilderSection from "./profile-builder-section";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useAutoAnimate } from "@formkit/auto-animate/react";

interface ProfileBuilderCanvasProps {
  sections: Section[];
  activeSectionId: string | null;
  setActiveSectionId: (id: string | null) => void;
  onUpdateSection: (index: number, updatedSection: Section) => void;
  onDeleteSection: (index: number) => void;
  onMoveSection: (index: number, direction: "up" | "down") => void;
  onAddSection: (layout: "1-col" | "2-col") => void;
  onMoveField: (sectionId: string, fieldId: string, direction: "up" | "down") => void;
  onMoveFieldColumn: (sectionId: string, fieldId: string, column: "left" | "right") => void;
  sampleRow?: Record<string, any>;
  programHeaders?: string[];
}

export default function ProfileBuilderCanvas({
  sections,
  activeSectionId,
  setActiveSectionId,
  onUpdateSection,
  onDeleteSection,
  onMoveSection,
  onAddSection,
  onMoveField,
  onMoveFieldColumn,
  sampleRow,
  programHeaders,
}: ProfileBuilderCanvasProps) {
  const [parentRef] = useAutoAnimate();

  return (
    <main className="flex-1 overflow-y-auto bg-background p-8 relative">
      <div ref={parentRef} className="w-full space-y-6 pb-32">
        {/* Render sections list */}
        {sections.map((section, index) => (
          <ProfileBuilderSection
            key={section.id}
            section={section}
            index={index}
            isActive={section.id === activeSectionId}
            onSelectActive={() => setActiveSectionId(section.id)}
            onUpdateSection={(updatedSec) => onUpdateSection(index, updatedSec)}
            onDeleteSection={() => onDeleteSection(index)}
            onMoveUp={() => onMoveSection(index, "up")}
            onMoveDown={() => onMoveSection(index, "down")}
            onMoveField={(fieldId, direction) => onMoveField(section.id, fieldId, direction)}
            onMoveFieldColumn={(fieldId, column) => onMoveFieldColumn(section.id, fieldId, column)}
            isFirst={index === 0}
            isLast={index === sections.length - 1}
            sampleRow={sampleRow}
            programHeaders={programHeaders}
          />
        ))}

        {/* Add Section Action Area at Bottom */}
        <div className="pt-4 flex justify-center">
          <Button
            variant="outline"
            className="flex items-center gap-2 px-8 py-6 border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/10 rounded-xl text-primary font-semibold text-xs transition-all"
            onClick={() => onAddSection("1-col")}
          >
            <PlusCircle className="h-5 w-5" />
            Add New Section
          </Button>
        </div>
      </div>
    </main>
  );
}
