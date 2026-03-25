import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, Clock, XCircle, ArrowRight, Send, ShieldCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const LIFECYCLE = [
  { key: "draft", label: "Draft", icon: Clock, color: "bg-gray-100 text-gray-600" },
  { key: "validated", label: "Validated", icon: CheckCircle, color: "bg-blue-100 text-blue-700" },
  { key: "pending_approval", label: "Pending Approval", icon: Clock, color: "bg-amber-100 text-amber-700" },
  { key: "approved", label: "Approved", icon: CheckCircle, color: "bg-green-100 text-green-700" },
  { key: "published", label: "Published", icon: ShieldCheck, color: "bg-primary/10 text-primary" },
  { key: "deprecated", label: "Deprecated", icon: XCircle, color: "bg-red-100 text-red-600" },
];

const TRANSITIONS = {
  draft: ["validated"],
  validated: ["pending_approval"],
  pending_approval: ["approved", "draft"],
  approved: ["published"],
  published: ["deprecated"],
  deprecated: [],
};

const REQUIRED_FIELDS = ["plan_name", "carrier", "plan_type", "network_type", "deductible_individual", "oop_max_individual"];

function validatePlan(plan) {
  return REQUIRED_FIELDS.filter(f => !plan[f] && plan[f] !== 0);
}

export default function PlanApprovalWorkflow({ plan, onStatusChange }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [targetStatus, setTargetStatus] = useState(null);
  const [notes, setNotes] = useState("");

  const currentStatus = plan?.status || "draft";
  const currentIdx = LIFECYCLE.findIndex(l => l.key === currentStatus);
  const transitions = TRANSITIONS[currentStatus] || [];
  const missing = validatePlan(plan || {});
  const isAdmin = user?.role === "admin";

  const transitionMutation = useMutation({
    mutationFn: async (newStatus) => {
      await base44.entities.BenefitPlan.update(plan.id, { status: newStatus });
      await base44.entities.PlanAuditLog.create({
        plan_id: plan.id, action: newStatus === "approved" ? "approved" : newStatus === "published" ? "published" : "updated",
        actor_email: user?.email || "unknown", actor_role: user?.role || "user",
        description: `Status changed to ${newStatus}${notes ? `: ${notes}` : ""}`,
        changes: { status: { old: currentStatus, new: newStatus } }, source: "manual",
      });
      // Create version record
      await base44.entities.PlanVersion.create({
        plan_id: plan.id, version_number: Date.now(), changed_by: user?.email || "unknown",
        change_type: "metadata_updated", changes_summary: `Lifecycle: ${currentStatus} → ${newStatus}`,
        approval_status: newStatus === "approved" ? "approved" : newStatus === "pending_approval" ? "pending_approval" : "approved",
        plan_data_snapshot: plan,
      });
    },
    onSuccess: (_, newStatus) => {
      qc.invalidateQueries({ queryKey: ["benefit-plans"] });
      toast.success(`Plan moved to "${newStatus}"`);
      onStatusChange?.();
      setShowDialog(false); setNotes("");
    },
  });

  const handleTransition = (status) => {
    if (status === "validated" && missing.length > 0) {
      toast.error(`Cannot validate: missing ${missing.join(", ")}`);
      return;
    }
    if (status === "approved" && !isAdmin) {
      toast.error("Only admins can approve plans");
      return;
    }
    setTargetStatus(status);
    setShowDialog(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm">Plan Lifecycle & Approval</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Lifecycle progress */}
          <div className="flex items-center gap-1 flex-wrap">
            {LIFECYCLE.filter(l => l.key !== "deprecated").map((stage, i) => {
              const idx = LIFECYCLE.findIndex(l2 => l2.key === stage.key);
              const isPast = idx < currentIdx;
              const isCurrent = stage.key === currentStatus;
              const Icon = stage.icon;
              return (
                <React.Fragment key={stage.key}>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs ${isCurrent ? stage.color + " font-semibold ring-2 ring-current ring-offset-1" : isPast ? "bg-muted text-muted-foreground" : "bg-muted/30 text-muted-foreground/50"}`}>
                    <Icon className="w-3 h-3" />
                    {stage.label}
                  </div>
                  {i < LIFECYCLE.filter(l => l.key !== "deprecated").length - 1 && (
                    <ArrowRight className="w-3 h-3 text-muted-foreground/30 flex-shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Current status badge */}
          <div className="flex items-center gap-2 flex-wrap">
            {(() => { const s = LIFECYCLE.find(l => l.key === currentStatus); const Icon = s?.icon; return s ? (
              <Badge className={`gap-1 ${s.color}`}><Icon className="w-3 h-3" />{s.label}</Badge>
            ) : null; })()}
            {currentStatus === "deprecated" && (
              <p className="text-xs text-red-600">This plan is deprecated and cannot be transitioned further.</p>
            )}
          </div>

          {/* Validation warnings */}
          {missing.length > 0 && currentStatus === "draft" && (
            <div className="flex items-start gap-2 p-2 bg-amber-50 rounded text-xs text-amber-700">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>Missing required fields before validation: {missing.join(", ")}</span>
            </div>
          )}

          {/* Action buttons */}
          {transitions.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {transitions.map(t => {
                const stage = LIFECYCLE.find(l => l.key === t);
                const isReject = t === "draft" && currentStatus === "pending_approval";
                return (
                  <Button key={t} size="sm" variant={isReject ? "outline" : "default"} className={`h-7 text-xs gap-1 ${isReject ? "text-destructive border-destructive hover:bg-destructive/10" : ""}`} onClick={() => handleTransition(t)} disabled={transitionMutation.isPending}>
                    {isReject ? <XCircle className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                    {isReject ? "Reject" : `Move to ${stage?.label}`}
                  </Button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm: Move to "{LIFECYCLE.find(l => l.key === targetStatus)?.label}"</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">Add optional notes for the audit trail:</p>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Reason for this transition..." className="text-sm h-20" />
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => transitionMutation.mutate(targetStatus)} disabled={transitionMutation.isPending}>
                <Send className="w-3.5 h-3.5 mr-2" /> Confirm
              </Button>
              <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}