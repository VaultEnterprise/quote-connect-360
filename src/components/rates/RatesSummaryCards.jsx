import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function RatesSummaryCards({ summary, onSelect }) {
  const cards = [
    { key: "total", label: "Total Rate Sets", value: summary.totalRateSets, note: "All in scope" },
    { key: "active", label: "Active Rate Sets", value: summary.activeRateSets, note: "Current and effective" },
    { key: "draft", label: "Draft Rate Sets", value: summary.draftRateSets, note: "Saved but not published" },
    { key: "future", label: "Future Effective", value: summary.futureEffectiveRateSets, note: "Validated future versions" },
    { key: "review", label: "Needs Review", value: summary.ratesNeedingReview, note: "Warnings or conflicts" },
    { key: "incomplete", label: "Incomplete", value: summary.incompleteRateSets, note: "Blocking issues" },
    { key: "expiring", label: "Expiring Soon", value: summary.expiringSoonRateSets, note: "Window threshold" },
    { key: "quotes", label: "Active Quote Use", value: summary.ratesInActiveQuoteUse, note: "Referenced by quotes" },
    { key: "assignments", label: "Missing Assignments", value: summary.ratesWithMissingAssignments, note: "Scope not complete" },
    { key: "contributions", label: "Missing Contribution Linkage", value: summary.ratesWithMissingContributionLinkage, note: "Requires linkage" },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <button key={card.key} onClick={() => onSelect(card.key)} className="text-left">
          <Card className="h-full transition-colors hover:bg-muted/30">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
              <p className="mt-1 text-sm font-medium text-foreground">{card.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{card.note}</p>
            </CardContent>
          </Card>
        </button>
      ))}
    </div>
  );
}