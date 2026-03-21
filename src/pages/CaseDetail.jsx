import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Briefcase, Users, FileText, ClipboardCheck,
  Calendar, Clock, MessageSquare, FileCheck, AlertTriangle, MoreHorizontal
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { format } from "date-fns";

const STAGE_ORDER = [
  "draft", "census_in_progress", "census_validated", "ready_for_quote",
  "quoting", "proposal_ready", "employer_review", "approved_for_enrollment",
  "enrollment_open", "enrollment_complete", "install_in_progress", "active"
];

const STAGE_LABELS = {
  draft: "Draft",
  census_in_progress: "Census",
  census_validated: "Validated",
  ready_for_quote: "Quote Ready",
  quoting: "Quoting",
  proposal_ready: "Proposal",
  employer_review: "Review",
  approved_for_enrollment: "Approved",
  enrollment_open: "Enrollment",
  enrollment_complete: "Enrolled",
  install_in_progress: "Install",
  active: "Active",
};

export default function CaseDetail() {
  const caseId = new URLSearchParams(window.location.search).get("id") || window.location.pathname.split("/cases/")[1];
  const queryClient = useQueryClient();

  const { data: caseData, isLoading } = useQuery({
    queryKey: ["case", caseId],
    queryFn: async () => {
      const cases = await base44.entities.BenefitCase.filter({ id: caseId });
      return cases[0];
    },
    enabled: !!caseId,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["case-tasks", caseId],
    queryFn: () => base44.entities.CaseTask.filter({ case_id: caseId }),
    enabled: !!caseId,
  });

  const { data: censusVersions = [] } = useQuery({
    queryKey: ["census-versions", caseId],
    queryFn: () => base44.entities.CensusVersion.filter({ case_id: caseId }),
    enabled: !!caseId,
  });

  const { data: scenarios = [] } = useQuery({
    queryKey: ["quote-scenarios", caseId],
    queryFn: () => base44.entities.QuoteScenario.filter({ case_id: caseId }),
    enabled: !!caseId,
  });

  const advanceStageMutation = useMutation({
    mutationFn: async (nextStage) => {
      await base44.entities.BenefitCase.update(caseId, { stage: nextStage });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["case", caseId] }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Case not found</p>
        <Link to="/cases"><Button variant="outline" className="mt-4">Back to Cases</Button></Link>
      </div>
    );
  }

  const currentStageIndex = STAGE_ORDER.indexOf(caseData.stage);
  const nextStage = currentStageIndex >= 0 && currentStageIndex < STAGE_ORDER.length - 1
    ? STAGE_ORDER[currentStageIndex + 1]
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link to="/cases">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{caseData.employer_name || "Unnamed Employer"}</h1>
              <StatusBadge status={caseData.stage} />
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span>{caseData.case_number || `Case #${caseId.slice(-6)}`}</span>
              <span>•</span>
              <span className="capitalize">{caseData.case_type?.replace(/_/g, " ")}</span>
              {caseData.effective_date && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Eff. {format(new Date(caseData.effective_date), "MMM d, yyyy")}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        {nextStage && (
          <Button
            onClick={() => advanceStageMutation.mutate(nextStage)}
            disabled={advanceStageMutation.isPending}
            className="shadow-sm"
          >
            Advance to {STAGE_LABELS[nextStage] || nextStage.replace(/_/g, " ")}
          </Button>
        )}
      </div>

      {/* Stage Progress */}
      <Card>
        <CardContent className="py-4">
          <StageProgress currentStage={caseData.stage} />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="census">Census ({censusVersions.length})</TabsTrigger>
          <TabsTrigger value="quotes">Quotes ({scenarios.length})</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <InfoCard label="Employee Count" value={caseData.employee_count || "—"} icon={Users} />
            <InfoCard label="Census Status" value={<StatusBadge status={caseData.census_status || "not_started"} />} icon={FileCheck} />
            <InfoCard label="Quote Status" value={<StatusBadge status={caseData.quote_status || "not_started"} />} icon={FileText} />
            <InfoCard label="Enrollment Status" value={<StatusBadge status={caseData.enrollment_status || "not_started"} />} icon={ClipboardCheck} />
            <InfoCard label="Priority" value={<StatusBadge status={caseData.priority || "normal"} />} icon={AlertTriangle} />
            <InfoCard label="Assigned To" value={caseData.assigned_to || "Unassigned"} icon={Briefcase} />
          </div>
          {caseData.notes && (
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{caseData.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="census" className="mt-4">
          {censusVersions.length === 0 ? (
            <EmptyState icon={Users} title="No Census Uploaded" description="Upload a census file to begin the quoting process" />
          ) : (
            <div className="space-y-2">
              {censusVersions.map((cv) => (
                <Card key={cv.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Version {cv.version_number} — {cv.file_name || "Census File"}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{cv.total_employees || 0} employees</span>
                        <span>{cv.total_dependents || 0} dependents</span>
                        {cv.validation_errors > 0 && <span className="text-destructive">{cv.validation_errors} errors</span>}
                      </div>
                    </div>
                    <StatusBadge status={cv.status} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="quotes" className="mt-4">
          {scenarios.length === 0 ? (
            <EmptyState icon={FileText} title="No Quote Scenarios" description="Create a quote scenario to start comparing plans" />
          ) : (
            <div className="space-y-2">
              {scenarios.map((s) => (
                <Card key={s.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{s.name}</p>
                        {s.is_recommended && <Badge className="bg-primary/10 text-primary text-[10px]">Recommended</Badge>}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {s.total_monthly_premium && <span>${s.total_monthly_premium.toLocaleString()}/mo</span>}
                        {s.plan_count && <span>{s.plan_count} plans</span>}
                      </div>
                    </div>
                    <StatusBadge status={s.status} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          {tasks.length === 0 ? (
            <EmptyState icon={Clock} title="No Tasks" description="Tasks will appear here as the case progresses" />
          ) : (
            <div className="space-y-2">
              {tasks.map((t) => (
                <Card key={t.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{t.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {t.assigned_to && <span>{t.assigned_to}</span>}
                        {t.due_date && <span>Due {format(new Date(t.due_date), "MMM d")}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={t.priority} />
                      <StatusBadge status={t.status} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoCard({ label, value, icon: Icon }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-muted">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <div className="text-sm font-medium mt-0.5">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function StageProgress({ currentStage }) {
  const currentIndex = STAGE_ORDER.indexOf(currentStage);
  const displayStages = STAGE_ORDER.slice(0, 8);

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {displayStages.map((stage, i) => {
        const isComplete = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div key={stage} className="flex items-center flex-shrink-0">
            <div
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                isCurrent
                  ? "bg-primary text-primary-foreground"
                  : isComplete
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {STAGE_LABELS[stage] || stage}
            </div>
            {i < displayStages.length - 1 && (
              <div className={`w-6 h-px mx-1 ${i < currentIndex ? "bg-primary/40" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}