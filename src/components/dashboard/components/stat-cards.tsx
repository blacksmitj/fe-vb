"use client";

import React from "react";
import { Users, CheckCircle2, XCircle, FolderOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCardSkeleton } from "./skeletons";

interface StatCardsProps {
  globalStats:
    | {
        totalParticipants: number;
        totalVerified: number;
        totalRejected: number;
        activePrograms: number;
      }
    | undefined;
  programsLength: number;
  isLoading: boolean;
}

export function StatCards({ globalStats, programsLength, isLoading }: StatCardsProps) {
  const completionRate =
    globalStats && globalStats.totalParticipants > 0
      ? Math.round(
          ((globalStats.totalVerified + globalStats.totalRejected) /
            globalStats.totalParticipants) *
            100
        )
      : 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    );
  }

  return (
    <section>
      <h1 className="text-xl font-semibold tracking-tight mb-4">Ringkasan</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
              dari {programsLength} total program
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
