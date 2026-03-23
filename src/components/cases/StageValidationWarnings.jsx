import React from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

const STAGE_REQUIREMENTS = {
  census_in_progress: ["Must have effective date"],
  census_validated: ["Census file must be uploaded and validated"],
  ready_for_quote: ["Census must be validated"],
  quoting: ["At least one quote scenario required"],
  proposal_ready: ["Quote completed", "Proposal draft created"],
  employer_review: ["Proposal sent to employer"],
  approved_for_enrollment: ["Employer approved proposal", "No pending critical tasks"],
  enrollment_open: ["Enrollment window created"],
  enrollment_complete: ["Enrollment window closed", "Participation data captured"],
  install_in_progress: ["Plans finalized"],
  active: ["Enrollment complete", "All tasks resolved"],
};

export default function StageValidationWarnings({ caseData, nextStage, censusVersions, scenarios, tasks }) {
  if (!nextStage || !STAGE_REQUIREMENTS[nextStage]) return null;

  const requirements = STAGE_REQUIREMENTS[nextStage];
  
  // Determine which requirements are met
  const met = [];
  const unmet = [];

  requirements.forEach(req => {
    let isMet = false;
    
    if (req.includes("effective date")) {
      isMet = !!caseData.effective_date;
    } else if (req.includes("Census") && req.includes("validated")) {
      isMet = censusVersions.some(v => v.status === "validated");
    } else if (req.includes("Census") && req.includes("uploaded")) {
      isMet = censusVersions.length > 0;
    } else if (req.includes("quote scenario")) {
      isMet = scenarios.length > 0;
    } else if (req.includes("pending critical")) {
      isMet = !tasks.some(t => t.status === "pending" && t.priority === "urgent");
    }

    if (isMet) met.push(req);
    else unmet.push(req);
  });

  const canProceed = unmet.length === 0;

  return (
    <Card className={canProceed ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}>
      <CardContent className="p-4">
        <div className="flex gap-3 mb-3">
          {canProceed ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-semibold text-sm">
              {canProceed ? `Ready to advance to ${nextStage}` : `Requirements to advance`}
            </p>
          </div>
        </div>

        <ul className="space-y-2">
          {met.map((req, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-green-700">{req}</span>
            </li>
          ))}
          {unmet.map((req, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <span className="text-amber-700">{req}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}