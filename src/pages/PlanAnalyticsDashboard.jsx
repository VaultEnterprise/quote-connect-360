import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";
import { ArrowLeft, TrendingUp, Award, BarChart2, AlertTriangle, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import CarrierPerformanceDashboard from "@/components/plans/CarrierPerformanceDashboard";
import PlanDataValidation from "@/components/plans/PlanDataValidation";

const COLORS = ["hsl(var(--chart-1))","hsl(var(--chart-2))","hsl(var(--chart-3))","hsl(var(--chart-4))","hsl(var(--chart-5))"];

export default function PlanAnalyticsDashboard() {
  const { data: plans = [] } = useQuery({ queryKey: ["benefit-plans"], queryFn: () => base44.entities.BenefitPlan.list("-created_date", 500) });
  const { data: stateRates = [] } = useQuery({ queryKey: ["all-state-rates"], queryFn: () => base44.entities.PlanRateByState.list("-created_date", 1000) });
  const { data: varianceAlerts = [] } = useQuery({ queryKey: ["all-variance-alerts"], queryFn: () => base44.entities.RateVarianceAlert.list("-created_date", 200) });

  const activePlans = plans.filter(p => p.status === "active");

  const byCarrier = useMemo(() => {
    const map = {};
    activePlans.forEach(p => { if (p.carrier) map[p.carrier] = (map[p.carrier] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name: name.split(" ").slice(-1)[0], value })).sort((a,b) => b.value - a.value);
  }, [activePlans]);

  const byType = useMemo(() => {
    const map = {};
    activePlans.forEach(p => { if (p.plan_type) map[p.plan_type.toUpperCase()] = (map[p.plan_type.toUpperCase()] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [activePlans]);

  const byNetwork = useMemo(() => {
    const map = {};
    activePlans.forEach(p => { if (p.network_type) map[p.network_type] = (map[p.network_type] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [activePlans]);

  // Average rates per carrier
  const avgRateByCarrier = useMemo(() => {
    const map = {};
    stateRates.forEach(r => {
      const plan = activePlans.find(p => p.id === r.plan_id);
      if (plan?.carrier) {
        if (!map[plan.carrier]) map[plan.carrier] = { total: 0, count: 0 };
        if (r.ee_only) { map[plan.carrier].total += r.ee_only; map[plan.carrier].count++; }
      }
    });
    return Object.entries(map).filter(([,v]) => v.count > 0).map(([name, v]) => ({ name: name.split(" ").slice(-1)[0], avg: Math.round(v.total / v.count) })).sort((a,b) => a.avg - b.avg);
  }, [stateRates, activePlans]);

  const criticalAlerts = varianceAlerts.filter(a => !a.is_reviewed && a.severity === "critical");
  const totalAlerts = varianceAlerts.filter(a => !a.is_reviewed).length;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <Link to="/plans" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 mb-1">
            <ArrowLeft className="w-4 h-4" /> Plan Library
          </Link>
          <h1 className="text-2xl font-bold">Plan Analytics Dashboard</h1>
          <p className="text-muted-foreground text-sm">Carrier performance, rate intelligence, and utilization insights</p>
        </div>
        {totalAlerts > 0 && (
          <Badge className="bg-amber-100 text-amber-700 gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> {totalAlerts} Rate Alert{totalAlerts > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Active Plans", value: activePlans.length, icon: Activity, color: "text-blue-600" },
          { label: "State Rates", value: stateRates.length, icon: BarChart2, color: "text-green-600" },
          { label: "Carriers", value: byCarrier.length, icon: Award, color: "text-purple-600" },
          { label: "Rate Alerts", value: totalAlerts, icon: AlertTriangle, color: totalAlerts > 0 ? "text-amber-600" : "text-muted-foreground" },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <kpi.icon className={`w-8 h-8 ${kpi.color}`} />
              <div>
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Plans by Carrier</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={byCarrier} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                  {byCarrier.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Plans by Network Type</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byNetwork} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="value" name="Plans" fill="hsl(var(--primary))" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Average Rate by Carrier */}
      {avgRateByCarrier.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" />Average EE Rate by Carrier ($/mo)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={avgRateByCarrier} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={60} />
                <Tooltip formatter={v => `$${v}`} contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="avg" name="Avg EE Rate" fill="hsl(var(--chart-2))" radius={[0,3,3,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Carrier Performance Dashboard */}
      <CarrierPerformanceDashboard plans={activePlans} />

      {/* Data Validation */}
      <PlanDataValidation plans={activePlans} />
    </div>
  );
}