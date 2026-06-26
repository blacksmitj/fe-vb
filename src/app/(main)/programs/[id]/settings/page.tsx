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
  UsersIcon,
  ActivityIcon,
  CheckIcon,
  XIcon,
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MembershipGate } from "@/components/programs/membership-gate";

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

  // Tabs state
  const [activeTab, setActiveTab] = React.useState("integration"); // "integration" | "members" | "logs"
  const [userRole, setUserRole] = React.useState<string | null>(null);
  const [members, setMembers] = React.useState<any[]>([]);
  const [isMembersLoading, setIsMembersLoading] = React.useState(false);
  const [logs, setLogs] = React.useState<any[]>([]);
  const [isLogsLoading, setIsLogsLoading] = React.useState(false);

  // Fetch current user's role
  React.useEffect(() => {
    async function fetchRole() {
      try {
        const res = await fetch(`/api/programs/${id}/membership`);
        if (res.ok) {
          const data = await res.json();
          setUserRole(data.role);
        }
      } catch (err) {
        console.error("Failed to fetch user role", err);
      }
    }
    fetchRole();
  }, [id]);

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

  // Fetch program members
  const fetchMembers = React.useCallback(async () => {
    setIsMembersLoading(true);
    try {
      const res = await fetch(`/api/programs/${id}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (err) {
      console.error("Failed to fetch members", err);
      toast.error("Gagal memuat daftar anggota");
    } finally {
      setIsMembersLoading(false);
    }
  }, [id]);

  // Fetch activity logs
  const fetchLogs = React.useCallback(async () => {
    setIsLogsLoading(true);
    try {
      const res = await fetch(`/api/programs/${id}/logs`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error("Failed to fetch logs", err);
      toast.error("Gagal memuat log aktivitas");
    } finally {
      setIsLogsLoading(false);
    }
  }, [id]);

  // Refetch when tab changes
  React.useEffect(() => {
    if (activeTab === "members" && userRole === "ADMIN") {
      fetchMembers();
    } else if (activeTab === "logs") {
      fetchLogs();
    }
  }, [activeTab, userRole, fetchMembers, fetchLogs]);

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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    try {
      const res = await fetch(`/api/programs/${id}/sheet/sync`, {
        method: "POST",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(data.message || "Sinkronisasi berhasil", { id: toastId });
        setLastSyncAt(new Date().toISOString());
        refetchProgram();
      } else {
        toast.error(data.error || "Gagal melakukan sinkronisasi", { id: toastId });
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        console.error("[settings/sync] Request timed out after 30s:", err);
        toast.error("Sinkronisasi memakan waktu terlalu lama (timeout 30 detik). Coba lagi.", { id: toastId });
      } else {
        console.error("[settings/sync] Fetch error:", err);
        toast.error("Terjadi kesalahan koneksi saat sinkronisasi", { id: toastId });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleMemberAction = async (memberId: string, status: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch(`/api/programs/${id}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, status }),
      });
      if (res.ok) {
        toast.success(`Pendaftaran verifikator berhasil di-${status === "APPROVED" ? "setujui" : "tolak"}`);
        fetchMembers();
      } else {
        const data = await res.json();
        toast.error(data.error || "Gagal memperbarui status keanggotaan");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan saat memproses status keanggotaan");
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

  const formatTimestamp = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isProgramLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <RefreshCwIcon className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <MembershipGate programId={id}>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" asChild className="h-8 w-8">
              <Link href={`/programs/${id}/verification`}>
                <ArrowLeftIcon className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Program Settings</h1>
              <p className="text-muted-foreground mt-0.5">
                Kelola konfigurasi, keanggotaan verifikator, dan audit log program <span className="font-semibold">{program?.name}</span>.
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-border/60 pb-px gap-1">
            <Button
              variant="ghost"
              onClick={() => setActiveTab("integration")}
              className={`h-9 px-4 rounded-none border-b-2 font-medium text-sm transition-all ${
                activeTab === "integration"
                  ? "border-primary text-foreground bg-muted/40"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <SettingsIcon className="h-4 w-4 mr-2" />
              Integrasi Sheet
            </Button>

            {userRole === "ADMIN" && (
              <Button
                variant="ghost"
                onClick={() => setActiveTab("members")}
                className={`h-9 px-4 rounded-none border-b-2 font-medium text-sm transition-all ${
                  activeTab === "members"
                    ? "border-primary text-foreground bg-muted/40"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <UsersIcon className="h-4 w-4 mr-2" />
                Anggota
              </Button>
            )}

            <Button
              variant="ghost"
              onClick={() => setActiveTab("logs")}
              className={`h-9 px-4 rounded-none border-b-2 font-medium text-sm transition-all ${
                activeTab === "logs"
                  ? "border-primary text-foreground bg-muted/40"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <ActivityIcon className="h-4 w-4 mr-2" />
              Log Aktivitas
            </Button>
          </div>

          {/* TAB 1: INTEGRATION CONFIG */}
          {activeTab === "integration" && (
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
                      1. Pastikan Anda sudah memberikan akses edit ke file Google Sheet untuk verifikator Anda.
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
          )}

          {/* TAB 2: MEMBERS APPROVAL LIST */}
          {activeTab === "members" && userRole === "ADMIN" && (
            <Card className="border border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <UsersIcon className="h-5 w-5 text-primary" />
                  Daftar Pendaftar & Verifikator
                </CardTitle>
                <CardDescription>
                  Kelola pendaftar baru yang ingin berkontribusi melakukan verifikasi data pada program ini.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isMembersLoading ? (
                  <div className="flex h-48 items-center justify-center">
                    <RefreshCwIcon className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : members.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                    Belum ada anggota atau pendaftaran untuk program ini.
                  </div>
                ) : (
                  <div className="rounded-md border bg-card">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User / Pendaftar</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Tanggal Daftar</TableHead>
                          <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {members.map((member) => (
                          <TableRow key={member.id}>
                            <TableCell className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={member.user.image || ""} />
                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                  {member.user.name?.slice(0, 2).toUpperCase() || "US"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="font-medium text-sm text-foreground">{member.user.name}</span>
                                <span className="text-[11px] text-muted-foreground">{member.user.email}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={member.role === "ADMIN" ? "default" : "outline"} className="text-[10px]">
                                {member.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  member.status === "APPROVED"
                                    ? "secondary"
                                    : member.status === "PENDING"
                                    ? "outline"
                                    : "destructive"
                                }
                                className={cn(
                                  "text-[10px]",
                                  member.status === "APPROVED" && "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/20",
                                  member.status === "PENDING" && "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/20"
                                )}
                              >
                                {member.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {formatTimestamp(member.createdAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              {member.role !== "ADMIN" && member.status === "PENDING" && (
                                <div className="flex justify-end gap-1.5">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleMemberAction(member.id, "APPROVED")}
                                    className="h-7 w-7 p-0 border-emerald-500/30 hover:bg-emerald-50 text-emerald-600 dark:hover:bg-emerald-950/20"
                                    title="Setujui"
                                  >
                                    <CheckIcon className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleMemberAction(member.id, "REJECTED")}
                                    className="h-7 w-7 p-0 border-rose-500/30 hover:bg-rose-50 text-rose-600 dark:hover:bg-rose-950/20"
                                    title="Tolak"
                                  >
                                    <XIcon className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              )}
                              {member.role !== "ADMIN" && member.status === "APPROVED" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleMemberAction(member.id, "REJECTED")}
                                  className="h-7 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 px-2"
                                >
                                  Nonaktifkan
                                </Button>
                              )}
                              {member.role !== "ADMIN" && member.status === "REJECTED" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleMemberAction(member.id, "APPROVED")}
                                  className="h-7 text-xs text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 px-2"
                                >
                                  Aktifkan Kembali
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* TAB 3: ACTIVITY LOGS */}
          {activeTab === "logs" && (
            <Card className="border border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <ActivityIcon className="h-5 w-5 text-primary" />
                  Log Aktivitas Verifikasi
                </CardTitle>
                <CardDescription>
                  Riwayat perubahan data verifikasi peserta program yang dilakukan oleh verifikator.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLogsLoading ? (
                  <div className="flex h-48 items-center justify-center">
                    <RefreshCwIcon className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : logs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                    Belum ada log aktivitas verifikasi untuk program ini.
                  </div>
                ) : (
                  <div className="rounded-md border bg-card">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Waktu</TableHead>
                          <TableHead>Verifikator</TableHead>
                          <TableHead>Aksi</TableHead>
                          <TableHead>Keterangan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatTimestamp(log.createdAt)}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-semibold text-xs text-foreground">{log.user.name}</span>
                                <span className="text-[10px] text-muted-foreground">{log.user.email}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  log.action.includes("APPROVED") || log.action.includes("DISETUJUI")
                                    ? "secondary"
                                    : log.action.includes("REJECTED") || log.action.includes("DITOLAK")
                                    ? "destructive"
                                    : "outline"
                                }
                                className={cn(
                                  "text-[9px] uppercase tracking-wider",
                                  (log.action.includes("APPROVED") || log.action.includes("DISETUJUI")) && "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/20"
                                )}
                              >
                                {log.action.replace("VERIFICATION_", "")}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-foreground/80 font-mono max-w-md wrap-break-word">
                              {log.details}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MembershipGate>
  );
}
