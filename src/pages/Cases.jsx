import React from "react";
import { Users, Layers, Flag, Download, Trash2, Calendar, Briefcase } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { CaseListSkeleton } from "@/components/shared/LoadingSkeleton";
import CasePipelineView from "@/components/cases/CasePipelineView";
import BulkActionsBar from "@/components/shared/BulkActionsBar";
import BulkAssignModal from "@/components/cases/BulkAssignModal";
import BulkStageModal from "@/components/cases/BulkStageModal";
import BulkPriorityModal from "@/components/cases/BulkPriorityModal";
import BulkStageAdvanceModal from "@/components/cases/BulkStageAdvanceModal";
import QuickCreateCaseModal from "@/components/cases/QuickCreateCaseModal";
import BulkAssignWithDueDate from "@/components/cases/BulkAssignWithDueDate";
import CasesToolbar from "@/components/cases/CasesToolbar";
import CasesSummaryBar from "@/components/cases/CasesSummaryBar";
import CasesList from "@/components/cases/CasesList";
import CasesAnalyticsPanels from "@/components/cases/CasesAnalyticsPanels";
import { useCasesPageController } from "@/domain/cases/useCasesPageController";

export default function Cases() {
  const controller = useCasesPageController();

  return (
    <div className="space-y-5">
      <PageHeader title="Cases" description={`${controller.cases.length} total benefit cases`} />

      {controller.showAnalytics && controller.cases.length > 0 && (
        <CasesAnalyticsPanels cases={controller.filtered} />
      )}

      {controller.cases.length > 0 && (
        <CasesSummaryBar
          kpis={controller.kpis}
          onStageFilter={(value) => controller.setFilterState({ stageFilter: value })}
          onPriorityFilter={(value) => controller.setFilterState({ priorityFilter: value })}
        />
      )}

      <CasesToolbar
        state={controller.filters}
        cases={controller.cases}
        currentUser={controller.currentUser}
        filteredCount={controller.filtered.length}
        totalCount={controller.cases.length}
        activeFilters={controller.activeFilters}
        setState={controller.setFilterState}
        clearFilters={controller.clearFilters}
        onExport={controller.handleFilteredExport}
        onToggleAnalytics={() => controller.setShowAnalytics((current) => !current)}
        showAnalytics={controller.showAnalytics}
        onQuickCreate={() => controller.setShowQuickCreate(true)}
        onLoadPreset={controller.handleLoadPreset}
      />

      {controller.isLoading ? (
        <CaseListSkeleton />
      ) : controller.filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No cases found"
          description={controller.filters.search || controller.activeFilters > 0 ? "Try adjusting your filters" : "Create your first benefit case to get started"}
          actionLabel={!controller.filters.search && controller.activeFilters === 0 ? "Create Case" : undefined}
          onAction={!controller.filters.search && controller.activeFilters === 0 ? () => (window.location.href = "/cases/new") : undefined}
        />
      ) : controller.filters.viewMode === "pipeline" ? (
        <CasePipelineView cases={controller.filtered} />
      ) : (
        <CasesList
          cases={controller.filtered}
          selectedIds={controller.selectedIds}
          onToggleSelectAll={controller.toggleSelectAll}
          onToggleSelect={controller.toggleSelect}
          employeePreviewByCase={controller.employeePreviewByCase}
          employeeCountByCase={controller.employeeCountByCase}
          caseMetaById={controller.caseMetaById}
        />
      )}

      {controller.selectedIds.size > 0 && (
        <BulkActionsBar
          selectedCount={controller.selectedIds.size}
          totalCount={controller.filtered.length}
          allSelected={controller.selectedIds.size === controller.filtered.length}
          onSelectAll={controller.toggleSelectAll}
          onClearSelection={controller.clearSelection}
          actions={[
            { label: "Assign", icon: Users, onClick: () => controller.setShowAssignModal(true) },
            { label: "Stage", icon: Layers, onClick: () => controller.setShowStageModal(true) },
            { label: "Priority", icon: Flag, onClick: () => controller.setShowPriorityModal(true) },
            { label: "Advance Stage", icon: Layers, onClick: () => controller.setShowStageAdvanceModal(true) },
            { label: "Assign + Due Date", icon: Calendar, onClick: () => controller.setShowAssignDueDate(true) },
            { label: "Export", icon: Download, onClick: controller.handleBulkExport },
            { label: "Delete", icon: Trash2, variant: "destructive", onClick: controller.handleBulkDelete, disabled: controller.bulkAction === "deleting" },
          ]}
        />
      )}

      <BulkAssignModal isOpen={controller.showAssignModal} caseIds={controller.selectedCaseIds} onClose={() => controller.setShowAssignModal(false)} onSuccess={controller.handleBulkSuccess} />
      <BulkStageModal isOpen={controller.showStageModal} caseIds={controller.selectedCaseIds} onClose={() => controller.setShowStageModal(false)} onSuccess={controller.handleBulkSuccess} />
      <BulkPriorityModal isOpen={controller.showPriorityModal} caseIds={controller.selectedCaseIds} onClose={() => controller.setShowPriorityModal(false)} onSuccess={controller.handleBulkSuccess} />
      <BulkStageAdvanceModal isOpen={controller.showStageAdvanceModal} caseIds={controller.selectedCaseIds} onClose={() => controller.setShowStageAdvanceModal(false)} onSuccess={controller.handleBulkSuccess} />
      <BulkAssignWithDueDate isOpen={controller.showAssignDueDate} caseIds={controller.selectedCaseIds} onClose={() => controller.setShowAssignDueDate(false)} onSuccess={controller.handleBulkSuccess} />
      <QuickCreateCaseModal isOpen={controller.showQuickCreate} onClose={() => controller.setShowQuickCreate(false)} />
    </div>
  );
}