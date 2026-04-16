import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function QuoteInsightsPanel({ insights }) {
  return (
    <Card className="rounded-2xl border-border/70 bg-card/95 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Quote Analytics & Insights</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {insights.map((item) => (
          <div key={item.label} className="rounded-2xl border border-border/70 bg-muted/15 p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{item.label}</p>
            <p className="mt-3 text-2xl font-semibold tracking-tight">{item.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}