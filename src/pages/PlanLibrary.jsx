import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Upload, BookOpen } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import PlanFormModal from "@/components/plans/PlanFormModal";
import PlanImportModal from "@/components/plans/PlanImportModal";
import PlanArchiveManager from "@/components/plans/PlanArchiveManager";
import PlansSummaryCards from "@/components/plans/PlansSummaryCards";
import PlansQuickActionsBar from "@/components/plans/PlansQuickActionsBar";
import PlansIssuesPanel from "@/components/plans/PlansIssuesPanel";
import PlanPreviewDrawer from "@/components/plans/PlanPreviewDrawer";
import PlansGrid from "@/components/plans/PlansGrid";
import PlanComparisonModal from "@/components/plans/PlanComparisonModal";
import SavedViewsDropdown from "@/components/plans/SavedViewsDropdown";
import { buildPlanHubData, exportPlansCSV } from "@/components/plans/planHubUtils";

export default function PlanLibrary() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [carrierFilter, setCarrierFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [readinessFilter, setReadinessFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [previewPlan, setPreviewPlan] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showArchived, setShowArchived] = useState(false);

  const { data: allPlans = [], isLoading } = useQuery({
    queryKey: ["benefit-plans"],
    queryFn: () => base44.entities.BenefitPlan.list("-updated_date", 500),
  });
  const { data: rateTables = [] } = useQuery({
    queryKey: ["plans-rate-tables"],
    queryFn: () => base44.entities.PlanRateTable.list("-updated_date", 1000),
  });
  const { data: scenarioPlans = [] } = useQuery({
    queryKey: ["plans-scenario-plans"],
    queryFn: () => base44.entities.ScenarioPlan.list("-updated_date", 1000),
  });
  const { data: quoteScenarios = [] } = useQuery({
    queryKey: ["plans-quote-scenarios"],
    queryFn: () => base44.entities.QuoteScenario.list("-updated_date", 500),
  });
  const { data: employeeEnrollments = [] } = useQuery({
    queryKey: ["plans-employee-enrollments"],
    queryFn: () => base44.entities.EmployeeEnrollment.list("-updated_date", 500),
  });
  const { data: enrollments = [] } = useQuery({
    queryKey: ["plans-enrollments"],
    queryFn: () => base44.entities.EnrollmentWindow.list("-updated_date", 300),
  });
  const { data: proposals = [] } = useQuery({
    queryKey: ["plans-proposals"],
    queryFn: () => base44.entities.Proposal.list("-updated_date", 300),
  });

  const archiveMutation = useMutation({
    mutationFn: (plan) => base44.entities.BenefitPlan.update(plan.id, { status: "archived" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["benefit-plans"] }),
  });
  const restoreMutation = useMutation({
    mutationFn: (plan) => base44.entities.BenefitPlan.update(plan.id, { status: "active" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["benefit-plans"] }),
  });
  const deleteMutation = useMutation({
    mutationFn: (plan) => base44.entities.BenefitPlan.delete(plan.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["benefit-plans"] }),
  });
  const cloneMutation = useMutation({
    mutationFn: (plan) => base44.entities.BenefitPlan.create({
      ...plan,
      plan_name: `${plan.plan_name} Copy`,
      status: "active",
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["benefit-plans"] }),
  });

  const activePlans = allPlans.filter((plan) => plan.status !== "archived");
  const archivedPlans = allPlans.filter((plan) => plan.status === "archived");
  const carriers = [...new Set(activePlans.map((plan) => plan.carrier).filter(Boolean))].sort();

  const { enrichedPlans, summary } = useMemo(() => buildPlanHubData({
    plans: activePlans,
    rateTables,
    scenarioPlans,
    quoteScenarios,
    employeeEnrollments,
    enrollments,
    proposals,
  }), [activePlans, rateTables, scenarioPlans, quoteScenarios, employeeEnrollments, enrollments, proposals]);

  const filteredPlans = useMemo(() => enrichedPlans.filter((plan) => {
    const query = search.toLowerCase();
    const matchesSearch = !query || [plan.plan_name, plan.carrier, plan.plan_code, plan.plan_type].some((value) => value?.toLowerCase().includes(query));
    const matchesCarrier = carrierFilter === "all" || plan.carrier === carrierFilter;
    const matchesType = typeFilter === "all" || plan.plan_type === typeFilter;
    const matchesStatus = statusFilter === "all" || plan.status === statusFilter;
    const matchesReadiness = readinessFilter === "all" || plan.readinessStatus === readinessFilter;
    return matchesSearch && matchesCarrier && matchesType && matchesStatus && matchesReadiness;
  }), [enrichedPlans, search, carrierFilter, typeFilter, statusFilter, readinessFilter]);

  const selectedPlans = filteredPlans.filter((plan) => selectedIds.includes(plan.id));

  const applySavedView = (view) => {
    if (view === "all") {
      setTypeFilter("all");
      setStatusFilter("all");
      setReadinessFilter("all");
    }
    if (view === "active") setStatusFilter("active");
    if (view === "medical") setTypeFilter("medical");
    if (view === "missing_rates") setReadinessFilter("needs_review");
    if (view === "expiring") setReadinessFilter("ready_to_publish");
  };

  const handleSummarySelect = (key) => {
    if (key === "all") {
      setStatusFilter("all");
      setReadinessFilter("all");
      return;
    }
    if (key === "active") setStatusFilter("active");
    if (key === "review") setReadinessFilter("needs_review");
    if (key === "rates") setReadinessFilter("needs_review");
    if (key === "assignments") setReadinessFilter("needs_review");
    if (key === "documents") setReadinessFilter("needs_review");
    if (key === "expiring") setReadinessFilter("ready_to_publish");
    if (key === "future") setReadinessFilter("ready_to_publish");
  };

  const openCreate = () => {
    setEditingPlan(null);
    setShowForm(true);
  };

  const handleClone = (plan) => cloneMutation.mutate(plan);
  const handleArchive = (plan) => archiveMutation.mutate(plan);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plans / Plan Builder"
        description="Enterprise plan management hub for readiness, usage, rates, and downstream plan actions."
        actions={
          <div className="flex gap-2">
            <SavedViewsDropdown onSelect={applySavedView} />
            <Button variant="outline" onClick={() => exportPlansCSV(filteredPlans)}>Export</Button>
            <Button variant="outline" onClick={() => setShowImport(true)}><Upload className="mr-2 h-4 w-4" />Import Plans</Button>
            <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Create Plan</Button>
          </div>
        }
      />

      <PlansSummaryCards summary={summary} onSelect={handleSummarySelect} />

      <PlansQuickActionsBar
        onCreate={openCreate}
        onImport={() => setShowImport(true)}
        onCompare={() => setShowCompare(true)}
        onClone={() => selectedPlans[0] && handleClone(selectedPlans[0])}
        onReviewIssues={() => setReadinessFilter("needs_review")}
        onShowArchived={() => setShowArchived((value) => !value)}
        compareDisabled={selectedPlans.length < 2}
        cloneDisabled={selectedPlans.length !== 1}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 lg:flex-row">
            <Input placeholder="Search plan name, carrier, code, or type..." value={search} onChange={(e) => setSearch(e.target.value)} className="lg:max-w-sm" />
            <Select value={carrierFilter} onValueChange={setCarrierFilter}>
              <SelectTrigger className="w-full lg:w-44"><SelectValue placeholder="Carrier" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Carriers</SelectItem>
                {carriers.map((carrier) => <SelectItem key={carrier} value={carrier}>{carrier}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full lg:w-44"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="medical">Medical</SelectItem>
                <SelectItem value="dental">Dental</SelectItem>
                <SelectItem value="vision">Vision</SelectItem>
                <SelectItem value="life">Life</SelectItem>
                <SelectItem value="std">STD</SelectItem>
                <SelectItem value="ltd">LTD</SelectItem>
                <SelectItem value="voluntary">Voluntary</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={readinessFilter} onValueChange={setReadinessFilter}>
              <SelectTrigger className="w-full lg:w-44"><SelectValue placeholder="Readiness" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Readiness</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="incomplete">Incomplete</SelectItem>
                <SelectItem value="needs_review">Needs Review</SelectItem>
                <SelectItem value="ready_to_publish">Ready to Publish</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="grid gap-3">
              {[...Array(5)].map((_, index) => <div key={index} className="h-20 animate-pulse rounded-xl bg-muted" />)}
            </div>
          ) : filteredPlans.length === 0 ? (
            <EmptyState icon={BookOpen} title="No plans found" description="Adjust filters or create a new plan to get started." actionLabel="Create Plan" onAction={openCreate} />
          ) : (
            <PlansGrid
              plans={filteredPlans}
              selectedIds={selectedIds}
              onToggleSelect={(id) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])}
              onOpenPreview={setPreviewPlan}
              onEdit={(plan) => { setEditingPlan(plan); setShowForm(true); }}
              onClone={handleClone}
              onArchive={handleArchive}
            />
          )}
        </div>

        <PlansIssuesPanel plans={filteredPlans} onSelectPlan={setPreviewPlan} />
      </div>

      {showArchived && (
        <PlanArchiveManager archivedPlans={archivedPlans} onRestore={(plan) => restoreMutation.mutate(plan)} onDelete={(plan) => deleteMutation.mutate(plan)} />
      )}

      {showForm && (
        <PlanFormModal
          plan={editingPlan}
          open={showForm}
          defaultType={editingPlan?.plan_type || "medical"}
          onClose={() => { setShowForm(false); setEditingPlan(null); }}
        />
      )}
      {showImport && <PlanImportModal open={showImport} onClose={() => setShowImport(false)} />}
      <PlanPreviewDrawer
        plan={previewPlan}
        open={!!previewPlan}
        onClose={() => setPreviewPlan(null)}
        onEdit={(plan) => { setPreviewPlan(null); setEditingPlan(plan); setShowForm(true); }}
        onClone={(plan) => { setPreviewPlan(null); handleClone(plan); }}
        onArchive={(plan) => { setPreviewPlan(null); handleArchive(plan); }}
      />
      <PlanComparisonModal open={showCompare} onClose={() => setShowCompare(false)} plans={selectedPlans} />
    </div>
  );
}