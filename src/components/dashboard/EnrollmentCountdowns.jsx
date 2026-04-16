import React from "react";
import { Link } from "react-router-dom";
import { ClipboardCheck, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { differenceInDays, format } from "date-fns";

export default function EnrollmentCountdowns({ enrollments }) {
  const open = (enrollments || []).filter(Boolean).filter(e => ["open", "closing_soon"].includes(e.status));
  if (open.length === 0) return null;

  const now = new Date();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-primary" /> Open Enrollments
          </CardTitle>
          <Link to="/enrollment" className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {open.slice(0, 4).map(e => {
            const daysLeft = e.end_date ? differenceInDays(new Date(e.end_date), now) : null;
            const participation = e.total_eligible > 0
              ? Math.round(((e.enrolled_count || 0) / e.total_eligible) * 100)
              : e.participation_rate || 0;
            const urgency = daysLeft !== null && daysLeft <= 3 ? "text-red-600" : daysLeft !== null && daysLeft <= 7 ? "text-amber-600" : "text-muted-foreground";

            return (
              <Link key={e.id} to="/enrollment" className="block">
                <div className="p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-medium truncate flex-1">{e.employer_name || "Enrollment"}</p>
                    {daysLeft !== null && (
                      <span className={`text-xs font-semibold flex-shrink-0 ml-2 ${urgency}`}>
                        {daysLeft === 0 ? "Closes today" : `${daysLeft}d left`}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.max(0, Math.min(participation, 100))}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-muted-foreground flex-shrink-0 w-10 text-right">
                      {participation}%
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {e.enrolled_count || 0} of {e.total_eligible || "?"} enrolled
                    {e.end_date && ` · closes ${format(new Date(e.end_date), "MMM d")}`}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}