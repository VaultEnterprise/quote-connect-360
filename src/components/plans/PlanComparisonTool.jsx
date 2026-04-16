import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";

export default function PlanComparisonTool({ plans, medical = false }) {
  const [selected, setSelected] = useState([]);

  const togglePlan = (planId) => {
    setSelected(prev => prev.includes(planId) ? prev.filter(id => id !== planId) : [...prev.slice(-1), planId]);
  };

  const selectedPlans = plans.filter(p => selected.includes(p.id));

  if (selectedPlans.length === 0) {
    return (
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-6 text-center text-xs text-muted-foreground">
          Select up to 2 plans to compare side-by-side.
        </CardContent>
      </Card>
    );
  }

  const fields = medical
    ? [
      { label: "Network Type", key: "network_type" },
      { label: "Deductible (Ind.)", key: "deductible_individual", format: v => v ? `$${v.toLocaleString()}` : "—" },
      { label: "Deductible (Fam.)", key: "deductible_family", format: v => v ? `$${v.toLocaleString()}` : "—" },
      { label: "OOP Max (Ind.)", key: "oop_max_individual", format: v => v ? `$${v.toLocaleString()}` : "—" },
      { label: "OOP Max (Fam.)", key: "oop_max_family", format: v => v ? `$${v.toLocaleString()}` : "—" },
      { label: "PCP Copay", key: "copay_pcp", format: v => v ? `$${v}` : "—" },
      { label: "Specialist Copay", key: "copay_specialist", format: v => v ? `$${v}` : "—" },
      { label: "ER Copay", key: "copay_er", format: v => v ? `$${v}` : "—" },
      { label: "Coinsurance", key: "coinsurance", format: v => v ? `${v}%` : "—" },
      { label: "HSA Eligible", key: "hsa_eligible", format: v => v ? "Yes" : "No" },
    ]
    : [
      { label: "Carrier", key: "carrier" },
      { label: "Plan Code", key: "plan_code" },
    ];

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
                    <button onClick={() => togglePlan(p.id)} className="text-muted-foreground hover:text-foreground">
                      <X className="w-3 h-3" />
                    </button>
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