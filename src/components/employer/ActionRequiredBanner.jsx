import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Clock, FileText, Users } from "lucide-react";
import { format, differenceInDays } from "date-fns";

/**
 * ActionRequiredBanner
 * Hero section surfacing the single most urgent action an employer needs to take.
 *
 * Props:
 *   pendingProposals   — Proposal[] needing approval
 *   enrollment         — EnrollmentWindow | null
 *   openTasks          — CaseTask[]
 *   onGoToProposals    — () => void
 *   onGoToEnrollment   — () => void
 *   onGoToTasks        — () => void
 */
export default function ActionRequiredBanner({
  pendingProposals, enrollment, openTasks,
  onGoToProposals, onGoToEnrollment, onGoToTasks,
}) {
  const actions = [];

  // Proposals awaiting approval
  if (pendingProposals.length > 0) {
    const oldest = pendingProposals[0];
    const expiring = oldest.expires_at ? differenceInDays(new Date(oldest.expires_at), new Date()) : null;
    actions.push({
      key: "proposal",
      icon: FileText,
      color: "text-amber-600",
      bg: "bg-amber-50 border-amber-200",
      title: `${pendingProposals.length} proposal${pendingProposals.length > 1 ? "s" : ""} awaiting your approval`,
      detail: expiring !== null && expiring <= 7
        ? `Expires in ${expiring} day${expiring !== 1 ? "s" : ""} — action required`
        : oldest.sent_at ? `Received ${format(new Date(oldest.sent_at), "MMM d, yyyy")}` : null,
      label: "Review & Approve",
      urgency: expiring !== null && expiring <= 3 ? "critical" : "warning",
      onClick: onGoToProposals,
    });
  }

  // Enrollment open with low participation
  if (enrollment && ["open", "closing_soon"].includes(enrollment.status)) {
    const pct = Math.round(((enrollment.enrolled_count || 0) / (enrollment.total_eligible || 1)) * 100);
    const daysLeft = enrollment.end_date ? differenceInDays(new Date(enrollment.end_date), new Date()) : null;
    actions.push({
      key: "enrollment",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50 border-blue-200",
      title: `Enrollment is open — ${pct}% of employees have responded`,
      detail: daysLeft !== null
        ? `${enrollment.total_eligible - (enrollment.enrolled_count || 0) - (enrollment.waived_count || 0)} employees still pending · ${daysLeft}d remaining`
        : null,
      label: "View Enrollment",
      urgency: daysLeft !== null && daysLeft <= 5 ? "critical" : "info",
      onClick: onGoToEnrollment,
    });
  }

  // Open tasks
  const overdueTasks = openTasks.filter(t => t.due_date && new Date(t.due_date) < new Date());
  if (openTasks.length > 0) {
    actions.push({
      key: "tasks",
      icon: Clock,
      color: overdueTasks.length > 0 ? "text-destructive" : "text-muted-foreground",
      bg: overdueTasks.length > 0 ? "bg-red-50 border-red-200" : "bg-muted/60 border-border",
      title: `${openTasks.length} open action item${openTasks.length > 1 ? "s" : ""} from your broker`,
      detail: overdueTasks.length > 0 ? `${overdueTasks.length} overdue` : null,
      label: "View Tasks",
      urgency: overdueTasks.length > 0 ? "warning" : "info",
      onClick: onGoToTasks,
    });
  }

  if (actions.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-green-800">You're all caught up!</p>
            <p className="text-sm text-green-700 mt-0.5">No pending actions required from you at this time.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show top priority action prominently
  const primary = actions[0];
  const PrimaryIcon = primary.icon;

  return (
    <div className="space-y-3">
      {/* Primary action — full width hero */}
      <Card className={`border-2 ${primary.bg}`}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                <PrimaryIcon className={`w-5 h-5 ${primary.color}`} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Action Required</span>
                  {primary.urgency === "critical" && <Badge className="bg-red-100 text-red-700 text-[10px]">Urgent</Badge>}
                </div>
                <p className="font-semibold text-foreground">{primary.title}</p>
                {primary.detail && <p className="text-sm text-muted-foreground mt-0.5">{primary.detail}</p>}
              </div>
            </div>
            <Button onClick={primary.onClick} className="flex-shrink-0">
              {primary.label}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Secondary actions — compact row */}
      {actions.slice(1).map(a => {
        const Icon = a.icon;
        return (
          <Card key={a.key} className={`${a.bg} cursor-pointer hover:shadow-sm transition-shadow`} onClick={a.onClick}>
            <CardContent className="p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${a.color} flex-shrink-0`} />
                <span className="text-sm font-medium">{a.title}</span>
                {a.detail && <span className="text-xs text-muted-foreground hidden sm:inline">· {a.detail}</span>}
              </div>
              <Button variant="ghost" size="sm" className="text-xs flex-shrink-0">{a.label} →</Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}