import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function CaseListSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="border border-border rounded-xl p-4 flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-72" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={`metric-${i}`} className="border border-border rounded-xl p-5">
            <div className="space-y-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border border-border rounded-xl p-5 space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={`activity-${i}`}>
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          ))}
        </div>
        <div className="border border-border rounded-xl p-5 space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={`panel-${i}`}>
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}