import React from "react";
import { Badge } from "@/components/ui/badge";

export default function TxQuoteDestinationProgressCard({ destination, readinessResults = [] }) {
  const destinationResults = readinessResults.filter((result) => result.destination_code === destination.destination_code);
  const errorCount = destinationResults.filter((result) => result.status === "fail" && result.severity === "error").length;
  const warningCount = destinationResults.filter((result) => result.severity === "warning" || result.status === "conditional").length;

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{destination.destination_name}</p>
          <p className="text-xs text-muted-foreground">{destination.destination_code}</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <Badge variant="secondary">{destination.readiness_status}</Badge>
          <Badge variant={destination.sent_status === "sent" ? "default" : destination.sent_status === "failed" ? "destructive" : "secondary"}>{destination.sent_status}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">Errors</p>
          <p className="text-lg font-semibold">{errorCount}</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">Warnings</p>
          <p className="text-lg font-semibold">{warningCount}</p>
        </div>
      </div>

      <div className="space-y-2">
        {destinationResults.length === 0 ? (
          <p className="text-sm text-muted-foreground">No destination-specific issues.</p>
        ) : (
          destinationResults.slice(0, 4).map((result) => (
            <div key={result.id} className="rounded-lg border border-border/70 px-3 py-2">
              <p className="text-sm font-medium">{result.validator_name}</p>
              <p className="text-xs text-muted-foreground">{result.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}