import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, TrendingDown, TrendingUp, Award } from "lucide-react";

const ACA_THRESHOLD_PCT = 9.02;
const MEDIAN_INCOME = 60000;

function computeMetrics(model) {
  const strategy = model.strategy || "percentage";
  const totalPremium = model.total_monthly_premium || 0;
  const eeCount = model.total_ee_count || 0;
  const avgPremiumPerEE = eeCount > 0 ? totalPremium / eeCount : 0;
  let employerMonthly = 0;

  if (strategy === "percentage") {
    employerMonthly = avgPremiumPerEE * ((model.ee_contribution_pct ?? 80) / 100) * eeCount;
  } else {
    employerMonthly = (model.ee_contribution_flat ?? 0) * eeCount;
  }

  const employeeMonthly = Math.max(0, totalPremium - employerMonthly);
  const avgEECost = eeCount > 0 ? employeeMonthly / eeCount : 0;
  const acaPct = avgEECost > 0 ? ((avgEECost * 12) / MEDIAN_INCOME) * 100 : 0;
  const acaSafe = avgEECost <= (MEDIAN_INCOME * (ACA_THRESHOLD_PCT / 100)) / 12;
  const employerSharePct = totalPremium > 0 ? (employerMonthly / totalPremium) * 100 : 0;

  return { employerMonthly, employeeMonthly, avgEECost, acaPct, acaSafe, employerSharePct, annualEmployerCost: employerMonthly * 12 };
}

const ROWS = [
  { label: "Strategy", render: (m) => <span className="capitalize text-xs">{(m.strategy || "percentage").replace(/_/g, " ")}</span> },
  { label: "Employer/month", render: (m, met) => <span className="font-bold text-primary">${met.employerMonthly.toLocaleString(undefined,{maximumFractionDigits:0})}</span> },
  { label: "EE cost/month (avg)", render: (m, met) => <span className="font-semibold">${met.avgEECost.toLocaleString(undefined,{maximumFractionDigits:0})}</span> },
  { label: "Annual employer cost", render: (m, met) => <span>${(met.annualEmployerCost/1000).toFixed(1)}k</span> },
  { label: "Employer share %", render: (m, met) => (
    <div className="flex items-center gap-1">
      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, met.employerSharePct)}%` }} />
      </div>
      <span className="text-xs">{met.employerSharePct.toFixed(0)}%</span>
    </div>
  )},
  { label: "ACA % of income", render: (m, met) => (
    <span className={`font-semibold ${met.acaSafe ? "text-emerald-600" : "text-red-600"}`}>
      {met.acaPct.toFixed(2)}%
    </span>
  )},
  { label: "ACA Compliant", render: (m, met) => met.acaSafe
    ? <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px]"><CheckCircle2 className="w-3 h-3 mr-1"/>Yes</Badge>
    : <Badge className="bg-red-100 text-red-700 border-0 text-[10px]"><AlertCircle className="w-3 h-3 mr-1"/>No</Badge>
  },
  { label: "EE count", render: (m) => <span>{m.total_ee_count || "—"}</span> },
];

export default function ContributionComparePanel({ models }) {
  if (models.length < 2) return null;

  const metricsMap = {};
  models.forEach(m => { metricsMap[m.id] = computeMetrics(m); });

  // Find best employer cost model (lowest annual cost)
  const bestCostId = models.reduce((best, m) =>
    metricsMap[m.id].annualEmployerCost < metricsMap[best.id].annualEmployerCost ? m : best
  , models[0]).id;

  // Find most ACA-safe model
  const bestAcaId = models.reduce((best, m) =>
    metricsMap[m.id].acaPct < metricsMap[best.id].acaPct ? m : best
  , models[0]).id;

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-sm">Side-by-Side Comparison</p>
          <Badge variant="secondary" className="text-xs">{models.length} models</Badge>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/40 border-b">
              <th className="text-left px-4 py-2.5 text-muted-foreground font-medium w-36">Metric</th>
              {models.map(m => {
                const met = metricsMap[m.id];
                const isBestCost = m.id === bestCostId;
                const isBestAca = m.id === bestAcaId;
                return (
                  <th key={m.id} className="px-4 py-2.5 text-center min-w-[140px]">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-semibold text-foreground truncate max-w-[120px]">{m.name}</span>
                      <div className="flex gap-1">
                        {isBestCost && <Badge className="bg-blue-100 text-blue-700 border-0 text-[9px] px-1.5"><TrendingDown className="w-2.5 h-2.5 mr-0.5"/>Lowest Cost</Badge>}
                        {isBestAca && m.id !== bestCostId && <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[9px] px-1.5"><Award className="w-2.5 h-2.5 mr-0.5"/>ACA Best</Badge>}
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y">
            {ROWS.map(row => (
              <tr key={row.label} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-2.5 text-muted-foreground font-medium">{row.label}</td>
                {models.map(m => (
                  <td key={m.id} className="px-4 py-2.5 text-center">
                    {row.render(m, metricsMap[m.id])}
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