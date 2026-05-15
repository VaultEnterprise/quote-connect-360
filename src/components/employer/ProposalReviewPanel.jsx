import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle, ChevronDown, ChevronUp, DollarSign, FileText,
  Calendar, AlertTriangle, Printer
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import EmptyState from "@/components/shared/EmptyState";

const STATUS_STYLES = {
  draft:    "bg-gray-100 text-gray-600",
  sent:     "bg-blue-100 text-blue-700",
  viewed:   "bg-indigo-100 text-indigo-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  expired:  "bg-orange-100 text-orange-700",
};

const PLAN_TYPE_COLORS = {
  medical:   "bg-blue-50 text-blue-700 border-blue-200",
  dental:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  vision:    "bg-purple-50 text-purple-700 border-purple-200",
  life:      "bg-red-50 text-red-700 border-red-200",
  std:       "bg-orange-50 text-orange-700 border-orange-200",
  ltd:       "bg-amber-50 text-amber-700 border-amber-200",
  voluntary: "bg-pink-50 text-pink-700 border-pink-200",
};

function CostShareBar({ employerCost, employeeCost }) {
  const total = (employerCost || 0) + (employeeCost || 0);
  if (!total) return null;
  const empPct = Math.round(((employerCost || 0) / total) * 100);
  const eePct = 100 - empPct;

  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>Employer {empPct}%</span>
        <span>Employee {eePct}%</span>
      </div>
      <div className="flex h-3 rounded-full overflow-hidden">
        <div className="bg-primary transition-all" style={{ width: `${empPct}%` }} />
        <div className="bg-primary/20 flex-1" />
      </div>
      <div className="flex justify-between text-xs mt-1">
        <span className="font-medium">${(employerCost || 0).toLocaleString()}/mo</span>
        <span className="text-muted-foreground">avg ${(employeeCost || 0).toLocaleString()}/mo/ee</span>
      </div>
    </div>
  );
}

function ProposalCard({ proposal, caseId }) {
  const [expanded, setExpanded] = useState(["sent", "viewed"].includes(proposal.status));
  const queryClient = useQueryClient();

  const daysUntilExpiry = proposal.expires_at
    ? differenceInDays(new Date(proposal.expires_at), new Date())
    : null;

  const approve = useMutation({
    mutationFn: () => base44.entities.Proposal.update(proposal.id, {
      status: "approved",
      approved_at: new Date().toISOString(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals-employer", caseId] });
      queryClient.invalidateQueries({ queryKey: ["case", caseId] });
    },
  });

  const plansByType = (proposal.plan_summary || []).reduce((acc, plan) => {
    const type = plan.plan_type || "other";
    if (!acc[type]) acc[type] = [];
    acc[type].push(plan);
    return acc;
  }, {});

  const isPending = ["sent", "viewed"].includes(proposal.status);

  return (
    <Card className={isPending ? "border-primary/40 shadow-sm" : ""}>
      <CardContent className="p-0">
        {/* Header row */}
        <div
          className="p-4 cursor-pointer flex items-start justify-between gap-4"
          onClick={() => setExpanded(v => !v)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm">{proposal.title}</p>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[proposal.status] || ""}`}>
                {proposal.status}
              </span>
              {daysUntilExpiry !== null && daysUntilExpiry <= 7 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                  <AlertTriangle className="w-2.5 h-2.5" /> Expires in {daysUntilExpiry}d
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
              {proposal.total_monthly_premium && (
                <span className="flex items-center gap-1 font-medium text-foreground">
                  <DollarSign className="w-3 h-3" />${proposal.total_monthly_premium.toLocaleString()}/mo total
                </span>
              )}
              {proposal.sent_at && <span>Sent {format(new Date(proposal.sent_at), "MMM d, yyyy")}</span>}
              {proposal.effective_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />Effective {format(new Date(proposal.effective_date), "MMM d, yyyy")}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>

        {/* Expanded detail */}
        {expanded && (
          <div className="border-t px-4 pb-4 pt-3 space-y-4">
            {proposal.cover_message && (
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Message from your broker</p>
                <p className="text-sm italic">"{proposal.cover_message}"</p>
              </div>
            )}

            {/* Cost share visualization */}
            {(proposal.employer_monthly_cost || proposal.employee_avg_cost) && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Cost Share</p>
                <CostShareBar employerCost={proposal.employer_monthly_cost} employeeCost={proposal.employee_avg_cost} />
              </div>
            )}

            {/* Plans grouped by type */}
            {Object.keys(plansByType).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Plans Included</p>
                {Object.entries(plansByType).map(([type, plans]) => (
                  <div key={type} className="mb-3">
                    <p className="text-xs font-medium capitalize text-muted-foreground mb-1.5">{type}</p>
                    <div className="space-y-1.5">
                      {plans.map((plan, i) => (
                        <div key={i} className={`flex items-center justify-between text-xs p-2 rounded border ${PLAN_TYPE_COLORS[type] || "bg-muted/40 text-muted-foreground border-border"}`}>
                          <span className="font-medium">{plan.plan_name || plan.name || "Plan"}</span>
                          <div className="flex items-center gap-3">
                            {plan.carrier && <span className="opacity-70">{plan.carrier}</span>}
                            {plan.network_type && <span className="opacity-70">{plan.network_type}</span>}
                            {plan.monthly_premium && <span className="font-semibold">${plan.monthly_premium.toLocaleString()}/mo</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-1 border-t">
              <Button variant="ghost" size="sm" className="text-xs gap-1.5" onClick={() => window.print()}>
                <Printer className="w-3.5 h-3.5" /> Print
              </Button>
              {isPending && (
                <Button
                  className="bg-green-600 hover:bg-green-700 gap-1.5"
                  onClick={() => approve.mutate()}
                  disabled={approve.isPending}
                >
                  <CheckCircle className="w-4 h-4" />
                  {approve.isPending ? "Approving…" : "Approve Proposal"}
                </Button>
              )}
              {proposal.status === "approved" && (
                <Badge className="bg-green-100 text-green-700 gap-1">
                  <CheckCircle className="w-3 h-3" /> Approved
                  {proposal.approved_at && ` — ${format(new Date(proposal.approved_at), "MMM d")}`}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * ProposalReviewPanel
 * Full proposal list with expandable detail, cost share viz, plan table, and approve action.
 *
 * Props:
 *   proposals — Proposal[]
 *   caseId    — string
 */
export default function ProposalReviewPanel({ proposals, caseId }) {
  if (proposals.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No Proposals Yet"
        description="Your broker is preparing plan options for your review. You'll be notified when they're ready."
      />
    );
  }

  return (
    <div className="space-y-3">
      {proposals.map(p => <ProposalCard key={p.id} proposal={p} caseId={caseId} />)}
    </div>
  );
}