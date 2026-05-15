import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function ProposalAnalyticsDashboard({ proposals }) {
  const approvalRate = proposals.length > 0 ? Math.round((proposals.filter(p => p.status === "approved").length / proposals.filter(p => ["approved", "rejected", "viewed", "sent"].includes(p.status)).length) * 100) : 0;
  const avgValuePerProposal = proposals.length > 0 ? Math.round(proposals.reduce((sum, p) => sum + (p.total_monthly_premium || 0), 0) / proposals.length) : 0;
  const totalPremium = proposals.reduce((sum, p) => sum + (p.total_monthly_premium || 0), 0);
  const avgTimeToView = proposals.filter(p => p.viewed_at && p.sent_at).length > 0 
    ? Math.round(proposals.filter(p => p.viewed_at && p.sent_at).reduce((sum, p) => {
      const sent = new Date(p.sent_at);
      const viewed = new Date(p.viewed_at);
      return sum + (viewed - sent);
    }, 0) / proposals.filter(p => p.viewed_at && p.sent_at).length / (1000 * 60 * 60 * 24))
    : 0;

  // Status distribution
  const statusData = [
    { name: "Draft", value: proposals.filter(p => p.status === "draft").length, fill: "#94a3b8" },
    { name: "Sent", value: proposals.filter(p => p.status === "sent").length, fill: "#3b82f6" },
    { name: "Viewed", value: proposals.filter(p => p.status === "viewed").length, fill: "#8b5cf6" },
    { name: "Approved", value: proposals.filter(p => p.status === "approved").length, fill: "#10b981" },
    { name: "Rejected", value: proposals.filter(p => p.status === "rejected").length, fill: "#ef4444" },
  ].filter(s => s.value > 0);

  // Timeline by month
  const monthlyData = {};
  proposals.forEach(p => {
    if (p.created_date) {
      const month = new Date(p.created_date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      monthlyData[month] = (monthlyData[month] || 0) + (p.total_monthly_premium || 0);
    }
  });
  const timelineData = Object.entries(monthlyData).map(([month, value]) => ({ month, premium: Math.round(value) }));

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Approval Rate", value: `${approvalRate}%`, icon: "📊", trend: approvalRate >= 50 ? "up" : "down" },
          { label: "Avg Value", value: `$${avgValuePerProposal.toLocaleString()}`, icon: "💰", trend: "up" },
          { label: "Total Premium", value: `$${totalPremium.toLocaleString()}`, icon: "📈", trend: "up" },
          { label: "Avg Time to View", value: `${avgTimeToView} days`, icon: "⏱️", trend: avgTimeToView <= 3 ? "up" : "down" },
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
        {/* Status Distribution */}
        {statusData.length > 0 && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Status Distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value">
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} proposal${value !== 1 ? "s" : ""}`} contentStyle={{ fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Premium Timeline */}
        {timelineData.length > 0 && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Monthly Premium Trend</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v) => `$${v.toLocaleString()}`} />
                  <Line type="monotone" dataKey="premium" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}