import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { XCircle } from "lucide-react";

const REJECTION_REASONS = [
  "Price too high",
  "Preferred a competitor",
  "Coverage insufficient",
  "Network too narrow",
  "Employer not ready to decide",
  "Employer went with current carrier",
  "Budget constraints",
  "Other",
];

export default function RejectProposalModal({ proposal, open, onClose }) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const reject = useMutation({
    mutationFn: () => base44.entities.Proposal.update(proposal.id, {
      status: "rejected",
      notes: [reason, notes].filter(Boolean).join(" — "),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-destructive" />
            Mark as Rejected
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">{proposal?.title}</p>
          <div>
            <Label>Rejection Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select reason..." /></SelectTrigger>
              <SelectContent>
                {REJECTION_REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Additional Notes</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="mt-1.5"
              placeholder="Any additional context..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={() => reject.mutate()}
            disabled={!reason || reject.isPending}
          >
            {reject.isPending ? "Saving..." : "Confirm Rejection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}