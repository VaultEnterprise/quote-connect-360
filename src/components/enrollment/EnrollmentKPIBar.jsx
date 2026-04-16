import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardCheck, Users, Percent, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";

export default function EnrollmentKPIBar({ enrollments }) {
  const now = new Date();

  const open = enrollments.filter(e => ["open", "closing_soon"].includes(e.status));
  const closingSoon = enrollments.filter(e => {
    if (!e.end_date || !["open", "closing_soon"].includes(e.status)) return false;
    const d = differenceInDays(parseISO(e.end_date), now);
    return d >= 0 && d <= 7;
  });
  const finalized = enrollments.filter(e => e.status === "finalized");
  const totalEnrolled = enrollments.reduce((s, e) => s + (e.enrolled_count || 0), 0);
  const totalEligible = enrollments.reduce((s, e) => s + (e.total_eligible || 0), 0);
  const totalPending = enrollments.reduce((s, e) => s + (e.pending_count || 0), 0);
  const avgParticipation = totalEligible > 0 ? Math.round((totalEnrolled / totalEligible) * 100) : 0;

  const metrics = [
    { label: "Open Windows", value: open.length, icon: ClipboardCheck, color: "text-primary", bg: "bg-primary/5" },
    { label: "Closing ≤7 Days", value: closingSoon.length, icon: AlertTriangle, color: closingSoon.length > 0 ? "text-orange-600" : "text-muted-foreground", bg: closingSoon.length > 0 ? "bg-orange-50" : "bg-muted/40" },
    { label: "Total Enrolled", value: totalEnrolled, icon: Users, color: "text-green-600", bg: "bg-green-50" },
    { label: "Pending Action", value: totalPending, icon: Clock, color: totalPending > 0 ? "text-amber-600" : "text-muted-foreground", bg: totalPending > 0 ? "bg-amber-50" : "bg-muted/40" },
    { label: "Avg Participation", value: `${avgParticipation}%`, icon: Percent, color: avgParticipation >= 75 ? "text-green-600" : avgParticipation >= 50 ? "text-amber-600" : "text-destructive", bg: "bg-muted/40" },
    { label: "Finalized", value: finalized.length, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {metrics.map(m => {
        const Icon = m.icon;
        return (
          <Card key={m.label} className="border">
            <CardContent className="p-3 flex flex-col items-center text-center gap-1">
              <div className={`w-8 h-8 rounded-lg ${m.bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${m.color}`} />
              </div>
              <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{m.label}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}