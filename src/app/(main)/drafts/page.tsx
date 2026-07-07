"use client";

import * as React from "react";
import { useDrafts, DraftEntry } from "@/hooks/use-drafts";
import { usePrograms } from "@/hooks/use-programs";
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
  FileTextIcon,
  AlertCircle,
  ArrowRight,
  SearchIcon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  ClockIcon,
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
import { toast } from "sonner";

export default function DraftsPage() {
  const { data: drafts = [], isLoaded, deleteDraft } = useDrafts();
  const { data: programs = [], isLoading: isProgramsLoading } = usePrograms();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState<string>("");

  // Resolve Program Name and Participant display name
  const tableData = React.useMemo(() => {
    return drafts.map((draft) => {
      const program = programs.find((p) => p.id === draft.programId);
      
      // Determine participant uniqueKey / display name
      const rowData = draft.participant;
      const keys = Object.keys(rowData);
      const nameKey = keys.find(k => {
        const lk = k.toLowerCase();
        return lk === "nama" || lk === "name" || lk.includes("nama lengkap") || lk.includes("full name");
      });
      const uniqueKey = nameKey && rowData[nameKey] 
        ? String(rowData[nameKey]) 
        : draft.participant.uniqueKey || `Peserta ID: ${draft.participantId.substring(0, 8)}`;

      return {
        ...draft,
        programName: program ? program.name : `Program (ID: ${draft.programId.substring(0, 8)})`,
        displayIdentity: uniqueKey,
      };
    });
  }, [drafts, programs]);

  const handleDelete = (programId: string, participantId: string) => {
    deleteDraft(programId, participantId);
    toast.success("Draft berhasil dihapus");
  };

  const columns = React.useMemo<ColumnDef<any>[]>(
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
        accessorKey: "displayIdentity",
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
            <span className="text-sm font-medium">{row.original.displayIdentity}</span>
            <span className="text-xs text-muted-foreground font-mono">
              ID: {row.original.participantId.substring(0, 8)}...
            </span>
          </div>
        ),
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="-ml-4 hover:bg-transparent font-semibold text-xs uppercase tracking-wider text-muted-foreground"
            >
              Terakhir Diperbarui
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
        cell: ({ row }) => {
          const date = new Date(row.original.updatedAt);
          const formatted = date.toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
          return (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <ClockIcon className="size-3.5" />
              <span>{formatted}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "evaluationStatus",
        header: () => (
          <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
            Status Draft
          </span>
        ),
        cell: ({ row }) => {
          const status = row.original.evaluationStatus;
          if (status === "VERIFIED") {
            return (
              <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-[10px] px-2 py-0.5 border-none">
                Verify Draft
              </Badge>
            );
          }
          if (status === "REJECTED") {
            return (
              <Badge variant="destructive" className="font-semibold text-[10px] px-2 py-0.5">
                Reject Draft
              </Badge>
            );
          }
          return (
            <Badge variant="secondary" className="font-semibold text-[10px] px-2 py-0.5 text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-400">
              Ubah Data Draft
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: () => (
          <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right block">
            Aksi
          </span>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            {/* Delete button with AlertDialog */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/25">
                  <Trash2 className="size-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus Draft?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Apakah Anda yakin ingin menghapus draft verifikasi untuk peserta ini? Tindakan ini akan membuang semua perubahan yang belum disimpan secara permanen dari browser ini.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(row.original.programId, row.original.participantId)}
                    className="bg-rose-600 text-white hover:bg-rose-700"
                  >
                    Hapus
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button asChild size="sm" variant="outline" className="h-8">
              <Link href={`/programs/${row.original.programId}/verification?page=${row.original.rowIndex}`}>
                <span>Buka Verifikasi</span>
                <ArrowRight className="ml-1.5 size-3" />
              </Link>
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: tableData,
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

  const isLoading = !isLoaded || isProgramsLoading;

  return (
    <PageLayout>
      <PageHeader>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-2">
                <FileTextIcon className="size-4" />
                <span>Draft Evaluasi</span>
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <PageContent className="space-y-6 flex flex-col pt-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 shrink-0">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-bold tracking-tight mb-2">Draft Evaluasi</h1>
            <p className="text-muted-foreground">
              Daftar evaluasi dan perubahan data peserta yang disimpan secara lokal di browser ini dan belum dikirim/save ke database.
            </p>
          </div>

          {/* Search Input */}
          {!isLoading && drafts.length > 0 && (
            <div className="relative w-full md:w-72 shrink-0">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Cari draft peserta..."
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
              <p className="text-sm text-muted-foreground">Memuat draft...</p>
            </div>
          ) : drafts.length === 0 ? (
            <div className="min-h-[300px] border border-dashed rounded-xl flex flex-col items-center justify-center bg-card shadow-sm text-muted-foreground gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <FileTextIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-foreground">Tidak Ada Draft</h3>
                <p className="text-sm mt-1">Semua perubahan data peserta telah disimpan ke database.</p>
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
                          Tidak ada draft yang sesuai dengan pencarian.
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
                    Menampilkan {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} - {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)} dari {table.getFilteredRowModel().rows.length} draft
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
