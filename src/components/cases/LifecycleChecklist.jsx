import React from "react";

const STAGE_ORDER = [
  "draft", "census_in_progress", "census_validated", "ready_for_quote",
  "quoting", "proposal_ready", "employer_review", "approved_for_enrollment",
  "enrollment_open", "enrollment_complete", "install_in_progress", "active",
];

/**
 * LifecycleChecklist
 * Shows a progress bar + checklist of key milestones for a benefit case.
 *
 * Props:
 *   caseData      — BenefitCase entity record
 *   censusCount   — number of CensusVersion records for this case
 *   scenarioCount — number of QuoteScenario records for this case
 *   taskCount     — number of CaseTask records for this case
 *   docCount      — number of Document records for this case
 */
export default function LifecycleChecklist({ caseData, censusCount, scenarioCount, taskCount, docCount, txQuoteComplete }) {
  const stageIdx = STAGE_ORDER.indexOf(caseData.stage);

  const checks = [
    { label: "Case created", done: true },
    { label: "Employer group linked", done: !!caseData.employer_group_id },
    { label: "Census uploaded", done: censusCount > 0 || caseData.census_status === "validated" },
    { label: "Census validated", done: caseData.census_status === "validated" || stageIdx >= 3 },
    { label: "Quote scenario created", done: scenarioCount > 0 || stageIdx >= 4 },
    { label: "Proposal built", done: stageIdx >= 5 },
    { label: "Employer review done", done: stageIdx >= 7 },
    { label: "Enrollment opened", done: stageIdx >= 8 },
    { label: "Enrollment complete", done: stageIdx >= 10 },
    { label: "Case installed / active", done: stageIdx >= 11 },
    { label: "TxQuote submission", done: !!txQuoteComplete },
  ];

  const doneCount = checks.filter(c => c.done).length;
  const pct = Math.round((doneCount / checks.length) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{doneCount}/{checks.length} complete</span>
        <span className="text-xs font-semibold text-primary">{pct}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      {checks.map((c, i) => (
        <div key={i} className={`flex items-center gap-2 text-xs ${c.done ? "text-foreground" : "text-muted-foreground"}`}>
          <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${c.done ? "bg-emerald-100" : "bg-muted"}`}>
            {c.done ? (
              <svg className="w-2.5 h-2.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
            )}
          </div>
          <span className={c.done ? "line-through opacity-60" : ""}>{c.label}</span>
        </div>
      ))}
    </div>
  );
}