import React from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Clock, Pause } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { differenceInDays, format } from "date-fns";

export default function TodaysPriorities({ tasks, exceptions, cases, enrollments }) {
  const now = new Date();

  const overdueTasks = tasks
    .filter(t => t.due_date && new Date(t.due_date) < now)
    .slice(0, 3)
    .map(t => ({
      type: "task",
      label: t.title,
      sub: t.employer_name,
      urgency: "high",
      href: "/tasks",
      meta: `Due ${format(new Date(t.due_date), "MMM d")}`,
    }));

  const criticalExceptions = exceptions
    .filter(e => !["resolved", "dismissed"].includes(e.status) && ["critical", "high"].includes(e.severity))
    .slice(0, 2)
    .map(e => ({
      type: "exception",
      label: e.title,
      sub: e.employer_name,
      urgency: e.severity === "critical" ? "critical" : "high",
      href: "/exceptions",
      meta: e.severity,
    }));

  const stalledCases = cases
    .filter(c => {
      if (["closed", "renewed", "active"].includes(c.stage)) return false;
      const last = c.last_activity_date || c.updated_date || c.created_date;
      return last && differenceInDays(now, new Date(last)) >= 7;
    })
    .slice(0, 3)
    .map(c => ({
      type: "stalled",
      label: c.employer_name || "Unnamed Case",
      sub: c.stage?.replace(/_/g, " "),
      urgency: "medium",
      href: `/cases/${c.id}`,
      meta: `${differenceInDays(now, new Date(c.last_activity_date || c.updated_date || c.created_date))}d idle`,
    }));

  const closingEnrollments = enrollments
    .filter(e => ["open", "closing_soon"].includes(e.status) && e.end_date && differenceInDays(new Date(e.end_date), now) <= 3)
    .slice(0, 2)
    .map(e => ({
      type: "enrollment",
      label: `${e.employer_name || "Enrollment"} closing`,
      sub: `${e.enrolled_count ?? 0}/${e.total_eligible ?? "?"} enrolled`,
      urgency: "high",
      href: "/enrollment",
      meta: `${differenceInDays(new Date(e.end_date), now)}d left`,
    }));

  const items = [...criticalExceptions, ...overdueTasks, ...closingEnrollments, ...stalledCases];

  const urgencyConfig = {
    critical: { color: "bg-red-50 border-red-200 hover:bg-red-100", icon: <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />, badge: "bg-red-100 text-red-700" },
    high:     { color: "bg-orange-50 border-orange-200 hover:bg-orange-100", icon: <Clock className="w-3.5 h-3.5 text-orange-500 flex-shrink-0 mt-0.5" />, badge: "bg-orange-100 text-orange-700" },
    medium:   { color: "bg-amber-50 border-amber-200 hover:bg-amber-100", icon: <Pause className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />, badge: "bg-amber-100 text-amber-700" },
  };

  if (items.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-sm">✓</div>
          <div>
            <p className="text-sm font-semibold text-green-800">All clear — no urgent items today</p>
            <p className="text-xs text-green-600">No overdue tasks, stalled cases, or critical exceptions</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-500" />
            Today's Priorities
            <span className="ml-1 inline-flex items-center rounded-md bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold text-orange-700">{items.length}</span>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {items.map((item, i) => {
            const cfg = urgencyConfig[item.urgency];
            return (
              <Link
                key={i}
                to={item.href}
                className={`flex items-start gap-2 p-2.5 rounded-lg border transition-colors cursor-pointer ${cfg.color}`}
              >
                {cfg.icon}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate">{item.label}</p>
                  {item.sub && <p className="text-[10px] text-muted-foreground truncate capitalize">{item.sub}</p>}
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold flex-shrink-0 ${cfg.badge}`}>{item.meta}</span>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}