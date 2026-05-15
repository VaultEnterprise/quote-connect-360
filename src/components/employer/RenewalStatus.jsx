import React from "react";
import { AlertCircle, Calendar, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, differenceInDays } from "date-fns";

export default function RenewalStatus({ renewalCycle, currentCaseExpiry }) {
  if (!renewalCycle) return null;

  const daysToRateLock = differenceInDays(new Date(renewalCycle.renewal_date), new Date());
  const isUrgent = daysToRateLock <= 30;

  return (
    <Card className={isUrgent ? "border-amber-200 bg-amber-50/30" : ""}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Renewal Status</p>
          <Badge variant={isUrgent ? "destructive" : "default"} className="text-xs">
            {daysToRateLock <= 0 ? "Rate lock passed" : `${daysToRateLock} days to lock rate`}
          </Badge>
        </div>

        <div className="space-y-4">
          {/* Timeline */}
          <div className="space-y-2">
            <div className="flex gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Current coverage expires</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">
                  {format(new Date(currentCaseExpiry), "MMMM d, yyyy")}
                </p>
              </div>
            </div>
            <div className="flex gap-3 ml-2 pl-3 border-l-2 border-muted">
              <TrendingUp className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Renewal effective date</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">
                  {format(new Date(renewalCycle.renewal_date), "MMMM d, yyyy")}
                </p>
              </div>
            </div>
          </div>

          {/* Rate lock warning */}
          {isUrgent && (
            <div className="flex gap-2 p-3 bg-amber-100 border border-amber-300 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800">
                <p className="font-medium">Rate lock deadline approaching</p>
                <p className="mt-0.5">Lock in rates by {format(new Date(renewalCycle.renewal_date), "MMM d")} to avoid market rate increases.</p>
              </div>
            </div>
          )}

          {/* Incumbent offer */}
          {renewalCycle.recommendation && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-semibold text-blue-900 mb-2">Incumbent Carrier Offer</p>
              <p className="text-xs text-blue-800">
                <strong>Rate change:</strong> {renewalCycle.rate_change_percent > 0 ? "+" : ""}{renewalCycle.rate_change_percent}%
              </p>
              <p className="text-xs text-blue-800 mt-1">
                <strong>Recommendation:</strong> {renewalCycle.recommendation?.replace(/_/g, " ")}
              </p>
            </div>
          )}

          {/* Market comparison */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Market Comparison</p>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Incumbent quote</span>
                <span className="font-medium">${(renewalCycle.renewal_premium || 0).toLocaleString()}/mo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Market average (quotes received)</span>
                <span className="font-medium">3 quotes pending</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 text-xs">
              View Quotes
            </Button>
            <Button size="sm" className="flex-1 text-xs">
              Lock Rate
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}