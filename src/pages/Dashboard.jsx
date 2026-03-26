import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Briefcase,
  FileText,
  ClipboardCheck,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  Clock,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MetricCard from "@/components/shared/MetricCard";
import StatusBadge from "@/components/shared/StatusBadge";
import PageHeader from "@/components/shared/PageHeader";
import { format, differenceInDays, startOfMonth, subMonths } from "date-fns";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";
import TodaysPriorities from "@/components/dashboard/TodaysPriorities";
import InteractivePipeline from "@/components/dashboard/InteractivePipeline";
import EnrollmentCountdowns from "@/components/dashboard/EnrollmentCountdowns";
import StalledCases from "@/components/dashboard/StalledCases";
import QuickActions from "@/components/dashboard/QuickActions";
import CensusGapAlert from "@/components/dashboard/CensusGapAlert";
import ProposalsKPI from "@/components/dashboard/ProposalsKPI";
import TeamWorkload from "@/components/dashboard/TeamWorkload";
import RevenueMetrics from "@/components/dashboard/RevenueMetrics";
import ComplianceAlerts from "@/components/dashboard/ComplianceAlerts";
import CarrierDistribution from "@/components/dashboard/CarrierDistribution";
import EnrollmentForecast from "@/components/dashboard/EnrollmentForecast";
import CycleTiming from "@/components/dashboard/CycleTiming";
import DashboardControls from "@/components/dashboard/DashboardControls";
import {
  buildDashboardOptions,
  DEFAULT_DASHBOARD_FILTERS,
  filterByWindow,
  filterCasesForDashboard,
  getComparisonMeta,
  getDateRangeWindow,
} from "@/utils/dashboardControls";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
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
const DASHBOARD_PRESET_QUERY_KEY = ["dashboard-view-presets"];

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState(DEFAULT_DASHBOARD_FILTERS);
  const [selectedPresetId, setSelectedPresetId] = useState("none");
  const [hasInitializedPreferences, setHasInitializedPreferences] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });

  const { data: cases = [], isLoading, dataUpdatedAt: casesUpdatedAt } = useQuery({
    queryKey: ["cases"],
    queryFn: () => base44.entities.BenefitCase.list("-created_date", 200),
  });

  const { data: tasks = [], dataUpdatedAt: tasksUpdatedAt } = useQuery({
    queryKey: ["tasks-pending"],
    queryFn: () => base44.entities.CaseTask.filter({ status: "pending" }, "-created_date", 200),
  });

  const { data: enrollments = [], dataUpdatedAt: enrollmentsUpdatedAt } = useQuery({
    queryKey: ["enrollments"],
    queryFn: () => base44.entities.EnrollmentWindow.list("-created_date", 100),
  });

  const { data: renewals = [], dataUpdatedAt: renewalsUpdatedAt } = useQuery({
    queryKey: ["renewals"],
    queryFn: () => base44.entities.RenewalCycle.list("-renewal_date", 100),
  });

  const { data: scenarios = [], dataUpdatedAt: scenariosUpdatedAt } = useQuery({
    queryKey: ["scenarios-all"],
    queryFn: () => base44.entities.QuoteScenario.list("-created_date", 100),
  });

  const { data: exceptions = [], dataUpdatedAt: exceptionsUpdatedAt } = useQuery({
    queryKey: ["exceptions"],
    queryFn: () => base44.entities.ExceptionItem.list("-created_date", 100),
  });

  const { data: proposals = [], dataUpdatedAt: proposalsUpdatedAt } = useQuery({
    queryKey: ["proposals"],
    queryFn: () => base44.entities.Proposal.list("-created_date", 100),
  });

  const { data: agencies = [], dataUpdatedAt: agenciesUpdatedAt } = useQuery({
    queryKey: ["agencies"],
    queryFn: () => base44.entities.Agency.list("name", 100),
  });

  const {
    data: presets = [],
    isFetched: presetsFetched,
    dataUpdatedAt: presetsUpdatedAt,
  } = useQuery({
    queryKey: DASHBOARD_PRESET_QUERY_KEY,
    enabled: !!user?.email,
    queryFn: () => base44.entities.DashboardViewPreset.filter({ created_by: user.email }, "name", 50),
  });

  useEffect(() => {
    const unsubscribeCases = base44.entities.BenefitCase.subscribe(() => queryClient.invalidateQueries({ queryKey: ["cases"] }));
    const unsubscribeTasks = base44.entities.CaseTask.subscribe(() => queryClient.invalidateQueries({ queryKey: ["tasks-pending"] }));
    const unsubscribeEnrollments = base44.entities.EnrollmentWindow.subscribe(() => queryClient.invalidateQueries({ queryKey: ["enrollments"] }));
    const unsubscribeExceptions = base44.entities.ExceptionItem.subscribe(() => queryClient.invalidateQueries({ queryKey: ["exceptions"] }));
    const unsubscribeProposals = base44.entities.Proposal.subscribe(() => queryClient.invalidateQueries({ queryKey: ["proposals"] }));

    return () => {
      unsubscribeCases?.();
      unsubscribeTasks?.();
      unsubscribeEnrollments?.();
      unsubscribeExceptions?.();
      unsubscribeProposals?.();
    };
  }, [queryClient]);

  useEffect(() => {
    if (hasInitializedPreferences || !user || !presetsFetched) return;

    const defaultPreset = presets.find((preset) => preset.is_default);
    if (defaultPreset) {
      setFilters({
        dateRange: defaultPreset.date_range || DEFAULT_DASHBOARD_FILTERS.dateRange,
        viewMode: defaultPreset.view_mode || DEFAULT_DASHBOARD_FILTERS.viewMode,
        owner: defaultPreset.filters?.owner || "all",
        team: defaultPreset.filters?.team || "all",
        agencyId: defaultPreset.filters?.agencyId || "all",
        employerId: defaultPreset.filters?.employerId || "all",
        caseType: defaultPreset.filters?.caseType || "all",
        stage: defaultPreset.filters?.stage || "all",
      });
      setSelectedPresetId(defaultPreset.id);
    } else {
      setFilters((current) => ({
        ...current,
        viewMode: user.role === "admin" ? "executive" : "my",
      }));
    }

    setHasInitializedPreferences(true);
  }, [hasInitializedPreferences, presets, presetsFetched, user]);

  const lastUpdated = useMemo(() => {
    const timestamps = [
      casesUpdatedAt,
      tasksUpdatedAt,
      enrollmentsUpdatedAt,
      renewalsUpdatedAt,
      scenariosUpdatedAt,
      exceptionsUpdatedAt,
      proposalsUpdatedAt,
      agenciesUpdatedAt,
      presetsUpdatedAt,
    ].filter(Boolean);

    if (timestamps.length === 0) return "";
    return format(new Date(Math.max(...timestamps)), "MMM d, yyyy h:mm a");
  }, [
    agenciesUpdatedAt,
    casesUpdatedAt,
    enrollmentsUpdatedAt,
    exceptionsUpdatedAt,
    presetsUpdatedAt,
    proposalsUpdatedAt,
    renewalsUpdatedAt,
    scenariosUpdatedAt,
    tasksUpdatedAt,
  ]);

  const options = useMemo(() => buildDashboardOptions(cases, agencies), [cases, agencies]);
  const windowBounds = useMemo(() => getDateRangeWindow(filters.dateRange), [filters.dateRange]);

  const scopedData = useMemo(() => {
    const currentCases = filterCasesForDashboard(
      filterByWindow(cases, (item) => item.created_date, windowBounds),
      filters,
      user,
    );
    const previousCases = filterCasesForDashboard(
      filterByWindow(cases, (item) => item.created_date, { start: windowBounds.previousStart, end: windowBounds.previousEnd }),
      filters,
      user,
    );

    const currentCaseIds = new Set(currentCases.map((item) => item.id));
    const previousCaseIds = new Set(previousCases.map((item) => item.id));

    const currentTasks = filterByWindow(tasks, (item) => item.created_date || item.due_date, windowBounds)
      .filter((item) => currentCaseIds.has(item.case_id));
    const previousTasks = filterByWindow(tasks, (item) => item.created_date || item.due_date, {
      start: windowBounds.previousStart,
      end: windowBounds.previousEnd,
    }).filter((item) => previousCaseIds.has(item.case_id));

    const currentEnrollments = filterByWindow(enrollments, (item) => item.start_date || item.created_date, windowBounds)
      .filter((item) => currentCaseIds.has(item.case_id));
    const previousEnrollments = filterByWindow(enrollments, (item) => item.start_date || item.created_date, {
      start: windowBounds.previousStart,
      end: windowBounds.previousEnd,
    }).filter((item) => previousCaseIds.has(item.case_id));

    const currentRenewals = filterByWindow(renewals, (item) => item.renewal_date || item.created_date, windowBounds)
      .filter((item) => !item.case_id || currentCaseIds.has(item.case_id));
    const previousRenewals = filterByWindow(renewals, (item) => item.renewal_date || item.created_date, {
      start: windowBounds.previousStart,
      end: windowBounds.previousEnd,
    }).filter((item) => !item.case_id || previousCaseIds.has(item.case_id));

    const currentScenarios = filterByWindow(scenarios, (item) => item.created_date || item.quoted_at, windowBounds)
      .filter((item) => currentCaseIds.has(item.case_id));
    const previousScenarios = filterByWindow(scenarios, (item) => item.created_date || item.quoted_at, {
      start: windowBounds.previousStart,
      end: windowBounds.previousEnd,
    }).filter((item) => previousCaseIds.has(item.case_id));

    const currentExceptions = filterByWindow(exceptions, (item) => item.created_date || item.due_by, windowBounds)
      .filter((item) => !item.case_id || currentCaseIds.has(item.case_id));
    const previousExceptions = filterByWindow(exceptions, (item) => item.created_date || item.due_by, {
      start: windowBounds.previousStart,
      end: windowBounds.previousEnd,
    }).filter((item) => !item.case_id || previousCaseIds.has(item.case_id));

    const currentProposals = filterByWindow(proposals, (item) => item.created_date || item.sent_at, windowBounds)
      .filter((item) => currentCaseIds.has(item.case_id));
    const previousProposals = filterByWindow(proposals, (item) => item.created_date || item.sent_at, {
      start: windowBounds.previousStart,
      end: windowBounds.previousEnd,
    }).filter((item) => previousCaseIds.has(item.case_id));

    return {
      currentCases,
      previousCases,
      currentTasks,
      previousTasks,
      currentEnrollments,
      previousEnrollments,
      currentRenewals,
      previousRenewals,
      currentScenarios,
      previousScenarios,
      currentExceptions,
      previousExceptions,
      currentProposals,
      previousProposals,
    };
  }, [cases, enrollments, exceptions, filters, proposals, renewals, scenarios, tasks, user, windowBounds]);

  const {
    currentCases,
    previousCases,
    currentTasks,
    previousTasks,
    currentEnrollments,
    previousEnrollments,
    currentRenewals,
    currentScenarios,
    previousScenarios,
    currentExceptions,
    previousExceptions,
    currentProposals,
  } = scopedData;

  const activeCases = currentCases.filter((item) => !["closed", "renewed"].includes(item.stage));
  const previousActiveCases = previousCases.filter((item) => !["closed", "renewed"].includes(item.stage));
  const quotingCases = currentCases.filter((item) => ["ready_for_quote", "quoting"].includes(item.stage));
  const previousQuotingCases = previousCases.filter((item) => ["ready_for_quote", "quoting"].includes(item.stage));
  const enrollmentOpen = currentEnrollments.filter((item) => ["open", "closing_soon"].includes(item.status));
  const previousEnrollmentOpen = previousEnrollments.filter((item) => ["open", "closing_soon"].includes(item.status));
  const overdueTasks = currentTasks.filter((item) => item.due_date && new Date(item.due_date) < new Date());
  const previousOverdueTasks = previousTasks.filter((item) => item.due_date && new Date(item.due_date) < new Date());
  const openExceptions = currentExceptions.filter((item) => !["resolved", "dismissed"].includes(item.status));
  const previousOpenExceptions = previousExceptions.filter((item) => !["resolved", "dismissed"].includes(item.status));
  const totalPremium = currentScenarios
    .filter((item) => item.status === "completed" && item.total_monthly_premium)
    .reduce((sum, item) => sum + item.total_monthly_premium, 0);
  const previousTotalPremium = previousScenarios
    .filter((item) => item.status === "completed" && item.total_monthly_premium)
    .reduce((sum, item) => sum + item.total_monthly_premium, 0);

  const activeCasesComparison = getComparisonMeta(activeCases.length, previousActiveCases.length, true);
  const quotingComparison = getComparisonMeta(quotingCases.length, previousQuotingCases.length, true);
  const enrollmentComparison = getComparisonMeta(enrollmentOpen.length, previousEnrollmentOpen.length, true);
  const overdueComparison = getComparisonMeta(overdueTasks.length, previousOverdueTasks.length, false);
  const premiumComparison = getComparisonMeta(totalPremium, previousTotalPremium, true);
  const exceptionsComparison = getComparisonMeta(openExceptions.length, previousOpenExceptions.length, false);

  const pipelineData = STAGE_GROUPS.map((group) => ({
    name: group.label,
    count: currentCases.filter((item) => group.match(item.stage)).length,
    color: group.color,
  })).filter((group) => group.count > 0);

  const typeData = [
    { name: "New Business", value: currentCases.filter((item) => item.case_type === "new_business").length },
    { name: "Renewal", value: currentCases.filter((item) => item.case_type === "renewal").length },
    { name: "Mid-Year", value: currentCases.filter((item) => item.case_type === "mid_year_change").length },
    { name: "Takeover", value: currentCases.filter((item) => item.case_type === "takeover").length },
  ].filter((item) => item.value > 0);

  const monthlyData = [...Array(6)].map((_, index) => {
    const month = subMonths(new Date(), 5 - index);
    const start = startOfMonth(month);
    const end = startOfMonth(subMonths(month, -1));

    return {
      name: format(month, "MMM"),
      cases: currentCases.filter((item) => {
        const date = new Date(item.created_date);
        return !Number.isNaN(date.getTime()) && date >= start && date < end;
      }).length,
    };
  });

  const handleFilterChange = (key, value) => {
    setSelectedPresetId("none");
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["cases"] }),
      queryClient.invalidateQueries({ queryKey: ["tasks-pending"] }),
      queryClient.invalidateQueries({ queryKey: ["enrollments"] }),
      queryClient.invalidateQueries({ queryKey: ["renewals"] }),
      queryClient.invalidateQueries({ queryKey: ["scenarios-all"] }),
      queryClient.invalidateQueries({ queryKey: ["exceptions"] }),
      queryClient.invalidateQueries({ queryKey: ["proposals"] }),
      queryClient.invalidateQueries({ queryKey: ["agencies"] }),
      queryClient.invalidateQueries({ queryKey: DASHBOARD_PRESET_QUERY_KEY }),
    ]);
    setIsRefreshing(false);
  };

  const handleSaveView = async () => {
    const name = window.prompt("Name this dashboard view");
    if (!name) return;

    await base44.entities.DashboardViewPreset.create({
      name,
      view_mode: filters.viewMode,
      date_range: filters.dateRange,
      filters: {
        owner: filters.owner,
        team: filters.team,
        agencyId: filters.agencyId,
        employerId: filters.employerId,
        caseType: filters.caseType,
        stage: filters.stage,
      },
      is_default: false,
    });

    await queryClient.invalidateQueries({ queryKey: DASHBOARD_PRESET_QUERY_KEY });
  };

  const handlePresetChange = (presetId) => {
    if (presetId === "none") {
      setSelectedPresetId("none");
      return;
    }

    const preset = presets.find((item) => item.id === presetId);
    if (!preset) return;

    setSelectedPresetId(presetId);
    setFilters({
      dateRange: preset.date_range || DEFAULT_DASHBOARD_FILTERS.dateRange,
      viewMode: preset.view_mode || DEFAULT_DASHBOARD_FILTERS.viewMode,
      owner: preset.filters?.owner || "all",
      team: preset.filters?.team || "all",
      agencyId: preset.filters?.agencyId || "all",
      employerId: preset.filters?.employerId || "all",
      caseType: preset.filters?.caseType || "all",
      stage: preset.filters?.stage || "all",
    });
  };

  const handleSetDefault = async () => {
    if (!selectedPresetId || selectedPresetId === "none") return;

    await Promise.all(
      presets.map((preset) =>
        base44.entities.DashboardViewPreset.update(preset.id, {
          is_default: preset.id === selectedPresetId,
        }),
      ),
    );

    await queryClient.invalidateQueries({ queryKey: DASHBOARD_PRESET_QUERY_KEY });
  };

  if (isLoading || isUserLoading) return <DashboardSkeleton />;

  if (cases.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Overview of your benefits operations"
          actions={<Link to="/cases/new"><Button className="shadow-sm"><Briefcase className="w-4 h-4 mr-2" /> New Case</Button></Link>}
        />
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
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Benefits operations overview" />

      <DashboardControls
        filters={filters}
        options={options}
        presets={presets}
        selectedPresetId={selectedPresetId}
        onChange={handleFilterChange}
        onPresetChange={handlePresetChange}
        onSaveView={handleSaveView}
        onSetDefault={handleSetDefault}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        lastUpdated={lastUpdated}
      />

      <QuickActions />

      <CensusGapAlert cases={currentCases} />

      <TodaysPriorities tasks={currentTasks} exceptions={currentExceptions} cases={currentCases} enrollments={currentEnrollments} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Active Cases" value={activeCases.length} icon={Briefcase} trend={activeCasesComparison.trend} trendLabel={activeCasesComparison.label} />
        <MetricCard label="Quoting Now" value={quotingCases.length} icon={FileText} trend={quotingComparison.trend} trendLabel={quotingComparison.label} />
        <MetricCard label="Open Enrollments" value={enrollmentOpen.length} icon={ClipboardCheck} trend={enrollmentComparison.trend} trendLabel={enrollmentComparison.label} />
        <MetricCard label="Overdue Tasks" value={overdueTasks.length} icon={AlertCircle} trend={overdueComparison.trend} trendLabel={overdueComparison.label} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Monthly Premium (completed)</p>
            <p className="text-xl font-bold text-primary">{totalPremium > 0 ? `$${(totalPremium / 1000).toFixed(0)}k` : "—"}</p>
            <p className={`text-xs mt-1 ${premiumComparison.trend === "up" ? "text-green-600" : premiumComparison.trend === "down" ? "text-red-500" : "text-muted-foreground"}`}>
              {premiumComparison.label}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Open Exceptions</p>
            <p className={`text-xl font-bold ${openExceptions.length > 0 ? "text-destructive" : "text-foreground"}`}>{openExceptions.length}</p>
            <p className={`text-xs mt-1 ${exceptionsComparison.trend === "up" ? "text-green-600" : exceptionsComparison.trend === "down" ? "text-red-500" : "text-muted-foreground"}`}>
              {exceptionsComparison.label}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Upcoming Renewals (90d)</p>
            <p className="text-xl font-bold text-amber-600">
              {currentRenewals.filter((item) => item.renewal_date && differenceInDays(new Date(item.renewal_date), new Date()) <= 90 && differenceInDays(new Date(item.renewal_date), new Date()) >= 0).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Avg Enrollment Rate</p>
            <p className="text-xl font-bold text-green-600">
              {(() => {
                const active = currentEnrollments.filter((item) => item.total_eligible > 0 && item.enrolled_count > 0);
                if (active.length === 0) return "—";
                const avg = Math.round(active.reduce((sum, item) => {
                  const rate = item.participation_rate ?? Math.round((item.enrolled_count / item.total_eligible) * 100);
                  return sum + rate;
                }, 0) / active.length);
                return `${avg}%`;
              })()}
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <ProposalsKPI proposals={currentProposals} />
      </div>

      <ComplianceAlerts cases={currentCases} scenarios={currentScenarios} />
      <RevenueMetrics scenarios={currentScenarios} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <InteractivePipeline cases={currentCases} />

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
                      {typeData.map((_, index) => <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                  {typeData.map((item, index) => (
                    <div key={index} className="flex items-center gap-1.5">
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

        <CarrierDistribution scenarios={currentScenarios} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Recent Cases</CardTitle>
              <Link to="/cases"><Button variant="ghost" size="sm" className="text-xs text-muted-foreground">View all <ArrowRight className="w-3 h-3 ml-1" /></Button></Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {currentCases.slice(0, 5).map((item) => (
                <Link key={item.id} to={`/cases/${item.id}`} className="block">
                  <div className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors group">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{item.employer_name || "Unnamed"}</p>
                      <p className="text-xs text-muted-foreground">{item.case_number || `#${item.id?.slice(-6)}`}</p>
                    </div>
                    <StatusBadge status={item.stage} />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Needs Attention</CardTitle>
              <Link to="/tasks"><Button variant="ghost" size="sm" className="text-xs text-muted-foreground">Tasks <ArrowRight className="w-3 h-3 ml-1" /></Button></Link>
            </div>
          </CardHeader>
          <CardContent>
            {currentTasks.length === 0 && openExceptions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">All caught up! ✓</p>
            ) : (
              <div className="space-y-2">
                {openExceptions.slice(0, 2).map((item) => (
                  <Link key={item.id} to="/exceptions">
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-100 hover:bg-red-100 transition-colors">
                      <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-red-700 truncate">{item.title}</p>
                        <p className="text-[10px] text-red-500 capitalize">{item.severity} • {item.category}</p>
                      </div>
                    </div>
                  </Link>
                ))}
                {currentTasks.slice(0, 3).map((item) => (
                  <div key={item.id} className="p-2.5 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                    <p className="text-xs font-medium truncate">{item.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground">{item.employer_name}</span>
                      {item.due_date && (
                        <span className={`text-[10px] flex items-center gap-0.5 ${new Date(item.due_date) < new Date() ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                          <Clock className="w-3 h-3" />{format(new Date(item.due_date), "MMM d")}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TeamWorkload cases={currentCases} tasks={currentTasks} />
        <EnrollmentForecast enrollments={currentEnrollments} />
        <CycleTiming cases={currentCases} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EnrollmentCountdowns enrollments={currentEnrollments} />
        <StalledCases cases={currentCases} />
      </div>

      {currentRenewals.length > 0 && (
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
              {currentRenewals.slice(0, 6).map((item) => {
                const daysUntil = item.renewal_date ? differenceInDays(new Date(item.renewal_date), new Date()) : null;
                return (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="text-sm font-medium">{item.employer_name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{item.renewal_date ? format(new Date(item.renewal_date), "MMM d, yyyy") : "TBD"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {daysUntil !== null && (
                        <Badge className={`text-[10px] ${daysUntil <= 30 ? "bg-red-100 text-red-700" : daysUntil <= 60 ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                          {daysUntil}d
                        </Badge>
                      )}
                      <StatusBadge status={item.status} />
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