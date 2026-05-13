import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";

export default function CarrierValidationTab({ validationStatus, onValidate }) {
  const mockValidationData = {
    total_rows: 150,
    valid_rows: 145,
    invalid_rows: 5,
    warning_rows: 3,
  };

  const statusConfig = {
    not_validated: { icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50", label: "Not Validated" },
    validating: { icon: AlertTriangle, color: "text-blue-600", bg: "bg-blue-50", label: "Validation In Progress" },
    validated: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", label: "Validated with No Errors" },
    validated_with_warnings: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", label: "Validated with Warnings" },
    failed: { icon: AlertCircle, color: "text-red-600", bg: "bg-red-50", label: "Validation Failed" },
  };

  const config = statusConfig[validationStatus] || statusConfig.not_validated;
  const Icon = config.icon;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Run validation to check row integrity, required fields, and data quality.
      </p>

      <div className={`rounded-lg border p-4 ${config.bg} ${config.color.replace("text-", "border-")}`}>
        <div className="flex items-center gap-2 mb-3">
          <Icon className="w-5 h-5" />
          <p className="font-semibold text-sm">{config.label}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Total Rows</p>
            <p className="text-lg font-bold">{mockValidationData.total_rows}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Valid Rows</p>
            <p className="text-lg font-bold text-green-600">{mockValidationData.valid_rows}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Invalid Rows</p>
            <p className="text-lg font-bold text-red-600">{mockValidationData.invalid_rows}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Warnings</p>
            <p className="text-lg font-bold text-amber-600">{mockValidationData.warning_rows}</p>
          </div>
        </div>
      </div>

      {validationStatus !== "not_validated" && (
        <Card className="p-3 bg-muted/50">
          <p className="text-xs font-medium text-muted-foreground mb-2">Row-Level Validation Details</p>
          <div className="text-xs space-y-1">
            <p>✓ 145 rows: All required fields present and valid</p>
            <p>⚠ 3 rows: ZIP code format warning (non-standard)</p>
            <p>✗ 5 rows: Missing required field (relationship code)</p>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        <Button
          type="button"
          onClick={onValidate}
          className="w-full bg-green-600 hover:bg-green-700"
          disabled={validationStatus === "validating"}
        >
          {validationStatus === "validating" ? "Validating..." : "Run Validation"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled
          className="w-full"
        >
          Proceed with Valid Rows Only (pending backend)
        </Button>
      </div>
    </div>
  );
}