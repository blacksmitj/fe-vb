"use client";

import React, { useState } from "react";
import { PlusIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Program } from "@/types";

interface CreateBuilderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allPrograms: Program[];
  isLoadingPrograms: boolean;
  isPending: boolean;
  onSubmit: (data: { name: string; description: string; programId: string }) => void;
}

export function CreateBuilderDialog({
  open,
  onOpenChange,
  allPrograms,
  isLoadingPrograms,
  isPending,
  onSubmit,
}: CreateBuilderDialogProps) {
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [selectedProgramId, setSelectedProgramId] = useState<string>("none");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onSubmit({
      name: newName.trim(),
      description: newDescription.trim(),
      programId: selectedProgramId === "none" ? "none" : selectedProgramId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon className="mr-1.5 size-4" />
          Buat Profile Builder
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Buat Profile Builder Baru</DialogTitle>
            <DialogDescription>
              Masukkan detail profile form kustom. Anda bisa menautkan program Excel untuk mengambil data header-nya.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Field>
              <FieldLabel htmlFor="name">
                Nama Profile Builder <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="name"
                placeholder="Contoh: Form Evaluasi NIK/Penerima"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="description">Deskripsi</FieldLabel>
              <Input
                id="description"
                placeholder="Penjelasan singkat mengenai form ini"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel>Hubungkan Program (Opsional)</FieldLabel>
              <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih program untuk mengambil header..." />
                </SelectTrigger>
                <SelectContent>
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
            </Field>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isPending || !newName.trim()}>
              {isPending ? (
                <>
                  <Loader2Icon className="mr-1.5 size-4 animate-spin" />
                  Membuat...
                </>
              ) : (
                "Buat & Mulai Edit"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
