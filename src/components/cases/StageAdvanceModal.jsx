import React from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const STAGE_GUARDS = {
  census_in_progress: { check: (c) => true, message: "" },
  census_validated: { check: (c) => c.census_status === "validated", message: "Census must be validated before advancing." },
  ready_for_quote: { check: (c) => ["validated"].includes(c.census_status), message: "Census must be validated before moving to quoting." },
  quoting: { check: (c) => c.census_status === "validated", message: "Census must be validated." },
  proposal_ready: { check: (c) => c.quote_status === "completed", message: "Quotes must be completed before generating a proposal." },
  employer_review: { check: (c) => c.quote_status === "completed", message: "Quotes must be completed first." },
  approved_for_enrollment: { check: (c) => true, message: "" },
  enrollment_open: { check: (c) => true, message: "" },
  enrollment_complete: { check: (c) => true, message: "" },
  install_in_progress: { check: (c) => c.enrollment_status === "completed", message: "Enrollment must be completed first." },
  active: { check: (c) => true, message: "" },
};

export default function StageAdvanceModal({ caseData, nextStage, nextStageLabel, open, onConfirm, onClose }) {
  const guard = STAGE_GUARDS[nextStage];
  const blocked = guard && !guard.check(caseData);

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {blocked ? "Cannot Advance Stage" : `Advance to ${nextStageLabel}?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {blocked
              ? guard.message
              : `This will move the case for ${caseData?.employer_name} to the "${nextStageLabel}" stage. This action is logged.`}
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