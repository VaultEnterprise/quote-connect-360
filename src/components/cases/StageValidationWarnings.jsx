import React from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getStageRequirements } from "@/components/cases/caseWorkflow";

export default function StageValidationWarnings({ nextStage, workflowContext }) {
  const requirements = getStageRequirements(nextStage, workflowContext || {});
  if (!nextStage || requirements.length === 0) return null;

  const met = requirements.filter((item) => item.met);
  const unmet = requirements.filter((item) => !item.met);
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
              {canProceed ? `Ready to advance to ${nextStage.replace(/_/g, " ")}` : `Requirements to advance`}
            </p>
          </div>
        </div>

        <ul className="space-y-2">
          {met.map((item) => (
            <li key={item.label} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-green-700">{item.label}</span>
            </li>
          ))}
          {unmet.map((item) => (
            <li key={item.label} className="flex items-start gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <span className="text-amber-700">{item.label}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}