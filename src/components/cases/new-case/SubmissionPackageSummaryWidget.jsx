import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, FileText } from "lucide-react";

export default function SubmissionPackageSummaryWidget({
  selectedWorkflowOrder,
  importWorkflows,
}) {
  if (selectedWorkflowOrder.length === 0) {
    return null;
  }

  const selectedDestinations = selectedWorkflowOrder.map((id) => {
    const info = { ast: "AST", sus: "SUS", triad: "Triad" };
    return info[id];
  });

  const validatedCount = selectedWorkflowOrder.filter(
    (id) => importWorkflows[id]?.validationStatus === "validated"
  ).length;

  const daltonRulesCount = selectedWorkflowOrder.filter(
    (id) => importWorkflows[id]?.daltonRules
  ).length;

  const documentsStatus = selectedWorkflowOrder.reduce((total, id) => {
    const workflow = importWorkflows[id];
    const attachmentCount = (workflow.attachments?.length || 0) +
      Object.values(workflow.requiredForms || {}).filter(f => f.file).length;
    return total + attachmentCount;
  }, 0);

  const overallStatus = validatedCount === selectedWorkflowOrder.length ? "Ready for Review" : "In Progress";

  return (
    <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Submission Package Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Selected Destinations</p>
            <div className="flex flex-wrap gap-1">
              {selectedDestinations.map((dest) => (
                <Badge key={dest} variant="secondary" className="text-xs">
                  {dest}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Census Imports Required</p>
            <p className="text-2xl font-bold">{selectedWorkflowOrder.length}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Validated</p>
            <div className="flex items-center gap-1">
              <p className="text-2xl font-bold">{validatedCount}</p>
              {validatedCount === selectedWorkflowOrder.length && (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              )}
              {validatedCount < selectedWorkflowOrder.length && validatedCount > 0 && (
                <AlertCircle className="w-5 h-5 text-amber-600" />
              )}
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Documents Attached</p>
            <p className="text-2xl font-bold">{documentsStatus}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Dalton Rules Selected</p>
            <p className="text-2xl font-bold">{daltonRulesCount}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Overall Status</p>
            <Badge
              variant={overallStatus === "Ready for Review" ? "default" : "outline"}
              className="text-xs h-fit"
            >
              {overallStatus}
            </Badge>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-slate-200">
          <p className="text-xs text-muted-foreground">
            <strong>Next Step:</strong> Complete census uploads and validations, then attachRequired documents for each carrier.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}