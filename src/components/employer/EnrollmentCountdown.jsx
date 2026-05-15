import React, { useMemo } from "react";
import { AlertCircle, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays } from "date-fns";

export default function EnrollmentCountdown({ enrollment, caseId }) {
  const endDate = enrollment?.end_date;

  const daysRemaining = useMemo(() => {
    if (!endDate) return 0;
    const diff = differenceInDays(new Date(endDate), new Date());
    return Math.max(0, diff);
  }, [endDate]);

  const enrollmentPct = useMemo(() => {
    return Math.round((((enrollment?.enrolled_count) || 0) / ((enrollment?.total_eligible) || 1)) * 100);
  }, [enrollment?.enrolled_count, enrollment?.total_eligible]);

  if (!enrollment || !endDate) return null;

  const urgency = daysRemaining <= 3 ? "critical" : daysRemaining <= 7 ? "warning" : "normal";
  const urgencyColor = { critical: "bg-destructive/10 text-destructive", warning: "bg-amber-100 text-amber-700", normal: "bg-blue-100 text-blue-700" }[urgency];

  return (
    <Card className={urgency === "critical" ? "border-destructive/30" : ""}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Enrollment Window</p>
          <Badge className={urgencyColor} variant="outline">
            {daysRemaining === 0 ? "Closes today!" : `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} left`}
          </Badge>
        </div>

        <div className="space-y-4">
          {/* Countdown */}
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-foreground">{daysRemaining}</p>
            <p className="text-xs text-muted-foreground">Days remaining</p>
            <p className="text-xs text-muted-foreground mt-1">Closes {format(new Date(enrollment.end_date), "MMM d, yyyy")}</p>
          </div>

          {/* Enrollment progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Enrollment Progress</p>
              <span className="text-sm font-bold text-primary">{enrollmentPct}%</span>
            </div>
            <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
              <div className="bg-primary h-full transition-all" style={{ width: `${enrollmentPct}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {enrollment.enrolled_count || 0} of {enrollment.total_eligible || 0} enrolled
            </p>
          </div>

          {/* Warning if low enrollment */}
          {enrollmentPct < 50 && daysRemaining <= 7 && (
            <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800">
                <p className="font-medium">Low engagement</p>
                <p className="mt-0.5">Consider sending a reminder to boost enrollment.</p>
              </div>
            </div>
          )}

          {/* Action button */}
          <Button variant="outline" size="sm" className="w-full text-xs">
            Send Reminder Email
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}