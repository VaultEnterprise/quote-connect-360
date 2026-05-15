import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, TrendingUp, TrendingDown, Minus, Pencil, AlertTriangle, StickyNote, ChevronDown, ChevronUp, Building2 } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import StatusBadge from "@/components/shared/StatusBadge";

/**
 * RenewalCard
 * Rich renewal card with urgency/overdue badge, inline quick actions, carrier, notes preview, bulk select.
 *
 * Props:
 *   renewal      — RenewalCycle
 *   onEdit       — () => void
 *   onClick      — () => void
 *   isSelected   — boolean
 *   onToggleSelect — (id) => void
 */
export default function RenewalCard({ renewal, onEdit, onClick, isSelected, onToggleSelect }) {
  const queryClient = useQueryClient();
  const [showNotes, setShowNotes] = useState(false);

  const updateStatus = useMutation({
    mutationFn: async (status) => {
      const updated = await base44.entities.RenewalCycle.update(renewal.id, { status });
      if (renewal.case_id) {
        await base44.entities.BenefitCase.update(renewal.case_id, {
          stage: status === "completed" ? "renewed" : "renewal_pending",
          last_activity_date: new Date().toISOString(),
        });
      }
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["renewals-all"] });
      queryClient.invalidateQueries({ queryKey: ["case", renewal.case_id] });
    },
  });

  const daysUntilRenewal = renewal.renewal_date
    ? differenceInDays(new Date(renewal.renewal_date), new Date())
    : null;

  const isPastDue = daysUntilRenewal !== null && daysUntilRenewal < 0 && renewal.status !== "completed";

  // Urgency tier
  let urgencyTier = null;
  let urgencyColor = null;
  if (isPastDue) {
    urgencyTier = `${Math.abs(daysUntilRenewal)}d overdue`;
    urgencyColor = "bg-red-200 text-red-800";
  } else if (daysUntilRenewal !== null) {
    if (daysUntilRenewal <= 30) {
      urgencyTier = `${daysUntilRenewal}d left`;
      urgencyColor = "bg-red-100 text-red-700";
    } else if (daysUntilRenewal <= 60) {
      urgencyTier = `${daysUntilRenewal}d left`;
      urgencyColor = "bg-amber-100 text-amber-700";
    } else if (daysUntilRenewal <= 90) {
      urgencyTier = `${daysUntilRenewal}d left`;
      urgencyColor = "bg-yellow-100 text-yellow-700";
    }
  }

  const rateChangeIcon =
    renewal.rate_change_percent === undefined || renewal.rate_change_percent === null
      ? <Minus className="w-3.5 h-3.5" />
      : renewal.rate_change_percent > 0
      ? <TrendingUp className="w-3.5 h-3.5" />
      : <TrendingDown className="w-3.5 h-3.5" />;

  const rateChangeColor =
    renewal.rate_change_percent === undefined || renewal.rate_change_percent === null
      ? "text-muted-foreground"
      : renewal.rate_change_percent > 0
      ? "text-destructive"
      : "text-green-600";

  return (
    <Card className={`hover:shadow-md transition-all ${isPastDue ? "border-red-300 bg-red-50/30" : ""} ${isSelected ? "ring-2 ring-primary/30 bg-primary/5" : ""}`} onClick={onClick}>
      <CardContent className="p-4 space-y-3">
        {/* Header: employer, status, urgency */}
        <div className="flex items-start justify-between gap-3">
          {/* Bulk select checkbox */}
          <div className="flex items-start gap-2 flex-1 min-w-0">
            {onToggleSelect && (
              <Checkbox
                checked={!!isSelected}
                onCheckedChange={() => onToggleSelect(renewal.id)}
                onClick={e => e.stopPropagation()}
                className="mt-0.5 flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{renewal.employer_name || "Unknown Employer"}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <p className="text-xs text-muted-foreground">
                  {renewal.renewal_date && `Renews ${format(new Date(renewal.renewal_date), "MMM d, yyyy")}`}
                </p>
                {renewal.assigned_to && (
                  <span className="text-xs text-muted-foreground">• {renewal.assigned_to.split("@")[0]}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <StatusBadge status={renewal.status} />
            {urgencyTier && (
              <Badge className={`text-[10px] font-semibold ${urgencyColor}`}>
                {isPastDue && <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />}
                {urgencyTier}
              </Badge>
            )}
          </div>
        </div>

        {/* Premium and rate change */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          {renewal.current_premium && (
            <div className="p-2 rounded bg-muted/40">
              <p className="text-muted-foreground">Current Premium</p>
              <p className="font-semibold text-sm mt-0.5">${renewal.current_premium.toLocaleString()}</p>
            </div>
          )}
          {renewal.renewal_premium && (
            <div className="p-2 rounded bg-muted/40">
              <p className="text-muted-foreground">Renewal Premium</p>
              <p className="font-semibold text-sm mt-0.5">${renewal.renewal_premium.toLocaleString()}</p>
            </div>
          )}
          {renewal.rate_change_percent !== undefined && renewal.rate_change_percent !== null && (
            <div className={`p-2 rounded flex items-center gap-1 ${renewal.rate_change_percent > 0 ? "bg-red-50 border border-red-200" : renewal.rate_change_percent < 0 ? "bg-green-50 border border-green-200" : "bg-muted/40"}`}>
              <span className={`font-semibold text-sm ${rateChangeColor} flex items-center gap-1`}>
                {rateChangeIcon}
                {renewal.rate_change_percent > 0 ? "+" : ""}{renewal.rate_change_percent}%
              </span>
            </div>
          )}
        </div>

        {/* Disruption score bar */}
        {renewal.disruption_score !== undefined && renewal.disruption_score !== null && (
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Disruption Risk</span>
              <span className={`font-semibold ${renewal.disruption_score >= 70 ? "text-destructive" : renewal.disruption_score >= 40 ? "text-amber-600" : "text-green-600"}`}>
                {renewal.disruption_score}/100
              </span>
            </div>
            <Progress
              value={renewal.disruption_score}
              className="h-1.5"
            />
          </div>
        )}

        {/* Recommendation + inline quick-action status changer */}
        <div className="flex items-center justify-between gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-1.5 flex-wrap">
            {renewal.recommendation && (
              <Badge variant="outline" className="capitalize text-[10px]">
                Rec: {renewal.recommendation.replace(/_/g, " ")}
              </Badge>
            )}
            {renewal.decision && (
              <Badge className="bg-green-100 text-green-700 text-[10px]">
                {renewal.decision.replace(/_/g, " ")}
              </Badge>
            )}
          </div>

          {/* Inline status quick-change */}
          <Select
            value={renewal.status}
            onValueChange={(v) => updateStatus.mutate(v)}
          >
            <SelectTrigger className="h-6 text-[10px] w-36 border-dashed" onClick={e => e.stopPropagation()}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pre_renewal">Pre-Renewal</SelectItem>
              <SelectItem value="marketed">Marketed</SelectItem>
              <SelectItem value="options_prepared">Options Prepared</SelectItem>
              <SelectItem value="employer_review">Employer Review</SelectItem>
              <SelectItem value="decision_made">Decision Made</SelectItem>
              <SelectItem value="install_renewal">Installing</SelectItem>
              <SelectItem value="active_renewal">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Notes inline preview */}
        {renewal.notes && (
          <div onClick={e => e.stopPropagation()}>
            <button
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowNotes(v => !v)}
            >
              <StickyNote className="w-3 h-3" />
              {showNotes ? "Hide notes" : "Show notes"}
              {showNotes ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {showNotes && (
              <p className="mt-1.5 p-2 rounded bg-amber-50 border border-amber-200 text-xs text-amber-900 whitespace-pre-wrap">
                {renewal.notes}
              </p>
            )}
          </div>
        )}

        {/* Action button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs"
          onClick={e => { e.stopPropagation(); onEdit?.(); }}
        >
          <Pencil className="w-3 h-3 mr-1" /> View Full Details
        </Button>
      </CardContent>
    </Card>
  );
}