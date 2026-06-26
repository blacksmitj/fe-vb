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
import { Loader2, ArrowLeft, RefreshCw } from "lucide-react";
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

export default function VerificationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { data: program } = useProgram(id);
  
  const {
    currentPage,
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
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [hasSynced, setHasSynced] = React.useState(false);

  // Auto-sync Google Sheet on page load
  React.useEffect(() => {
    async function autoSync() {
      if (!program || hasSynced) return;
      if (program.sheetId) {
        setIsSyncing(true);
        try {
          const syncRes = await fetch(`/api/programs/${id}/sheet/sync`, { method: "POST" });
          const syncData = await syncRes.json();
          if (syncRes.ok && syncData.success) {
            toast.success("Data berhasil disinkronisasikan dari Google Sheet");
          } else {
            toast.error(syncData.error || "Gagal sinkronisasi data dari Google Sheet");
          }
        } catch (err) {
          console.error("Auto-sync failed:", err);
        } finally {
          setIsSyncing(false);
          setHasSynced(true);
        }
      } else {
        setHasSynced(true);
      }
    }
    autoSync();
  }, [program, id, hasSynced]);

  // Fetch Program Profile Builder Schema
  React.useEffect(() => {
    async function loadSchema() {
      setIsSchemaLoading(true);
      try {
        const res = await fetch(`/api/programs/${id}/schema`);
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

  // Fetch Participant Data based on currentPage
  React.useEffect(() => {
    // Only load participants AFTER initial autoSync completes
    if (!hasSynced) return;

    async function loadParticipant() {
      setIsParticipantLoading(true);
      try {
        const res = await fetch(`/api/programs/${id}/participants?page=${currentPage}`);
        const data = await res.json();
        setParticipant(data.participant);
        
        if (data.totalRows !== undefined) {
          setTotalRows(data.totalRows);
        }

        // Sync local store evaluation state with the fetched participant's evaluation
        if (data.participant) {
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
  }, [currentPage, id, setTotalRows, setEvaluationStatus, setApprovalDescription, resetEvaluation, hasSynced]);

  // Callback to update participant row locally after saving evaluation
  const handleParticipantUpdated = (updatedParticipant: Record<string, any>) => {
    setParticipant(updatedParticipant);
  };

  const handleFieldChange = (label: string, value: any) => {
    setParticipant((prev) => (prev ? { ...prev, [label]: value } : null));
  };

  const handleSave = async () => {
    if (!evaluationStatus) {
      toast.error("Please select an evaluation status (Approve, Reject, or Flag)");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/programs/${id}/participants?page=${currentPage}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: evaluationStatus,
          description: approvalDescription,
          participant,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Evaluation saved as ${evaluationStatus}`);
        setParticipant(data.participant);
      } else {
        toast.error(data.error || "Failed to save evaluation");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while saving the evaluation");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncManual = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch(`/api/programs/${id}/sheet/sync`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Sinkronisasi berhasil");
        // Force reload participant by triggering fetch state change
        setHasSynced(false);
      } else {
        toast.error(data.error || "Gagal sinkronisasi");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan koneksi");
    } finally {
      setIsSyncing(false);
    }
  };

  const isLoading = isParticipantLoading || isSchemaLoading || isSyncing;

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
                    <BreadcrumbPage>
                      Verification - {program?.name || "Loading..."}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex items-center gap-2">
              {program?.sheetId && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8"
                  onClick={handleSyncManual}
                  disabled={isSyncing}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                  Sync Sheet
                </Button>
              )}
              <Button variant="outline" size="sm" asChild className="h-8">
                <Link href={`/programs/${id}/settings`}>
                  Config Sheet
                </Link>
              </Button>
            </div>
          </header>

          <div className="p-6 flex flex-col gap-6">
            {/* Sticky Navigator Container */}
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md pb-2.5 border-b pt-4 px-6 -mt-6 -mx-6">
              <ParticipantNavigator
                programId={id}
                onSave={handleSave}
                isSaving={isSaving}
                evaluationStatus={evaluationStatus}
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
                            .filter(([key]) => !key.startsWith("_")) // Hide internal evaluation fields
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
