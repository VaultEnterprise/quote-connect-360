import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ClipboardCheck, Calendar, Users, Percent, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import MetricCard from "@/components/shared/MetricCard";
import EnrollmentMemberTable from "@/components/enrollment/EnrollmentMemberTable";
import { format } from "date-fns";

export default function Enrollment() {
  const [expandedId, setExpandedId] = useState(null);

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
      <PageHeader title="Enrollment" description="Track enrollment windows and participation" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricCard label="Open Enrollments" value={openEnrollments.length} icon={ClipboardCheck} />
        <MetricCard label="Total Enrolled" value={totalEnrolled} icon={Users} />
        <MetricCard label="Avg Participation" value={`${avgParticipation}%`} icon={Percent} />
      </div>

      {enrollments.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="No Enrollment Windows" description="Enrollment windows will appear here when cases reach the enrollment stage" />
      ) : (
        <div className="space-y-3">
          {enrollments.map((e) => {
            const total = e.total_eligible || 1;
            const enrolled = e.enrolled_count || 0;
            const waived = e.waived_count || 0;
            const pct = Math.round((enrolled / total) * 100);
            const isExpanded = expandedId === e.id;

            return (
              <Card key={e.id} className="overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <Link to={`/cases/${e.case_id}`} className="text-sm font-semibold hover:text-primary transition-colors">{e.employer_name || "Unknown Employer"}</Link>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {e.start_date && format(new Date(e.start_date), "MMM d")} — {e.end_date && format(new Date(e.end_date), "MMM d, yyyy")}
                        </span>
                        {e.effective_date && <span>Eff. {format(new Date(e.effective_date), "MMM d, yyyy")}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={e.status} />
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpandedId(isExpanded ? null : e.id)}>
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <Progress value={pct} className="h-2 mb-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{enrolled} enrolled • {waived} waived • {Math.max(0, total - enrolled - waived)} pending</span>
                    <span className="font-medium text-foreground">{pct}% participation</span>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t">
                      <EnrollmentMemberTable enrollmentWindowId={e.id} caseId={e.case_id} />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}