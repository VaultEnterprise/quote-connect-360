import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Briefcase, Users, FileText, ClipboardCheck, RefreshCw, AlertCircle,
  ArrowRight, Clock, TrendingUp, DollarSign, Star, Target, Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import MetricCard from "@/components/shared/MetricCard";
import StatusBadge from "@/components/shared/StatusBadge";
import PageHeader from "@/components/shared/PageHeader";
import { format, differenceInDays, subMonths, startOfMonth } from "date-fns";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";
import TodaysPriorities from "@/components/dashboard/TodaysPriorities";
import EnrollmentCountdowns from "@/components/dashboard/EnrollmentCountdowns";
import StalledCases from "@/components/dashboard/StalledCases";
import QuickActions from "@/components/dashboard/QuickActions";
import CensusGapAlert from "@/components/dashboard/CensusGapAlert";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from "recharts";

const STAGE_GROUPS = [
  { key: "draft", label: "Draft", color: "#94a3b8", match: (s) => s === "draft" },
  { key: "census", label: "Census", color: "#60a5fa", match: (s) => s?.includes("census") },
  { key: "quoting", label: "Quoting", color: "#f59e0b", match: (s) => ["ready_for_quote", "quoting"].includes(s) },
  { key: "proposal", label: "Proposal", color: "#a78bfa", match: (s) => ["proposal_ready", "employer_review"].includes(s) },
  { key: "enrollment", label: "Enrollment", color: "#34d399", match: (s) => s?.includes("enrollment") },
  { key: "active", label: "Active", color: "#10b981", match: (s) => ["install_in_progress", "active", "renewal_pending"].includes(s) },
];

const PIE_COLORS = ["#3b82f6", "#f59e0b", "#a78bfa", "#34d399", "#f87171", "#94a3b8"];

export default function Dashboard() {
  const { data: cases = [], isLoading } = useQuery({
    queryKey: ["cases"],
    queryFn: () => base44.entities.BenefitCase.list("-created_date", 200),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks-pending"],
    queryFn: () => base44.entities.CaseTask.filter({ status: "pending" }, "-created_date", 20),
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["enrollments"],
    // Raised from 20 → 100: truncated list silently understates open-enrollment KPI
    queryFn: () => base44.entities.EnrollmentWindow.list("-created_date", 100),
  });

  const { data: renewals = [] } = useQuery({
    queryKey: ["renewals"],
    // Raised from 20 → 100: truncated list silently understates 90-day renewal KPI
    queryFn: () => base44.entities.RenewalCycle.list("-renewal_date", 100),
  });

  const { data: scenarios = [] } = useQuery({
    queryKey: ["scenarios-all"],
    queryFn: () => base44.entities.QuoteScenario.list("-created_date", 100),
  });

  const { data: exceptions = [] } = useQuery({
    queryKey: ["exceptions"],
    queryFn: () => base44.entities.ExceptionItem.list("-created_date", 50),
  });

  const activeCases = cases.filter(c => !["closed", "renewed"].includes(c.stage));
  const quotingCases = cases.filter(c => ["ready_for_quote", "quoting"].includes(c.stage));
  const enrollmentOpen = enrollments.filter(e => ["open", "closing_soon"].includes(e.status));
  // "pending" status filter on the query already scopes this correctly;
  // overdue = pending + past due_date
  const overdueTasks = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date());
  const openExceptions = exceptions.filter(e => !["resolved", "dismissed"].includes(e.status));
  // Only aggregate completed scenarios — drafts and expired produce misleading totals
  const totalPremium = scenarios.filter(s => s.status === "completed" && s.total_monthly_premium).reduce((sum, s) => sum + s.total_monthly_premium, 0);

  if (isLoading) return <DashboardSkeleton />;

  if (cases.length === 0) return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview of your benefits operations"
        actions={<Link to="/cases/new"><Button className="shadow-sm"><Briefcase className="w-4 h-4 mr-2" /> New Case</Button></Link>} />
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-6">
          <Briefcase className="w-9 h-9 text-primary" />
        </div>
        <h2 className="text-xl font-bold mb-2">Welcome to Connect Quote 360</h2>
        <p className="text-sm text-muted-foreground max-w-md mb-8">Your benefits operating platform is ready. Start by creating your first benefit case.</p>
        <div className="flex gap-3">
          <Link to="/cases/new"><Button className="shadow-sm"><Briefcase className="w-4 h-4 mr-2" /> Create First Case</Button></Link>
          <Link to="/employers"><Button variant="outline">Add Employer Groups</Button></Link>
        </div>
      </div>
    </div>
  );

  // Pipeline chart data
  const pipelineData = STAGE_GROUPS.map(g => ({
    name: g.label,
    count: cases.filter(c => g.match(c.stage)).length,
    color: g.color,
  })).filter(g => g.count > 0);

  // Case type distribution for pie
  const typeData = [
    { name: "New Business", value: cases.filter(c => c.case_type === "new_business").length },
    { name: "Renewal", value: cases.filter(c => c.case_type === "renewal").length },
    { name: "Mid-Year", value: cases.filter(c => c.case_type === "mid_year_change").length },
    { name: "Takeover", value: cases.filter(c => c.case_type === "takeover").length },
  ].filter(d => d.value > 0);

  // Cases created per month (last 6)
  const monthlyData = [...Array(6)].map((_, i) => {
    const month = subMonths(new Date(), 5 - i);
    const start = startOfMonth(month);
    const end = startOfMonth(subMonths(month, -1));
    return {
      name: format(month, "MMM"),
      cases: cases.filter(c => {
        const d = new Date(c.created_date);
        // Guard against malformed dates — isNaN check prevents silent filter failures
        return !isNaN(d.getTime()) && d >= start && d < end;
      }).length,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Benefits operations overview"
        actions={
          <Link to="/cases/new">
            <Button className="shadow-sm">
              <Briefcase className="w-4 h-4 mr-2" /> New Case
            </Button>
          </Link>
        }
      />

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Active Cases" value={activeCases.length} icon={Briefcase} trendLabel={`${cases.length} total`} />
        <MetricCard label="Quoting Now" value={quotingCases.length} icon={FileText} />
        <MetricCard label="Open Enrollments" value={enrollmentOpen.length} icon={ClipboardCheck} />
        <MetricCard label="Overdue Tasks" value={overdueTasks.length} icon={AlertCircle} trend={overdueTasks.length > 0 ? "down" : undefined} trendLabel={overdueTasks.length > 0 ? "needs attention" : "on track"} />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Monthly Premium (completed)</p>
            <p className="text-xl font-bold text-primary">{totalPremium > 0 ? `$${(totalPremium / 1000).toFixed(0)}k` : "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Open Exceptions</p>
            <p className={`text-xl font-bold ${openExceptions.length > 0 ? "text-destructive" : "text-foreground"}`}>{openExceptions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Upcoming Renewals (90d)</p>
            <p className="text-xl font-bold text-amber-600">{renewals.filter(r => r.renewal_date && differenceInDays(new Date(r.renewal_date), new Date()) <= 90 && differenceInDays(new Date(r.renewal_date), new Date()) >= 0).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Avg Enrollment Rate</p>
            <p className="text-xl font-bold text-green-600">
              {(() => {
                  // Only average windows that have actual activity — zeros from
                  // scheduled/not-started windows would pull the average down artificially
                  const active = enrollments.filter(e => e.total_eligible > 0 && e.enrolled_count > 0);
                  if (active.length === 0) return "—";
                  const avg = Math.round(active.reduce((s, e) => {
                    const rate = e.participation_rate ?? Math.round((e.enrolled_count / e.total_eligible) * 100);
                    return s + rate;
                  }, 0) / active.length);
                  return `${avg}%`;
                })()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Case Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={pipelineData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
                  cursor={{ fill: "hsl(var(--muted))" }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {pipelineData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Case Type Pie */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Case Types</CardTitle>
          </CardHeader>
          <CardContent>
            {typeData.length === 0 ? (
              <div className="flex items-center justify-center h-44 text-sm text-muted-foreground">No data</div>
            ) : (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={typeData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
                      {typeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                  {typeData.map((d, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-[11px] text-muted-foreground truncate">{d.name}</span>
                      <span className="text-[11px] font-semibold ml-auto">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> Cases Created
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={130}>
              <LineChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                <Line type="monotone" dataKey="cases" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Cases */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Recent Cases</CardTitle>
              <Link to="/cases"><Button variant="ghost" size="sm" className="text-xs text-muted-foreground">View all <ArrowRight className="w-3 h-3 ml-1" /></Button></Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {cases.slice(0, 5).map(c => (
                <Link key={c.id} to={`/cases/${c.id}`} className="block">
                  <div className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors group">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{c.employer_name || "Unnamed"}</p>
                      <p className="text-xs text-muted-foreground">{c.case_number || `#${c.id?.slice(-6)}`}</p>
                    </div>
                    <StatusBadge status={c.stage} />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tasks + Exceptions */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Needs Attention</CardTitle>
              <Link to="/tasks"><Button variant="ghost" size="sm" className="text-xs text-muted-foreground">Tasks <ArrowRight className="w-3 h-3 ml-1" /></Button></Link>
            </div>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 && openExceptions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">All caught up! ✓</p>
            ) : (
              <div className="space-y-2">
                {openExceptions.slice(0, 2).map(e => (
                  <Link key={e.id} to="/exceptions">
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-100 hover:bg-red-100 transition-colors">
                      <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-red-700 truncate">{e.title}</p>
                        <p className="text-[10px] text-red-500 capitalize">{e.severity} • {e.category}</p>
                      </div>
                    </div>
                  </Link>
                ))}
                {tasks.slice(0, 3).map(t => (
                  <div key={t.id} className="p-2.5 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                    <p className="text-xs font-medium truncate">{t.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground">{t.employer_name}</span>
                      {t.due_date && (
                        <span className={`text-[10px] flex items-center gap-0.5 ${new Date(t.due_date) < new Date() ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                          <Clock className="w-3 h-3" />{format(new Date(t.due_date), "MMM d")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Renewals row */}
      {renewals.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-primary" /> Upcoming Renewals
              </CardTitle>
              <Link to="/renewals"><Button variant="ghost" size="sm" className="text-xs text-muted-foreground">View all</Button></Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {renewals.slice(0, 6).map(r => {
                const daysUntil = r.renewal_date ? differenceInDays(new Date(r.renewal_date), new Date()) : null;
                return (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="text-sm font-medium">{r.employer_name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{r.renewal_date ? format(new Date(r.renewal_date), "MMM d, yyyy") : "TBD"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {daysUntil !== null && (
                        <Badge className={`text-[10px] ${daysUntil <= 30 ? "bg-red-100 text-red-700" : daysUntil <= 60 ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                          {daysUntil}d
                        </Badge>
                      )}
                      <StatusBadge status={r.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}