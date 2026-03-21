import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, Users, FileText, ClipboardCheck, Calendar,
  Clock, FileCheck, AlertTriangle, Briefcase, Pencil, X, Plus, Activity, Paperclip
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import CaseEditModal from "@/components/cases/CaseEditModal";
import CaseCloseModal from "@/components/cases/CaseCloseModal";
import StageAdvanceModal from "@/components/cases/StageAdvanceModal";
import TaskModal from "@/components/cases/TaskModal";
import DocumentsTab from "@/components/cases/DocumentsTab";
import ActivityTab from "@/components/cases/ActivityTab";
import CensusUploadModal from "@/components/census/CensusUploadModal";
import CensusMemberTable from "@/components/census/CensusMemberTable";
import QuoteScenarioModal from "@/components/quotes/QuoteScenarioModal";
import ScenarioCompare from "@/components/quotes/ScenarioCompare";
import PlanPickerModal from "@/components/plans/PlanPickerModal.jsx";
import ScenarioPlanList from "@/components/plans/ScenarioPlanList.jsx";
import { format } from "date-fns";
import { useAuth } from "@/lib/AuthContext";
import AIAssistant from "@/components/ai/AIAssistant";

const STAGE_ORDER = [
  "draft", "census_in_progress", "census_validated", "ready_for_quote",
  "quoting", "proposal_ready", "employer_review", "approved_for_enrollment",
  "enrollment_open", "enrollment_complete", "install_in_progress", "active"
];

const STAGE_LABELS = {
  draft: "Draft", census_in_progress: "Census", census_validated: "Validated",
  ready_for_quote: "Quote Ready", quoting: "Quoting", proposal_ready: "Proposal",
  employer_review: "Review", approved_for_enrollment: "Approved",
  enrollment_open: "Enrollment", enrollment_complete: "Enrolled",
  install_in_progress: "Install", active: "Active",
};

export default function CaseDetail() {
  const { id: caseId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [showEdit, setShowEdit] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [showAdvance, setShowAdvance] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showCensusUpload, setShowCensusUpload] = useState(false);
  const [selectedCensusVersion, setSelectedCensusVersion] = useState(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [editingScenario, setEditingScenario] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [planPickerScenarioId, setPlanPickerScenarioId] = useState(null);

  const { data: caseData, isLoading } = useQuery({
    queryKey: ["case", caseId],
    queryFn: () => base44.entities.BenefitCase.filter({ id: caseId }).then(r => r[0]),
    enabled: !!caseId,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["case-tasks", caseId],
    queryFn: () => base44.entities.CaseTask.filter({ case_id: caseId }, "-created_date"),
    enabled: !!caseId,
  });

  const { data: censusVersions = [] } = useQuery({
    queryKey: ["census-versions", caseId],
    queryFn: () => base44.entities.CensusVersion.filter({ case_id: caseId }, "-version_number"),
    enabled: !!caseId,
  });

  const { data: scenarios = [] } = useQuery({
    queryKey: ["quote-scenarios", caseId],
    queryFn: () => base44.entities.QuoteScenario.filter({ case_id: caseId }, "-created_date"),
    enabled: !!caseId,
  });

  const { data: docs = [] } = useQuery({
    queryKey: ["documents", caseId],
    queryFn: () => base44.entities.Document.filter({ case_id: caseId }),
    enabled: !!caseId,
  });

  const advanceStageMutation = useMutation({
    mutationFn: async (nextStage) => {
      await base44.entities.BenefitCase.update(caseId, { stage: nextStage });
      await base44.entities.ActivityLog.create({
        case_id: caseId,
        actor_email: user?.email,
        actor_name: user?.full_name,
        action: "Stage advanced",
        detail: `Case moved to ${STAGE_LABELS[nextStage] || nextStage}`,
        old_value: STAGE_LABELS[caseData?.stage] || caseData?.stage,
        new_value: STAGE_LABELS[nextStage] || nextStage,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case", caseId] });
      queryClient.invalidateQueries({ queryKey: ["activity", caseId] });
      setShowAdvance(false);
    },
  });

  const deleteTask = useMutation({
    mutationFn: (id) => base44.entities.CaseTask.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["case-tasks", caseId] }),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!caseData) return (
    <div className="text-center py-20">
      <p className="text-muted-foreground">Case not found</p>
      <Link to="/cases"><Button variant="outline" className="mt-4">Back to Cases</Button></Link>
    </div>
  );

  const currentStageIndex = STAGE_ORDER.indexOf(caseData.stage);
  const nextStage = currentStageIndex >= 0 && currentStageIndex < STAGE_ORDER.length - 1 ? STAGE_ORDER[currentStageIndex + 1] : null;

  const aiContext = {
    employer: caseData.employer_name,
    caseNumber: caseData.case_number,
    caseType: caseData.case_type,
    stage: caseData.stage,
    effectiveDate: caseData.effective_date,
    employeeCount: caseData.employee_count,
    priority: caseData.priority,
    censusStatus: caseData.census_status,
    quoteStatus: caseData.quote_status,
    enrollmentStatus: caseData.enrollment_status,
    taskCount: tasks.length,
    scenarioCount: scenarios.length,
    censusVersions: censusVersions.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/cases">
            <Button variant="ghost" size="icon" className="rounded-full flex-shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight truncate">{caseData.employer_name || "Unnamed Employer"}</h1>
              <StatusBadge status={caseData.stage} />
              {caseData.priority !== "normal" && <StatusBadge status={caseData.priority} />}
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
              <span>{caseData.case_number || `Case #${caseId?.slice(-6)}`}</span>
              <span>•</span>
              <span className="capitalize">{caseData.case_type?.replace(/_/g, " ")}</span>
              {caseData.effective_date && (
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Eff. {format(new Date(caseData.effective_date), "MMM d, yyyy")}</span>
              )}
              {caseData.assigned_to && <span>→ {caseData.assigned_to}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
            <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
          </Button>
          {caseData.stage !== "closed" && (
            <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/5" onClick={() => setShowClose(true)}>
              <X className="w-3.5 h-3.5 mr-1.5" /> Close Case
            </Button>
          )}
          {nextStage && caseData.stage !== "closed" && (
            <Button size="sm" onClick={() => setShowAdvance(true)}>
              Advance → {STAGE_LABELS[nextStage]}
            </Button>
          )}
        </div>
      </div>

      {/* Stage Progress */}
      <Card>
        <CardContent className="py-3">
          <StageProgress currentStage={caseData.stage} />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="bg-muted/50 flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="census">Census ({censusVersions.length})</TabsTrigger>
          <TabsTrigger value="quotes">Quotes ({scenarios.length})</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
          <TabsTrigger value="documents">Docs ({docs.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Key Metrics */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <InfoCard label="Employee Count"    value={caseData.employee_count || "—"}                               icon={Users} />
                <InfoCard label="Census Status"     value={<StatusBadge status={caseData.census_status || "not_started"} />}   icon={FileCheck} />
                <InfoCard label="Quote Status"      value={<StatusBadge status={caseData.quote_status || "not_started"} />}    icon={FileText} />
                <InfoCard label="Enrollment Status" value={<StatusBadge status={caseData.enrollment_status || "not_started"} />} icon={ClipboardCheck} />
                <InfoCard label="Priority"          value={<StatusBadge status={caseData.priority || "normal"} />}             icon={AlertTriangle} />
                <InfoCard label="Assigned To"       value={caseData.assigned_to || "Unassigned"}                              icon={Briefcase} />
              </div>

              {/* Products Requested */}
              {caseData.products_requested?.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Products Requested</p>
                    <div className="flex flex-wrap gap-2">
                      {caseData.products_requested.map(p => (
                        <Badge key={p} variant="secondary" className="capitalize text-sm px-3 py-1">{p}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {caseData.notes && (
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Notes</p>
                    <p className="text-sm leading-relaxed">{caseData.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right: Lifecycle Checklist */}
            <div>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Lifecycle Checklist</p>
                  <LifecycleChecklist caseData={caseData} censusCount={censusVersions.length} scenarioCount={scenarios.length} taskCount={tasks.length} docCount={docs.length} />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Census */}
        <TabsContent value="census" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">{censusVersions.length} version(s)</h3>
            <Button size="sm" onClick={() => setShowCensusUpload(true)}>
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Upload Census
            </Button>
          </div>
          {censusVersions.length === 0 ? (
            <EmptyState icon={Users} title="No Census Uploaded" description="Upload a census file to begin the quoting process"
              actionLabel="Upload Census" onAction={() => setShowCensusUpload(true)} />
          ) : (
            <div className="space-y-3">
              {censusVersions.map((cv) => (
                <Card key={cv.id} className={selectedCensusVersion?.id === cv.id ? "border-primary" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-medium">Version {cv.version_number} — {cv.file_name || "Census File"}</p>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                          <span>{cv.total_employees || 0} employees</span>
                          <span>{cv.total_dependents || 0} dependents</span>
                          {cv.validation_errors > 0 && <span className="text-destructive">{cv.validation_errors} errors</span>}
                          {cv.validation_warnings > 0 && <span className="text-amber-600">{cv.validation_warnings} warnings</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={cv.status} />
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => setSelectedCensusVersion(selectedCensusVersion?.id === cv.id ? null : cv)}>
                          {selectedCensusVersion?.id === cv.id ? "Hide Members" : "View Members"}
                        </Button>
                      </div>
                    </div>
                    {selectedCensusVersion?.id === cv.id && (
                      <CensusMemberTable censusVersionId={cv.id} caseId={caseId} />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Quotes */}
        <TabsContent value="quotes" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-muted-foreground">{scenarios.length} scenario(s)</h3>
              {scenarios.length >= 2 && (
                <Button variant="outline" size="sm" className="text-xs" onClick={() => setCompareMode(!compareMode)}>
                  {compareMode ? "List View" : "Compare View"}
                </Button>
              )}
            </div>
            <Button size="sm" onClick={() => { setEditingScenario(null); setShowQuoteModal(true); }}>
              <Plus className="w-3.5 h-3.5 mr-1.5" /> New Scenario
            </Button>
          </div>
          {scenarios.length === 0 ? (
            <EmptyState icon={FileText} title="No Quote Scenarios" description="Create a quote scenario to start comparing plans"
              actionLabel="New Scenario" onAction={() => setShowQuoteModal(true)} />
          ) : compareMode ? (
            <ScenarioCompare scenarios={scenarios} />
          ) : (
            <div className="space-y-3">
              {scenarios.map((s) => (
                <Card key={s.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{s.name}</p>
                          {s.is_recommended && <Badge className="bg-primary/10 text-primary text-[10px]">Recommended</Badge>}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                          {s.total_monthly_premium && <span>${s.total_monthly_premium.toLocaleString()}/mo total</span>}
                          {s.employer_monthly_cost && <span>${s.employer_monthly_cost.toLocaleString()}/mo employer</span>}
                          {s.plan_count && <span>{s.plan_count} plans</span>}
                          {s.carriers_included?.length > 0 && <span>{s.carriers_included.join(", ")}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => { setPlanPickerScenarioId(s.id); setShowPlanPicker(true); }}>
                          + Plans
                        </Button>
                        <StatusBadge status={s.status} />
                        <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setEditingScenario(s); setShowQuoteModal(true); }}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <ScenarioPlanList scenarioId={s.id} caseId={caseId} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

                  {/* Tasks */}
        <TabsContent value="tasks" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">{tasks.length} task(s)</h3>
            <Button size="sm" onClick={() => { setEditingTask(null); setShowTaskModal(true); }}>
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Task
            </Button>
          </div>
          {tasks.length === 0 ? (
            <EmptyState icon={Clock} title="No Tasks" description="Tasks will appear here as the case progresses"
              actionLabel="Add Task" onAction={() => setShowTaskModal(true)} />
          ) : (
            <div className="space-y-2">
              {tasks.map((t) => {
                const isOverdue = t.due_date && new Date(t.due_date) < new Date() && t.status !== "completed";
                return (
                  <Card key={t.id} className={isOverdue ? "border-destructive/30" : ""}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${t.status === "completed" ? "line-through text-muted-foreground" : ""}`}>{t.title}</p>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                          {t.assigned_to && <span>{t.assigned_to}</span>}
                          {t.due_date && <span className={isOverdue ? "text-destructive font-medium" : ""}>Due {format(new Date(t.due_date), "MMM d")}</span>}
                          {t.description && <span className="truncate max-w-48">{t.description}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={t.priority} />
                        <StatusBadge status={t.status} />
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingTask(t); setShowTaskModal(true); }}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteTask.mutate(t.id)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Documents */}
        <TabsContent value="documents" className="mt-4">
          <DocumentsTab caseId={caseId} employerName={caseData.employer_name} />
        </TabsContent>

        {/* Activity */}
        <TabsContent value="activity" className="mt-4">
          <ActivityTab caseId={caseId} />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {showEdit && <CaseEditModal caseData={caseData} open={showEdit} onClose={() => setShowEdit(false)} />}
      {showClose && <CaseCloseModal caseData={caseData} open={showClose} onClose={() => setShowClose(false)} />}
      {showAdvance && (
        <StageAdvanceModal
          caseData={caseData} nextStage={nextStage} nextStageLabel={STAGE_LABELS[nextStage]}
          open={showAdvance}
          onConfirm={() => advanceStageMutation.mutate(nextStage)}
          onClose={() => setShowAdvance(false)}
        />
      )}
      {showTaskModal && (
        <TaskModal caseId={caseId} employerName={caseData.employer_name} task={editingTask}
          open={showTaskModal} onClose={() => { setShowTaskModal(false); setEditingTask(null); }} />
      )}
      {showCensusUpload && (
        <CensusUploadModal caseId={caseId} currentVersionCount={censusVersions.length}
          open={showCensusUpload} onClose={() => setShowCensusUpload(false)} />
      )}
      {showQuoteModal && (
        <QuoteScenarioModal caseId={caseId} scenario={editingScenario}
          open={showQuoteModal} onClose={() => { setShowQuoteModal(false); setEditingScenario(null); }} />
      )}
      {showPlanPicker && (
        <PlanPickerModal
          open={showPlanPicker}
          scenarioId={planPickerScenarioId}
          caseId={caseId}
          onClose={() => { setShowPlanPicker(false); setPlanPickerScenarioId(null); }}
        />
      )}
      <AIAssistant caseContext={aiContext} />
    </div>
  );
}

function LifecycleChecklist({ caseData, censusCount, scenarioCount, taskCount, docCount }) {
  const STAGE_ORDER_LOCAL = [
    "draft", "census_in_progress", "census_validated", "ready_for_quote",
    "quoting", "proposal_ready", "employer_review", "approved_for_enrollment",
    "enrollment_open", "enrollment_complete", "install_in_progress", "active"
  ];
  const stageIdx = STAGE_ORDER_LOCAL.indexOf(caseData.stage);

  const checks = [
    { label: "Case created",          done: true },
    { label: "Employer group linked",  done: !!caseData.employer_group_id },
    { label: "Census uploaded",        done: censusCount > 0 || caseData.census_status === "validated" },
    { label: "Census validated",       done: caseData.census_status === "validated" || stageIdx >= 3 },
    { label: "Quote scenario created", done: scenarioCount > 0 || stageIdx >= 4 },
    { label: "Proposal built",         done: stageIdx >= 5 },
    { label: "Employer review done",   done: stageIdx >= 7 },
    { label: "Enrollment opened",      done: stageIdx >= 8 },
    { label: "Enrollment complete",    done: stageIdx >= 10 },
    { label: "Case installed / active",done: stageIdx >= 11 },
  ];

  const doneCount = checks.filter(c => c.done).length;
  const pct = Math.round((doneCount / checks.length) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{doneCount}/{checks.length} complete</span>
        <span className="text-xs font-semibold text-primary">{pct}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      {checks.map((c, i) => (
        <div key={i} className={`flex items-center gap-2 text-xs ${c.done ? "text-foreground" : "text-muted-foreground"}`}>
          <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${c.done ? "bg-emerald-100" : "bg-muted"}`}>
            {c.done
              ? <svg className="w-2.5 h-2.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
              : <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
            }
          </div>
          <span className={c.done ? "line-through opacity-60" : ""}>{c.label}</span>
        </div>
      ))}
    </div>
  );
}

function InfoCard({ label, value, icon: Icon }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-muted"><Icon className="w-4 h-4 text-muted-foreground" /></div>
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
            <div className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${isCurrent ? "bg-primary text-primary-foreground" : isComplete ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
              {STAGE_LABELS[stage] || stage}
            </div>
            {i < displayStages.length - 1 && (
              <div className={`w-4 h-px mx-0.5 ${i < currentIndex ? "bg-primary/40" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}