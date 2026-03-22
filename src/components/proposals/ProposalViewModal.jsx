import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  CheckCircle, Send, Eye, XCircle, Building2, Calendar, Users,
  DollarSign, FileText, Clock, Printer, ChevronRight, AlertTriangle, ExternalLink
} from "lucide-react";
import { format, parseISO, isAfter, differenceInDays } from "date-fns";
import SendProposalDialog from "@/components/proposals/SendProposalDialog";

const STATUS_CONFIG = {
  draft:    { label: "Draft",    cls: "bg-gray-100 text-gray-600" },
  sent:     { label: "Sent",     cls: "bg-blue-100 text-blue-700" },
  viewed:   { label: "Viewed",   cls: "bg-purple-100 text-purple-700" },
  approved: { label: "Approved", cls: "bg-green-100 text-green-700" },
  rejected: { label: "Rejected", cls: "bg-red-100 text-red-700" },
  expired:  { label: "Expired",  cls: "bg-orange-100 text-orange-700" },
};

const PLAN_TYPE_COLORS = {
  medical:   "bg-blue-50 text-blue-700 border-blue-200",
  dental:    "bg-green-50 text-green-700 border-green-200",
  vision:    "bg-purple-50 text-purple-700 border-purple-200",
  life:      "bg-orange-50 text-orange-700 border-orange-200",
  std:       "bg-yellow-50 text-yellow-700 border-yellow-200",
  ltd:       "bg-red-50 text-red-700 border-red-200",
  voluntary: "bg-pink-50 text-pink-700 border-pink-200",
};

export default function ProposalViewModal({ proposal, open, onClose, onEdit, onReject }) {
  const queryClient = useQueryClient();
  const [showSendDialog, setShowSendDialog] = useState(false);
  if (!proposal) return null;

  const cfg = STATUS_CONFIG[proposal.status] || STATUS_CONFIG.draft;
  const now = new Date();
  const expiresAt = proposal.expires_at ? parseISO(proposal.expires_at) : null;
  const daysUntilExpiry = expiresAt ? differenceInDays(expiresAt, now) : null;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 7;

  const totalPremium = proposal.total_monthly_premium || 0;
  const employerCost = proposal.employer_monthly_cost || 0;
  const eeCost = proposal.employee_avg_cost || 0;
  const employerPct = totalPremium > 0 ? Math.round((employerCost / totalPremium) * 100) : 0;
  const eePct = 100 - employerPct;

  const updateStatus = useMutation({
    mutationFn: (payload) => base44.entities.Proposal.update(proposal.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      onClose();
    },
  });

  const handlePrint = () => window.print();

  return (
    <>
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0">
        {/* Letterhead */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-white px-8 py-6 rounded-t-xl">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 opacity-80" />
                <span className="text-sm font-medium opacity-80">Benefits Proposal</span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">v{proposal.version || 1}</span>
              </div>
              <h1 className="text-xl font-bold">{proposal.title}</h1>
              {proposal.agency_name && (
                <p className="text-sm opacity-80 mt-1">{proposal.agency_name}</p>
              )}
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20`}>
                {cfg.label}
              </span>
              {isExpiringSoon && (
                <p className="text-xs mt-1 bg-amber-400/30 text-amber-100 px-2 py-0.5 rounded flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Expires in {daysUntilExpiry} days
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-xl border">
            {proposal.employer_name && (
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Employer</p>
                  <p className="text-xs font-semibold">{proposal.employer_name}</p>
                </div>
              </div>
            )}
            {proposal.effective_date && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Effective Date</p>
                  <p className="text-xs font-semibold">{format(parseISO(proposal.effective_date), "MMM d, yyyy")}</p>
                </div>
              </div>
            )}
            {proposal.broker_name && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Broker</p>
                  <p className="text-xs font-semibold">{proposal.broker_name}</p>
                  {proposal.broker_email && <p className="text-[10px] text-muted-foreground">{proposal.broker_email}</p>}
                </div>
              </div>
            )}
            {expiresAt && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Proposal Expires</p>
                  <p className={`text-xs font-semibold ${isExpiringSoon ? "text-amber-600" : ""}`}>
                    {format(expiresAt, "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Cover Message */}
          {proposal.cover_message && (
            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
              <p className="text-xs font-semibold text-blue-700 mb-1.5">Message from Your Broker</p>
              <p className="text-sm text-muted-foreground italic leading-relaxed">"{proposal.cover_message}"</p>
            </div>
          )}

          {/* Cost Summary */}
          {totalPremium > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" /> Cost Summary
              </h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-4 rounded-xl bg-blue-50 border border-blue-100">
                  <p className="text-[10px] text-muted-foreground mb-1">Total Monthly Premium</p>
                  <p className="text-2xl font-bold text-blue-700">${totalPremium.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">100%</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <p className="text-[10px] text-muted-foreground mb-1">Employer Contribution</p>
                  <p className="text-2xl font-bold text-primary">${employerCost.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{employerPct}% of premium</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-muted border">
                  <p className="text-[10px] text-muted-foreground mb-1">Avg Employee Cost</p>
                  <p className="text-2xl font-bold">${eeCost.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{eePct}% of premium</p>
                </div>
              </div>

              {/* Cost Share Bar */}
              {employerPct > 0 && (
                <div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Employer {employerPct}%</span>
                    <span>Employee {eePct}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden flex">
                    <div
                      className="bg-primary rounded-l-full transition-all"
                      style={{ width: `${employerPct}%` }}
                    />
                    <div
                      className="bg-muted-foreground/30 rounded-r-full"
                      style={{ width: `${eePct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Annual totals */}
              <div className="grid grid-cols-3 gap-3 mt-3">
                {[
                  { label: "Annual Total Premium", value: totalPremium * 12 },
                  { label: "Annual Employer Cost", value: employerCost * 12 },
                  { label: "Annual Employee Cost", value: eeCost * 12 },
                ].map(item => item.value > 0 && (
                  <div key={item.label} className="text-center p-2 rounded-lg border bg-card">
                    <p className="text-[10px] text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-semibold">${(item.value).toLocaleString()}/yr</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Plans — grouped by type */}
          {proposal.plan_summary?.length > 0 && (() => {
            const grouped = {};
            proposal.plan_summary.forEach(p => {
              const t = p.plan_type || "other";
              if (!grouped[t]) grouped[t] = [];
              grouped[t].push(p);
            });
            return (
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Included Plans ({proposal.plan_summary.length})
                </h3>
                <div className="space-y-3">
                  {Object.entries(grouped).map(([type, plans]) => (
                    <div key={type}>
                      <p className={`text-[10px] font-semibold uppercase tracking-wide mb-1.5 px-2 py-0.5 rounded-full inline-block border ${PLAN_TYPE_COLORS[type] || "bg-muted text-muted-foreground border-border"}`}>
                        {type}
                      </p>
                      <div className="space-y-1.5">
                        {plans.map((plan, i) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
                                <FileText className="w-3.5 h-3.5 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">{plan.plan_name || plan.name}</p>
                                {plan.carrier && <p className="text-xs text-muted-foreground">{plan.carrier}</p>}
                              </div>
                            </div>
                            {plan.network_type && (
                              <Badge variant="outline" className="text-[10px]">{plan.network_type}</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Contribution Summary */}
          {proposal.contribution_summary && (
            <div className="p-4 rounded-xl bg-muted/30 border">
              <h3 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Contribution Strategy</h3>
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-sm font-medium capitalize">{proposal.contribution_summary.strategy?.replace(/_/g, " ")}</span>
                {proposal.contribution_summary.ee_pct && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    EE: {proposal.contribution_summary.ee_pct}%
                  </span>
                )}
                {proposal.contribution_summary.dep_pct && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    Dependents: {proposal.contribution_summary.dep_pct}%
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="border-t pt-4">
            <h3 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Activity Timeline</h3>
            <div className="space-y-2">
              {[
                { date: proposal.created_date, label: "Proposal created", color: "bg-gray-400" },
                { date: proposal.sent_at, label: "Sent to employer", color: "bg-blue-500" },
                { date: proposal.viewed_at, label: "Viewed by employer", color: "bg-purple-500" },
                { date: proposal.approved_at, label: "Approved by employer", color: "bg-green-500" },
              ].filter(t => t.date).map((t, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.color}`} />
                  <span className="text-xs text-muted-foreground">{t.label}</span>
                  <span className="text-xs font-medium ml-auto">
                    {format(parseISO(t.date), "MMM d, yyyy h:mm a")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Internal Notes */}
          {proposal.notes && (
            <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-100">
              <p className="text-xs font-semibold text-amber-700 mb-1">Internal Notes</p>
              <p className="text-xs text-muted-foreground">{proposal.notes}</p>
            </div>
          )}

          {/* Link to originating scenario */}
          {proposal.case_id && (
            <div className="p-3 rounded-lg bg-muted/30 border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Linked case & scenario</span>
              <div className="flex gap-2">
                <Link to={`/cases/${proposal.case_id}`} onClick={onClose}>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                    <ExternalLink className="w-3 h-3" /> Open Case
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t gap-3 flex-wrap">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1.5" /> Print
              </Button>
              {onEdit && (
                <Button variant="outline" size="sm" onClick={() => { onClose(); onEdit(proposal); }}>
                  Edit Proposal
                </Button>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {proposal.status === "draft" && (
                <Button size="sm" onClick={() => { onClose(); setShowSendDialog(true); }} disabled={updateStatus.isPending}>
                  <Send className="w-3.5 h-3.5 mr-1.5" /> Send Proposal
                </Button>
              )}
              {proposal.status === "sent" && (
                <Button size="sm" variant="outline" className="text-purple-700 border-purple-200 hover:bg-purple-50" onClick={() => updateStatus.mutate({ status: "viewed", viewed_at: new Date().toISOString() })} disabled={updateStatus.isPending}>
                  <Eye className="w-3.5 h-3.5 mr-1.5" /> Mark Viewed
                </Button>
              )}
              {["sent", "viewed"].includes(proposal.status) && (
                <>
                  {onReject && (
                    <Button size="sm" variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/5" onClick={() => { onClose(); onReject(proposal); }} disabled={updateStatus.isPending}>
                      <XCircle className="w-3.5 h-3.5 mr-1.5" /> Reject
                    </Button>
                  )}
                  <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateStatus.mutate({ status: "approved", approved_at: new Date().toISOString() })} disabled={updateStatus.isPending}>
                    <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Approve
                  </Button>
                </>
              )}
              {proposal.status === "approved" && (
                <Link to={`/enrollment?case_id=${proposal.case_id}`} onClick={onClose}>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 gap-1">
                    <ChevronRight className="w-3.5 h-3.5" /> Proceed to Enrollment
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {showSendDialog && (
      <SendProposalDialog
        proposal={proposal}
        open={showSendDialog}
        onClose={() => setShowSendDialog(false)}
      />
    )}
    </>
  );
}