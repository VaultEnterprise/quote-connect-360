import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function PolicyMatchAnalyticsDashboard({ results }) {
  const acceptanceRate = results.length > 0 ? Math.round((results.filter(r => r.status === "accepted").length / results.length) * 100) : 0;
  const avgRiskScore = results.length > 0 ? Math.round(results.reduce((sum, r) => sum + (r.risk_score || 0), 0) / results.length) : 0;
  const totalCostSavings = results.reduce((sum, r) => sum + ((r.cost_delta_pmpm || 0) * -1), 0); // negative = savings
  const avgValueScore = results.length > 0 ? Math.round(results.reduce((sum, r) => sum + (r.value_score || 0), 0) / results.length) : 0;

  // Risk tier distribution
  const riskDistribution = [
    { name: "Preferred", value: results.filter(r => r.risk_tier === "preferred").length, fill: "#10b981" },
    { name: "Standard", value: results.filter(r => r.risk_tier === "standard").length, fill: "#3b82f6" },
    { name: "Elevated", value: results.filter(r => r.risk_tier === "elevated").length, fill: "#f59e0b" },
    { name: "High", value: results.filter(r => r.risk_tier === "high").length, fill: "#ef4444" },
  ].filter(r => r.value > 0);

  // Acceptance by stage
  const stageData = {};
  results.forEach(r => {
    const stage = r.trigger_stage || "unknown";
    if (!stageData[stage]) stageData[stage] = { stage, total: 0, accepted: 0 };
    stageData[stage].total++;
    if (r.status === "accepted") stageData[stage].accepted++;
  });
  const stageChartData = Object.values(stageData).map(s => ({ ...s, rate: Math.round((s.accepted / s.total) * 100) }));

  // Cost delta distribution
  const costData = results
    .filter(r => r.cost_delta_pmpm !== null && r.cost_delta_pmpm !== undefined)
    .sort((a, b) => a.cost_delta_pmpm - b.cost_delta_pmpm)
    .slice(0, 20)
    .map((r, i) => ({
      name: r.employer_name?.slice(0, 10) || `Case ${i}`,
      delta: r.cost_delta_pmpm,
      savings: r.cost_delta_pmpm <= 0
    }));

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Acceptance Rate", value: `${acceptanceRate}%`, icon: "📊", trend: acceptanceRate >= 50 ? "up" : "down" },
          { label: "Avg Risk Score", value: avgRiskScore, icon: "📈", trend: avgRiskScore <= 50 ? "up" : "down" },
          { label: "Total Saved", value: `$${Math.round(totalCostSavings).toLocaleString()}`, icon: "💰", trend: totalCostSavings > 0 ? "up" : "down" },
          { label: "Avg Value Score", value: `${avgValueScore}/100`, icon: "⭐", trend: avgValueScore >= 50 ? "up" : "down" },
        ].map((m, i) => (
          <Card key={i}>
            <CardContent className="p-3">
              <p className="text-[10px] text-muted-foreground font-medium">{m.label}</p>
              <p className="text-lg font-bold mt-1 flex items-center gap-1">
                <span>{m.icon}</span> {m.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Risk Distribution */}
        {riskDistribution.length > 0 && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Risk Tier Distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={riskDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value">
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} result${value !== 1 ? "s" : ""}`} contentStyle={{ fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Acceptance by Stage */}
        {stageChartData.length > 0 && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Acceptance by Trigger Stage</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stageChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="stage" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Bar dataKey="rate" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Cost Impact */}
        {costData.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3"><CardTitle className="text-sm">Cost Impact by Case (Top 20)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={costData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v) => `$${v.toFixed(0)}/mo PMPM`} />
                  <Bar dataKey="delta" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}