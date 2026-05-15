import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Building2 } from "lucide-react";

const PIE_COLORS = ["#3b82f6", "#f59e0b", "#a78bfa", "#34d399", "#f87171", "#94a3b8"];

export default function CarrierDistribution({ scenarios = [] }) {
  // Group by carrier from completed scenarios
  const carrierData = scenarios
    .filter(s => s.status === "completed")
    .reduce((acc, s) => {
      s.carriers_included?.forEach(carrier => {
        const existing = acc.find(c => c.name === carrier);
        if (existing) existing.value++;
        else acc.push({ name: carrier, value: 1 });
      });
      return acc;
    }, [])
    .sort((a, b) => b.value - a.value);

  if (carrierData.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" /> Carrier Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-44 text-sm text-muted-foreground">No data</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" /> Carrier Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={carrierData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
                {carrierData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
            {carrierData.map((c, i) => (
              <div key={c.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="text-[11px] text-muted-foreground truncate">{c.name}</span>
                <span className="text-[11px] font-semibold ml-auto">{c.value}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}