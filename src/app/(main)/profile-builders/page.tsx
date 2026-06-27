"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LayoutTemplateIcon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { toast } from "sonner";
import { PageLayout, PageHeader, PageContent } from "@/components/dashboard";
import { CreateBuilderDialog, BuilderList } from "@/components/profile-builders";
import {
  useProfileBuilders,
  useCreateProfileBuilder,
  useDeleteProfileBuilder,
  useDuplicateProfileBuilder,
} from "@/hooks/use-profile-builders";
import { usePrograms } from "@/hooks/use-programs";

export default function ProfileBuildersPage() {
  const router = useRouter();

  // Hooks
  const { data: builders = [], isLoading } = useProfileBuilders();
  const { data: allPrograms = [], isLoading: isLoadingPrograms } = usePrograms();
  const createMutation = useCreateProfileBuilder();
  const deleteMutation = useDeleteProfileBuilder();
  const duplicateMutation = useDuplicateProfileBuilder();

  // Component States
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const handleCreate = ({
    name,
    description,
    programId,
  }: {
    name: string;
    description: string;
    programId: string;
  }) => {
    createMutation.mutate(
      {
        name,
        description,
        programId: programId === "none" ? null : programId,
      },
      {
        onSuccess: (created) => {
          toast.success(`Profile Builder "${created.name}" berhasil dibuat`);
          setDialogOpen(false);
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

  const handleDuplicate = React.useCallback(
    (id: string) => {
      duplicateMutation.mutate(id, {
        onSuccess: (created) => {
          toast.success(`Profile Builder "${created.name}" berhasil diduplikasi`);
        },
        onError: (err: any) => {
          toast.error(err.message || "Gagal menduplikasi Profile Builder");
        },
      });
    },
    [duplicateMutation]
  );

  return (
    <PageLayout>
      <PageHeader
        actions={
          <CreateBuilderDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            allPrograms={allPrograms}
            isLoadingPrograms={isLoadingPrograms}
            isPending={createMutation.isPending}
            onSubmit={handleCreate}
          />
        }
      >
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
      </PageHeader>

      <PageContent className="space-y-6 flex flex-col pt-4">
        <BuilderList
          builders={builders}
          isLoading={isLoading}
          onDelete={handleDelete}
          isDeleting={deleteMutation.isPending}
          onDuplicate={handleDuplicate}
          isDuplicating={duplicateMutation.isPending}
          onOpenCreateDialog={() => setDialogOpen(true)}
        />
      </PageContent>
    </PageLayout>
  );
}
