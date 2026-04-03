import React from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

/**
 * Stage guards define the conditions that MUST be met before advancing.
 * Each guard returns { ok: boolean, reason: string } so we can show
 * specific messaging when a stage is blocked.
 */
const STAGE_GUARDS = {
  census_in_progress: {
    check: (c) => ({ ok: true, reason: "" }),
  },
  census_validated: {
    check: (c) => ({
      ok: c.census_status === "validated",
      reason: "Census must be validated before advancing.",
    }),
  },
  ready_for_quote: {
    check: (c) => ({
      ok: ["validated"].includes(c.census_status),
      reason: "Census must be validated before moving to quoting.",
    }),
  },
  quoting: {
    check: (c) => ({
      ok: c.census_status === "validated",
      reason: "Census must be validated.",
    }),
  },
  proposal_ready: {
    check: (c) => ({
      ok: c.quote_status === "completed",
      reason: "Quotes must be completed before generating a proposal.",
    }),
  },
  employer_review: {
    check: (c) => ({
      ok: c.quote_status === "completed",
      reason: "Quotes must be completed before sending to employer review.",
    }),
  },
  approved_for_enrollment: {
    check: (c) => ({
      ok: ["sent", "viewed", "approved"].includes(c.proposal_status) || !!c.proposal_id,
      reason: "A proposal must be sent to the employer before approving for enrollment.",
    }),
  },
  enrollment_open: {
    check: (c) => ({
      ok: c.stage === "approved_for_enrollment" || c.enrollment_status !== "not_started",
      reason: "Case must be approved for enrollment before opening the enrollment window.",
    }),
  },
  enrollment_complete: {
    check: (c) => ({
      ok: c.enrollment_status === "in_progress" || c.enrollment_status === "completed",
      reason: "Enrollment must be open and in progress before marking complete.",
    }),
  },
  install_in_progress: {
    check: (c) => ({
      ok: c.enrollment_status === "completed",
      reason: "Enrollment must be completed before starting installation.",
    }),
  },
  active: {
    check: (c) => ({
      ok: true,
      reason: "",
    }),
  },
};

export default function StageAdvanceModal({ caseData, nextStage, nextStageLabel, open, onConfirm, onClose }) {
  const guard = STAGE_GUARDS[nextStage];
  const result = guard ? guard.check(caseData) : { ok: true, reason: "" };
  const blocked = !result.ok;

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {blocked && <AlertTriangle className="w-4 h-4 text-destructive" />}
            {blocked ? "Cannot Advance Stage" : `Advance to ${nextStageLabel}?`}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            {blocked ? (
              <span className="text-destructive font-medium">{result.reason}</span>
            ) : (
              <>
                <span>
                  This will move the case for{" "}
                  <strong>{caseData?.employer_name}</strong> to the{" "}
                  <Badge variant="outline" className="text-xs">{nextStageLabel}</Badge> stage.
                </span>
                <span className="block text-xs text-muted-foreground mt-1">
                  This action is logged and cannot be automatically reversed.
                </span>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          {!blocked && (
            <AlertDialogAction onClick={onConfirm}>Confirm</AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
