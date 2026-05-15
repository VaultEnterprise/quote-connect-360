import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Pencil, Plus } from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import QuoteScenarioModal from "@/components/quotes/QuoteScenarioModal";
import ScenarioCompare from "@/components/quotes/ScenarioCompare";
import PlanPickerModal from "@/components/plans/PlanPickerModal.jsx";
import ScenarioPlanList from "@/components/plans/ScenarioPlanList.jsx";

/**
 * CaseQuotesTab
 * Lists all QuoteScenario records for a case.
 * Supports create, edit, compare mode, and plan assignment per scenario.
 *
 * Props:
 *   caseId    — string (BenefitCase.id)
 *   scenarios — QuoteScenario[]
 */
export default function CaseQuotesTab({ caseId, scenarios }) {
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [editingScenario, setEditingScenario] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [planPickerScenarioId, setPlanPickerScenarioId] = useState(null);

  const openCreate = () => { setEditingScenario(null); setShowQuoteModal(true); };
  const openEdit = (s) => { setEditingScenario(s); setShowQuoteModal(true); };
  const closeModal = () => { setShowQuoteModal(false); setEditingScenario(null); };

  const openPlanPicker = (scenarioId) => {
    setPlanPickerScenarioId(scenarioId);
    setShowPlanPicker(true);
  };
  const closePlanPicker = () => {
    setShowPlanPicker(false);
    setPlanPickerScenarioId(null);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">{scenarios.length} scenario(s)</h3>
          {scenarios.length >= 2 && (
            <Button
              variant="outline" size="sm" className="text-xs"
              onClick={() => setCompareMode(v => !v)}
            >
              {compareMode ? "List View" : "Compare View"}
            </Button>
          )}
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-3.5 h-3.5 mr-1.5" /> New Scenario
        </Button>
      </div>

      {scenarios.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Quote Scenarios"
          description="Create a quote scenario to start comparing plans"
          actionLabel="New Scenario"
          onAction={openCreate}
        />
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
                      {s.is_recommended && (
                        <Badge className="bg-primary/10 text-primary text-[10px]">Recommended</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      {s.total_monthly_premium && <span>${s.total_monthly_premium.toLocaleString()}/mo total</span>}
                      {s.employer_monthly_cost && <span>${s.employer_monthly_cost.toLocaleString()}/mo employer</span>}
                      {s.plan_count && <span>{s.plan_count} plans</span>}
                      {s.carriers_included?.length > 0 && <span>{s.carriers_included.join(", ")}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline" size="sm" className="text-xs"
                      onClick={() => openPlanPicker(s.id)}
                    >
                      + Plans
                    </Button>
                    <StatusBadge status={s.status} />
                    {s.status !== "completed" && (
                      <Badge variant="outline" className="text-[10px]">Recalculate after plan changes</Badge>
                    )}
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => openEdit(s)}>
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

      {showQuoteModal && (
        <QuoteScenarioModal
          caseId={caseId}
          scenario={editingScenario}
          open={showQuoteModal}
          onClose={closeModal}
        />
      )}
      {showPlanPicker && (
        <PlanPickerModal
          open={showPlanPicker}
          scenarioId={planPickerScenarioId}
          caseId={caseId}
          onClose={closePlanPicker}
        />
      )}
    </>
  );
}