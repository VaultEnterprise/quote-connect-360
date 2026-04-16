import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader, AlertCircle } from "lucide-react";
import { CASE_BULK_STAGE_OPTIONS, canBulkMoveCase, getCaseStageLabel } from "@/components/cases/caseWorkflow";

export default function BulkStageModal({ isOpen, caseIds, onClose, onSuccess }) {
  const [newStage, setNewStage] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: cases = [] } = useQuery({
    queryKey: ["bulk-stage-cases"],
    queryFn: () => base44.entities.BenefitCase.list("-created_date", 200),
    enabled: isOpen,
  });

  const selectedCases = useMemo(() => cases.filter((item) => caseIds.includes(item.id)), [cases, caseIds]);
  const invalidMoveCount = useMemo(() => selectedCases.filter((item) => !canBulkMoveCase(item.stage, newStage)).length, [selectedCases, newStage]);

  const handleAdvance = async () => {
    if (!newStage || invalidMoveCount > 0) return;
    setLoading(true);
    try {
      for (const id of caseIds) {
        await base44.entities.BenefitCase.update(id, { stage: newStage });
      }
      onSuccess?.();
      onClose();
      setNewStage("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Update Stage for {caseIds.length} Case{caseIds.length !== 1 ? "s" : ""}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded p-3 flex gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">Bulk stage updates only allow one-step movement to keep workflow history safe.</p>
          </div>
          <Select value={newStage} onValueChange={setNewStage}>
            <SelectTrigger>
              <SelectValue placeholder="Select new stage..." />
            </SelectTrigger>
            <SelectContent>
              {CASE_BULK_STAGE_OPTIONS.map(stage => (
                <SelectItem key={stage} value={stage}>{getCaseStageLabel(stage)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {newStage && invalidMoveCount > 0 && (
            <p className="text-xs text-destructive">{invalidMoveCount} selected case{invalidMoveCount !== 1 ? "s" : ""} cannot move directly to this stage.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAdvance} disabled={!newStage || loading || invalidMoveCount > 0}>
            {loading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
            Update Stage
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}