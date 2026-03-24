import React, { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { format, differenceInDays } from "date-fns";
import { Clock, User, Target, AlertCircle, FileText, CheckSquare } from "lucide-react";
import CaseStatusTimeline from "./CaseStatusTimeline";
import RelatedItemsBadge from "./RelatedItemsBadge";

const STAGES = ["draft", "census_in_progress", "census_validated", "ready_for_quote", "quoting", "proposal_ready", "employer_review", "approved_for_enrollment", "enrollment_open", "enrollment_complete", "install_in_progress", "active"];

export default function InlineDetailDrawer({ isOpen, onClose, caseData }) {
  const [tasks, setTasks] = useState([]);
  const [relatedCounts, setRelatedCounts] = useState({ quotes: 0, tasks: 0, documents: 0, enrollments: 0 });

  useEffect(() => {
    if (!isOpen || !caseData?.id) return;
    
    Promise.all([
      base44.entities.CaseTask.filter({ case_id: caseData.id }).catch(() => []),
      base44.entities.Document.filter({ case_id: caseData.id }).catch(() => []),
      base44.entities.QuoteScenario.filter({ case_id: caseData.id }).catch(() => []),
      base44.entities.EnrollmentWindow.filter({ case_id: caseData.id }).catch(() => []),
    ]).then(([t, d, q, e]) => {
      setTasks(t || []);
      setRelatedCounts({ tasks: t?.length || 0, documents: d?.length || 0, quotes: q?.length || 0, enrollments: e?.length || 0 });
    });
  }, [isOpen, caseData?.id]);

  if (!caseData) return null;

  const daysUntilEffective = caseData.effective_date ? differenceInDays(new Date(caseData.effective_date), new Date()) : null;
  const isOverdue = daysUntilEffective && daysUntilEffective < 0;
  const currentStageIdx = STAGES.indexOf(caseData.stage || "draft");
  const nextStage = currentStageIdx < STAGES.length - 1 ? STAGES[currentStageIdx + 1] : null;
  const daysSinceActivity = caseData.last_activity_date ? differenceInDays(new Date(), new Date(caseData.last_activity_date)) : null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg">{caseData.employer_name}</SheetTitle>
          <p className="text-xs text-muted-foreground mt-1">#{caseData.case_number}</p>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          {/* Status Timeline */}
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-medium">Progress</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <CaseStatusTimeline stage={caseData.stage} />
            </CardContent>
          </Card>

          {/* Key Dates */}
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-medium flex items-center gap-2"><Target className="w-3.5 h-3.5" /> Key Dates</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2 text-xs">
              {caseData.effective_date && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Effective Date</span>
                  <Badge variant={isOverdue ? "destructive" : "secondary"} className="text-[10px] py-0 h-4">
                    {isOverdue ? `${Math.abs(daysUntilEffective)}d overdue` : `${daysUntilEffective}d`}
                  </Badge>
                </div>
              )}
              {caseData.target_close_date && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Target Close</span>
                  <span className="font-medium">{format(new Date(caseData.target_close_date), "MMM d")}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium text-[10px]">{format(new Date(caseData.created_date), "MMM d, yyyy")}</span>
              </div>
            </CardContent>
          </Card>

          {/* Assignment & Contact */}
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-medium flex items-center gap-2"><User className="w-3.5 h-3.5" /> Assignment</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3 text-xs">
              <div>
                <span className="text-muted-foreground">Assigned To</span>
                <p className="font-medium mt-0.5">{caseData.assigned_to || "Unassigned"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Priority</span>
                <Badge className={`text-[10px] py-0 h-4 mt-1 ${caseData.priority === "urgent" ? "bg-red-100 text-red-700" : caseData.priority === "high" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>
                  {caseData.priority}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Activity */}
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-medium flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
              {daysSinceActivity !== null ? (
                <p>Last activity <span className="font-medium">{daysSinceActivity}d ago</span></p>
              ) : (
                <p>No activity yet</p>
              )}
            </CardContent>
          </Card>

          {/* Next Action Indicator */}
          {nextStage && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4 text-xs flex gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-900">Next Step</p>
                  <p className="text-amber-700">Move to <span className="font-semibold capitalize">{nextStage.replace(/_/g, " ")}</span></p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Related Items Summary */}
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-medium">Related Items</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex flex-wrap gap-2">
                {relatedCounts.quotes > 0 && <Badge variant="secondary" className="text-[10px] py-0 h-4">{relatedCounts.quotes} quotes</Badge>}
                {relatedCounts.tasks > 0 && <Badge variant="secondary" className="text-[10px] py-0 h-4">{relatedCounts.tasks} tasks</Badge>}
                {relatedCounts.documents > 0 && <Badge variant="secondary" className="text-[10px] py-0 h-4">{relatedCounts.documents} docs</Badge>}
                {relatedCounts.enrollments > 0 && <Badge variant="secondary" className="text-[10px] py-0 h-4">{relatedCounts.enrollments} enrollment windows</Badge>}
              </div>
            </CardContent>
          </Card>

          {/* Open Tasks */}
          {tasks.length > 0 && (
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-medium flex items-center gap-2"><CheckSquare className="w-3.5 h-3.5" /> Open Tasks ({tasks.filter(t => t.status === "pending").length})</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-1">
                {tasks.filter(t => t.status === "pending").slice(0, 3).map(t => (
                  <div key={t.id} className="text-xs p-2 bg-muted/30 rounded truncate">
                    {t.title}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}