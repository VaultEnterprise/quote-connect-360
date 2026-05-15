import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";

export default function PlanComparisonTool({ plans, medical = false, selectedPlanIds, enableSelection = true }) {
  const [selected, setSelected] = useState(selectedPlanIds || []);

  const togglePlan = (planId) => {
    if (!enableSelection) return;
    setSelected(prev => prev.includes(planId) ? prev.filter(id => id !== planId) : [...prev.slice(-1), planId]);
  };

  const selectedPlans = enableSelection
    ? plans.filter(p => selected.includes(p.id))
    : plans;

  if (selectedPlans.length === 0) {
    return (
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-6 text-center text-xs text-muted-foreground">
          Select up to 2 plans to compare side-by-side.
        </CardContent>
      </Card>
    );
  }

  const money = (value) => value === 0 || value ? `$${Number(value).toLocaleString()}` : "—";
  const percent = (value) => value === 0 || value ? `${value}%` : "—";
  const text = (value) => value || "—";
  const booleanLabel = (value) => value ? "Yes" : "No";

  const fields = [
    { label: "Plan Name", key: "plan_name", format: text },
    { label: "Plan Type", key: "plan_type", format: text },
    { label: "Carrier", key: "carrier", format: text },
    { label: "Plan Code", key: "plan_code", format: text },
    { label: "Network Type", key: "network_type", format: text },
    { label: "State", key: "state", format: text },
    { label: "Effective Date", key: "effective_date", format: text },
    { label: "Status", key: "status", format: text },
    { label: "Deductible (Ind.)", key: "deductible_individual", format: money },
    { label: "Deductible (Fam.)", key: "deductible_family", format: money },
    { label: "OOP Max (Ind.)", key: "oop_max_individual", format: money },
    { label: "OOP Max (Fam.)", key: "oop_max_family", format: money },
    { label: "PCP Copay", key: "copay_pcp", format: money },
    { label: "Specialist Copay", key: "copay_specialist", format: money },
    { label: "ER Copay", key: "copay_er", format: money },
    { label: "Coinsurance", key: "coinsurance", format: percent },
    { label: "Rx Tier 1", key: "rx_tier1", format: money },
    { label: "Rx Tier 2", key: "rx_tier2", format: money },
    { label: "Rx Tier 3", key: "rx_tier3", format: money },
    { label: "Rx Tier 4", key: "rx_tier4", format: money },
    { label: "HSA Eligible", key: "hsa_eligible", format: booleanLabel },
    { label: "Notes", key: "notes", format: text },
  ].filter((field) => medical || !["network_type", "deductible_individual", "deductible_family", "oop_max_individual", "oop_max_family", "copay_pcp", "copay_specialist", "copay_er", "coinsurance", "rx_tier1", "rx_tier2", "rx_tier3", "rx_tier4", "hsa_eligible"].includes(field.key));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Plan Comparison ({selectedPlans.length}/2)</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-2 font-semibold">Feature</th>
              {selectedPlans.map(p => (
                <th key={p.id} className="text-left p-2 font-semibold">
                  <div className="flex items-center gap-1 justify-between">
                    <div className="truncate">{p.plan_name}</div>
                    {enableSelection && (
                      <button onClick={() => togglePlan(p.id)} className="text-muted-foreground hover:text-foreground">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fields.map(field => (
              <tr key={field.key} className="border-b border-border last:border-0">
                <td className="p-2 font-medium text-muted-foreground">{field.label}</td>
                {selectedPlans.map(p => (
                  <td key={p.id} className="p-2">
                    {field.format ? field.format(p[field.key]) : p[field.key] || "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}