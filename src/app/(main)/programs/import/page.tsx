"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  Loader2Icon,
  FileSpreadsheetIcon,
  UploadCloudIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  PlayIcon,
  EyeIcon,
  DatabaseIcon,
  InfoIcon,
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
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

export default function ImportProgramPage() {
  const router = useRouter();

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [sheets, setSheets] = React.useState<string[]>([]);
  const [sheetName, setSheetName] = React.useState("");
  const [headersList, setHeadersList] = React.useState<string[]>([]);
  const [sheetUniqueKey, setSheetUniqueKey] = React.useState("");

  // Refs and client states for instant processing
  const workbookRef = React.useRef<any>(null);
  const [currentSheetRows, setCurrentSheetRows] = React.useState<Record<string, any>[]>([]);

  // Loading and option states
  const [isPreviewLoading, setIsPreviewLoading] = React.useState(false);
  const [isDryRunning, setIsDryRunning] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Dry run results
  const [dryRunResult, setDryRunResult] = React.useState<DryRunResult | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    // Suggest name based on filename
    const suggestedName = selectedFile.name.replace(/\.[^/.]+$/, "");
    setName(suggestedName);

    setIsPreviewLoading(true);
    setSheets([]);
    setHeadersList([]);
    setSheetName("");
    setSheetUniqueKey("");
    setDryRunResult(null);
    setCurrentSheetRows([]);
    workbookRef.current = null;

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
        workbookRef.current = workbook;

        sheetNamesList = workbook.worksheets.map(s => s.name);
        if (sheetNamesList.length === 0) {
          throw new Error("File spreadsheet kosong.");
        }

        const worksheet = workbook.worksheets[0];
        const parsed = parseWorksheet(worksheet);
        initialHeaders = parsed.headers;
        parsedRows = parsed.rows;
      }

      setSheets(sheetNamesList);
      if (sheetNamesList.length > 0) {
        setSheetName(sheetNamesList[0]);
      }
      setHeadersList(initialHeaders);
      if (initialHeaders.length > 0) {
        setSheetUniqueKey(initialHeaders[0]);
      }
      setCurrentSheetRows(parsedRows);
      toast.success("File berhasil di-parse!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Terjadi kesalahan saat membaca file.");
      setFile(null);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleSheetChange = async (selectedSheetName: string) => {
    setSheetName(selectedSheetName);
    if (!file) return;

    setIsPreviewLoading(true);
    setHeadersList([]);
    setSheetUniqueKey("");
    setDryRunResult(null);
    setCurrentSheetRows([]);

    try {
      let initialHeaders: string[] = [];
      let parsedRows: Record<string, any>[] = [];

      if (file.name.toLowerCase().endsWith(".csv")) {
        const text = await file.text();
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
        const workbook = workbookRef.current;
        if (!workbook) throw new Error("Workbook tidak ditemukan.");

        const worksheet = workbook.worksheets.find((s: any) => s.name === selectedSheetName);
        if (!worksheet) throw new Error("Sheet tidak ditemukan.");

        const parsed = parseWorksheet(worksheet);
        initialHeaders = parsed.headers;
        parsedRows = parsed.rows;
      }

      setHeadersList(initialHeaders);
      if (initialHeaders.length > 0) {
        setSheetUniqueKey(initialHeaders[0]);
      }
      setCurrentSheetRows(parsedRows);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Gagal memuat kolom dari sheet ini.");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleDryRun = async () => {
    if (!file || !name || !sheetUniqueKey) {
      toast.error("Harap unggah file dan pilih kolom ID Unik.");
      return;
    }

    setIsDryRunning(true);
    setDryRunResult(null);

    // Run Dry Run instantly in client memory
    setTimeout(() => {
      try {
        const errors: any[] = [];
        const keyMap = new Map<string, number>();

        currentSheetRows.forEach((row) => {
          const keyValue = String(row[sheetUniqueKey] || "").trim();
          const currentSheetRow = row["__sheetRowIndex"];
          if (!keyValue) {
            errors.push({
              row: currentSheetRow,
              column: sheetUniqueKey,
              message: "Unique Key kosong."
            });
          } else if (keyMap.has(keyValue)) {
            errors.push({
              row: currentSheetRow,
              column: sheetUniqueKey,
              message: `Duplikasi Unique Key: "${keyValue}" (sudah ada di baris ${keyMap.get(keyValue)})`
            });
          } else {
            keyMap.set(keyValue, currentSheetRow);
          }
        });

        const stats = {
          totalRows: currentSheetRows.length,
          totalColumns: headersList.length,
          errorCount: errors.length,
        };

        const previewRows = currentSheetRows.slice(0, 10);

        setDryRunResult({
          stats,
          previewRows,
          errors,
        });

        toast.success("Uji coba import (Dry Run) selesai!");
      } catch (err) {
        console.error(err);
        toast.error("Terjadi kesalahan saat memproses uji coba.");
      } finally {
        setIsDryRunning(false);
      }
    }, 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name || !sheetUniqueKey) {
      toast.error("Harap lengkapi semua konfigurasi program.");
      return;
    }
    setIsSubmitting(true);

    const toastId = toast.loading("Meng-import program dan data...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", name);
    formData.append("description", description);
    formData.append("sheetName", sheetName);
    formData.append("sheetUniqueKey", sheetUniqueKey);

    try {
      const res = await fetch("/api/programs/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Program "${name}" berhasil di-import!`, { id: toastId });
        router.push("/programs");
      } else {
        toast.error(data.error || "Gagal meng-import program.", { id: toastId });
      }
    } catch (err: any) {
      console.error("[import] Fetch error:", err);
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
                <BreadcrumbPage>Tambah Program (Excel/CSV)</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      {/* ── Content ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-8 w-full max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild className="h-8 w-8">
            <Link href="/programs">
              <ArrowLeftIcon className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tambah Program</h1>
            <p className="text-muted-foreground mt-0.5">
              Buat program verifikasi baru dan upload database peserta dari file Excel atau CSV.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Configuration Card */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileSpreadsheetIcon className="h-5 w-5 text-primary" />
                  Konfigurasi & Berkas
                </CardTitle>
                <CardDescription>
                  Unggah berkas Excel/CSV dan atur parameter program.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file">File Spreadsheet (.xlsx, .xls, .csv)</Label>
                  <div className="relative">
                    <Input
                      id="file"
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileChange}
                      required
                      className="pr-10"
                      disabled={isPreviewLoading || isSubmitting || isDryRunning}
                    />
                    {isPreviewLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2Icon className="size-4 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                  {isPreviewLoading && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Membaca metadata & sheet file...
                    </p>
                  )}
                </div>

                {file && (
                  <>
                    <Separator className="my-2" />

                    <div className="space-y-2">
                      <Label htmlFor="name">Nama Program / Event</Label>
                      <Input
                        id="name"
                        placeholder="Contoh: Seleksi Beasiswa 2026"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          setDryRunResult(null);
                        }}
                        required
                        disabled={isPreviewLoading || isSubmitting || isDryRunning}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Deskripsi</Label>
                      <Input
                        id="description"
                        placeholder="Deskripsi singkat program..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={isPreviewLoading || isSubmitting || isDryRunning}
                      />
                    </div>

                    {sheets.length > 1 && (
                      <div className="space-y-2">
                        <Label htmlFor="sheetName">Pilih Sheet (Tab)</Label>
                        <NativeSelect
                          id="sheetName"
                          value={sheetName}
                          onChange={(e) => handleSheetChange(e.target.value)}
                          disabled={isPreviewLoading || isSubmitting || isDryRunning}
                          className="w-full"
                        >
                          {sheets.map((s) => (
                            <NativeSelectOption key={s} value={s}>
                              {s}
                            </NativeSelectOption>
                          ))}
                        </NativeSelect>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="sheetUniqueKey">Kolom ID Unik (Unique Key)</Label>
                      <div className="relative">
                        <NativeSelect
                          id="sheetUniqueKey"
                          value={sheetUniqueKey}
                          onChange={(e) => {
                            setSheetUniqueKey(e.target.value);
                            setDryRunResult(null);
                          }}
                          required
                          disabled={isPreviewLoading || isSubmitting || isDryRunning || headersList.length === 0}
                          className="w-full pr-10"
                        >
                          {headersList.length === 0 ? (
                            <NativeSelectOption value="">
                              {isPreviewLoading ? "Memuat kolom..." : "Tidak ada kolom tersedia"}
                            </NativeSelectOption>
                          ) : (
                            headersList.map((h) => (
                              <NativeSelectOption key={h} value={h}>
                                {h}
                              </NativeSelectOption>
                            ))
                          )}
                        </NativeSelect>
                        {isPreviewLoading && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
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
                        onClick={handleDryRun}
                        disabled={!file || !name || !sheetUniqueKey || isPreviewLoading || isSubmitting || isDryRunning}
                      >
                        {isDryRunning ? (
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
              </CardContent>
            </Card>

            {/* Bottom Actions Card for final Submit */}
            {dryRunResult && (
              <Card className="border-emerald-200 bg-emerald-50/30">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2Icon className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-emerald-900 text-sm">Uji Coba Berhasil Dilakukan</h4>
                      <p className="text-xs text-emerald-700 mt-1">
                        Silakan periksa data pratinjau di sebelah kanan. Jika sudah sesuai, klik tombol simpan untuk meng-import program secara resmi.
                      </p>
                    </div>
                  </div>

                  {dryRunResult.stats.errorCount > 0 && (
                    <Alert variant="destructive" className="bg-destructive/5 py-3 border-destructive/20 text-destructive-foreground">
                      <AlertTriangleIcon className="h-4 w-4 shrink-0" />
                      <AlertTitle className="text-xs font-semibold">Terdapat {dryRunResult.stats.errorCount} Masalah Validasi</AlertTitle>
                      <AlertDescription className="text-[11px]">
                        Beberapa baris data memiliki ID Unik kosong atau duplikat. Baris yang bermasalah akan ditandai di dashboard admin setelah import selesai.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      asChild
                      disabled={isSubmitting}
                      className="bg-white"
                    >
                      <Link href="/programs">Batal</Link>
                    </Button>
                    <Button
                      type="button"
                      onClick={(e) => handleSubmit(e)}
                      disabled={isSubmitting}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2Icon className="h-4 w-4 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        <>
                          <DatabaseIcon className="h-4 w-4" />
                          Import Data
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* RIGHT COLUMN: Dry Run Result & Preview */}
          <div className="lg:col-span-8">
            {!file ? (
              <Card className="h-[450px] flex flex-col items-center justify-center border-dashed text-center p-6">
                <UploadCloudIcon className="h-12 w-12 text-muted-foreground/60 mb-4 animate-pulse" />
                <CardTitle className="text-lg font-medium text-foreground">Belum Ada File Diunggah</CardTitle>
                <CardDescription className="max-w-sm mt-1">
                  Silakan unggah file spreadsheet (.xlsx, .xls, .csv) terlebih dahulu di kolom kiri untuk melihat hasil pratinjau dan analisis data di sini.
                </CardDescription>
              </Card>
            ) : isDryRunning ? (
              <Card className="h-[450px] flex flex-col items-center justify-center p-6">
                <Loader2Icon className="h-10 w-10 animate-spin text-primary mb-4" />
                <CardTitle className="text-base font-medium text-foreground">Menjalankan Uji Coba (Dry Run)</CardTitle>
                <CardDescription className="max-w-xs mt-1">
                  Membaca baris data dan memvalidasi keunikan ID kolom terpilih...
                </CardDescription>
              </Card>
            ) : !dryRunResult ? (
              <Card className="h-[450px] flex flex-col items-center justify-center border-dashed text-center p-6">
                <PlayIcon className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <CardTitle className="text-base font-medium text-foreground">Menunggu Uji Coba</CardTitle>
                <CardDescription className="max-w-sm mt-1">
                  Klik tombol **"Jalankan Uji Coba (Dry Run)"** di panel konfigurasi sebelah kiri untuk memproses baris data & memvalidasi error keunikan sebelum melakukan import.
                </CardDescription>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Stats row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4 flex items-center justify-between shadow-sm">
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground font-medium">Total Baris Data</p>
                      <h3 className="text-2xl font-bold">{dryRunResult.stats.totalRows.toLocaleString("id-ID")}</h3>
                    </div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">Baris</Badge>
                  </Card>
                  <Card className="p-4 flex items-center justify-between shadow-sm">
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground font-medium">Total Kolom</p>
                      <h3 className="text-2xl font-bold">{dryRunResult.stats.totalColumns}</h3>
                    </div>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">Kolom</Badge>
                  </Card>
                  <Card className="p-4 flex items-center justify-between shadow-sm">
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground font-medium">Masalah Validasi</p>
                      <h3 className={`text-2xl font-bold ${dryRunResult.stats.errorCount > 0 ? "text-destructive" : "text-emerald-600"}`}>
                        {dryRunResult.stats.errorCount}
                      </h3>
                    </div>
                    {dryRunResult.stats.errorCount > 0 ? (
                      <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">Error</Badge>
                    ) : (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Valid</Badge>
                    )}
                  </Card>
                </div>

                {/* Detailed Preview / Error Logs Tabs */}
                <Card className="shadow-sm">
                  <Tabs defaultValue="preview" className="w-full">
                    <CardHeader className="border-b px-6 py-4 flex flex-row items-center justify-between space-y-0">
                      <div>
                        <CardTitle className="text-base font-semibold">Hasil Analisis Dry Run</CardTitle>
                        <CardDescription>Pratinjau struktur data dan log error validasi.</CardDescription>
                      </div>
                      <TabsList className="grid grid-cols-2 w-[280px]">
                        <TabsTrigger value="preview" className="flex items-center gap-1.5 text-xs">
                          <EyeIcon className="h-3.5 w-3.5" />
                          Pratinjau Data
                        </TabsTrigger>
                        <TabsTrigger value="errors" className="flex items-center gap-1.5 text-xs">
                          <AlertTriangleIcon className="h-3.5 w-3.5" />
                          Log Validasi ({dryRunResult.stats.errorCount})
                        </TabsTrigger>
                      </TabsList>
                    </CardHeader>
                    
                    <CardContent className="p-0">
                      {/* PREVIEW TAB */}
                      <TabsContent value="preview" className="m-0">
                        {dryRunResult.previewRows.length === 0 ? (
                          <div className="p-8 text-center text-muted-foreground text-sm">
                            Tidak ada data untuk ditampilkan.
                          </div>
                        ) : (
                          <div className="overflow-x-auto max-h-[400px]">
                            <Table>
                              <TableHeader className="bg-muted/40 sticky top-0 z-10">
                                <TableRow>
                                  <TableHead className="w-12 text-center bg-muted/40">No. Baris</TableHead>
                                  {headersList.map((header) => (
                                    <TableHead key={header} className={header === sheetUniqueKey ? "font-bold text-primary animate-pulse" : ""}>
                                      {header} {header === sheetUniqueKey && "🔑"}
                                    </TableHead>
                                  ))}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {dryRunResult.previewRows.map((row, idx) => {
                                  const isRowError = dryRunResult.errors.some((e) => e.row === row["__sheetRowIndex"]);
                                  return (
                                    <TableRow 
                                      key={idx}
                                      className={isRowError ? "bg-destructive/3 hover:bg-destructive/5" : ""}
                                    >
                                      <TableCell className="text-center font-mono text-xs text-muted-foreground">
                                        {row["__sheetRowIndex"]}
                                      </TableCell>
                                      {headersList.map((header) => {
                                        const cellVal = row[header];
                                        return (
                                          <TableCell 
                                            key={header} 
                                            className={header === sheetUniqueKey ? "font-medium" : ""}
                                          >
                                            {cellVal !== null && cellVal !== undefined ? String(cellVal) : ""}
                                          </TableCell>
                                        );
                                      })}
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                        <div className="p-4 border-t bg-muted/20 flex items-center gap-2">
                          <InfoIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                          <p className="text-xs text-muted-foreground">
                            Hanya menampilkan 10 baris pertama untuk keperluan pratinjau.
                          </p>
                        </div>
                      </TabsContent>

                      {/* ERRORS TAB */}
                      <TabsContent value="errors" className="m-0">
                        {dryRunResult.errors.length === 0 ? (
                          <div className="p-12 flex flex-col items-center justify-center text-center">
                            <CheckCircle2Icon className="h-10 w-10 text-emerald-500 mb-3" />
                            <h4 className="font-semibold text-sm">Tidak Ada Masalah Validasi</h4>
                            <p className="text-xs text-muted-foreground max-w-xs mt-1">
                              Semua data pada kolom unik telah terisi penuh dan bebas dari duplikasi.
                            </p>
                          </div>
                        ) : (
                          <div className="divide-y max-h-[400px] overflow-y-auto">
                            {dryRunResult.errors.map((error, idx) => (
                              <div key={idx} className="p-4 flex items-start gap-3 hover:bg-muted/30">
                                <AlertTriangleIcon className="h-4.5 w-4.5 text-destructive shrink-0 mt-0.5" />
                                <div className="space-y-0.5">
                                  <p className="text-xs font-semibold text-foreground">
                                    Baris {error.row}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Kolom: <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[11px]">{error.column}</span> — {error.message}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </TabsContent>
                    </CardContent>
                  </Tabs>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
