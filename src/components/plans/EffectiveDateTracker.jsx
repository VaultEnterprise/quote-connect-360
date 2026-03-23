import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Calendar } from "lucide-react";
import { parseISO, isAfter, isBefore, addDays } from "date-fns";

export default function EffectiveDateTracker({ plans }) {
  const now = new Date();
  const futureThreshold = addDays(now, 30);

  const categorized = useMemo(() => {
    const future = [];
    const active = [];
    const expiring = [];
    const expired = [];

    plans.forEach((p) => {
      if (!p.effective_date) return;
      const effectiveDate = parseISO(p.effective_date);

      if (isBefore(effectiveDate, now)) {
        active.push(p);
      } else if (isBefore(effectiveDate, futureThreshold)) {
        future.push(p);
      }
    });

    return { future, active, expired };
  }, [plans, now, futureThreshold]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calendar className="w-4 h-4" /> Effective Dates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {categorized.future.length > 0 && (
          <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 space-y-1">
            <p className="text-xs font-medium text-blue-900 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {categorized.future.length} Future Start Dates (within 30 days)
            </p>
            {categorized.future.map((p) => (
              <div key={p.id} className="text-[10px] text-blue-800">
                {p.plan_name} — {p.effective_date?.substring(0, 10)}
              </div>
            ))}
          </div>
        )}

        {categorized.active.length > 0 && (
          <div className="p-2 rounded-lg bg-green-50 border border-green-200 space-y-1">
            <p className="text-xs font-medium text-green-900 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> {categorized.active.length} Currently Active
            </p>
            {categorized.active.slice(0, 3).map((p) => (
              <div key={p.id} className="text-[10px] text-green-800">
                {p.plan_name} — {p.effective_date?.substring(0, 10)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}