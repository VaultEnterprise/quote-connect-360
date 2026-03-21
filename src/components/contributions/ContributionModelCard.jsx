import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2, AlertCircle, AlertTriangle, Trash2, Calculator,
  DollarSign, Users, TrendingDown, TrendingUp, Copy, ChevronDown, ChevronUp
} from "lucide-react";

const ACA_THRESHOLD_PCT = 9.02;
const MEDIAN_INCOME = 60000;
const TIERS = [
  { key: "ee", label: "EE Only" },
  { key: "es", label: "EE + Spouse" },
  { key: "ec", label: "EE + Child(ren)" },
  { key: "fam", label: "Family" },
];

function computeModel(model) {
  const strategy = model.strategy || "percentage";
  const totalPremium = model.total_monthly_premium || 0;
  const eeCount = model.total_ee_count || 0;
  const avgPremiumPerEE = eeCount > 0 ? totalPremium / eeCount : 0;

  let employerMonthly = 0, employeeMonthly = 0;

  if (strategy === "percentage") {
    const eeContrib = (model.ee_contribution_pct ?? 80) / 100;
    const depContrib = (model.dep_contribution_pct ?? 50) / 100;
    // Simplified: use EE pct for all
    employerMonthly = avgPremiumPerEE * eeContrib * eeCount;
    employeeMonthly = avgPremiumPerEE * (1 - eeContrib) * eeCount;
  } else if (strategy === "flat_dollar") {
    const flat = model.ee_contribution_flat ?? 0;
    employerMonthly = flat * eeCount;
    employeeMonthly = Math.max(0, totalPremium - employerMonthly);
  } else if (strategy === "defined_contribution") {
    employerMonthly = (model.ee_contribution_flat ?? 0) * eeCount;
    employeeMonthly = Math.max(0, totalPremium - employerMonthly);
  }

  const avgEECost = eeCount > 0 ? employeeMonthly / eeCount : 0;
  const affordabilityMax = (MEDIAN_INCOME * (ACA_THRESHOLD_PCT / 100)) / 12;
  const acaSafe = avgEECost <= affordabilityMax;
  const acaPct = avgEECost > 0 ? ((avgEECost * 12) / MEDIAN_INCOME) * 100 : 0;
  const annualEmployerCost = employerMonthly * 12;
  const annualTotalPremium = totalPremium * 12;
  const employerSharePct = totalPremium > 0 ? (employerMonthly / totalPremium) * 100 : 0;

  return { employerMonthly, employeeMonthly, avgEECost, acaSafe, acaPct, annualEmployerCost, annualTotalPremium, employerSharePct, affordabilityMax };
}

export default function ContributionModelCard({ model, onDelete, scenarioName, caseName, compareMode }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(!compareMode);
  const [ee, setEe] = useState(model.ee_contribution_pct ?? 80);
  const [dep, setDep] = useState(model.dep_contribution_pct ?? 50);
  const [eeFlat, setEeFlat] = useState(model.ee_contribution_flat ?? 0);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setEe(model.ee_contribution_pct ?? 80);
    setDep(model.dep_contribution_pct ?? 50);
    setEeFlat(model.ee_contribution_flat ?? 0);
    setDirty(false);
  }, [model.id]);

  const strategy = model.strategy || "percentage";
  const isPercentage = strategy === "percentage";

  const liveModel = {
    ...model,
    ee_contribution_pct: ee,
    dep_contribution_pct: dep,
    ee_contribution_flat: eeFlat,
  };
  const metrics = computeModel(liveModel);

  const updateMutation = useMutation({
    mutationFn: () => base44.entities.ContributionModel.update(model.id, {
      ee_contribution_pct: ee,
      dep_contribution_pct: dep,
      ee_contribution_flat: eeFlat,
      total_monthly_employer_cost: metrics.employerMonthly,
      total_monthly_employee_cost: metrics.employeeMonthly,
      avg_employee_cost_ee_only: metrics.avgEECost,
      aca_affordability_flag: !metrics.acaSafe,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contribution-models"] });
      setDirty(false);
    },
  });

  const acaColor = metrics.acaSafe ? "text-emerald-600" : metrics.acaPct < 11 ? "text-amber-600" : "text-red-600";
  const acaBg   = metrics.acaSafe ? "bg-emerald-50 border-emerald-200" : metrics.acaPct < 11 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";

  return (
    <Card className={`border-2 transition-all ${dirty ? "border-primary/50 shadow-md" : "border-border hover:border-primary/20"}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{model.name}</p>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              {caseName && <Badge variant="outline" className="text-[10px]">{caseName}</Badge>}
              <Badge variant="secondary" className="text-[10px] capitalize">{strategy.replace(/_/g," ")}</Badge>
              {model.total_ee_count > 0 && <Badge variant="secondary" className="text-[10px]"><Users className="w-2.5 h-2.5 mr-1" />{model.total_ee_count} EEs</Badge>}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {metrics.acaSafe
              ? <Badge className="bg-emerald-100 text-emerald-700 text-[10px] border-0"><CheckCircle2 className="w-3 h-3 mr-1" />ACA ✓</Badge>
              : <Badge className="bg-red-100 text-red-700 text-[10px] border-0"><AlertCircle className="w-3 h-3 mr-1" />ACA Risk</Badge>}
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(model.id)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
            {compareMode && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(!expanded)}>
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* KPI row — always visible */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2.5 rounded-lg bg-primary/5 border border-primary/10">
            <p className="text-[10px] text-muted-foreground">Employer/mo</p>
            <p className="text-base font-bold text-primary">${metrics.employerMonthly.toLocaleString(undefined,{maximumFractionDigits:0})}</p>
          </div>
          <div className="text-center p-2.5 rounded-lg bg-muted">
            <p className="text-[10px] text-muted-foreground">Avg EE/mo</p>
            <p className="text-base font-bold">${metrics.avgEECost.toLocaleString(undefined,{maximumFractionDigits:0})}</p>
          </div>
          <div className={`text-center p-2.5 rounded-lg border ${acaBg}`}>
            <p className="text-[10px] text-muted-foreground">ACA %</p>
            <p className={`text-base font-bold ${acaColor}`}>{metrics.acaPct.toFixed(1)}%</p>
          </div>
        </div>

        {/* Expanded controls */}
        {expanded && (
          <>
            {isPercentage ? (
              <>
                {/* EE Slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs font-medium">Employer pays EE premium</Label>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number" min={0} max={100} value={ee}
                        onChange={e => { setEe(Number(e.target.value)); setDirty(true); }}
                        className="h-6 w-14 text-xs text-right p-1 font-bold text-primary"
                      />
                      <span className="text-xs text-primary font-bold">%</span>
                    </div>
                  </div>
                  <Slider value={[ee]} onValueChange={([v]) => { setEe(v); setDirty(true); }} min={0} max={100} step={1} />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>0%</span><span>50%</span><span>100%</span></div>
                </div>
                {/* Dep Slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs font-medium">Employer pays Dependent premium</Label>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number" min={0} max={100} value={dep}
                        onChange={e => { setDep(Number(e.target.value)); setDirty(true); }}
                        className="h-6 w-14 text-xs text-right p-1 font-bold text-primary"
                      />
                      <span className="text-xs text-primary font-bold">%</span>
                    </div>
                  </div>
                  <Slider value={[dep]} onValueChange={([v]) => { setDep(v); setDirty(true); }} min={0} max={100} step={1} />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>0%</span><span>50%</span><span>100%</span></div>
                </div>
              </>
            ) : (
              <div>
                <Label className="text-xs font-medium">Employer flat amount per EE/month</Label>
                <div className="relative mt-1.5">
                  <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    type="number" min={0} value={eeFlat}
                    onChange={e => { setEeFlat(Number(e.target.value)); setDirty(true); }}
                    className="pl-8"
                  />
                </div>
              </div>
            )}

            {/* ACA affordability detail */}
            <div className={`rounded-lg border p-3 ${acaBg}`}>
              <div className="flex items-start gap-2">
                {metrics.acaSafe
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  : <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />}
                <div>
                  <p className={`text-xs font-semibold ${acaColor}`}>
                    ACA Affordability — {metrics.acaPct.toFixed(2)}% of income
                    {metrics.acaSafe ? " ✓" : " — EXCEEDS threshold"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Threshold: {ACA_THRESHOLD_PCT}% · EE monthly max: ${metrics.affordabilityMax.toFixed(0)} · Current: ${metrics.avgEECost.toFixed(0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Extended metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs border-t pt-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Annual employer cost</span>
                <span className="font-semibold">${(metrics.annualEmployerCost/1000).toFixed(1)}k</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Employer share</span>
                <span className="font-semibold">{metrics.employerSharePct.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Annual total premium</span>
                <span className="font-semibold">${(metrics.annualTotalPremium/1000).toFixed(1)}k</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">EE annual cost</span>
                <span className="font-semibold">${(metrics.avgEECost * 12).toFixed(0)}</span>
              </div>
            </div>

            {model.notes && <p className="text-xs text-muted-foreground bg-muted rounded p-2">{model.notes}</p>}

            <Button
              size="sm" className="w-full" onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending || !dirty}
              variant={dirty ? "default" : "outline"}
            >
              <Calculator className="w-3.5 h-3.5 mr-1.5" />
              {updateMutation.isPending ? "Saving..." : dirty ? "Save Changes" : "Saved"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}