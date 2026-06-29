"use client";

import * as React from "react";
import { useFixData, FixDataEntry } from "@/hooks/use-fix-data";
import { PageLayout, PageHeader, PageContent } from "@/components/dashboard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  WrenchIcon,
  AlertCircle,
  ArrowRight,
  SearchIcon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";

export default function FixDataPage() {
  const { data = [], isLoading, error } = useFixData();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState<string>("");

  const columns = React.useMemo<ColumnDef<FixDataEntry>[]>(
    () => [
      {
        accessorKey: "programName",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="-ml-4 hover:bg-transparent font-semibold text-xs uppercase tracking-wider text-muted-foreground"
            >
              Program
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="ml-2 size-3.5" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="ml-2 size-3.5" />
              ) : (
                <ArrowUpDown className="ml-2 size-3.5" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => (
          <span className="font-medium">{row.original.programName}</span>
        ),
      },
      {
        accessorKey: "uniqueKey",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="-ml-4 hover:bg-transparent font-semibold text-xs uppercase tracking-wider text-muted-foreground"
            >
              Identitas Peserta
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="ml-2 size-3.5" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="ml-2 size-3.5" />
              ) : (
                <ArrowUpDown className="ml-2 size-3.5" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-sm font-medium">{row.original.uniqueKey}</span>
            <span className="text-xs text-muted-foreground">
              ID: {row.original.participantId.substring(0, 8)}...
            </span>
          </div>
        ),
      },
      {
        accessorKey: "verifiedBy",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="-ml-4 hover:bg-transparent font-semibold text-xs uppercase tracking-wider text-muted-foreground"
            >
              Verifikator
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="ml-2 size-3.5" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="ml-2 size-3.5" />
              ) : (
                <ArrowUpDown className="ml-2 size-3.5" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground font-medium">
            {row.original.verifiedBy || "-"}
          </span>
        ),
      },
      {
        accessorKey: "missingFields",
        header: () => (
          <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
            Field Kosong
          </span>
        ),
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.missingFields.map((field) => (
              <Badge key={field} variant="destructive" className="font-mono text-[10px]">
                {field}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        id: "actions",
        header: () => (
          <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right block">
            Aksi
          </span>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            <Button asChild size="sm" variant="outline">
              <Link href={`/programs/${row.original.programId}/verification?page=${row.original.rowIndex}`}>
                <span>Buka Verifikasi</span>
                <ArrowRight className="ml-2 size-3" />
              </Link>
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data,
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
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <PageLayout>
      <PageHeader>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-2">
                <WrenchIcon className="size-4" />
                <span>Perbaikan Data</span>
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <PageContent className="space-y-6 flex flex-col pt-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 shrink-0">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-bold tracking-tight mb-2">Data Perlu Diperbaiki</h1>
            <p className="text-muted-foreground">
              Berikut adalah daftar peserta yang sudah diverifikasi, tetapi masih ada field wajib (required) yang belum diisi.
              Silakan lengkapi data tersebut.
            </p>
          </div>

          {/* Search Input */}
          {!isLoading && data.length > 0 && (
            <div className="relative w-full md:w-72 shrink-0">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Cari data perbaikan..."
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          )}
        </div>

        <div className="flex-1 min-h-0">
          {isLoading ? (
            <div className="min-h-[300px] border border-dashed rounded-xl flex flex-col items-center justify-center bg-card shadow-sm gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Memuat data...</p>
            </div>
          ) : error ? (
            <div className="min-h-[300px] border border-dashed rounded-xl flex flex-col items-center justify-center bg-card shadow-sm text-destructive gap-2">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm">Gagal memuat data. Silakan coba lagi.</p>
            </div>
          ) : data.length === 0 ? (
            <div className="min-h-[300px] border border-dashed rounded-xl flex flex-col items-center justify-center bg-card shadow-sm text-muted-foreground gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <WrenchIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-foreground">Semua Data Lengkap</h3>
                <p className="text-sm mt-1">Tidak ada data peserta diverifikasi yang kolom wajibnya kosong.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="rounded-md border bg-card overflow-hidden">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id} className="py-2.5 px-4">
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id} className="hover:bg-muted/30 transition-colors">
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id} className="py-3 px-4">
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
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
                          Tidak ada data perbaikan yang sesuai dengan pencarian.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              {table.getPageCount() > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2 px-1">
                  <div className="text-sm text-muted-foreground text-center sm:text-left">
                    Menampilkan {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} - {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)} dari {table.getFilteredRowModel().rows.length} data
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                      className="h-8"
                    >
                      Sebelumnya
                    </Button>
                    <div className="text-xs font-semibold text-muted-foreground min-w-[90px] text-center">
                      Halaman {table.getState().pagination.pageIndex + 1} dari {table.getPageCount()}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                      className="h-8"
                    >
                      Selanjutnya
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </PageContent>
    </PageLayout>
  );
}
