import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function PolicyMatchComparisonMatrix({ results }) {
  const [selectedIds, setSelectedIds] = useState(results.slice(0, 2).map((r) => r.id));

  const toggleResult = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev.slice(-2), id]);
  };

  const selectedResults = results.filter(r => selectedIds.includes(r.id));

  if (selectedResults.length === 0) {
    return (
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-6 text-center text-xs text-muted-foreground">
          The first 2 results are auto-selected when available; remove any column to compare different results.
        </CardContent>
      </Card>
    );
  }

  const comparisonFields = [
    { label: "Employer", key: "employer_name" },
    { label: "Risk Score", key: "risk_score", format: (v) => v || "—" },
    { label: "Risk Tier", key: "risk_tier", format: (v) => v?.charAt(0).toUpperCase() + v?.slice(1) || "—" },
    { label: "Value Score", key: "value_score", format: (v) => v ? `${v}/100` : "—" },
    { label: "Cost PMPM", key: "cost_delta_pmpm", format: (v) => v ? `$${v.toFixed(2)}/mo` : "—" },
    { label: "Base Plan", key: "base_plan_name" },
    { label: "Optimized Plan", key: "optimized_plan_name" },
    { label: "Enhancements", key: "enhancements", format: (v) => v?.length || 0 },
    { label: "Status", key: "status", format: (v) => v?.charAt(0).toUpperCase() + v?.slice(1) || "—" },
    { label: "Auto-Bindable", key: "auto_bindable", format: (v) => v ? "Yes" : "No" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Result Comparison ({selectedResults.length}/3)</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-2 font-semibold">Metric</th>
              {selectedResults.map(r => (
                <th key={r.id} className="text-left p-2 font-semibold">
                  <div className="flex items-center gap-1 justify-between">
                    <div className="truncate max-w-32">{r.employer_name}</div>
                    <button onClick={() => toggleResult(r.id)} className="text-muted-foreground hover:text-foreground">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparisonFields.map(field => (
              <tr key={field.key} className="border-b border-border last:border-0">
                <td className="p-2 font-medium text-muted-foreground">{field.label}</td>
                {selectedResults.map(r => (
                  <td key={r.id} className="p-2">
                    {field.format ? field.format(r[field.key]) : r[field.key] || "—"}
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