import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader, AlertCircle } from "lucide-react";
import { transitionCase } from "@/services/cases/caseOps";
import { toast } from "@/components/ui/use-toast";

const STAGE_OPTIONS = [
  "draft", "census_in_progress", "census_validated", "ready_for_quote",
  "quoting", "proposal_ready", "employer_review", "approved_for_enrollment",
  "enrollment_open", "enrollment_complete", "install_in_progress", "active", "renewal_pending"
];

export default function BulkStageModal({ isOpen, caseIds, onClose, onSuccess }) {
  const [newStage, setNewStage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdvance = async () => {
    if (!newStage) return;
    setLoading(true);
    try {
      const selectedCases = await Promise.all(caseIds.map((id) => base44.entities.BenefitCase.filter({ id }).then((rows) => rows[0])));
      for (const caseRecord of selectedCases.filter(Boolean)) {
        await transitionCase(caseRecord, newStage, {
          reason: "Bulk stage update",
          context: { openTaskCount: 0, quoteCount: 1 },
        });
      }
      onSuccess?.();
      onClose();
      toast({ title: "Status updated", description: `${caseIds.length} case(s) moved to ${newStage.replace(/_/g, " ")}.` });
    } catch (error) {
      toast({ title: "Bulk stage update failed", description: error.message || "The selected action is blocked by the current case status.", variant: "destructive" });
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
            <p className="text-xs text-amber-700">Advancing stage may require completed prerequisites (census, quotes, etc.)</p>
          </div>
          <Select value={newStage} onValueChange={setNewStage}>
            <SelectTrigger>
              <SelectValue placeholder="Select new stage..." />
            </SelectTrigger>
            <SelectContent>
              {STAGE_OPTIONS.map(stage => (
                <SelectItem key={stage} value={stage}>
                  {stage.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAdvance} disabled={!newStage || loading}>
            {loading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
            Update Stage
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}