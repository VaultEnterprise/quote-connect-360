import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import {
  TrendingUp, Users, Heart, DollarSign, CheckCircle2,
  AlertTriangle, UserCheck, FileSignature
} from "lucide-react";
import { format, parseISO } from "date-fns";

const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function EmployeeAnalyticsTab({ enrollments, windows, plans }) {
  const planMap = useMemo(() => Object.fromEntries(plans.map(p => [p.id, p])), [plans]);
  const windowMap = useMemo(() => Object.fromEntries(windows.map(w => [w.id, w])), [windows]);

  // --- Overall stats ---
  const total = enrollments.length;
  const completed = enrollments.filter(e => e.status === "completed").length;
  const waived = enrollments.filter(e => e.status === "waived").length;
  const pending = enrollments.filter(e => ["invited","started"].includes(e.status)).length;
  const participationRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const docusignComplete = enrollments.filter(e => e.docusign_status === "completed").length;

  // --- Status pie ---
  const statusData = [
    { name: "Enrolled", value: completed },
    { name: "Waived", value: waived },
    { name: "Invited", value: enrollments.filter(e => e.status === "invited").length },
    { name: "In Progress", value: enrollments.filter(e => e.status === "started").length },
  ].filter(d => d.value > 0);

  // --- Coverage tier breakdown ---
  const tierData = useMemo(() => {
    const map = {};
    enrollments.filter(e => e.coverage_tier).forEach(e => {
      const label = e.coverage_tier.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      map[label] = (map[label] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [enrollments]);

  // --- Plan popularity ---
  const planData = useMemo(() => {
    const map = {};
    enrollments.filter(e => e.status === "completed").forEach(e => {
      const name = e.selected_plan_name || planMap[e.selected_plan_id]?.plan_name || "Unknown";
      map[name] = (map[name] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name: name.length > 20 ? name.slice(0, 18) + "…" : name, value }))
      .sort((a, b) => b.value - a.value).slice(0, 8);
  }, [enrollments, planMap]);

  // --- Enrollment by window ---
  const windowData = useMemo(() => {
    return windows.map(w => {
      const wEnrollments = enrollments.filter(e => e.enrollment_window_id === w.id);
      return {
        name: (w.employer_name || "Unknown").slice(0, 14),
        enrolled: wEnrollments.filter(e => e.status === "completed").length,
        waived: wEnrollments.filter(e => e.status === "waived").length,
        pending: wEnrollments.filter(e => ["invited","started"].includes(e.status)).length,
        total: wEnrollments.length,
      };
    }).filter(w => w.total > 0).sort((a, b) => b.total - a.total).slice(0, 10);
  }, [enrollments, windows]);

  // --- Dependent stats ---
  const dependentEnrollments = enrollments.filter(e => e.dependents?.length > 0);
  const totalDependents = enrollments.reduce((sum, e) => sum + (e.dependents?.length || 0), 0);
  const avgDependents = dependentEnrollments.length > 0 ? (totalDependents / dependentEnrollments.length).toFixed(1) : 0;

  // --- Waiver reasons ---
  const waiverReasons = useMemo(() => {
    const map = {};
    enrollments.filter(e => e.status === "waived" && e.waiver_reason).forEach(e => {
      map[e.waiver_reason] = (map[e.waiver_reason] || 0) + 1;
    });
    return Object.entries(map).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count);
  }, [enrollments]);

  // --- DocuSign funnel ---
  const dsStats = useMemo(() => ({
    total: enrollments.filter(e => e.status === "completed").length,
    not_sent: enrollments.filter(e => e.status === "completed" && (!e.docusign_status || e.docusign_status === "not_sent")).length,
    sent: enrollments.filter(e => e.docusign_status === "sent").length,
    delivered: enrollments.filter(e => e.docusign_status === "delivered").length,
    completed: enrollments.filter(e => e.docusign_status === "completed").length,
    declined: enrollments.filter(e => e.docusign_status === "declined").length,
  }), [enrollments]);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <TrendingUp className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Analytics will appear once employees are enrolled.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Employees", value: total, icon: Users, color: "text-primary", bg: "bg-primary/5" },
          { label: "Participation Rate", value: `${participationRate}%`, icon: TrendingUp, color: participationRate >= 75 ? "text-green-600" : participationRate >= 50 ? "text-amber-600" : "text-destructive", bg: participationRate >= 75 ? "bg-green-50" : "bg-amber-50" },
          { label: "DocuSign Complete", value: docusignComplete, icon: FileSignature, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Total Dependents", value: totalDependents, icon: Heart, color: "text-pink-600", bg: "bg-pink-50" },
        ].map(kpi => (
          <Card key={kpi.label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${kpi.bg} flex-shrink-0`}><kpi.icon className={`w-4 h-4 ${kpi.color}`} /></div>
              <div>
                <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Enrollment status pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Enrollment Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Plan popularity */}
        {planData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Plan Selection Popularity</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={planData} layout="vertical" margin={{ left: 8 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2563eb" radius={[0, 4, 4, 0]} name="Employees" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Enrollment by window stacked bar */}
        {windowData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Enrollment by Window</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={windowData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="enrolled" stackId="a" fill="#10b981" name="Enrolled" />
                  <Bar dataKey="waived" stackId="a" fill="#94a3b8" name="Waived" />
                  <Bar dataKey="pending" stackId="a" fill="#f59e0b" name="Pending" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Coverage tier breakdown */}
        {tierData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Coverage Tier Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {tierData.map((tier, i) => (
                  <div key={tier.name}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium">{tier.name}</span>
                      <span className="text-muted-foreground">{tier.value} ({completed > 0 ? Math.round((tier.value / completed) * 100) : 0}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${completed > 0 ? (tier.value / completed) * 100 : 0}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* DocuSign funnel */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><FileSignature className="w-4 h-4" /> DocuSign Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { label: "Completed Enrollments", value: dsStats.total, color: "bg-primary" },
                { label: "Awaiting Send", value: dsStats.not_sent, color: "bg-slate-300" },
                { label: "Envelope Sent", value: dsStats.sent, color: "bg-blue-400" },
                { label: "Delivered", value: dsStats.delivered, color: "bg-indigo-400" },
                { label: "Signed ✓", value: dsStats.completed, color: "bg-green-500" },
                { label: "Declined", value: dsStats.declined, color: "bg-red-400" },
              ].map(row => (
                <div key={row.label} className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${row.color}`} />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-xs">{row.label}</span>
                    <span className="text-xs font-semibold">{row.value}</span>
                  </div>
                  <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${row.color}`} style={{ width: `${dsStats.total > 0 ? (row.value / dsStats.total) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Waiver reasons + dependent stats */}
        <div className="space-y-4">
          {waiverReasons.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Coverage Waiver Reasons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {waiverReasons.map(({ reason, count }) => (
                    <div key={reason} className="flex items-center justify-between text-xs">
                      <span className="capitalize text-muted-foreground">{reason?.replace(/_/g, " ") || "Not specified"}</span>
                      <Badge variant="outline" className="text-[10px]">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Dependent Enrollment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xl font-bold text-primary">{dependentEnrollments.length}</p>
                  <p className="text-xs text-muted-foreground">With Dependents</p>
                </div>
                <div>
                  <p className="text-xl font-bold">{totalDependents}</p>
                  <p className="text-xs text-muted-foreground">Total Dependents</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-blue-600">{avgDependents}</p>
                  <p className="text-xs text-muted-foreground">Avg Per Employee</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}