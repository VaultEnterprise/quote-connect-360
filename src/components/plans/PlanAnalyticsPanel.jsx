import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Calendar, Users } from "lucide-react";

export default function PlanAnalyticsPanel({ plans }) {
  const medicalPlans = plans.filter(p => p.plan_type === "medical");
  const ancillaryPlans = plans.filter(p => ["dental", "vision", "life", "std", "ltd", "voluntary"].includes(p.plan_type));

  const carrierBreakdown = [...new Set(plans.map(p => p.carrier))].map(carrier => ({
    name: carrier,
    count: plans.filter(p => p.carrier === carrier).length
  })).sort((a, b) => b.count - a.count);

  const networkBreakdown = Object.entries(
    plans.reduce((acc, p) => {
      const net = p.network_type || "Unknown";
      acc[net] = (acc[net] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, count]) => ({ name, value: count }));

  const avgDeductible = medicalPlans.filter(p => p.deductible_individual).reduce((sum, p) => sum + p.deductible_individual, 0) / Math.max(medicalPlans.filter(p => p.deductible_individual).length, 1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Plans", value: plans.length, icon: "📊" },
          { label: "Medical", value: medicalPlans.length, icon: "🏥" },
          { label: "Ancillary", value: ancillaryPlans.length, icon: "🦷" },
          { label: "Avg Deductible", value: `$${avgDeductible.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, icon: "💰" },
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
        {/* Carriers */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Plans by Carrier</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={carrierBreakdown}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Network types */}
        {networkBreakdown.length > 0 && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Network Type Distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={networkBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value">
                    {networkBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} plan${value !== 1 ? "s" : ""}`} contentStyle={{ fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}