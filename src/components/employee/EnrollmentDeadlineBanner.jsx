import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, AlertTriangle } from "lucide-react";
import { differenceInDays, format } from "date-fns";

/**
 * EnrollmentDeadlineBanner
 * Prominent countdown banner showing enrollment window deadline.
 *
 * Props:
 *   enrollmentWindow — EnrollmentWindow
 */
export default function EnrollmentDeadlineBanner({ enrollmentWindow }) {
  if (!enrollmentWindow?.end_date) return null;

  const daysLeft = differenceInDays(new Date(enrollmentWindow.end_date), new Date());
  const isUrgent = daysLeft <= 3;
  const isExpired = daysLeft < 0;

  if (isExpired) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="p-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
          <span className="text-sm font-medium text-destructive">Enrollment window has closed</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={isUrgent ? "border-amber-300 bg-amber-50" : "border-blue-200 bg-blue-50"}>
      <CardContent className="p-3 flex items-center gap-2">
        <Clock className={`w-4 h-4 flex-shrink-0 ${isUrgent ? "text-amber-600" : "text-blue-600"}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${isUrgent ? "text-amber-900" : "text-blue-900"}`}>
            {daysLeft === 0
              ? "Enrollment closes TODAY"
              : daysLeft === 1
              ? "Enrollment closes TOMORROW"
              : `${daysLeft} days left to enroll`}
          </p>
          <p className={`text-xs ${isUrgent ? "text-amber-700" : "text-blue-700"}`}>
            Deadline: {format(new Date(enrollmentWindow.end_date), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}