import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Briefcase, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, differenceInDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";
import DashboardControls from "@/components/dashboard/DashboardControls";
import DashboardMetricGrid from "@/components/dashboard/DashboardMetricGrid";
import DashboardSecondaryMetrics from "@/components/dashboard/DashboardSecondaryMetrics";
import DashboardActivityPanels from "@/components/dashboard/DashboardActivityPanels";
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
import { DEFAULT_DASHBOARD_FILTERS } from "@/utils/dashboardControls";
import { getDashboardPageModel } from "@/domain/dashboard/useDashboardMetrics";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const PIE_COLORS = ["#3b82f6", "#f59e0b", "#a78bfa", "#34d399", "#f87171", "#94a3b8"];
const DASHBOARD_PRESET_QUERY_KEY = ["dashboard-view-presets"];

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState(DEFAULT_DASHBOARD_FILTERS);
  const [selectedPresetId, setSelectedPresetId] = useState("none");
  const [hasInitializedPreferences, setHasInitializedPreferences] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: user, isLoading: isUserLoading } = useQuery({ queryKey: ["me"], queryFn: () => base44.auth.me() });
  const scopedList = (entity, sort, limit = 100) =>
    user?.role === "admin"
      ? base44.entities[entity].list(sort, limit)
      : base44.entities[entity].filter({ assigned_to: user?.email }, sort, limit);

  const { data: cases = [], isLoading, dataUpdatedAt: casesUpdatedAt } = useQuery({ queryKey: ["cases", user?.email, user?.role], enabled: !!user, queryFn: () => scopedList("BenefitCase", "-created_date", 100) });
  const { data: tasks = [], dataUpdatedAt: tasksUpdatedAt } = useQuery({ queryKey: ["tasks-pending", user?.email, user?.role], enabled: !!user, queryFn: () => user?.role === "admin" ? base44.entities.CaseTask.filter({ status: "pending" }, "-created_date", 200) : base44.entities.CaseTask.filter({ status: "pending", assigned_to: user?.email }, "-created_date", 200) });
  const { data: enrollments = [], dataUpdatedAt: enrollmentsUpdatedAt } = useQuery({ queryKey: ["enrollments", user?.email, user?.role], enabled: !!user, queryFn: () => scopedList("EnrollmentWindow", "-created_date", 100) });
  const { data: renewals = [], dataUpdatedAt: renewalsUpdatedAt } = useQuery({ queryKey: ["renewals", user?.email, user?.role], enabled: !!user, queryFn: () => scopedList("RenewalCycle", "-renewal_date", 100) });
  const { data: scenarios = [], dataUpdatedAt: scenariosUpdatedAt } = useQuery({ queryKey: ["scenarios-all", user?.email, user?.role], enabled: !!user, queryFn: () => scopedList("QuoteScenario", "-created_date", 100) });
  const { data: exceptions = [], dataUpdatedAt: exceptionsUpdatedAt } = useQuery({ queryKey: ["exceptions", user?.email, user?.role], enabled: !!user, queryFn: () => scopedList("ExceptionItem", "-created_date", 100) });
  const { data: proposals = [], dataUpdatedAt: proposalsUpdatedAt } = useQuery({ queryKey: ["proposals", user?.email, user?.role], enabled: !!user, queryFn: () => scopedList("Proposal", "-created_date", 100) });
  const { data: agencies = [], dataUpdatedAt: agenciesUpdatedAt } = useQuery({ queryKey: ["agencies"], queryFn: () => base44.entities.Agency.list("name", 100) });
  const { data: presets = [], isFetched: presetsFetched, dataUpdatedAt: presetsUpdatedAt } = useQuery({ queryKey: DASHBOARD_PRESET_QUERY_KEY, enabled: !!user?.email, queryFn: () => base44.entities.DashboardViewPreset.filter({ created_by: user.email }, "name", 50) });

  useEffect(() => {
    const unsubscribeCases = base44.entities.BenefitCase.subscribe(() => queryClient.invalidateQueries({ queryKey: ["cases"] }));
    const unsubscribeTasks = base44.entities.CaseTask.subscribe(() => queryClient.invalidateQueries({ queryKey: ["tasks-pending"] }));
    const unsubscribeEnrollments = base44.entities.EnrollmentWindow.subscribe(() => queryClient.invalidateQueries({ queryKey: ["enrollments"] }));
    const unsubscribeExceptions = base44.entities.ExceptionItem.subscribe(() => queryClient.invalidateQueries({ queryKey: ["exceptions"] }));
    const unsubscribeProposals = base44.entities.Proposal.subscribe(() => queryClient.invalidateQueries({ queryKey: ["proposals"] }));
    return () => { unsubscribeCases?.(); unsubscribeTasks?.(); unsubscribeEnrollments?.(); unsubscribeExceptions?.(); unsubscribeProposals?.(); };
  }, [queryClient]);

  useEffect(() => {
    if (hasInitializedPreferences || !user || !presetsFetched) return;
    const defaultPreset = presets.find((preset) => preset.is_default);
    if (defaultPreset) {
      setFilters({ dateRange: defaultPreset.date_range || DEFAULT_DASHBOARD_FILTERS.dateRange, viewMode: defaultPreset.view_mode || DEFAULT_DASHBOARD_FILTERS.viewMode, owner: defaultPreset.filters?.owner || "all", team: defaultPreset.filters?.team || "all", agencyId: defaultPreset.filters?.agencyId || "all", employerId: defaultPreset.filters?.employerId || "all", caseType: defaultPreset.filters?.caseType || "all", stage: defaultPreset.filters?.stage || "all" });
      setSelectedPresetId(defaultPreset.id);
    } else {
      setFilters((current) => ({ ...current, viewMode: user.role === "admin" ? "executive" : "my" }));
    }
    setHasInitializedPreferences(true);
  }, [hasInitializedPreferences, presets, presetsFetched, user]);

  const dashboardPageModel = useMemo(() => getDashboardPageModel({
    cases,
    tasks,
    enrollments,
    renewals,
    scenarios,
    exceptions,
    proposals,
    agencies,
    filters,
    user,
  }), [cases, tasks, enrollments, renewals, scenarios, exceptions, proposals, agencies, filters, user]);

  const options = dashboardPageModel.options;
  const scopedData = dashboardPageModel.scopedData;
  const summary = dashboardPageModel.summary;
  const charts = dashboardPageModel.charts;

  const lastUpdated = useMemo(() => {
    const timestamps = [casesUpdatedAt, tasksUpdatedAt, enrollmentsUpdatedAt, renewalsUpdatedAt, scenariosUpdatedAt, exceptionsUpdatedAt, proposalsUpdatedAt, agenciesUpdatedAt, presetsUpdatedAt].filter(Boolean);
    return timestamps.length === 0 ? "" : format(new Date(Math.max(...timestamps)), "MMM d, yyyy h:mm a");
  }, [casesUpdatedAt, tasksUpdatedAt, enrollmentsUpdatedAt, renewalsUpdatedAt, scenariosUpdatedAt, exceptionsUpdatedAt, proposalsUpdatedAt, agenciesUpdatedAt, presetsUpdatedAt]);

  const [showSaveViewPanel, setShowSaveViewPanel] = useState(false);
  const [saveViewName, setSaveViewName] = useState("");

  const handleFilterChange = (key, value) => { setSelectedPresetId("none"); setFilters((current) => ({ ...current, [key]: value })); };
  const handleRefresh = async () => { setIsRefreshing(true); await Promise.all([["cases"],["tasks-pending"],["enrollments"],["renewals"],["scenarios-all"],["exceptions"],["proposals"],["agencies"],DASHBOARD_PRESET_QUERY_KEY].map((queryKey) => queryClient.invalidateQueries({ queryKey }))); setIsRefreshing(false); };
  const handleSaveView = () => {
    setSaveViewName("");
    setShowSaveViewPanel(true);
  };

  const handleSaveViewConfirm = async () => {
    if (!saveViewName.trim()) return;
    await base44.entities.DashboardViewPreset.create({
      name: saveViewName.trim(),
      view_mode: filters.viewMode,
      date_range: filters.dateRange,
      filters: { owner: filters.owner, team: filters.team, agencyId: filters.agencyId, employerId: filters.employerId, caseType: filters.caseType, stage: filters.stage },
      is_default: false,
    });
    await queryClient.invalidateQueries({ queryKey: DASHBOARD_PRESET_QUERY_KEY });
    setShowSaveViewPanel(false);
  };
  const handlePresetChange = (presetId) => {
    if (presetId === "none") { setSelectedPresetId("none"); return; }
    const preset = presets.find((item) => item.id === presetId);
    if (!preset) return;
    setSelectedPresetId(presetId);
    setFilters({ dateRange: preset.date_range || DEFAULT_DASHBOARD_FILTERS.dateRange, viewMode: preset.view_mode || DEFAULT_DASHBOARD_FILTERS.viewMode, owner: preset.filters?.owner || "all", team: preset.filters?.team || "all", agencyId: preset.filters?.agencyId || "all", employerId: preset.filters?.employerId || "all", caseType: preset.filters?.caseType || "all", stage: preset.filters?.stage || "all" });
  };
  const handleSetDefault = async () => {
    if (!selectedPresetId || selectedPresetId === "none") return;
    await Promise.all(presets.map((preset) => base44.entities.DashboardViewPreset.update(preset.id, { is_default: preset.id === selectedPresetId })));
    await queryClient.invalidateQueries({ queryKey: DASHBOARD_PRESET_QUERY_KEY });
  };

  if (isLoading || isUserLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Benefits operations overview" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-5 space-y-3">
                <div className="h-3 w-24 rounded-md bg-muted animate-pulse" />
                <div className="h-8 w-16 rounded-md bg-muted animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardContent className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-12 w-full rounded-lg bg-muted animate-pulse" />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-16 w-full rounded-lg bg-muted animate-pulse" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  if (cases.length === 0) {
    return <div className="space-y-6"><PageHeader title="Dashboard" description="Overview of your benefits operations" actions={<Button asChild className="shadow-sm"><Link to="/cases/new"><Briefcase className="w-4 h-4 mr-2" /> New Case</Link></Button>} /><div className="flex flex-col items-center justify-center py-24 text-center"><div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-6"><Briefcase className="w-9 h-9 text-primary" /></div><h2 className="text-xl font-bold mb-2">Welcome to Connect Quote 360</h2><p className="text-sm text-muted-foreground max-w-md mb-8">Your benefits operating platform is ready. Start by creating your first benefit case.</p><div className="flex gap-3"><Button asChild className="shadow-sm"><Link to="/cases/new"><Briefcase className="w-4 h-4 mr-2" /> Create First Case</Link></Button><Button asChild variant="outline"><Link to="/employers">Add Employer Groups</Link></Button></div></div></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Benefits operations overview" />
      <DashboardControls filters={filters} options={options} presets={presets} selectedPresetId={selectedPresetId} onChange={handleFilterChange} onPresetChange={handlePresetChange} onSaveView={handleSaveView} onSetDefault={handleSetDefault} onRefresh={handleRefresh} isRefreshing={isRefreshing} lastUpdated={lastUpdated} />
      <QuickActions />
      {showSaveViewPanel && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Save Dashboard View</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="view-name">View Name</Label>
              <Input
                id="view-name"
                className="mt-1.5"
                placeholder="e.g. My Open Cases View"
                value={saveViewName}
                onChange={(e) => setSaveViewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSaveViewConfirm(); }}
                autoFocus
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSaveViewPanel(false)}>Cancel</Button>
              <Button onClick={handleSaveViewConfirm} disabled={!saveViewName.trim()}>Save View</Button>
            </div>
          </CardContent>
        </Card>
      )}
      <CensusGapAlert cases={scopedData.currentCases} />
      <TodaysPriorities tasks={scopedData.currentTasks} exceptions={scopedData.currentExceptions} cases={scopedData.currentCases} enrollments={scopedData.currentEnrollments} />
      <DashboardMetricGrid summary={summary} />
      <DashboardSecondaryMetrics summary={summary} currentEnrollments={scopedData.currentEnrollments} upcomingRenewalsCount={charts.upcomingRenewals(scopedData.currentRenewals)} />
      <ProposalsKPI proposals={scopedData.currentProposals} />
      <ComplianceAlerts cases={scopedData.currentCases} scenarios={scopedData.currentScenarios} />
      <RevenueMetrics scenarios={scopedData.currentScenarios} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <InteractivePipeline cases={scopedData.currentCases} />
        <Card><CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Case Types</CardTitle></CardHeader><CardContent>{charts.typeData.length === 0 ? (<div className="flex items-center justify-center h-44 text-sm text-muted-foreground">No data</div>) : (<div className="flex flex-col items-center"><ResponsiveContainer width="100%" height={140}><PieChart><Pie data={charts.typeData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">{charts.typeData.map((_, index) => <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}</Pie><Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} /></PieChart></ResponsiveContainer><div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">{charts.typeData.map((item, index) => <div key={index} className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[index % PIE_COLORS.length] }} /><span className="text-[11px] text-muted-foreground truncate">{item.name}</span><span className="text-[11px] font-semibold ml-auto">{item.value}</span></div>)}</div></div>)}</CardContent></Card>
        <CarrierDistribution scenarios={scopedData.currentScenarios} />
      </div>

      <DashboardActivityPanels monthlyData={charts.monthlyData} currentCases={scopedData.currentCases} currentTasks={scopedData.currentTasks} openExceptions={summary.openExceptions} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><TeamWorkload cases={scopedData.currentCases} tasks={scopedData.currentTasks} /><EnrollmentForecast enrollments={scopedData.currentEnrollments} /><CycleTiming cases={scopedData.currentCases} /></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><EnrollmentCountdowns enrollments={scopedData.currentEnrollments} /><StalledCases cases={scopedData.currentCases} /></div>

      {scopedData.currentRenewals.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-base font-semibold flex items-center gap-2"><RefreshCw className="w-4 h-4 text-primary" /> Upcoming Renewals</CardTitle><Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground"><Link to="/renewals">View all</Link></Button></div></CardHeader>
          <CardContent><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{scopedData.currentRenewals.slice(0, 6).map((item) => { const daysUntil = item.renewal_date ? differenceInDays(new Date(item.renewal_date), new Date()) : null; return <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors"><div><p className="text-sm font-medium">{item.employer_name || "Unknown"}</p><p className="text-xs text-muted-foreground">{item.renewal_date ? format(new Date(item.renewal_date), "MMM d, yyyy") : "TBD"}</p></div><div className="flex items-center gap-2">{daysUntil !== null && <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${daysUntil <= 30 ? "bg-red-100 text-red-700" : daysUntil <= 60 ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>{daysUntil}d</span>}<span className="inline-flex items-center rounded-md border border-border bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground capitalize">{item.status?.replace(/_/g, " ") || "unknown"}</span></div></div>; })}</div></CardContent>
        </Card>
      )}
    </div>
  );
}