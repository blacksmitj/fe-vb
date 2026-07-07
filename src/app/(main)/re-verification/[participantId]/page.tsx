"use client";

import * as React from "react";
import { PageLayout, PageHeader } from "@/components/dashboard";
import {
  VerificationLayout,
  EvaluationForm,
  EvaluationControls,
  ParticipantNavigator,
} from "@/components/verification";
import { Section, migrateSectionsSchema } from "@/components/profile-builder";
import {
  Loader2,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ClockIcon,
  UserCircle2,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { useSearchParams, useRouter } from "next/navigation";
import { safeParseDate } from "@/lib/utils";
import { useVerificationStore } from "@/stores";
import { useSession } from "@/lib/auth/auth-client";
import { toast } from "sonner";

export default function ReVerificationDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ participantId: string }>;
}) {
  const { participantId } = React.use(paramsPromise);
  const searchParams = useSearchParams();
  const router = useRouter();
  const filterProgramId = searchParams.get("programId");
  const { data: session } = useSession();

  const [participant, setParticipant] = React.useState<Record<string, any> | null>(null);
  const [originalParticipant, setOriginalParticipant] = React.useState<Record<string, any> | null>(null);
  const [sections, setSections] = React.useState<Section[]>([]);
  const [prevId, setPrevId] = React.useState<string | null>(null);
  const [nextId, setNextId] = React.useState<string | null>(null);

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({});

  const {
    evaluationStatus,
    setEvaluationStatus,
    approvalDescription,
    setApprovalDescription,
    closeMediaViewer,
    resetEvaluation,
    setCurrentParticipantId,
  } = useVerificationStore();

  // Reset store on mount and clean up on unmount
  React.useEffect(() => {
    resetEvaluation();
    closeMediaViewer();
    return () => {
      resetEvaluation();
      closeMediaViewer();
    };
  }, [resetEvaluation, closeMediaViewer]);

  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (filterProgramId) {
          queryParams.set("programId", filterProgramId);
        }
        const res = await fetch(`/api/re-verification/${participantId}?${queryParams.toString()}`);
        if (!res.ok) {
          throw new Error("Gagal memuat data peserta");
        }
        const data = await res.json();
        
        if (data.participant) {
          setParticipant(data.participant);
          setOriginalParticipant(data.participant);
          setEvaluationStatus(data.participant._evaluationStatus || null);
          setApprovalDescription(data.participant._evaluationDescription || "");
          setCurrentParticipantId(data.participant.id);
        }
        if (data.sections) {
          setSections(migrateSectionsSchema(data.sections));
        }
        setPrevId(data.prevId || null);
        setNextId(data.nextId || null);
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || "Gagal memuat rincian peserta");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [participantId, filterProgramId, setEvaluationStatus, setApprovalDescription, setCurrentParticipantId]);

  const handleFieldChange = (label: string, value: any) => {
    setParticipant((prev) => (prev ? { ...prev, [label]: value } : null));
    setValidationErrors((prev) => {
      if (!prev[label]) return prev;
      const updated = { ...prev };
      delete updated[label];
      return updated;
    });
  };

  const hasChanges = React.useMemo(() => {
    if (!participant || !originalParticipant) return false;
    
    const fieldChanged = Object.keys(participant).some((key) => {
      if (key.startsWith("_") || key === "id" || key === "uniqueKey") return false;
      return participant[key] !== originalParticipant[key];
    });

    if (fieldChanged) return true;

    const statusChanged = evaluationStatus !== (originalParticipant._evaluationStatus || null);
    const descChanged = approvalDescription !== (originalParticipant._evaluationDescription || "");

    return statusChanged || descChanged;
  }, [participant, originalParticipant, evaluationStatus, approvalDescription]);

  const handleReset = () => {
    if (originalParticipant) {
      setParticipant({ ...originalParticipant });
      setEvaluationStatus(originalParticipant._evaluationStatus || null);
      setApprovalDescription(originalParticipant._evaluationDescription || "");
      setValidationErrors({});
    }
  };

  const handleSave = async (status: "VERIFIED" | "REJECTED" | "REVERIFICATION"): Promise<boolean> => {
    // Validate required fields
    const errors: Record<string, string> = {};
    if (status === "VERIFIED") {
      for (const section of sections) {
        for (const field of section.fields) {
          if (field.isRequired) {
            const val = participant?.[field.label];
            let isEmpty = val === undefined || val === null || (typeof val === "string" && val.trim() === "");
            
            if (field.type === "checkbox" && val !== "true" && val !== true) {
              isEmpty = true;
            }

            if (field.type === "array-pills") {
              const strVal = val !== undefined && val !== null ? String(val).trim() : "";
              if (strVal === "" || strVal === "[]") {
                isEmpty = true;
              } else if (strVal.startsWith("[") && strVal.endsWith("]")) {
                try {
                  const parsed = JSON.parse(strVal);
                  if (Array.isArray(parsed) && parsed.length === 0) {
                    isEmpty = true;
                  }
                } catch (e) {}
              }
            }

            if (isEmpty) {
              errors[field.label] = "harus diisi";
            }
          }
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error("Mohon lengkapi semua field yang wajib diisi.");
      return false;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/re-verification/${participantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          description: approvalDescription,
          participant,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal menyimpan verifikasi");
      }

      const data = await res.json();
      let successMsg = "Verifikasi Ulang Berhasil (Disetujui)";
      if (status === "REJECTED") {
        successMsg = "Verifikasi Ulang Berhasil (Ditolak)";
      } else if (status === "REVERIFICATION") {
        successMsg = "Permintaan Verifikasi Ulang berhasil diajukan";
      }
      toast.success(successMsg);
      setParticipant(data.participant);
      setOriginalParticipant(data.participant);
      setEvaluationStatus(data.participant._evaluationStatus || null);
      setApprovalDescription(data.participant._evaluationDescription || "");
      return true;
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Terjadi kesalahan saat menyimpan data");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnverify = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/re-verification/${participantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: null,
          description: "",
          participant,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal membatalkan verifikasi");
      }

      const data = await res.json();
      toast.success("Status verifikasi berhasil di-reset");
      setParticipant(data.participant);
      setOriginalParticipant(data.participant);
      setEvaluationStatus(null);
      setApprovalDescription("");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Terjadi kesalahan saat memproses data");
    } finally {
      setIsSaving(false);
    }
  };

  const backUrl = filterProgramId
    ? `/re-verification?programId=${filterProgramId}`
    : "/re-verification";

  const participantName = React.useMemo(() => {
    if (!participant) return "";
    return (
      participant["Nama"] ||
      participant["Nama Lengkap"] ||
      participant["Nama Peserta"] ||
      participant["Name"] ||
      ""
    );
  }, [participant]);

  const handleNavigate = (targetId: string | null) => {
    if (!targetId) return;
    closeMediaViewer();
    resetEvaluation();
    router.push(`/re-verification/${targetId}${filterProgramId ? `?programId=${filterProgramId}` : ""}`);
  };

  return (
    <PageLayout>
      <VerificationLayout>
        {/* Header */}
        <PageHeader
          actions={
            <Button variant="outline" size="sm" asChild className="h-8">
              <Link href={backUrl}>
                <ArrowLeft className="mr-2 size-4" />
                Kembali ke Daftar
              </Link>
            </Button>
          }
        >
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/re-verification">Verifikasi Ulang</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {isLoading ? "Memuat..." : `${participant?.programName} - ${participant?.uniqueKey}`}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </PageHeader>

        {/* Content */}
        <div className="p-6 flex flex-col gap-6">
          {/* Status info card */}
          {!isLoading && participant && (() => {
            const evalStatus = participant._evaluationStatus;
            const verifiedBy = participant._verifiedByName;
            const evaluatedAt = participant._evaluatedAt;
            const dateObj = evaluatedAt ? safeParseDate(evaluatedAt) : null;
            const formattedDate = dateObj ? dateObj.toLocaleString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }) : null;

            if (evalStatus === "VERIFIED") {
              return (
                <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30 px-4 py-3">
                  <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Data Terverifikasi (Disetujui)</p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                      {verifiedBy && (
                        <>
                          <UserCircle2 className="size-3.5 shrink-0 text-emerald-600" />
                          <span>Oleh <strong>{verifiedBy}</strong></span>
                        </>
                      )}
                      {formattedDate && (
                        <>
                          <span className="text-emerald-400">·</span>
                          <ClockIcon className="size-3.5 shrink-0 text-emerald-600" />
                          <span>{formattedDate}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <Badge className="bg-emerald-500 text-white border-none text-[10px] font-bold px-2 py-0.5 shrink-0">
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
                    <p className="text-sm font-semibold text-rose-800 dark:text-rose-300">Data Terverifikasi (Ditolak)</p>
                    <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                      {verifiedBy && (
                        <>
                          <UserCircle2 className="size-3.5 shrink-0 text-rose-600" />
                          <span>Oleh <strong>{verifiedBy}</strong></span>
                        </>
                      )}
                      {formattedDate && (
                        <>
                          <span className="text-rose-400">·</span>
                          <ClockIcon className="size-3.5 shrink-0 text-rose-600" />
                          <span>{formattedDate}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <Badge variant="destructive" className="text-white border-none text-[10px] font-bold px-2 py-0.5 shrink-0">
                    Ditolak
                  </Badge>
                </div>
              );
            }
            if (evalStatus === "REVERIFICATION") {
              return (
                <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-4 py-3">
                  <RefreshCw className="size-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Menunggu Verifikasi Ulang</p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                      {verifiedBy && (
                        <>
                          <UserCircle2 className="size-3.5 shrink-0 text-amber-600" />
                          <span>Oleh <strong>{verifiedBy}</strong></span>
                        </>
                      )}
                      {formattedDate && (
                        <>
                          <span className="text-amber-400">·</span>
                          <ClockIcon className="size-3.5 shrink-0 text-amber-600" />
                          <span>{formattedDate}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-none text-[10px] font-bold px-2 py-0.5 shrink-0">
                    Verifikasi Ulang
                  </Badge>
                </div>
              );
            }

            return null;
          })()}

          {/* Sticky Navigator Container */}
          {!isLoading && (
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md pb-2.5 border-b pt-4 px-6 -mt-6 -mx-6">
              <ParticipantNavigator
                programId={originalParticipant?.programId ?? ""}
                mode="re-verification"
                onSave={handleSave}
                onUnverify={handleUnverify}
                onReset={handleReset}
                hasChanges={hasChanges}
                isSaving={isSaving}
                originalStatus={originalParticipant?._evaluationStatus}
                verifiedByUserId={originalParticipant?._verifiedByUserId}
                onPrev={() => handleNavigate(prevId)}
                onNext={() => handleNavigate(nextId)}
                prevDisabled={!prevId}
                nextDisabled={!nextId}
                backUrl={backUrl}
                participantLabel={participantName || "Peserta"}
              />
            </div>
          )}

          {/* Form and Controls */}
          <div className="flex-1 space-y-6">
            {isLoading ? (
              <div className="min-h-[300px] border border-dashed rounded-xl p-6 flex flex-col items-center justify-center bg-card shadow-sm gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                <p className="text-sm text-muted-foreground">Memuat antarmuka verifikasi ulang...</p>
              </div>
            ) : participant ? (
              <div className="flex flex-col gap-6">
                {/* Profile Form */}
                <div className="w-full">
                  {sections.length > 0 ? (
                    <EvaluationForm
                      sections={sections}
                      participant={participant}
                      onFieldChange={handleFieldChange}
                      errors={validationErrors}
                    />
                  ) : (
                    <div className="border rounded-xl p-5 bg-card shadow-xs space-y-4">
                      <div className="flex items-center justify-between border-b pb-2">
                        <h3 className="text-sm font-semibold uppercase tracking-wide">
                          Data Peserta (Raw Data)
                        </h3>
                        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded font-medium">
                          Tidak Ada Skema
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(participant)
                          .filter(([key]) => !key.startsWith("_") && key !== "id" && key !== "uniqueKey")
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

                {/* Evaluation controls */}
                <div className="w-full">
                  <EvaluationControls
                    programId={participant.programId}
                    participant={participant}
                    onSaved={(updated) => {
                      setParticipant(updated);
                      setOriginalParticipant(updated);
                      setEvaluationStatus(updated._evaluationStatus || null);
                      setApprovalDescription(updated._evaluationDescription || "");
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="min-h-[300px] border border-dashed rounded-xl p-6 flex flex-col items-center justify-center bg-card shadow-sm text-muted-foreground">
                Data peserta tidak ditemukan.
              </div>
            )}
          </div>
        </div>
      </VerificationLayout>
    </PageLayout>
  );
}
