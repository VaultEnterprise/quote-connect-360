import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { AlertTriangle, Clock, CheckCircle, Zap } from "lucide-react";
import { differenceInDays } from "date-fns";

const CATEGORY_COLORS = {
  census: "#a78bfa",
  quote: "#60a5fa",
  enrollment: "#10b981",
  carrier: "#f97316",
  document: "#6b7280",
  billing: "#ef4444",
  system: "#64748b",
};

/**
 * ExceptionKPIBar
 * Open count, critical/high count, SLA breached count, resolved today, category donut chart.
 *
 * Props:
 *   exceptions — ExceptionItem[]
 */
export default function ExceptionKPIBar({ exceptions }) {
  const openExceptions = exceptions.filter(e => !["resolved", "dismissed"].includes(e.status));
  const critical = openExceptions.filter(e => e.severity === "critical").length;
  const high = openExceptions.filter(e => e.severity === "high").length;
  const slaBreached = openExceptions.filter(e => e.due_by && differenceInDays(new Date(e.due_by), new Date()) < 0).length;
  const resolvedToday = exceptions.filter(e => e.resolved_at && new Date(e.resolved_at).toDateString() === new Date().toDateString()).length;

  // Category breakdown
  const categoryData = Object.keys(CATEGORY_COLORS).map(cat => ({
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    value: openExceptions.filter(e => e.category === cat).length,
  })).filter(d => d.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Metric tiles */}
      <div className="grid grid-cols-2 gap-3 lg:col-span-1">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Open</p>
                <p className="text-2xl font-bold text-blue-700 mt-0.5">{openExceptions.length}</p>
              </div>
              <AlertTriangle className="w-4 h-4 text-blue-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Critical</p>
                <p className="text-2xl font-bold text-red-700 mt-0.5">{critical}</p>
              </div>
              <Zap className="w-4 h-4 text-red-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground font-medium">High</p>
                <p className="text-2xl font-bold text-orange-700 mt-0.5">{high}</p>
              </div>
              <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className={`${slaBreached > 0 ? "bg-red-50 border-red-200" : "bg-muted border-border"}`}>
          <CardContent className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Overdue</p>
                <p className={`text-2xl font-bold mt-0.5 ${slaBreached > 0 ? "text-red-700" : "text-muted-foreground"}`}>
                  {slaBreached}
                </p>
              </div>
              <Clock className={`w-4 h-4 flex-shrink-0 ${slaBreached > 0 ? "text-red-600" : "text-muted-foreground"}`} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200 col-span-2">
          <CardContent className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Resolved Today</p>
                <p className="text-2xl font-bold text-green-700 mt-0.5">{resolvedToday}</p>
              </div>
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category breakdown chart */}
      {categoryData.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Open Exceptions by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name.toLowerCase()] || "#999"} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} exception${value !== 1 ? "s" : ""}`} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}