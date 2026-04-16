import React, { useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Briefcase, FileText, ClipboardCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import MetricCard from "@/components/shared/MetricCard";
import PageHeader from "@/components/shared/PageHeader";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";
import TodaysPriorities from "@/components/dashboard/TodaysPriorities";
import InteractivePipeline from "@/components/dashboard/InteractivePipeline";
import EnrollmentCountdowns from "@/components/dashboard/EnrollmentCountdowns";
import StalledCases from "@/components/dashboard/StalledCases";
import QuickActions from "@/components/dashboard/QuickActions";
import CensusGapAlert from "@/components/dashboard/CensusGapAlert";

export default function Dashboard() {
  const queryClient = useQueryClient();

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ["cases"],
    queryFn: () => base44.entities.BenefitCase.list("-created_date", 200),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks-pending"],
    queryFn: () => base44.entities.CaseTask.filter({ status: "pending" }, "-created_date", 20),
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["enrollments"],
    queryFn: () => base44.entities.EnrollmentWindow.list("-created_date", 100),
  });

  const { data: exceptions = [] } = useQuery({
    queryKey: ["exceptions"],
    queryFn: () => base44.entities.ExceptionItem.list("-created_date", 50),
  });

  useEffect(() => {
    const unsubscribeCases = base44.entities.BenefitCase.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
    });

    const unsubscribeTasks = base44.entities.CaseTask.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["tasks-pending"] });
    });

    const unsubscribeEnrollments = base44.entities.EnrollmentWindow.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    });

    const unsubscribeExceptions = base44.entities.ExceptionItem.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["exceptions"] });
    });

    return () => {
      unsubscribeCases?.();
      unsubscribeTasks?.();
      unsubscribeEnrollments?.();
      unsubscribeExceptions?.();
    };
  }, [queryClient]);

  const activeCases = useMemo(() => cases.filter((c) => !["closed", "renewed"].includes(c.stage)), [cases]);
  const quotingCases = useMemo(() => cases.filter((c) => ["ready_for_quote", "quoting"].includes(c.stage)), [cases]);
  const enrollmentOpen = useMemo(() => enrollments.filter((e) => ["open", "closing_soon"].includes(e.status)), [enrollments]);
  const overdueTasks = useMemo(() => tasks.filter((t) => t.due_date && new Date(t.due_date) < new Date()), [tasks]);

  if (isLoading) return <DashboardSkeleton />;

  if (cases.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Overview of your benefits operations"
          actions={<Link to="/cases/new"><Button><Briefcase className="w-4 h-4 mr-2" /> New Case</Button></Link>}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Benefits operations overview" />

      <QuickActions />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Active Cases" value={activeCases.length} icon={Briefcase} trendLabel={`${cases.length} total`} />
        <MetricCard label="Quoting Now" value={quotingCases.length} icon={FileText} />
        <MetricCard label="Open Enrollments" value={enrollmentOpen.length} icon={ClipboardCheck} />
        <MetricCard label="Overdue Tasks" value={overdueTasks.length} icon={AlertCircle} trend={overdueTasks.length > 0 ? "down" : undefined} trendLabel={overdueTasks.length > 0 ? "needs attention" : "on track"} />
      </div>

      <CensusGapAlert cases={cases} />

      <TodaysPriorities tasks={tasks} exceptions={exceptions} cases={cases} enrollments={enrollments} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InteractivePipeline cases={cases} />
        <EnrollmentCountdowns enrollments={enrollments} />
      </div>

      <StalledCases cases={cases} />
    </div>
  );
}