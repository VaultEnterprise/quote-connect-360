import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { differenceInDays, parseISO } from "date-fns";

export function RenewalDashboard({ employers, onEmployerClick }) {
  const now = new Date();

  const renewals = useMemo(() => {
    const upcoming = employers.filter(e => {
      if (!e.renewal_date) return false;
      const days = differenceInDays(parseISO(e.renewal_date), now);
      return days >= 0;
    }).map(e => ({
      ...e,
      daysToRenewal: differenceInDays(parseISO(e.renewal_date), now),
    })).sort((a, b) => a.daysToRenewal - b.daysToRenewal);

    return {
      within30: upcoming.filter(e => e.daysToRenewal <= 30),
      within60: upcoming.filter(e => e.daysToRenewal > 30 && e.daysToRenewal <= 60),
      within90: upcoming.filter(e => e.daysToRenewal > 60 && e.daysToRenewal <= 90),
    };
  }, [employers, now]);

  return (
    <div className="space-y-4 mb-6">
      <h3 className="text-sm font-semibold">Renewal Forecast</h3>
      <div className="grid grid-cols-3 gap-4">
        <RenewalCard 
          title="Next 30 Days" 
          count={renewals.within30.length} 
          employers={renewals.within30}
          urgency="high"
          onEmployerClick={onEmployerClick}
        />
        <RenewalCard 
          title="31-60 Days" 
          count={renewals.within60.length} 
          employers={renewals.within60}
          urgency="medium"
          onEmployerClick={onEmployerClick}
        />
        <RenewalCard 
          title="61-90 Days" 
          count={renewals.within90.length} 
          employers={renewals.within90}
          urgency="low"
          onEmployerClick={onEmployerClick}
        />
      </div>
    </div>
  );
}

function RenewalCard({ title, count, employers, urgency, onEmployerClick }) {
  const urgencyColors = {
    high: "border-red-200 bg-red-50/50",
    medium: "border-amber-200 bg-amber-50/50",
    low: "border-blue-200 bg-blue-50/50",
  };

  return (
    <Card className={urgencyColors[urgency]}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <p className="text-2xl font-bold">{count}</p>
      </CardHeader>
      <CardContent>
        {employers.length > 0 && (
          <div className="space-y-1">
            {employers.slice(0, 3).map(e => (
              <button
                key={e.id}
                onClick={() => onEmployerClick(e)}
                className="block w-full text-left text-xs hover:underline truncate"
              >
                {e.name} ({e.daysToRenewal}d)
              </button>
            ))}
            {employers.length > 3 && (
              <p className="text-xs text-muted-foreground">+{employers.length - 3} more</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}