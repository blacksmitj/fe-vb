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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { PageLayout, PageHeader } from "@/components/dashboard";
import { useProgram } from "@/hooks/use-programs";
import { toast } from "sonner";
import { MembershipGate } from "@/components/programs/membership-gate";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { safeParseDate } from "@/lib/utils";
import { useSession } from "@/lib/auth/auth-client";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export default function VerificationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { data: program, refetch: refetchProgram } = useProgram(id);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const {
    currentRowIndex,
    setCurrentRowIndex,
    setCurrentParticipantId,
    currentParticipantId,
    setTotalRows,
    setEvaluationStatus,
    setApprovalDescription,
    resetEvaluation,
    evaluationStatus,
    approvalDescription,
    closeMediaViewer,
  } = useVerificationStore();
  
  const [participant, setParticipant] = React.useState<Record<string, any> | null>(null);
  const [originalParticipant, setOriginalParticipant] = React.useState<Record<string, any> | null>(null);
  const [sections, setSections] = React.useState<Section[]>([]);
  
  const { data: session } = useSession();
  const [currentUserMember, setCurrentUserMember] = React.useState<{ role: string | null; status: string | null } | null>(null);

  // Fetch current user's membership in this program
  React.useEffect(() => {
    async function loadUserMembership() {
      try {
        const res = await fetch(`/api/programs/${id}/membership`);
        if (res.ok) {
          const data = await res.json();
          setCurrentUserMember(data);
        }
      } catch (err) {
        console.error("Failed to load user membership", err);
      }
    }
    loadUserMembership();
  }, [id]);

  // Handle ?page= query parameter to jump to a specific row
  React.useEffect(() => {
    const pageParam = searchParams.get("page");
    if (pageParam !== null) {
      const pageIndex = parseInt(pageParam, 10);
      if (!isNaN(pageIndex) && pageIndex !== currentRowIndex) {
        setCurrentRowIndex(pageIndex);
        // Clear the query parameter after consuming it so it doesn't get stuck
        router.replace(pathname, { scroll: false });
      }
    }
  }, [searchParams, currentRowIndex, setCurrentRowIndex, router, pathname]);

  const canUnverify = React.useMemo(() => {
    if (!session || !currentUserMember || !participant) return false;
    if (currentUserMember.role === "ADMIN") return true;
    return participant._verifiedByUserId === session.user.id;
  }, [session, currentUserMember, participant]);
  
  const [isParticipantLoading, setIsParticipantLoading] = React.useState(true);
  const [isSchemaLoading, setIsSchemaLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUsingLocalDraft, setIsUsingLocalDraft] = React.useState(false);
  const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({});

  // Helper to save draft to localStorage
  const saveDraftToLocalStorage = React.useCallback(() => {
    if (!participant || !currentParticipantId) return;
    const draftKey = `draft_${id}_${currentParticipantId}`;
    const draftData = {
      participant,
      evaluationStatus,
      approvalDescription,
    };
    localStorage.setItem(draftKey, JSON.stringify(draftData));
    setIsUsingLocalDraft(true);
  }, [id, currentParticipantId, participant, evaluationStatus, approvalDescription]);

  // Helper to clear draft from localStorage
  const clearDraftFromLocalStorage = React.useCallback((pId?: string) => {
    const targetId = pId || currentParticipantId;
    if (!targetId) return;
    localStorage.removeItem(`draft_${id}_${targetId}`);
  }, [id, currentParticipantId]);

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

  React.useEffect(() => {
    async function loadParticipant() {
      setIsParticipantLoading(true);
      setValidationErrors({});
      try {
        closeMediaViewer();
        const res = await fetch(`/api/programs/${id}/participants?page=${currentRowIndex}`);
        if (!res.ok) throw new Error("Failed to load participant");
        const data = await res.json();
        
        if (data.totalRows !== undefined) {
          setTotalRows(data.totalRows);
        }

        // Sync local store evaluation state with the fetched participant's evaluation
        if (data.participant) {
          setCurrentParticipantId(data.participant.id || null);
          
          // Check if local draft exists
          const draftKey = `draft_${id}_${data.participant.id}`;
          const localDraft = localStorage.getItem(draftKey);
          if (localDraft) {
            try {
              const parsed = JSON.parse(localDraft);
              setParticipant(parsed.participant);
              setOriginalParticipant(data.participant);
              setEvaluationStatus(parsed.evaluationStatus || null);
              setApprovalDescription(parsed.approvalDescription || "");
              setIsUsingLocalDraft(true);
            } catch (e) {
              console.error("Failed to parse local draft", e);
              setParticipant(data.participant);
              setOriginalParticipant(data.participant);
              setEvaluationStatus(data.participant._evaluationStatus || null);
              setApprovalDescription(data.participant._evaluationDescription || "");
              setIsUsingLocalDraft(false);
            }
          } else {
            setParticipant(data.participant);
            setOriginalParticipant(data.participant);
            setEvaluationStatus(data.participant._evaluationStatus || null);
            setApprovalDescription(data.participant._evaluationDescription || "");
            setIsUsingLocalDraft(false);
          }
        } else {
          setParticipant(null);
          setOriginalParticipant(null);
          resetEvaluation();
          setIsUsingLocalDraft(false);
        }
      } catch (err) {
        console.error("Failed to load participant", err);
        resetEvaluation();
        setOriginalParticipant(null);
        setParticipant(null);
        setIsUsingLocalDraft(false);
      } finally {
        setIsParticipantLoading(false);
      }
    }
    loadParticipant();
  }, [currentRowIndex, id, setTotalRows, setEvaluationStatus, setApprovalDescription, resetEvaluation, setCurrentParticipantId, closeMediaViewer]);

  // Callback to update participant row locally after saving evaluation
  const handleParticipantUpdated = (updatedParticipant: Record<string, any>) => {
    setParticipant(updatedParticipant);
    setOriginalParticipant(updatedParticipant);
    clearDraftFromLocalStorage(updatedParticipant.id);
    setIsUsingLocalDraft(false);
    refetchProgram();
  };

  const handleFieldChange = (label: string, value: any) => {
    setParticipant((prev) => (prev ? { ...prev, [label]: value } : null));
    setValidationErrors((prev) => {
      if (!prev[label]) return prev;
      const updated = { ...prev };
      delete updated[label];
      return updated;
    });
  };

  // Check if form fields or store fields are dirty compared to original
  const hasChanges = React.useMemo(() => {
    if (!participant || !originalParticipant) return false;
    
    // Compare non-internal fields in participant
    const fieldChanged = Object.keys(participant).some((key) => {
      if (key.startsWith("_") || key === "id" || key === "uniqueKey") return false;
      return participant[key] !== originalParticipant[key];
    });

    if (fieldChanged) return true;

    // Compare evaluation status and description
    const statusChanged = (evaluationStatus || null) !== (originalParticipant._evaluationStatus || null);
    const descChanged = approvalDescription !== (originalParticipant._evaluationDescription || "");

    return statusChanged || descChanged;
  }, [participant, originalParticipant, evaluationStatus, approvalDescription]);

  const handleReset = React.useCallback(() => {
    if (originalParticipant) {
      setParticipant({ ...originalParticipant });
      setEvaluationStatus(originalParticipant._evaluationStatus || null);
      setApprovalDescription(originalParticipant._evaluationDescription || "");
      clearDraftFromLocalStorage();
      setIsUsingLocalDraft(false);
    }
  }, [originalParticipant, setEvaluationStatus, setApprovalDescription, clearDraftFromLocalStorage]);

  const handleSave = async () => {
    if (program?.status === "STOPPED") {
      toast.error("Tidak dapat menyimpan perubahan karena verifikasi program ini ditangguhkan.");
      return;
    }

    // Validate required fields
    const errors: Record<string, string> = {};
    for (const section of sections) {
      for (const field of section.fields) {
        if (field.isRequired) {
          const val = participant?.[field.label];
          const isEmpty = val === undefined || val === null || (typeof val === "string" && val.trim() === "");
          if (isEmpty) {
            errors[field.label] = "harus diisi";
          }
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error("Mohon lengkapi semua field yang wajib diisi.");
      return;
    }

    setValidationErrors({});
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
        setOriginalParticipant(data.participant);
        clearDraftFromLocalStorage(data.participant.id);
        setIsUsingLocalDraft(false);
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

  const handleUnverify = async () => {
    if (program?.status === "STOPPED") {
      toast.error("Tidak dapat membatalkan verifikasi karena verifikasi program ini ditangguhkan.");
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
          status: null,
          description: "",
          participant,
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch (err) {
        data = { error: "Terjadi kesalahan saat memproses data" };
      }

      if (res.ok && data.success) {
        toast.success("Verifikasi berhasil dibatalkan");
        setParticipant(data.participant);
        setOriginalParticipant(data.participant);
        setEvaluationStatus(null);
        setApprovalDescription("");
        clearDraftFromLocalStorage(data.participant.id);
        setIsUsingLocalDraft(false);
        refetchProgram();
      } else {
        toast.error(data.error || "Gagal membatalkan verifikasi");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan saat memproses data");
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = isParticipantLoading || isSchemaLoading;

  return (
    <MembershipGate programId={id}>
      <PageLayout>
        {/* ── Main Layout ─────────────────────────────────────── */}
        <VerificationLayout>
          {/* ── Standard Header (inside VerificationLayout to scroll with the page) ─────────────────────────────────── */}
          <PageHeader
            actions={
              <Button variant="outline" size="sm" asChild className="h-8">
                <Link href={`/programs/${id}/settings`}>
                  Settings
                </Link>
              </Button>
            }
          >
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
          </PageHeader>


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
              const dateObj = evaluatedAt ? safeParseDate(evaluatedAt) : null;

              const formattedDate = dateObj
                ? dateObj.toLocaleString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : null;

              if (evalStatus === "VERIFIED") {
                return (
                  <div className="flex flex-col gap-3">
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
                  </div>
                );
              }

              if (evalStatus === "REJECTED") {
                return (
                  <div className="flex flex-col gap-3">
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

            {isUsingLocalDraft && (
              <Alert className="border-amber-500 bg-amber-500/5 text-amber-600 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-400">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <div className="flex-1">
                  <AlertTitle className="font-bold flex items-center gap-2 text-xs">
                    Draft Lokal Aktif
                    <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-600 font-semibold px-1 py-0 h-4">
                      Belum Disimpan
                    </Badge>
                  </AlertTitle>
                  <AlertDescription className="text-[11px] mt-0.5">
                    Menampilkan data yang Anda ketik sebelumnya secara lokal di browser ini. Data ini belum tersimpan di database. Klik <strong>Save</strong> untuk menyimpan permanen atau <strong>Reset</strong> untuk membuang draf ini.
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {/* Sticky Navigator Container */}
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md pb-2.5 border-b pt-4 px-6 -mt-6 -mx-6">
              <ParticipantNavigator
                programId={id}
                onSave={handleSave}
                onUnverify={handleUnverify}
                onSaveDraft={saveDraftToLocalStorage}
                onReset={handleReset}
                hasChanges={hasChanges}
                isSaving={isSaving}
                evaluationStatus={evaluationStatus}
                originalStatus={originalParticipant?._evaluationStatus}
                canUnverify={canUnverify}
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
                        errors={validationErrors}
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
      </PageLayout>
    </MembershipGate>
  );
}
