import React from "react";
import { Badge } from "@/components/ui/badge";
import { Star, Check, X, TrendingDown } from "lucide-react";

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

function getBestIndex(scenarios, getValue) {
  const values = scenarios.map(s => getValue(s));
  const nums = values.map(v => typeof v === "number" ? v : null);
  if (nums.every(n => n === null)) return -1;
  const valid = nums.filter(n => n !== null);
  const min = Math.min(...valid);
  return nums.indexOf(min);
}

export default function ScenarioCompare({ scenarios, onClose }) {
  if (!scenarios || scenarios.length < 2) return null;

  const display = scenarios.slice(0, 4);

  const rows = [
    {
      label: "Status",
      render: (s) => <span className="capitalize">{s.status}</span>,
      bestFn: null,
    },
    {
      label: "Products",
      render: (s) => (
        <div className="flex flex-wrap gap-1">
          {(s.products_included || []).map(p => (
            <span key={p} className={`text-[9px] px-1.5 py-0.5 rounded font-medium capitalize ${PRODUCT_COLORS[p] || "bg-gray-100 text-gray-700"}`}>
              {p.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      ),
      bestFn: null,
    },
    {
      label: "Carriers",
      render: (s) => (s.carriers_included || []).join(", ") || "—",
      bestFn: null,
    },
    {
      label: "Total Monthly",
      render: (s) => s.total_monthly_premium ? `$${s.total_monthly_premium.toLocaleString()}` : "—",
      bestFn: (s) => s.total_monthly_premium || null,
      lowerIsBetter: true,
    },
    {
      label: "Employer Cost/mo",
      render: (s) => s.employer_monthly_cost ? `$${s.employer_monthly_cost.toLocaleString()}` : "—",
      bestFn: (s) => s.employer_monthly_cost || null,
      lowerIsBetter: true,
    },
    {
      label: "Avg EE Cost/mo",
      render: (s) => s.employee_monthly_cost_avg ? `$${s.employee_monthly_cost_avg.toLocaleString()}` : "—",
      bestFn: (s) => s.employee_monthly_cost_avg || null,
      lowerIsBetter: true,
    },
    {
      label: "Employer Contrib (EE)",
      render: (s) => s.employer_contribution_ee != null
        ? `${s.employer_contribution_ee}${s.contribution_strategy === "percentage" ? "%" : "$"}`
        : "—",
      bestFn: (s) => s.employer_contribution_ee || null,
      lowerIsBetter: false,
    },
    {
      label: "Employer Contrib (Dep)",
      render: (s) => s.employer_contribution_dep != null
        ? `${s.employer_contribution_dep}${s.contribution_strategy === "percentage" ? "%" : "$"}`
        : "—",
      bestFn: null,
    },
    {
      label: "Plan Count",
      render: (s) => s.plan_count || "—",
      bestFn: null,
    },
    {
      label: "Rec. Score",
      render: (s) => s.recommendation_score != null
        ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden w-16">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${s.recommendation_score}%` }}
              />
            </div>
            <span>{s.recommendation_score}</span>
          </div>
        )
        : "—",
      bestFn: (s) => s.recommendation_score || null,
      lowerIsBetter: false,
    },
    {
      label: "Recommended",
      render: (s) => s.is_recommended
        ? <Check className="w-4 h-4 text-green-500" />
        : <X className="w-4 h-4 text-muted-foreground" />,
      bestFn: null,
    },
  ];

  return (
    <div className="border rounded-xl overflow-hidden shadow-sm">
      <div className="bg-muted/50 px-4 py-2.5 flex items-center justify-between border-b">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Scenario Comparison</span>
          <Badge variant="outline" className="text-[10px]">{display.length} scenarios</Badge>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Clear comparison
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-card border-b">
              <th className="text-left p-3 text-xs font-medium text-muted-foreground w-40">Attribute</th>
              {display.map((s, idx) => (
                <th key={s.id} className="text-left p-3 text-xs font-medium min-w-40">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {s.is_recommended && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                    <span className="font-semibold">{s.name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const bestIdx = row.bestFn
                ? row.lowerIsBetter !== false
                  ? getBestIndex(display, row.bestFn)
                  : (() => {
                      const values = display.map(s => row.bestFn(s));
                      const nums = values.map(v => typeof v === "number" ? v : null);
                      if (nums.every(n => n === null)) return -1;
                      const max = Math.max(...nums.filter(n => n !== null));
                      return nums.indexOf(max);
                    })()
                : -1;

              return (
                <tr key={row.label} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                  <td className="p-3 text-xs text-muted-foreground font-medium">{row.label}</td>
                  {display.map((s, idx) => (
                    <td
                      key={s.id}
                      className={`p-3 text-xs ${bestIdx === idx ? "font-semibold text-green-700 bg-green-50/50" : ""}`}
                    >
                      <div className="flex items-center gap-1.5">
                        {row.render(s)}
                        {bestIdx === idx && row.bestFn && (
                          <TrendingDown className="w-3 h-3 text-green-600 flex-shrink-0" />
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}