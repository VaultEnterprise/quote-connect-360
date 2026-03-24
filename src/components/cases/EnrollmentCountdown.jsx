import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users } from "lucide-react";
import { differenceInDays } from "date-fns";

export default function EnrollmentCountdown({ caseData }) {
  const enrollment = useMemo(() => {
    if (!caseData || caseData.stage !== "enrollment_open") return null;
    
    const endDate = caseData.target_close_date ? new Date(caseData.target_close_date) : null;
    const daysRemaining = endDate ? differenceInDays(endDate, new Date()) : null;
    const participationRate = caseData.enrolled_count && caseData.total_eligible ? Math.round((caseData.enrolled_count / caseData.total_eligible) * 100) : 0;
    
    return { daysRemaining, participationRate, enrolled: caseData.enrolled_count || 0, total: caseData.total_eligible || caseData.employee_count || 0, waived: caseData.waived_count || 0 };
  }, [caseData]);

  if (!enrollment) return null;

  const isClosing = enrollment.daysRemaining !== null && enrollment.daysRemaining < 3;
  const isClosed = enrollment.daysRemaining !== null && enrollment.daysRemaining < 0;

  return (
    <Card className={`${isClosed ? "border-red-200 bg-red-50" : isClosing ? "border-amber-200 bg-amber-50" : "border-blue-200 bg-blue-50"}`}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className={`w-3.5 h-3.5 ${isClosed ? "text-red-600" : isClosing ? "text-amber-600" : "text-blue-600"}`} />
            <span className="text-xs font-medium">Enrollment Window</span>
          </div>
          {enrollment.daysRemaining !== null && (
            <Badge variant="secondary" className={`text-[10px] py-0 h-4 ${isClosed ? "bg-red-100 text-red-700" : isClosing ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
              {isClosed ? "CLOSED" : enrollment.daysRemaining === 0 ? "Today!" : `${enrollment.daysRemaining}d left`}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground flex items-center gap-1">
            <Users className="w-3 h-3" /> Participation
          </span>
          <span className="font-semibold">{enrollment.participationRate}%</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${enrollment.participationRate}%` }} />
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1 text-[10px]">
          <div className="bg-white/50 rounded p-1">
            <p className="text-muted-foreground">Enrolled</p>
            <p className="font-bold">{enrollment.enrolled}</p>
          </div>
          <div className="bg-white/50 rounded p-1">
            <p className="text-muted-foreground">Waived</p>
            <p className="font-bold">{enrollment.waived}</p>
          </div>
          <div className="bg-white/50 rounded p-1">
            <p className="text-muted-foreground">Total</p>
            <p className="font-bold">{enrollment.total}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}