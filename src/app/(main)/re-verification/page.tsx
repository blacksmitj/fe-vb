"use client";

import * as React from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  AlertCircle,
  SearchIcon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Eye,
  CalendarIcon,
  User,
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
import { formatShortDate } from "@/lib/utils";
import { useSearchParams, useRouter } from "next/navigation";

interface VerifiedParticipant {
  id: string;
  programId: string;
  programName: string;
  uniqueKeyColumn: string;
  rowIndex: number;
  uniqueKey: string;
  name: string;
  evalStatus: "VERIFIED" | "REJECTED" | "REVERIFICATION";
  evalDescription: string | null;
  evalByUserId: string;
  evalByUserName: string;
  evalAt: string;
}

export default function ReVerificationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeProgramFilter = searchParams.get("programId") || "ALL";

  const [participants, setParticipants] = React.useState<VerifiedParticipant[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "evalAt", desc: true },
  ]);
  const [globalFilter, setGlobalFilter] = React.useState<string>("");

  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const url = activeProgramFilter && activeProgramFilter !== "ALL"
          ? `/api/re-verification?programId=${activeProgramFilter}`
          : "/api/re-verification";
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error("Gagal mengambil data verifikasi ulang");
        }
        const data = await res.json();
        setParticipants(data.participants || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Terjadi kesalahan saat memuat data.");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [activeProgramFilter]);

  // Extract unique programs list from data for filtering
  const programsList = React.useMemo(() => {
    const programMap = new Map<string, string>();
    participants.forEach((p) => {
      programMap.set(p.programId, p.programName);
    });
    return Array.from(programMap.entries()).map(([id, name]) => ({ id, name }));
  }, [participants]);

  const handleProgramFilterChange = (value: string) => {
    const params = new URLSearchParams(window.location.search);
    if (value === "ALL") {
      params.delete("programId");
    } else {
      params.set("programId", value);
    }
    router.replace(`/re-verification?${params.toString()}`);
  };

  const columns = React.useMemo<ColumnDef<VerifiedParticipant>[]>(
    () => [
      {
        accessorKey: "programName",
        header: ({ column }) => (
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
        ),
        cell: ({ row }) => (
          <span className="font-semibold text-foreground truncate max-w-[180px] inline-block">
            {row.original.programName}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4 hover:bg-transparent font-semibold text-xs uppercase tracking-wider text-muted-foreground"
          >
            Nama Peserta
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 size-3.5" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 size-3.5" />
            ) : (
              <ArrowUpDown className="ml-2 size-3.5" />
            )}
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5 max-w-[200px]">
            <span className="font-medium text-foreground truncate">
              {row.original.name || "-"}
            </span>
            <span className="text-[11px] text-muted-foreground font-mono">
              {row.original.uniqueKeyColumn}: {row.original.uniqueKey}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "evalStatus",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4 hover:bg-transparent font-semibold text-xs uppercase tracking-wider text-muted-foreground"
          >
            Status
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 size-3.5" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 size-3.5" />
            ) : (
              <ArrowUpDown className="ml-2 size-3.5" />
            )}
          </Button>
        ),
        cell: ({ row }) => {
          const status = row.original.evalStatus;
          if (status === "VERIFIED") {
            return (
              <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold border-none text-[10px] px-2 py-0.5">
                Verified
              </Badge>
            );
          }
          if (status === "REJECTED") {
            return (
              <Badge className="bg-rose-600 hover:bg-rose-700 text-white font-semibold border-none text-[10px] px-2 py-0.5">
                Rejected
              </Badge>
            );
          }
          return (
            <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-semibold border-none text-[10px] px-2 py-0.5">
              Reverification
            </Badge>
          );
        },
      },
      {
        accessorKey: "evalByUserName",
        header: "Diverifikasi Oleh",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="size-3.5 text-slate-400" />
            <span className="truncate max-w-[120px]" title={row.original.evalByUserName}>
              {row.original.evalByUserName}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "evalAt",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4 hover:bg-transparent font-semibold text-xs uppercase tracking-wider text-muted-foreground"
          >
            Waktu Evaluasi
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 size-3.5" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 size-3.5" />
            ) : (
              <ArrowUpDown className="ml-2 size-3.5" />
            )}
          </Button>
        ),
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
            <CalendarIcon className="size-3.5 text-slate-400" />
            {row.original.evalAt ? formatShortDate(row.original.evalAt) : "-"}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Aksi</span>,
        cell: ({ row }) => {
          const p = row.original;
          const detailUrl = activeProgramFilter !== "ALL"
            ? `/re-verification/${p.id}?programId=${activeProgramFilter}`
            : `/re-verification/${p.id}`;
          return (
            <div className="flex justify-end">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs font-semibold h-8" asChild>
                <Link href={detailUrl}>
                  <RefreshCw className="size-3.5 text-amber-500 animate-hover-spin" />
                  Verifikasi Ulang
                </Link>
              </Button>
            </div>
          );
        },
      },
    ],
    [activeProgramFilter]
  );

  const table = useReactTable({
    data: participants,
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
  });

  return (
    <PageLayout>
      <PageHeader>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Verifikasi Ulang</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <PageContent className="space-y-6">
        {/* Title & Description */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <RefreshCw className="size-6 text-amber-500" />
              Verifikasi Ulang
            </h1>
            <p className="text-muted-foreground mt-1">
              Daftar seluruh data peserta yang telah divalidasi oleh verifikator pada program yang masih aktif.
            </p>
          </div>
        </div>
        {error ? (
          <div className="flex flex-col items-center justify-center p-8 border border-dashed border-destructive/30 bg-destructive/5 rounded-xl text-center">
            <AlertCircle className="size-8 text-destructive mb-3" />
            <h3 className="font-semibold text-destructive mb-1">Gagal Memuat Data</h3>
            <p className="text-xs text-muted-foreground max-w-md">{error}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Search */}
              <div className="relative w-full sm:max-w-xs">
                <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Cari data peserta..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-9 text-sm h-9"
                />
              </div>

              {/* Program filter */}
              <div className="w-full sm:max-w-xs flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Program:</span>
                <Select
                  value={activeProgramFilter}
                  onValueChange={handleProgramFilterChange}
                >
                  <SelectTrigger className="text-sm h-9">
                    <SelectValue placeholder="Semua Program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Program</SelectItem>
                    {programsList.map((prog) => (
                      <SelectItem key={prog.id} value={prog.id}>
                        {prog.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table wrapper */}
            <div className="border border-border bg-card rounded-lg overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-muted/30">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="hover:bg-transparent">
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="text-xs font-semibold px-4 py-3">
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
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-60 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2 className="size-6 animate-spin text-amber-500" />
                          <span className="text-xs text-muted-foreground">Memuat data verifikasi ulang...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : table.getRowModel().rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-60 text-center">
                        <div className="flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
                          <AlertCircle className="size-8 text-slate-400" />
                          <span className="text-sm font-semibold">Tidak Ada Data</span>
                          <span className="text-xs max-w-xs">
                            Belum ada data peserta yang divalidasi oleh Anda pada program aktif.
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id} className="hover:bg-muted/20 transition-colors border-b">
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="px-4 py-3 text-sm">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {!isLoading && table.getPageCount() > 1 && (
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                <span>
                  Halaman {table.getState().pagination.pageIndex + 1} dari {table.getPageCount()}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    Berikutnya
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}
