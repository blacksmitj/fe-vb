"use client";

import * as React from "react";
import { useVerificationStore } from "@/stores";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, User, Calendar } from "lucide-react";
import { safeParseDate } from "@/lib/utils/format-date";
import { cn } from "@/lib/utils";

interface EvaluationControlsProps {
  programId: string;
  participant: Record<string, any> | null;
  onSaved: (updatedParticipant: Record<string, any>) => void;
  onSave?: () => Promise<void> | void;
  isSaving?: boolean;
}

export function EvaluationControls({
  programId,
  participant,
  onSaved,
  onSave,
  isSaving = false,
}: EvaluationControlsProps) {
  const {
    evaluationStatus,
    approvalDescription,
    setApprovalDescription,
  } = useVerificationStore();

  const isVerified = evaluationStatus === "VERIFIED" || participant?._evaluationStatus === "VERIFIED";
  const verifiedBy = participant?._verifiedByName || null;
  const dateObj = participant?._evaluatedAt ? safeParseDate(participant._evaluatedAt) : null;
  const verifiedAt = dateObj ? dateObj.toLocaleString("id-ID") : null;

  return (
    <div className="border rounded-xl p-5 bg-card shadow-xs space-y-4 border-muted/80">
      <div className="flex items-center justify-between border-b pb-3 border-muted">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Status Verifikasi
        </h3>
        {isVerified ? (
          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Telah Diverifikasi
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-muted-foreground flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Belum Diverifikasi
          </Badge>
        )}
      </div>

      {/* Verifier details if verified */}
      {isVerified && (verifiedBy || verifiedAt) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-muted/30 p-3 rounded-lg border">
          {verifiedBy && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-3.5 w-3.5 text-primary/80" />
              <span>
                <strong>Pemverifikasi Saat Ini:</strong> {verifiedBy}
              </span>
            </div>
          )}
          {verifiedAt && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 text-primary/80" />
              <span>
                <strong>Waktu:</strong> {verifiedAt}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Verification History list */}
      {participant?._verificationHistories && participant._verificationHistories.length > 0 && (
        <div className="space-y-3 pt-3 border-t border-muted/80">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
            Riwayat Verifikasi ({participant._verificationHistories.length})
          </label>
          <div className="relative pl-4 border-l border-muted space-y-4">
            {participant._verificationHistories.map((history: any, index: number) => {
              const histDate = history.evalAt ? safeParseDate(history.evalAt) : null;
              const formattedHistDate = histDate ? histDate.toLocaleString("id-ID") : "-";
              const isInitial = index === 0;
              
              const getStatusLabel = (status: string) => {
                switch (status) {
                  case "VERIFIED": return "Diverifikasi";
                  case "REJECTED": return "Ditolak";
                  case "REVERIFICATION": return "Verifikasi Ulang";
                  default: return status;
                }
              };

              const getStatusBadgeClass = (status: string) => {
                switch (status) {
                  case "VERIFIED": return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
                  case "REJECTED": return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
                  case "REVERIFICATION": return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
                  default: return "";
                }
              };

              return (
                <div key={history.id || index} className="relative text-xs space-y-1">
                  {/* Timeline dot */}
                  <div className="absolute left-[-21px] top-1 h-2.5 w-2.5 rounded-full border bg-background border-muted-foreground/40" />
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground">
                      {isInitial ? "Verifikasi Awal" : `Verifikasi Ke-${index + 1}`}
                    </span>
                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", getStatusBadgeClass(history.evalStatus))}>
                      {getStatusLabel(history.evalStatus)}
                    </Badge>
                  </div>
                  
                  <div className="text-muted-foreground flex flex-col gap-0.5">
                    <span>
                      Oleh: <strong>{history.evalByUserName}</strong>
                    </span>
                    <span className="text-[10px] text-muted-foreground/80">
                      {formattedHistDate}
                    </span>
                    {history.evalDescription && (
                      <span className="mt-1 block bg-muted/20 p-2 rounded-md border border-muted/65 italic">
                        "{history.evalDescription}"
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Description / Remarks */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
          Catatan / Keterangan Verifikasi
        </label>
        <Textarea
          placeholder="Tulis keterangan verifikasi di sini..."
          value={approvalDescription}
          onChange={(e) => setApprovalDescription(e.target.value)}
          className="min-h-[80px] text-sm bg-background border-muted/80 focus-visible:ring-emerald-500"
        />
      </div>
    </div>
  );
}
