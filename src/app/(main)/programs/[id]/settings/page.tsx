"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  RefreshCwIcon,
  SaveIcon,
  SettingsIcon,
  DatabaseIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  HistoryIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useProgram } from "@/hooks/use-programs";
import { toast } from "sonner";

interface SheetConfig {
  sheetId: string;
  sheetName: string;
  sheetUniqueKey: string;
  sheetLastSyncAt: string | null;
}

export default function ProgramSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const { data: program, isLoading: isProgramLoading, refetch: refetchProgram } = useProgram(id);

  const [sheetId, setSheetId] = React.useState("");
  const [sheetName, setSheetName] = React.useState("");
  const [sheetUniqueKey, setSheetUniqueKey] = React.useState("");
  const [lastSyncAt, setLastSyncAt] = React.useState<string | null>(null);

  const [isSaving, setIsSaving] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);

  // Load existing config
  React.useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch(`/api/programs/${id}/sheet`);
        if (res.ok) {
          const data: SheetConfig = await res.json();
          setSheetId(data.sheetId || "");
          setSheetName(data.sheetName || "");
          setSheetUniqueKey(data.sheetUniqueKey || "");
          setLastSyncAt(data.sheetLastSyncAt);
        }
      } catch (err) {
        console.error("Failed to load sheet config", err);
      }
    }
    loadConfig();
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch(`/api/programs/${id}/sheet`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sheetId,
          sheetName,
          sheetUniqueKey,
        }),
      });

      if (res.ok) {
        toast.success("Konfigurasi Google Sheet berhasil disimpan");
        refetchProgram();
      } else {
        const data = await res.json();
        toast.error(data.error || "Gagal menyimpan konfigurasi");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan saat menyimpan konfigurasi");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSync = async () => {
    if (!sheetId || !sheetName || !sheetUniqueKey) {
      toast.error("Mohon lengkapi konfigurasi Sheet ID, Nama Tab, dan Kolom ID Unik sebelum melakukan sinkronisasi.");
      return;
    }

    setIsSyncing(true);
    const toastId = toast.loading("Mensinkronisasikan data dari Google Sheet...");

    try {
      const res = await fetch(`/api/programs/${id}/sheet/sync`, {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(data.message || "Sinkronisasi berhasil", { id: toastId });
        setLastSyncAt(new Date().toISOString());
        refetchProgram();
      } else {
        toast.error(data.error || "Gagal melakukan sinkronisasi", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan koneksi saat sinkronisasi", { id: toastId });
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSync = (dateString: string | null) => {
    if (!dateString) return "Belum pernah disinkronisasikan";
    return new Date(dateString).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  if (isProgramLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <RefreshCwIcon className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
                <BreadcrumbLink asChild>
                  <Link href={`/programs/${id}/verification`}>{program?.name || "Program"}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Settings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      {/* ── Content ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild className="h-8 w-8">
            <Link href="/programs">
              <ArrowLeftIcon className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Program Settings</h1>
            <p className="text-muted-foreground mt-0.5">
              Kelola sumber data Google Sheet dan pemetaan kolom evaluasi untuk program <span className="font-semibold">{program?.name}</span>.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Form Config */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5 text-primary" />
                  Google Sheet Integration
                </CardTitle>
                <CardDescription>
                  Hubungkan Google Sheet sebagai basis data (master). Perubahan data evaluasi akan otomatis ditulis kembali ke kolom Sheet yang terdaftar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sheetId">Google Spreadsheet ID</Label>
                    <Input
                      id="sheetId"
                      placeholder="Masukkan ID Spreadsheet (contoh: 1aBcDeFgHiJkLmNoP...)"
                      value={sheetId}
                      onChange={(e) => setSheetId(e.target.value)}
                      required
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Dapatkan ID ini dari URL spreadsheet Anda: https://docs.google.com/spreadsheets/d/<span className="font-bold text-foreground">[Spreadsheet-ID]</span>/edit
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



                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={isSaving} className="gap-2">
                      {isSaving ? (
                        <RefreshCwIcon className="h-4 w-4 animate-spin" />
                      ) : (
                        <SaveIcon className="h-4 w-4" />
                      )}
                      Simpan Konfigurasi
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sync Stats panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DatabaseIcon className="h-5 w-5 text-primary" />
                  Status Cache & Sync
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-muted/50 p-4 border space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-medium">Jumlah Baris Cache:</span>
                    <span className="font-bold text-foreground">{(program?.totalRows ?? 0).toLocaleString("id-ID")} baris</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-medium">Jumlah Kolom Cache:</span>
                    <span className="font-bold text-foreground">{program?.fieldCount ?? 0} kolom</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-medium">Jumlah Validation Error:</span>
                    <span className={`font-bold ${program?.errorCount && program.errorCount > 0 ? "text-rose-500" : "text-emerald-500"}`}>
                      {program?.errorCount ?? 0} baris
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Sync Terakhir</span>
                  <div className="flex items-start gap-2 text-xs">
                    {lastSyncAt ? (
                      <CheckCircle2Icon className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    ) : (
                      <AlertTriangleIcon className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    )}
                    <span className="font-medium text-foreground/80 break-all">
                      {formatLastSync(lastSyncAt)}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="w-full gap-2"
                  variant="outline"
                >
                  <RefreshCwIcon className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                  Sync / Tarik Data Sekarang
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <HistoryIcon className="h-4 w-4 text-muted-foreground" />
                  Petunjuk Penggunaan
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed space-y-2">
                <p>
                  1. Pastikan Anda sudah memberikan akses akses edit ke file Google Sheet untuk verifikator Anda.
                </p>
                <p>
                  2. Kolom ID unik diisi persis seperti header kolom di Google Sheet. Nama bersifat case-sensitive.
                </p>
                <p>
                  3. Saat halaman verifikasi dibuka, program otomatis menarik data paling baru dari Sheet ke database cache lokal.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
