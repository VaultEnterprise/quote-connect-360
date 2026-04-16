import React from "react";
import { Clock3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function QuoteActivityFeed({ items }) {
  return (
    <Card className="rounded-2xl border-border/70 bg-card/95 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock3 className="h-4 w-4 text-primary" /> Quote Activity Feed
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">No recent quote activity.</div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-xl border border-border/70 bg-muted/15 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">{item.title}</p>
                <span className="text-xs text-muted-foreground">{item.time}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}