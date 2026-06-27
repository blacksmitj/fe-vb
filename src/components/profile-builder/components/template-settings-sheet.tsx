"use client";

import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Program {
  id: string;
  name: string;
}

interface TemplateSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: {
    id: string;
    name: string;
    description?: string;
  } | null;
  programsUsingTemplate?: Program[];
  selectedProgramId: string | null;
  onSelectedProgramChange: (programId: string) => void;
  onSave?: (updatedData: { name: string; description: string }) => void;
}

export function TemplateSettingsSheet({
  open,
  onOpenChange,
  template,
  programsUsingTemplate,
  selectedProgramId,
  onSelectedProgramChange,
  onSave,
}: TemplateSettingsSheetProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Sync local state when template changes
  useEffect(() => {
    if (template) {
      setName(template.name || "");
      setDescription(template.description || "");
    }
  }, [template]);

  const handleSave = async () => {
    if (!template) return;

    if (!name.trim()) {
      toast.error("Nama template tidak boleh kosong");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/profile-templates/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to update template");

      if (onSave) {
        onSave({ name, description: description.trim() });
      }

      toast.success("Pengaturan template berhasil disimpan!");
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving template settings:", error);
      toast.error("Gagal menyimpan pengaturan template");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Pengaturan Template</SheetTitle>
          <SheetDescription>
            {template
              ? `Mengedit template "${template.name}"`
              : "Konfigurasi pengaturan template profile"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-5 px-4 py-4 overflow-y-auto">
          {/* Template Name */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="template-name">Nama Template</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama template"
            />
          </div>

          {/* Template Description */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="template-description">Deskripsi</Label>
            <textarea
              id="template-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Masukkan deskripsi template (opsional)"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>

          {/* Separator */}
          <div className="h-px bg-border my-2" />

          {/* Program Preview Selector */}
          <div className="flex flex-col gap-2">
            <Label>Program untuk Preview</Label>
            <p className="text-xs text-muted-foreground -mt-1">
              Pilih program yang datanya akan digunakan sebagai preview
            </p>
            <Select value={selectedProgramId || ""} onValueChange={onSelectedProgramChange}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih program..." />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4}>
                {programsUsingTemplate && programsUsingTemplate.length > 0 ? (
                  programsUsingTemplate.map((prog) => (
                    <SelectItem key={prog.id} value={prog.id}>
                      {prog.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    {programsUsingTemplate === undefined ? "Memuat..." : "Tidak ada program"}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <SheetFooter>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !name.trim()}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Simpan
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
