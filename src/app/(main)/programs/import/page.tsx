"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeftIcon, 
  UploadIcon, 
  FileSpreadsheetIcon, 
  AlertCircleIcon, 
  CheckCircle2Icon, 
  PlayIcon, 
  Loader2Icon,
  InfoIcon,
  LayoutTemplateIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import ExcelJS from "exceljs";
import { type Program } from "@/types";
import { useProgram, useCreateProgram } from "@/hooks/use-programs";
import { toast } from "sonner";

interface ParseError {
  row: number;
  column: string;
  message: string;
}

export default function ImportProgramPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  // Form states
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isDryRun, setIsDryRun] = React.useState(true);

  // File states
  const [file, setFile] = React.useState<File | null>(null);
  const [isParsing, setIsParsing] = React.useState(false);
  const [headers, setHeaders] = React.useState<string[]>([]);
  const parsedDataRef = React.useRef<Record<string, any>[]>([]);
  const [previewData, setPreviewData] = React.useState<Record<string, any>[]>([]);
  const [totalRows, setTotalRows] = React.useState(0);
  const [errors, setErrors] = React.useState<ParseError[]>([]);
  
  // Dry run dialog state
  const [showSimulateDialog, setShowSimulateDialog] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);

  // Load data if editing/viewing detail
  const { data: existingProgram, isLoading: isProgramLoading } = useProgram(editId);
  const createMutation = useCreateProgram();

  React.useEffect(() => {
    if (existingProgram) {
      setName(existingProgram.name);
      setDescription(existingProgram.description);
      setHeaders(existingProgram.headers);
      const editData = Array.isArray(existingProgram.data) ? existingProgram.data : [];
      parsedDataRef.current = editData;
      setPreviewData(editData.slice(0, 5));
      setTotalRows(editData.length);
      setErrors([]);
      // Mock a file name
      setFile(new File([], `imported-data-${editId}.xlsx`));
    }
  }, [existingProgram, editId]);

  // Handle Drag & Drop events
  const [dragActive, setDragActive] = React.useState(false);
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith(".xlsx") && !selectedFile.name.endsWith(".xls")) {
      toast.error("Format file harus .xlsx atau .xls");
      return;
    }
    setFile(selectedFile);
    setIsParsing(true);
    setErrors([]);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(buffer);
          
          const worksheet = workbook.worksheets[0];
          if (!worksheet) {
            toast.error("Excel sheet kosong atau rusak.");
            setIsParsing(false);
            return;
          }

          const extractedHeaders: string[] = [];
          const extractedRows: Record<string, any>[] = [];
          const validationErrors: ParseError[] = [];

          worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber === 1) {
              // Extract headers
              row.eachCell({ includeEmpty: false }, (cell) => {
                extractedHeaders.push(cell.value?.toString().trim() || "");
              });
            } else {
              // Extract row value mappings
              const rowData: Record<string, any> = {};
              extractedHeaders.forEach((header, idx) => {
                const cell = row.getCell(idx + 1);
                let val = cell.value;
                
                // Resolve formula values or rich text
                if (val && typeof val === "object") {
                  if ("result" in val) val = val.result;
                  else if ("richText" in val && Array.isArray(val.richText)) {
                    val = val.richText.map((t: any) => t.text).join("");
                  } else if ("text" in val) {
                    val = val.text;
                  }
                }
                
                rowData[header] = val !== null && val !== undefined ? String(val).trim() : "";
              });

              // Simple Validation Checks
              extractedHeaders.forEach((header) => {
                const val = rowData[header];
                const cleanHeader = header.toLowerCase();

                // 1. Check for empty cells in common required headers (only primary name fields)
                const requiredNameHeaders = [
                  "nama", "name", 
                  "nama lengkap", "nama_lengkap", 
                  "full name", "fullname", 
                  "nama peserta", "nama_peserta", 
                  "nama siswa", "nama_siswa", 
                  "nama mahasiswa", "nama_mahasiswa"
                ];
                const isRequiredName = requiredNameHeaders.includes(cleanHeader);

                if (isRequiredName && !val) {
                  validationErrors.push({
                    row: rowNumber,
                    column: header,
                    message: "Nama tidak boleh kosong",
                  });
                }

                // 2. Check for basic email format validity
                if (cleanHeader.includes("email") && val) {
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (!emailRegex.test(val)) {
                    validationErrors.push({
                      row: rowNumber,
                      column: header,
                      message: "Format email tidak valid",
                    });
                  }
                }

                // 3. Check for phone number length/digit checks
                if ((cleanHeader.includes("telp") || cleanHeader.includes("phone") || cleanHeader.includes("hp")) && val) {
                  const phoneDigits = val.replace(/\D/g, "");
                  if (phoneDigits.length < 8) {
                    validationErrors.push({
                      row: rowNumber,
                      column: header,
                      message: "Nomor telepon terlalu pendek",
                    });
                  }
                }
              });

              extractedRows.push(rowData);
            }
          });

          setHeaders(extractedHeaders);
          parsedDataRef.current = extractedRows;
          setPreviewData(extractedRows.slice(0, 5));
          setTotalRows(extractedRows.length);
          setErrors(validationErrors);
          toast.success("Excel file berhasil diproses");
        } catch (error) {
          console.error(error);
          toast.error("Gagal membaca isi file Excel. Pastikan file valid.");
        } finally {
          setIsParsing(false);
        }
      };

      reader.readAsArrayBuffer(selectedFile);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memproses file.");
      setIsParsing(false);
    }
  };

  // TanStack Table Column Definition for Preview (Top 5 rows)
  const columns = React.useMemo(() => {
    return (headers || []).map((header) => ({
      accessorKey: header,
      header: header,
      cell: (info: any) => {
        const value = info.getValue() as string;
        const rowIdx = info.row.index + 2; // 1-indexed plus header row offset
        const cellError = errors.find((err) => err.row === rowIdx && err.column === header);

        if (cellError) {
          return (
            <span className="text-destructive font-medium flex items-center gap-1 bg-red-50 dark:bg-red-950/20 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-900/50" title={cellError.message}>
              <AlertCircleIcon className="size-3 shrink-0" />
              {value || "[Kosong]"}
            </span>
          );
        }
        return <span>{value || "-"}</span>;
      },
    }));
  }, [headers, errors]);

  const table = useReactTable({
    data: previewData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleImport = async () => {
    if (!name.trim()) {
      toast.error("Nama Program/Event wajib diisi");
      return;
    }
    if (totalRows === 0) {
      toast.error("Silakan upload file Excel yang berisi data terlebih dahulu");
      return;
    }

    if (isDryRun) {
      setShowSimulateDialog(true);
    } else {
      executeSave();
    }
  };

  const executeSave = () => {
    setIsImporting(true);
    createMutation.mutate({
      name,
      description,
      headers,
      data: parsedDataRef.current,
    }, {
      onSuccess: () => {
        setIsImporting(false);
        setShowSimulateDialog(false);
        toast.success(`Program "${name}" berhasil di-import!`);
        router.push("/programs");
      },
      onError: (err) => {
        setIsImporting(false);
        toast.error("Gagal menyimpan program ke database");
      }
    });
  };

  if (isProgramLoading && editId) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6 items-center justify-center min-h-[400px]">
        <Loader2Icon className="size-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Memuat detail program...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden font-sans">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-6">
        <div className="flex items-center gap-2 px-1">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/programs">Programs</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{editId ? "Detail Program" : "Import Excel"}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <Button variant="outline" size="sm" asChild className="gap-1.5 h-8 text-xs">
          <Link href="/programs">
            <ArrowLeftIcon className="size-4" />
            Kembali
          </Link>
        </Button>
      </header>

      {/* ── Content Area ───────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {editId ? "Detail Program & Data" : "Import Data dari Excel"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {editId 
              ? "Melihat informasi program dan preview data Excel yang sudah disimpan."
              : "Silakan isi detail program dan unggah berkas Excel Anda untuk pengecekan data."
            }
          </p>
        </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Form Inputs (Left Column) ────────────────────── */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Metadata Program</CardTitle>
              <CardDescription>Informasi umum tentang program/event.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="programName">Nama Program / Event <span className="text-red-500">*</span></Label>
                <Input
                  id="programName"
                  placeholder="Contoh: Beasiswa Prestasi 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!!editId}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  placeholder="Tulis penjelasan singkat tentang program ini..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[100px]"
                  disabled={!!editId}
                />
              </div>

              {!editId && (
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div className="space-y-0.5">
                    <Label htmlFor="dryRun" className="text-sm font-medium">Dry Run (Simulasi)</Label>
                    <p className="text-xs text-muted-foreground max-w-[200px]">
                      Hanya verifikasi format data tanpa menyimpannya ke database list.
                     </p>
                  </div>
                  <Switch
                    id="dryRun"
                    checked={isDryRun}
                    onCheckedChange={setIsDryRun}
                  />
                </div>
              )}
            </CardContent>

          </Card>
        </div>

        {/* ── File Uploader (Right Column) ──────────────────── */}
        <div className="space-y-6 lg:col-span-2">
          {!editId && (
            <Card>
              <CardHeader>
                <CardTitle>Unggah Berkas Excel</CardTitle>
                <CardDescription>Format file yang didukung: .xlsx, .xls</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                    dragActive 
                      ? "border-primary bg-primary/5 scale-[0.99]" 
                      : file 
                        ? "border-emerald-500/50 bg-emerald-50/10" 
                        : "border-muted-foreground/20 hover:bg-muted/10"
                  }`}
                >
                  <div className={`p-4 rounded-full mb-4 ${file ? "bg-emerald-100 text-emerald-600" : "bg-primary/10 text-primary"}`}>
                    <UploadIcon className="size-6" />
                  </div>

                  {file ? (
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                      <Button variant="outline" size="sm" className="mt-4" onClick={() => setFile(null)}>
                        Ganti File
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium text-sm">Tarik dan taruh berkas di sini, atau</p>
                      <label className="inline-block mt-3">
                        <span className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-colors shadow">
                          Pilih File Excel
                        </span>
                        <input
                          type="file"
                          accept=".xlsx, .xls"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileChange(e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Data Metrics Summary & TanStack Table Preview ── */}
          {(isParsing || file || editId) && (
            <Card className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20 py-4">
                <div>
                  <CardTitle className="text-base font-semibold">
                    {editId ? "Data Program" : "Preview & Pengecekan Data"}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {editId ? "Preview baris data yang di-import." : "Hasil analisis validasi data dari file Excel."}
                  </CardDescription>
                </div>
                {isParsing && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2Icon className="size-3.5 animate-spin" />
                    Membaca berkas...
                  </span>
                )}
              </CardHeader>

              <CardContent className="p-0">
                {/* Stats row */}
                {!isParsing && totalRows > 0 && (
                  <div className="grid grid-cols-3 divide-x border-b bg-muted/5 text-center">
                    <div className="p-4">
                      <span className="text-xs text-muted-foreground block">Jumlah Field</span>
                      <span className="text-xl font-bold mt-0.5 block">{headers.length} Kolom</span>
                    </div>
                    <div className="p-4">
                      <span className="text-xs text-muted-foreground block">Total Baris Data</span>
                      <span className="text-xl font-bold mt-0.5 block">{totalRows} Baris</span>
                    </div>
                    <div className="p-4">
                      <span className="text-xs text-muted-foreground block">Jumlah Temuan Error</span>
                      <span className={`text-xl font-bold mt-0.5 block ${errors.length > 0 ? "text-destructive" : "text-emerald-600"}`}>
                        {errors.length} Error
                      </span>
                    </div>
                  </div>
                )}

                {/* TanStack Table Preview Grid */}
                {!isParsing && totalRows > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b bg-muted/40 text-muted-foreground font-medium text-xs">
                          {table.getHeaderGroups().map((headerGroup) =>
                            headerGroup.headers.map((header) => (
                              <th key={header.id} className="p-3 text-left border-r last:border-r-0 font-semibold">
                                {flexRender(header.column.columnDef.header, header.getContext())}
                              </th>
                            ))
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {table.getRowModel().rows.map((row) => (
                          <tr key={row.id} className="border-b last:border-0 hover:bg-muted/10">
                            {row.getVisibleCells().map((cell) => (
                              <td key={cell.id} className="p-3 border-r last:border-r-0 max-w-[200px] truncate">
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="p-3 bg-muted/10 border-t flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <InfoIcon className="size-3.5" />
                        Menampilkan top {previewData.length} baris data pertama sebagai contoh.
                      </span>
                      {errors.length > 0 && (
                        <span className="text-destructive font-medium">
                          Silakan perbaiki field berwarna merah sebelum menyimpan program.
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center text-muted-foreground">
                    Belum ada data untuk ditampilkan. Unggah berkas Excel di atas.
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action buttons */}
          {!editId && (
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" asChild>
                <Link href="/programs">Batal</Link>
              </Button>
              <Button
                onClick={handleImport}
                disabled={totalRows === 0 || !name.trim() || isParsing}
                className="min-w-[140px] gap-1.5"
              >
                {isDryRun ? (
                  <>
                    <PlayIcon className="size-4" />
                    Simulasi Dry Run
                  </>
                ) : (
                  "Import & Simpan"
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── Dry Run Simulation Dialog ──────────────────────── */}
      <Dialog open={showSimulateDialog} onOpenChange={setShowSimulateDialog}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <CheckCircle2Icon className="size-6 text-emerald-500" />
              Hasil Simulasi Dry Run
            </DialogTitle>
            <DialogDescription className="pt-2">
              Analisis struktur data Excel berhasil disimulasikan secara lengkap.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 border rounded-lg p-4 bg-muted/30 text-sm">
              <div>
                <span className="text-muted-foreground block text-xs">Nama Program</span>
                <span className="font-semibold block mt-0.5 truncate">{name}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Total Data</span>
                <span className="font-semibold block mt-0.5">{totalRows} Baris</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Detected Headers</span>
                <span className="font-semibold block mt-0.5">{headers.length} Kolom</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Tingkat Error</span>
                <span className={`font-semibold block mt-0.5 ${errors.length > 0 ? "text-destructive" : "text-emerald-600"}`}>
                  {errors.length} Temuan Error
                </span>
              </div>
            </div>

            <div className="text-sm space-y-2">
              <span className="font-semibold block">Hasil Review Struktur</span>
              {errors.length > 0 ? (
                <div className="p-3 bg-red-50 border border-red-200 text-destructive rounded-lg flex gap-2">
                  <AlertCircleIcon className="size-4 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-medium">Data memiliki beberapa temuan kesalahan format:</p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {errors.slice(0, 3).map((err, idx) => (
                        <li key={idx}>Baris {err.row}, Kolom {err.column}: {err.message}</li>
                      ))}
                      {errors.length > 3 && <li>Dan {errors.length - 3} kesalahan lainnya.</li>}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex gap-2">
                  <CheckCircle2Icon className="size-4 shrink-0 mt-0.5 text-emerald-600" />
                  <p className="text-xs font-medium">
                    Semua kolom dan baris sudah lolos verifikasi skema awal. Siap untuk disimpan.
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowSimulateDialog(false)}>
              Tutup
            </Button>
            <Button 
              onClick={executeSave} 
              disabled={isImporting}
              className="gap-1.5"
            >
              {isImporting && <Loader2Icon className="size-3.5 animate-spin" />}
              Simpan Permanen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
