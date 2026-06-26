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
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

export default function ImportProgramPage() {
  const router = useRouter();

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [rawUrlOrId, setRawUrlOrId] = React.useState("");
  const [sheetId, setSheetId] = React.useState("");
  const [sheetName, setSheetName] = React.useState("");
  const [sheetUniqueKey, setSheetUniqueKey] = React.useState("");

  // Loading and option states
  const [tabs, setTabs] = React.useState<string[]>([]);
  const [headersList, setHeadersList] = React.useState<string[]>([]);
  const [isLoadingTabs, setIsLoadingTabs] = React.useState(false);
  const [isLoadingHeaders, setIsLoadingHeaders] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const extractSheetId = (urlOrId: string) => {
    const match = urlOrId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : urlOrId.trim();
  };

  const handleLoadTabs = async () => {
    const id = extractSheetId(rawUrlOrId);
    if (!id) {
      toast.error("Masukkan URL atau ID Spreadsheet yang valid.");
      return;
    }
    setSheetId(id);
    setIsLoadingTabs(true);
    setTabs([]);
    setSheetName("");
    setHeadersList([]);
    setSheetUniqueKey("");

    try {
      const res = await fetch(`/api/google-sheets/tabs?sheetId=${id}`);
      const data = await res.json();
      if (res.ok) {
        setTabs(data.tabs || []);
        if (data.tabs?.length > 0) {
          toast.success("Daftar tab berhasil dimuat!");
        } else {
          toast.error("Spreadsheet tidak memiliki tab.");
        }
      } else {
        toast.error(data.error || "Gagal memuat daftar tab.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan koneksi saat memuat tab.");
    } finally {
      setIsLoadingTabs(false);
    }
  };

  const handleTabChange = async (selectedTab: string) => {
    setSheetName(selectedTab);
    setHeadersList([]);
    setSheetUniqueKey("");

    if (!selectedTab) return;

    setIsLoadingHeaders(true);
    try {
      const res = await fetch(`/api/google-sheets/headers?sheetId=${sheetId}&sheetName=${encodeURIComponent(selectedTab)}`);
      const data = await res.json();
      if (res.ok) {
        setHeadersList(data.headers || []);
        if (data.headers?.length > 0) {
          setSheetUniqueKey(data.headers[0]); // Select first header as default
        }
      } else {
        toast.error(data.error || "Gagal memuat daftar kolom.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan koneksi saat memuat kolom.");
    } finally {
      setIsLoadingHeaders(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetId || !sheetName || !sheetUniqueKey) {
      toast.error("Harap lengkapi semua konfigurasi Google Sheet.");
      return;
    }
    setIsSubmitting(true);

    const toastId = toast.loading("Menghubungkan Google Sheet dan meng-import data cache...");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    try {
      const res = await fetch("/api/programs/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          name,
          description,
          sheetId,
          sheetName,
          sheetUniqueKey,
        }),
      });

      clearTimeout(timeoutId);
      const data = await res.json();

      if (res.ok) {
        toast.success(`Program "${name}" berhasil dibuat dan disinkronisasikan!`, { id: toastId });
        router.push("/programs");
      } else {
        toast.error(data.error || "Gagal menghubungkan Google Sheet.", { id: toastId });
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        console.error("[import] Request timed out after 30s:", err);
        toast.error("Permintaan memakan waktu terlalu lama (timeout 30 detik). Coba lagi atau periksa ukuran data Sheet.", { id: toastId });
      } else {
        console.error("[import] Fetch error:", err);
        toast.error("Terjadi kesalahan koneksi saat membuat program.", { id: toastId });
      }
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
                <Label htmlFor="rawUrlOrId">Google Spreadsheet URL / ID</Label>
                <div className="flex gap-2">
                  <Input
                    id="rawUrlOrId"
                    placeholder="Masukkan URL atau ID Spreadsheet"
                    value={rawUrlOrId}
                    onChange={(e) => setRawUrlOrId(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    onClick={handleLoadTabs}
                    disabled={isLoadingTabs || !rawUrlOrId}
                    className="shrink-0"
                  >
                    {isLoadingTabs ? (
                      <Loader2Icon className="h-4 w-4 animate-spin mr-1" />
                    ) : null}
                    Muat Daftar Tab
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Tempelkan URL Google Spreadsheet Anda ke kolom di atas.
                </p>
              </div>

              {tabs.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2 flex flex-col">
                    <Label htmlFor="sheetName">Nama Tab / Worksheet</Label>
                    <NativeSelect
                      id="sheetName"
                      value={sheetName}
                      onChange={(e) => handleTabChange(e.target.value)}
                      required
                      className="w-full"
                    >
                      <NativeSelectOption value="">-- Pilih Tab --</NativeSelectOption>
                      {tabs.map((tab) => (
                        <NativeSelectOption key={tab} value={tab}>
                          {tab}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </div>

                  {sheetName && (
                    <div className="space-y-2 flex flex-col">
                      <Label htmlFor="sheetUniqueKey">
                        Kolom ID Unik (Primary Key)
                        {isLoadingHeaders && (
                          <Loader2Icon className="inline h-3.5 w-3.5 animate-spin ml-1.5 text-muted-foreground" />
                        )}
                      </Label>
                      <NativeSelect
                        id="sheetUniqueKey"
                        value={sheetUniqueKey}
                        onChange={(e) => setSheetUniqueKey(e.target.value)}
                        required
                        className="w-full"
                        disabled={isLoadingHeaders || headersList.length === 0}
                      >
                        {headersList.length === 0 ? (
                          <NativeSelectOption value="">-- Memuat Kolom... --</NativeSelectOption>
                        ) : (
                          <>
                            {headersList.map((header) => (
                              <NativeSelectOption key={header} value={header}>
                                {header}
                              </NativeSelectOption>
                            ))}
                          </>
                        )}
                      </NativeSelect>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || !sheetId || !sheetName || !sheetUniqueKey}
                  className="w-full gap-2"
                >
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
