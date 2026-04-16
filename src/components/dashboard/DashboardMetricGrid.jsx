import React from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Briefcase, ClipboardCheck, FileText } from "lucide-react";
import MetricCard from "@/components/shared/MetricCard";

const KPI_LINKS = {
  activeCases: "/cases",
  quotingCases: "/cases",
  enrollmentOpen: "/cases",
  overdueTasks: "/tasks",
};

export default function DashboardMetricGrid({ summary }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Link to={KPI_LINKS.activeCases} className="block">
        <MetricCard label="Active Cases" value={summary.activeCases.length} icon={Briefcase} trend={summary.comparisons.activeCases.trend} trendLabel={summary.comparisons.activeCases.label} />
      </Link>
      <Link to={KPI_LINKS.quotingCases} className="block">
        <MetricCard label="Quoting Now" value={summary.quotingCases.length} icon={FileText} trend={summary.comparisons.quotingCases.trend} trendLabel={summary.comparisons.quotingCases.label} />
      </Link>
      <Link to={KPI_LINKS.enrollmentOpen} className="block">
        <MetricCard label="Open Enrollments" value={summary.enrollmentOpen.length} icon={ClipboardCheck} trend={summary.comparisons.enrollmentOpen.trend} trendLabel={summary.comparisons.enrollmentOpen.label} />
      </Link>
      <Link to={KPI_LINKS.overdueTasks} className="block">
        <MetricCard label="Overdue Tasks" value={summary.overdueTasks.length} icon={AlertCircle} trend={summary.comparisons.overdueTasks.trend} trendLabel={summary.comparisons.overdueTasks.label} />
      </Link>
    </div>
  );
}