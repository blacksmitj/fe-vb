"use client";

import { useFixData } from "@/hooks/use-fix-data";
import { PageLayout, PageHeader } from "@/components/dashboard";
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
import { Loader2, WrenchIcon, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

export default function FixDataPage() {
  const { data, isLoading, error } = useFixData();

  return (
    <PageLayout>
      <PageHeader>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-2">
                <WrenchIcon className="size-4" />
                <span>Perbaikan Data</span>
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>

      <div className="p-6">
        <div className="mb-6 max-w-2xl">
          <h1 className="text-2xl font-bold tracking-tight mb-2">Data Perlu Diperbaiki</h1>
          <p className="text-muted-foreground">
            Berikut adalah daftar peserta yang sudah Anda verifikasi, tetapi masih ada field wajib (required) yang belum diisi.
            Silakan lengkapi data tersebut.
          </p>
        </div>

        {isLoading ? (
          <div className="min-h-[300px] border border-dashed rounded-xl flex flex-col items-center justify-center bg-card shadow-sm gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Memuat data...</p>
          </div>
        ) : error ? (
          <div className="min-h-[300px] border border-dashed rounded-xl flex flex-col items-center justify-center bg-card shadow-sm text-destructive gap-2">
            <AlertCircle className="h-8 w-8" />
            <p className="text-sm">Gagal memuat data. Silakan coba lagi.</p>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="min-h-[300px] border border-dashed rounded-xl flex flex-col items-center justify-center bg-card shadow-sm text-muted-foreground gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <WrenchIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-foreground">Semua Data Lengkap</h3>
              <p className="text-sm mt-1">Tidak ada data peserta diverifikasi yang kolom wajibnya kosong.</p>
            </div>
          </div>
        ) : (
          <div className="rounded-md border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Program</TableHead>
                  <TableHead>Identitas Peserta</TableHead>
                  <TableHead>Field Wajib Kosong</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={`${row.programId}-${row.participantId}`}>
                    <TableCell className="font-medium">
                      {row.programName}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{row.uniqueKey}</span>
                        <span className="text-xs text-muted-foreground">ID: {row.participantId.substring(0, 8)}...</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {row.missingFields.map((field) => (
                          <Badge key={field} variant="destructive" className="font-mono text-[10px]">
                            {field}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/programs/${row.programId}/verification?page=${row.rowIndex}`}>
                          <span>Buka Verifikasi</span>
                          <ArrowRight className="ml-2 size-3" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
