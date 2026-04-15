import React from "react";
import { Link } from "react-router-dom";
import { Pause, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { differenceInDays } from "date-fns";

export default function StalledCases({ cases }) {
  const now = new Date();
  const stalled = cases
    .filter(c => {
      if (["closed", "renewed", "active"].includes(c.stage)) return false;
      const last = c.last_activity_date || c.updated_date || c.created_date;
      return last && differenceInDays(now, new Date(last)) >= 7;
    })
    .map(c => ({
      ...c,
      idleDays: differenceInDays(now, new Date(c.last_activity_date || c.updated_date || c.created_date)),
    }))
    .sort((a, b) => b.idleDays - a.idleDays)
    .slice(0, 5);

  if (stalled.length === 0) return null;

  return (
    <Card className="border-amber-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Pause className="w-4 h-4 text-amber-500" /> Stalled Cases
            <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">{stalled.length}</span>
          </CardTitle>
          <Link to="/cases" className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {stalled.map(c => (
            <Link key={c.id} to={`/cases/${c.id}`} className="block">
              <div className="flex items-center justify-between p-2.5 rounded-lg border hover:bg-muted/30 transition-colors group">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                    {c.employer_name || "Unnamed Case"}
                  </p>
                  <p className="text-[11px] text-muted-foreground capitalize">
                    {c.stage?.replace(/_/g, " ")} · {c.case_number || `#${c.id?.slice(-6)}`}
                  </p>
                </div>
                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold flex-shrink-0 ml-2 ${c.idleDays >= 21 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                  {c.idleDays}d idle
                </span>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}