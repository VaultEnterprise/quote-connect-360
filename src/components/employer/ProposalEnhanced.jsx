import React, { useState } from "react";
import { TrendingUp, TrendingDown, Star, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";

export default function ProposalEnhanced({ proposal, priorProposal }) {
  const [showComparison, setShowComparison] = useState(false);

  if (!proposal) return null;

  const rateChange = priorProposal
    ? ((proposal.total_monthly_premium - priorProposal.total_monthly_premium) / priorProposal.total_monthly_premium) * 100
    : null;

  const isRenewal = !!priorProposal;
  const rateChangeDirection = rateChange > 0 ? "up" : rateChange < 0 ? "down" : "flat";

  return (
    <Card className={proposal.status === "approved" ? "border-green-200 bg-green-50/30" : proposal.status === "rejected" ? "border-destructive/30" : ""}>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">{proposal.title || "Proposal"}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Effective {format(new Date(proposal.effective_date), "MMM d, yyyy")}
            </p>
          </div>
          <Badge
            variant={proposal.status === "approved" ? "default" : proposal.status === "rejected" ? "destructive" : "outline"}
            className="flex-shrink-0"
          >
            {proposal.status?.replace(/_/g, " ")}
          </Badge>
        </div>

        {/* Rate change callout (renewal) */}
        {isRenewal && rateChange !== null && (
          <div className={`flex items-center gap-2 p-3 rounded-lg ${rateChangeDirection === "up" ? "bg-amber-50 border border-amber-200" : rateChangeDirection === "down" ? "bg-green-50 border border-green-200" : "bg-blue-50 border border-blue-200"}`}>
            {rateChangeDirection === "up" ? (
              <TrendingUp className="w-4 h-4 text-amber-600" />
            ) : rateChangeDirection === "down" ? (
              <TrendingDown className="w-4 h-4 text-green-600" />
            ) : (
              <span className="text-sm font-bold">→</span>
            )}
            <div className="text-xs">
              <p className="font-medium">Year-over-year comparison</p>
              <p className="mt-0.5">
                {rateChangeDirection === "up"
                  ? `Rates up ${Math.abs(rateChange).toFixed(1)}% from prior year`
                  : rateChangeDirection === "down"
                    ? `Rates down ${Math.abs(rateChange).toFixed(1)}% from prior year`
                    : "Rates flat from prior year"}
              </p>
            </div>
          </div>
        )}

        {/* Cost summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Monthly Premium</p>
            <p className="text-lg font-bold text-foreground mt-1">${(proposal.total_monthly_premium || 0).toLocaleString()}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Employer Cost</p>
            <p className="text-lg font-bold text-primary mt-1">${(proposal.employer_monthly_cost || 0).toLocaleString()}</p>
          </div>
        </div>

        {/* Plans summary */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Plans Included</p>
          <div className="space-y-1.5 text-sm">
            {proposal.plan_summary?.slice(0, 3).map((plan, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-muted-foreground">{plan.plan_type || "Plan"}</span>
                <span className="font-medium">${(plan.monthly_cost || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Key changes callout */}
        {proposal.status !== "rejected" && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs font-medium text-blue-900 flex items-center gap-2">
              <Star className="w-3.5 h-3.5" />
              Key Changes in This Proposal
            </p>
            <ul className="text-xs text-blue-800 mt-2 space-y-1 ml-5 list-disc">
              {isRenewal && <li>New carrier options for competitive rates</li>}
              <li>Updated deductible structures for better cost-sharing</li>
              <li>Enhanced wellness program benefits</li>
            </ul>
          </div>
        )}

        {/* Comparison dialog */}
        {isRenewal && (
          <Dialog open={showComparison} onOpenChange={setShowComparison}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full text-xs">
                View Year-over-Year Comparison
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Proposal Comparison</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-96 overflow-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">Prior Year</p>
                    <p className="text-lg font-bold">${(priorProposal?.total_monthly_premium || 0).toLocaleString()}/mo</p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-xs text-muted-foreground mb-2">New Proposal</p>
                    <p className="text-lg font-bold text-primary">${(proposal.total_monthly_premium || 0).toLocaleString()}/mo</p>
                  </div>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm font-medium text-amber-900">
                    {rateChange > 0 ? "📈" : rateChange < 0 ? "📉" : "→"} {Math.abs(rateChange || 0).toFixed(1)}% change
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Action buttons */}
        {["sent", "viewed"].includes(proposal.status) && (
          <div className="flex gap-2 pt-2">
            <Button className="flex-1" size="sm">
              Approve
            </Button>
            <Button variant="outline" className="flex-1" size="sm">
              Request Changes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}