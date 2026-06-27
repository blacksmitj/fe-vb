"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { useDashboard } from "@/hooks/use-dashboard";
import { PageLayout, PageHeader, PageContent } from "@/components/dashboard";
import { StatCards, ProgramCards, RecentActivity } from "@/components/dashboard";

export default function DashboardPage() {
  const { data, isLoading, isError } = useDashboard();

  const globalStats = data?.globalStats;
  const programs = data?.programs ?? [];
  const recentActivity = data?.recentActivity ?? [];

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

        {/* Global Summary Statistics */}
        <StatCards
          globalStats={globalStats}
          programsLength={programs.length}
          isLoading={isLoading}
        />

        {/* Program Cards Grid */}
        <ProgramCards programs={programs} isLoading={isLoading} />

        {/* Recent Activity Feed */}
        <RecentActivity recentActivity={recentActivity} isLoading={isLoading} />
      </PageContent>
    </PageLayout>
  );
}
