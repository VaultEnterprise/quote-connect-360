import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function CensusQualityDashboard({ fieldStats }) {
  if (!fieldStats || Object.keys(fieldStats).length === 0) {
    return null;
  }

  const fields = Object.entries(fieldStats).sort((a, b) => b[1].completeness - a[1].completeness);
  const avgCompleteness = Math.round(
    fields.reduce((sum, [_, data]) => sum + data.completeness, 0) / fields.length
  );

  const criticalFields = ["first_name", "last_name", "date_of_birth", "email"];
  const criticalStats = criticalFields.map(f => fieldStats[f]).filter(Boolean);
  const criticalHealth = criticalStats.length > 0
    ? Math.round(criticalStats.reduce((sum, s) => sum + s.completeness, 0) / criticalStats.length)
    : 100;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="text-sm text-muted-foreground">Data Completeness</div>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-2xl font-bold">{avgCompleteness}%</span>
              <span className="text-xs text-muted-foreground mb-0.5">average</span>
            </div>
            <Progress value={avgCompleteness} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              {criticalHealth === 100 ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-500" />
              )}
              Critical Fields
            </div>
            <div className="text-2xl font-bold mt-1">{criticalHealth}%</div>
            <Progress value={criticalHealth} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Field Completeness</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {fields.slice(0, 8).map(([field, data]) => (
            <div key={field}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium capitalize">{field.replace(/_/g, " ")}</span>
                <span className="text-muted-foreground">{data.completeness}% ({data.populated}/{data.total})</span>
              </div>
              <Progress value={data.completeness} className="h-1.5" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}