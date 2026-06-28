"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FieldType, Section } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Type,
  Search,
  X,
  Save,
  Eye,
  ArrowLeft,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";



function HeaderItem({
  header,
  sampleVal,
  onAddField,
}: {
  header: string;
  sampleVal: any;
  onAddField: (type: FieldType, label: string, placeholder?: string) => void;
}) {
  return (
    <Button
      variant="ghost"
      className="justify-start gap-1 h-auto py-1.5 w-full hover:bg-muted font-medium text-xs text-foreground/80 px-2 flex flex-col items-start align-top select-none cursor-pointer"
      onClick={() => {
        onAddField("text", header, `Enter ${header}...`);
      }}
    >
      <div className="flex items-center gap-2 w-full">
        <Type className="h-3.5 w-3.5 text-primary/80 shrink-0" />
        <span className="truncate text-left font-semibold">
          {header}
        </span>
      </div>
      {sampleVal !== undefined &&
          sampleVal !== null &&
          String(sampleVal).trim() !== "" && (
            <span className="text-[10px] text-muted-foreground/60 pl-[18px] font-normal truncate max-w-full block text-left">
              Contoh:{" "}
              <span className="italic">"{String(sampleVal)}"</span>
            </span>
          )}
    </Button>
  );
}

interface ProfileBuilderSidebarProps {
  onAddField: (type: FieldType, label: string, placeholder?: string) => void;
  sections: Section[];
  programHeaders?: string[];
  sampleRow?: Record<string, any>;
  onSave?: () => void;
  isSaving?: boolean;
  onPreview?: () => void;
  onDiscardDraft?: () => void;
  hasDraft?: boolean;
  programId?: string | null;
}

export default function ProfileBuilderSidebar({
  onAddField,
  sections,
  programHeaders,
  sampleRow,
  onSave,
  isSaving = false,
  onPreview,
  onDiscardDraft,
  hasDraft = false,
  programId,
}: ProfileBuilderSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const usedLabels = new Set(
    sections.flatMap((section) =>
      section.fields.map((field) => field.label),
    ),
  );

  const hasDbHeaders =
    Array.isArray(programHeaders) && programHeaders.length > 0;
  const sourceHeaders = hasDbHeaders ? programHeaders : [];

  const filteredHeaders = sourceHeaders.filter(
    (header) =>
      header.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !usedLabels.has(header),
  );

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col shrink-0">
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        <div className="flex flex-col h-full space-y-2">
          {/* Sticky/Fixed Action Buttons */}
          <div className="flex flex-col gap-2 pb-3 mb-2 border-b border-border/70 shrink-0">
            {/* Top Row: Kembali, Reset, Preview */}
            <div className="flex items-center gap-1.5 w-full">
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="h-8 w-8 p-0 shrink-0"
                    >
                      <Link href={`/profile-builders`}>
                        <ArrowLeft className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Kembali ke List</TooltipContent>
                </Tooltip>

                {hasDraft && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onDiscardDraft}
                        className="h-8 w-8 p-0 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      Reset ke Tersimpan
                    </TooltipContent>
                  </Tooltip>
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onPreview}
                      className="h-8 flex-1 gap-1.5 px-2 text-xs"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Preview</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    Preview Layout Summary
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Bottom Row: Save Configuration */}
            <Button
              size="sm"
              onClick={onSave}
              disabled={isSaving}
              className="w-full h-8 text-xs font-semibold gap-1.5 bg-primary hover:bg-primary/95 text-primary-foreground shrink-0"
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {isSaving ? "Menyimpan..." : "Save Configuration"}
            </Button>
          </div>

          {programId ? (
            <>
              <div className="flex items-center justify-between px-2 mb-1 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-muted-foreground/85 uppercase tracking-wider">
                    Program Headers ({filteredHeaders.length})
                  </span>
                </div>
                {hasDbHeaders && (
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded font-bold border border-emerald-500/20 shrink-0">
                    DATABASE
                  </span>
                )}
              </div>

              {/* Search Input for Excel Headers */}
              <div className="px-2 mb-2 relative flex items-center shrink-0">
                <Search className="absolute left-4 h-3.5 w-3.5 text-muted-foreground/70 pointer-events-none" />
                <Input
                  placeholder="Search headers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 pr-8 text-xs font-sans"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 p-0.5 rounded-full hover:bg-muted text-muted-foreground/70 hover:text-foreground transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 grid grid-cols-1 gap-1 pr-1 border border-border/40 rounded-lg p-1.5 bg-muted/10 content-start">
                {filteredHeaders.map((header) => {
                  const sampleVal = sampleRow?.[header];
                  return (
                    <HeaderItem
                      key={header}
                      header={header}
                      sampleVal={sampleVal}
                      onAddField={onAddField}
                    />
                  );
                })}
                {filteredHeaders.length === 0 && (
                  <div className="text-[10px] text-muted-foreground/50 text-center py-4">
                    No headers found
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-4 border border-dashed rounded-lg bg-muted/5 text-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Program Belum Dipilih</span>
              <span className="text-[10px] text-muted-foreground/75 leading-normal">
                Silakan pilih program terlebih dahulu di menu Pengaturan untuk memuat kolom header data.
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
