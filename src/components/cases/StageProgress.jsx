import React from "react";

const STAGE_ORDER = [
  "draft", "census_in_progress", "census_validated", "ready_for_quote",
  "quoting", "proposal_ready", "employer_review", "approved_for_enrollment",
  "enrollment_open", "enrollment_complete", "install_in_progress", "active",
];

const STAGE_LABELS = {
  draft: "Draft",
  census_in_progress: "Census",
  census_validated: "Validated",
  ready_for_quote: "TxQuote",
  quoting: "Quoting",
  proposal_ready: "Proposal",
  employer_review: "Review",
  approved_for_enrollment: "Approved",
  enrollment_open: "Enrollment",
  enrollment_complete: "Enrolled",
  install_in_progress: "Install",
  active: "Active",
};

export default function StageProgress({ currentStage }) {
  const currentIndex = STAGE_ORDER.indexOf(currentStage);
  const displayStages = STAGE_ORDER.slice(0, 8);

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {displayStages.map((stage, i) => {
        const isComplete = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div key={stage} className="flex items-center flex-shrink-0">
            <div
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                isCurrent
                  ? "bg-primary text-primary-foreground"
                  : isComplete
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {STAGE_LABELS[stage] || stage}
            </div>
            {i < displayStages.length - 1 && (
              <div className={`w-4 h-px mx-0.5 ${i < currentIndex ? "bg-primary/40" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}