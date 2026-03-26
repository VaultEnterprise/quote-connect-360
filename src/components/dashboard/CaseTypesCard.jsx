import React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PIE_COLORS = ["#3b82f6", "#f59e0b", "#a78bfa", "#34d399", "#f87171", "#94a3b8"];

export default function CaseTypesCard({ data }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Case Types</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-44 text-sm text-muted-foreground">No data</div>
        ) : (
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
                  {data.map((_, index) => <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1 w-full">
              {data.map((item, index) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[index % PIE_COLORS.length] }} />
                  <span className="text-[11px] text-muted-foreground truncate">{item.name}</span>
                  <span className="text-[11px] font-semibold ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}