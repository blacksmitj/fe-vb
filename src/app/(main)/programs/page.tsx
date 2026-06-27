"use client";

import * as React from "react";
import Link from "next/link";
import {
  PlusIcon,
  FileSpreadsheetIcon,
  CalendarIcon,
  TableIcon,
  Trash2Icon,
  AlertCircleIcon,
  CheckCircle2Icon,
  Loader2Icon,
  EyeIcon,
  LayoutTemplateIcon,
  ClipboardCheckIcon,
  ArrowUpDownIcon,
  SearchIcon,
  SettingsIcon,
  Share2Icon,
  LockIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type Program } from "@/types";
import { usePrograms } from "@/hooks/use-programs";
import { formatShortDate } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { PageLayout, PageHeader, PageContent } from "@/components/dashboard";
import { toast } from "sonner";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type SortingState,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";

export default function ProgramsPage() {
  const { data: programs = [], isLoading } = usePrograms();
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [globalFilter, setGlobalFilter] = React.useState("");


  const columns = React.useMemo<ColumnDef<Program>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="-ml-4 hover:bg-transparent"
            >
              Nama Program
              <ArrowUpDownIcon className="ml-2 size-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const name = row.getValue("name") as string;
          const description = row.original.description;
          const status = row.original.status;
          return (
            <div className="flex flex-col gap-0.5 max-w-[280px] sm:max-w-[360px]">
              <div className="flex items-center gap-2">
                <span
                  className="font-semibold text-foreground truncate"
                  title={name}
                >
                  {name}
                </span>
                {status === "ACTIVE" ? (
                  <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-semibold h-4 px-1.5 py-0 border-none shrink-0">
                    Buka
                  </Badge>
                ) : (
                  <Badge
                    variant="destructive"
                    className="text-[10px] font-semibold h-4 px-1.5 py-0 shrink-0 bg-rose-600 text-white"
                  >
                    Ditutup
                  </Badge>
                )}
              </div>
              {description && (
                <span
                  className="text-xs text-muted-foreground truncate"
                  title={description}
                >
                  {description}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "totalRows",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="-ml-4 hover:bg-transparent"
            >
              Data & Struktur
              <ArrowUpDownIcon className="ml-2 size-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const totalRows = row.getValue("totalRows") as number;
          const fieldCount = row.original.fieldCount;
          return (
            <div className="flex flex-col gap-0.5">
              <span className="inline-flex items-center gap-1.5 font-medium text-sm">
                <TableIcon className="size-4 text-blue-500" />
                {totalRows.toLocaleString("id-ID")} Baris
              </span>
              <span className="text-[11px] text-muted-foreground ml-5">
                {fieldCount} Kolom
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "errorCount",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="-ml-4 hover:bg-transparent"
            >
              Status Import
              <ArrowUpDownIcon className="ml-2 size-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const errorCount = row.getValue("errorCount") as number;
          return errorCount > 0 ? (
            <Badge variant="destructive" className="gap-1 px-2 py-0.5">
              <AlertCircleIcon className="size-3" />
              {errorCount} Error
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-none gap-1 px-2 py-0.5"
            >
              <CheckCircle2Icon className="size-3" />
              Clean
            </Badge>
          );
        },
      },
      {
        id: "verificationProgress",
        header: "Progress Verifikasi",
        cell: ({ row }) => {
          const program = row.original;
          const verified = program.verifiedCount ?? 0;
          const rejected = program.rejectedCount ?? 0;
          const total = program.totalRows || 1;
          const percent = Math.round(((verified + rejected) / total) * 100);

          return (
            <div className="flex flex-col gap-1.5 min-w-[140px]">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-muted-foreground">
                  {percent}% Selesai
                </span>
                <span className="text-foreground font-mono">
                  {verified + rejected}/{total}
                </span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${Math.round((verified / total) * 100)}%` }}
                  title={`Diverifikasi: ${verified}`}
                />
                <div
                  className="bg-red-100 h-full transition-all duration-300"
                  style={{ width: `${Math.round((rejected / total) * 100)}%` }}
                  title={`Ditolak: ${rejected}`}
                />
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="-ml-4 hover:bg-transparent"
            >
              Tanggal Dibuat
              <ArrowUpDownIcon className="ml-2 size-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const createdAt = row.getValue("createdAt") as string;
          return (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
              <CalendarIcon className="size-3.5" />
              {formatShortDate(createdAt)}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Aksi</span>,
        cell: ({ row }) => {
          const program = row.original;
          const isAdmin = program.userRole === "ADMIN";
          return (
            <div className="flex items-center justify-end gap-2">
              {isAdmin && (
                <Button
                  size="icon"
                  asChild
                  title="Settings"
                  variant="outline"
                  className="size-8"
                >
                  <Link href={`/programs/${program.id}/settings`}>
                    <SettingsIcon className="size-4" />
                  </Link>
                </Button>
              )}
              <Button
                variant={program.status === "ACTIVE" ? "secondary" : "outline"}
                asChild
                title={program.status === "ACTIVE" ? "Verifikasi Data" : "Lihat Data (Verifikasi Ditutup)"}
                className={
                  program.status === "ACTIVE"
                    ? "gap-1.5 h-8 px-3 text-xs font-semibold"
                    : "gap-1.5 h-8 px-3 text-xs text-muted-foreground border-dashed"
                }
              >
                <Link href={`/programs/${program.id}/verification`}>
                  {program.status === "ACTIVE" ? (
                    <ClipboardCheckIcon className="size-4 text-emerald-500" />
                  ) : (
                    <LockIcon className="size-4" />
                  )}
                  {program.status === "ACTIVE" ? "Verifikasi" : "Lihat Data"}
                </Link>
              </Button>
              <Button
                variant="outline"
                title="Salin Link Verifikasi"
                className="gap-1.5 h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  const shareUrl = `${window.location.origin}/v/${program.id}`;
                  navigator.clipboard
                    .writeText(shareUrl)
                    .then(() => {
                      toast.success("Link verifikasi berhasil disalin!");
                    })
                    .catch((err) => {
                      console.error("Gagal menyalin link:", err);
                      toast.error("Gagal menyalin link verifikasi");
                    });
                }}
              >
                <Share2Icon className="size-4" />
                Share
              </Button>
            </div>
          );
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data: programs,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6 items-center justify-center min-h-[400px]">
        <Loader2Icon className="size-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">
          Memuat daftar program...
        </p>
      </div>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        actions={
          <Button asChild className="gap-2" size="sm">
            <Link href="/programs/import">
              <PlusIcon className="size-4" />
              Tambah Program
            </Link>
          </Button>
        }
      >
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Programs</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <PageContent className="space-y-6 flex flex-col pt-4">

        {/* Title & Description */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Program List</h1>
            <p className="text-muted-foreground mt-1">
              Kelola program atau event verifikasi data Anda.
            </p>
          </div>

          {/* Search Input */}
          {programs.length > 0 && (
            <div className="relative w-full sm:w-72">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Cari program..."
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          )}
        </div>

        {/* ── Program Table / Empty State ────────────────────── */}
        <div className="flex-1 min-h-0">
          {programs.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
              <div className="flex aspect-square size-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                <FileSpreadsheetIcon className="size-6" />
              </div>
              <CardTitle className="text-xl font-semibold">
                Belum Ada Program
              </CardTitle>
              <CardDescription className="max-w-sm mt-2">
                Silakan buat program baru dengan mengunggah file Excel atau CSV
                Anda.
              </CardDescription>
              <Button asChild className="mt-6 gap-2">
                <Link href="/programs/import">
                  <PlusIcon className="size-4" />
                  Tambah Program
                </Link>
              </Button>
            </Card>
          ) : (
            <div className="rounded-md border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className="py-2.5 px-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="py-3 px-4">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center text-muted-foreground"
                      >
                        Tidak ada program yang sesuai dengan pencarian.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </PageContent>
    </PageLayout>
  );
}
