"use client";

import * as React from "react";
import { useVerificationStore } from "@/stores";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, User, Calendar } from "lucide-react";

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
  const verifiedAt = participant?._evaluatedAt ? new Date(participant._evaluatedAt).toLocaleString("id-ID") : null;

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
                <strong>Pemverifikasi:</strong> {verifiedBy}
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
