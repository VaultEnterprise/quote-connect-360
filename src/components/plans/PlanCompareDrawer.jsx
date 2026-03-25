import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Download, TrendingUp } from "lucide-react";

const COMPARE_FIELDS = [
  { key: "carrier", label: "Carrier" },
  { key: "network_type", label: "Network" },
  { key: "plan_type", label: "Plan Type" },
  { key: "deductible_individual", label: "Deductible (Ind.)", format: "$" },
  { key: "deductible_family", label: "Deductible (Fam.)", format: "$" },
  { key: "oop_max_individual", label: "OOP Max (Ind.)", format: "$" },
  { key: "oop_max_family", label: "OOP Max (Fam.)", format: "$" },
  { key: "copay_pcp", label: "PCP Copay", format: "$" },
  { key: "copay_specialist", label: "Specialist Copay", format: "$" },
  { key: "copay_er", label: "ER Copay", format: "$" },
  { key: "coinsurance", label: "Coinsurance", format: "%" },
  { key: "rx_tier1", label: "Rx Tier 1", format: "$" },
  { key: "rx_tier2", label: "Rx Tier 2", format: "$" },
  { key: "rx_tier3", label: "Rx Tier 3", format: "$" },
  { key: "hsa_eligible", label: "HSA Eligible", format: "bool" },
];

function formatVal(val, format) {
  if (val === undefined || val === null || val === "") return <span className="text-muted-foreground">—</span>;
  if (format === "$") return `$${Number(val).toLocaleString()}`;
  if (format === "%") return `${val}%`;
  if (format === "bool") return val ? "✅ Yes" : "❌ No";
  return String(val);
}

function getBest(plans, key, format) {
  if (format === "$" && ["deductible_individual","deductible_family","oop_max_individual","oop_max_family","copay_pcp","copay_specialist","copay_er"].includes(key)) {
    const min = Math.min(...plans.map(p => p[key]).filter(v => v != null));
    return min;
  }
  if (key === "coinsurance") return Math.max(...plans.map(p => p[key]).filter(v => v != null));
  return null;
}

export default function PlanCompareDrawer({ plans, open, onClose, onRemovePlan }) {
  const exportCSV = () => {
    const headers = ["Field", ...plans.map(p => p.plan_name)];
    const rows = COMPARE_FIELDS.map(f => [f.label, ...plans.map(p => p[f.key] ?? "")]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "plan_comparison.csv"; a.click();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              Plan Comparison Matrix
              <Badge variant="outline">{plans.length} plans</Badge>
            </SheetTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={exportCSV} className="gap-1 h-7 text-xs">
                <Download className="w-3 h-3" /> Export CSV
              </Button>
            </div>
          </div>
        </SheetHeader>
        <ScrollArea className="flex-1">
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground w-36">Field</th>
                    {plans.map(p => (
                      <th key={p.id} className="text-left py-2 px-3 min-w-40">
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <p className="font-semibold text-xs leading-tight">{p.plan_name}</p>
                            <p className="text-muted-foreground text-xs">{p.carrier}</p>
                          </div>
                          {onRemovePlan && (
                            <Button variant="ghost" size="icon" className="h-5 w-5 flex-shrink-0" onClick={() => onRemovePlan(p.id)}>
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_FIELDS.map(field => {
                    const best = getBest(plans, field.key, field.format);
                    return (
                      <tr key={field.key} className="border-b hover:bg-muted/30">
                        <td className="py-2 pr-4 text-xs font-medium text-muted-foreground">{field.label}</td>
                        {plans.map(p => {
                          const val = p[field.key];
                          const isBest = best !== null && val === best;
                          return (
                            <td key={p.id} className={`py-2 px-3 text-xs ${isBest ? "font-bold text-green-700" : ""}`}>
                              {isBest && <span className="text-green-500 mr-1">★</span>}
                              {formatVal(val, field.format)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">★ = Best value in category (lowest cost / highest coverage)</p>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}