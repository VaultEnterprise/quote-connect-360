import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { addDays, isBefore } from "date-fns";

export default function DeprecationWarnings({ plans }) {
  const today = new Date();
  const sixMonthsFromNow = addDays(today, 180);

  const deprecated = useMemo(
    () =>
      plans.filter((p) => {
        if (!p.effective_date) return false;
        const effDate = new Date(p.effective_date);
        return isBefore(effDate, today) && !p.notes?.includes("ACTIVE");
      }),
    [plans]
  );

  const expiringSoon = useMemo(
    () =>
      plans.filter((p) => {
        if (!p.effective_date) return false;
        const effDate = new Date(p.effective_date);
        return isBefore(effDate, sixMonthsFromNow) && isBefore(today, effDate);
      }),
    [plans]
  );

  if (deprecated.length === 0 && expiringSoon.length === 0) return null;

  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="pt-4 space-y-2">
        {deprecated.length > 0 && (
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-medium text-red-900">{deprecated.length} plans may be outdated</p>
              <p className="text-red-800">Review and archive inactive plans</p>
            </div>
          </div>
        )}

        {expiringSoon.length > 0 && (
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-medium text-orange-900">{expiringSoon.length} plans start in 6 months</p>
              <p className="text-orange-800">Plan transition strategy recommended</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}