import React from "react";
import { AlertTriangle, CheckCircle2, Clock3, FileWarning, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function CasesSystemSignals({ signals }) {
  const items = [
    {
      label: "Census issues",
      value: signals.censusIssueCount,
      note: "Cases with validation gaps or upload problems",
      icon: FileWarning,
      tone: signals.censusIssueCount > 0 ? "text-amber-700 bg-amber-50 border-amber-200" : "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      label: "Quote failures",
      value: signals.quoteFailureCount,
      note: "Cases with broken or expired quote scenarios",
      icon: AlertTriangle,
      tone: signals.quoteFailureCount > 0 ? "text-red-700 bg-red-50 border-red-200" : "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      label: "Enrollment blockers",
      value: signals.enrollmentBlockerCount,
      note: "Cases waiting on enrollment completion or window setup",
      icon: Clock3,
      tone: signals.enrollmentBlockerCount > 0 ? "text-amber-700 bg-amber-50 border-amber-200" : "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      label: "Renewal risk",
      value: signals.renewalRiskCount,
      note: "Cases tied to overdue or unresolved renewal cycles",
      icon: RefreshCw,
      tone: signals.renewalRiskCount > 0 ? "text-red-700 bg-red-50 border-red-200" : "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
  ];

  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Cross-System Signals</p>
            <p className="text-xs text-muted-foreground">Live issue visibility across census, quotes, enrollment, and renewals.</p>
          </div>
          {items.every((item) => item.value === 0) && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" /> Stable
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => (
            <div key={item.label} className={`rounded-2xl border p-4 shadow-sm ${item.tone}`}>
              <div className="flex items-center justify-between gap-3">
                <item.icon className="w-4 h-4" />
                <span className="text-2xl font-semibold">{item.value}</span>
              </div>
              <p className="mt-3 text-sm font-medium">{item.label}</p>
              <p className="mt-1 text-xs opacity-80">{item.note}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}