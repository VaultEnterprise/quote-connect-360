import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { differenceInDays } from "date-fns";

export default function AgingReport({ cases }) {
  const aged = useMemo(() => {
    const now = new Date();
    return cases
      .map(c => ({ ...c, daysInStage: differenceInDays(now, new Date(c.created_date)) }))
      .sort((a, b) => b.daysInStage - a.daysInStage)
      .slice(0, 8);
  }, [cases]);

  return (
    <Card>
      <CardHeader className="p-4 pb-3">
        <CardTitle className="text-sm">Aging Report (Oldest Cases)</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-2">
        {aged.length === 0 ? (
          <p className="text-xs text-muted-foreground">No cases</p>
        ) : (
          aged.map(c => (
            <div key={c.id} className="flex justify-between items-center p-2 bg-muted/30 rounded text-xs">
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{c.employer_name}</p>
                <p className="text-muted-foreground capitalize">{c.stage?.replace(/_/g, " ")}</p>
              </div>
              <Badge variant="outline" className="text-[10px] py-0 h-4 flex-shrink-0">{c.daysInStage}d</Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}