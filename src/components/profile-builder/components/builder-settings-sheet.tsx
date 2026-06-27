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
import { usePrograms } from "@/hooks/use-programs";

interface Program {
  id: string;
  name: string;
}

interface BuilderSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  builder: {
    id: string;
    name: string;
    description?: string;
    programId: string | null;
  } | null;
  onSave?: (updatedData: { name: string; description: string; programId: string | null }) => void;
}

export function BuilderSettingsSheet({
  open,
  onOpenChange,
  builder,
  onSave,
}: BuilderSettingsSheetProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [programId, setProgramId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch all programs for selection dropdown
  const { data: allPrograms = [], isLoading: isLoadingPrograms } = usePrograms();

  // Sync local state when builder changes
  useEffect(() => {
    if (builder) {
      setName(builder.name || "");
      setDescription(builder.description || "");
      setProgramId(builder.programId);
    }
  }, [builder]);

  const handleSave = async () => {
    if (!builder) return;

    if (!name.trim()) {
      toast.error("Nama profile builder tidak boleh kosong");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/profile-builders/${builder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          programId: programId === "none" ? null : programId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile builder");
      }

      if (onSave) {
        onSave({
          name: data.name,
          description: data.description,
          programId: data.programId,
        });
      }

      toast.success("Pengaturan Profile Builder berhasil disimpan!");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving builder settings:", error);
      toast.error(error.message || "Gagal menyimpan pengaturan");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Pengaturan Profile Builder</SheetTitle>
          <SheetDescription>
            {builder
              ? `Mengedit konfigurasi "${builder.name}"`
              : "Konfigurasi pengaturan profile builder"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-5 px-4 py-4 overflow-y-auto">
          {/* Builder Name */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="builder-name">Nama Profile Builder</Label>
            <Input
              id="builder-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama"
            />
          </div>

          {/* Builder Description */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="builder-description">Deskripsi</Label>
            <textarea
              id="builder-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Masukkan deskripsi (opsional)"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>

          {/* Separator */}
          <div className="h-px bg-border my-2" />

          {/* Program Linkage */}
          <div className="flex flex-col gap-2">
            <Label>Program Terhubung</Label>
            <p className="text-xs text-muted-foreground -mt-1">
              Pilih program untuk mengisi header kolom yang bisa ditambahkan ke canvas.
            </p>
            <Select
              value={programId || "none"}
              onValueChange={(val) => setProgramId(val === "none" ? null : val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih program..." />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4}>
                <SelectItem value="none">Tidak Terhubung (Kosong)</SelectItem>
                {isLoadingPrograms ? (
                  <SelectItem value="loading" disabled>
                    Memuat program...
                  </SelectItem>
                ) : (
                  allPrograms.map((prog) => (
                    <SelectItem key={prog.id} value={prog.id}>
                      {prog.name}
                    </SelectItem>
                  ))
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
