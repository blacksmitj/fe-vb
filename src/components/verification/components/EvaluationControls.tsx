"use client";

import * as React from "react";
import { useVerificationStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Flag, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
    currentPage,
    evaluationStatus,
    setEvaluationStatus,
    approvalDescription,
    setApprovalDescription,
  } = useVerificationStore();

  const [isSavingLocal, setIsSavingLocal] = React.useState(false);

  const handleSave = async () => {
    if (!evaluationStatus) {
      toast.error("Please select an evaluation status (Approve, Reject, or Flag)");
      return;
    }

    setIsSavingLocal(true);
    try {
      const res = await fetch(`/api/programs/${programId}/participants?page=${currentPage}`, {
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
        onSaved(data.participant);
      } else {
        toast.error(data.error || "Failed to save evaluation");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while saving the evaluation");
    } finally {
      setIsSavingLocal(false);
    }
  };

  return (
    <div className="border rounded-xl p-5 bg-card shadow-xs space-y-4">
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide border-b pb-2">
        Evaluation Action
      </h3>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={evaluationStatus === "Approve" ? "default" : "outline"}
          size="sm"
          onClick={() => setEvaluationStatus("Approve")}
          className={cn(
            "flex items-center gap-1.5 font-medium transition-all duration-200",
            evaluationStatus === "Approve"
              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              : "hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30 border-muted"
          )}
        >
          <Check className="h-3.5 w-3.5" />
          Approve
        </Button>
        
        <Button
          type="button"
          variant={evaluationStatus === "Reject" ? "default" : "outline"}
          size="sm"
          onClick={() => setEvaluationStatus("Reject")}
          className={cn(
            "flex items-center gap-1.5 font-medium transition-all duration-200",
            evaluationStatus === "Reject"
              ? "bg-red-600 hover:bg-red-700 text-white shadow-xs"
              : "hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 border-muted"
          )}
        >
          <X className="h-3.5 w-3.5" />
          Reject
        </Button>

        <Button
          type="button"
          variant={evaluationStatus === "Flag" ? "default" : "outline"}
          size="sm"
          onClick={() => setEvaluationStatus("Flag")}
          className={cn(
            "flex items-center gap-1.5 font-medium transition-all duration-200",
            evaluationStatus === "Flag"
              ? "bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
              : "hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/30 border-muted"
          )}
        >
          <Flag className="h-3.5 w-3.5" />
          Flag
        </Button>
      </div>

      {/* Description / Remarks */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
          Approval Description / Remarks
        </span>
        <Textarea
          placeholder="Write evaluation remarks (e.g. reasons for rejection or flagging details)..."
          value={approvalDescription}
          onChange={(e) => setApprovalDescription(e.target.value)}
          className="min-h-[80px] text-sm"
        />
      </div>
    </div>
  );
}
