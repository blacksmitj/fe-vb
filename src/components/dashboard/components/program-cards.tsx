"use client";

import React from "react";
import Link from "next/link";
import { FolderOpen, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgramCardSkeleton } from "./skeletons";
import { type Program } from "@/types";

interface ProgramCardsProps {
  programs: Program[];
  isLoading: boolean;
}

export function ProgramCards({ programs, isLoading }: ProgramCardsProps) {
  if (isLoading) {
    return (
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold tracking-tight">Program Saya</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ProgramCardSkeleton />
          <ProgramCardSkeleton />
          <ProgramCardSkeleton />
        </div>
      </section>
    );
  }

  return (
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

      {programs.length === 0 ? (
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
                          variant={program.status === "ACTIVE" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {program.status === "ACTIVE" ? "Aktif" : "Dihentikan"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
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
  );
}
