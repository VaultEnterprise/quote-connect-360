import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, MapPin, BarChart2, History, Lock, TrendingUp, ShieldCheck, Database, Table2, Zap, ExternalLink } from "lucide-react";
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
  const urlParams = new URLSearchParams(window.location.search);
  const planIdFromUrl = urlParams.get("plan_id");
  const [selectedPlanId, setSelectedPlanId] = useState(planIdFromUrl || "");
  const [selectedState, setSelectedState] = useState("CA");

  const { data: plans = [] } = useQuery({
    queryKey: ["benefit-plans"],
    queryFn: () => base44.entities.BenefitPlan.filter({ status: "active" }),
  });

  const { data: stateRates = [] } = useQuery({
    queryKey: ["plan-rates-by-state", selectedPlanId],
    queryFn: () => base44.entities.PlanRateByState.filter({ plan_id: selectedPlanId }),
    enabled: !!selectedPlanId,
  });

  const { data: allSchedules = [] } = useQuery({
    queryKey: ["plan-rate-schedules"],
    queryFn: () => base44.entities.PlanRateSchedule.list("-created_date", 100),
  });

  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const planSchedules = allSchedules.filter(s => s.plan_id === selectedPlanId);
  const selectedStateRate = stateRates.find(r => r.state === selectedState);

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
          </div>
          <h1 className="text-2xl font-bold">Rate Editor</h1>
          <p className="text-muted-foreground text-sm">Multi-state rate tables, age-banded schedules, and rate lifecycle management</p>
        </div>
      </div>

      {/* Plan Selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 max-w-xs">
          <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
            <SelectTrigger><SelectValue placeholder="Select a plan..." /></SelectTrigger>
            <SelectContent>
              {plans.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.plan_name} — {p.carrier}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedPlan && (
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">{selectedPlan.plan_type?.toUpperCase()}</Badge>
            <Badge variant="outline">{selectedPlan.network_type}</Badge>
            <Badge className="bg-blue-100 text-blue-700">{stateRates.length} states configured</Badge>
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
            <TabsTrigger value="schedules" className="gap-1"><Database className="w-3.5 h-3.5" />Rate Schedules{planSchedules.length > 0 && <Badge className="ml-1 h-4 px-1 text-[10px]">{planSchedules.length}</Badge>}</TabsTrigger>
            <TabsTrigger value="rates" className="gap-1"><Table2 className="w-3.5 h-3.5" />Rate Detail Grid</TabsTrigger>
            <TabsTrigger value="validate" className="gap-1"><ShieldCheck className="w-3.5 h-3.5" />Validation</TabsTrigger>
            <TabsTrigger value="composite" className="gap-1"><MapPin className="w-3.5 h-3.5" />Legacy: Multi-State</TabsTrigger>
            <TabsTrigger value="agebanded" className="gap-1"><BarChart2 className="w-3.5 h-3.5" />Legacy: Age-Banded</TabsTrigger>
            <TabsTrigger value="history" className="gap-1"><History className="w-3.5 h-3.5" />Version History</TabsTrigger>
            <TabsTrigger value="renewal" className="gap-1"><TrendingUp className="w-3.5 h-3.5" />Projections</TabsTrigger>
            <TabsTrigger value="workflow" className="gap-1"><ShieldCheck className="w-3.5 h-3.5" />Workflow</TabsTrigger>
          </TabsList>

          <TabsContent value="schedules" className="mt-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Rate schedules for <strong>{selectedPlan?.plan_name}</strong> — versioned wrappers for normalized rate rows</p>
              <Link to="/plan-rating"><Button size="sm" variant="outline" className="h-7 text-xs gap-1"><ExternalLink className="w-3 h-3" />Full Rating Engine</Button></Link>
            </div>
            <RateScheduleManager plans={plans} schedules={planSchedules} />
          </TabsContent>

          <TabsContent value="rates" className="mt-4">
            <div className="mb-3">
              <p className="text-xs text-muted-foreground">Normalized rate rows for <strong>{selectedPlan?.plan_name}</strong> grouped by rating area. Select a schedule below.</p>
            </div>
            <RateDetailGrid plans={plans} schedules={planSchedules} />
          </TabsContent>

          <TabsContent value="validate" className="mt-4">
            <div className="mb-3">
              <p className="text-xs text-muted-foreground">Validate a rate schedule and test resolvers (ZIP → Area, DOB → Age Band, Tier normalization, Rate spot-check)</p>
            </div>
            <RateValidationConsole schedules={planSchedules} />
          </TabsContent>

          <TabsContent value="composite" className="mt-4">
            <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">⚠️ Legacy: uses PlanRateByState. New plans should use the Rate Schedules + Rate Detail Grid tabs above.</div>
            <MultiStateRateEditor planId={selectedPlanId} planName={selectedPlan?.plan_name} />
          </TabsContent>

          <TabsContent value="agebanded" className="mt-4 space-y-4">
            <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">⚠️ Legacy: uses AgeBandedRate. New plans should use the Rate Detail Grid tab above.</div>
            <div className="flex items-center gap-3">
              <p className="text-sm font-medium">Editing state:</p>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {stateRates.map(r => <SelectItem key={r.state} value={r.state}>{r.state}</SelectItem>)}
                </SelectContent>
              </Select>
              {stateRates.length === 0 && <p className="text-xs text-muted-foreground">Add state rates in the "Multi-State Rates" tab first</p>}
            </div>
            {selectedStateRate && (
              <AgeBandedRateEditor planId={selectedPlanId} rateStateId={selectedStateRate.id} state={selectedState} />
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