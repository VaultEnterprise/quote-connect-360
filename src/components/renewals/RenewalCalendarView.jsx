import React, { useMemo, useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STATUS_DOT = {
  pre_renewal:      "bg-slate-400",
  marketed:         "bg-blue-500",
  options_prepared: "bg-indigo-500",
  employer_review:  "bg-amber-500",
  decision_made:    "bg-green-500",
  install_renewal:  "bg-purple-500",
  active_renewal:   "bg-emerald-500",
  completed:        "bg-gray-300",
};

export default function RenewalCalendarView({ renewals, onSelect }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Map renewal_date → list of renewals
  const byDay = useMemo(() => {
    const map = {};
    renewals.forEach(r => {
      if (!r.renewal_date) return;
      const key = r.renewal_date.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(r);
    });
    return map;
  }, [renewals]);

  const startPadding = getDay(startOfMonth(currentMonth)); // 0=Sun

  return (
    <div className="border rounded-xl overflow-hidden bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <p className="text-sm font-semibold">{format(currentMonth, "MMMM yyyy")}</p>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 border-b">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-2">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {/* Padding before first day */}
        {Array.from({ length: startPadding }).map((_, i) => (
          <div key={`pad-${i}`} className="h-20 border-b border-r bg-muted/10" />
        ))}

        {days.map(day => {
          const key = format(day, "yyyy-MM-dd");
          const dayRenewals = byDay[key] || [];
          const isToday = isSameDay(day, new Date());
          const isPast = day < new Date() && !isToday;

          return (
            <div key={key} className={`h-20 border-b border-r p-1 overflow-hidden ${isPast ? "bg-muted/10" : ""}`}>
              <p className={`text-[10px] font-semibold mb-1 w-5 h-5 flex items-center justify-center rounded-full ${
                isToday ? "bg-primary text-white" : "text-muted-foreground"
              }`}>
                {format(day, "d")}
              </p>
              <div className="space-y-0.5 overflow-hidden">
                {dayRenewals.slice(0, 3).map(r => (
                  <button
                    key={r.id}
                    onClick={() => onSelect?.(r)}
                    className="w-full flex items-center gap-1 text-left hover:bg-muted/30 rounded px-0.5 transition-colors"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[r.status] || "bg-gray-400"}`} />
                    <span className="text-[9px] truncate leading-tight">{r.employer_name}</span>
                  </button>
                ))}
                {dayRenewals.length > 3 && (
                  <p className="text-[9px] text-muted-foreground pl-2">+{dayRenewals.length - 3} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap px-4 py-2 border-t bg-muted/10">
        {Object.entries(STATUS_DOT).slice(0, 6).map(([status, cls]) => (
          <div key={status} className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${cls}`} />
            <span className="text-[10px] text-muted-foreground capitalize">{status.replace(/_/g, " ")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}