import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import QuoteScenarioModal from "@/components/quotes/QuoteScenarioModal";

export default function NewScenarioFromQuotes({ open, onClose }) {
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [showScenarioModal, setShowScenarioModal] = useState(false);

  const { data: cases = [] } = useQuery({
    queryKey: ["cases"],
    queryFn: () => base44.entities.BenefitCase.list("-created_date", 100),
  });

  const activeCases = cases.filter(c => !["closed", "completed"].includes(c.stage));

  if (showScenarioModal && selectedCaseId) {
    return (
      <QuoteScenarioModal
        caseId={selectedCaseId}
        open={true}
        onClose={() => { setShowScenarioModal(false); onClose(); }}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New Quote Scenario</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Select the case this scenario belongs to, then configure the scenario details.
          </p>
          <div>
            <Label>Case <span className="text-destructive">*</span></Label>
            <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select a case..." />
              </SelectTrigger>
              <SelectContent>
                {activeCases.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex flex-col">
                      <span>{c.employer_name}</span>
                      <span className="text-[10px] text-muted-foreground">{c.case_number || c.id.slice(-6)} · {c.stage?.replace(/_/g, " ")}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => setShowScenarioModal(true)} disabled={!selectedCaseId}>
            Continue →
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}