"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LayoutTemplateIcon, ArrowLeft, Loader2, Settings } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { PageLayout, PageHeader, PageContent } from "@/components/dashboard";
import {
  ProfileBuilderSidebar,
  ProfileBuilderCanvas,
} from "@/components/profile-builder";
import { useBuilderState } from "@/hooks/use-builder-state";
import { BuilderSettingsSheet } from "@/components/profile-builder/components/builder-settings-sheet";

function BuilderPageContent() {
  const searchParams = useSearchParams();
  const builderId = searchParams.get("builderId");

  const {
    builder,
    isBuilderLoading,
    refetch,
    sections,
    activeSectionId,
    setActiveSectionId,
    isSettingsSheetOpen,
    setIsSettingsSheetOpen,
    hasDraft,
    sampleRow,
    previewProgram,
    isSaving,
    handleDiscardDraft,
    handleUpdateSection,
    handleDeleteSection,
    handleMoveSection,
    handleAddSection,
    handleAddField,
    handleMoveField,
    handleMoveFieldColumn,
    handleSave,
    handlePreview,
  } = useBuilderState(builderId);

  if (isBuilderLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6 items-center justify-center min-h-[400px] h-screen bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Memuat ruang kerja builder...</p>
      </div>
    );
  }

  if (!builderId || !builder) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6 items-center justify-center min-h-[400px] h-screen bg-background">
        <p className="text-destructive font-semibold">Error: Profile Builder tidak ditemukan.</p>
        <Button asChild>
          <Link href="/profile-builders">Kembali ke Daftar Profile Builder</Link>
        </Button>
      </div>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/profile-builders">
              <ArrowLeft className="mr-1.5 size-4" />
              Kembali ke List
            </Link>
          </Button>
        }
      >
        <div className="flex items-center gap-2">
          <LayoutTemplateIcon className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-sm flex items-center gap-2">
            Profile Builder - <span className="text-primary font-bold">{builder.name}</span>
            {hasDraft && (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">
                Ada Perubahan Belum Disimpan
              </span>
            )}
          </span>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsSettingsSheetOpen(true)}
            title="Pengaturan Profile Builder"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </PageHeader>

      <PageContent scrollable={false} className="p-0 flex flex-1">
        <ProfileBuilderSidebar
          onAddField={handleAddField}
          sections={sections}
          programHeaders={previewProgram?.headers}
          sampleRow={sampleRow}
          onSave={handleSave}
          isSaving={isSaving}
          onPreview={handlePreview}
          onDiscardDraft={handleDiscardDraft}
          hasDraft={hasDraft}
          programId={builder.programId}
        />

        <ProfileBuilderCanvas
          sections={sections}
          activeSectionId={activeSectionId}
          setActiveSectionId={setActiveSectionId}
          onUpdateSection={handleUpdateSection}
          onDeleteSection={handleDeleteSection}
          onMoveSection={handleMoveSection}
          onAddSection={handleAddSection}
          onMoveField={handleMoveField}
          onMoveFieldColumn={handleMoveFieldColumn}
          sampleRow={sampleRow}
          programHeaders={previewProgram?.headers}
        />
      </PageContent>

      <Toaster position="top-right" closeButton richColors />

      {/* Settings Sheet */}
      <BuilderSettingsSheet
        open={isSettingsSheetOpen}
        onOpenChange={setIsSettingsSheetOpen}
        builder={builder}
        onSave={() => {
          refetch(); // Trigger update data di canvas & sidebar (headers)
        }}
      />
    </PageLayout>
  );
}

export default function BuilderPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <BuilderPageContent />
    </React.Suspense>
  );
}
