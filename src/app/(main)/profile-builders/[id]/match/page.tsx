"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeftIcon,
  FileSpreadsheetIcon,
  Loader2Icon,
  UploadIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  XCircleIcon,
  ArrowRightIcon,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLayout, PageHeader, PageContent } from "@/components/dashboard";
import { useProfileBuilder } from "@/hooks/use-profile-builders";
import { toast } from "sonner";

interface MatchPageProps {
  params: Promise<{ id: string }>;
}

// Client-side CSV Parser
function parseCSVHeaders(text: string): string[] {
  const result: string[] = [];
  let entry = "";
  let inQuotes = false;

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
      result.push(entry.trim());
      entry = "";
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      result.push(entry.trim());
      break; // Only need the first line
    } else {
      entry += char;
    }
  }
  if (entry) {
    result.push(entry.trim());
  }
  return result.filter((h) => h.length > 0);
}

export default function MatchHeaderPage({ params }: MatchPageProps) {
  const router = useRouter();
  const { id } = React.use(params);

  // Load Profile Builder
  const { data: builder, isLoading: isBuilderLoading } = useProfileBuilder(id);

  // States
  const [file, setFile] = useState<File | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [testResult, setTestResult] = useState<{
    excelHeaders: string[];
    usedHeaders: string[];
    unusedHeaders: string[];
    missingFields: string[];
  } | null>(null);

  // Get all field configurations from builder sections
  const builderFields = useMemo(() => {
    if (!builder || !builder.sections) return [];
    const sections = Array.isArray(builder.sections) ? builder.sections : [];
    return sections.flatMap((s: any) => s.fields || []);
  }, [builder]);

  const builderFieldLabels = useMemo(() => {
    return builderFields.map((f) => f.label);
  }, [builderFields]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setTestResult(null);
    }
  };

  const handleTestMatch = async () => {
    if (!file) {
      toast.error("Silakan pilih file terlebih dahulu");
      return;
    }

    setIsPending(true);
    try {
      const nameLower = file.name.toLowerCase();
      let excelHeaders: string[] = [];

      if (nameLower.endsWith(".csv")) {
        const text = await file.text();
        excelHeaders = parseCSVHeaders(text);
      } else if (nameLower.endsWith(".xlsx") || nameLower.endsWith(".xls")) {
        const ExcelJS = await import("exceljs");
        const workbook = new ExcelJS.Workbook();
        const buffer = await file.arrayBuffer();
        await workbook.xlsx.load(buffer);

        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
          throw new Error("File Excel tidak memiliki worksheet.");
        }

        // Find first non-empty row as header (check first 10 rows)
        let headerRow = worksheet.getRow(1);
        for (let i = 1; i <= Math.min(worksheet.rowCount, 10); i++) {
          const row = worksheet.getRow(i);
          const rowValues = row.values;
          if (
            rowValues &&
            (Array.isArray(rowValues)
              ? rowValues.some((v) => v !== null && v !== undefined)
              : Object.keys(rowValues).length > 0)
          ) {
            headerRow = row;
            break;
          }
        }

        const headersList: string[] = [];
        headerRow.eachCell({ includeEmpty: false }, (cell) => {
          const value = cell.value;
          if (value !== null && value !== undefined) {
            if (typeof value === "object" && "text" in value) {
              headersList.push(String(value.text).trim());
            } else {
              headersList.push(String(value).trim());
            }
          }
        });

        excelHeaders = Array.from(new Set(headersList.filter((h) => h.length > 0)));
      } else {
        throw new Error("Format file tidak didukung. Harap pilih file .xlsx, .xls, atau .csv.");
      }

      if (excelHeaders.length === 0) {
        throw new Error("Tidak menemukan header kolom di file tersebut.");
      }

      // Case-sensitive exact match
      const usedHeaders = excelHeaders.filter((header) => builderFieldLabels.includes(header));
      const unusedHeaders = excelHeaders.filter((header) => !builderFieldLabels.includes(header));
      const missingFields = builderFieldLabels.filter((label) => !excelHeaders.includes(label));

      setTestResult({
        excelHeaders,
        usedHeaders,
        unusedHeaders,
        missingFields,
      });

      toast.success("Pengujian kecocokan header selesai!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Gagal membaca atau memproses file.");
    } finally {
      setIsPending(false);
    }
  };

  if (isBuilderLoading) {
    return (
      <PageLayout>
        <div className="flex h-96 flex-col items-center justify-center gap-2 text-muted-foreground">
          <Loader2Icon className="size-8 animate-spin" />
          <p className="text-sm">Memuat data Profile Builder...</p>
        </div>
      </PageLayout>
    );
  }

  if (!builder) {
    return (
      <PageLayout>
        <div className="flex h-96 flex-col items-center justify-center gap-2 text-muted-foreground">
          <XCircleIcon className="size-8 text-destructive" />
          <p className="text-sm font-medium">Profile Builder tidak ditemukan.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push("/profile-builders")}>
            Kembali ke Daftar
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/profile-builders">
              <ChevronLeftIcon className="mr-1.5 size-4" />
              Kembali
            </Link>
          </Button>
        }
      >
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/profile-builders">Profile Builder</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium text-foreground">
                Cocokkan Header: {builder.name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <PageContent className="space-y-6 flex flex-col pt-4 w-full">
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b bg-muted/10">
            <div className="flex items-center gap-2.5">
              <div className="bg-primary/10 p-2 rounded-lg text-primary">
                <FileSpreadsheetIcon className="size-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Pengujian Kecocokan Header</CardTitle>
                <CardDescription>
                  Pilih file spreadsheet untuk menganalisis kecocokan kolom dengan form field <strong>{builder.name}</strong>.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* File Upload Zone */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-muted-foreground">UNGGAH FILE DATA PROGRAM (.xlsx, .xls, .csv)</label>
              <div className="relative border-2 border-dashed border-muted rounded-xl p-8 flex flex-col items-center justify-center gap-3 hover:border-primary/50 transition-colors bg-muted/5 group">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                  disabled={isPending}
                />
                <div className="bg-background p-3 rounded-full border shadow-sm group-hover:scale-105 transition-transform">
                  <UploadIcon className="size-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                {file ? (
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">Tarik file ke sini atau cari dokumen</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Format yang diterima: Excel Spreadsheet dan CSV</p>
                  </div>
                )}
              </div>
            </div>

            {/* Test Actions */}
            <div className="flex justify-end gap-3 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFile(null);
                  setTestResult(null);
                }}
                disabled={!file || isPending}
              >
                Reset
              </Button>
              <Button
                type="button"
                onClick={handleTestMatch}
                disabled={!file || isPending}
                className="min-w-[140px]"
              >
                {isPending ? (
                  <>
                    <Loader2Icon className="mr-2 size-4 animate-spin" />
                    Menguji...
                  </>
                ) : (
                  <>
                    Uji Kecocokan
                    <ArrowRightIcon className="ml-2 size-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Panel */}
        {testResult && (
          <div className="space-y-6">
            <h3 className="text-md font-bold text-foreground flex items-center gap-2">
              Hasil Analisis Kecocokan Header
            </h3>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Matches */}
              <Card className="border-emerald-500/20 bg-emerald-500/2 shadow-sm">

                <CardContent className="p-4 flex flex-col gap-1">
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Header Excel Cocok (Dipakai)
                  </span>
                  <span className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300">
                    {testResult.usedHeaders.length}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-1">
                    Kolom Excel terpetakan dengan benar di builder
                  </span>
                </CardContent>
              </Card>

              {/* Card 2: Unused */}
              <Card className="border-rose-500/20 bg-rose-500/2 shadow-sm">

                <CardContent className="p-4 flex flex-col gap-1">
                  <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                    Header Excel Tidak Dipakai
                  </span>
                  <span className="text-3xl font-extrabold text-rose-700 dark:text-rose-300">
                    {testResult.unusedHeaders.length}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-1">
                    Kolom di Excel tidak terdaftar di form builder
                  </span>
                </CardContent>
              </Card>

              {/* Card 3: Missing Fields */}
              <Card className="border-amber-500/20 bg-amber-500/2 shadow-sm">

                <CardContent className="p-4 flex flex-col gap-1">
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    Field Builder Hilang di Excel
                  </span>
                  <span className="text-3xl font-extrabold text-amber-700 dark:text-amber-300">
                    {testResult.missingFields.length}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-1">
                    Label form builder yang tidak ada di Excel
                  </span>
                </CardContent>
              </Card>
            </div>

            {/* Score Bar */}
            <Card className="shadow-sm">
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                  <span>Persentase Keselarasan (Match Rate)</span>
                  <span>
                    {Math.round(
                      (testResult.usedHeaders.length / Math.max(testResult.excelHeaders.length, 1)) * 100
                    )}
                    %
                  </span>
                </div>
                <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-500"
                    style={{
                      width: `${
                        (testResult.usedHeaders.length / Math.max(testResult.excelHeaders.length, 1)) * 100
                      }%`,
                    }}
                  />
                  <div
                    className="bg-rose-500 h-full transition-all duration-500"
                    style={{
                      width: `${
                        (testResult.unusedHeaders.length / Math.max(testResult.excelHeaders.length, 1)) * 100
                      }%`,
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Detailed breakdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Box 1: Excel Headers Unused */}
              <Card className="shadow-sm border-rose-500/10">
                <CardHeader className="pb-2 bg-rose-500/1 border-b">

                  <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                    <AlertTriangleIcon className="size-4 shrink-0" />
                    Header Excel Yang Tidak Dipakai ({testResult.unusedHeaders.length})
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Kolom-kolom ini ada di file Excel Anda, namun diabaikan karena tidak ada field berlabel sama pada layout builder.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  {testResult.unusedHeaders.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto">
                      {testResult.unusedHeaders.map((header) => (
                        <Badge key={header} variant="destructive" className="font-mono text-[10px]">
                          {header}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 py-2">
                      <CheckCircle2Icon className="size-4" />
                      Semua kolom header Excel terpetakan dan digunakan.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Box 2: Builder Fields Missing */}
              <Card className="shadow-sm border-amber-500/10">
                <CardHeader className="pb-2 bg-amber-500/1 border-b">

                  <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                    <AlertTriangleIcon className="size-4 shrink-0" />
                    Field Builder Yang Hilang Di Excel ({testResult.missingFields.length})
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Field-field di bawah ini ada di form Profile Builder Anda, tetapi kolom datanya tidak ditemukan di file Excel Anda.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  {testResult.missingFields.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto">
                      {testResult.missingFields.map((field) => (
                        <Badge
                          key={field}
                          variant="outline"
                          className="font-mono text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
                        >
                          {field}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 py-2">
                      <CheckCircle2Icon className="size-4" />
                      Semua field Profile Builder lengkap di Excel.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* List of matched headers */}
            {testResult.usedHeaders.length > 0 && (
              <Card className="shadow-sm">
                <CardHeader className="pb-2 bg-emerald-500/1 border-b">

                  <CardTitle className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2Icon className="size-4" />
                    Header Cocok / Terpetakan ({testResult.usedHeaders.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                    {testResult.usedHeaders.map((header) => (
                      <Badge
                        key={header}
                        variant="outline"
                        className="font-mono text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                      >
                        {header}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}
