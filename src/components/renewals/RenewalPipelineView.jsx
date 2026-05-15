import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { format } from "date-fns";
import StatusBadge from "@/components/shared/StatusBadge";
import RenewalCard from "./RenewalCard";

const STAGE_CONFIG = {
  pre_renewal:       { label: "Pre-Renewal", order: 0, color: "bg-slate-50 border-slate-200" },
  marketed:          { label: "Marketed", order: 1, color: "bg-blue-50 border-blue-200" },
  options_prepared:  { label: "Options Prepared", order: 2, color: "bg-indigo-50 border-indigo-200" },
  employer_review:   { label: "Employer Review", order: 3, color: "bg-amber-50 border-amber-200" },
  decision_made:     { label: "Decision Made", order: 4, color: "bg-green-50 border-green-200" },
  install_renewal:   { label: "Installing", order: 5, color: "bg-purple-50 border-purple-200" },
  active_renewal:    { label: "Active", order: 6, color: "bg-emerald-50 border-emerald-200" },
  completed:         { label: "Completed", order: 7, color: "bg-gray-50 border-gray-200" },
};

/**
 * RenewalPipelineView
 * Kanban-style pipeline grouped by stage.
 *
 * Props:
 *   renewals  — RenewalCycle[]
 *   onSelect  — (renewal) => void
 *   onEdit    — (renewal) => void
 */
export default function RenewalPipelineView({ renewals, onSelect, onEdit }) {
  // Group by stage
  const stageGroups = Object.keys(STAGE_CONFIG).reduce((acc, stage) => {
    acc[stage] = renewals.filter(r => r.status === stage).sort((a, b) => {
      // Sort by renewal date within stage (soonest first)
      const aDate = a.renewal_date ? new Date(a.renewal_date) : new Date(8640000000000000);
      const bDate = b.renewal_date ? new Date(b.renewal_date) : new Date(8640000000000000);
      return aDate - bDate;
    });
    return acc;
  }, {});

  // Stages with renewals
  const activeStages = Object.keys(stageGroups).filter(stage => stageGroups[stage].length > 0);

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {activeStages.map(stage => {
          const config = STAGE_CONFIG[stage];
          const renewalList = stageGroups[stage];

          return (
            <div key={stage} className="flex-shrink-0 w-80">
              {/* Column header */}
              <div className={`${config.color} border rounded-t-lg p-3 border-b-0`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm">{config.label}</p>
                  <Badge className="text-[10px] bg-muted text-muted-foreground">
                    {renewalList.length}
                  </Badge>
                </div>
              </div>

              {/* Column cards */}
              <div className={`${config.color} border border-t-0 rounded-b-lg p-3 min-h-[200px] space-y-2`}>
                {renewalList.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">No renewals</p>
                ) : (
                  renewalList.map(renewal => (
                    <div
                      key={renewal.id}
                      className="bg-white rounded-lg border p-3 cursor-pointer hover:shadow-sm transition-all"
                      onClick={() => onSelect?.(renewal)}
                    >
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs font-semibold line-clamp-2">{renewal.employer_name || "Unknown"}</p>
                          {renewal.renewal_date && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(renewal.renewal_date), "MMM d")}
                            </p>
                          )}
                        </div>

                        {/* Rate change indicator */}
                        {renewal.rate_change_percent !== undefined && renewal.rate_change_percent !== null && (
                          <div className={`text-[10px] font-semibold px-2 py-1 rounded text-center ${
                            renewal.rate_change_percent > 0 ? "bg-red-100 text-red-700" : renewal.rate_change_percent < 0 ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                          }`}>
                            {renewal.rate_change_percent > 0 ? "+" : ""}{renewal.rate_change_percent}%
                          </div>
                        )}

                        {/* Disruption score mini bar */}
                        {renewal.disruption_score !== undefined && (
                          <div className="text-[10px] text-muted-foreground">
                            <div className="flex items-center justify-between mb-0.5">
                              <span>Disruption</span>
                              <span className="font-semibold">{renewal.disruption_score}/100</span>
                            </div>
                            <div className="w-full h-1 rounded bg-muted overflow-hidden">
                              <div
                                className={`h-full ${renewal.disruption_score >= 70 ? "bg-red-500" : renewal.disruption_score >= 40 ? "bg-amber-500" : "bg-green-500"}`}
                                style={{ width: `${renewal.disruption_score}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}