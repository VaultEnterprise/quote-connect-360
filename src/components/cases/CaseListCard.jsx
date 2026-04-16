import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, AlertTriangle, ChevronRight, Clock } from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import CaseHealthScore from "./CaseHealthScore";
import { format, differenceInDays, parseISO, isAfter } from "date-fns";

const PRIORITY_DOT = {
  urgent: "bg-red-500",
  high:   "bg-amber-500",
  normal: "bg-blue-400",
  low:    "bg-gray-300",
};

const STAGE_PROGRESS = {
  draft: 5, census_in_progress: 15, census_validated: 22, ready_for_quote: 30,
  quoting: 40, proposal_ready: 55, employer_review: 65, approved_for_enrollment: 72,
  enrollment_open: 80, enrollment_complete: 88, install_in_progress: 94, active: 100,
  renewal_pending: 100, renewed: 100, closed: 100,
};

export default function CaseListCard({ c }) {
  const isOverdue = c.effective_date && isAfter(new Date(), parseISO(c.effective_date));
  const daysUntilEffective = c.effective_date ? Math.ceil((parseISO(c.effective_date) - new Date()) / 86400000) : null;
  const daysSince = c.last_activity_date ? differenceInDays(new Date(), new Date(c.last_activity_date)) : null;
  const isStale = daysSince && daysSince > 7 && c.stage && !["active", "closed"].includes(c.stage);
  const progress = STAGE_PROGRESS[c.stage] || 0;

  return (
    <Link to={`/cases/${c.id}`}>
      <Card className="group cursor-pointer border-border/70 bg-card/90 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md">
        <CardContent className="p-4 sm:p-5">
          {/* Top row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Priority dot */}
              <div className="flex-shrink-0 flex flex-col items-center gap-1.5 pt-0.5">
                <div className={`w-2.5 h-2.5 rounded-full ${PRIORITY_DOT[c.priority] || PRIORITY_DOT.normal}`} title={`${c.priority} priority`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-foreground">{c.employer_name || "Unnamed Employer"}</p>
                  <span className="text-xs text-muted-foreground">{c.case_number || `#${c.id?.slice(-6)}`}</span>
                  {c.priority !== "normal" && (
                    <Badge className={`text-[10px] py-0 h-4 ${c.priority === "urgent" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                      {c.priority === "urgent" && <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />}
                      {c.priority}
                    </Badge>
                  )}
                </div>
                {/* Meta row */}
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-xs text-muted-foreground capitalize">{c.case_type?.replace(/_/g, " ")}</span>
                  {c.employee_count && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" />{c.employee_count} EEs
                    </span>
                  )}
                  {c.effective_date && (
                    <span className={`text-xs flex items-center gap-1 ${isOverdue ? "text-red-600 font-bold" : daysUntilEffective && daysUntilEffective < 30 ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>
                      <Calendar className="w-3 h-3" />{isOverdue ? "OVERDUE" : `${daysUntilEffective}d`}
                    </span>
                  )}
                  {c.target_close_date && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />Close {format(new Date(c.target_close_date), "MMM d")}
                    </span>
                  )}
                  {isStale && (
                    <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />{daysSince}d idle
                    </span>
                  )}
                  {c.hasRateGap && (
                    <span className="text-xs text-red-600 font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />rate gap
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <CaseHealthScore c={c} />
              {c.assigned_to && (
                <span className="text-xs text-muted-foreground hidden lg:block truncate max-w-32">{c.assigned_to.split("@")[0]}</span>
              )}
              <StatusBadge status={c.stage} />
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
            </div>
          </div>

          {/* Progress bar + products */}
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-[10px] text-muted-foreground flex-shrink-0">{progress}%</span>
            {c.products_requested?.length > 0 && (
              <div className="flex gap-1 flex-shrink-0">
                {c.products_requested.slice(0, 4).map(p => (
                  <span key={p} className="text-[10px] bg-muted text-muted-foreground rounded px-1.5 py-0.5 capitalize">{p}</span>
                ))}
                {c.products_requested.length > 4 && (
                  <span className="text-[10px] text-muted-foreground">+{c.products_requested.length - 4}</span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}