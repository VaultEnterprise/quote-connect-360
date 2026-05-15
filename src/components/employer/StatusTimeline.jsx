import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Circle, Clock } from "lucide-react";

const STEPS = [
  { stage: ["draft"],                                        label: "Case Opened",            desc: "Your broker has opened a benefits case for your organization." },
  { stage: ["census_in_progress", "census_validated"],       label: "Employee Data Collected", desc: "Your employee census is being uploaded and validated." },
  { stage: ["ready_for_quote", "quoting"],                  label: "Quotes Requested",        desc: "Your broker is gathering plan options and pricing from carriers." },
  { stage: ["proposal_ready", "employer_review"],           label: "Proposal Ready for Review",desc: "A benefits proposal has been prepared. Your approval is needed." },
  { stage: ["approved_for_enrollment", "enrollment_open", "enrollment_complete"], label: "Enrollment", desc: "Employees are selecting their benefit plans." },
  { stage: ["install_in_progress"],                         label: "Plan Installation",       desc: "Selected plans are being activated with the carriers." },
  { stage: ["active"],                                      label: "Benefits Active",         desc: "Coverage is in effect. Your employees are enrolled." },
];

/**
 * StatusTimeline
 * Plain-English step-by-step visual of where the employer is in the process.
 *
 * Props:
 *   currentStage — string (BenefitCase.stage)
 */
export default function StatusTimeline({ currentStage }) {
  const currentStepIdx = STEPS.findIndex(s => s.stage.includes(currentStage));

  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Where You Are</p>
        <div className="space-y-0">
          {STEPS.map((step, i) => {
            const isComplete = i < currentStepIdx;
            const isCurrent  = i === currentStepIdx;
            const isPending  = i > currentStepIdx;

            return (
              <div key={i} className="flex gap-3">
                {/* Icon + connector line */}
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isComplete ? "bg-primary/10" : isCurrent ? "bg-primary" : "bg-muted"
                  }`}>
                    {isComplete
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                      : isCurrent
                      ? <Clock className="w-3.5 h-3.5 text-white" />
                      : <Circle className="w-3 h-3 text-muted-foreground/40" />
                    }
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`w-px flex-1 my-1 min-h-[1.5rem] ${isComplete ? "bg-primary/30" : "bg-border"}`} />
                  )}
                </div>

                {/* Label + desc */}
                <div className={`pb-4 ${i === STEPS.length - 1 ? "pb-0" : ""}`}>
                  <p className={`text-sm font-medium leading-tight ${
                    isCurrent ? "text-primary" : isComplete ? "text-foreground opacity-60" : "text-muted-foreground"
                  }`}>
                    {step.label}
                    {isCurrent && (
                      <span className="ml-2 text-[10px] font-semibold bg-primary text-white rounded-full px-2 py-0.5 align-middle">
                        Current
                      </span>
                    )}
                  </p>
                  {isCurrent && (
                    <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}