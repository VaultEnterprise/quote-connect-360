import React, { useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Briefcase,
  FileText,
  ClipboardCheck,
  AlertCircle,
  RefreshCw,
  Users,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import MetricCard from "@/components/shared/MetricCard";
import PageHeader from "@/components/shared/PageHeader";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";
import TodaysPriorities from "@/components/dashboard/TodaysPriorities";
import InteractivePipeline from "@/components/dashboard/InteractivePipeline";
import EnrollmentCountdowns from "@/components/dashboard/EnrollmentCountdowns";
import StalledCases from "@/components/dashboard/StalledCases";
import QuickActions from "@/components/dashboard/QuickActions";
import CensusGapAlert from "@/components/dashboard/CensusGapAlert";
import SystemHealthStrip from "@/components/dashboard/SystemHealthStrip";
import DomainControlGrid from "@/components/dashboard/DomainControlGrid";
import RoutedPagesDirectory from "@/components/dashboard/RoutedPagesDirectory";
import WorkflowBottlenecksPanel from "@/components/dashboard/WorkflowBottlenecksPanel";
import ActionCenterPanel from "@/components/dashboard/ActionCenterPanel";

export default function Dashboard() {
  const queryClient = useQueryClient();

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
    queryFn: () => base44.entities.EnrollmentWindow.list("-created_date", 100),
  });

  const { data: exceptions = [] } = useQuery({
    queryKey: ["exceptions"],
    queryFn: () => base44.entities.ExceptionItem.list("-created_date", 50),
  });

  const { data: censusVersions = [] } = useQuery({
    queryKey: ["dashboard-census-versions"],
    queryFn: () => base44.entities.CensusVersion.list("-created_date", 200),
  });

  const { data: quoteScenarios = [] } = useQuery({
    queryKey: ["dashboard-quote-scenarios"],
    queryFn: () => base44.entities.QuoteScenario.list("-created_date", 200),
  });


  const { data: renewals = [] } = useQuery({
    queryKey: ["dashboard-renewals"],
    queryFn: () => base44.entities.RenewalCycle.list("-created_date", 200),
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["dashboard-documents"],
    queryFn: () => base44.entities.Document.list("-created_date", 200),
  });

  const { data: employers = [] } = useQuery({
    queryKey: ["dashboard-employers"],
    queryFn: () => base44.entities.EmployerGroup.list("-created_date", 200),
  });

  const { data: proposals = [] } = useQuery({
    queryKey: ["dashboard-proposals"],
    queryFn: () => base44.entities.Proposal.list("-created_date", 200),
  });

  const { data: employeeEnrollments = [] } = useQuery({
    queryKey: ["dashboard-employee-enrollments"],
    queryFn: () => base44.entities.EmployeeEnrollment.list("-created_date", 500),
  });

  useEffect(() => {
    const unsubscribeCases = base44.entities.BenefitCase.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
    });

    const unsubscribeTasks = base44.entities.CaseTask.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["tasks-pending"] });
    });

    const unsubscribeEnrollments = base44.entities.EnrollmentWindow.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    });

    const unsubscribeExceptions = base44.entities.ExceptionItem.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["exceptions"] });
    });

    const unsubscribeCensusVersions = base44.entities.CensusVersion.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-census-versions"] });
    });

    const unsubscribeQuoteScenarios = base44.entities.QuoteScenario.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-quote-scenarios"] });
    });

    const unsubscribeRenewals = base44.entities.RenewalCycle.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-renewals"] });
    });

    const unsubscribeDocuments = base44.entities.Document.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-documents"] });
    });

    const unsubscribeEmployers = base44.entities.EmployerGroup.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-employers"] });
    });

    const unsubscribeProposals = base44.entities.Proposal.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-proposals"] });
    });

    const unsubscribeEmployeeEnrollments = base44.entities.EmployeeEnrollment.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-employee-enrollments"] });
    });

    return () => {
      unsubscribeCases?.();
      unsubscribeTasks?.();
      unsubscribeEnrollments?.();
      unsubscribeExceptions?.();
      unsubscribeCensusVersions?.();
      unsubscribeQuoteScenarios?.();
      unsubscribeRenewals?.();
      unsubscribeDocuments?.();
      unsubscribeEmployers?.();
      unsubscribeProposals?.();
      unsubscribeEmployeeEnrollments?.();
    };
  }, [queryClient]);

  const activeCases = useMemo(() => cases.filter((c) => !["closed", "renewed"].includes(c.stage)), [cases]);
  const quotingCases = useMemo(() => cases.filter((c) => ["ready_for_quote", "quoting"].includes(c.stage)), [cases]);
  const enrollmentOpen = useMemo(() => enrollments.filter((e) => ["open", "closing_soon"].includes(e.status)), [enrollments]);
  const overdueTasks = useMemo(() => tasks.filter((t) => t.due_date && new Date(t.due_date) < new Date()), [tasks]);
  const censusIssues = useMemo(() => cases.filter((c) => c.census_status === "issues_found").length, [cases]);
  const stalledCasesCount = useMemo(() => cases.filter((c) => {
    if (["closed", "renewed", "active"].includes(c.stage)) return false;
    const last = c.last_activity_date || c.updated_date || c.created_date;
    return last && ((Date.now() - new Date(last).getTime()) / 86400000) >= 7;
  }).length, [cases]);
  const openExceptions = useMemo(() => exceptions.filter((e) => !["resolved", "dismissed"].includes(e.status)).length, [exceptions]);
  const activeRenewals = useMemo(() => renewals.filter((r) => r.status !== "completed").length, [renewals]);
  const draftQuotes = useMemo(() => quoteScenarios.filter((q) => q.status === "draft").length, [quoteScenarios]);
  const proposalAttention = useMemo(() => proposals.filter((p) => ["sent", "viewed"].includes(p.status)).length, [proposals]);
  const pendingSignatures = useMemo(() => employeeEnrollments.filter((e) => e.docusign_status && !["not_sent", "completed"].includes(e.docusign_status)).length, [employeeEnrollments]);
  const healthyDomains = useMemo(() => {
    const checks = [
      openExceptions === 0,
      censusIssues === 0,
      overdueTasks.length === 0,
      stalledCasesCount === 0,
    ];
    return checks.filter(Boolean).length;
  }, [openExceptions, censusIssues, overdueTasks.length, stalledCasesCount]);

  const bottlenecks = useMemo(() => {
    const items = [
      { label: "Overdue Tasks", value: overdueTasks.length, detail: "Pending work requiring intervention", href: "/tasks" },
      { label: "Open Exceptions", value: openExceptions, detail: "Active issues blocking workflows", href: "/exceptions" },
      { label: "Draft Quotes", value: draftQuotes, detail: "Scenarios waiting for calculation", href: "/quotes" },
      { label: "Pending Signatures", value: pendingSignatures, detail: "Employee forms still in DocuSign flow", href: "/employee-management" },
      { label: "Proposal Attention", value: proposalAttention, detail: "Sent/viewed proposals awaiting action", href: "/proposals" },
    ];
    return items.filter((item) => item.value > 0).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [overdueTasks.length, openExceptions, draftQuotes, pendingSignatures, proposalAttention]);

  const actionCenterItems = useMemo(() => [
    { label: "Open urgent cases", href: "/cases", meta: `${activeCases.length} active` },
    { label: "Review census pipeline", href: "/census", meta: `${censusVersions.length} uploads` },
    { label: "Calculate draft quotes", href: "/quotes", meta: `${draftQuotes} drafts` },
    { label: "Work enrollment windows", href: "/enrollment", meta: `${enrollmentOpen.length} open` },
    { label: "Resolve exceptions", href: "/exceptions", meta: `${openExceptions} open` },
    { label: "Process renewals", href: "/renewals", meta: `${activeRenewals} active` },
  ], [activeCases.length, censusVersions.length, draftQuotes, enrollmentOpen.length, openExceptions, activeRenewals]);

  const domainCards = useMemo(() => [
    {
      key: "cases",
      label: "Cases",
      description: "Core workflow orchestration and stage movement",
      href: "/cases",
      icon: Briefcase,
      stats: [
        { label: "Open", value: activeCases.length },
        { label: "Stalled", value: stalledCasesCount },
        { label: "Urgent", value: cases.filter((c) => c.priority === "urgent").length },
        { label: "Quoting", value: quotingCases.length },
      ],
      actions: [
        { label: "Open case workspace", href: "/cases" },
        { label: "Create new case", href: "/cases/new" },
      ],
    },
    {
      key: "census",
      label: "Census",
      description: "Data intake, validation, and census quality monitoring",
      href: "/census",
      icon: Users,
      stats: [
        { label: "Versions", value: censusVersions.length },
        { label: "Issues", value: censusIssues },
        { label: "Not Started", value: cases.filter((c) => c.census_status === "not_started").length },
        { label: "Validated", value: cases.filter((c) => c.census_status === "validated").length },
      ],
      actions: [
        { label: "Manage census data", href: "/census" },
        { label: "Open active cases", href: "/cases" },
      ],
    },
    {
      key: "quotes",
      label: "Quotes",
      description: "Scenario generation, pricing, and recommendation flow",
      href: "/quotes",
      icon: FileText,
      stats: [
        { label: "Scenarios", value: quoteScenarios.length },
        { label: "Draft", value: draftQuotes },
        { label: "Running", value: quoteScenarios.filter((q) => q.status === "running").length },
        { label: "Completed", value: quoteScenarios.filter((q) => q.status === "completed").length },
      ],
      actions: [
        { label: "Open quote engine", href: "/quotes" },
        { label: "Review proposals", href: "/proposals" },
      ],
    },
    {
      key: "enrollment",
      label: "Enrollment",
      description: "Window operations, participation, and employee execution",
      href: "/enrollment",
      icon: ClipboardCheck,
      stats: [
        { label: "Open", value: enrollmentOpen.length },
        { label: "Windows", value: enrollments.length },
        { label: "Employees", value: employeeEnrollments.length },
        { label: "Signatures", value: pendingSignatures },
      ],
      actions: [
        { label: "Manage enrollment", href: "/enrollment" },
        { label: "Employee management", href: "/employee-management" },
      ],
    },
    {
      key: "renewals",
      label: "Renewals",
      description: "Renewal pipeline, pricing shifts, and decision state",
      href: "/renewals",
      icon: RefreshCw,
      stats: [
        { label: "Active", value: activeRenewals },
        { label: "Overdue", value: renewals.filter((r) => r.renewal_date && new Date(r.renewal_date) < new Date() && r.status !== "completed").length },
        { label: "Decisions", value: renewals.filter((r) => r.status === "decision_made").length },
        { label: "Completed", value: renewals.filter((r) => r.status === "completed").length },
      ],
      actions: [
        { label: "Open renewal desk", href: "/renewals" },
        { label: "Employer renewals", href: "/employers" },
      ],
    },
    {
      key: "supporting",
      label: "Support Systems",
      description: "Employers, proposals, exceptions, documents, and admin workflows",
      href: "/settings",
      icon: Settings,
      stats: [
        { label: "Employers", value: employers.length },
        { label: "Documents", value: documents.length },
        { label: "Proposals", value: proposals.length },
        { label: "Exceptions", value: openExceptions },
      ],
      actions: [
        { label: "Employer workspace", href: "/employers" },
        { label: "Proposal builder", href: "/proposals" },
        { label: "Exception queue", href: "/exceptions" },
      ],
    },
  ], [activeCases.length, stalledCasesCount, cases, quotingCases.length, censusVersions.length, censusIssues, quoteScenarios, draftQuotes, enrollmentOpen.length, employeeEnrollments.length, pendingSignatures, activeRenewals, renewals, employers.length, documents.length, proposals.length, openExceptions, enrollments.length]);

  const routedPages = useMemo(() => [
    { label: "Dashboard", href: "/" },
    { label: "Cases", href: "/cases" },
    { label: "New Case", href: "/cases/new" },
    { label: "Census", href: "/census" },
    { label: "Quotes", href: "/quotes" },
    { label: "Enrollment", href: "/enrollment" },
    { label: "Renewals", href: "/renewals" },
    { label: "Tasks", href: "/tasks" },
    { label: "Employers", href: "/employers" },
    { label: "Plans", href: "/plans" },
    { label: "Proposals", href: "/proposals" },
    { label: "Exceptions", href: "/exceptions" },
    { label: "Contributions", href: "/contributions" },
    { label: "Employee Portal", href: "/employee-portal" },
    { label: "Employee Management", href: "/employee-management" },
    { label: "Employee Enrollment", href: "/employee-enrollment" },
    { label: "Employee Benefits", href: "/employee-benefits" },
    { label: "Employer Portal", href: "/employer-portal" },
    { label: "PolicyMatch", href: "/policymatch" },
    { label: "Integration Infra", href: "/integration-infra" },
    { label: "Settings", href: "/settings" },
    { label: "Help", href: "/help" },
    { label: "Help Admin", href: "/help-admin" },
    { label: "Help Dashboard", href: "/help-dashboard" },
    { label: "Help Coverage", href: "/help-coverage" },
    { label: "Help Analytics", href: "/help-analytics" },
    { label: "Help Targets", href: "/help-target-registry" },
    { label: "Help Manuals", href: "/help-manual-manager" },
    { label: "ACA Library", href: "/aca-library" },
  ], []);

  if (isLoading) return <DashboardSkeleton />;

  if (cases.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Overview of your benefits operations"
          actions={<Link to="/cases/new"><Button><Briefcase className="w-4 h-4 mr-2" /> New Case</Button></Link>}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Unified command center for cases, census, quotes, enrollment, renewals, documents, exceptions, and routed platform workflows"
        actions={<Link to="/cases/new"><Button><Briefcase className="w-4 h-4 mr-2" /> New Case</Button></Link>}
      />

      <QuickActions />

      <SystemHealthStrip
        metrics={{
          exceptions: openExceptions,
          censusIssues,
          stalledCases: stalledCasesCount,
          healthy: healthyDomains,
        }}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Active Cases" value={activeCases.length} icon={Briefcase} trendLabel={`${cases.length} total`} />
        <MetricCard label="Quoting Now" value={quotingCases.length} icon={FileText} trendLabel={`${draftQuotes} drafts waiting`} />
        <MetricCard label="Open Enrollments" value={enrollmentOpen.length} icon={ClipboardCheck} trendLabel={`${pendingSignatures} signatures pending`} />
        <MetricCard label="Overdue Tasks" value={overdueTasks.length} icon={AlertCircle} trend={overdueTasks.length > 0 ? "down" : undefined} trendLabel={overdueTasks.length > 0 ? "needs attention" : "on track"} />
      </div>

      <ActionCenterPanel actions={actionCenterItems} />

      <CensusGapAlert cases={cases} />

      <TodaysPriorities tasks={tasks} exceptions={exceptions} cases={cases} enrollments={enrollments} />

      <WorkflowBottlenecksPanel items={bottlenecks} />

      <DomainControlGrid domains={domainCards} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InteractivePipeline cases={cases} />
        <EnrollmentCountdowns enrollments={enrollments} />
      </div>

      <StalledCases cases={cases} />

      <RoutedPagesDirectory pages={routedPages} />
    </div>
  );
}