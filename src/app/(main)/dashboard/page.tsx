"use client";

import * as React from "react";
import Link from "next/link";
import {
  Users,
  CheckCircle2,
  XCircle,
  FolderOpen,
  Activity,
  Clock,
  ShieldCheck,
  ShieldX,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "@/hooks/use-dashboard";
import type { DashboardActivity } from "@/types";
import { PageLayout, PageHeader, PageContent } from "@/components/dashboard";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function relativeTime(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

function ActivityIcon({ action }: { action: string }) {
  if (action.includes("VERIFIED") || action.includes("VERIFY")) {
    return <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />;
  }
  if (action.includes("REJECTED") || action.includes("REJECT")) {
    return <ShieldX className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />;
  }
  return <Activity className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />;
}

function formatAction(log: DashboardActivity): string {
  if (log.action.includes("VERIFIED") || log.action.includes("VERIFY")) {
    return "memverifikasi peserta";
  }
  if (log.action.includes("REJECTED") || log.action.includes("REJECT")) {
    return "menolak peserta";
  }
  return log.action.toLowerCase().replace(/_/g, " ");
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton components
// ─────────────────────────────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-5 w-5 rounded-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20 mb-1" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

function ProgramCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-3 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

function ActivitySkeleton() {
  return (
    <div className="flex items-start gap-3 py-3">
      <Skeleton className="h-4 w-4 rounded-full mt-0.5 shrink-0" />
      <div className="flex-1 space-y-1">
        <Skeleton className="h-4 w-full max-w-xs" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data, isLoading, isError } = useDashboard();

  const globalStats = data?.globalStats;
  const programs = data?.programs ?? [];
  const recentActivity = data?.recentActivity ?? [];

  const completionRate =
    globalStats && globalStats.totalParticipants > 0
      ? Math.round(
          ((globalStats.totalVerified + globalStats.totalRejected) /
            globalStats.totalParticipants) *
            100,
        )
      : 0;

  return (
    <PageLayout>
      <PageHeader>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <PageContent className="space-y-8">

        {/* Error state */}
        {isError && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Gagal memuat data dashboard. Coba muat ulang halaman.
          </div>
        )}

        {/* ── Section 1: Global Stat Cards ─────────────────────────────── */}
        <section>
          <h1 className="text-xl font-semibold tracking-tight mb-4">Ringkasan</h1>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {isLoading ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                {/* Total Peserta */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Peserta
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {(globalStats?.totalParticipants ?? 0).toLocaleString("id-ID")}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {completionRate}% sudah diproses
                    </p>
                  </CardContent>
                </Card>

                {/* Total Verified */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Terverifikasi
                    </CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                      {(globalStats?.totalVerified ?? 0).toLocaleString("id-ID")}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      peserta berhasil diverifikasi
                    </p>
                  </CardContent>
                </Card>

                {/* Total Rejected */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Ditolak
                    </CardTitle>
                    <XCircle className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                      {(globalStats?.totalRejected ?? 0).toLocaleString("id-ID")}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      peserta ditolak
                    </p>
                  </CardContent>
                </Card>

                {/* Program Aktif */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Program Aktif
                    </CardTitle>
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {globalStats?.activePrograms ?? 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      dari {programs.length} total program
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </section>

        {/* ── Section 2: Program Cards ──────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold tracking-tight">Program Saya</h2>
            <Link
              href="/programs"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              Lihat semua
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <ProgramCardSkeleton />
              <ProgramCardSkeleton />
              <ProgramCardSkeleton />
            </div>
          ) : programs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground gap-2">
                <FolderOpen className="h-8 w-8 opacity-40" />
                <p className="text-sm">Belum ada program.</p>
                <Link
                  href="/programs"
                  className="text-sm text-primary underline-offset-4 hover:underline"
                >
                  Buat program pertama
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {programs.map((program) => {
                const total = program.totalRows;
                const verified = program.verifiedCount ?? 0;
                const rejected = program.rejectedCount ?? 0;
                const pending = program.pendingCount ?? 0;

                const verifiedPct = total > 0 ? (verified / total) * 100 : 0;
                const rejectedPct = total > 0 ? (rejected / total) * 100 : 0;
                const pendingPct = total > 0 ? (pending / total) * 100 : 0;

                return (
                  <Link key={program.id} href={`/programs/${program.id}/verification`}>
                    <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer h-full">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle
                            className="text-base font-semibold leading-snug line-clamp-2"
                            title={program.name}
                          >
                            {program.name}
                          </CardTitle>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <Badge
                              variant={
                                program.status === "ACTIVE" ? "default" : "secondary"
                              }
                              className="text-xs"
                            >
                              {program.status === "ACTIVE" ? "Aktif" : "Dihentikan"}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="text-xs"
                            >
                              {program.userRole === "ADMIN" ? "Admin" : "Verifier"}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {total.toLocaleString("id-ID")} total peserta
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Progress bar */}
                        {total > 0 ? (
                          <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="bg-emerald-500 transition-all"
                              style={{ width: `${verifiedPct}%` }}
                            />
                            <div
                              className="bg-red-500 transition-all"
                              style={{ width: `${rejectedPct}%` }}
                            />
                            <div
                              className="bg-muted-foreground/20 transition-all"
                              style={{ width: `${pendingPct}%` }}
                            />
                          </div>
                        ) : (
                          <div className="h-2 w-full rounded-full bg-muted" />
                        )}

                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                              {verified.toLocaleString("id-ID")}
                            </p>
                            <p className="text-[10px] text-muted-foreground">Verified</p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                              {rejected.toLocaleString("id-ID")}
                            </p>
                            <p className="text-[10px] text-muted-foreground">Ditolak</p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-muted-foreground">
                              {pending.toLocaleString("id-ID")}
                            </p>
                            <p className="text-[10px] text-muted-foreground">Pending</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Section 3: Recent Activity ────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold tracking-tight">Aktivitas Terbaru</h2>
          </div>

          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="divide-y px-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <ActivitySkeleton key={i} />
                  ))}
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground gap-2">
                  <Clock className="h-6 w-6 opacity-40" />
                  <p className="text-sm">Belum ada aktivitas tercatat.</p>
                </div>
              ) : (
                <ul className="divide-y">
                  {recentActivity.map((log) => (
                    <li key={log.id} className="flex items-start gap-3 px-4 py-3">
                      <ActivityIcon action={log.action} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-snug">
                          <span className="font-medium">{log.userName}</span>{" "}
                          {formatAction(log)} di program{" "}
                          <span className="font-medium text-foreground">
                            {log.programName}
                          </span>
                          {log.details ? (
                            <span className="text-muted-foreground">
                              {" "}
                              — {log.details}
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {relativeTime(log.createdAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>
      </PageContent>
    </PageLayout>
  );
}
