import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function CarrierReviewSubmitTab({ carrierId, workflow, carrierName }) {
  const statusIcon = workflow.validationStatus === "validated" ? (
    <CheckCircle2 className="w-5 h-5 text-green-600" />
  ) : (
    <AlertCircle className="w-5 h-5 text-amber-600" />
  );

  const statusColor = workflow.validationStatus === "validated" ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200";

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Review the submission package before marking as ready.
      </p>

      <div className="grid gap-3">
        <Card className="p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">Carrier / Destination</p>
          <p className="text-sm font-semibold">{carrierName}</p>
        </Card>

        <Card className="p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">Census File</p>
          <p className="text-sm font-semibold">
            {workflow.censusFile ? workflow.censusFile.name : "No file selected"}
          </p>
        </Card>

        <Card className="p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">Mapping Status</p>
          <Badge variant={Object.keys(workflow.mapping).length > 0 ? "default" : "outline"}>
            {Object.keys(workflow.mapping).length} columns mapped
          </Badge>
        </Card>

        <Card className={`p-3 border ${statusColor}`}>
          <div className="flex items-center gap-2 mb-1">
            {statusIcon}
            <p className="text-xs font-medium text-muted-foreground">Validation Status</p>
          </div>
          <p className="text-sm font-semibold capitalize">
            {workflow.validationStatus.replace(/_/g, " ")}
          </p>
        </Card>

        <Card className="p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">Dalton Rules Selected</p>
          <Badge variant={workflow.daltonRules ? "default" : "outline"}>
            {workflow.daltonRules ? "Yes" : "No"}
          </Badge>
        </Card>

        <Card className="p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">Attachments</p>
          <p className="text-sm font-semibold">
            {(workflow.attachments?.length || 0)} document(s) attached
          </p>
        </Card>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900">
        <p>
          <strong>Note:</strong> Backend integration for carrier submission is pending. The "Mark Ready for Review" action is UI-only for this phase.
        </p>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" disabled>
          Save Draft (pending backend)
        </Button>
        <Button type="button" size="sm" disabled className="bg-blue-600">
          Mark Ready for Review (pending backend)
        </Button>
      </div>
    </div>
  );
}