"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PlusIcon,
  Trash2Icon,
  Loader2Icon,
  LayoutTemplateIcon,
  SearchIcon,
  SettingsIcon,
  CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ProfileTemplate {
  id: string;
  name: string;
  description: string;
  sections: any;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export default function ProfileTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = React.useState<ProfileTemplate[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCreating, setIsCreating] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newDescription, setNewDescription] = React.useState("");

  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "updatedAt", desc: true },
  ]);
  const [globalFilter, setGlobalFilter] = React.useState("");

  const fetchTemplates = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/profile-templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      } else {
        toast.error("Gagal memuat profile templates");
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat profile templates");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsCreating(true);
    try {
      const res = await fetch("/api/profile-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          description: newDescription,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        toast.success(`Template "${created.name}" berhasil dibuat`);
        setDialogOpen(false);
        setNewName("");
        setNewDescription("");
        fetchTemplates();
        // Redirect directly to the builder page
        router.push(`/builder?templateId=${created.id}`);
      } else {
        toast.error("Gagal membuat template");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan saat membuat template");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = React.useCallback(
    async (id: string, name: string) => {
      if (confirm(`Apakah Anda yakin ingin menghapus template "${name}"? Program yang menautkan template ini akan kehilangan layout form kustomnya.`)) {
        try {
          const res = await fetch(`/api/profile-templates/${id}`, {
            method: "DELETE",
          });
          if (res.ok) {
            toast.success(`Template "${name}" berhasil dihapus`);
            fetchTemplates();
          } else {
            toast.error("Gagal menghapus template");
          }
        } catch (err) {
          console.error(err);
          toast.error("Terjadi kesalahan saat menghapus template");
        }
      }
    },
    [fetchTemplates]
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const columns = React.useMemo<ColumnDef<ProfileTemplate>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Nama Template",
        cell: ({ row }) => (
          <div className="font-medium text-foreground">
            {row.getValue("name")}
          </div>
        ),
      },
      {
        accessorKey: "description",
        header: "Deskripsi",
        cell: ({ row }) => (
          <div className="text-muted-foreground max-w-[300px] truncate">
            {row.getValue("description") || "-"}
          </div>
        ),
      },
      {
        accessorKey: "version",
        header: "Versi",
        cell: ({ row }) => (
          <div className="text-center font-mono text-xs">
            v{row.getValue("version")}
          </div>
        ),
      },
      {
        accessorKey: "updatedAt",
        header: "Terakhir Diperbarui",
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarIcon className="size-3.5" />
            {formatDate(row.getValue("updatedAt"))}
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Aksi</div>,
        cell: ({ row }) => {
          const template = row.original;
          return (
            <div className="flex items-center justify-end gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link href={`/builder?templateId=${template.id}`}>
                  <SettingsIcon className="mr-1.5 size-3.5" />
                  Edit Layout
                </Link>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => handleDelete(template.id, template.name)}
              >
                <Trash2Icon className="size-3.5" />
              </Button>
            </div>
          );
        },
      },
    ],
    [handleDelete]
  );

  const table = useReactTable({
    data: templates,
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

  return (
    <div className="flex flex-col flex-1 gap-6 p-6">
      {/* Header & Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage className="flex items-center gap-1.5">
                  <LayoutTemplateIcon className="size-4" />
                  Profile Templates
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Create Template Trigger */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-1.5 size-4" />
              Buat Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Buat Profile Template Baru</DialogTitle>
                <DialogDescription>
                  Masukkan detail template layout form. Setelah dibuat, Anda akan diarahkan ke editor Profile Builder.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Nama Template <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="name"
                    placeholder="Contoh: Template Biodata Mahasiswa"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Deskripsi
                  </label>
                  <Input
                    id="description"
                    placeholder="Penjelasan singkat mengenai isi template"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={isCreating}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isCreating || !newName.trim()}>
                  {isCreating ? (
                    <>
                      <Loader2Icon className="mr-1.5 size-4 animate-spin" />
                      Membuat...
                    </>
                  ) : (
                    "Buat & Edit Layout"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main List */}
      <Card className="p-6">
        <div className="flex items-center justify-between pb-4">
          <div className="flex flex-1 max-w-sm items-center gap-2">
            <SearchIcon className="size-4 text-muted-foreground" />
            <Input
              placeholder="Cari template..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="h-9"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
            <Loader2Icon className="size-8 animate-spin" />
            <p className="text-sm">Memuat data templates...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
            <LayoutTemplateIcon className="size-12 stroke-[1.2]" />
            <p className="text-sm">Belum ada Profile Template yang dibuat.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setDialogOpen(true)}
            >
              Buat sekarang
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
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
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
