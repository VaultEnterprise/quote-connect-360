import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function RatesPageHeader({ onRefresh, lastRefreshed, scopeLabel }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Pricing / Configuration / Rates</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">Rates</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enterprise rate management hub for scope, versioning, readiness, and downstream safety.</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>Home</span>
            <span>/</span>
            <span>Rates</span>
            <span>/</span>
            <span>{scopeLabel}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-muted-foreground">Last refreshed: {lastRefreshed}</p>
          <Button variant="outline" size="sm" onClick={onRefresh}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
        </div>
      </div>
    </div>
  );
}