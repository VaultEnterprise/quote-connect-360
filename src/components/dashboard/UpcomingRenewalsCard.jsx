import React from "react";
import { Link } from "react-router-dom";
import { differenceInDays, format } from "date-fns";
import { RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "@/components/shared/StatusBadge";

export default function UpcomingRenewalsCard({ renewals }) {
  if (renewals.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-primary" />
            Upcoming Renewals
          </CardTitle>
          <Link to="/renewals">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">View all</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {renewals.slice(0, 6).map((item) => {
            const daysUntil = item.renewal_date ? differenceInDays(new Date(item.renewal_date), new Date()) : null;
            return (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                <div>
                  <p className="text-sm font-medium">{item.employer_name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{item.renewal_date ? format(new Date(item.renewal_date), "MMM d, yyyy") : "TBD"}</p>
                </div>
                <div className="flex items-center gap-2">
                  {daysUntil !== null && (
                    <Badge className={`text-[10px] ${daysUntil <= 30 ? "bg-red-100 text-red-700" : daysUntil <= 60 ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                      {daysUntil}d
                    </Badge>
                  )}
                  <StatusBadge status={item.status} />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}