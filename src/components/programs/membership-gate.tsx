"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ShieldAlertIcon, ClockIcon, UserPlusIcon, RefreshCwIcon, ArrowLeftIcon, CheckCircle2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useProgram } from "@/hooks/use-programs";
import { toast } from "sonner";

interface MembershipGateProps {
  programId: string;
  children: React.ReactNode;
}

export function MembershipGate({ programId, children }: MembershipGateProps) {
  const router = useRouter();
  const { data: program, isLoading: isProgramLoading } = useProgram(programId);
  const [membership, setMembership] = React.useState<{ role: string | null; status: string | null } | null>(null);
  const [isChecking, setIsChecking] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const checkMembership = React.useCallback(async () => {
    setIsChecking(true);
    try {
      const res = await fetch(`/api/programs/${programId}/membership`);
      if (res.ok) {
        const data = await res.json();
        setMembership(data);
      }
    } catch (err) {
      console.error("Error checking membership:", err);
    } finally {
      setIsChecking(false);
    }
  }, [programId]);

  React.useEffect(() => {
    checkMembership();
  }, [checkMembership]);

  const handleRegister = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/programs/${programId}/members`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Pendaftaran berhasil diajukan");
        checkMembership();
      } else {
        const data = await res.json().catch(() => ({ error: "Gagal mengajukan pendaftaran" }));
        toast.error(data.error || "Gagal mengajukan pendaftaran");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan saat mendaftar");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isChecking || isProgramLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <RefreshCwIcon className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Memeriksa hak akses...</p>
        </div>
      </div>
    );
  }

  // If approved member, show children
  if (membership?.status === "APPROVED") {
    // If program is paused and user is not admin, block verification
    if (program && program.status === "STOPPED" && membership.role !== "ADMIN") {
      return (
        <div className="flex min-h-screen w-full items-center justify-center p-6 bg-linear-to-br from-background to-muted/30">
          <div className="w-full max-w-md">
            {/* Header Back Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/programs")}
              className="mb-4 gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Kembali ke Dashboard
            </Button>

            <Card className="border border-border/50 shadow-xl bg-card/50 backdrop-blur-md">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
                  <ShieldAlertIcon className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight text-rose-600">Verifikasi Ditutup</CardTitle>
                <CardDescription>
                  Program <span className="font-semibold text-foreground">{program?.name}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Proses verifikasi data untuk program ini telah dihentikan atau ditutup sementara oleh Administrator.
                </p>
                <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 p-2.5 rounded-md border border-rose-500/20">
                  Anda tidak dapat melakukan verifikasi data sampai proses ini dibuka kembali.
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  onClick={() => router.push("/programs")}
                  className="w-full h-10 border-border/60 hover:bg-muted"
                >
                  Kembali ke Halaman Program
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      );
    }

    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-linear-to-br from-background to-muted/30">
      <div className="w-full max-w-md">
        {/* Header Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/programs")}
          className="mb-4 gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Kembali ke Dashboard
        </Button>

        <Card className="border border-border/50 shadow-xl bg-card/50 backdrop-blur-md">
          {membership?.role === null && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UserPlusIcon className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight">Pendaftaran Verifikator</CardTitle>
                <CardDescription>
                  Program <span className="font-semibold text-foreground">{program?.name}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Anda belum terdaftar sebagai verifikator untuk program ini. Daftarkan akun Anda agar dapat melihat dan memverifikasi data peserta.
                </p>
                {program?.description && (
                  <div className="p-3 rounded-lg bg-muted/50 text-xs text-left italic border border-border/30">
                    "{program.description}"
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleRegister}
                  disabled={isSubmitting}
                  className="w-full h-10 shadow-lg shadow-primary/25 font-medium transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                      Mendaftarkan...
                    </>
                  ) : (
                    "Daftar sebagai Verifikator"
                  )}
                </Button>
              </CardFooter>
            </>
          )}

          {membership?.status === "PENDING" && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                  <ClockIcon className="h-6 w-6 animate-pulse" />
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight">Menunggu Persetujuan</CardTitle>
                <CardDescription>
                  Pendaftaran Anda sedang ditinjau
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Akun Anda telah didaftarkan sebagai verifikator untuk program <span className="font-semibold text-foreground">{program?.name}</span>.
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2.5 rounded-md border border-amber-500/20">
                  Mohon menunggu Admin menyetujui pendaftaran Anda.
                </p>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  onClick={checkMembership}
                  className="w-full h-10 gap-2 border-border/60 hover:bg-muted"
                >
                  <RefreshCwIcon className="h-4 w-4" />
                  Cek Status Terbaru
                </Button>
              </CardFooter>
            </>
          )}

          {membership?.status === "REJECTED" && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <ShieldAlertIcon className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight text-destructive">Pendaftaran Ditolak</CardTitle>
                <CardDescription>
                  Akses dibatasi
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Maaf, permohonan pendaftaran Anda sebagai verifikator untuk program <span className="font-semibold text-foreground">{program?.name}</span> telah ditolak oleh Admin.
                </p>
                <p className="text-xs text-destructive bg-destructive/5 p-2 rounded border border-destructive/20">
                  Silakan hubungi administrator program untuk informasi lebih lanjut.
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  onClick={() => router.push("/programs")}
                  className="w-full h-10 border-border/60 hover:bg-muted"
                >
                  Kembali ke Halaman Program
                </Button>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
