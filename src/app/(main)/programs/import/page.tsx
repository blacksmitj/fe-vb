"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  Loader2Icon,
  DatabaseIcon,
  LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { toast } from "sonner";

export default function ImportProgramPage() {
  const router = useRouter();

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [sheetId, setSheetId] = React.useState("");
  const [sheetName, setSheetName] = React.useState("");
  const [sheetUniqueKey, setSheetUniqueKey] = React.useState("");
  const [sheetEvalStatusCol, setSheetEvalStatusCol] = React.useState("");
  const [sheetEvalDescCol, setSheetEvalDescCol] = React.useState("");

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const toastId = toast.loading("Menghubungkan Google Sheet dan meng-import data cache...");

    try {
      const res = await fetch("/api/programs/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          sheetId,
          sheetName,
          sheetUniqueKey,
          sheetEvalStatusCol: sheetEvalStatusCol || null,
          sheetEvalDescCol: sheetEvalDescCol || null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Program "${name}" berhasil dibuat dan disinkronisasikan!`, { id: toastId });
        router.push("/programs");
      } else {
        toast.error(data.error || "Gagal menghubungkan Google Sheet.", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan koneksi saat membuat program.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden font-sans">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-6 bg-background">
        <div className="flex items-center gap-2 px-1">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link href="/programs">Programs</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Connect Google Sheet</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      {/* ── Content ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild className="h-8 w-8">
            <Link href="/programs">
              <ArrowLeftIcon className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Hubungkan Google Sheet</h1>
            <p className="text-muted-foreground mt-0.5">
              Buat program verifikasi baru dengan menghubungkan data langsung dari Google Sheet.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-primary" />
              Informasi Google Sheet Program
            </CardTitle>
            <CardDescription>
              Isi data detail di bawah. Aplikasi akan melakukan pull sinkronisasi data awal saat program pertama kali disimpan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Program / Event</Label>
                <Input
                  id="name"
                  placeholder="Contoh: Seleksi Peserta Beasiswa 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Input
                  id="description"
                  placeholder="Deskripsi singkat mengenai program..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <Separator className="my-2" />

              <div className="space-y-2">
                <Label htmlFor="sheetId">Google Spreadsheet ID</Label>
                <Input
                  id="sheetId"
                  placeholder="Masukkan ID Spreadsheet"
                  value={sheetId}
                  onChange={(e) => setSheetId(e.target.value)}
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  Dapatkan ID ini dari URL file Sheet Anda.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sheetName">Nama Tab / Worksheet</Label>
                  <Input
                    id="sheetName"
                    placeholder="Contoh: Sheet1, Peserta"
                    value={sheetName}
                    onChange={(e) => setSheetName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sheetUniqueKey">Kolom ID Unik (Primary Key)</Label>
                  <Input
                    id="sheetUniqueKey"
                    placeholder="Contoh: NIK, ID_PESERTA"
                    value={sheetUniqueKey}
                    onChange={(e) => setSheetUniqueKey(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Separator className="my-2" />

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Pemetaan Kolom Evaluasi (Opsional)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sheetEvalStatusCol">Kolom Status Verifikasi</Label>
                    <Input
                      id="sheetEvalStatusCol"
                      placeholder="Contoh: STATUS_VERIFIKASI"
                      value={sheetEvalStatusCol}
                      onChange={(e) => setSheetEvalStatusCol(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sheetEvalDescCol">Kolom Keterangan / Catatan</Label>
                    <Input
                      id="sheetEvalDescCol"
                      placeholder="Contoh: CATATAN_VERIFIKATOR"
                      value={sheetEvalDescCol}
                      onChange={(e) => setSheetEvalDescCol(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
                  {isSubmitting ? (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  ) : (
                    <DatabaseIcon className="h-4 w-4" />
                  )}
                  Simpan & Sync Data Awal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
