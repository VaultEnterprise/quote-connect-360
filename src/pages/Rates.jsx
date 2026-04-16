import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import EmptyState from "@/components/shared/EmptyState";
import { DollarSign } from "lucide-react";
import RatesPageHeader from "@/components/rates/RatesPageHeader";
import RatesContextBar from "@/components/rates/RatesContextBar";
import RatesSummaryCards from "@/components/rates/RatesSummaryCards";
import RatesQuickActionsBar from "@/components/rates/RatesQuickActionsBar";
import RatesFilterPanel from "@/components/rates/RatesFilterPanel";
import RatesGridSection from "@/components/rates/RatesGridSection";
import RatesIssuesPanel from "@/components/rates/RatesIssuesPanel";
import RatePreviewDrawer from "@/components/rates/RatePreviewDrawer";
import RateComparisonModal from "@/components/rates/RateComparisonModal";
import RateAssignmentDrawer from "@/components/rates/RateAssignmentDrawer";
import RateImpactWarningModal from "@/components/rates/RateImpactWarningModal";
import PlanFormModal from "@/components/plans/PlanFormModal";
import { applyRateCardFilter, buildRatesHubData, getRateActionAvailability } from "@/components/rates/ratesHubUtils";

const defaultFilters = {
  masterGroupId: "all",
  tenantId: "all",
  search: "",
  dateScope: "current",
  linkedPlanId: "all",
  planType: "all",
  carrier: "all",
  rateModel: "all",
  readinessStatus: "all",
  scopeType: "all",
  quoteUsage: "all",
  missingTiers: false,
  missingAssignments: false,
  missingContributionLinkage: false,
  expiringSoon: false,
  futureEffective: false,
  invalidDates: false,
};

export default function Rates() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState(defaultFilters);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [previewRow, setPreviewRow] = useState(null);
  const [showCompare, setShowCompare] = useState(false);
  const [assignmentRow, setAssignmentRow] = useState(null);
  const [impactRow, setImpactRow] = useState(null);
  const [editingRowId, setEditingRowId] = useState(null);

  const { data: plans = [], isLoading } = useQuery({ queryKey: ["rates-plans"], queryFn: () => base44.entities.BenefitPlan.list("-updated_date", 500) });
  const { data: rateTables = [] } = useQuery({ queryKey: ["rates-tables"], queryFn: () => base44.entities.PlanRateTable.list("-updated_date", 1000) });
  const { data: assignments = [] } = useQuery({ queryKey: ["rate-assignments"], queryFn: () => base44.entities.RateSetAssignment.list("-updated_date", 1000) });
  const { data: masterGroups = [] } = useQuery({ queryKey: ["master-groups"], queryFn: () => base44.entities.MasterGroup.list("name", 300) });
  const { data: tenants = [] } = useQuery({ queryKey: ["tenants"], queryFn: () => base44.entities.Tenant.list("name", 500) });
  const { data: scenarioPlans = [] } = useQuery({ queryKey: ["rates-scenario-plans"], queryFn: () => base44.entities.ScenarioPlan.list("-updated_date", 1000) });
  const { data: quoteScenarios = [] } = useQuery({ queryKey: ["rates-quote-scenarios"], queryFn: () => base44.entities.QuoteScenario.list("-updated_date", 500) });
  const { data: employeeEnrollments = [] } = useQuery({ queryKey: ["rates-employee-enrollments"], queryFn: () => base44.entities.EmployeeEnrollment.list("-updated_date", 500) });
  const { data: enrollmentWindows = [] } = useQuery({ queryKey: ["rates-enrollment-windows"], queryFn: () => base44.entities.EnrollmentWindow.list("-updated_date", 300) });

  const assignmentMutation = useMutation({
    mutationFn: ({ row, masterGroupId, tenantId }) => base44.entities.RateSetAssignment.create({
      rate_table_id: row.id,
      assignment_type: tenantId !== "all" ? "tenant" : masterGroupId !== "all" ? "master_group" : "global",
      master_group_id: masterGroupId !== "all" ? masterGroupId : undefined,
      tenant_id: tenantId !== "all" ? tenantId : undefined,
      status: "active",
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rate-assignments"] }),
  });

  const archiveMutation = useMutation({
    mutationFn: (row) => base44.entities.PlanRateTable.update(row.id, { status: "archived" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rates-tables"] }),
  });

  const activateMutation = useMutation({
    mutationFn: (row) => base44.entities.PlanRateTable.update(row.id, { status: "active" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rates-tables"] }),
  });

  const cloneMutation = useMutation({
    mutationFn: (row) => base44.entities.PlanRateTable.create({
      ...row,
      status: "draft",
      effective_date: row.effective_date,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rates-tables"] }),
  });

  const { rows, summary, issues } = useMemo(() => buildRatesHubData({
    rateTables,
    plans,
    assignments,
    masterGroups,
    tenants,
    scenarioPlans,
    quoteScenarios,
    employeeEnrollments,
    enrollmentWindows,
  }), [rateTables, plans, assignments, masterGroups, tenants, scenarioPlans, quoteScenarios, employeeEnrollments, enrollmentWindows]);

  const scopedTenants = useMemo(() => filters.masterGroupId === "all" ? tenants : tenants.filter((item) => item.master_group_id === filters.masterGroupId), [tenants, filters.masterGroupId]);
  const carriers = [...new Set(rows.map((row) => row.carrier).filter(Boolean))].sort();

  const filteredRows = useMemo(() => rows.filter((row) => {
    const query = filters.search.toLowerCase();
    const matchesSearch = !query || [row.rate_set_name, row.linkedPlanName, row.carrier, row.internal_code, row.rate_type].some((value) => value?.toLowerCase().includes(query));
    const matchesMasterGroup = filters.masterGroupId === "all" || row.assignmentSummary.masterGroups.length === 0 || row.assignmentSummary.masterGroups.includes(masterGroups.find((item) => item.id === filters.masterGroupId)?.name);
    const matchesTenant = filters.tenantId === "all" || row.assignmentSummary.tenants.includes(tenants.find((item) => item.id === filters.tenantId)?.name);
    const matchesPlan = filters.linkedPlanId === "all" || row.plan_id === filters.linkedPlanId;
    const matchesPlanType = filters.planType === "all" || row.planType === filters.planType;
    const matchesCarrier = filters.carrier === "all" || row.carrier === filters.carrier;
    const matchesRateModel = filters.rateModel === "all" || row.rate_type === filters.rateModel;
    const matchesReadiness = filters.readinessStatus === "all" || row.readinessStatus === filters.readinessStatus;
    const matchesScope = filters.scopeType === "all" || row.scopeType === filters.scopeType;
    const matchesQuoteUsage = filters.quoteUsage === "all" || row.quoteUsageStatus === filters.quoteUsage;
    const matchesMissingTiers = !filters.missingTiers || row.missingTiers;
    const matchesMissingAssignments = !filters.missingAssignments || row.missingAssignments;
    const matchesMissingContribution = !filters.missingContributionLinkage || row.missingContributionLinkage;
    const matchesExpiring = !filters.expiringSoon || row.expiringSoon;
    const matchesFuture = !filters.futureEffective || row.futureEffective;
    const matchesInvalidDates = !filters.invalidDates || row.invalidDates;
    return matchesSearch && matchesMasterGroup && matchesTenant && matchesPlan && matchesPlanType && matchesCarrier && matchesRateModel && matchesReadiness && matchesScope && matchesQuoteUsage && matchesMissingTiers && matchesMissingAssignments && matchesMissingContribution && matchesExpiring && matchesFuture && matchesInvalidDates;
  }), [rows, filters, masterGroups, tenants]);

  const selectedRows = filteredRows.filter((row) => selectedIds.includes(row.id));
  const primaryRow = selectedRows[0];
  const availability = primaryRow ? getRateActionAvailability(primaryRow) : {};

  const actionHandlers = {
    onCreate: () => setShowPlanModal(true),
    onClone: () => primaryRow && cloneMutation.mutate(primaryRow),
    onBuilder: () => primaryRow && setPreviewRow(primaryRow),
    onCompare: () => setShowCompare(true),
    onAssign: () => primaryRow && setAssignmentRow(primaryRow),
    onImport: () => setShowPlanModal(true),
    onReviewIssues: () => setFilters((prev) => ({ ...prev, readinessStatus: "NeedsReview" })),
    onActivate: () => primaryRow && activateMutation.mutate(primaryRow),
    onArchive: () => primaryRow && (availability.canArchive ? archiveMutation.mutate(primaryRow) : setImpactRow(primaryRow)),
    onExport: () => window.print(),
    cloneDisabled: selectedRows.length !== 1,
    cloneReason: "Select exactly one rate set.",
    builderDisabled: selectedRows.length !== 1,
    builderReason: "Select one rate set to open.",
    compareDisabled: selectedRows.length < 2,
    compareReason: "Select two rate sets to compare.",
    assignDisabled: selectedRows.length !== 1 || !availability.canAssign,
    assignReason: availability.assignReason || "Select one rate set.",
    activateDisabled: selectedRows.length !== 1 || !availability.canActivate,
    activateReason: availability.activateReason,
    archiveDisabled: selectedRows.length !== 1,
    archiveReason: availability.archiveReason || "Select one rate set.",
  };

  const applySavedView = (view) => {
    if (view === "all") setFilters(defaultFilters);
    if (view === "active") setFilters((prev) => ({ ...prev, readinessStatus: "Active" }));
    if (view === "medical") setFilters((prev) => ({ ...prev, planType: "medical" }));
    if (view === "missing_rates") setFilters((prev) => ({ ...prev, missingTiers: true }));
    if (view === "expiring") setFilters((prev) => ({ ...prev, expiringSoon: true }));
  };

  return (
    <div className="space-y-6">
      <RatesPageHeader onRefresh={() => queryClient.invalidateQueries()} lastRefreshed={new Date().toLocaleString()} scopeLabel={filters.masterGroupId === "all" ? "Enterprise Scope" : "Master Group Scope"} />
      <RatesContextBar masterGroups={masterGroups} tenants={scopedTenants} filters={filters} setFilters={setFilters} onSavedView={applySavedView} />
      <RatesSummaryCards summary={summary} onSelect={(key) => applyRateCardFilter(key, setFilters)} />
      <RatesQuickActionsBar actions={actionHandlers} />
      <RatesFilterPanel filters={filters} setFilters={setFilters} plans={plans} carriers={carriers} />

      {isLoading ? (
        <div className="grid gap-3">{[...Array(6)].map((_, index) => <div key={index} className="h-20 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : filteredRows.length === 0 ? (
        <EmptyState icon={DollarSign} title="No rate sets found" description="Adjust scope or create a new rate set to continue." actionLabel="Create Rate Set" onAction={() => setShowPlanModal(true)} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <RatesGridSection rows={filteredRows} selectedIds={selectedIds} setSelectedIds={setSelectedIds} onOpenPreview={setPreviewRow} editingRowId={editingRowId} onToggleEdit={(rowId) => setEditingRowId((current) => current === rowId ? null : rowId)} />
          <RatesIssuesPanel issues={issues} onSelectRow={setPreviewRow} />
        </div>
      )}

      <RatePreviewDrawer row={previewRow} open={!!previewRow} onClose={() => setPreviewRow(null)} actions={{
        onBuilder: setPreviewRow,
        onCompare: (row) => { setSelectedIds([row.id]); setShowCompare(true); },
        onAssign: setAssignmentRow,
        onClone: (row) => cloneMutation.mutate(row),
        onActivate: (row) => activateMutation.mutate(row),
        onArchive: (row) => availability.canArchive ? archiveMutation.mutate(row) : setImpactRow(row),
        onExport: () => window.print(),
      }} />
      <RateComparisonModal open={showCompare} onClose={() => setShowCompare(false)} rows={selectedRows} />
      <RateAssignmentDrawer open={!!assignmentRow} onClose={() => setAssignmentRow(null)} row={assignmentRow} masterGroups={masterGroups} tenants={tenants} onSave={(payload) => { assignmentMutation.mutate(payload); setAssignmentRow(null); }} />
      <RateImpactWarningModal open={!!impactRow} onClose={() => setImpactRow(null)} row={impactRow} onConfirm={(row) => { archiveMutation.mutate(row); setImpactRow(null); }} />
      {showPlanModal && <PlanFormModal open={showPlanModal} onClose={() => setShowPlanModal(false)} />}
    </div>
  );
}