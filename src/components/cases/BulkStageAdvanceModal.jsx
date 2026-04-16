import React, { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, Loader2 } from "lucide-react";
import { getAllowedTransitions } from "@/lib/workflow/getAllowedTransitions";

const STAGES = [
  { value: "draft", label: "Draft" },
  { value: "census_in_progress", label: "Census In Progress" },
  { value: "census_validated", label: "Census Validated" },
  { value: "ready_for_quote", label: "Ready for Quote" },
  { value: "quoting", label: "Quoting" },
  { value: "proposal_ready", label: "Proposal Ready" },
  { value: "employer_review", label: "Employer Review" },
  { value: "approved_for_enrollment", label: "Approved for Enrollment" },
  { value: "enrollment_open", label: "Enrollment Open" },
  { value: "enrollment_complete", label: "Enrollment Complete" },
  { value: "install_in_progress", label: "Install In Progress" },
  { value: "active", label: "Active" },
  { value: "renewal_pending", label: "Renewal Pending" },
  { value: "closed", label: "Closed" },
];

export default function BulkStageAdvanceModal({ isOpen, caseIds, cases = [], onClose, onSuccess }) {
  const [newStage, setNewStage] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const allowedStageOptions = useMemo(() => {
    const selectedCases = cases.filter((item) => caseIds.includes(item.id));
    const sharedTransitions = selectedCases.reduce((acc, item) => {
      const transitions = getAllowedTransitions(item.stage);
      if (acc === null) return transitions;
      return acc.filter((stage) => transitions.includes(stage));
    }, null);
    return STAGES.filter((stage) => (sharedTransitions || []).includes(stage.value));
  }, [caseIds, cases]);

  const bulkUpdate = useMutation({
    mutationFn: async () => {
      for (const id of caseIds) {
        await base44.entities.BenefitCase.update(id, { stage: newStage });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      toast({ title: `${caseIds.length} cases advanced`, description: `Moved to ${STAGES.find(s => s.value === newStage)?.label}` });
      setNewStage("");
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
          <DialogTitle>Advance Cases to Stage</DialogTitle>
          <DialogDescription>Move {caseIds.length} case{caseIds.length !== 1 ? "s" : ""} to a new stage</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">This will move all selected cases to the same stage. Ensure all prerequisites are met.</p>
          </div>

          <Select value={newStage} onValueChange={setNewStage}>
            <SelectTrigger>
              <SelectValue placeholder="Select new stage..." />
            </SelectTrigger>
            <SelectContent>
              {allowedStageOptions.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => bulkUpdate.mutate()} disabled={!newStage || bulkUpdate.isPending || allowedStageOptions.length === 0}>
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