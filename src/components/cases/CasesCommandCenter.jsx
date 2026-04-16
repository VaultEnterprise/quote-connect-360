import React from "react";
import { AlertTriangle, Clock3, ShieldAlert, Siren, Workflow } from "lucide-react";
import MetricCard from "@/components/shared/MetricCard";

export default function CasesCommandCenter({ metrics, onFilter }) {
  const cards = [
    {
      key: "open",
      label: "Open Workflow Cases",
      value: metrics.openCount,
      icon: Workflow,
      trendLabel: `${metrics.closedCount} closed`,
      onClick: () => onFilter?.({ stageFilter: "all", operationalPreset: "open" }),
    },
    {
      key: "sla",
      label: "SLA Risk",
      value: metrics.slaRiskCount,
      icon: Clock3,
      trend: metrics.slaRiskCount > 0 ? "down" : undefined,
      trendLabel: metrics.slaRiskCount > 0 ? "Needs action" : "Healthy",
      onClick: () => onFilter?.({ operationalPreset: "sla_risk" }),
    },
    {
      key: "exceptions",
      label: "Critical Issues",
      value: metrics.criticalIssueCount,
      icon: ShieldAlert,
      trend: metrics.criticalIssueCount > 0 ? "down" : undefined,
      trendLabel: `${metrics.totalIssueCount} total issues`,
      onClick: () => onFilter?.({ operationalPreset: "critical_blockers" }),
    },
    {
      key: "urgent",
      label: "Urgent Priority",
      value: metrics.urgentCount,
      icon: Siren,
      trend: metrics.urgentCount > 0 ? "down" : undefined,
      trendLabel: `${metrics.escalatedCount} escalated`,
      onClick: () => onFilter?.({ priorityFilter: "urgent" }),
    },
    {
      key: "stalled",
      label: "Stalled Cases",
      value: metrics.stalledCount,
      icon: AlertTriangle,
      trend: metrics.stalledCount > 0 ? "down" : undefined,
      trendLabel: `${metrics.unassignedCount} unassigned`,
      onClick: () => onFilter?.({ operationalPreset: "stalled" }),
    },
    {
      key: "rates",
      label: "Rate Gaps",
      value: metrics.rateGapCount,
      icon: ShieldAlert,
      trend: metrics.rateGapCount > 0 ? "down" : undefined,
      trendLabel: metrics.rateGapCount > 0 ? "Quoted plans missing rates" : "Rate coverage healthy",
      onClick: () => onFilter?.({ operationalPreset: "rate_gaps" }),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
      {cards.map((card) => (
        <button key={card.key} onClick={card.onClick} className="text-left rounded-2xl transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-ring/40 focus:ring-offset-2 hover:-translate-y-0.5">
          <MetricCard
            label={card.label}
            value={card.value}
            icon={card.icon}
            trend={card.trend}
            trendLabel={card.trendLabel}
            className="h-full hover:border-primary/30 hover:bg-card"
          />
        </button>
      ))}
    </div>
  );
}