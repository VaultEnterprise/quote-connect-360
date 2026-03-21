import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ClipboardCheck, Calendar, Users, Percent } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import MetricCard from "@/components/shared/MetricCard";
import { format } from "date-fns";

export default function Enrollment() {
  const { data: enrollments = [] } = useQuery({
    queryKey: ["enrollments-all"],
    queryFn: () => base44.entities.EnrollmentWindow.list("-created_date", 50),
  });

  const openEnrollments = enrollments.filter(e => ["open", "closing_soon"].includes(e.status));
  const totalEnrolled = enrollments.reduce((sum, e) => sum + (e.enrolled_count || 0), 0);
  const totalEligible = enrollments.reduce((sum, e) => sum + (e.total_eligible || 0), 0);
  const avgParticipation = totalEligible > 0 ? Math.round((totalEnrolled / totalEligible) * 100) : 0;

  return (
    <div>
      <PageHeader
        title="Enrollment"
        description="Track enrollment windows and participation"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricCard label="Open Enrollments" value={openEnrollments.length} icon={ClipboardCheck} />
        <MetricCard label="Total Enrolled" value={totalEnrolled} icon={Users} />
        <MetricCard label="Avg Participation" value={`${avgParticipation}%`} icon={Percent} />
      </div>

      {enrollments.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No Enrollment Windows"
          description="Enrollment windows will appear here when cases reach the enrollment stage"
        />
      ) : (
        <div className="space-y-3">
          {enrollments.map((e) => {
            const total = e.total_eligible || 1;
            const enrolled = e.enrolled_count || 0;
            const waived = e.waived_count || 0;
            const pending = total - enrolled - waived;
            const pct = Math.round((enrolled / total) * 100);

            return (
              <Link key={e.id} to={`/cases/${e.case_id}`}>
                <Card className="hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold">{e.employer_name || "Unknown Employer"}</p>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {e.start_date && format(new Date(e.start_date), "MMM d")} — {e.end_date && format(new Date(e.end_date), "MMM d, yyyy")}
                          </span>
                        </div>
                      </div>
                      <StatusBadge status={e.status} />
                    </div>
                    <Progress value={pct} className="h-2 mb-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{enrolled} enrolled • {waived} waived • {pending > 0 ? `${pending} pending` : ""}</span>
                      <span className="font-medium text-foreground">{pct}%</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}