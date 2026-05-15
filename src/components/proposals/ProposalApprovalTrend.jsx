import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

export default function ProposalApprovalTrend({ proposals }) {
  // Build weekly data
  const weeklyData = {};
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - (date.getDay() + (7 * i)));
    const week = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    weeklyData[week] = { week, sent: 0, approved: 0, rate: 0 };
  }

  proposals.forEach(p => {
    if (p.sent_at) {
      const date = new Date(p.sent_at);
      date.setDate(date.getDate() - date.getDay());
      const week = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (weeklyData[week]) {
        weeklyData[week].sent++;
        if (p.status === "approved") {
          weeklyData[week].approved++;
        }
      }
    }
  });

  const chartData = Object.values(weeklyData).map(w => ({
    ...w,
    rate: w.sent > 0 ? Math.round((w.approved / w.sent) * 100) : 0
  }));

  const overallRate = proposals.length > 0 ? Math.round((proposals.filter(p => p.status === "approved").length / proposals.filter(p => ["sent", "viewed", "approved"].includes(p.status)).length) * 100) || 0 : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Approval Rate Trend
          </span>
          <span className="text-lg font-black text-primary">{overallRate}%</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="week" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v) => `${v}%`} />
            <Line type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={2} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}