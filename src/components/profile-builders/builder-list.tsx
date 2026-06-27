"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  LayoutTemplateIcon,
  SearchIcon,
  SettingsIcon,
  Trash2Icon,
  CalendarIcon,
  LinkIcon,
  Loader2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatShortDate } from "@/lib/utils";
import { type ProfileBuilder } from "@/types";

interface BuilderListProps {
  builders: ProfileBuilder[];
  isLoading: boolean;
  onDelete: (id: string, name: string) => void;
  isDeleting: boolean;
  onOpenCreateDialog: () => void;
}

export function BuilderList({
  builders,
  isLoading,
  onDelete,
  isDeleting,
  onOpenCreateDialog,
}: BuilderListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBuilders = builders.filter((b) => {
    const query = searchQuery.toLowerCase();
    return (
      b.name.toLowerCase().includes(query) ||
      (b.description && b.description.toLowerCase().includes(query)) ||
      (b.program?.name && b.program.name.toLowerCase().includes(query))
    );
  });

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3 border-b bg-muted/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Daftar Profile Builder</CardTitle>
            <CardDescription>Kelola layout dan kustomisasi formulir evaluasi per program</CardDescription>
          </div>
          <div className="flex max-w-xs items-center gap-2">
            <SearchIcon className="size-4 text-muted-foreground" />
            <Input
              placeholder="Cari profile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
            <Loader2Icon className="size-8 animate-spin" />
            <p className="text-sm">Memuat data...</p>
          </div>
        ) : filteredBuilders.length === 0 ? (
          <div className="flex h-60 flex-col items-center justify-center gap-2 text-muted-foreground py-10">
            <LayoutTemplateIcon className="size-12 stroke-[1.2] opacity-40 mb-2" />
            <p className="text-sm font-medium">Belum ada Profile Builder yang terdaftar.</p>
            <p className="text-xs max-w-xs text-center text-muted-foreground mb-4">
              Mulai dengan membuat profile kustom baru untuk memetakan kolom excel data program Anda.
            </p>
            <Button variant="outline" size="sm" onClick={onOpenCreateDialog}>
              Buat sekarang
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {filteredBuilders.map((builder) => (
              <div
                key={builder.id}
                className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="font-semibold text-foreground truncate max-w-md">
                    {builder.name}
                  </span>
                  <span className="text-xs text-muted-foreground line-clamp-1 max-w-lg">
                    {builder.description || "Tidak ada deskripsi"}
                  </span>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground items-center">
                    <span className="flex items-center gap-1 bg-muted/40 px-2 py-0.5 rounded-sm">
                      <LinkIcon className="size-3" />
                      {builder.program ? (
                        <span className="text-primary font-medium">{builder.program.name}</span>
                      ) : (
                        <span className="italic">Tidak Terhubung</span>
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="size-3" />
                      Terakhir diubah: {formatShortDate(builder.updatedAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/builder?builderId=${builder.id}`}>
                      <SettingsIcon className="mr-1.5 size-3.5" />
                      Edit Layout
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10"
                        disabled={isDeleting}
                      >
                        <Trash2Icon className="size-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Profile Builder</AlertDialogTitle>
                        <AlertDialogDescription>
                          Apakah Anda yakin ingin menghapus Profile Builder &quot;{builder.name}
                          &quot;? Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          onClick={() => onDelete(builder.id, builder.name)}
                        >
                          Hapus
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
