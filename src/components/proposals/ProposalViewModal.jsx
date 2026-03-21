import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Send, DollarSign, Users, Calendar, Building2, FileText } from "lucide-react";
import { format } from "date-fns";

export default function ProposalViewModal({ proposal, open, onClose, onStatusChange }) {
  if (!proposal) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {proposal.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4">
            {proposal.employer_name && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{proposal.employer_name}</span>
              </div>
            )}
            {proposal.effective_date && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Effective {format(new Date(proposal.effective_date), "MMMM d, yyyy")}</span>
              </div>
            )}
            {proposal.broker_name && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>{proposal.broker_name} • {proposal.broker_email}</span>
              </div>
            )}
            {proposal.expires_at && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Expires {format(new Date(proposal.expires_at), "MMM d, yyyy")}</span>
              </div>
            )}
          </div>

          {proposal.cover_message && (
            <div className="p-4 rounded-xl bg-muted/50 border italic text-sm text-muted-foreground">
              "{proposal.cover_message}"
            </div>
          )}

          {/* Cost Summary */}
          {(proposal.total_monthly_premium || proposal.employer_monthly_cost) && (
            <div>
              <h3 className="text-sm font-semibold mb-3">Cost Summary</h3>
              <div className="grid grid-cols-3 gap-3">
                {proposal.total_monthly_premium && (
                  <div className="text-center p-3 rounded-xl bg-blue-50 border border-blue-100">
                    <p className="text-xs text-muted-foreground mb-1">Total Monthly</p>
                    <p className="text-xl font-bold text-blue-700">${proposal.total_monthly_premium.toLocaleString()}</p>
                  </div>
                )}
                {proposal.employer_monthly_cost && (
                  <div className="text-center p-3 rounded-xl bg-primary/5 border border-primary/10">
                    <p className="text-xs text-muted-foreground mb-1">Employer Cost</p>
                    <p className="text-xl font-bold text-primary">${proposal.employer_monthly_cost.toLocaleString()}</p>
                  </div>
                )}
                {proposal.employee_avg_cost && (
                  <div className="text-center p-3 rounded-xl bg-muted border">
                    <p className="text-xs text-muted-foreground mb-1">Avg EE Cost</p>
                    <p className="text-xl font-bold">${proposal.employee_avg_cost.toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Plans */}
          {proposal.plan_summary?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3">Included Plans ({proposal.plan_summary.length})</h3>
              <div className="space-y-2">
                {proposal.plan_summary.map((plan, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div>
                      <p className="text-sm font-medium">{plan.plan_name || plan.name}</p>
                      {plan.carrier && <p className="text-xs text-muted-foreground">{plan.carrier}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {plan.plan_type && <Badge variant="outline" className="text-[10px] capitalize">{plan.plan_type}</Badge>}
                      {plan.network_type && <Badge variant="outline" className="text-[10px]">{plan.network_type}</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status & Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge className="capitalize">{proposal.status}</Badge>
              {proposal.sent_at && <span className="text-xs text-muted-foreground">Sent {format(new Date(proposal.sent_at), "MMM d, yyyy")}</span>}
            </div>
            <div className="flex gap-2">
              {proposal.status === "draft" && (
                <Button size="sm" onClick={() => { onStatusChange(proposal.id, "sent"); onClose(); }}>
                  <Send className="w-3.5 h-3.5 mr-1.5" /> Mark as Sent
                </Button>
              )}
              {["sent","viewed"].includes(proposal.status) && (
                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => { onStatusChange(proposal.id, "approved"); onClose(); }}>
                  <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Approve
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}