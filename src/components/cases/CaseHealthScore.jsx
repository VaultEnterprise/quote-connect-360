import React, { useMemo } from "react";
import { AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";

export default function CaseHealthScore({ c }) {
  const score = useMemo(() => {
    let points = 100;

    // Stage progression (how far along)
    const stages = [
      "draft", "census_in_progress", "census_validated", "ready_for_quote",
      "quoting", "proposal_ready", "employer_review", "approved_for_enrollment",
      "enrollment_open", "enrollment_complete", "install_in_progress", "active"
    ];
    const stageIndex = stages.indexOf(c.stage || "draft");
    const stageProgress = (stageIndex / stages.length) * 100;
    points += Math.min(stageProgress / 2, 20); // +20 max for progression

    // Deadline proximity (how close to effective_date)
    if (c.effective_date) {
      const daysUntil = Math.ceil((new Date(c.effective_date) - new Date()) / 86400000);
      if (daysUntil < 0) points -= 30; // Past deadline
      else if (daysUntil < 14) points -= 20; // Critical
      else if (daysUntil < 30) points -= 10; // At risk
    }

    // Priority weight
    const priorityPenalty = { urgent: -25, high: -15, normal: 0, low: 5 };
    points += (priorityPenalty[c.priority] || 0);

    // Activity recency
    if (c.last_activity_date) {
      const daysSince = Math.ceil((new Date() - new Date(c.last_activity_date)) / 86400000);
      if (daysSince > 30) points -= 15;
      else if (daysSince > 14) points -= 10;
      else if (daysSince > 7) points -= 5;
    } else if (c.stage && !["active", "closed"].includes(c.stage)) {
      points -= 10; // No activity recorded
    }

    return Math.max(0, Math.min(100, Math.round(points)));
  }, [c]);

  const severity = score >= 70 ? "healthy" : score >= 50 ? "at-risk" : "critical";
  const icon = severity === "healthy" ? CheckCircle : severity === "at-risk" ? AlertCircle : AlertTriangle;
  const color = severity === "healthy" ? "text-green-600" : severity === "at-risk" ? "text-amber-600" : "text-red-600";
  const bg = severity === "healthy" ? "bg-green-50" : severity === "at-risk" ? "bg-amber-50" : "bg-red-50";

  const Icon = icon;

  return (
    <div className={`flex items-center gap-2 px-2 py-1 rounded ${bg}`}>
      <Icon className={`w-3.5 h-3.5 ${color}`} />
      <span className={`text-xs font-semibold ${color}`}>{score}/100</span>
    </div>
  );
}