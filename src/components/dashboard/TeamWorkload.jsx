import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function TeamWorkload({ cases = [], tasks = [] }) {
  // Group cases by assigned user
  const assignedUsers = {};
  cases.forEach(c => {
    if (c.assigned_to) {
      if (!assignedUsers[c.assigned_to]) {
        assignedUsers[c.assigned_to] = { cases: 0, overdue: 0 };
      }
      assignedUsers[c.assigned_to].cases++;
    }
  });

  // Add overdue tasks per user
  const now = new Date();
  tasks.forEach(t => {
    if (t.assigned_to && new Date(t.due_date) < now) {
      if (!assignedUsers[t.assigned_to]) {
        assignedUsers[t.assigned_to] = { cases: 0, overdue: 0 };
      }
      assignedUsers[t.assigned_to].overdue++;
    }
  });

  const maxCases = Math.max(1, ...Object.values(assignedUsers).map(u => u.cases || 0));

  const userList = Object.entries(assignedUsers)
    .map(([email, data]) => ({
      email,
      ...data,
      load: Math.round(((data.cases || 0) / maxCases) * 100),
    }))
    .sort((a, b) => (b.cases + b.overdue) - (a.cases + a.overdue));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" /> Team Workload
        </CardTitle>
      </CardHeader>
      <CardContent>
        {userList.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No assigned cases</p>
        ) : (
          <div className="space-y-3">
            {userList.map(u => (
              <div key={u.email}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium truncate">{u.email.split("@")[0]}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{u.cases} cases</span>
                    {u.overdue > 0 && (
                      <div className="flex items-center gap-0.5 text-xs text-destructive">
                        <AlertCircle className="w-3 h-3" />
                        {u.overdue}
                      </div>
                    )}
                  </div>
                </div>
                <Progress value={u.load} className="h-2" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}