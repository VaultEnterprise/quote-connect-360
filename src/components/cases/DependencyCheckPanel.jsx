import React from "react";
import { AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

export default function DependencyCheckPanel({ tasks, caseData }) {
  const pendingTasks = tasks.filter(t => t.status === "pending");
  const blockedTasks = tasks.filter(t => t.status === "blocked");
  const urgentTasks = tasks.filter(t => t.priority === "urgent");

  const canClose = pendingTasks.length === 0 && blockedTasks.length === 0;

  if (caseData.stage === "closed") return null;

  return (
    <Card className={canClose && pendingTasks.length + blockedTasks.length === 0 ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}>
      <CardContent className="p-4">
        <div className="flex gap-3 mb-3">
          {canClose ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-semibold text-sm">
              {canClose ? "Ready to close case" : "Resolve dependencies before closing"}
            </p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          {urgentTasks.length > 0 && (
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <span className="text-red-700">{urgentTasks.length} urgent task{urgentTasks.length !== 1 ? "s" : ""} pending</span>
            </div>
          )}
          {blockedTasks.length > 0 && (
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <span className="text-amber-700">{blockedTasks.length} blocked task{blockedTasks.length !== 1 ? "s" : ""}</span>
            </div>
          )}
          {pendingTasks.length > 0 && pendingTasks.length <= 3 && (
            <div className="mt-2 space-y-1">
              {pendingTasks.map(t => (
                <div key={t.id} className="text-xs text-amber-600 flex items-start gap-2">
                  <span className="inline-block w-1.5 h-1.5 bg-amber-600 rounded-full mt-1 flex-shrink-0" />
                  {t.title}
                </div>
              ))}
            </div>
          )}
          {pendingTasks.length > 3 && (
            <div className="text-xs text-amber-600">
              +{pendingTasks.length - 3} more pending task{pendingTasks.length - 3 !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}