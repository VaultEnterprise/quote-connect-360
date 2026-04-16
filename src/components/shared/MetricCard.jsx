import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function MetricCard({ label, value, icon: Icon, trend, trendLabel, className }) {
  return (
    <Card className={cn("group relative overflow-hidden rounded-2xl border-border/70 bg-card/95 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold leading-none text-foreground">{value}</p>
          {trendLabel && (
            <p className={cn(
              "text-xs font-medium",
              trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-500" : "text-muted-foreground"
            )}>
              {trend === "up" ? "↑" : trend === "down" ? "↓" : ""} {trendLabel}
            </p>
          )}
        </div>
        {Icon && (
          <div className="rounded-2xl border border-primary/10 bg-primary/5 p-3 text-primary transition-colors group-hover:bg-primary/10">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </Card>
  );
}