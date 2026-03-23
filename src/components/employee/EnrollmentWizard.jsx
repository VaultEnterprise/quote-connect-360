import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, ChevronRight, ChevronLeft, AlertCircle } from "lucide-react";
import { format } from "date-fns";

import EnrollmentDeadlineBanner from "./EnrollmentDeadlineBanner";
import DependentForm from "./DependentForm";
import PlanSelectionStep from "./PlanSelectionStep";
import PlanSelectionEnhanced from "./PlanSelectionEnhanced";
import PlanCompareModal from "./PlanCompareModal";
import ProviderSearch from "./ProviderSearch";
import EnrollmentConfirmation from "./EnrollmentConfirmation";
import HelpContactCard from "./HelpContactCard";
import DocuSignSigningPane from "./DocuSignSigningPane";
import EnrollmentStepTransition from "./EnrollmentStepTransition";

const ENROLLMENT_STEPS = [
  { id: "welcome",   label: "Welcome" },
  { id: "coverage",  label: "Coverage" },
  { id: "plans",     label: "Plans" },
  { id: "dependents",label: "Dependents" },
  { id: "review",    label: "Review" },
  { id: "signature", label: "Sign" },
];

const WAIVER_STEPS = [
  { id: "welcome",   label: "Welcome" },
  { id: "waiver",    label: "Reason" },
  { id: "review",    label: "Confirm" },
];

/**
 * EnrollmentWizard
 * Clean multi-step enrollment/waiver wizard with proper step dots, deadline, save & resume.
 *
 * Props:
 *   enrollmentWindow   — EnrollmentWindow
 *   user               — User
 *   activeEnrollment   — EmployeeEnrollment | null
 *   onComplete         — () => void
 *   onWaive            — () => void
 */
export default function EnrollmentWizard({
  enrollmentWindow,
  user,
  activeEnrollment,
  onComplete,
  onWaive,
}) {
  const queryClient = useQueryClient();
  const [isWaiving, setIsWaiving] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submittedEnrollment, setSubmittedEnrollment] = useState(null);

  // Enrollment data
  const [coverageTier, setCoverageTier] = useState("employee_only");
  const [selectedPlans, setSelectedPlans] = useState({}); // { plan_type: Plan }
  const [dependents, setDependents] = useState([]);
  const [waiverReason, setWaiverReason] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [comparePlans, setComparePlans] = useState(null);

  const steps = isWaiving ? WAIVER_STEPS : ENROLLMENT_STEPS;
  const currentStep = steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const completeEnrollment = useMutation({
    mutationFn: () =>
      base44.entities.EmployeeEnrollment.update(activeEnrollment.id, {
        status: isWaiving ? "waived" : "completed",
        coverage_tier: coverageTier,
        selected_plan_id: selectedPlans.medical?.id || Object.values(selectedPlans)[0]?.id,
        selected_plan_name: selectedPlans.medical?.plan_name || Object.values(selectedPlans)[0]?.plan_name,
        waiver_reason: isWaiving ? waiverReason : null,
        dependents,
        acknowledged_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      }),
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["my-enrollments"] });
      setSubmittedEnrollment(data);
      // Auto-trigger DocuSign envelope send (non-blocking — errors handled in pane)
      if (!isWaiving) {
        try {
          await base44.functions.invoke("sendDocuSignEnvelope", { enrollment_id: data?.id || activeEnrollment.id });
        } catch (_) {}
        // Advance to signature step instead of jumping straight to confirmation
        setCurrentStepIndex(steps.findIndex(s => s.id === "signature"));
      } else {
        setShowConfirmation(true);
      }
    },
  });

  const handleNext = () => {
    if (currentStep.id === "welcome" && isWaiving) {
      setCurrentStepIndex(1);
    } else if (currentStep.id === "coverage" && !selectedPlans.medical) {
      // Can't proceed without at least medical
    } else if (currentStep.id === "plans" && Object.keys(selectedPlans).length === 0) {
      // Can't proceed without plans
    } else {
      setCurrentStepIndex(Math.min(currentStepIndex + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    if (currentStep.id === "welcome" && isWaiving) {
      setIsWaiving(false);
      setCurrentStepIndex(0);
    } else {
      setCurrentStepIndex(Math.max(currentStepIndex - 1, 0));
    }
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlans(prev => ({ ...prev, [plan.plan_type]: plan }));
  };

  const canProceed = () => {
    if (currentStep.id === "coverage") return true; // Always can proceed, has default
    if (currentStep.id === "plans") return Object.keys(selectedPlans).length > 0;
    if (currentStep.id === "dependents") return true; // Optional
    if (currentStep.id === "waiver") return !!waiverReason;
    if (currentStep.id === "review") return acknowledged;
    return true;
  };

  if (showConfirmation) {
    return (
      <EnrollmentConfirmation
        enrollment={submittedEnrollment || activeEnrollment}
        isWaived={isWaiving}
        onDone={() => isWaiving ? onWaive() : onComplete()}
      />
    );
  }

  // Signing step — shown inline after review submission
  if (currentStep?.id === "signature" && !isWaiving) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 py-4 sm:py-6 px-4">
        {enrollmentWindow && <EnrollmentDeadlineBanner enrollmentWindow={enrollmentWindow} />}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {enrollmentWindow?.employer_name || "Enrollment"}
          </p>
          <h1 className="text-xl sm:text-2xl font-bold">Sign Your Enrollment Form</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            One last step — your signature is required to finalize your benefits.
          </p>
        </div>
        <DocuSignSigningPane
          enrollment={submittedEnrollment || activeEnrollment}
          onSigned={() => setShowConfirmation(true)}
          onSkip={() => setShowConfirmation(true)}
        />
      </div>
    );
  }

  return (
     <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-background">
       {/* Fixed header on mobile for better UX */}
       <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b">
         <div className="max-w-3xl mx-auto px-4 py-2 sm:py-3">
           {/* Progress bar */}
           <Progress value={progress} className="h-1 mb-2 sm:mb-3" />

           {/* Step indicator — collapsible on mobile */}
           <div className="flex items-center gap-1 overflow-x-auto -mx-4 px-4">
             {steps.map((step, i) => (
               <div key={step.id} className="flex items-center gap-0.5 sm:gap-1.5 flex-shrink-0">
                 <div
                   className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[9px] sm:text-xs font-semibold transition-all ${
                     i === currentStepIndex
                       ? "bg-primary text-white shadow-sm"
                       : i < currentStepIndex
                       ? "bg-green-100 text-green-700"
                       : "bg-muted text-muted-foreground"
                   }`}
                 >
                   {i < currentStepIndex ? "✓" : i + 1}
                 </div>
                 <span
                   className={`text-[9px] sm:text-xs font-medium whitespace-nowrap hidden sm:inline ${
                     i === currentStepIndex ? "text-foreground font-semibold" : "text-muted-foreground"
                   }`}
                 >
                   {step.label}
                 </span>
                 {i < steps.length - 1 && (
                   <div className={`w-0.5 sm:w-1 h-0.5 ${i < currentStepIndex ? "bg-green-100" : "bg-border"}`} />
                 )}
               </div>
             ))}
           </div>
         </div>
       </div>

       {/* Main content area — scrollable */}
       <div className="flex-1 overflow-y-auto">
         <div className="max-w-3xl mx-auto px-4 py-4 sm:py-6">
           {/* Deadline banner — always shown */}
           {enrollmentWindow && <EnrollmentDeadlineBanner enrollmentWindow={enrollmentWindow} />}

           {/* Enrollment context header — responsive */}
           <div className="space-y-1 mb-6">
             <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
               {enrollmentWindow?.employer_name || "Enrollment"}
             </p>
             <h1 className="text-lg sm:text-2xl font-bold">{isWaiving ? "Waive Coverage" : "Enroll in Benefits"}</h1>
             <p className="text-xs sm:text-sm text-muted-foreground">
               {isWaiving
                 ? "Let us know why you're declining coverage."
                 : `Complete your benefit elections by ${format(new Date(enrollmentWindow?.end_date || ""), "MMMM d, yyyy")}`}
             </p>
           </div>

      {/* Step content */}
      <EnrollmentStepTransition stepId={currentStep.id}>
        {/* Welcome step */}
        {currentStep.id === "welcome" && (
          <Card>
            <CardContent className="p-6 text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Welcome, {user?.full_name?.split(" ")[0]}!</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  {enrollmentWindow?.employer_name || "Your employer"} has opened benefits enrollment. You can elect medical, dental, vision, and voluntary benefits.
                </p>
              </div>

              {!isWaiving ? (
                <Button className="w-full" onClick={() => setCurrentStepIndex(1)}>
                  Start Enrollment <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button className="w-full bg-orange-500 hover:bg-orange-600" onClick={() => setCurrentStepIndex(1)}>
                  Continue <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}

              {!isWaiving && (
                <Button variant="outline" className="w-full" onClick={() => setIsWaiving(true)}>
                  I want to Waive Coverage
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Coverage tier step */}
        {currentStep.id === "coverage" && !isWaiving && (
          <Card>
            <CardHeader>
              <CardTitle>Who are you covering?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { value: "employee_only", label: "Employee Only", desc: "Just yourself" },
                { value: "employee_spouse", label: "Employee + Spouse", desc: "You and your spouse/domestic partner" },
                { value: "employee_children", label: "Employee + Children", desc: "You and your dependent children" },
                { value: "family", label: "Family", desc: "You, spouse, and children" },
              ].map(tier => (
                <button
                  key={tier.value}
                  onClick={() => setCoverageTier(tier.value)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all ${
                    coverageTier === tier.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                  }`}
                >
                  <div>
                    <p className="font-semibold text-sm">{tier.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{tier.desc}</p>
                  </div>
                  {coverageTier === tier.value && <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />}
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Plans step - Enhanced UX */}
         {currentStep.id === "plans" && !isWaiving && (
           <div className="space-y-6">
             {/* Using enhanced plan selection with better comparison UX */}
             <PlanSelectionEnhanced
               plans={{
                 medical: [], // Will be populated from scenario data
                 dental: [],
                 vision: [],
               }}
               selectedPlans={selectedPlans}
               onSelect={handleSelectPlan}
               onCompare={(plan) => {
                 setComparePlans({ plan1: selectedPlans[plan.plan_type], plan2: plan });
                 setCompareMode(true);
               }}
               effectiveDate={enrollmentWindow?.effective_date}
             />

             {/* HSA tip */}
             {selectedPlans.medical?.hsa_eligible && (
               <Card className="border-green-200 bg-green-50">
                 <CardContent className="p-3">
                   <p className="text-sm font-semibold text-green-800">💡 HSA Eligible Plan Selected</p>
                   <p className="text-xs text-green-700 mt-1">
                     This HDHP qualifies you for a Health Savings Account (HSA). In 2026, you can contribute up to $4,300 (individual) or $8,550 (family) pre-tax. Funds roll over year to year.
                   </p>
                 </CardContent>
               </Card>
             )}

             {/* Provider search */}
             {selectedPlans.medical && (
               <Card>
                 <CardContent className="p-4 space-y-3">
                   <p className="text-sm font-semibold">Check If Your Doctor Is In-Network</p>
                   <ProviderSearch plan={selectedPlans.medical} />
                 </CardContent>
               </Card>
             )}

             {compareMode && comparePlans && (
               <PlanCompareModal
                 plan1={comparePlans.plan1}
                 plan2={comparePlans.plan2}
                 onClose={() => setCompareMode(false)}
                 onSelectPlan={(plan) => { handleSelectPlan(plan); setCompareMode(false); }}
               />
             )}
           </div>
         )}

        {/* Dependents step */}
        {currentStep.id === "dependents" && !isWaiving && (
          <Card>
            <CardHeader>
              <CardTitle>Add Dependents</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Required for Employee + Spouse, Employee + Children, or Family coverage
              </p>
            </CardHeader>
            <CardContent>
              <DependentForm
                dependents={dependents}
                onAdd={(dep) => setDependents([...dependents, dep])}
                onRemove={(i) => setDependents(dependents.filter((_, j) => j !== i))}
                canAddMore={dependents.length < 10 && coverageTier !== "employee_only"}
                disabled={coverageTier === "employee_only"}
              />
              {coverageTier === "employee_only" && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Employee Only coverage selected — no dependents needed.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Waiver reason step */}
        {currentStep.id === "waiver" && isWaiving && (
          <Card>
            <CardHeader>
              <CardTitle>Why are you waiving coverage?</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Please let us know the reason for declining coverage.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={waiverReason} onValueChange={setWaiverReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="covered_spouse">Covered under spouse's plan</SelectItem>
                  <SelectItem value="covered_parent">Covered under parent's plan</SelectItem>
                  <SelectItem value="medicare_medicaid">Medicare/Medicaid</SelectItem>
                  <SelectItem value="other_employer">Other employer coverage</SelectItem>
                  <SelectItem value="decline">Decline coverage</SelectItem>
                </SelectContent>
              </Select>
              <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
                <p className="text-xs text-orange-700">
                  <strong>Note:</strong> Waiving coverage means you decline benefits for the upcoming plan year. You may lose eligibility for tax-advantaged benefits. You can re-enroll if there's a qualifying life event.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Review step */}
        {currentStep.id === "review" && (
          <Card>
            <CardHeader>
              <CardTitle>{isWaiving ? "Confirm Waiver" : "Review Your Elections"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isWaiving ? (
                <>
                  <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
                    <p className="font-semibold text-orange-800">Waiving Coverage</p>
                    <p className="text-sm text-orange-700 mt-1">
                      Reason: {waiverReason?.replace(/_/g, " ")}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-xs text-red-700">
                      <strong>Important:</strong> By confirming this waiver, you will not have coverage under this plan for the upcoming year. This action cannot be undone unless you experience a qualifying life event.
                    </p>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  {coverageTier && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                      <span className="text-sm text-muted-foreground">Coverage Tier</span>
                      <span className="text-sm font-medium capitalize">{coverageTier?.replace(/_/g, " ")}</span>
                    </div>
                  )}
                  {Object.values(selectedPlans).map(plan => (
                    <div key={plan.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                      <span className="text-sm text-muted-foreground capitalize">{plan.plan_type}</span>
                      <div className="text-right">
                        <p className="text-sm font-medium">{plan.plan_name}</p>
                        <p className="text-xs text-muted-foreground">{plan.carrier}</p>
                      </div>
                    </div>
                  ))}
                  {dependents.length > 0 && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                      <span className="text-sm text-muted-foreground">Dependents</span>
                      <span className="text-sm font-medium">{dependents.length} added</span>
                    </div>
                  )}
                  {/* Paycheck impact callout */}
                  {Object.values(selectedPlans).length > 0 && (
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="text-xs font-semibold text-primary mb-1">Estimated Paycheck Impact</p>
                      <p className="text-xs text-muted-foreground">
                        Your exact deduction will be confirmed by your employer. Review your first paycheck after your effective date. Contact HR with any discrepancies.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-start gap-3 p-3 rounded-lg border border-primary/20 bg-primary/5">
                <Switch checked={acknowledged} onCheckedChange={setAcknowledged} />
                <Label className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                  I acknowledge that my benefit elections are accurate and understand that changes may not be permitted outside of a qualifying life event.
                </Label>
              </div>
            </CardContent>
          </Card>
        )}
        </EnrollmentStepTransition>

        {/* Help card */}
        <HelpContactCard />

      {/* Navigation buttons — responsive */}
       <div className="flex gap-2 sm:gap-3">
         <Button
           variant="outline"
           className="flex-1 text-xs sm:text-sm"
           onClick={handleBack}
           disabled={currentStepIndex === 0}
         >
           <ChevronLeft className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-0.5 sm:mr-1" /> 
           <span className="hidden sm:inline">Back</span>
         </Button>
         <Button
           className="flex-1 text-xs sm:text-sm"
           onClick={currentStep.id === "review" ? () => completeEnrollment.mutate() : handleNext}
           disabled={!canProceed() || completeEnrollment.isPending}
         >
           {currentStep.id === "review" ? (
             completeEnrollment.isPending ? "Submitting..." : isWaiving ? "Confirm Waiver" : "Submit & Sign"
           ) : (
             <>
               <span className="hidden sm:inline">Next</span>
               <ChevronRight className="w-3.5 sm:w-4 h-3.5 sm:h-4 sm:ml-1" />
             </>
           )}
         </Button>
       </div>
    </div>
  );
}