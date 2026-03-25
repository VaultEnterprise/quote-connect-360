import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { History, RotateCcw, CheckCircle, Clock, XCircle, GitBranch } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const statusConfig = {
  approved: { label: "Approved", color: "bg-green-100 text-green-700", icon: CheckCircle },
  pending_approval: { label: "Pending", color: "bg-amber-100 text-amber-700", icon: Clock },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700", icon: XCircle },
  draft: { label: "Draft", color: "bg-gray-100 text-gray-600", icon: Clock },
};

export default function PlanVersioningPanel({ plan }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedVersion, setSelectedVersion] = useState(null);

  const { data: versions = [], isLoading } = useQuery({
    queryKey: ["plan-versions", plan?.id],
    queryFn: () => base44.entities.PlanVersion.filter({ plan_id: plan?.id }),
    enabled: !!plan?.id,
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ["plan-audit", plan?.id],
    queryFn: () => base44.entities.PlanAuditLog.filter({ plan_id: plan?.id }),
    enabled: !!plan?.id,
  });

  const rollbackMutation = useMutation({
    mutationFn: async (version) => {
      // Create audit log entry
      await base44.entities.PlanAuditLog.create({
        plan_id: plan.id, action: "restored", actor_email: user?.email || "unknown",
        description: `Rolled back to version ${version.version_number}`,
        is_rollback: true, rollback_to_version: version.version_number, source: "manual",
      });
      // Apply the snapshot back to the plan
      if (version.plan_data_snapshot) {
        await base44.entities.BenefitPlan.update(plan.id, version.plan_data_snapshot);
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["benefit-plans"] }); toast.success("Plan rolled back successfully"); setSelectedVersion(null); },
  });

  const approveMutation = useMutation({
    mutationFn: (versionId) => base44.entities.PlanVersion.update(versionId, { approval_status: "approved" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["plan-versions", plan?.id] }); toast.success("Version approved"); },
  });

  const sortedVersions = [...versions].sort((a, b) => b.version_number - a.version_number);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">Version History</h3>
        <Badge variant="outline" className="text-xs">{versions.length} versions</Badge>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(3)].map((_,i) => <div key={i} className="h-14 rounded bg-muted animate-pulse" />)}</div>
      ) : sortedVersions.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-4">No version history yet. Versions are created on every save.</p>
      ) : (
        <div className="space-y-2">
          {sortedVersions.map((v, idx) => {
            const cfg = statusConfig[v.approval_status] || statusConfig.draft;
            const Icon = cfg.icon;
            return (
              <div key={v.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedVersion?.id === v.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`} onClick={() => setSelectedVersion(v)}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${idx === 0 ? "bg-primary text-white" : "bg-muted"}`}>
                  <span className="text-xs font-bold">{v.version_number}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium">{v.change_type?.replace("_", " ").toUpperCase()}</span>
                    <Badge className={`text-xs h-4 px-1 ${cfg.color}`}>{cfg.label}</Badge>
                    {idx === 0 && <Badge className="text-xs h-4 px-1 bg-blue-100 text-blue-700">Current</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{v.changes_summary || "No description"}</p>
                  <p className="text-xs text-muted-foreground">{v.changed_by} · {v.created_date ? format(new Date(v.created_date), "MMM d, yyyy h:mm a") : "—"}</p>
                </div>
                {v.approval_status === "pending_approval" && user?.role === "admin" && (
                  <Button size="sm" className="h-6 text-xs" onClick={e => { e.stopPropagation(); approveMutation.mutate(v.id); }}>Approve</Button>
                )}
                {idx > 0 && (
                  <Button size="sm" variant="ghost" className="h-6 text-xs gap-1 text-muted-foreground hover:text-foreground" onClick={e => { e.stopPropagation(); setSelectedVersion(v); }}>
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Audit Log */}
      {auditLogs.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1"><History className="w-3 h-3" /> Audit Trail (Immutable)</p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {[...auditLogs].sort((a,b) => new Date(b.created_date) - new Date(a.created_date)).map(log => (
              <div key={log.id} className="text-xs flex items-center gap-2 py-1 border-b border-border/50">
                <span className="text-muted-foreground">{log.created_date ? format(new Date(log.created_date), "MM/dd h:mm a") : "—"}</span>
                <span className="font-medium uppercase text-xs">{log.action}</span>
                <span className="text-muted-foreground truncate">{log.actor_email}</span>
                {log.description && <span className="text-muted-foreground truncate">— {log.description}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rollback Dialog */}
      <Dialog open={!!selectedVersion && sortedVersions.indexOf(selectedVersion) > 0} onOpenChange={open => !open && setSelectedVersion(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Rollback to Version {selectedVersion?.version_number}?</DialogTitle></DialogHeader>
          {selectedVersion && (
            <div className="space-y-3 py-2">
              <p className="text-sm text-muted-foreground">This will restore the plan to the state it was in at version {selectedVersion.version_number}. A new version will be created to record the rollback.</p>
              <div className="bg-muted/40 rounded-lg p-3 text-sm">
                <p><span className="font-medium">Changed by:</span> {selectedVersion.changed_by}</p>
                <p><span className="font-medium">Type:</span> {selectedVersion.change_type}</p>
                {selectedVersion.changes_summary && <p><span className="font-medium">Notes:</span> {selectedVersion.changes_summary}</p>}
              </div>
              <div className="flex gap-2">
                <Button onClick={() => rollbackMutation.mutate(selectedVersion)} disabled={rollbackMutation.isPending} className="flex-1">
                  <RotateCcw className="w-3.5 h-3.5 mr-2" /> Confirm Rollback
                </Button>
                <Button variant="outline" onClick={() => setSelectedVersion(null)}>Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}