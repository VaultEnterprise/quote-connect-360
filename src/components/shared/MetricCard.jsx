import React from "react";
import { cn } from "@/lib/utils";

export default function MetricCard({ label, value, icon: Icon, trend, trendLabel, className }) {
  return (
    <div className={cn("rounded-xl border bg-card p-5 text-card-foreground shadow relative overflow-hidden group hover:shadow-md transition-shadow", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {trendLabel && (
            <p className={cn(
              "text-xs font-medium",
              trend === "up" ? "text-green-600" : trend === "down" ? "text-red-500" : "text-muted-foreground"
            )}>
              {trend === "up" ? "↑" : trend === "down" ? "↓" : ""} {trendLabel}
            </p>
          )}
        </div>
        {Icon && (
          <div className="p-2.5 rounded-xl bg-primary/5 text-primary group-hover:bg-primary/10 transition-colors">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}