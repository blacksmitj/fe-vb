"use client";

import React from "react";
import { Clock, ShieldCheck, ShieldX, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ActivitySkeleton } from "./skeletons";
import { type DashboardActivity } from "@/types";

interface RecentActivityProps {
  recentActivity: DashboardActivity[];
  isLoading: boolean;
}

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

export function RecentActivity({ recentActivity, isLoading }: RecentActivityProps) {
  return (
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
                      <span className="font-medium">{log.userName}</span> {formatAction(log)} di
                      program <span className="font-medium text-foreground">{log.programName}</span>
                      {log.details ? (
                        <span className="text-muted-foreground"> — {log.details}</span>
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
  );
}
