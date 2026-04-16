import React, { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, Loader2 } from "lucide-react";
import { getNextCaseStage, getCaseStageLabel } from "@/components/cases/caseWorkflow";

export default function BulkStageAdvanceModal({ isOpen, caseIds, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: cases = [] } = useQuery({
    queryKey: ["bulk-advance-cases"],
    queryFn: () => base44.entities.BenefitCase.list("-created_date", 200),
    enabled: isOpen,
  });

  const selectedCases = useMemo(() => cases.filter((item) => caseIds.includes(item.id)), [cases, caseIds]);
  const nextStages = useMemo(() => Array.from(new Set(selectedCases.map((item) => getNextCaseStage(item.stage)).filter(Boolean))), [selectedCases]);
  const sharedNextStage = nextStages.length === 1 ? nextStages[0] : null;

  const bulkUpdate = useMutation({
    mutationFn: async () => {
      for (const item of selectedCases) {
        const nextStage = getNextCaseStage(item.stage);
        if (!nextStage || nextStage !== sharedNextStage) continue;
        await base44.entities.BenefitCase.update(item.id, { stage: nextStage });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      toast({ title: `${selectedCases.length} cases advanced`, description: `Moved to ${getCaseStageLabel(sharedNextStage)}` });
      onClose();
      onSuccess?.();
    },
    onError: (error) => {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Advance Cases to Next Stage</DialogTitle>
          <DialogDescription>Advance {caseIds.length} case{caseIds.length !== 1 ? "s" : ""} by one workflow step.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">Bulk advance only works when all selected cases share the same next workflow step.</p>
          </div>

          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Next stage</p>
            <p className="mt-1 text-sm font-semibold">{sharedNextStage ? getCaseStageLabel(sharedNextStage) : "Mixed stages selected"}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => bulkUpdate.mutate()} disabled={!sharedNextStage || bulkUpdate.isPending}>
            {bulkUpdate.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...</>
            ) : (
              "Advance Cases"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}