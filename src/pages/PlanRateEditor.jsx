import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, MapPin, BarChart2, History, Lock, TrendingUp, ShieldCheck, Database, Table2, FileCheck } from "lucide-react";
import { Link } from "react-router-dom";
import MultiStateRateEditor from "@/components/plans/MultiStateRateEditor";
import AgeBandedRateEditor from "@/components/plans/AgeBandedRateEditor";
import PlanVersioningPanel from "@/components/plans/PlanVersioningPanel";
import RenewalProjectionEngine from "@/components/plans/RenewalProjectionEngine";
import PlanApprovalWorkflow from "@/components/plans/PlanApprovalWorkflow";
import RateScheduleManager from "@/components/plans/RateScheduleManager";
import RateDetailGrid from "@/components/plans/RateDetailGrid";
import RateValidationConsole from "@/components/plans/RateValidationConsole";
import { format, differenceInDays } from "date-fns";

export default function PlanRateEditor() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const planIdFromUrl = urlParams.get("plan_id");
  const [selectedPlanId, setSelectedPlanId] = useState(planIdFromUrl || "");

  useEffect(() => {
    const nextUrl = new URL(window.location.href);
    if (selectedPlanId) nextUrl.searchParams.set("plan_id", selectedPlanId);
    else nextUrl.searchParams.delete("plan_id");
    window.history.replaceState({}, "", nextUrl.toString());
  }, [selectedPlanId]);

  useEffect(() => {
    const unsubscribers = [
      base44.entities.BenefitPlan.subscribe(() => queryClient.invalidateQueries({ queryKey: ["benefit-plans"] })),
      base44.entities.PlanRateSchedule.subscribe(() => queryClient.invalidateQueries({ queryKey: ["plan-rate-schedules"] })),
      base44.entities.PlanRateByState.subscribe(() => queryClient.invalidateQueries({ queryKey: ["plan-rates-by-state"] })),
      base44.entities.PlanRateDetail.subscribe(() => queryClient.invalidateQueries({ queryKey: ["plan-rate-schedules"] })),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [queryClient]);

  const { data: allPlans = [] } = useQuery({
    queryKey: ["benefit-plans"],
    queryFn: () => base44.entities.BenefitPlan.list("-created_date", 500),
  });

  const { data: allSchedules = [] } = useQuery({
    queryKey: ["plan-rate-schedules"],
    queryFn: () => base44.entities.PlanRateSchedule.list("-created_date", 200),
  });

  // Old composite rates — still used for rate-lock alerts only
  const { data: stateRates = [] } = useQuery({
    queryKey: ["plan-rates-by-state", selectedPlanId],
    queryFn: () => base44.entities.PlanRateByState.filter({ plan_id: selectedPlanId }),
    enabled: !!selectedPlanId,
  });

  const plans = allPlans.filter((plan) => plan.status === "active");
  const medicalPlans = plans.filter((plan) => plan.plan_type === "medical");
  const ancillaryPlans = plans.filter((plan) => plan.plan_type !== "medical");
  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const planSchedules = allSchedules.filter(s => s.plan_id === selectedPlanId);
  const lockedRates = stateRates.filter(r => r.is_locked && r.lock_expiration_date);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/plans" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Plan Library
            </Link>
            <span className="text-muted-foreground text-sm">·</span>
            <Link to="/plan-rating" className="text-muted-foreground hover:text-foreground text-sm">Rating Engine</Link>
          </div>
          <h1 className="text-2xl font-bold">Rate Editor</h1>
          <p className="text-muted-foreground text-sm">Per-plan rate schedules, age-banded tables, lifecycle management, and compliance workflow</p>
        </div>
      </div>

      {/* Plan Selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 max-w-xs">
          <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
            <SelectTrigger><SelectValue placeholder="Select a policy..." /></SelectTrigger>
            <SelectContent>
              {medicalPlans.length > 0 && (
                <SelectGroup>
                  <SelectLabel>Medical Policies</SelectLabel>
                  {medicalPlans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.plan_name} — {p.carrier}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
              {medicalPlans.length > 0 && ancillaryPlans.length > 0 && <SelectSeparator />}
              {ancillaryPlans.length > 0 && (
                <SelectGroup>
                  <SelectLabel>Ancillary Policies</SelectLabel>
                  {ancillaryPlans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.plan_name} — {p.carrier}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
            </SelectContent>
          </Select>
        </div>
        {selectedPlan && (
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">{selectedPlan.plan_type?.toUpperCase()}</Badge>
            <Badge variant="outline">{selectedPlan.network_type || selectedPlan.market_segment}</Badge>
            <Badge className="bg-blue-100 text-blue-700">{planSchedules.length} schedule(s)</Badge>
            <Badge className="bg-slate-100 text-slate-700">{stateRates.length} composite states</Badge>
          </div>
        )}
      </div>

      {/* Rate Lock Alerts */}
      {lockedRates.map(r => {
        const daysLeft = differenceInDays(new Date(r.lock_expiration_date), new Date());
        return (
          <div key={r.id} className={`flex items-center gap-2 p-3 rounded-lg border text-sm ${daysLeft <= 7 ? "border-red-200 bg-red-50" : "border-blue-200 bg-blue-50"}`}>
            <Lock className={`w-4 h-4 ${daysLeft <= 7 ? "text-red-600" : "text-blue-600"}`} />
            <span className={daysLeft <= 7 ? "text-red-700" : "text-blue-700"}>
              <strong>{r.state}</strong> rates are locked — expires {format(new Date(r.lock_expiration_date), "MMM d, yyyy")} ({daysLeft} days)
            </span>
          </div>
        );
      })}

      {!selectedPlanId ? (
        <div className="text-center py-16 text-muted-foreground">
          <BarChart2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Select a plan to manage its rate tables</p>
          <p className="text-sm">Choose from the dropdown above</p>
        </div>
      ) : (
        <Tabs defaultValue="schedules">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="schedules"  className="gap-1"><Database className="w-3.5 h-3.5" />Rate Schedules</TabsTrigger>
            <TabsTrigger value="rates"      className="gap-1"><Table2 className="w-3.5 h-3.5" />Rate Detail Grid</TabsTrigger>
            <TabsTrigger value="validate"   className="gap-1"><FileCheck className="w-3.5 h-3.5" />Validation</TabsTrigger>
            <TabsTrigger value="composite"  className="gap-1"><MapPin className="w-3.5 h-3.5" />Multi-State (Legacy)</TabsTrigger>
            <TabsTrigger value="agebanded"  className="gap-1"><BarChart2 className="w-3.5 h-3.5" />Age-Banded</TabsTrigger>
            <TabsTrigger value="history"    className="gap-1"><History className="w-3.5 h-3.5" />Version History</TabsTrigger>
            <TabsTrigger value="renewal"    className="gap-1"><TrendingUp className="w-3.5 h-3.5" />Projections</TabsTrigger>
            <TabsTrigger value="workflow"   className="gap-1"><ShieldCheck className="w-3.5 h-3.5" />Workflow</TabsTrigger>
          </TabsList>

          {/* ── Rate Schedules (scoped to this plan) ── */}
          <TabsContent value="schedules" className="mt-4">
            <RateScheduleManager
              plans={plans}
              schedules={planSchedules}
              defaultPlanId={selectedPlanId}
            />
          </TabsContent>

          {/* ── Rate Detail Grid (scoped to this plan's schedules) ── */}
          <TabsContent value="rates" className="mt-4">
            <RateDetailGrid
              plans={plans}
              schedules={planSchedules}
            />
          </TabsContent>

          {/* ── Validation Console (scoped to this plan's schedules) ── */}
          <TabsContent value="validate" className="mt-4">
            <RateValidationConsole schedules={planSchedules} />
          </TabsContent>

          {/* ── Legacy multi-state composite rates ── */}
          <TabsContent value="composite" className="mt-4">
            <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              <strong>Legacy composite rates.</strong> New plans should use Rate Schedules + Rate Detail Grid above for full normalization, age-band support, and import audit trails.
            </div>
            <MultiStateRateEditor planId={selectedPlanId} planName={selectedPlan?.plan_name} />
          </TabsContent>

          {/* ── Age-Banded (legacy AgeBandedRate entity, per composite state) ── */}
          <TabsContent value="agebanded" className="mt-4 space-y-4">
            {stateRates.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                <BarChart2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No composite state rates configured for this plan.</p>
                <p className="text-xs mt-1">Add states in the Multi-State (Legacy) tab first, or use Rate Schedules + Rate Detail for the normalized age-band model.</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">Age-banded rates are stored per composite state record. Select a state to edit its age bands.</p>
                {stateRates.map(r => (
                  <div key={r.id}>
                    <p className="text-xs font-semibold mb-2">State: {r.state}</p>
                    <AgeBandedRateEditor planId={selectedPlanId} rateStateId={r.id} state={r.state} />
                  </div>
                ))}
              </>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <PlanVersioningPanel plan={selectedPlan} />
          </TabsContent>

          <TabsContent value="renewal" className="mt-4">
            <RenewalProjectionEngine planId={selectedPlanId} planName={selectedPlan?.plan_name} />
          </TabsContent>

          <TabsContent value="workflow" className="mt-4">
            <PlanApprovalWorkflow plan={selectedPlan} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}