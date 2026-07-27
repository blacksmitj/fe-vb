"use client";

import * as React from "react";
import {
  KeyIcon,
  CopyIcon,
  CheckIcon,
  RefreshCwIcon,
  PauseIcon,
  PlayIcon,
  Trash2Icon,
  EyeIcon,
  EyeOffIcon,
  Loader2Icon,
  Code2Icon,
  ShieldCheckIcon,
  AlertTriangleIcon,
  ActivityIcon,
  GlobeIcon,
  ClockIcon,
  HistoryIcon,
  BarChart3Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { safeParseDate } from "@/lib/utils";
import { useProgramApiKey } from "@/hooks/use-programs";
import { useQueryClient } from "@tanstack/react-query";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ApiKeyLog {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  status: number;
  message: string | null;
  createdAt: string;
}

interface ApiKeyData {
  id: string;
  key: string;
  name: string;
  status: "ACTIVE" | "PAUSED";
  usageCount: number;
  lastUsedAt: string | null;
  createdAt: string;
  logs?: ApiKeyLog[];
}

export function ProgramApiSettings({ programId }: { programId: string }) {
  const queryClient = useQueryClient();
  const { data: rawApiKeyData, isLoading, refetch } = useProgramApiKey(programId);
  const apiKeyData: ApiKeyData | null = rawApiKeyData?.hasKey ? rawApiKeyData.apiKey : null;

  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const [showKey, setShowKey] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [copiedScript, setCopiedScript] = React.useState(false);

  const fetchApiKey = React.useCallback(async (showToast = false) => {
    const res = await refetch();
    if (showToast && res.isSuccess) {
      toast.success("Data API & Audit Log berhasil diperbarui");
    }
  }, [refetch]);

  const handleGenerateKey = async () => {
    setIsGenerating(true);
    const toastId = toast.loading("Membuat API Key baru...");
    try {
      const res = await fetch(`/api/programs/${programId}/api-key`, {
        method: "POST",
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["program-api-key", programId] });
        toast.success("API Key berhasil dibuat!", { id: toastId });
      } else {
        toast.error("Gagal membuat API Key", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan saat membuat API Key", { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!apiKeyData) return;
    const nextStatus = apiKeyData.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    setIsTogglingStatus(true);
    const toastId = toast.loading(
      nextStatus === "PAUSED" ? "Menaikkan pause API Key..." : "Mengaktifkan kembali API Key..."
    );
    try {
      const res = await fetch(`/api/programs/${programId}/api-key`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["program-api-key", programId] });
        toast.success(
          `Integrasi API berhasil ${nextStatus === "ACTIVE" ? "diaktifkan" : "di-pause"}`,
          { id: toastId }
        );
      } else {
        toast.error("Gagal mengubah status API Key", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan", { id: toastId });
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleDeleteKey = async () => {
    setIsDeleting(true);
    const toastId = toast.loading("Menghapus API Key...");
    try {
      const res = await fetch(`/api/programs/${programId}/api-key`, {
        method: "DELETE",
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["program-api-key", programId] });
        setShowKey(false);
        toast.success("API Key berhasil dihapus", { id: toastId });
      } else {
        toast.error("Gagal menghapus API Key", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan saat menghapus API Key", { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = (text: string, setCopiedState: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopiedState(true);
    toast.success("Tersalin ke clipboard!");
    setTimeout(() => setCopiedState(false), 2000);
  };

  const maskKey = (key: string) => {
    if (key.length <= 12) return "••••••••••••";
    return `${key.slice(0, 8)}${"•".repeat(16)}${key.slice(-4)}`;
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "Belum pernah digunakan";
    const d = safeParseDate(dateStr);
    if (!d) return dateStr;
    return d.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const parseUserAgent = (ua: string | null) => {
    if (!ua) return "Unknown Client";
    if (ua.includes("Google-Apps-Script")) return "Google Apps Script";
    if (ua.includes("Postman")) return "Postman";
    if (ua.includes("curl")) return "cURL / Terminal";
    if (ua.includes("Mozilla")) return "Web Browser";
    return ua.slice(0, 25);
  };

  const appScriptTemplate = `/**
 * Script Google Apps Script untuk Import Data VerifBuilder ke Google Sheets
 */
function syncVerifBuilderData() {
  // Config
  var API_URL = "${typeof window !== 'undefined' ? window.location.origin : 'https://app.verifbuilder.com'}/api/v1/export/participants";
  var API_KEY = "${apiKeyData?.key || 'PASTE_API_KEY_DISINI'}";

  var options = {
    "method": "GET",
    "headers": {
      "x-api-key": API_KEY,
      "Content-Type": "application/json"
    },
    "muteHttpExceptions": true
  };

  try {
    var response = UrlFetchApp.fetch(API_URL, options);
    var statusCode = response.getResponseCode();
    var result = JSON.parse(response.getContentText());

    if (statusCode !== 200 || !result.success) {
      Browser.msgBox("Error", "Gagal mengambil data: " + (result.message || "Unauthorized"), Browser.Buttons.OK);
      return;
    }

    var participants = result.data;
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Set Header di Baris 1 (Mulai Kolom B)
    sheet.getRange("B1:F1").setValues([
      ["ID Unique", "Nama Peserta", "Status Verifikasi", "Catatan Verifikasi", "Verifikator"]
    ]);
    sheet.getRange("B1:F1").setBackground("#1e293b").setFontColor("#ffffff").setFontWeight("bold");

    if (!participants || participants.length === 0) {
      Browser.msgBox("Info", "Data peserta kosong.", Browser.Buttons.OK);
      return;
    }

    // Pemetaan data per kolom
    var rowsData = participants.map(function(item) {
      return [
        item.uniqueKey || "-",                               
        item.data["Nama Peserta"] || item.data["Nama"] || "-", 
        item.evalStatus || "BELUM_DIVERIFIKASI",             
        item.evalDescription || "-",                          
        item.evalByUserName || "-"                            
      ];
    });

    // Clear data lama di kolom B:F dari baris 2
    var lastRow = Math.max(sheet.getLastRow(), 2);
    sheet.getRange(2, 2, lastRow, 5).clearContent();

    // Tulis batch ke Sheet
    sheet.getRange(2, 2, rowsData.length, 5).setValues(rowsData);

    Browser.msgBox("Sukses", "Berhasil menyinkronkan " + rowsData.length + " data peserta!", Browser.Buttons.OK);
  } catch (e) {
    Browser.msgBox("Error", "Terjadi kesalahan: " + e.toString(), Browser.Buttons.OK);
  }
}`;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2Icon className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards Overview */}
      {apiKeyData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Angka Penggunaan (Hits)</CardTitle>
              <div className="p-2 bg-primary/10 rounded-md text-primary">
                <BarChart3Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {apiKeyData.usageCount || 0} <span className="text-xs font-normal text-muted-foreground">kali</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total seluruh request API</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Penggunaan Terakhir</CardTitle>
              <div className="p-2 bg-blue-500/10 rounded-md text-blue-600 dark:text-blue-400">
                <ClockIcon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-semibold truncate mt-1">{formatTime(apiKeyData.lastUsedAt)}</div>
              <p className="text-xs text-muted-foreground mt-1.5">Waktu sinkronisasi terakhir</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Status Keamanan API</CardTitle>
              <div className={apiKeyData.status === "ACTIVE" ? "p-2 bg-emerald-500/10 rounded-md text-emerald-600 dark:text-emerald-400" : "p-2 bg-amber-500/10 rounded-md text-amber-600 dark:text-amber-400"}>
                <ActivityIcon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="mt-1">
                <Badge
                  variant={apiKeyData.status === "ACTIVE" ? "default" : "secondary"}
                  className={
                    apiKeyData.status === "ACTIVE"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-amber-500 hover:bg-amber-600 text-white"
                  }
                >
                  {apiKeyData.status === "ACTIVE" ? "Aktif (Menerima Request)" : "Di-pause (Blokir Akses)"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {apiKeyData.status === "ACTIVE" ? "API dapat diakses secara publik" : "Akses API sedang diblokir"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Grid 2 Kolom Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Management API Key & Template Script (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card Utama: API Key & Kontrol Keamanan */}
          <Card>
            <CardHeader className="pb-3">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-base">
                  <KeyIcon className="h-4 w-4 text-primary" />
                  API Secret Key & Kontrol
                </CardTitle>
                <CardDescription className="text-xs">
                  Kelola API Key program ini untuk integrasi external.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!apiKeyData ? (
                <div className="rounded-lg border border-dashed p-6 text-center space-y-3">
                  <ShieldCheckIcon className="h-8 w-8 text-muted-foreground mx-auto" />
                  <div>
                    <h4 className="font-semibold text-xs">Belum Ada API Key</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Buat API Key untuk menyinkronkan data verifikasi ke Google Sheets.
                    </p>
                  </div>
                  <Button onClick={handleGenerateKey} disabled={isGenerating} size="sm">
                    {isGenerating && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                    Buat API Key
                  </Button>
                </div>
              ) : (
                <>
                  {/* Display Key */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">API Secret Key</label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          readOnly
                          value={showKey ? apiKeyData.key : maskKey(apiKeyData.key)}
                          className="w-full rounded-md border border-input bg-muted/50 px-3 py-1.5 text-xs font-mono focus-visible:outline-none"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setShowKey(!showKey)}
                        title={showKey ? "Sembunyikan Key" : "Tampilkan Key"}
                      >
                        {showKey ? <EyeOffIcon className="h-3.5 w-3.5" /> : <EyeIcon className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => copyToClipboard(apiKeyData.key, setCopied)}
                        title="Salin Key"
                      >
                        {copied ? (
                          <CheckIcon className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <CopyIcon className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground pt-0.5">
                      Dibuat: {formatTime(apiKeyData.createdAt)}
                    </p>
                  </div>

                  {/* Action Buttons: Pause, Regenerate, Delete */}
                  <div className="flex flex-wrap gap-2 pt-3 border-t">
                    {/* Pause / Resume Button */}
                    <Button
                      variant={apiKeyData.status === "ACTIVE" ? "outline" : "default"}
                      size="sm"
                      onClick={handleToggleStatus}
                      disabled={isTogglingStatus}
                      className={apiKeyData.status === "PAUSED" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                    >
                      {isTogglingStatus ? (
                        <Loader2Icon className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : apiKeyData.status === "ACTIVE" ? (
                        <>
                          <PauseIcon className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
                          Pause API
                        </>
                      ) : (
                        <>
                          <PlayIcon className="mr-1.5 h-3.5 w-3.5" />
                          Aktifkan API
                        </>
                      )}
                    </Button>

                    {/* Regenerate Key Dialog */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" disabled={isGenerating}>
                          <RefreshCwIcon className="mr-1.5 h-3.5 w-3.5" />
                          Regenerate
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
                            <AlertTriangleIcon className="h-5 w-5" />
                            Regenerate API Key?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            API Key lama akan langsung tidak berlaku. Anda harus memperbarui kode di Google Apps Script dengan API Key yang baru.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={handleGenerateKey}>
                            Regenerate
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    {/* Delete Key Dialog */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={isDeleting}>
                          <Trash2Icon className="mr-1.5 h-3.5 w-3.5" />
                          Hapus Key
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-destructive">Hapus API Key?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Akses API integrasi untuk program ini akan langsung dicabut dan skrip Google Apps Script tidak akan bisa menarik data lagi.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteKey}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Hapus Permanen
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Card Panduan & Template Google Apps Script */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Code2Icon className="h-4 w-4 text-primary" />
                    Template Google Apps Script
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Tempel di <strong>Extensions &gt; Apps Script</strong> pada Google Sheet.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(appScriptTemplate, setCopiedScript)}
                  disabled={!apiKeyData}
                  className="h-8 text-xs"
                >
                  {copiedScript ? (
                    <>
                      <CheckIcon className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                      Tersalin!
                    </>
                  ) : (
                    <>
                      <CopyIcon className="mr-1.5 h-3.5 w-3.5" />
                      Salin Skrip
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative rounded-md border bg-muted/60 p-3 font-mono text-[11px] text-foreground overflow-x-auto max-h-72">
                <pre>{appScriptTemplate}</pre>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Tabel Audit Log Akses API (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          {apiKeyData ? (
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <HistoryIcon className="h-4 w-4 text-primary" />
                      Tabel Audit Log Akses API
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Riwayat pemanggilan API terbaru oleh Google Apps Script / Client lain.
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => fetchApiKey(true)} className="h-8 text-xs">
                    <RefreshCwIcon className="mr-1.5 h-3.5 w-3.5" />
                    Refresh Log
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!apiKeyData.logs || apiKeyData.logs.length === 0 ? (
                  <div className="py-12 text-center text-xs text-muted-foreground border border-dashed rounded-md">
                    Belum ada riwayat penggunaan API.
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Waktu Akses</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="text-xs">Client</TableHead>
                          <TableHead className="text-xs">IP Address</TableHead>
                          <TableHead className="text-xs">Keterangan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {apiKeyData.logs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-mono text-[11px] whitespace-nowrap">
                              {formatTime(log.createdAt)}
                            </TableCell>
                            <TableCell>
                              {log.status === 200 ? (
                                <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] px-1.5 py-0">
                                  200 OK
                                </Badge>
                              ) : log.status === 403 ? (
                                <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] px-1.5 py-0">
                                  403 Paused
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                  {log.status}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="font-medium text-xs whitespace-nowrap">
                              <span className="flex items-center gap-1">
                                <GlobeIcon className="h-3 w-3 text-muted-foreground" />
                                {parseUserAgent(log.userAgent)}
                              </span>
                            </TableCell>
                            <TableCell className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                              {log.ipAddress || "-"}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {log.message || "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center p-8 text-center text-xs text-muted-foreground border-dashed">
              Buat API Key terlebih dahulu untuk melihat Tabel Audit Log Akses API.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
