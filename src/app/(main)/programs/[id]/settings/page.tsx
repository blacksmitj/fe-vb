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
  UploadCloudIcon,
  PlayIcon,
  Loader2Icon,
  EyeIcon,
  InfoIcon,
  LayoutTemplateIcon,
  Trash2Icon,
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
import { useProgram, useDeleteProgram } from "@/hooks/use-programs";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DryRunResult {
  stats: {
    totalRows: number;
    totalColumns: number;
    errorCount: number;
  };
  previewRows: Record<string, any>[];
  errors: {
    row: number;
    column: string;
    message: string;
  }[];
}

function parseCSV(text: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let entry = "";

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        entry += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(entry);
      entry = "";
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      row.push(entry);
      if (row.some(val => val.trim() !== "")) {
        result.push(row);
      }
      row = [];
      entry = "";
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
    } else {
      entry += char;
    }
  }
  if (entry || row.length > 0) {
    row.push(entry);
    if (row.some(val => val.trim() !== "")) {
      result.push(row);
    }
  }
  return result;
}

function parseWorksheet(worksheet: any): { headers: string[]; rows: Record<string, any>[] } {
  const headers: string[] = [];
  let headerRow = worksheet.getRow(1);
  let headerRowNumber = 1;

  for (let i = 1; i <= Math.min(worksheet.rowCount, 10); i++) {
    const row = worksheet.getRow(i);
    const rowValues = row.values;
    if (rowValues && (Array.isArray(rowValues) ? rowValues.some((v: any) => v !== null && v !== undefined) : Object.keys(rowValues).length > 0)) {
      headerRow = row;
      headerRowNumber = i;
      break;
    }
  }

  headerRow.eachCell({ includeEmpty: false }, (cell: any) => {
    const value = cell.value;
    if (value !== null && value !== undefined) {
      if (typeof value === "object" && "text" in value) {
        headers.push(String(value.text).trim());
      } else {
        headers.push(String(value).trim());
      }
    }
  });

  const cleanHeaders = Array.from(new Set(headers.filter(h => h.length > 0)));

  const rows: Record<string, any>[] = [];
  worksheet.eachRow({ includeEmpty: false }, (row: any, rowNumber: number) => {
    if (rowNumber <= (headerRowNumber || 1)) return;

    const rowData: Record<string, any> = {};
    cleanHeaders.forEach((header, idx) => {
      const cell = row.getCell(idx + 1);
      let val = cell.value;
      if (val !== null && val !== undefined) {
        if (typeof val === "object") {
          if ("text" in val) {
            val = val.text;
          } else if ("result" in val) {
            val = val.result;
          } else if (val instanceof Date) {
            // Keep date
          } else {
            val = JSON.stringify(val);
          }
        }
        rowData[header] = typeof val === "string" ? val.trim() : val;
      } else {
        rowData[header] = "";
      }
    });

    rowData["__sheetRowIndex"] = rowNumber;
    rows.push(rowData);
  });

  return { headers: cleanHeaders, rows };
}

export default function ProgramSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const { data: program, isLoading: isProgramLoading, refetch: refetchProgram } = useProgram(id);
  const deleteMutation = useDeleteProgram();

  const handleDeleteClick = React.useCallback(() => {
    if (confirm(`Apakah Anda yakin ingin menghapus program "${program?.name}"?`)) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          toast.success(`Program "${program?.name}" berhasil dihapus`);
          router.push("/programs");
        },
        onError: () => {
          toast.error("Gagal menghapus program");
        },
      });
    }
  }, [id, program, deleteMutation, router]);

  const [isExporting, setIsExporting] = React.useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = React.useState(false);

  const handleToggleStatus = async (nextStatus: "ACTIVE" | "STOPPED") => {
    setIsTogglingStatus(true);
    const toastId = toast.loading("Memperbarui status verifikasi...");
    try {
      const res = await fetch(`/api/programs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        toast.success(`Status verifikasi berhasil ${nextStatus === "ACTIVE" ? "dibuka" : "ditutup"}`, { id: toastId });
        refetchProgram();
      } else {
        const data = await res.json();
        toast.error(data.error || "Gagal mengubah status verifikasi", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan saat mengubah status verifikasi", { id: toastId });
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // Reupload states
  const [reuploadFile, setReuploadFile] = React.useState<File | null>(null);
  const [reuploadSheets, setReuploadSheets] = React.useState<string[]>([]);
  const [reuploadSheetName, setReuploadSheetName] = React.useState("");
  const [reuploadHeadersList, setReuploadHeadersList] = React.useState<string[]>([]);
  const [reuploadSheetUniqueKey, setReuploadSheetUniqueKey] = React.useState("");
  const [isReuploadPreviewLoading, setIsReuploadPreviewLoading] = React.useState(false);
  const [isReuploadDryRunning, setIsReuploadDryRunning] = React.useState(false);
  const [isReuploadSubmitting, setIsReuploadSubmitting] = React.useState(false);
  const [reuploadDryRunResult, setReuploadDryRunResult] = React.useState<DryRunResult | null>(null);
  const reuploadWorkbookRef = React.useRef<any>(null);
  const [reuploadCurrentSheetRows, setReuploadCurrentSheetRows] = React.useState<Record<string, any>[]>([]);

  const handleReuploadFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setReuploadFile(selectedFile);
    setIsReuploadPreviewLoading(true);
    setReuploadSheets([]);
    setReuploadHeadersList([]);
    setReuploadSheetName("");
    setReuploadSheetUniqueKey("");
    setReuploadDryRunResult(null);
    setReuploadCurrentSheetRows([]);
    reuploadWorkbookRef.current = null;

    try {
      const nameLower = selectedFile.name.toLowerCase();
      let sheetNamesList: string[] = [];
      let initialHeaders: string[] = [];
      let parsedRows: Record<string, any>[] = [];

      if (nameLower.endsWith(".csv")) {
        const text = await selectedFile.text();
        const csvData = parseCSV(text);
        if (csvData.length === 0) {
          throw new Error("File CSV kosong.");
        }
        sheetNamesList = ["CSV Data"];
        initialHeaders = csvData[0].map(h => h.trim()).filter(h => h.length > 0);
        parsedRows = csvData.slice(1).map((row, idx) => {
          const rowData: Record<string, any> = {};
          initialHeaders.forEach((header, colIdx) => {
            rowData[header] = (row[colIdx] || "").trim();
          });
          rowData["__sheetRowIndex"] = idx + 2;
          return rowData;
        });
      } else {
        const ExcelJS = await import("exceljs");
        const workbook = new ExcelJS.Workbook();
        const buffer = await selectedFile.arrayBuffer();
        await workbook.xlsx.load(buffer);
        reuploadWorkbookRef.current = workbook;

        sheetNamesList = workbook.worksheets.map(s => s.name);
        if (sheetNamesList.length === 0) {
          throw new Error("File spreadsheet kosong.");
        }

        const worksheet = workbook.worksheets[0];
        const parsed = parseWorksheet(worksheet);
        initialHeaders = parsed.headers;
        parsedRows = parsed.rows;
      }

      setReuploadSheets(sheetNamesList);
      if (sheetNamesList.length > 0) {
        setReuploadSheetName(sheetNamesList[0]);
      }
      setReuploadHeadersList(initialHeaders);
      if (initialHeaders.length > 0) {
        setReuploadSheetUniqueKey(initialHeaders[0]);
      }
      setReuploadCurrentSheetRows(parsedRows);
      toast.success("File reupload berhasil di-parse!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Terjadi kesalahan saat membaca file.");
      setReuploadFile(null);
    } finally {
      setIsReuploadPreviewLoading(false);
    }
  };

  const handleReuploadSheetChange = async (selectedSheetName: string) => {
    setReuploadSheetName(selectedSheetName);
    if (!reuploadFile) return;

    setIsReuploadPreviewLoading(true);
    setReuploadHeadersList([]);
    setReuploadSheetUniqueKey("");
    setReuploadDryRunResult(null);
    setReuploadCurrentSheetRows([]);

    try {
      let initialHeaders: string[] = [];
      let parsedRows: Record<string, any>[] = [];

      if (reuploadFile.name.toLowerCase().endsWith(".csv")) {
        const text = await reuploadFile.text();
        const csvData = parseCSV(text);
        initialHeaders = csvData[0].map(h => h.trim()).filter(h => h.length > 0);
        parsedRows = csvData.slice(1).map((row, idx) => {
          const rowData: Record<string, any> = {};
          initialHeaders.forEach((header, colIdx) => {
            rowData[header] = (row[colIdx] || "").trim();
          });
          rowData["__sheetRowIndex"] = idx + 2;
          return rowData;
        });
      } else {
        const workbook = reuploadWorkbookRef.current;
        if (!workbook) throw new Error("Workbook tidak ditemukan.");

        const worksheet = workbook.worksheets.find((s: any) => s.name === selectedSheetName);
        if (!worksheet) throw new Error("Sheet tidak ditemukan.");

        const parsed = parseWorksheet(worksheet);
        initialHeaders = parsed.headers;
        parsedRows = parsed.rows;
      }

      setReuploadHeadersList(initialHeaders);
      if (initialHeaders.length > 0) {
        setReuploadSheetUniqueKey(initialHeaders[0]);
      }
      setReuploadCurrentSheetRows(parsedRows);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Gagal memuat kolom dari sheet ini.");
    } finally {
      setIsReuploadPreviewLoading(false);
    }
  };

  const handleReuploadDryRun = async () => {
    if (!reuploadFile || !reuploadSheetUniqueKey) {
      toast.error("Harap unggah file dan pilih kolom ID Unik.");
      return;
    }

    setIsReuploadDryRunning(true);
    setReuploadDryRunResult(null);

    setTimeout(() => {
      try {
        const errors: any[] = [];
        const keyMap = new Map<string, number>();

        reuploadCurrentSheetRows.forEach((row) => {
          const keyValue = String(row[reuploadSheetUniqueKey] || "").trim();
          const currentSheetRow = row["__sheetRowIndex"];
          if (!keyValue) {
            errors.push({
              row: currentSheetRow,
              column: reuploadSheetUniqueKey,
              message: "Unique Key kosong."
            });
          } else if (keyMap.has(keyValue)) {
            errors.push({
              row: currentSheetRow,
              column: reuploadSheetUniqueKey,
              message: `Duplikasi Unique Key: "${keyValue}" (sudah ada di baris ${keyMap.get(keyValue)})`
            });
          } else {
            keyMap.set(keyValue, currentSheetRow);
          }
        });

        const stats = {
          totalRows: reuploadCurrentSheetRows.length,
          totalColumns: reuploadHeadersList.length,
          errorCount: errors.length,
        };

        const previewRows = reuploadCurrentSheetRows.slice(0, 10);

        setReuploadDryRunResult({
          stats,
          previewRows,
          errors,
        });

        toast.success("Uji coba reupload (Dry Run) selesai!");
      } catch (err) {
        console.error(err);
        toast.error("Terjadi kesalahan saat memproses uji coba.");
      } finally {
        setIsReuploadDryRunning(false);
      }
    }, 50);
  };

  const handleReuploadSubmit = async () => {
    if (!reuploadFile || !reuploadSheetUniqueKey) {
      toast.error("Harap lengkapi semua konfigurasi reupload.");
      return;
    }

    const confirmReplace = window.confirm(
      "Apakah Anda yakin ingin menghapus seluruh data peserta yang lama dan menggantinya dengan data baru? Tindakan ini tidak dapat dibatalkan."
    );
    if (!confirmReplace) return;

    setIsReuploadSubmitting(true);
    const toastId = toast.loading("Sedang memperbarui data peserta...");

    const formData = new FormData();
    formData.append("file", reuploadFile);
    formData.append("sheetName", reuploadSheetName);
    formData.append("sheetUniqueKey", reuploadSheetUniqueKey);

    try {
      const res = await fetch(`/api/programs/${id}/reupload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Data peserta berhasil diperbarui!", { id: toastId });
        refetchProgram();
        // Reset states
        setReuploadFile(null);
        setReuploadSheets([]);
        setReuploadHeadersList([]);
        setReuploadSheetName("");
        setReuploadSheetUniqueKey("");
        setReuploadDryRunResult(null);
        setReuploadCurrentSheetRows([]);
        reuploadWorkbookRef.current = null;
      } else {
        toast.error(data.error || "Gagal memperbarui data peserta.", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan saat memperbarui data.", { id: toastId });
    } finally {
      setIsReuploadSubmitting(false);
    }
  };

  // Tabs state
  const [activeTab, setActiveTab] = React.useState("general"); // "general" | "export" | "members" | "logs"
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
          if (data.role !== "ADMIN") {
            setActiveTab("logs");
          }
        }
      } catch (err) {
        console.error("Failed to fetch user role", err);
      }
    }
    fetchRole();
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

  const handleExport = async () => {
    setIsExporting(true);
    const toastId = toast.loading("Sedang menyiapkan file Excel...");
    try {
      const response = await fetch(`/api/programs/${id}/export`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Gagal mengunduh file.");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      const contentDisposition = response.headers.get("Content-Disposition");
      let fileName = `export_${program?.name?.replace(/[^a-z0-9]/gi, "_").toLowerCase() || id}.xlsx`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) fileName = match[1];
      }
      
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success("Data berhasil diekspor ke Excel!", { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Gagal melakukan export data.", { id: toastId });
    } finally {
      setIsExporting(false);
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6 w-full max-w-[1600px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" asChild className="h-8 w-8 shrink-0">
                <Link href="/programs">
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
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild className="gap-2 h-9 px-4">
                <Link href={`/programs/${id}/verification`}>
                  <CheckCircle2Icon className="size-4 text-emerald-600" />
                  Ke Halaman Verifikasi
                </Link>
              </Button>
            </div>
          </div>

          {/* Tabbed Interface */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
            <TabsList>
              {userRole === "ADMIN" && (
                <TabsTrigger value="general">
                  <SettingsIcon className="h-4 w-4 mr-2" />
                  Pengaturan Utama
                </TabsTrigger>
              )}

              {userRole === "ADMIN" && (
                <TabsTrigger value="export">
                  <DatabaseIcon className="h-4 w-4 mr-2" />
                  Export Data
                </TabsTrigger>
              )}

              {userRole === "ADMIN" && (
                <TabsTrigger value="import">
                  <UploadCloudIcon className="h-4 w-4 mr-2" />
                  Import / Reupload
                </TabsTrigger>
              )}

              {userRole === "ADMIN" && (
                <TabsTrigger value="members">
                  <UsersIcon className="h-4 w-4 mr-2" />
                  Anggota
                </TabsTrigger>
              )}

              <TabsTrigger value="logs">
                <ActivityIcon className="h-4 w-4 mr-2" />
                Log Aktivitas
              </TabsTrigger>
            </TabsList>

            {/* TAB: GENERAL SETTINGS */}
            {userRole === "ADMIN" && (
              <TabsContent value="general" className="space-y-6 outline-none mt-0">
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="md:col-span-2 space-y-6">
                    {/* Card 1: Profile Builder */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <LayoutTemplateIcon className="h-5 w-5 text-primary" />
                          Tata Letak & Profile Builder
                        </CardTitle>
                        <CardDescription>
                          Sesuaikan formulir data verifikasi peserta. Anda dapat mengatur letak kolom (grid), jenis input, judul bagian, dan memetakan header dari data Excel yang diunggah ke kolom formulir.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Status Hubungan</p>
                            <p className="text-xs text-muted-foreground">
                              {program?.profileTemplateId
                                ? "Program ini sudah memiliki rancangan layout verifikasi."
                                : "Program ini belum terhubung ke layout verifikasi. Silakan pilih atau buat layout baru terlebih dahulu."}
                            </p>
                          </div>
                          <div>
                            {program?.profileTemplateId ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/10 font-medium">
                                Terhubung
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500/10 font-medium animate-pulse">
                                Belum Terhubung
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-end">
                          {program?.profileTemplateId ? (
                            <Button asChild className="gap-2">
                              <Link href={`/builder?builderId=${program.profileTemplateId}`}>
                                <LayoutTemplateIcon className="size-4" />
                                Buka Profile Builder
                              </Link>
                            </Button>
                          ) : (
                            <Button asChild variant="outline" className="gap-2 border-amber-200 text-amber-700 bg-amber-50/10 hover:bg-amber-50">
                              <Link href={`/profile-builders`}>
                                <LayoutTemplateIcon className="size-4" />
                                Pilih / Buat Profile Builder Baru
                              </Link>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Card 2: Verification Status */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <ActivityIcon className="h-5 w-5 text-primary" />
                          Aktivitas Verifikasi
                        </CardTitle>
                        <CardDescription>
                          Membuka atau menutup akses verifikasi bagi verifikator. Jika status aktif, verifikator dapat mulai melakukan proses evaluasi data peserta.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Status Akses</p>
                            <p className="text-xs text-muted-foreground">
                              {program?.status === "ACTIVE"
                                ? "Verifikasi saat ini sedang dibuka. Verifikator dapat mengakses dan menilai data peserta."
                                : "Verifikasi saat ini sedang ditutup. Akses penilaian untuk verifikator dinonaktifkan."}
                            </p>
                          </div>
                          <div>
                            {program?.status === "ACTIVE" ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/10 font-medium">
                                Aktif / Terbuka
                              </Badge>
                            ) : (
                              <Badge className="bg-rose-500/10 text-rose-600 border border-rose-500/20 hover:bg-rose-500/10 font-medium">
                                Ditutup
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-end">
                          {program && (
                            program.status === "ACTIVE" ? (
                              <Button
                                variant="outline"
                                onClick={() => handleToggleStatus("STOPPED")}
                                disabled={isTogglingStatus}
                                className="gap-2 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-medium"
                              >
                                {isTogglingStatus ? (
                                  <Loader2Icon className="size-4 animate-spin" />
                                ) : (
                                  <XIcon className="size-4" />
                                )}
                                Tutup Akses Verifikasi
                              </Button>
                            ) : (
                              <Button
                                onClick={() => handleToggleStatus("ACTIVE")}
                                disabled={isTogglingStatus}
                                className="gap-2 bg-emerald-600 hover:bg-emerald-600/90 text-white font-medium"
                              >
                                {isTogglingStatus ? (
                                  <Loader2Icon className="size-4 animate-spin" />
                                ) : (
                                  <PlayIcon className="size-4" />
                                )}
                                Buka Akses Verifikasi
                              </Button>
                            )
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Sidebar Info/Danger Zone */}
                  <div className="space-y-6">
                    <Card className="border-destructive/30 bg-destructive/5">
                      <CardHeader>
                        <CardTitle className="text-destructive flex items-center gap-2">
                          <Trash2Icon className="h-5 w-5" />
                          Danger Zone
                        </CardTitle>
                        <CardDescription>
                          Tindakan berikut bersifat permanen dan tidak dapat dibatalkan.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-xs text-muted-foreground leading-normal">
                          Menghapus program ini akan menghapus seluruh data peserta yang diimpor, catatan evaluasi verifikasi, draf perubahan layout, serta log aktivitas terkait secara permanen dari database.
                        </p>
                        <Button
                          variant="destructive"
                          className="w-full gap-2"
                          onClick={handleDeleteClick}
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending ? (
                            <Loader2Icon className="size-4 animate-spin" />
                          ) : (
                            <Trash2Icon className="size-4" />
                          )}
                          Hapus Program Permanen
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            )}

            {/* TAB: EXPORT DATA */}
            {userRole === "ADMIN" && (
              <TabsContent value="export" className="space-y-6 outline-none mt-0">
                <div className="grid gap-6 md:grid-cols-3">
                  {/* Main Export Card */}
                  <div className="md:col-span-2 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <DatabaseIcon className="h-5 w-5 text-primary" />
                          Export Data Peserta
                        </CardTitle>
                        <CardDescription>
                          Unduh hasil akhir verifikasi program ini. Hasil unduhan berupa file Excel (.xlsx) yang berisi data asli peserta beserta status evaluasi, catatan verifikator, dan waktu evaluasi.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="rounded-lg bg-muted/50 p-4 border space-y-3">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground font-medium">Total Baris Data:</span>
                            <span className="font-bold text-foreground">{(program?.totalRows ?? 0).toLocaleString("id-ID")} baris</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground font-medium">Jumlah Kolom:</span>
                            <span className="font-bold text-foreground">{program?.fieldCount ?? 0} kolom</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground font-medium">Jumlah Validation Error (Import):</span>
                            <span className={`font-bold ${program?.errorCount && program.errorCount > 0 ? "text-rose-500" : "text-emerald-500"}`}>
                              {program?.errorCount ?? 0} baris
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button onClick={handleExport} disabled={isExporting || !program?.totalRows} className="gap-2 w-full md:w-auto">
                            {isExporting ? (
                              <RefreshCwIcon className="h-4 w-4 animate-spin" />
                            ) : (
                              <DatabaseIcon className="h-4 w-4" />
                            )}
                            Export Data ke Excel (.xlsx)
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Instructions Panel */}
                  <div className="space-y-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <HistoryIcon className="h-4 w-4 text-muted-foreground" />
                          Petunjuk Penggunaan
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs text-muted-foreground leading-relaxed space-y-2">
                        <p>
                          1. Data peserta diimpor dari file Excel eksternal melalui menu <strong>Import Data</strong> di dashboard program.
                        </p>
                        <p>
                          2. Verifikator akan memproses status kelayakan masing-masing peserta (Approve / Reject) secara langsung melalui antarmuka web.
                        </p>
                        <p>
                          3. Hasil akhir dapat Anda ekspor kapan saja untuk pelaporan. Tiga kolom tambahan akan otomatis disematkan di bagian kanan kolom Excel: <strong>Status Evaluasi</strong>, <strong>Catatan Evaluasi</strong>, dan <strong>Waktu Evaluasi</strong>.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            )}

            {/* TAB: IMPORT / REUPLOAD DATA */}
            {userRole === "ADMIN" && (
              <TabsContent value="import" className="space-y-6 outline-none mt-0">
                <div className="grid gap-6 md:grid-cols-3">
                  {/* Reupload & Ganti Data Card */}
                  <div className="md:col-span-2 space-y-6">
                    <Card className="shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <UploadCloudIcon className="h-5 w-5 text-primary" />
                          Reupload & Ganti Data Peserta
                        </CardTitle>
                        <CardDescription>
                          Unggah berkas Excel/CSV baru untuk menggantikan seluruh data peserta yang ada saat ini.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="reupload-file">File Spreadsheet (.xlsx, .xls, .csv)</Label>
                          <div className="relative">
                            <Input
                              id="reupload-file"
                              type="file"
                              accept=".xlsx,.xls,.csv"
                              onChange={handleReuploadFileChange}
                              required
                              className="pr-10"
                              disabled={isReuploadPreviewLoading || isReuploadSubmitting || isReuploadDryRunning}
                            />
                            {isReuploadPreviewLoading && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Loader2Icon className="size-4 animate-spin text-primary" />
                              </div>
                            )}
                          </div>
                          {isReuploadPreviewLoading && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Membaca metadata & sheet file...
                            </p>
                          )}
                        </div>

                        {reuploadFile && (
                          <>
                            {reuploadSheets.length > 1 && (
                              <div className="space-y-2">
                                <Label htmlFor="reuploadSheetName">Pilih Sheet (Tab)</Label>
                                <Select
                                  value={reuploadSheetName}
                                  onValueChange={handleReuploadSheetChange}
                                  disabled={isReuploadPreviewLoading || isReuploadSubmitting || isReuploadDryRunning}
                                >
                                  <SelectTrigger id="reuploadSheetName" className="w-full justify-between">
                                    <SelectValue placeholder="Pilih Sheet" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {reuploadSheets.map((s) => (
                                      <SelectItem key={s} value={s}>
                                        {s}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            <div className="space-y-2">
                              <Label htmlFor="reuploadSheetUniqueKey">Kolom ID Unik (Unique Key)</Label>
                              <div className="relative">
                                <Select
                                  value={reuploadSheetUniqueKey}
                                  onValueChange={(val) => {
                                    setReuploadSheetUniqueKey(val);
                                    setReuploadDryRunResult(null);
                                  }}
                                  disabled={isReuploadPreviewLoading || isReuploadSubmitting || isReuploadDryRunning || reuploadHeadersList.length === 0}
                                >
                                  <SelectTrigger id="reuploadSheetUniqueKey" className="w-full justify-between">
                                    <SelectValue placeholder={isReuploadPreviewLoading ? "Memuat kolom..." : "Pilih kolom ID Unik"} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {reuploadHeadersList.map((h) => (
                                      <SelectItem key={h} value={h}>
                                        {h}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {isReuploadPreviewLoading && (
                                  <div className="absolute right-9 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                                    <Loader2Icon className="size-4 animate-spin text-primary" />
                                  </div>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground leading-snug">
                                Pilih kolom dengan nilai unik (contoh: NIK, NIM, Email) untuk mengidentifikasi setiap peserta secara akurat.
                              </p>
                            </div>

                            <div className="pt-2">
                              <Button
                                type="button"
                                className="w-full flex items-center justify-center gap-2"
                                variant="secondary"
                                onClick={handleReuploadDryRun}
                                disabled={!reuploadFile || !reuploadSheetUniqueKey || isReuploadPreviewLoading || isReuploadSubmitting || isReuploadDryRunning}
                              >
                                {isReuploadDryRunning ? (
                                  <>
                                    <Loader2Icon className="h-4 w-4 animate-spin" />
                                    Menguji Data...
                                  </>
                                ) : (
                                  <>
                                    <PlayIcon className="h-4 w-4 text-emerald-600" />
                                    Jalankan Uji Coba (Dry Run)
                                  </>
                                )}
                              </Button>
                            </div>
                          </>
                        )}

                        {/* Dry Run Result UI inside Settings */}
                        {reuploadDryRunResult && (
                          <div className="mt-4 border-t pt-4 space-y-4">
                            <div className="flex items-start gap-3">
                              <CheckCircle2Icon className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                              <div>
                                <h4 className="font-semibold text-emerald-900 text-sm">Uji Coba Dry Run Selesai</h4>
                                <p className="text-xs text-emerald-700 mt-0.5">
                                  Silakan periksa rangkuman data di bawah ini.
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div className="p-2 border rounded bg-muted/30">
                                <p className="text-[10px] text-muted-foreground">Baris</p>
                                <p className="text-sm font-bold">{reuploadDryRunResult.stats.totalRows}</p>
                              </div>
                              <div className="p-2 border rounded bg-muted/30">
                                <p className="text-[10px] text-muted-foreground">Kolom</p>
                                <p className="text-sm font-bold">{reuploadDryRunResult.stats.totalColumns}</p>
                              </div>
                              <div className="p-2 border rounded bg-muted/30">
                                <p className="text-[10px] text-muted-foreground">Error</p>
                                <p className={`text-sm font-bold ${reuploadDryRunResult.stats.errorCount > 0 ? "text-rose-500" : "text-emerald-600"}`}>
                                  {reuploadDryRunResult.stats.errorCount}
                                </p>
                              </div>
                            </div>

                            {reuploadDryRunResult.stats.errorCount > 0 && (
                              <Alert variant="destructive" className="bg-destructive/5 py-2 border-destructive/20 text-destructive-foreground text-[11px]">
                                <AlertTriangleIcon className="h-3.5 w-3.5 shrink-0" />
                                <AlertDescription>
                                  Terdapat {reuploadDryRunResult.stats.errorCount} masalah validasi duplikasi. Baris bermasawat akan tetap dimasukkan tapi ditandai error di dashboard.
                                </AlertDescription>
                              </Alert>
                            )}

                            <div className="flex justify-end gap-3 pt-2">
                              <Button
                                type="button"
                                onClick={handleReuploadSubmit}
                                disabled={isReuploadSubmitting}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 w-full justify-center"
                              >
                                {isReuploadSubmitting ? (
                                  <>
                                    <Loader2Icon className="h-4 w-4 animate-spin" />
                                    Meng-update...
                                  </>
                                ) : (
                                  <>
                                    <DatabaseIcon className="h-4 w-4" />
                                    Reupload & Ganti Data
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Instructions Panel */}
                  <div className="space-y-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <HistoryIcon className="h-4 w-4 text-muted-foreground" />
                          Petunjuk Reupload
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs text-muted-foreground leading-relaxed space-y-2">
                        <p>
                          1. Pastikan struktur kolom pada file baru sesuai dengan kebutuhan identifikasi data (NIK, NIM, Email, dll).
                        </p>
                        <p>
                          2. Anda wajib memilih <strong>Kolom ID Unik</strong> untuk menghindari data ganda dan memastikan identitas peserta unik.
                        </p>
                        <p>
                          3. Gunakan fitur <strong>Jalankan Uji Coba (Dry Run)</strong> terlebih dahulu untuk memastikan tidak ada kesalahan format atau data duplikat sebelum memperbarui database secara permanen.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            )}

            {/* TAB 2: MEMBERS APPROVAL LIST */}
            {userRole === "ADMIN" && (
              <TabsContent value="members" className="outline-none mt-0">
                <Card className="border border-border/50 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div className="space-y-1.5">
                      <CardTitle className="flex items-center gap-2 text-lg font-bold">
                        <UsersIcon className="h-5 w-5 text-primary" />
                        Daftar Pendaftar & Verifikator
                      </CardTitle>
                      <CardDescription>
                        Kelola pendaftar baru yang ingin berkontribusi melakukan verifikasi data pada program ini.
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchMembers}
                      disabled={isMembersLoading}
                      className="h-8 gap-1.5"
                    >
                      <RefreshCwIcon className={cn("h-3.5 w-3.5", isMembersLoading && "animate-spin")} />
                      Refresh
                    </Button>
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
                                    <AvatarImage src={member.user.image || undefined} />
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
              </TabsContent>
            )}

            {/* TAB 3: ACTIVITY LOGS */}
            <TabsContent value="logs" className="outline-none mt-0">
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
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MembershipGate>
  );
}
