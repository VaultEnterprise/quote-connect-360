import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Award, BarChart2 } from "lucide-react";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function MarketShareAnalytics({ plans }) {
  const carrierData = useMemo(() => {
    const map = {};
    plans.forEach(p => {
      if (!p.carrier) return;
      if (!map[p.carrier]) map[p.carrier] = { name: p.carrier, total: 0, medical: 0, ancillary: 0, avgDed: [], networks: new Set() };
      map[p.carrier].total++;
      if (p.plan_type === "medical") map[p.carrier].medical++;
      else map[p.carrier].ancillary++;
      if (p.deductible_individual) map[p.carrier].avgDed.push(p.deductible_individual);
      if (p.network_type) map[p.carrier].networks.add(p.network_type);
    });
    return Object.values(map).map(c => ({
      ...c,
      share: Math.round((c.total / plans.length) * 100),
      avgDed: c.avgDed.length ? Math.round(c.avgDed.reduce((s, v) => s + v, 0) / c.avgDed.length) : null,
      networks: [...c.networks].join(", "),
    })).sort((a, b) => b.total - a.total);
  }, [plans]);

  const networkData = useMemo(() => {
    const map = {};
    plans.forEach(p => { if (p.network_type) map[p.network_type] = (map[p.network_type] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [plans]);

  const typeData = useMemo(() => {
    const map = {};
    plans.forEach(p => { if (p.plan_type) map[p.plan_type] = (map[p.plan_type] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, [plans]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Carrier pie */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Award className="w-4 h-4 text-primary" />Carrier Market Share</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={120} height={120}>
                <PieChart><Pie data={carrierData} dataKey="total" innerRadius={30} outerRadius={55} paddingAngle={2}>
                  {carrierData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie><Tooltip formatter={(v, n, p) => [v, p.payload.name]} /></PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5">
                {carrierData.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-xs truncate flex-1">{c.name}</span>
                    <Badge variant="outline" className="text-xs h-4 px-1">{c.share}%</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Network distribution */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart2 className="w-4 h-4 text-primary" />Network Type Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={networkData} layout="vertical" margin={{ left: 0, right: 10 }}>
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={45} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={3} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Carrier detail table */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Carrier Penetration Detail</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="text-left pb-2">Carrier</th>
                  <th className="text-center pb-2">Total Plans</th>
                  <th className="text-center pb-2">Medical</th>
                  <th className="text-center pb-2">Ancillary</th>
                  <th className="text-center pb-2">Share</th>
                  <th className="text-right pb-2">Avg Deductible</th>
                </tr>
              </thead>
              <tbody>
                {carrierData.map((c, i) => (
                  <tr key={c.name} className="border-b last:border-0">
                    <td className="py-2 flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="font-medium">{c.name}</span>
                    </td>
                    <td className="text-center py-2">{c.total}</td>
                    <td className="text-center py-2">{c.medical}</td>
                    <td className="text-center py-2">{c.ancillary}</td>
                    <td className="text-center py-2">
                      <div className="flex items-center gap-1 justify-center">
                        <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${c.share}%` }} />
                        </div>
                        <span className="text-xs">{c.share}%</span>
                      </div>
                    </td>
                    <td className="text-right py-2 text-muted-foreground">{c.avgDed ? `$${c.avgDed.toLocaleString()}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}