import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function PlansSummaryCards({ summary, onSelect }) {
  const cards = [
    { key: "all", label: "Plans in Scope", value: summary.totalPlans },
    { key: "active", label: "Active Plans", value: summary.activePlans },
    { key: "review", label: "Needs Review", value: summary.needsReview },
    { key: "rates", label: "Missing Rates", value: summary.missingRates },
    { key: "assignments", label: "Missing Assignments", value: summary.missingAssignments },
    { key: "documents", label: "Missing Documents", value: summary.missingDocuments },
    { key: "expiring", label: "Expiring Soon", value: summary.expiringSoon },
    { key: "future", label: "Future Effective", value: summary.futureEffective },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => (
        <button key={card.key} onClick={() => onSelect(card.key)} className="text-left">
          <Card className="h-full transition-colors hover:bg-muted/40">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{card.label}</p>
            </CardContent>
          </Card>
        </button>
      ))}
    </div>
  );
}