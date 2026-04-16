import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { subMonths, startOfMonth, format } from "date-fns";

export default function RevenueMetrics({ scenarios = [] }) {
  // Monthly premium trend (completed scenarios only)
  const monthlyRevenue = [...Array(6)].map((_, i) => {
    const month = subMonths(new Date(), 5 - i);
    const start = startOfMonth(month);
    const end = startOfMonth(subMonths(month, -1));
    const total = scenarios
      .filter(s => s.status === "completed" && s.total_monthly_premium && new Date(s.created_date) >= start && new Date(s.created_date) < end)
      .reduce((sum, s) => sum + s.total_monthly_premium, 0);
    return { name: format(month, "MMM"), revenue: Math.round(total / 1000) };
  });

  const currentMonth = monthlyRevenue[5];
  const prevMonth = monthlyRevenue[4];
  const trend = currentMonth && prevMonth ? ((currentMonth.revenue - prevMonth.revenue) / prevMonth.revenue * 100).toFixed(1) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" /> Monthly Premium Trend
          </CardTitle>
          {trend !== 0 && (
            <div className={`flex items-center gap-1 text-xs font-semibold ${trend > 0 ? "text-green-600" : "text-destructive"}`}>
              <TrendingUp className="w-3 h-3" />
              {Math.abs(trend)}%
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={130}>
          <LineChart data={monthlyRevenue} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} formatter={(v) => `$${v}k`} />
            <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}