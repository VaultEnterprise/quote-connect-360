import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Building2, Users, FileText, ClipboardCheck, TrendingUp, CheckCircle,
  Clock, AlertCircle, ChevronRight, DollarSign, Eye, RefreshCw, Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "@/components/shared/StatusBadge";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { format } from "date-fns";
import { useAuth } from "@/lib/AuthContext";

export default function EmployerPortal() {
  const { user } = useAuth();
  const [selectedCaseId, setSelectedCaseId] = useState(null);

  // Find cases assigned/relevant to this employer contact
  const { data: cases = [] } = useQuery({
    queryKey: ["employer-cases"],
    queryFn: () => base44.entities.BenefitCase.list("-created_date", 50),
  });

  const { data: employers = [] } = useQuery({
    queryKey: ["employers"],
    queryFn: () => base44.entities.EmployerGroup.list("-created_date", 50),
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

  const { data: scenarios = [] } = useQuery({
    queryKey: ["quote-scenarios", caseId],
    queryFn: () => base44.entities.QuoteScenario.filter({ case_id: caseId }),
    enabled: !!caseId,
  });

  const queryClient = useQueryClient();
  const approveProposal = useMutation({
    mutationFn: (id) => base44.entities.Proposal.update(id, { status: "approved", approved_at: new Date().toISOString() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["proposals-employer"] }),
  });

  if (cases.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Employer Portal" description="Your benefits management dashboard" />
        <EmptyState icon={Building2} title="No Active Cases" description="You don't have any active benefit cases. Contact your broker to get started." />
      </div>
    );
  }

  const enrollment = enrollments[0];
  const enrollPct = enrollment ? Math.round(((enrollment.enrolled_count || 0) / (enrollment.total_eligible || 1)) * 100) : 0;
  const pendingProposals = proposals.filter(p => ["sent", "viewed"].includes(p.status));
  const openTasks = tasks.filter(t => !["completed", "cancelled"].includes(t.status));

  const STAGE_ORDER = ["draft","census_in_progress","census_validated","ready_for_quote","quoting","proposal_ready","employer_review","approved_for_enrollment","enrollment_open","enrollment_complete","install_in_progress","active"];
  const currentStageIdx = STAGE_ORDER.indexOf(activeCase?.stage || "draft");
  const lifecyclePct = Math.round(((currentStageIdx + 1) / STAGE_ORDER.length) * 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Employer Portal</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Benefits management for {activeCase?.employer_name || "your organization"}</p>
        </div>
        {cases.length > 1 && (
          <Select value={selectedCaseId || cases[0]?.id} onValueChange={setSelectedCaseId}>
            <SelectTrigger className="w-56">
              <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {cases.map(c => <SelectItem key={c.id} value={c.id}>{c.employer_name} — {c.case_number || c.id.slice(-6)}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Status banner */}
      <Card className={`border-l-4 ${activeCase?.stage === "active" ? "border-l-green-500" : "border-l-primary"}`}>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-semibold">{activeCase?.employer_name}</h2>
                <StatusBadge status={activeCase?.stage} />
                <StatusBadge status={activeCase?.priority} />
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                <span>{activeCase?.case_number}</span>
                <span className="capitalize">{activeCase?.case_type?.replace(/_/g, " ")}</span>
                {activeCase?.effective_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Eff. {format(new Date(activeCase.effective_date), "MMM d, yyyy")}</span>}
                {activeCase?.assigned_to && <span>Broker: {activeCase.assigned_to}</span>}
              </div>
            </div>
            <div className="w-full sm:w-40">
              <p className="text-xs text-muted-foreground mb-1.5">Overall Progress</p>
              <Progress value={lifecyclePct} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">{lifecyclePct}% complete</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-2"><FileText className="w-4 h-4 text-blue-600" /></div>
            <p className="text-xl font-bold">{proposals.length}</p>
            <p className="text-xs text-muted-foreground">Proposals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center mx-auto mb-2"><ClipboardCheck className="w-4 h-4 text-emerald-600" /></div>
            <p className="text-xl font-bold">{enrollPct}%</p>
            <p className="text-xs text-muted-foreground">Enrolled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center mx-auto mb-2"><AlertCircle className="w-4 h-4 text-amber-600" /></div>
            <p className="text-xl font-bold">{openTasks.length}</p>
            <p className="text-xs text-muted-foreground">Open Tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center mx-auto mb-2"><Users className="w-4 h-4 text-purple-600" /></div>
            <p className="text-xl font-bold">{activeCase?.employee_count || "—"}</p>
            <p className="text-xs text-muted-foreground">Employees</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="proposals">
        <TabsList>
          <TabsTrigger value="proposals">Proposals {pendingProposals.length > 0 && <Badge className="ml-1.5 h-4 px-1 text-[10px] bg-primary text-white">{pendingProposals.length}</Badge>}</TabsTrigger>
          <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
          <TabsTrigger value="tasks">Action Items</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Proposals */}
        <TabsContent value="proposals" className="mt-4 space-y-3">
          {proposals.length === 0 ? (
            <EmptyState icon={FileText} title="No Proposals Yet" description="Your broker is preparing plan options for your review." />
          ) : proposals.map(p => (
            <Card key={p.id} className={pendingProposals.some(pp => pp.id === p.id) ? "border-primary/40" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{p.title}</p>
                      <Badge className={p.status === "approved" ? "bg-green-100 text-green-700" : p.status === "sent" || p.status === "viewed" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}>
                        {p.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      {p.total_monthly_premium && <span className="flex items-center gap-1 font-medium text-foreground"><DollarSign className="w-3 h-3" />${p.total_monthly_premium.toLocaleString()}/mo total</span>}
                      {p.employer_monthly_cost && <span>${p.employer_monthly_cost.toLocaleString()}/mo employer cost</span>}
                      {p.employee_avg_cost && <span>~${p.employee_avg_cost.toLocaleString()}/mo avg employee</span>}
                      {p.sent_at && <span>Received {format(new Date(p.sent_at), "MMM d, yyyy")}</span>}
                    </div>
                    {p.plan_summary?.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {p.plan_summary.map((plan, i) => <Badge key={i} variant="outline" className="text-[10px]">{plan.plan_name || plan.name}</Badge>)}
                      </div>
                    )}
                    {p.cover_message && <p className="text-xs text-muted-foreground mt-2 italic">"{p.cover_message}"</p>}
                  </div>
                  {["sent","viewed"].includes(p.status) && (
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 flex-shrink-0" onClick={() => approveProposal.mutate(p.id)}>
                      <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Approve
                    </Button>
                  )}
                  {p.status === "approved" && (
                    <Badge className="bg-green-100 text-green-700 flex-shrink-0"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Enrollment */}
        <TabsContent value="enrollment" className="mt-4">
          {!enrollment ? (
            <EmptyState icon={ClipboardCheck} title="No Enrollment Window" description="Enrollment hasn't started yet. Your broker will notify you when it opens." />
          ) : (
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Open Enrollment</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {enrollment.start_date && format(new Date(enrollment.start_date), "MMM d")} — {enrollment.end_date && format(new Date(enrollment.end_date), "MMM d, yyyy")}
                    </p>
                  </div>
                  <StatusBadge status={enrollment.status} />
                </div>
                <Progress value={enrollPct} className="h-3" />
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div><p className="text-xl font-bold text-green-600">{enrollment.enrolled_count || 0}</p><p className="text-xs text-muted-foreground">Enrolled</p></div>
                  <div><p className="text-xl font-bold text-orange-500">{enrollment.waived_count || 0}</p><p className="text-xs text-muted-foreground">Waived</p></div>
                  <div><p className="text-xl font-bold text-muted-foreground">{enrollment.pending_count || Math.max(0, (enrollment.total_eligible || 0) - (enrollment.enrolled_count || 0) - (enrollment.waived_count || 0))}</p><p className="text-xs text-muted-foreground">Pending</p></div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                  <span className="text-sm font-medium">Participation Rate</span>
                  <span className="text-lg font-bold text-primary">{enrollPct}%</span>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Action Items */}
        <TabsContent value="tasks" className="mt-4 space-y-2">
          {openTasks.length === 0 ? (
            <EmptyState icon={CheckCircle} title="All Clear!" description="No outstanding action items from your broker." />
          ) : openTasks.map(t => (
            <Card key={t.id} className={t.due_date && new Date(t.due_date) < new Date() ? "border-destructive/30" : ""}>
              <CardContent className="p-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{t.title}</p>
                  {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
                  {t.due_date && <p className={`text-xs mt-1 flex items-center gap-1 ${new Date(t.due_date) < new Date() ? "text-destructive font-medium" : "text-muted-foreground"}`}><Clock className="w-3 h-3" />Due {format(new Date(t.due_date), "MMM d, yyyy")}</p>}
                </div>
                <StatusBadge status={t.priority} />
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Documents */}
        <TabsContent value="documents" className="mt-4 space-y-2">
          {docs.length === 0 ? (
            <EmptyState icon={FileText} title="No Documents" description="Documents shared by your broker will appear here." />
          ) : docs.map(d => (
            <Card key={d.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center"><FileText className="w-4 h-4 text-muted-foreground" /></div>
                  <div>
                    <p className="text-sm font-medium">{d.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{d.document_type?.replace(/_/g, " ")} • {format(new Date(d.created_date), "MMM d, yyyy")}</p>
                  </div>
                </div>
                {d.file_url && <Button variant="outline" size="sm" asChild><a href={d.file_url} target="_blank" rel="noreferrer">View</a></Button>}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}