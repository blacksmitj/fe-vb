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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type Program } from "@/types";
import { usePrograms, useDeleteProgram } from "@/hooks/use-programs";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
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
  const deleteMutation = useDeleteProgram();
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [globalFilter, setGlobalFilter] = React.useState("");

  const handleDelete = React.useCallback((id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus program "${name}"?`)) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          toast.success(`Program "${name}" berhasil dihapus`);
        },
        onError: () => {
          toast.error("Gagal menghapus program");
        },
      });
    }
  }, [deleteMutation]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const columns = React.useMemo<ColumnDef<Program>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
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
          return (
            <div className="flex flex-col gap-0.5 max-w-[280px] sm:max-w-[360px]">
              <span className="font-semibold text-foreground truncate" title={name}>
                {name}
              </span>
              {description && (
                <span className="text-xs text-muted-foreground truncate" title={description}>
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
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="-ml-4 hover:bg-transparent"
            >
              Total Data
              <ArrowUpDownIcon className="ml-2 size-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const totalRows = row.getValue("totalRows") as number;
          return (
            <span className="inline-flex items-center gap-1.5 font-medium">
              <TableIcon className="size-4 text-blue-500" />
              {totalRows.toLocaleString("id-ID")} Baris
            </span>
          );
        },
      },
      {
        accessorKey: "fieldCount",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="-ml-4 hover:bg-transparent"
            >
              Jumlah Field
              <ArrowUpDownIcon className="ml-2 size-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const fieldCount = row.getValue("fieldCount") as number;
          return (
            <span className="inline-flex items-center gap-1.5 font-medium">
              <FileSpreadsheetIcon className="size-4 text-emerald-500" />
              {fieldCount} Kolom
            </span>
          );
        },
      },
      {
        accessorKey: "errorCount",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="-ml-4 hover:bg-transparent"
            >
              Status
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
        accessorKey: "createdAt",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
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
              {formatDate(createdAt)}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Aksi</span>,
        cell: ({ row }) => {
          const program = row.original;
          return (
            <div className="flex items-center justify-end gap-2">
              <Button
                size="icon"
                asChild
                title="Lihat Detail"
                variant="outline"
                className="size-8"
              >
                <Link href={`/programs/import?edit=${program.id}`}>
                  <EyeIcon className="size-4" />
                </Link>
              </Button>
              <Button
                size="icon"
                asChild
                title="Settings Google Sheet"
                variant="outline"
                className="size-8"
              >
                <Link href={`/programs/${program.id}/settings`}>
                  <SettingsIcon className="size-4" />
                </Link>
              </Button>
              <Button
                size="icon"
                asChild
                title="Profile Builder"
                variant="outline"
                className="size-8"
              >
                <Link href={`/builder?programId=${program.id}`}>
                  <LayoutTemplateIcon className="size-4" />
                </Link>
              </Button>
              <Button
                variant="secondary"
                size="icon"
                asChild
                title="Verifikasi Data"
                className="size-8"
              >
                <Link href={`/programs/${program.id}/verification`}>
                  <ClipboardCheckIcon className="size-4" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 size-8"
                onClick={() => handleDelete(program.id, program.name)}
                title="Hapus Program"
              >
                <Trash2Icon className="size-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [handleDelete]
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
    <div className="flex flex-col h-full bg-background overflow-hidden font-sans">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-6">
        <div className="flex items-center gap-2 px-1">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Programs</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <Button asChild className="gap-2" size="sm">
          <Link href="/programs/import">
            <PlusIcon className="size-4" />
            Tambah Program Google Sheet
          </Link>
        </Button>
      </header>

      {/* ── Content Area ───────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col">
        {/* Title & Description */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Program List</h1>
            <p className="text-muted-foreground mt-1">
              Kelola program atau event yang disinkronisasikan dari Google Sheets.
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
                Silakan buat program baru dengan menghubungkan Google Sheet Anda.
              </CardDescription>
              <Button asChild className="mt-6 gap-2">
                <Link href="/programs/import">
                  <PlusIcon className="size-4" />
                  Hubungkan Google Sheet
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
                        <TableHead key={header.id} className="py-2.5 px-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
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
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className="hover:bg-muted/30 transition-colors"
                      >
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
                        Tidak ada program yang sesuai dengan pencarian.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

