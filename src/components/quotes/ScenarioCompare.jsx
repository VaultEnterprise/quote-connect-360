import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Check, X, TrendingDown, TrendingUp, ChevronDown, ChevronUp, Sliders } from "lucide-react";
import CostModelingSlider from "./CostModelingSlider";

const PRODUCT_COLORS = {
  medical: "bg-blue-100 text-blue-700",
  dental: "bg-emerald-100 text-emerald-700",
  vision: "bg-purple-100 text-purple-700",
  life: "bg-amber-100 text-amber-700",
  std: "bg-orange-100 text-orange-700",
  ltd: "bg-red-100 text-red-700",
  accident: "bg-pink-100 text-pink-700",
  critical_illness: "bg-rose-100 text-rose-700",
};

function getBestIdx(scenarios, getValue, lowerIsBetter = true) {
  const vals = scenarios.map(s => getValue(s));
  const nums = vals.map(v => (typeof v === "number" && v > 0 ? v : null));
  if (nums.every(n => n === null)) return -1;
  const valid = nums.filter(n => n !== null);
  const target = lowerIsBetter ? Math.min(...valid) : Math.max(...valid);
  return nums.indexOf(target);
}

function fmt$(n) { return n ? `$${Number(n).toLocaleString()}` : "—"; }
function fmtPct(n) { return n != null ? `${n}%` : "—"; }

// Scenario-level rows
const SCENARIO_ROWS = [
  { label: "Status", render: s => <span className="capitalize">{s.status}</span> },
  { label: "Products", render: s => (
    <div className="flex flex-wrap gap-1">
      {(s.products_included || []).map(p => (
        <span key={p} className={`text-[9px] px-1.5 py-0.5 rounded font-medium capitalize ${PRODUCT_COLORS[p] || "bg-gray-100 text-gray-700"}`}>
          {p.replace(/_/g, " ")}
        </span>
      ))}
    </div>
  )},
  { label: "Carriers", render: s => (s.carriers_included || []).join(", ") || "—" },
  { label: "Total Monthly", render: s => fmt$(s.total_monthly_premium), bestFn: s => s.total_monthly_premium, lowerIsBetter: true },
  { label: "Employer Cost/mo", render: s => fmt$(s.employer_monthly_cost), bestFn: s => s.employer_monthly_cost, lowerIsBetter: true },
  { label: "Avg EE Cost/mo", render: s => fmt$(s.employee_monthly_cost_avg), bestFn: s => s.employee_monthly_cost_avg, lowerIsBetter: true },
  { label: "ER Contrib (EE)", render: s => s.employer_contribution_ee != null ? `${s.employer_contribution_ee}${s.contribution_strategy === "percentage" ? "%" : "$"}` : "—", bestFn: s => s.employer_contribution_ee, lowerIsBetter: false },
  { label: "Plan Count", render: s => s.plan_count || "—" },
  { label: "Rec. Score", render: s => s.recommendation_score != null ? (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden w-16">
        <div className="h-full rounded-full bg-primary" style={{ width: `${s.recommendation_score}%` }} />
      </div>
      <span>{s.recommendation_score}</span>
    </div>
  ) : "—", bestFn: s => s.recommendation_score, lowerIsBetter: false },
  { label: "Recommended", render: s => s.is_recommended ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-muted-foreground" /> },
];

// Plan-level comparison row definition
const PLAN_ROWS = [
  { label: "Type", render: p => p.plan_type ? <Badge className={`text-[9px] ${PRODUCT_COLORS[p.plan_type] || "bg-gray-100 text-gray-700"}`}>{p.plan_type.toUpperCase()}</Badge> : "—" },
  { label: "Network", render: p => p.network_type || "—" },
  { label: "Carrier", render: p => p.carrier || "—" },
  { label: "Deductible (Ind)", render: p => fmt$(p.deductible_individual), bestFn: p => p.deductible_individual, lowerIsBetter: true },
  { label: "Deductible (Fam)", render: p => fmt$(p.deductible_family), bestFn: p => p.deductible_family, lowerIsBetter: true },
  { label: "OOP Max (Ind)", render: p => fmt$(p.oop_max_individual), bestFn: p => p.oop_max_individual, lowerIsBetter: true },
  { label: "OOP Max (Fam)", render: p => fmt$(p.oop_max_family), bestFn: p => p.oop_max_family, lowerIsBetter: true },
  { label: "PCP Copay", render: p => fmt$(p.copay_pcp), bestFn: p => p.copay_pcp, lowerIsBetter: true },
  { label: "Specialist Copay", render: p => fmt$(p.copay_specialist), bestFn: p => p.copay_specialist, lowerIsBetter: true },
  { label: "ER Copay", render: p => fmt$(p.copay_er), bestFn: p => p.copay_er, lowerIsBetter: true },
  { label: "Coinsurance", render: p => fmtPct(p.coinsurance), bestFn: p => p.coinsurance, lowerIsBetter: false },
  { label: "Rx Tier 1", render: p => fmt$(p.rx_tier1), bestFn: p => p.rx_tier1, lowerIsBetter: true },
  { label: "Rx Tier 2", render: p => fmt$(p.rx_tier2), bestFn: p => p.rx_tier2, lowerIsBetter: true },
  { label: "HSA Eligible", render: p => p.hsa_eligible ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-muted-foreground" /> },
];

function PlanComparisonSection({ scenarios }) {
  // For each scenario, load ScenarioPlan → BenefitPlan data
  const planQueries = scenarios.map(s =>
    useQuery({
      queryKey: ["scenario-plans-full", s.id],
      queryFn: async () => {
        const sps = await base44.entities.ScenarioPlan.filter({ scenario_id: s.id });
        const plans = await Promise.all(
          sps.map(sp => base44.entities.BenefitPlan.filter({ id: sp.plan_id }).then(r => r[0]).catch(() => null))
        );
        return sps.map((sp, i) => ({ sp, plan: plans[i] })).filter(x => x.plan);
      },
    })
  );

  const loading = planQueries.some(q => q.isLoading);
  if (loading) return <div className="p-4 text-xs text-muted-foreground">Loading plan details…</div>;

  // Get all unique plan types across scenarios
  const allTypes = [...new Set(
    planQueries.flatMap(q => (q.data || []).map(x => x.plan?.plan_type).filter(Boolean))
  )];

  if (allTypes.length === 0) {
    return <div className="p-4 text-xs text-muted-foreground italic">No plans attached to these scenarios yet.</div>;
  }

  return (
    <div className="space-y-4">
      {allTypes.map(type => {
        // Get the first plan of this type per scenario
        const plansByScenario = scenarios.map((_s, i) =>
          (planQueries[i].data || []).find(x => x.plan?.plan_type === type)?.plan || null
        );

        if (plansByScenario.every(p => p === null)) return null;

        return (
          <div key={type}>
            <div className="px-3 py-1.5 bg-muted/60 border-b border-t">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${PRODUCT_COLORS[type] || "bg-gray-100 text-gray-700"}`}>
                {type.toUpperCase()} PLANS
              </span>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {PLAN_ROWS.map((row, i) => {
                  const bestIdx = row.bestFn
                    ? getBestIdx(plansByScenario.filter(Boolean), row.bestFn, row.lowerIsBetter !== false)
                    : -1;
                  // re-align bestIdx to include nulls
                  let adjustedBest = -1;
                  if (bestIdx >= 0) {
                    const nonNullIdxs = plansByScenario.map((p, idx) => p ? idx : null).filter(x => x !== null);
                    adjustedBest = nonNullIdxs[bestIdx] ?? -1;
                  }

                  return (
                    <tr key={row.label} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                      <td className="p-2.5 text-xs text-muted-foreground font-medium w-40">{row.label}</td>
                      {scenarios.map((s, idx) => {
                        const plan = plansByScenario[idx];
                        const isBest = adjustedBest === idx && row.bestFn;
                        return (
                          <td key={s.id} className={`p-2.5 text-xs min-w-40 ${isBest ? "font-semibold text-green-700 bg-green-50/50" : ""}`}>
                            <div className="flex items-center gap-1">
                              {plan ? row.render(plan) : <span className="text-muted-foreground/40">—</span>}
                              {isBest && (row.lowerIsBetter !== false ? <TrendingDown className="w-3 h-3 text-green-600" /> : <TrendingUp className="w-3 h-3 text-green-600" />)}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

export default function ScenarioCompare({ scenarios, onClose }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [showCostModeling, setShowCostModeling] = useState(false);

  if (!scenarios || scenarios.length < 2) return null;
  const display = scenarios.slice(0, 4);

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "plans", label: "Plan Details" },
  ];

  return (
    <div className="border rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-muted/50 px-4 py-2.5 flex items-center justify-between border-b">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold">Scenario Comparison</span>
          <Badge variant="outline" className="text-[10px]">{display.length} scenarios</Badge>
          {/* Tabs */}
          <div className="flex items-center border rounded-md overflow-hidden ml-2">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-3 py-1 text-xs font-medium transition-colors ${activeTab === t.id ? "bg-primary text-white" : "hover:bg-muted"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCostModeling(v => !v)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-md border transition-colors ${showCostModeling ? "bg-primary text-white border-primary" : "hover:bg-muted border-input"}`}
          >
            <Sliders className="w-3 h-3" /> Cost Modeling
          </button>
          {onClose && (
            <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Clear comparison
            </button>
          )}
        </div>
      </div>

      {/* Cost Modeling Panel */}
      {showCostModeling && (
        <div className="border-b bg-card">
          <CostModelingSlider scenarios={display} />
        </div>
      )}

      {/* Scenario Name Headers */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-card border-b">
              <th className="text-left p-3 text-xs font-medium text-muted-foreground w-40">
                {activeTab === "overview" ? "Attribute" : "Detail"}
              </th>
              {display.map(s => (
                <th key={s.id} className="text-left p-3 text-xs font-medium min-w-40">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {s.is_recommended && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                    <span className="font-semibold">{s.name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {activeTab === "overview" && (
            <tbody>
              {SCENARIO_ROWS.map((row, i) => {
                const bestIdx = row.bestFn ? getBestIdx(display, row.bestFn, row.lowerIsBetter !== false) : -1;
                return (
                  <tr key={row.label} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                    <td className="p-3 text-xs text-muted-foreground font-medium">{row.label}</td>
                    {display.map((s, idx) => (
                      <td key={s.id} className={`p-3 text-xs ${bestIdx === idx ? "font-semibold text-green-700 bg-green-50/50" : ""}`}>
                        <div className="flex items-center gap-1.5">
                          {row.render(s)}
                          {bestIdx === idx && row.bestFn && (
                            row.lowerIsBetter !== false
                              ? <TrendingDown className="w-3 h-3 text-green-600 flex-shrink-0" />
                              : <TrendingUp className="w-3 h-3 text-green-600 flex-shrink-0" />
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          )}
        </table>

        {/* Plan Details Tab */}
        {activeTab === "plans" && (
          <PlanComparisonSection scenarios={display} />
        )}
      </div>
    </div>
  );
}