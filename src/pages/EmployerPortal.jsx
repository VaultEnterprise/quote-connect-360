import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Building2, CheckCircle, Clock, Menu, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { useAuth } from "@/lib/AuthContext";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";

// Employer-specific components
import ActionRequiredBanner from "@/components/employer/ActionRequiredBanner";
import BrokerContactCard    from "@/components/employer/BrokerContactCard";
import StatusTimeline       from "@/components/employer/StatusTimeline";
import ProposalReviewPanel  from "@/components/employer/ProposalReviewPanel";
import EnrollmentDrillDown  from "@/components/employer/EnrollmentDrillDown";
import DocumentsPanel       from "@/components/employer/DocumentsPanel";
import CaseLifecycleStatus  from "@/components/employer/CaseLifecycleStatus";
import EnrollmentCountdown  from "@/components/employer/EnrollmentCountdown";
import ProposalEnhanced     from "@/components/employer/ProposalEnhanced";
import CommunicationHub     from "@/components/employer/CommunicationHub";
import FinancialModeling    from "@/components/employer/FinancialModeling";
import RenewalStatus        from "@/components/employer/RenewalStatus";
import DocumentsCenter      from "@/components/employer/DocumentsCenter";
import PlanExplainerModal   from "@/components/employer/PlanExplainerModal";

export default function EmployerPortal() {
  const { user } = useAuth();
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // ── Data ────────────────────────────────────────────────────────────────────
  const { data: cases = [] } = useQuery({
    queryKey: ["employer-cases"],
    queryFn: () => base44.entities.BenefitCase.list("-created_date", 50),
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

  // ── Derived ──────────────────────────────────────────────────────────────────
  const enrollment      = enrollments[0] || null;
  const pendingProposals = proposals.filter(p => ["sent", "viewed"].includes(p.status));
  const openTasks       = tasks.filter(t => !["completed", "cancelled"].includes(t.status));

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

      {/* ── Branded header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold">{activeCase?.employer_name || "Employer Portal"}</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Benefits portal · {activeCase?.case_number || `Case #${caseId?.slice(-6)}`}
            {activeCase?.effective_date && ` · Effective ${format(new Date(activeCase.effective_date), "MMM d, yyyy")}`}
          </p>
        </div>

        {/* Case switcher — always visible */}
        {cases.length > 1 ? (
          <Select value={selectedCaseId || cases[0]?.id} onValueChange={setSelectedCaseId}>
            <SelectTrigger className="w-60 flex-shrink-0">
              <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {cases.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.employer_name} — {c.case_number || c.id.slice(-6)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="flex items-center gap-2">
            <StatusBadge status={activeCase?.stage} />
            {activeCase?.priority !== "normal" && <StatusBadge status={activeCase?.priority} />}
          </div>
        )}
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

      {/* ── Main content: tabs + right sidebar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-muted/50 flex-wrap h-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="proposals">
                Proposals
                {pendingProposals.length > 0 && (
                  <Badge className="ml-1.5 h-4 px-1 text-[10px] bg-primary text-white">
                    {pendingProposals.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
              <TabsTrigger value="tasks">
                Action Items
                {openTasks.length > 0 && (
                  <Badge className="ml-1.5 h-4 px-1 text-[10px] bg-amber-500 text-white">
                    {openTasks.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            {/* Overview — status timeline */}
            <TabsContent value="overview" className="mt-4">
              <StatusTimeline currentStage={activeCase?.stage || "draft"} />
              {activeCase?.notes && (
                <Card className="mt-4">
                  <CardContent className="p-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Notes from your Broker</p>
                    <p className="text-sm leading-relaxed">{activeCase.notes}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Proposals */}
            <TabsContent value="proposals" className="mt-4">
              <ProposalReviewPanel proposals={proposals} caseId={caseId} />
            </TabsContent>

            {/* Enrollment */}
            <TabsContent value="enrollment" className="mt-4">
              <EnrollmentDrillDown enrollment={enrollment} caseId={caseId} />
            </TabsContent>

            {/* Action Items */}
            <TabsContent value="tasks" className="mt-4 space-y-2">
              {openTasks.length === 0 ? (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-5 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-green-800">All clear!</p>
                      <p className="text-sm text-green-700">No outstanding action items from your broker.</p>
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
                      <StatusBadge status={t.priority} />
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            {/* Documents */}
            <TabsContent value="documents" className="mt-4">
              <DocumentsPanel docs={docs} />
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Right sidebar ── */}
        <div className="space-y-4">
          <BrokerContactCard
            brokerEmail={activeCase?.assigned_to}
            brokerName={activeCase?.assigned_to}
            agencyName={proposals[0]?.agency_name || null}
          />

          {/* Case info card */}
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Case Details</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Case #</span>
                  <span className="font-medium">{activeCase?.case_number || caseId?.slice(-6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="capitalize">{activeCase?.case_type?.replace(/_/g, " ") || "—"}</span>
                </div>
                {activeCase?.effective_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Effective</span>
                    <span>{format(new Date(activeCase.effective_date), "MMM d, yyyy")}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge status={activeCase?.stage} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}