import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Clock, AlertTriangle, Zap, Activity } from "lucide-react";

const TREND_DATA = [
  { day: "Mon", created: 8, resolved: 5, critical: 2 },
  { day: "Tue", created: 12, resolved: 8, critical: 3 },
  { day: "Wed", created: 6, resolved: 7, critical: 1 },
  { day: "Thu", created: 14, resolved: 9, critical: 4 },
  { day: "Fri", created: 10, resolved: 11, critical: 2 },
  { day: "Sat", created: 4, resolved: 4, critical: 0 },
  { day: "Sun", created: 3, resolved: 3, critical: 1 },
];

const SLA_DATA = [
  { range: "< 24h", count: 28, color: "#10b981" },
  { range: "1-2 days", count: 12, color: "#f59e0b" },
  { range: "2-5 days", count: 8, color: "#f97316" },
  { range: "> 5 days", count: 3, color: "#ef4444" },
];

export default function ExceptionAnalyticsDashboard({ exceptions }) {
  const openExceptions = exceptions.filter(e => !["resolved", "dismissed"].includes(e.status));
  const avgResolutionTime = 18; // hours
  const mtbf = "2.3 days"; // Mean time between failures
  const slaCompliance = 87; // %
  const criticalNeverBreached = true;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Avg Resolution Time", value: `${avgResolutionTime}h`, icon: Clock, color: "text-blue-600" },
          { label: "Mean Time Between Failures", value: mtbf, icon: Activity, color: "text-purple-600" },
          { label: "SLA Compliance", value: `${slaCompliance}%`, icon: TrendingUp, color: "text-green-600" },
          { label: "Critical SLA Breaches", value: "0", icon: Zap, color: criticalNeverBreached ? "text-green-600" : "text-red-600" },
        ].map((m, i) => {
          const Icon = m.icon;
          return (
            <Card key={i} className={i === 3 && criticalNeverBreached ? "border-green-200 bg-green-50" : ""}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-3.5 h-3.5 ${m.color}`} />
                  <p className="text-[10px] text-muted-foreground font-medium">{m.label}</p>
                </div>
                <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Trend chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> 7-Day Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={TREND_DATA}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="created" stroke="#3b82f6" name="Created" />
              <Line type="monotone" dataKey="resolved" stroke="#10b981" name="Resolved" />
              <Line type="monotone" dataKey="critical" stroke="#ef4444" name="Critical" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* SLA Distribution */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Resolution Time Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {SLA_DATA.map((d, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">{d.range}</span>
                  <span className="text-xs font-semibold text-muted-foreground">{d.count}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(d.count / 51) * 100}%`, backgroundColor: d.color }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}