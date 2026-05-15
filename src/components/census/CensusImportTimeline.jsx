import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CensusImportTimeline({ events = [] }) {
  if (!events.length) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Import Timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.map((event) => (
          <div key={event.id} className="rounded-lg border p-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium capitalize">{event.payload?.parser_stage?.replace(/_/g, " ") || event.event_type}</p>
              <p className="text-xs text-muted-foreground">{event.created_date ? new Date(event.created_date).toLocaleString() : ""}</p>
            </div>
            <p className="mt-1 text-muted-foreground">{event.payload?.error_message || event.event_type}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span>Severity: {event.payload?.severity || "informational"}</span>
              {event.payload?.row_number ? <span>Row: {event.payload.row_number}</span> : null}
              {event.payload?.field ? <span>Field: {event.payload.field}</span> : null}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}