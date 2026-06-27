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
  LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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
import {
  useProfileBuilders,
  useCreateProfileBuilder,
  useDeleteProfileBuilder,
} from "@/hooks/use-profile-builders";
import { usePrograms } from "@/hooks/use-programs";

export default function ProfileBuildersPage() {
  const router = useRouter();
  
  // Hooks
  const { data: builders = [], isLoading } = useProfileBuilders();
  const { data: allPrograms = [], isLoading: isLoadingPrograms } = usePrograms();
  const createMutation = useCreateProfileBuilder();
  const deleteMutation = useDeleteProfileBuilder();

  // Component States
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newDescription, setNewDescription] = React.useState("");
  const [selectedProgramId, setSelectedProgramId] = React.useState<string>("none");
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    createMutation.mutate(
      {
        name: newName.trim(),
        description: newDescription.trim(),
        programId: selectedProgramId === "none" ? null : selectedProgramId,
      },
      {
        onSuccess: (created) => {
          toast.success(`Profile Builder "${created.name}" berhasil dibuat`);
          setDialogOpen(false);
          setNewName("");
          setNewDescription("");
          setSelectedProgramId("none");
          router.push(`/builder?builderId=${created.id}`);
        },
        onError: (err: any) => {
          toast.error(err.message || "Gagal membuat Profile Builder");
        },
      }
    );
  };

  const handleDelete = React.useCallback(
    (id: string, name: string) => {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          toast.success(`Profile Builder "${name}" berhasil dihapus`);
        },
        onError: (err: any) => {
          toast.error(err.message || "Gagal menghapus");
        },
      });
    },
    [deleteMutation]
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

  // Filter builders based on search query
  const filteredBuilders = builders.filter((b) => {
    const query = searchQuery.toLowerCase();
    return (
      b.name.toLowerCase().includes(query) ||
      b.description.toLowerCase().includes(query) ||
      (b.program?.name && b.program.name.toLowerCase().includes(query))
    );
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
                <BreadcrumbPage className="flex items-center gap-1.5 font-medium text-foreground">
                  <LayoutTemplateIcon className="size-4 text-muted-foreground" />
                  Profile Builder
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Create Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-1.5 size-4" />
              Buat Profile Builder
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Buat Profile Builder Baru</DialogTitle>
                <DialogDescription>
                  Masukkan detail profile form kustom. Anda bisa menautkan program Excel untuk mengambil data header-nya.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">
                    Nama Profile Builder <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Contoh: Form Evaluasi NIK/Penerima"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Input
                    id="description"
                    placeholder="Penjelasan singkat mengenai form ini"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Hubungkan Program (Opsional)</Label>
                  <Select
                    value={selectedProgramId}
                    onValueChange={setSelectedProgramId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih program untuk mengambil header..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Tidak Terhubung (Kosong)</SelectItem>
                      {isLoadingPrograms ? (
                        <SelectItem value="loading" disabled>
                          Memuat program...
                        </SelectItem>
                      ) : (
                        allPrograms.map((prog) => (
                          <SelectItem key={prog.id} value={prog.id}>
                            {prog.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={createMutation.isPending}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={createMutation.isPending || !newName.trim()}>
                  {createMutation.isPending ? (
                    <>
                      <Loader2Icon className="mr-1.5 size-4 animate-spin" />
                      Membuat...
                    </>
                  ) : (
                    "Buat & Mulai Edit"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main List */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Daftar Profile Builder</CardTitle>
              <CardDescription>Kelola layout dan kustomisasi formulir evaluasi per program</CardDescription>
            </div>
            <div className="flex max-w-xs items-center gap-2">
              <SearchIcon className="size-4 text-muted-foreground" />
              <Input
                placeholder="Cari profile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2Icon className="size-8 animate-spin" />
              <p className="text-sm">Memuat data...</p>
            </div>
          ) : filteredBuilders.length === 0 ? (
            <div className="flex h-60 flex-col items-center justify-center gap-2 text-muted-foreground py-10">
              <LayoutTemplateIcon className="size-12 stroke-[1.2] opacity-40 mb-2" />
              <p className="text-sm font-medium">Belum ada Profile Builder yang terdaftar.</p>
              <p className="text-xs max-w-xs text-center text-muted-foreground mb-4">
                Mulai dengan membuat profile kustom baru untuk memetakan kolom excel data program Anda.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(true)}
              >
                Buat sekarang
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {filteredBuilders.map((builder) => (
                <div key={builder.id} className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors">
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="font-semibold text-foreground truncate max-w-md">
                      {builder.name}
                    </span>
                    <span className="text-xs text-muted-foreground line-clamp-1 max-w-lg">
                      {builder.description || "Tidak ada deskripsi"}
                    </span>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground items-center">
                      <span className="flex items-center gap-1 bg-muted/40 px-2 py-0.5 rounded-sm">
                        <LinkIcon className="size-3" />
                        {builder.program ? (
                          <span className="text-primary font-medium">{builder.program.name}</span>
                        ) : (
                          <span className="italic">Tidak Terhubung</span>
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="size-3" />
                        Terakhir diubah: {formatDate(builder.updatedAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/builder?builderId=${builder.id}`}>
                        <SettingsIcon className="mr-1.5 size-3.5" />
                        Edit Layout
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2Icon className="size-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Profile Builder</AlertDialogTitle>
                          <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus Profile Builder &quot;{builder.name}&quot;? Tindakan ini tidak dapat dibatalkan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            onClick={() => handleDelete(builder.id, builder.name)}
                          >
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
