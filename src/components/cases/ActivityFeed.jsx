import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

export default function ActivityFeed({ cases }) {
  const activities = useMemo(() => {
    const events = cases.flatMap(c => [
      { case: c, action: "created", date: c.created_date, type: "create" },
      c.last_activity_date && { case: c, action: "updated", date: c.last_activity_date, type: "update" },
    ]).filter(Boolean);
    
    return events.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);
  }, [cases]);

  return (
    <Card>
      <CardHeader className="p-4 pb-3">
        <CardTitle className="text-sm">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-2">
        {activities.length === 0 ? (
          <p className="text-xs text-muted-foreground">No activity</p>
        ) : (
          activities.map((a, i) => (
            <div key={i} className="flex gap-2 text-xs pb-2 border-b last:border-0">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{a.case.employer_name}</p>
                <p className="text-muted-foreground">{a.action} {formatDistanceToNow(new Date(a.date), { addSuffix: true })}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}