"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  UploadCloud,
  Loader2,
  Play,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { PageLayout, PageHeader, PageContent } from "@/components/dashboard";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQueryClient } from "@tanstack/react-query";

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

function parseWorksheet(worksheet: any): { headers: string[]; rawHeaders: string[]; rows: Record<string, any>[] } {
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

  const rawHeaders = headers.filter(h => h.length > 0);
  const cleanHeaders = Array.from(new Set(rawHeaders));

  const rows: Record<string, any>[] = [];
  worksheet.eachRow({ includeEmpty: false }, (row: any, rowNumber: number) => {
    if (rowNumber <= (headerRowNumber || 1)) return;

    const rowData: Record<string, any> = {};
    rawHeaders.forEach((header, idx) => {
      const cell = row.getCell(idx + 1);
      if (rowData[header] === undefined) {
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
      }
    });
    rowData["__sheetRowIndex"] = rowNumber;
    rows.push(rowData);
  });

  return { headers: cleanHeaders, rawHeaders, rows };
}

export default function ImportProgramPage() {
  const router = useRouter();
  
  // Fields for Program Metadata
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");


  // File uploading states
  const [file, setFile] = React.useState<File | null>(null);
  const [sheets, setSheets] = React.useState<string[]>([]);
  const [headersList, setHeadersList] = React.useState<string[]>([]);
  const [rawHeaders, setRawHeaders] = React.useState<string[]>([]);
  const [sheetName, setSheetName] = React.useState("");
  const [sheetUniqueKey, setSheetUniqueKey] = React.useState("");
  
  const [isPreviewLoading, setIsPreviewLoading] = React.useState(false);
  const [isDryRunning, setIsDryRunning] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const [dryRunResult, setDryRunResult] = React.useState<DryRunResult | null>(null);
  const [currentSheetRows, setCurrentSheetRows] = React.useState<Record<string, any>[]>([]);
  
  const [progressCount, setProgressCount] = React.useState(0);
  const [totalProgressRows, setTotalProgressRows] = React.useState(0);
  const [isImporting, setIsImporting] = React.useState(false);
  
  const workbookRef = React.useRef<any>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleResetFile = () => {
    setFile(null);
    setSheets([]);
    setHeadersList([]);
    setRawHeaders([]);
    setSheetName("");
    setSheetUniqueKey("");
    setDryRunResult(null);
    setCurrentSheetRows([]);
    workbookRef.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.success("Berkas dan hasil pengujian berhasil direset.");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsPreviewLoading(true);
    setSheets([]);
    setHeadersList([]);
    setRawHeaders([]);
    setSheetName("");
    setSheetUniqueKey("");
    setDryRunResult(null);
    setCurrentSheetRows([]);
    workbookRef.current = null;

    try {
      const nameLower = selectedFile.name.toLowerCase();
      let sheetNamesList: string[] = [];
      let initialHeaders: string[] = [];
      let initialRawHeaders: string[] = [];
      let parsedRows: Record<string, any>[] = [];

      if (nameLower.endsWith(".csv")) {
        const text = await selectedFile.text();
        const csvData = parseCSV(text);
        if (csvData.length === 0) {
          throw new Error("File CSV kosong.");
        }
        sheetNamesList = ["CSV Data"];
        initialRawHeaders = csvData[0].map(h => h.trim()).filter(h => h.length > 0);
        initialHeaders = Array.from(new Set(initialRawHeaders));
        parsedRows = csvData.slice(1).map((row, idx) => {
          const rowData: Record<string, any> = {};
          initialRawHeaders.forEach((header, colIdx) => {
            if (rowData[header] === undefined) {
              rowData[header] = (row[colIdx] || "").trim();
            }
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
        initialRawHeaders = parsed.rawHeaders;
        parsedRows = parsed.rows;
      }

      setSheets(sheetNamesList);
      if (sheetNamesList.length > 0) {
        setSheetName(sheetNamesList[0]);
      }
      setHeadersList(initialHeaders);
      setRawHeaders(initialRawHeaders);
      if (initialHeaders.length > 0) {
        setSheetUniqueKey(initialHeaders[0]);
      }
      setCurrentSheetRows(parsedRows);
      toast.success("File spreadsheet berhasil di-parse!");
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
    setRawHeaders([]);
    setSheetUniqueKey("");
    setDryRunResult(null);
    setCurrentSheetRows([]);

    try {
      let initialHeaders: string[] = [];
      let initialRawHeaders: string[] = [];
      let parsedRows: Record<string, any>[] = [];

      if (file.name.toLowerCase().endsWith(".csv")) {
        const text = await file.text();
        const csvData = parseCSV(text);
        initialRawHeaders = csvData[0].map(h => h.trim()).filter(h => h.length > 0);
        initialHeaders = Array.from(new Set(initialRawHeaders));
        parsedRows = csvData.slice(1).map((row, idx) => {
          const rowData: Record<string, any> = {};
          initialRawHeaders.forEach((header, colIdx) => {
            if (rowData[header] === undefined) {
              rowData[header] = (row[colIdx] || "").trim();
            }
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
        initialRawHeaders = parsed.rawHeaders;
        parsedRows = parsed.rows;
      }

      setHeadersList(initialHeaders);
      setRawHeaders(initialRawHeaders);
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
    if (!file || !sheetUniqueKey) {
      toast.error("Harap unggah file dan pilih kolom ID Unik.");
      return;
    }

    setIsDryRunning(true);
    setDryRunResult(null);

    setTimeout(() => {
      try {
        const errors: any[] = [];

        // Detect duplicate headers
        const seen = new Set<string>();
        const duplicateHeaders: string[] = [];
        rawHeaders.forEach((header) => {
          const lowerHeader = header.toLowerCase();
          if (seen.has(lowerHeader)) {
            if (!duplicateHeaders.includes(header)) {
              duplicateHeaders.push(header);
            }
          } else {
            seen.add(lowerHeader);
          }
        });

        duplicateHeaders.forEach((header) => {
          errors.push({
            row: 0,
            column: header,
            message: `Header duplikat: Kolom "${header}" muncul lebih dari satu kali.`
          });
        });

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

    if (!name || !file || !sheetUniqueKey) {
      toast.error("Harap lengkapi semua data wajib.");
      return;
    }

    setIsSubmitting(true);
    setIsImporting(true);
    const totalRows = currentSheetRows.length;
    setTotalProgressRows(totalRows);
    setProgressCount(0);

    try {
      // 1. Start the import by creating program metadata
      const startRes = await fetch("/api/programs/import/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          uniqueKeyColumn: sheetUniqueKey,
          totalRows,
          fieldCount: headersList.length,
          errorCount: dryRunResult?.stats.errorCount || 0,
          fileName: file.name,
          headers: headersList,

        }),
      });

      if (!startRes.ok) {
        const startData = await startRes.json().catch(() => ({ error: "Gagal menginisiasi program." }));
        throw new Error(startData.error || "Gagal menginisiasi program.");
      }

      const program = await startRes.json();
      const programId = program.id;

      // 2. Chunk data & insert sequentially
      const chunkSize = 100;
      let importedCount = 0;

      for (let i = 0; i < totalRows; i += chunkSize) {
        const chunk = currentSheetRows.slice(i, i + chunkSize);

        const chunkRes = await fetch("/api/programs/import/chunk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            programId,
            rows: chunk,
            headers: headersList,
            uniqueKeyColumn: sheetUniqueKey,
            startRowIndex: i,
          }),
        });

        if (!chunkRes.ok) {
          const chunkData = await chunkRes.json().catch(() => ({ error: `Gagal mengimpor baris ke ${i + 1} sampai ${i + chunk.length}` }));
          throw new Error(chunkData.error || `Gagal mengimpor baris ke ${i + 1} sampai ${i + chunk.length}`);
        }

        importedCount += chunk.length;
        setProgressCount(importedCount);
      }

      // Invalidate cache and trigger list refresh
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      toast.success(`Program "${name}" berhasil dibuat dengan ${totalRows} data!`);
      router.push("/programs");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Terjadi kesalahan saat mengimpor program.");
    } finally {
      setIsSubmitting(false);
      setIsImporting(false);
    }
  };

  return (
    <PageLayout>
      <PageHeader>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <Link href="/programs" className="text-muted-foreground hover:text-foreground">
                Programs
              </Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Tambah Program</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <PageContent className="space-y-6 w-full max-w-[1200px] mx-auto pt-4">

        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild className="h-8 w-8">
            <Link href="/programs">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Buat Program Baru</h1>
            <p className="text-muted-foreground mt-0.5">
              Unggah file spreadsheet (Excel / CSV) untuk menginisiasi data peserta program verifikasi Anda.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-3">
          {/* Main Info Input */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informasi Program</CardTitle>
                <CardDescription>
                  Masukkan metadata detail dasar untuk program verifikasi ini.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field>
                  <FieldLabel htmlFor="program-name">Nama Program <span className="text-rose-500">*</span></FieldLabel>
                  <Input
                    id="program-name"
                    placeholder="Contoh: Penerima Beasiswa Batch II 2026"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="program-desc">Deskripsi Program</FieldLabel>
                  <Textarea
                    id="program-desc"
                    placeholder="Contoh: Verifikasi keabsahan data penerima beasiswa batch II tingkat provinsi..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isSubmitting}
                    rows={4}
                  />
                </Field>

              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <UploadCloud className="h-5 w-5 text-primary" />
                  Unggah Berkas Spreadsheet
                </CardTitle>
                <CardDescription>
                  Unggah file (.xlsx, .xls, .csv) yang berisi baris data peserta.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field>
                  <FieldLabel htmlFor="upload-file">Berkas Spreadsheet <span className="text-rose-500">*</span></FieldLabel>
                  <div className="relative">
                    <Input
                      id="upload-file"
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileChange}
                      required
                      className="pr-10"
                      disabled={isPreviewLoading || isSubmitting || isDryRunning}
                    />
                    {isPreviewLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="size-4 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                  {isPreviewLoading && (
                    <FieldDescription>
                      Membaca metadata & sheet file...
                    </FieldDescription>
                  )}
                </Field>

                {file && (
                  <>
                    {sheets.length > 1 && (
                      <Field>
                        <FieldLabel htmlFor="sheetName">Pilih Sheet (Tab)</FieldLabel>
                        <Select
                          value={sheetName}
                          onValueChange={(val) => handleSheetChange(val)}
                          disabled={isPreviewLoading || isSubmitting || isDryRunning}
                        >
                          <SelectTrigger id="sheetName" className="w-full">
                            <SelectValue placeholder="Pilih Sheet" />
                          </SelectTrigger>
                          <SelectContent>
                            {sheets.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    )}

                    <Field>
                      <FieldLabel htmlFor="sheetUniqueKey">Kolom ID Unik (Unique Key) <span className="text-rose-500">*</span></FieldLabel>
                      <div className="relative">
                        <Select
                          value={sheetUniqueKey}
                          onValueChange={(val) => {
                            setSheetUniqueKey(val);
                            setDryRunResult(null);
                          }}
                          disabled={isPreviewLoading || isSubmitting || isDryRunning || headersList.length === 0}
                        >
                          <SelectTrigger id="sheetUniqueKey" className="w-full">
                            <SelectValue placeholder={isPreviewLoading ? "Memuat kolom..." : "Pilih kolom ID Unik"} />
                          </SelectTrigger>
                          <SelectContent>
                            {headersList.map((h) => (
                              <SelectItem key={h} value={h}>
                                {h}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <FieldDescription>
                        Pilih kolom dengan nilai unik (contoh: NIK, NIM, Email, No. Pendaftaran) untuk mendeteksi keunikan data tiap peserta.
                      </FieldDescription>
                    </Field>

                    <div className="pt-2 flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5"
                        onClick={handleResetFile}
                        disabled={isPreviewLoading || isSubmitting || isDryRunning}
                      >
                        Reset File
                      </Button>
                      <Button
                        type="button"
                        className="flex-2 flex items-center justify-center gap-2"
                        variant="secondary"
                        onClick={handleDryRun}
                        disabled={!file || !sheetUniqueKey || isPreviewLoading || isSubmitting || isDryRunning}
                      >
                        {isDryRunning ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Menguji Data...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 text-emerald-600" />
                            Jalankan Uji Coba (Dry Run)
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}

                {/* Dry Run Result UI */}
                {dryRunResult && (
                  <div className="mt-4 border-t pt-4 space-y-4">
                    <div className="flex items-start gap-3">
                      {dryRunResult.stats.errorCount > 0 ? (
                        <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <h4 className="font-semibold text-foreground text-sm">
                          {dryRunResult.stats.errorCount > 0 ? "Uji Coba Dry Run Gagal" : "Uji Coba Dry Run Selesai"}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {dryRunResult.stats.errorCount > 0
                            ? "Harap perbaiki error di bawah ini pada file Excel Anda."
                            : "Silakan tinjau rangkuman data di bawah ini sebelum membuat program."}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 border rounded bg-muted/30">
                        <p className="text-[10px] text-muted-foreground">Baris Data</p>
                        <p className="text-sm font-bold">{dryRunResult.stats.totalRows}</p>
                      </div>
                      <div className="p-2 border rounded bg-muted/30">
                        <p className="text-[10px] text-muted-foreground">Jumlah Kolom</p>
                        <p className="text-sm font-bold">{dryRunResult.stats.totalColumns}</p>
                      </div>
                      <div className="p-2 border rounded bg-muted/30">
                        <p className="text-[10px] text-muted-foreground">Error Validasi</p>
                        <p className={`text-sm font-bold ${dryRunResult.stats.errorCount > 0 ? "text-rose-500" : "text-emerald-600"}`}>
                          {dryRunResult.stats.errorCount}
                        </p>
                      </div>
                    </div>

                    {dryRunResult.errors.length > 0 && (
                      <div className="border border-destructive/20 rounded-lg overflow-hidden">
                        <div className="bg-destructive/5 px-3 py-2 flex items-center gap-2 border-b border-destructive/15">
                          <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                          <span className="text-[11px] font-semibold text-destructive">
                            Daftar {dryRunResult.errors.length} Error yang Harus Diperbaiki
                          </span>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          <table className="w-full text-[11px] border-collapse">
                            <thead className="bg-muted/50 sticky top-0 border-b border-border">
                              <tr>
                                <th className="text-left px-3 py-1.5 font-semibold text-muted-foreground w-20">Baris</th>
                                <th className="text-left px-3 py-1.5 font-semibold text-muted-foreground w-24">Kolom</th>
                                <th className="text-left px-3 py-1.5 font-semibold text-muted-foreground">Keterangan Error</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dryRunResult.errors.map((err, i) => (
                                <tr key={i} className="border-t border-border/40 hover:bg-muted/30">
                                  <td className="px-3 py-1.5 text-muted-foreground">
                                    {err.row === 0 ? "Header" : `Baris ${err.row}`}
                                  </td>
                                  <td className="px-3 py-1.5 font-medium text-foreground">{err.column}</td>
                                  <td className="px-3 py-1.5 text-destructive">{err.message}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Action panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Ringkasan Konfigurasi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Nama File:</span>
                  <span className="font-semibold text-foreground truncate max-w-[150px]">{file ? file.name : "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Jumlah Baris:</span>
                  <span className="font-semibold text-foreground">{file ? currentSheetRows.length : "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pilihan Sheet:</span>
                  <span className="font-semibold text-foreground">{sheetName || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span>ID Unik:</span>
                  <span className="font-semibold text-foreground">{sheetUniqueKey || "-"}</span>
                </div>
                <Separator />

                {isImporting && (
                  <div className="space-y-2 py-2">
                    <div className="flex justify-between font-medium text-foreground">
                      <span>Progres Impor:</span>
                      <span>{progressCount} / {totalProgressRows} ({totalProgressRows > 0 ? Math.round((progressCount / totalProgressRows) * 100) : 0}%)</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-emerald-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${totalProgressRows > 0 ? (progressCount / totalProgressRows) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                )}

                {dryRunResult && !isImporting && (
                  <div className="space-y-2">
                    <Button
                      type="submit"
                      className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={
                        !name || 
                        !file || 
                        !sheetUniqueKey || 
                        isSubmitting || 
                        isPreviewLoading || 
                        dryRunResult.stats.errorCount > 0
                      }
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Membuat...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Simpan & Buat Program
                        </>
                      )}
                    </Button>
                    {dryRunResult.stats.errorCount > 0 && (
                      <p className="text-[10px] text-destructive text-center leading-normal">
                        Tombol dinonaktifkan. Silakan perbaiki semua error yang ditemukan saat Dry Run untuk melanjutkan.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                  Format File Excel
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2 leading-relaxed">
                <p>
                  1. Baris pertama (atau minimal dari 10 baris teratas yang berisi data) akan dianggap sebagai <strong>Header Kolom</strong>.
                </p>
                <p>
                  2. Pastikan file Anda memiliki minimal satu kolom identitas yang bersifat unik (seperti NIK, Email, NIM, Kode Pendaftaran) untuk dijadikan sebagai acuan evaluasi.
                </p>
                <p>
                  3. Format data tanggal, angka, dan teks lainnya akan dibaca sesuai isi cell spreadsheet Anda.
                </p>
              </CardContent>
            </Card>
          </div>
        </form>
      </PageContent>
    </PageLayout>
  );
}
