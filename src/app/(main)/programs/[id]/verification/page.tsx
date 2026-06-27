"use client";

import * as React from "react";
import {
  VerificationLayout,
  ParticipantNavigator,
  EvaluationForm,
  EvaluationControls,
} from "@/components/verification";
import { useVerificationStore } from "@/stores";
import { Section, migrateSectionsSchema } from "@/components/profile-builder";
import { Loader2, ArrowLeft, RefreshCw, AlertCircle, CheckCircle2, XCircle, ClockIcon, UserCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useProgram } from "@/hooks/use-programs";
import { toast } from "sonner";
import { MembershipGate } from "@/components/programs/membership-gate";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function VerificationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { data: program, refetch: refetchProgram } = useProgram(id);
  
  const {
    currentRowIndex,
    setCurrentParticipantId,
    currentParticipantId,
    setTotalRows,
    setEvaluationStatus,
    setApprovalDescription,
    resetEvaluation,
    evaluationStatus,
    approvalDescription,
  } = useVerificationStore();
  
  const [participant, setParticipant] = React.useState<Record<string, any> | null>(null);
  const [sections, setSections] = React.useState<Section[]>([]);
  
  const [isParticipantLoading, setIsParticipantLoading] = React.useState(true);
  const [isSchemaLoading, setIsSchemaLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  // Fetch Program Profile Builder Schema
  React.useEffect(() => {
    async function loadSchema() {
      setIsSchemaLoading(true);
      try {
        const res = await fetch(`/api/programs/${id}/schema`);
        if (!res.ok) throw new Error("Failed to load schema");
        const data = await res.json();
        if (data.sections) {
          setSections(migrateSectionsSchema(data.sections));
        }
      } catch (err) {
        console.error("Failed to load program schema", err);
      } finally {
        setIsSchemaLoading(false);
      }
    }
    loadSchema();
  }, [id]);

  // Fetch Participant Data based on currentRowIndex
  React.useEffect(() => {
    async function loadParticipant() {
      setIsParticipantLoading(true);
      try {
        const res = await fetch(`/api/programs/${id}/participants?page=${currentRowIndex}`);
        if (!res.ok) throw new Error("Failed to load participant");
        const data = await res.json();
        setParticipant(data.participant);
        
        if (data.totalRows !== undefined) {
          setTotalRows(data.totalRows);
        }

        // Sync local store evaluation state with the fetched participant's evaluation
        if (data.participant) {
          setCurrentParticipantId(data.participant.id || null);
          setEvaluationStatus(data.participant._evaluationStatus || null);
          setApprovalDescription(data.participant._evaluationDescription || "");
        } else {
          resetEvaluation();
        }
      } catch (err) {
        console.error("Failed to load participant", err);
        resetEvaluation();
      } finally {
        setIsParticipantLoading(false);
      }
    }
    loadParticipant();
  }, [currentRowIndex, id, setTotalRows, setEvaluationStatus, setApprovalDescription, resetEvaluation, setCurrentParticipantId]);

  // Callback to update participant row locally after saving evaluation
  const handleParticipantUpdated = (updatedParticipant: Record<string, any>) => {
    setParticipant(updatedParticipant);
    refetchProgram();
  };

  const handleFieldChange = (label: string, value: any) => {
    setParticipant((prev) => (prev ? { ...prev, [label]: value } : null));
  };

  const handleSave = async () => {
    if (program?.status === "STOPPED") {
      toast.error("Tidak dapat menyimpan perubahan karena verifikasi program ini ditangguhkan.");
      return;
    }
    setIsSaving(true);
    try {
      const url = currentParticipantId 
        ? `/api/programs/${id}/participants?participantId=${currentParticipantId}`
        : `/api/programs/${id}/participants?page=${currentRowIndex}`;

      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "VERIFIED",
          description: approvalDescription,
          participant,
        }),
      });
      let data;
      try {
        data = await res.json();
      } catch (err) {
        data = { error: "An error occurred while saving the data" };
      }
      if (res.ok && data.success) {
        toast.success(`Data saved successfully`);
        setParticipant(data.participant);
        refetchProgram();
      } else {
        toast.error(data.error || "Failed to save data");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while saving the data");
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = isParticipantLoading || isSchemaLoading;

  return (
    <MembershipGate programId={id}>
      <div className="flex flex-col h-screen bg-background overflow-hidden font-sans">
        {/* ── Main Layout ─────────────────────────────────────── */}
        <VerificationLayout>
          {/* ── Standard Header (inside VerificationLayout to scroll with the page) ─────────────────────────────────── */}
          <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-6 bg-background">
            <div className="flex items-center gap-2 px-1">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink asChild>
                      <Link href="/programs">Programs</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="flex items-center gap-2">
                      <span>Verification - {program?.name || "Loading..."}</span>
                      {program && (
                        program.status === "ACTIVE" ? (
                          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-semibold h-5 px-2 py-0 border-none">Buka</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px] font-semibold h-5 px-2 py-0">Ditutup</Badge>
                        )
                      )}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild className="h-8">
                <Link href={`/programs/${id}/settings`}>
                  Settings
                </Link>
              </Button>
            </div>
          </header>

          {program?.description && (
            <div className="px-6 py-2.5 bg-muted/30 border-b text-xs text-muted-foreground flex items-center gap-2">
              <span className="font-semibold text-foreground/80 shrink-0">Deskripsi:</span>
              <span className="truncate" title={program.description}>{program.description}</span>
            </div>
          )}

          <div className="p-6 flex flex-col gap-6">
            {program?.status === "STOPPED" && (
              <Alert variant="destructive" className="border-rose-500 bg-rose-500/5 text-rose-600">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="font-bold">Verifikasi Ditangguhkan</AlertTitle>
                <AlertDescription className="text-xs">
                  Proses verifikasi untuk program ini telah dihentikan oleh Administrator. Anda tidak dapat melakukan penyimpanan atau perubahan data verifikasi.
                </AlertDescription>
              </Alert>
            )}


            {/* Verification Status Info Card */}
            {!isLoading && participant && (() => {
              const evalStatus = participant._evaluationStatus as string | null;
              const verifiedBy = participant._verifiedByName as string | null;
              const evaluatedAt = participant._evaluatedAt as string | null;

              const formattedDate = evaluatedAt
                ? new Date(evaluatedAt).toLocaleString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : null;

              if (evalStatus === "VERIFIED") {
                return (
                  <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30 px-4 py-3">
                    <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Data Telah Terverifikasi</p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        {verifiedBy && (
                          <>
                            <UserCircle2 className="size-3.5 shrink-0" />
                            <span>Oleh <strong>{verifiedBy}</strong></span>
                          </>
                        )}
                        {formattedDate && (
                          <>
                            <span className="text-emerald-500">·</span>
                            <ClockIcon className="size-3.5 shrink-0" />
                            <span>{formattedDate}</span>
                          </>
                        )}
                      </p>
                    </div>
                    <Badge className="bg-emerald-500 text-white border-none text-[10px] font-bold h-5 px-2 shrink-0">
                      Terverifikasi
                    </Badge>
                  </div>
                );
              }

              if (evalStatus === "REJECTED") {
                return (
                  <div className="flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/30 px-4 py-3">
                    <XCircle className="size-5 text-rose-600 dark:text-rose-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-rose-800 dark:text-rose-300">Data Ditolak</p>
                      <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        {verifiedBy && (
                          <>
                            <UserCircle2 className="size-3.5 shrink-0" />
                            <span>Oleh <strong>{verifiedBy}</strong></span>
                          </>
                        )}
                        {formattedDate && (
                          <>
                            <span className="text-rose-400">·</span>
                            <ClockIcon className="size-3.5 shrink-0" />
                            <span>{formattedDate}</span>
                          </>
                        )}
                      </p>
                    </div>
                    <Badge variant="destructive" className="text-white text-[10px] font-bold h-5 px-2 shrink-0">
                      Ditolak
                    </Badge>
                  </div>
                );
              }

              // Pending
              return (
                <div className="flex items-center gap-3 rounded-lg border border-dashed px-4 py-3 text-muted-foreground">
                  <ClockIcon className="size-4 shrink-0" />
                  <p className="text-xs">Belum diverifikasi — belum ada tindakan untuk data ini.</p>
                </div>
              );
            })()}

            {/* Sticky Navigator Container */}
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md pb-2.5 border-b pt-4 px-6 -mt-6 -mx-6">
              <ParticipantNavigator
                programId={id}
                onSave={handleSave}
                isSaving={isSaving}
                evaluationStatus={evaluationStatus}
                verifiedCount={program?.verifiedCount}
                rejectedCount={program?.rejectedCount}
                pendingCount={program?.pendingCount}
                isPaused={program?.status === "STOPPED"}
              />
            </div>

            {/* Participant Data Content Area */}
            <div className="flex-1 space-y-6">
              {isLoading ? (
                <div className="min-h-[300px] border border-dashed rounded-xl p-6 flex flex-col items-center justify-center bg-card shadow-sm gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading verification interface...</p>
                </div>
              ) : participant ? (
                <div className="flex flex-col gap-6">
                   {/* Participant fields based on Schema */}
                  <div className="w-full">
                    {sections.length > 0 ? (
                      <EvaluationForm
                        sections={sections}
                        participant={participant}
                        onFieldChange={handleFieldChange}
                      />
                    ) : (
                      // Fallback: Display raw key-value mapping if schema is empty/not built yet
                      <div className="border rounded-xl p-5 bg-card shadow-xs space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                          <h3 className="text-sm font-semibold uppercase tracking-wide">
                            Participant Row (Raw Data)
                          </h3>
                          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded font-medium">
                            No Schema Found
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(participant)
                            .filter(([key]) => !key.startsWith("_") && key !== "id" && key !== "uniqueKey") // Hide internal evaluation fields
                            .map(([key, val]) => (
                              <div key={key} className="border-b pb-2">
                                <span className="text-[10px] text-muted-foreground block font-bold uppercase tracking-wider">
                                  {key}
                                </span>
                                <span className="text-sm font-medium mt-0.5 block break-all text-foreground/80">
                                  {val !== null && val !== undefined ? String(val) : "-"}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Verification Controls & Remarks Panel */}
                  <div className="w-full">
                    <EvaluationControls
                      programId={id}
                      participant={participant}
                      onSaved={handleParticipantUpdated}
                    />
                  </div>
                </div>
              ) : (
                <div className="min-h-[300px] border border-dashed rounded-xl p-6 flex flex-col items-center justify-center bg-card shadow-sm text-muted-foreground">
                  No participant data found for this page.
                </div>
              )}
            </div>
          </div>
        </VerificationLayout>
      </div>
    </MembershipGate>
  );
}
