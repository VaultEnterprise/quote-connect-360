import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";

export default function CaseValidationPanel({ caseId }) {
  const { data: results = [] } = useQuery({
    queryKey: ["case-validation-results", caseId],
    queryFn: () => base44.entities.CaseValidationResult.filter({ case_id: caseId }, "-created_date", 100),
    enabled: !!caseId,
  });

  const errors = results.filter((item) => item.severity === "error");
  const warnings = results.filter((item) => item.severity === "warning");

  if (results.length === 0) {
    return <EmptyState icon={CheckCircle2} title="No Validation Issues" description="This case currently has no stored validation findings." />;
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Badge variant="destructive">{errors.length} errors</Badge>
        <Badge variant="outline">{warnings.length} warnings</Badge>
      </div>
      {results.map((result) => (
        <Card key={result.id} className={result.severity === "error" ? "border-red-200" : "border-amber-200"}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              {result.severity === "error" ? <AlertTriangle className="w-4 h-4 text-red-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
              {result.message}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground space-y-1">
            {result.field_code && <div>Field: {result.field_code}</div>}
            <div>Code: {result.code}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}