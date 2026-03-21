import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Heart, Shield, Eye, CheckCircle, Clock, User, Users,
  ChevronRight, AlertCircle, FileText, Star, DollarSign
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/AuthContext";

const PLAN_TYPE_ICONS = { medical: Heart, dental: Shield, vision: Eye };

const STEPS = ["welcome", "coverage", "plans", "dependents", "review", "confirm"];
const STEP_LABELS = ["Welcome", "Coverage Tier", "Choose Plans", "Dependents", "Review", "Complete"];

export default function EmployeePortal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [enrollment, setEnrollment] = useState(null);
  const [coverageTier, setCoverageTier] = useState("employee_only");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isWaiving, setIsWaiving] = useState(false);
  const [waiverReason, setWaiverReason] = useState("");
  const [dependents, setDependents] = useState([]);
  const [acknowledged, setAcknowledged] = useState(false);

  const { data: myEnrollments = [] } = useQuery({
    queryKey: ["my-enrollments", user?.email],
    queryFn: () => base44.entities.EmployeeEnrollment.filter({ employee_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: availablePlans = [] } = useQuery({
    queryKey: ["plans-active"],
    queryFn: () => base44.entities.BenefitPlan.filter({ status: "active" }, "-created_date", 50),
    enabled: step === 2,
  });

  const activeEnrollment = myEnrollments.find(e => e.status === "invited" || e.status === "started");
  const completedEnrollments = myEnrollments.filter(e => e.status === "completed" || e.status === "waived");

  const saveEnrollment = useMutation({
    mutationFn: (data) => activeEnrollment
      ? base44.entities.EmployeeEnrollment.update(activeEnrollment.id, data)
      : base44.entities.EmployeeEnrollment.create({ ...data, employee_email: user?.email, employee_name: user?.full_name }),
    onSuccess: (data) => {
      setEnrollment(data);
      queryClient.invalidateQueries({ queryKey: ["my-enrollments"] });
    },
  });

  const completeEnrollment = useMutation({
    mutationFn: () => base44.entities.EmployeeEnrollment.update(activeEnrollment?.id || enrollment?.id, {
      status: isWaiving ? "waived" : "completed",
      coverage_tier: coverageTier,
      selected_plan_id: selectedPlan?.id,
      selected_plan_name: selectedPlan?.plan_name,
      waiver_reason: isWaiving ? waiverReason : null,
      dependents,
      acknowledged_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["my-enrollments"] }); setStep(5); },
  });

  const medicalPlans = availablePlans.filter(p => p.plan_type === "medical");
  const progress = ((step + 1) / STEPS.length) * 100;

  if (!activeEnrollment && step === 0 && completedEnrollments.length > 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold">Your Benefits</h1>
          <p className="text-muted-foreground mt-1">Manage your benefit elections</p>
        </div>
        {completedEnrollments.map(e => (
          <Card key={e.id}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{e.employer_name || "Benefits Enrollment"}</p>
                  <p className="text-sm text-muted-foreground mt-0.5 capitalize">{e.status} • {e.coverage_tier?.replace(/_/g, " ")}</p>
                  {e.selected_plan_name && <p className="text-sm font-medium text-primary mt-1">{e.selected_plan_name}</p>}
                </div>
                <Badge className={e.status === "completed" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}>
                  {e.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!activeEnrollment && step === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
          <Heart className="w-8 h-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Employee Benefits Portal</h1>
        <p className="text-muted-foreground">No active enrollment window found for your account. Please contact your HR administrator.</p>
      </div>
    );
  }

  // Step 5: Complete
  if (step === 5) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-5">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold">{isWaiving ? "Waiver Submitted" : "Enrollment Complete!"}</h1>
        <p className="text-muted-foreground max-w-sm mx-auto">
          {isWaiving
            ? "Your waiver has been recorded. Contact HR if you change your mind during the enrollment window."
            : "Your benefit elections have been saved. You'll receive a confirmation email shortly."}
        </p>
        {!isWaiving && selectedPlan && (
          <Card className="text-left">
            <CardContent className="p-5 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Your Election</p>
              <p className="font-semibold">{selectedPlan.plan_name}</p>
              <p className="text-sm text-muted-foreground">{selectedPlan.carrier} • {selectedPlan.network_type} • {coverageTier?.replace(/_/g, " ")}</p>
              {dependents.length > 0 && <p className="text-sm text-muted-foreground">{dependents.length} dependent(s) added</p>}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6">
      {/* Progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{STEP_LABELS[step]}</span>
          <span className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length}</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between mt-1.5">
          {STEP_LABELS.map((label, i) => (
            <span key={i} className={`text-[10px] ${i === step ? "text-primary font-semibold" : i < step ? "text-primary/60" : "text-muted-foreground"}`}>{label}</span>
          ))}
        </div>
      </div>

      {/* Step 0: Welcome */}
      {step === 0 && (
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Welcome, {user?.full_name?.split(" ")[0]}!</h2>
              <p className="text-muted-foreground text-sm mt-1">{activeEnrollment?.employer_name || "Your employer"} has opened enrollment. You have until the enrollment window closes to make your elections.</p>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-left">
              <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <p className="text-xs text-amber-700">Enrollment window is open. Complete your elections before it closes.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setIsWaiving(true)}>I want to Waive Coverage</Button>
              <Button className="flex-1" onClick={() => { setIsWaiving(false); setStep(1); }}>Start Enrollment <ChevronRight className="w-4 h-4 ml-1" /></Button>
            </div>
            {isWaiving && (
              <div className="text-left space-y-3 border-t pt-4">
                <Label>Waiver Reason</Label>
                <Select value={waiverReason} onValueChange={setWaiverReason}>
                  <SelectTrigger><SelectValue placeholder="Select reason..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="covered_spouse">Covered under spouse's plan</SelectItem>
                    <SelectItem value="covered_parent">Covered under parent's plan</SelectItem>
                    <SelectItem value="medicare_medicaid">Medicare/Medicaid</SelectItem>
                    <SelectItem value="other_employer">Other employer coverage</SelectItem>
                    <SelectItem value="decline">Decline coverage</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="w-full bg-orange-500 hover:bg-orange-600" disabled={!waiverReason} onClick={() => { setStep(4); }}>
                  Continue with Waiver
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 1: Coverage Tier */}
      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>Who are you covering?</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { value: "employee_only", label: "Employee Only", desc: "Just yourself" },
              { value: "employee_spouse", label: "Employee + Spouse", desc: "You and your spouse/domestic partner" },
              { value: "employee_children", label: "Employee + Children", desc: "You and your dependent children" },
              { value: "family", label: "Family", desc: "You, spouse, and children" },
            ].map(tier => (
              <button key={tier.value} onClick={() => setCoverageTier(tier.value)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all ${coverageTier === tier.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                <div>
                  <p className="font-semibold text-sm">{tier.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{tier.desc}</p>
                </div>
                {coverageTier === tier.value && <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />}
              </button>
            ))}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(0)}>Back</Button>
              <Button className="flex-1" onClick={() => setStep(2)}>Next <ChevronRight className="w-4 h-4 ml-1" /></Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Choose Plan */}
      {step === 2 && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Choose Your Medical Plan</CardTitle></CardHeader>
          </Card>
          {medicalPlans.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">No plans available. Contact HR.</CardContent></Card>
          ) : (
            medicalPlans.map(plan => (
              <button key={plan.id} onClick={() => setSelectedPlan(plan)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedPlan?.id === plan.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{plan.plan_name}</p>
                      <Badge variant="outline" className="text-[10px]">{plan.network_type}</Badge>
                      {plan.hsa_eligible && <Badge className="bg-green-100 text-green-700 text-[10px]">HSA Eligible</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{plan.carrier}</p>
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {plan.deductible_individual && <div className="text-center"><p className="text-xs text-muted-foreground">Deductible</p><p className="text-sm font-semibold">${plan.deductible_individual.toLocaleString()}</p></div>}
                      {plan.copay_pcp && <div className="text-center"><p className="text-xs text-muted-foreground">PCP Copay</p><p className="text-sm font-semibold">${plan.copay_pcp}</p></div>}
                      {plan.oop_max_individual && <div className="text-center"><p className="text-xs text-muted-foreground">OOP Max</p><p className="text-sm font-semibold">${plan.oop_max_individual.toLocaleString()}</p></div>}
                    </div>
                  </div>
                  {selectedPlan?.id === plan.id && <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />}
                </div>
              </button>
            ))
          )}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
            <Button className="flex-1" disabled={!selectedPlan} onClick={() => setStep(3)}>Next <ChevronRight className="w-4 h-4 ml-1" /></Button>
          </div>
        </div>
      )}

      {/* Step 3: Dependents */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Add Dependents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dependents.map((dep, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm flex-1">{dep.name} ({dep.relationship})</span>
                <Button variant="ghost" size="sm" className="text-xs text-destructive h-6" onClick={() => setDependents(d => d.filter((_, j) => j !== i))}>Remove</Button>
              </div>
            ))}
            {(coverageTier === "employee_only" || dependents.length < 6) && coverageTier !== "employee_only" && (
              <Button variant="outline" size="sm" className="w-full" onClick={() => {
                const name = prompt("Dependent full name:");
                const rel = prompt("Relationship (spouse/child/domestic_partner):");
                if (name && rel) setDependents(d => [...d, { name, relationship: rel, date_of_birth: "" }]);
              }}>
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Dependent
              </Button>
            )}
            {coverageTier === "employee_only" && (
              <p className="text-sm text-muted-foreground text-center py-2">Employee Only coverage selected — no dependents needed.</p>
            )}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Back</Button>
              <Button className="flex-1" onClick={() => setStep(4)}>Review <ChevronRight className="w-4 h-4 ml-1" /></Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <Card>
          <CardHeader><CardTitle>{isWaiving ? "Review Waiver" : "Review Your Elections"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {isWaiving ? (
              <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
                <p className="font-semibold text-orange-800">Waiving Coverage</p>
                <p className="text-sm text-orange-700 mt-1">Reason: {waiverReason?.replace(/_/g, " ")}</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                    <span className="text-sm text-muted-foreground">Coverage Tier</span>
                    <span className="text-sm font-medium capitalize">{coverageTier?.replace(/_/g, " ")}</span>
                  </div>
                  {selectedPlan && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                      <span className="text-sm text-muted-foreground">Medical Plan</span>
                      <span className="text-sm font-medium">{selectedPlan.plan_name}</span>
                    </div>
                  )}
                  {dependents.length > 0 && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                      <span className="text-sm text-muted-foreground">Dependents</span>
                      <span className="text-sm font-medium">{dependents.length} added</span>
                    </div>
                  )}
                </div>
              </>
            )}
            <div className="flex items-start gap-3 p-3 rounded-lg border border-primary/20 bg-primary/5">
              <Switch checked={acknowledged} onCheckedChange={setAcknowledged} />
              <p className="text-xs text-muted-foreground leading-relaxed">I acknowledge that my benefit elections are accurate and I understand that changes may not be permitted outside of a qualifying life event.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(isWaiving ? 0 : 3)}>Back</Button>
              <Button className="flex-1" disabled={!acknowledged || completeEnrollment.isPending} onClick={() => completeEnrollment.mutate()}>
                <CheckCircle className="w-4 h-4 mr-2" />{completeEnrollment.isPending ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Plus({ className }) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5v14"/></svg>;
}