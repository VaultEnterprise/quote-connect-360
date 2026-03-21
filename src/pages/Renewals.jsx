import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { RefreshCw, Calendar, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import MetricCard from "@/components/shared/MetricCard";
import { format } from "date-fns";

export default function Renewals() {
  const { data: renewals = [] } = useQuery({
    queryKey: ["renewals-all"],
    queryFn: () => base44.entities.RenewalCycle.list("renewal_date", 50),
  });

  const pending = renewals.filter(r => ["pre_renewal", "marketed", "options_prepared"].includes(r.status));
  const inReview = renewals.filter(r => r.status === "employer_review");
  const avgChange = renewals.length > 0
    ? (renewals.reduce((sum, r) => sum + (r.rate_change_percent || 0), 0) / renewals.length).toFixed(1)
    : 0;

  return (
    <div>
      <PageHeader
        title="Renewals"
        description="Track and manage upcoming renewals"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricCard label="Pending Renewals" value={pending.length} icon={RefreshCw} />
        <MetricCard label="In Employer Review" value={inReview.length} icon={Calendar} />
        <MetricCard
          label="Avg Rate Change"
          value={`${avgChange > 0 ? "+" : ""}${avgChange}%`}
          icon={TrendingUp}
          trend={avgChange > 0 ? "down" : "up"}
        />
      </div>

      {renewals.length === 0 ? (
        <EmptyState
          icon={RefreshCw}
          title="No Renewals"
          description="Renewal cycles will appear here as cases approach their renewal dates"
        />
      ) : (
        <div className="space-y-2">
          {renewals.map((r) => (
            <Card key={r.id} className="hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{r.employer_name || "Unknown Employer"}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Renews {r.renewal_date ? format(new Date(r.renewal_date), "MMM d, yyyy") : "TBD"}
                      </span>
                      {r.rate_change_percent !== undefined && r.rate_change_percent !== null && (
                        <span className={`flex items-center gap-0.5 font-medium ${r.rate_change_percent > 0 ? "text-destructive" : r.rate_change_percent < 0 ? "text-green-600" : "text-muted-foreground"}`}>
                          {r.rate_change_percent > 0 ? <TrendingUp className="w-3 h-3" /> : r.rate_change_percent < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                          {r.rate_change_percent > 0 ? "+" : ""}{r.rate_change_percent}%
                        </span>
                      )}
                      {r.disruption_score !== undefined && r.disruption_score !== null && (
                        <span className="text-muted-foreground">Disruption: {r.disruption_score}/100</span>
                      )}
                    </div>
                  </div>
                </div>
                <StatusBadge status={r.status} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}