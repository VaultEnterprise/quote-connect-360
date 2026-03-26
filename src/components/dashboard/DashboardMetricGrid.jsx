import React from "react";
import { AlertCircle, Briefcase, ClipboardCheck, FileText } from "lucide-react";
import MetricCard from "@/components/shared/MetricCard";

export default function DashboardMetricGrid({ summary }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard label="Active Cases" value={summary.activeCases.length} icon={Briefcase} trend={summary.comparisons.activeCases.trend} trendLabel={summary.comparisons.activeCases.label} />
      <MetricCard label="Quoting Now" value={summary.quotingCases.length} icon={FileText} trend={summary.comparisons.quotingCases.trend} trendLabel={summary.comparisons.quotingCases.label} />
      <MetricCard label="Open Enrollments" value={summary.enrollmentOpen.length} icon={ClipboardCheck} trend={summary.comparisons.enrollmentOpen.trend} trendLabel={summary.comparisons.enrollmentOpen.label} />
      <MetricCard label="Overdue Tasks" value={summary.overdueTasks.length} icon={AlertCircle} trend={summary.comparisons.overdueTasks.trend} trendLabel={summary.comparisons.overdueTasks.label} />
    </div>
  );
}