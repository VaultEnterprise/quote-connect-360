import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Zap } from "lucide-react";
import { differenceInDays } from "date-fns";

export default function CycleTiming({ cases = [] }) {
  const STAGES = ["draft", "census_in_progress", "ready_for_quote", "quoting", "proposal_ready", "employer_review", "approved_for_enrollment", "enrollment_open", "active"];

  const caseAgeDays = cases
    .map(c => {
      const created = c.created_date ? new Date(c.created_date) : null;
      if (!created || Number.isNaN(created.getTime())) return null;
      return Math.max(0, differenceInDays(new Date(), created));
    })
    .filter(v => v !== null);

  const stageData = STAGES.map(stage => {
    const casesInStage = cases.filter(c => c.stage === stage);
    if (casesInStage.length === 0) return { stage, days: 0, count: 0 };

    const avgDays = Math.round(
      casesInStage.reduce((sum, c) => {
        const created = c.created_date ? new Date(c.created_date) : null;
        if (!created || Number.isNaN(created.getTime())) return sum;
        return sum + Math.max(0, differenceInDays(new Date(), created));
      }, 0) / casesInStage.length
    );

    return { stage: stage.replace(/_/g, " "), days: avgDays, count: casesInStage.length };
  }).filter(d => d.count > 0);

  const avgCycleTime = caseAgeDays.length > 0
    ? Math.round(caseAgeDays.reduce((sum, days) => sum + days, 0) / caseAgeDays.length)
    : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" /> Cycle Timing
          </CardTitle>
          <div className="text-xs font-semibold text-primary">{avgCycleTime}d avg</div>
        </div>
      </CardHeader>
      <CardContent>
        {stageData.length === 0 ? (
          <div className="flex items-center justify-center h-44 text-sm text-muted-foreground">No data</div>
        ) : (
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={stageData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="stage" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} angle={-45} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} label={{ value: "Days", angle: -90, position: "insideLeft" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} formatter={(v) => `${v}d`} />
              <Bar dataKey="days" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}