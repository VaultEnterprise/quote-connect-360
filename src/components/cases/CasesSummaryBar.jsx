import React from "react";
import { AlertTriangle, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function CasesSummaryBar({ kpis, onStageFilter, onPriorityFilter }) {
  const cards = [
    { label: "Active Cases", value: kpis.activeCount, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", onClick: () => onStageFilter("active") },
    { label: "Enrollment Open", value: kpis.enrollOpen, icon: Clock, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", onClick: () => onStageFilter("enrollment_open") },
    { label: "Urgent Priority", value: kpis.urgentCount, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", border: "border-red-100", onClick: () => onPriorityFilter("urgent") },
    { label: "Stalled (7+ days)", value: kpis.stalledCount, icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map((card) => (
        <Card key={card.label} className={`border ${card.border} ${card.bg} ${card.onClick ? "cursor-pointer hover:shadow-sm transition-shadow" : ""}`} onClick={card.onClick}>
          <CardContent className="p-3 flex items-center gap-3">
            <card.icon className={`w-4 h-4 ${card.color} flex-shrink-0`} />
            <div>
              <p className={`text-xl font-bold leading-none ${card.color}`}>{card.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{card.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}