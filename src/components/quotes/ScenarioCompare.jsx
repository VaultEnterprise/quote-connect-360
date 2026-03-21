import React from "react";
import { Badge } from "@/components/ui/badge";
import { Star, Check, X } from "lucide-react";

export default function ScenarioCompare({ scenarios }) {
  if (scenarios.length < 2) return null;

  const rows = [
    { label: "Status", render: (s) => <span className="capitalize">{s.status}</span> },
    { label: "Products", render: (s) => <div className="flex flex-wrap gap-1">{(s.products_included || []).map(p => <Badge key={p} variant="outline" className="text-[10px] capitalize">{p}</Badge>)}</div> },
    { label: "Carriers", render: (s) => (s.carriers_included || []).join(", ") || "—" },
    { label: "Total Monthly", render: (s) => s.total_monthly_premium ? `$${s.total_monthly_premium.toLocaleString()}` : "—" },
    { label: "Employer Cost/mo", render: (s) => s.employer_monthly_cost ? `$${s.employer_monthly_cost.toLocaleString()}` : "—" },
    { label: "Avg EE Cost/mo", render: (s) => s.employee_monthly_cost_avg ? `$${s.employee_monthly_cost_avg.toLocaleString()}` : "—" },
    { label: "Contribution (EE)", render: (s) => s.employer_contribution_ee != null ? `${s.employer_contribution_ee}${s.contribution_strategy === "percentage" ? "%" : "$"}` : "—" },
    { label: "Contribution (Dep)", render: (s) => s.employer_contribution_dep != null ? `${s.employer_contribution_dep}${s.contribution_strategy === "percentage" ? "%" : "$"}` : "—" },
    { label: "Plan Count", render: (s) => s.plan_count || "—" },
    { label: "Recommended", render: (s) => s.is_recommended ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-muted-foreground" /> },
  ];

  const displayScenarios = scenarios.slice(0, 3);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-3 text-xs font-medium text-muted-foreground w-36">Attribute</th>
              {displayScenarios.map(s => (
                <th key={s.id} className="text-left p-3 text-xs font-medium">
                  <div className="flex items-center gap-1.5">
                    {s.is_recommended && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                    <span>{s.name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.label} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                <td className="p-3 text-xs text-muted-foreground font-medium">{row.label}</td>
                {displayScenarios.map(s => (
                  <td key={s.id} className="p-3 text-xs">{row.render(s)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}