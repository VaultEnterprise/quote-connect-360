import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, AlertTriangle, ChevronRight, Clock, FileText, CheckSquare, ClipboardCheck, TriangleAlert } from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import CaseHealthScore from "./CaseHealthScore";
import InlineDetailDrawer from "./InlineDetailDrawer";
import EnrollmentCountdown from "./EnrollmentCountdown";
import RelatedItemsBadge from "./RelatedItemsBadge";
import CaseEmployeePreview from "./CaseEmployeePreview";
import CaseQuickLinks from "./CaseQuickLinks";
import CaseActionMenu from "./CaseActionMenu";
import { format, differenceInDays, parseISO, isAfter } from "date-fns";
import { getCaseBlocker, getCaseNextStep } from "@/utils/caseWorkflow";

const PRIORITY_DOT = {
  urgent: "bg-red-500",
  high: "bg-amber-500",
  normal: "bg-blue-400",
  low: "bg-gray-300",
};

const STAGE_PROGRESS = {
  draft: 5, census_in_progress: 15, census_validated: 22, ready_for_quote: 30,
  quoting: 40, proposal_ready: 55, employer_review: 65, approved_for_enrollment: 72,
  enrollment_open: 80, enrollment_complete: 88, install_in_progress: 94, active: 100,
  renewal_pending: 100, renewed: 100, closed: 100,
};

export default function CaseEnhancedCard({ c, employees = [], employeeCount = 0, meta = {} }) {
  const [showDrawer, setShowDrawer] = useState(false);
  const isOverdue = c.effective_date && isAfter(new Date(), parseISO(c.effective_date));
  const daysUntilEffective = c.effective_date ? Math.ceil((parseISO(c.effective_date) - new Date()) / 86400000) : null;
  const daysSince = c.last_activity_date ? differenceInDays(new Date(), new Date(c.last_activity_date)) : null;
  const isStale = daysSince && daysSince > 7 && c.stage && !["active", "closed"].includes(c.stage);
  const progress = STAGE_PROGRESS[c.stage] || 0;
  const nextStep = getCaseNextStep(c, meta);
  const blocker = getCaseBlocker(c, meta);

  return (
    <>
      <Card className="hover:shadow-md transition-all duration-200 hover:border-primary/25 group">
        <CardContent className="p-4 space-y-3">
          {c.stage === "enrollment_open" && <EnrollmentCountdown caseData={c} />}

          <div onClick={() => setShowDrawer(true)} className="cursor-pointer hover:opacity-80 transition-opacity space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="flex-shrink-0 flex flex-col items-center gap-1.5 pt-0.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${PRIORITY_DOT[c.priority] || PRIORITY_DOT.normal}`} title={`${c.priority} priority`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground">{c.employer_name || "Unnamed Employer"}</p>
                    <span className="text-xs text-muted-foreground">{c.case_number || `#${c.id?.slice(-6)}`}</span>
                    {c.priority !== "normal" && (
                      <Badge className={`text-[10px] py-0 h-4 ${c.priority === "urgent" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                        {c.priority === "urgent" && <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />}
                        {c.priority}
                      </Badge>
                    )}
                    {c.assigned_to && (
                      <Badge variant="outline" className="text-[10px] py-0 h-4">
                        Owner: {c.assigned_to.split("@")[0]}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-muted-foreground capitalize">{c.case_type?.replace(/_/g, " ")}</span>
                    {(c.employee_count || employeeCount) > 0 && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" />{c.employee_count || employeeCount} EEs
                      </span>
                    )}
                    {c.effective_date && (
                      <span className={`text-xs flex items-center gap-1 ${isOverdue ? "text-red-600 font-bold" : daysUntilEffective && daysUntilEffective < 30 ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>
                        <Calendar className="w-3 h-3" />{isOverdue ? "OVERDUE" : `${daysUntilEffective}d`}
                      </span>
                    )}
                    {c.target_close_date && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />Close {format(new Date(c.target_close_date), "MMM d")}
                      </span>
                    )}
                    {isStale && (
                      <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />{daysSince}d idle
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <CaseHealthScore c={c} />
                <RelatedItemsBadge
                  caseId={c.id}
                  quotes={meta.quoteCount || 0}
                  tasks={meta.taskCount || 0}
                  documents={meta.documentCount || 0}
                  enrollments={meta.enrollmentCount || 0}
                />
                <StatusBadge status={c.stage} />
                <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
              </div>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-[10px] text-muted-foreground flex-shrink-0">{progress}%</span>
              {c.products_requested?.length > 0 && (
                <div className="flex gap-1 flex-shrink-0">
                  {c.products_requested.slice(0, 4).map((p) => (
                    <span key={p} className="text-[10px] bg-muted text-muted-foreground rounded px-1.5 py-0.5 capitalize">{p}</span>
                  ))}
                  {c.products_requested.length > 4 && (
                    <span className="text-[10px] text-muted-foreground">+{c.products_requested.length - 4}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className={`rounded-lg border px-3 py-2 text-xs ${blocker ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span><span className="font-semibold">Next step:</span> {nextStep}</span>
              <span><span className="font-semibold">Blocker:</span> {blocker || "None"}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-[10px]">
            {(meta.quoteCount || 0) > 0 && <Badge variant="outline" className="gap-1"><FileText className="w-3 h-3" />{meta.quoteCount} quotes</Badge>}
            {(meta.proposalCount || 0) > 0 && <Badge variant="outline" className="gap-1"><FileText className="w-3 h-3" />{meta.proposalCount} proposals</Badge>}
            {(meta.openTaskCount || 0) > 0 && <Badge variant="outline" className="gap-1"><CheckSquare className="w-3 h-3" />{meta.openTaskCount} open tasks</Badge>}
            {(meta.enrollmentCount || 0) > 0 && <Badge variant="outline" className="gap-1"><ClipboardCheck className="w-3 h-3" />{meta.enrollmentCount} windows</Badge>}
            {(meta.exceptionCount || 0) > 0 && <Badge variant="outline" className="gap-1 text-red-700 border-red-200 bg-red-50"><TriangleAlert className="w-3 h-3" />{meta.exceptionCount} exceptions</Badge>}
          </div>

          <CaseEmployeePreview employees={employees} employeeCount={employeeCount} />

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <CaseQuickLinks caseData={c} />
            </div>
            <CaseActionMenu caseData={c} />
          </div>
        </CardContent>
      </Card>

      <InlineDetailDrawer isOpen={showDrawer} onClose={() => setShowDrawer(false)} caseData={c} />
    </>
  );
}