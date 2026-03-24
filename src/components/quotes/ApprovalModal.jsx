import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { format, parseISO } from "date-fns";

export default function ApprovalModal({ scenario, open, onClose }) {
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const requestApproval = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      await base44.entities.QuoteScenario.update(scenario.id, {
        approval_status: "pending",
        approval_requested_by: user.email,
        approval_requested_at: new Date().toISOString(),
        approval_notes: notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenarios-all"] });
      toast({ title: "Approval requested", description: "Scenario sent for approval" });
      setNotes("");
      onClose();
    },
  });

  const approve = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      await base44.entities.QuoteScenario.update(scenario.id, {
        approval_status: "approved",
        approval_approved_by: user.email,
        approval_approved_at: new Date().toISOString(),
        approval_notes: notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenarios-all"] });
      toast({ title: "Approved", description: "Scenario approved" });
      setNotes("");
      onClose();
    },
  });

  const reject = useMutation({
    mutationFn: async () => {
      await base44.entities.QuoteScenario.update(scenario.id, {
        approval_status: "rejected",
        approval_notes: notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenarios-all"] });
      toast({ title: "Rejected", description: "Scenario rejected", variant: "destructive" });
      setNotes("");
      onClose();
    },
  });

  if (!scenario) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Approval Workflow: {scenario.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Section */}
          <div>
            <p className="text-sm font-semibold mb-3">Current Status</p>
            <div className="flex items-center gap-2 mb-4">
              {scenario.approval_status === "pending" && (
                <>
                  <Clock className="w-4 h-4 text-amber-600" />
                  <Badge className="bg-amber-100 text-amber-700">Pending Approval</Badge>
                </>
              )}
              {scenario.approval_status === "approved" && (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <Badge className="bg-green-100 text-green-700">Approved</Badge>
                </>
              )}
              {scenario.approval_status === "rejected" && (
                <>
                  <XCircle className="w-4 h-4 text-destructive" />
                  <Badge variant="destructive">Rejected</Badge>
                </>
              )}
              {scenario.approval_status === "none" && (
                <Badge variant="outline">No Approval Requested</Badge>
              )}
            </div>

            {scenario.approval_requested_at && (
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Requested by: {scenario.approval_requested_by}</p>
                <p>Date: {format(parseISO(scenario.approval_requested_at), "MMM d, yyyy h:mm a")}</p>
              </div>
            )}

            {scenario.approval_approved_at && (
              <div className="text-xs text-muted-foreground space-y-1 mt-2">
                <p>Approved by: {scenario.approval_approved_by}</p>
                <p>Date: {format(parseISO(scenario.approval_approved_at), "MMM d, yyyy h:mm a")}</p>
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div className="border-t pt-6">
            <label className="text-sm font-semibold mb-2 block">
              {scenario.approval_status === "pending" ? "Approval Notes" : "Notes"}
            </label>
            <Textarea
              placeholder={
                scenario.approval_status === "pending"
                  ? "Add notes for approver..."
                  : "Add approval notes..."
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Quick Info */}
          {scenario.approval_notes && scenario.approval_status !== "none" && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Previous Notes</p>
              <p className="text-xs whitespace-pre-wrap">{scenario.approval_notes}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {scenario.approval_status !== "approved" && scenario.approval_status !== "rejected" && (
            <>
              <Button
                variant="destructive"
                onClick={() => reject.mutate()}
                disabled={reject.isPending}
              >
                <XCircle className="w-4 h-4 mr-2" /> Reject
              </Button>
              {scenario.approval_status === "none" ? (
                <Button
                  onClick={() => requestApproval.mutate()}
                  disabled={requestApproval.isPending}
                >
                  <Clock className="w-4 h-4 mr-2" /> Request Approval
                </Button>
              ) : (
                <Button
                  onClick={() => approve.mutate()}
                  disabled={approve.isPending}
                >
                  <CheckCircle className="w-4 h-4 mr-2" /> Approve
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}