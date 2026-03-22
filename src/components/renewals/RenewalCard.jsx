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
  const daysUntilRenewal = renewal.renewal_date
    ? differenceInDays(new Date(renewal.renewal_date), new Date())
    : null;

  // Urgency tier
  let urgencyTier = null;
  let urgencyColor = null;
  if (daysUntilRenewal !== null) {
    if (daysUntilRenewal <= 30) {
      urgencyTier = "Due within 30 days";
      urgencyColor = "bg-red-100 text-red-700";
    } else if (daysUntilRenewal <= 60) {
      urgencyTier = "Due within 60 days";
      urgencyColor = "bg-amber-100 text-amber-700";
    } else if (daysUntilRenewal <= 90) {
      urgencyTier = "Due within 90 days";
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
    <Card className="hover:shadow-md transition-all" onClick={onClick}>
      <CardContent className="p-4 space-y-3">
        {/* Header: employer, status, urgency */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{renewal.employer_name || "Unknown Employer"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {renewal.renewal_date && `Renews ${format(new Date(renewal.renewal_date), "MMM d, yyyy")}`}
              {daysUntilRenewal !== null && ` • ${daysUntilRenewal} days`}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <StatusBadge status={renewal.status} />
            {urgencyTier && (
              <Badge className={`text-[10px] font-semibold ${urgencyColor}`}>
                <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
                {daysUntilRenewal}d
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

        {/* Recommendation and assigned broker */}
        <div className="flex items-center justify-between gap-2 text-xs flex-wrap">
          {renewal.recommendation && (
            <Badge variant="outline" className="capitalize text-[10px]">
              Rec: {renewal.recommendation.replace(/_/g, " ")}
            </Badge>
          )}
          {renewal.assigned_to && (
            <span className="text-muted-foreground">Assigned: {renewal.assigned_to}</span>
          )}
        </div>

        {/* Action button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs"
          onClick={e => { e.stopPropagation(); onEdit?.(); }}
        >
          <Pencil className="w-3 h-3 mr-1" /> Edit & View Details
        </Button>
      </CardContent>
    </Card>
  );
}