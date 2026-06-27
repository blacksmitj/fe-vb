"use client";

import * as React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient, useSession } from "@/lib/auth/auth-client";
import { toast } from "sonner";
import { LockIcon, Loader2Icon, UserIcon } from "lucide-react";

export default function SettingsPage() {
  const { data: session, isPending: isSessionPending } = useSession();
  const [name, setName] = React.useState("");
  const [isUpdating, setIsUpdating] = React.useState(false);

  // Sync state with session once loaded
  React.useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
    }
  }, [session]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama lengkap tidak boleh kosong");
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await authClient.updateUser({
        name: name.trim(),
      });

      if (error) {
        toast.error(error.message || "Gagal memperbarui profil");
      } else {
        toast.success("Profil berhasil diperbarui!");
      }
    } catch (err: any) {
      toast.error(err?.message || "Terjadi kesalahan saat memperbarui profil");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isSessionPending) {
    return (
      <div className="flex flex-col h-screen bg-background overflow-hidden font-sans">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 bg-background">
          <div className="flex items-center gap-2 px-1">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Pengaturan Akun</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden font-sans">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 bg-background">
        <div className="flex items-center gap-2 px-1">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Pengaturan Akun</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="w-full space-y-6 mt-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
            <p className="text-muted-foreground text-sm">
              Kelola informasi profil dan pengaturan akun Anda.
            </p>
          </div>

          <Card className="shadow-sm border w-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Informasi Akun</CardTitle>
              <CardDescription>
                Perbarui nama tampilan Anda di sini.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleUpdate}>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {/* Name field */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium flex items-center gap-1.5">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      Nama Lengkap
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Masukkan nama lengkap Anda"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full"
                    />
                  </div>

                  {/* Readonly Email field */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium flex items-center gap-1.5 text-muted-foreground">
                      <LockIcon className="h-4 w-4" />
                      Email (Tidak dapat diubah)
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={session?.user?.email || ""}
                      disabled
                      className="bg-muted text-muted-foreground cursor-not-allowed select-none w-full"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t px-6 py-4 bg-muted/20">
                <p className="text-xs text-muted-foreground">
                  Perubahan Anda akan langsung diterapkan.
                </p>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan Perubahan"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
