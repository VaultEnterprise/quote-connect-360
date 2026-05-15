import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Clock, Users } from "lucide-react";
import { differenceInDays } from "date-fns";

export default function EnrollmentForecast({ enrollments = [] }) {
  // Group enrollments by days until deadline
  const forecastData = [
    { label: "0-7 days", range: [0, 7], color: "#ef4444", count: 0 },
    { label: "8-14 days", range: [8, 14], color: "#f97316", count: 0 },
    { label: "15-30 days", range: [15, 30], color: "#eab308", count: 0 },
    { label: "30+ days", range: [31, Infinity], color: "#22c55e", count: 0 },
  ];

  const now = new Date();
  enrollments.forEach(e => {
    if (!["closed", "finalized"].includes(e.status) && e.end_date) {
      const daysLeft = differenceInDays(new Date(e.end_date), now);
      if (daysLeft >= 0) {
        const item = forecastData.find(f => daysLeft >= f.range[0] && daysLeft <= f.range[1]);
        if (item) item.count++;
      }
    }
  });

  const urgentWindows = forecastData.slice(0, 2).reduce((sum, d) => sum + d.count, 0);

  if (enrollments.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Enrollment Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-44 text-sm text-muted-foreground">No active enrollment windows</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Enrollment Forecast
          </CardTitle>
          {urgentWindows > 0 && (
            <span className="text-xs font-semibold text-destructive flex items-center gap-1">
              <Users className="w-3 h-3" /> {urgentWindows} urgent
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={forecastData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}