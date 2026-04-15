import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Building2, CheckCircle, Clock, Menu, X, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { useNavigate, useSearchParams } from "react-router-dom";

// Employer-specific components
import ActionRequiredBanner from "@/components/employer/ActionRequiredBanner";
import BrokerContactCard    from "@/components/employer/BrokerContactCard";
import StatusTimeline       from "@/components/employer/StatusTimeline";
import EnrollmentDrillDown  from "@/components/employer/EnrollmentDrillDown";
import CaseLifecycleStatus  from "@/components/employer/CaseLifecycleStatus";
import EnrollmentCountdown  from "@/components/employer/EnrollmentCountdown";
import ProposalEnhanced     from "@/components/employer/ProposalEnhanced";
import CommunicationHub     from "@/components/employer/CommunicationHub";
import FinancialModeling    from "@/components/employer/FinancialModeling";
import RenewalStatus        from "@/components/employer/RenewalStatus";
import DocumentsCenter      from "@/components/employer/DocumentsCenter";
import PlanExplainerModal   from "@/components/employer/PlanExplainerModal";

export default function EmployerPortal() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const employerGroupId = searchParams.get("employer_id") || null;

  if (!employerGroupId) {
    return (
      <div className="max-w-xl mx-auto py-20">
        <EmptyState
          icon={Building2}
          title="Employer Access Required"
          description="This portal link is missing the employer access context. Please use the link provided by your broker or administrator."
        />
      </div>
    );
  }
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Data ────────────────────────────────────────────────────────────────────
  // Portal is hard-scoped by employer_id query param until dedicated employer auth is added.
  const { data: cases = [] } = useQuery({
    queryKey: ["employer-cases", employerGroupId],
    queryFn: () => employerGroupId
      ? base44.entities.BenefitCase.filter({ employer_group_id: employerGroupId }, "-created_date", 50)
      : Promise.resolve([]),
  });

  const activeCase = cases.find(c => c.id === selectedCaseId) || cases[0];
  const caseId = activeCase?.id;

  const { data: tasks = [] } = useQuery({
    queryKey: ["case-tasks", caseId],
    queryFn: () => base44.entities.CaseTask.filter({ case_id: caseId }),
    enabled: !!caseId,
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["enrollments-employer", caseId],
    queryFn: () => base44.entities.EnrollmentWindow.filter({ case_id: caseId }),
    enabled: !!caseId,
  });

  const { data: proposals = [] } = useQuery({
    queryKey: ["proposals-employer", caseId],
    queryFn: () => base44.entities.Proposal.filter({ case_id: caseId }),
    enabled: !!caseId,
  });

  const { data: docs = [] } = useQuery({
    queryKey: ["documents", caseId],
    queryFn: () => base44.entities.Document.filter({ case_id: caseId }),
    enabled: !!caseId,
  });

  const { data: renewalCycles = [] } = useQuery({
    queryKey: ["renewals", caseId],
    queryFn: () => base44.entities.RenewalCycle.filter({ case_id: caseId }),
    enabled: !!caseId,
  });

  // ── Derived ──────────────────────────────────────────────────────────────────
  const enrollment      = enrollments[0] || null;
  const pendingProposals = proposals.filter(p => ["sent", "viewed"].includes(p.status));
  const openTasks       = tasks.filter(t => !["completed", "cancelled"].includes(t.status));
  const renewalCycle    = renewalCycles[0] || null;

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (cases.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-20">
        <EmptyState
          icon={Building2}
          title="No Active Cases"
          description="You don't have any active benefit cases. Contact your broker to get started."
        />
      </div>
    );
  }

  // ── Quick metrics ─────────────────────────────────────────────────────────────
  const enrollPct = enrollment
    ? Math.round(((enrollment.enrolled_count || 0) / (enrollment.total_eligible || 1)) * 100)
    : 0;

  const metrics = [
    { label: "Employees",   value: activeCase?.employee_count || "—",    color: "text-foreground" },
    { label: "Proposals",   value: proposals.length,                     color: "text-foreground",
      badge: pendingProposals.length > 0 ? `${pendingProposals.length} pending` : null,
      badgeColor: "bg-amber-100 text-amber-700" },
    { label: "Enrolled",    value: `${enrollPct}%`,                      color: enrollPct >= 75 ? "text-green-600" : enrollPct >= 50 ? "text-amber-600" : "text-destructive" },
    { label: "Open Tasks",  value: openTasks.length,                     color: openTasks.length > 0 ? "text-amber-600" : "text-green-600" },
  ];

  return (
    <div className="space-y-6">

      {/* ── Branded header — responsive ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary flex-shrink-0" />
            <h1 className="text-xl sm:text-2xl font-bold truncate">{activeCase?.employer_name || "Employer Portal"}</h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Benefits portal · {activeCase?.case_number || `Case #${caseId?.slice(-6)}`}
            {activeCase?.effective_date && ` · Effective ${format(new Date(activeCase.effective_date), "MMM d, yyyy")}`}
          </p>
        </div>

        {/* Case status display — no cross-employer switcher for security */}
        <div className="flex gap-2 flex-shrink-0">
          <div className="flex items-center gap-2">
              <StatusBadge status={activeCase?.stage} />
              {activeCase?.priority !== "normal" && <StatusBadge status={activeCase?.priority} />}
            </div>
          {/* Mobile sidebar toggle */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden h-9 w-9"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* ── Action Required hero ── */}
      <ActionRequiredBanner
        pendingProposals={pendingProposals}
        enrollment={enrollment}
        openTasks={openTasks}
        onGoToProposals={() => setActiveTab("proposals")}
        onGoToEnrollment={() => setActiveTab("enrollment")}
        onGoToTasks={() => setActiveTab("tasks")}
      />

      {/* ── Quick metrics strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {metrics.map(m => (
          <Card key={m.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{m.label}</p>
              {m.badge && (
                <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${m.badgeColor}`}>
                  {m.badge}
                </span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Help & Support Navigation ── */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
        <div className="flex items-center gap-2 text-xs text-blue-700">
          <HelpCircle className="w-4 h-4" />
          <span className="font-medium">Need help with your enrollment or proposals?</span>
        </div>
        <button onClick={() => navigate("/help")} className="text-xs font-medium text-primary hover:underline">
          View Help Center →
        </button>
      </div>

      {/* ── Main content: tabs + right sidebar — responsive ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-muted/50 flex-wrap h-auto justify-start gap-1 md:gap-2 w-full md:w-auto">
              <TabsTrigger value="overview" className="text-xs md:text-sm">Overview</TabsTrigger>
              <TabsTrigger value="proposals" className="text-xs md:text-sm">
                Proposals
                {pendingProposals.length > 0 && (
                  <Badge className="ml-1.5 h-4 px-1 text-[10px] bg-primary text-white">
                    {pendingProposals.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="enrollment" className="text-xs md:text-sm">Enrollment</TabsTrigger>
              <TabsTrigger value="tasks" className="text-xs md:text-sm">
                Tasks
                {openTasks.length > 0 && (
                  <Badge className="ml-1.5 h-4 px-1 text-[10px] bg-amber-500 text-white">
                    {openTasks.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="documents" className="text-xs md:text-sm">Docs</TabsTrigger>
            </TabsList>

            {/* Overview — status timeline + lifecycle */}
            <TabsContent value="overview" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <StatusTimeline currentStage={activeCase?.stage || "draft"} />
                </div>
                <div>
                  <CaseLifecycleStatus stage={activeCase?.stage} targetCloseDate={activeCase?.target_close_date} />
                </div>
              </div>
              {activeCase?.notes && (
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Notes from your Broker</p>
                    <p className="text-sm leading-relaxed">{activeCase.notes}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Proposals — enhanced with comparisons */}
            <TabsContent value="proposals" className="mt-4 space-y-4">
              {proposals.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No proposals yet. Check back soon.</p>
                  </CardContent>
                </Card>
              ) : (
                proposals.map((proposal, idx) => (
                  <div key={idx} className="space-y-3">
                    <ProposalEnhanced proposal={proposal} priorProposal={idx > 0 ? proposals[idx - 1] : null} />
                    <PlanExplainerModal plans={proposal.plan_summary || []} />
                  </div>
                ))
              )}
            </TabsContent>

            {/* Enrollment — with countdown */}
            <TabsContent value="enrollment" className="mt-4 space-y-4">
              {enrollment && <EnrollmentCountdown enrollment={enrollment} caseId={caseId} />}
              <EnrollmentDrillDown enrollment={enrollment} caseId={caseId} />
            </TabsContent>

            {/* Action Items */}
            <TabsContent value="tasks" className="mt-4 space-y-2">
              {openTasks.length === 0 ? (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-5 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-green-800 text-sm">All clear!</p>
                      <p className="text-xs text-green-700">No outstanding action items from your broker.</p>
                    </div>
                  </CardContent>
                </Card>
              ) : openTasks.map(t => {
                const isOverdue = t.due_date && new Date(t.due_date) < new Date();
                return (
                  <Card key={t.id} className={isOverdue ? "border-destructive/30" : ""}>
                    <CardContent className="p-4 flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{t.title}</p>
                        {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
                        {t.due_date && (
                          <p className={`text-xs mt-1 flex items-center gap-1 ${isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                            <Clock className="w-3 h-3" />
                            Due {format(new Date(t.due_date), "MMM d, yyyy")}
                            {isOverdue && " — Overdue"}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={t.priority} className="flex-shrink-0" />
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            {/* Documents — new center */}
            <TabsContent value="documents" className="mt-4">
              <DocumentsCenter docs={docs} />
            </TabsContent>
          </Tabs>

          {/* Financial modeling & renewal (below tabs on mobile) */}
          {proposals.length > 0 && (
            <FinancialModeling proposal={proposals[0]} employeeCount={activeCase?.employee_count} />
          )}

          {renewalCycle && (
            <RenewalStatus renewalCycle={renewalCycle} currentCaseExpiry={activeCase?.renewal_date} />
          )}
        </div>

        {/* ── Right sidebar — mobile collapsible ── */}
        <div
          className={`space-y-4 ${sidebarOpen ? "block" : "hidden"} lg:block transition-all`}
        >
          <CommunicationHub
            brokerName={activeCase?.assigned_to}
            brokerEmail={activeCase?.assigned_to}
            caseId={caseId}
          />

          <BrokerContactCard
            brokerEmail={activeCase?.assigned_to}
            brokerName={activeCase?.assigned_to}
            agencyName={proposals[0]?.agency_name || null}
          />

          {/* Quick Links Card */}
          <Card>
           <CardContent className="p-4 space-y-2">
             <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quick Links</p>
             <div className="space-y-1.5">
               <button onClick={() => navigate("/help")} className="block w-full text-left text-xs px-2 py-1.5 rounded hover:bg-muted text-primary font-medium">
                 Help Center
               </button>
               <button onClick={() => navigate("/employer-portal")} className="block w-full text-left text-xs px-2 py-1.5 rounded hover:bg-muted text-foreground font-medium">
                 ↻ Refresh Portal
               </button>
             </div>
           </CardContent>
          </Card>

          {/* Case info card */}
          <Card>
           <CardContent className="p-4">
             <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Case Details</p>
             <div className="space-y-2 text-xs md:text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Case #</span>
                  <span className="font-medium text-right">{activeCase?.case_number || caseId?.slice(-6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="capitalize text-right">{activeCase?.case_type?.replace(/_/g, " ") || "—"}</span>
                </div>
                {activeCase?.effective_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Effective</span>
                    <span className="text-right">{format(new Date(activeCase.effective_date), "MMM d")}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge status={activeCase?.stage} className="text-xs" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}