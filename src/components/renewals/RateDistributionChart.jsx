import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

/**
 * RateDistributionChart
 * Bar chart showing renewals by rate change ranges.
 *
 * Props:
 *   renewals — RenewalCycle[]
 */
export default function RateDistributionChart({ renewals }) {
  // Bucket renewals by rate change range
  const ranges = [
    { key: "-5% or less", min: -Infinity, max: -5, label: "-5% or less", color: "#16a34a" },
    { key: "-5% to 0%", min: -5, max: 0, label: "-5% to 0%", color: "#22c55e" },
    { key: "0% to 5%", min: 0, max: 5, label: "0% to 5%", color: "#f59e0b" },
    { key: "5% to 10%", min: 5, max: 10, label: "5% to 10%", color: "#ef4444" },
    { key: "10%+", min: 10, max: Infinity, label: "10%+", color: "#991b1b" },
  ];

  const data = ranges.map(r => {
    const count = renewals.filter(renewal => {
      const pct = renewal.rate_change_percent ?? null;
      return pct !== null && pct > r.min && pct <= r.max;
    }).length;
    return { name: r.label, count, fill: r.color };
  });

  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Rate Change Distribution</CardTitle>
        <p className="text-xs text-muted-foreground mt-1">Renewals bucketed by rate increase/decrease range</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, Math.ceil(maxCount * 1.1)]} tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              formatter={(value) => [`${value} renewals`, "Count"]}
            />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}