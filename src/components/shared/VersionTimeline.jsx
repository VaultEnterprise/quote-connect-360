import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";

export default function VersionTimeline({ items = [], emptyLabel = "No history available", renderMeta }) {
  if (!items.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <Card key={item.id || item.timestamp || index}>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">
                  {item.timestamp ? format(parseISO(item.timestamp), "MMM d, yyyy · h:mm a") : "Version snapshot"}
                </p>
                {renderMeta ? renderMeta(item) : null}
              </div>
              {item.status && <Badge className="capitalize">{item.status.replace(/_/g, " ")}</Badge>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}