import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp, TrendingDown, Minus, Calculator } from "lucide-react";

function computeProjection(stateRates, yearsAhead = 3) {
  if (!stateRates.length) return [];
  // Build YoY trend from prior_year fields
  const withVariance = stateRates.filter(r => r.prior_year_ee && r.ee_only).map(r => ({
    state: r.state,
    yoy: ((r.ee_only - r.prior_year_ee) / r.prior_year_ee) * 100,
    base: r.ee_only,
  }));
  if (!withVariance.length) return [];
  const avgYoY = withVariance.reduce((s, r) => s + r.yoy, 0) / withVariance.length;

  const currentYear = new Date().getFullYear();
  const rows = [];
  let lastRate = stateRates[0]?.ee_only || 0;
  for (let i = 0; i <= yearsAhead; i++) {
    rows.push({ year: String(currentYear + i), rate: Math.round(lastRate * 100) / 100, projected: i > 0 });
    lastRate = lastRate * (1 + avgYoY / 100);
  }
  return { rows, avgYoY: avgYoY.toFixed(1) };
}

export default function RenewalProjectionEngine({ planId, planName }) {
  const [manualTrend, setManualTrend] = useState("");

  const { data: stateRates = [] } = useQuery({
    queryKey: ["plan-rates-by-state", planId],
    queryFn: () => base44.entities.PlanRateByState.filter({ plan_id: planId }),
    enabled: !!planId,
  });

  const projection = useMemo(() => computeProjection(stateRates), [stateRates]);
  const effectiveTrend = manualTrend !== "" ? parseFloat(manualTrend) : parseFloat(projection?.avgYoY || 0);

  const manualRows = useMemo(() => {
    if (!stateRates.length) return [];
    const currentYear = new Date().getFullYear();
    let last = stateRates[0]?.ee_only || 0;
    return [0, 1, 2, 3].map(i => {
      const rate = Math.round(last * 100) / 100;
      last = last * (1 + effectiveTrend / 100);
      return { year: String(currentYear + i), rate, projected: i > 0 };
    });
  }, [stateRates, effectiveTrend]);

  const chartData = manualRows;
  const trend = effectiveTrend;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm">Renewal Projection Engine</CardTitle>
          </div>
          {projection?.avgYoY && (
            <Badge className={`gap-1 ${parseFloat(projection.avgYoY) > 10 ? "bg-red-100 text-red-700" : parseFloat(projection.avgYoY) > 5 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
              {parseFloat(projection.avgYoY) > 0 ? <TrendingUp className="w-3 h-3" /> : parseFloat(projection.avgYoY) < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              Historical YoY: {projection.avgYoY}%
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!stateRates.length ? (
          <p className="text-sm text-muted-foreground text-center py-4">Add state rates with prior-year data to generate projections.</p>
        ) : (
          <>
            {/* Manual trend override */}
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium whitespace-nowrap">Override Trend (%/yr)</label>
              <Input type="number" step="0.1" placeholder={projection?.avgYoY || "Auto"} value={manualTrend} onChange={e => setManualTrend(e.target.value)} className="h-7 w-24 text-xs" />
              {manualTrend && <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setManualTrend("")}>Reset</Button>}
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} />
                <Tooltip formatter={v => [`$${Number(v).toFixed(2)}`, "EE Rate"]} contentStyle={{ fontSize: 11 }} />
                <ReferenceLine x={String(new Date().getFullYear())} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                <Line dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={2} dot={d => d.payload.projected ? <circle cx={d.cx} cy={d.cy} r={4} fill="hsl(var(--primary))" fillOpacity={0.5} /> : <circle cx={d.cx} cy={d.cy} r={4} fill="hsl(var(--primary))" />} />
              </LineChart>
            </ResponsiveContainer>

            {/* Projection table */}
            <div className="grid grid-cols-4 gap-2 text-center">
              {chartData.map(row => (
                <div key={row.year} className={`p-2 rounded-lg text-xs ${row.projected ? "bg-muted/50 border border-dashed border-border" : "bg-primary/10"}`}>
                  <p className="font-bold text-sm">${row.rate.toFixed(0)}</p>
                  <p className="text-muted-foreground">{row.year}{row.projected ? " (proj.)" : " (actual)"}</p>
                </div>
              ))}
            </div>

            {trend > 10 && (
              <div className="flex items-center gap-2 text-xs text-red-600 p-2 bg-red-50 rounded">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Projected trend exceeds 10% — rate variance alert will trigger at renewal</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}