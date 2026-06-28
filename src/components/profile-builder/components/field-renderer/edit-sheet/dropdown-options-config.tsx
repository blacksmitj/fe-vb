"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { dropdownColorMap } from "../shared";

interface DropdownOptionsConfigProps {
  editOptions: string[];
  editOptionColors: Record<string, string>;
  optionsBulkText: string;
  newOptionText: string;
  onBulkChange: (text: string) => void;
  onNewOptionChange: (text: string) => void;
  onAddOption: () => void;
  onRemoveOption: (index: number) => void;
  onColorChange: (opt: string, colorKey: string) => void;
}

/** UI for configuring dropdown options: bulk textarea, add-single, and color list */
export function DropdownOptionsConfig({
  editOptions,
  editOptionColors,
  optionsBulkText,
  newOptionText,
  onBulkChange,
  onNewOptionChange,
  onAddOption,
  onRemoveOption,
  onColorChange,
}: DropdownOptionsConfigProps) {
  return (
    <div className="space-y-4 border border-border/50 rounded-lg p-3.5 bg-muted/25">
      <div className="space-y-1">
        <Label className="text-xs font-semibold flex items-center gap-1.5">
          <List className="h-3.5 w-3.5 text-primary" />
          Dropdown Options Config
        </Label>
        <p className="text-[10px] text-muted-foreground leading-normal">
          Manage options for the dropdown field. You can paste multiple values in bulk (one per line) or
          add them one-by-one.
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
          wrap="off"
          value={optionsBulkText}
          onChange={(e) => onBulkChange(e.target.value)}
          placeholder={"Option 1\nOption 2\nOption 3"}
          className="text-xs font-mono font-medium resize-y w-full max-w-full overflow-x-auto"
        />
      </div>

      {/* Add Single Option */}
      <div className="grid gap-1.5">
        <Label className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wide">
          Add Single Option
        </Label>
        <div className="flex gap-1.5">
          <Input
            value={newOptionText}
            onChange={(e) => onNewOptionChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onAddOption();
              }
            }}
            placeholder="Type option value..."
            className="h-8 text-xs"
          />
          <Button
            type="button"
            size="sm"
            onClick={onAddOption}
            className="h-8 gap-1 text-xs shrink-0 bg-primary/95 text-primary-foreground hover:bg-primary"
          >
            <Plus className="h-3 w-3" /> Add
          </Button>
        </div>
      </div>

      {/* Options List */}
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
            <div
              key={idx}
              className="flex items-center justify-between py-1.5 px-2 group/opt hover:bg-muted/35 rounded text-xs gap-2"
            >
              <span className="font-medium truncate text-foreground/85 max-w-[45%] flex-1">
                <span className="text-[10px] text-muted-foreground font-mono mr-1">{idx + 1}.</span>
                {opt}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                {Object.keys(dropdownColorMap).map((colorKey) => {
                  const isSelected = (editOptionColors[opt] || "gray") === colorKey;
                  return (
                    <button
                      key={colorKey}
                      type="button"
                      onClick={() => onColorChange(opt, colorKey)}
                      className={cn(
                        "w-3 h-3 rounded-full border transition-all shrink-0 cursor-pointer",
                        dropdownColorMap[colorKey],
                        isSelected
                          ? "ring-1 ring-primary ring-offset-1 ring-offset-background scale-110 border-transparent"
                          : "opacity-35 hover:opacity-100 hover:scale-105 border-border"
                      )}
                      title={colorKey}
                    />
                  );
                })}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 ml-1 text-muted-foreground hover:text-destructive hover:bg-destructive/15 transition-colors"
                  onClick={() => onRemoveOption(idx)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
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
  );
}
