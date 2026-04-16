import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, TrendingDown, Target, Zap } from "lucide-react";

export default function DataQualityInsights({ fieldStats, rows }) {
  if (!fieldStats || !rows || rows.length === 0) {
    return null;
  }

  // Calculate outliers
  const salaries = rows
    .map(r => Object.values(r).find(v => !isNaN(parseFloat(v)) && parseFloat(v) > 10000))
    .filter(Boolean)
    .map(parseFloat);

  const avgSalary = salaries.length > 0 ? salaries.reduce((a, b) => a + b) / salaries.length : 0;
  const outliers = salaries.filter(s => Math.abs(s - avgSalary) > avgSalary * 0.5);

  // Missing critical fields
  const criticalFields = ["first_name", "last_name", "email", "date_of_birth"];
  const missingCritical = criticalFields.filter(f => {
    const stats = fieldStats[f];
    return stats && stats.completeness < 100;
  });

  // Age outliers (very young or very old)
  const ages = rows
    .map(r => {
      const dob = r[Object.keys(r).find(k => k.toLowerCase().includes("birth") || k.toLowerCase().includes("dob"))];
      if (!dob) return null;
      const age = new Date().getFullYear() - new Date(dob).getFullYear();
      return age > 15 && age < 100 ? age : null;
    })
    .filter(Boolean);

  const avgAge = ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b) / ages.length) : null;
  const ageOutliers = ages.filter(a => a < 20 || a > 70);

  // Duplicate emails/names
  const nameMap = new Map();
  rows.forEach(r => {
    const name = `${r[Object.keys(r).find(k => k.toLowerCase().includes("first"))] || ""}${r[Object.keys(r).find(k => k.toLowerCase().includes("last"))] || ""}`.toLowerCase();
    if (name) nameMap.set(name, (nameMap.get(name) || 0) + 1);
  });
  const duplicateNames = Array.from(nameMap.values()).filter(count => count > 1).length;

  const issues = [];
  if (missingCritical.length > 0) issues.push({ type: "error", text: `${missingCritical.length} critical field(s) incomplete` });
  if (duplicateNames > 0) issues.push({ type: "warning", text: `${duplicateNames} potential duplicate names` });
  if (ageOutliers.length > 0) issues.push({ type: "warning", text: `${ageOutliers.length} unusual age(s)` });
  if (outliers.length > 0) issues.push({ type: "warning", text: `${outliers.length} salary outlier(s)` });

  return (
    <div className="space-y-3">
      {issues.length > 0 && (
        <div className="space-y-2">
          {issues.map((issue, idx) => (
            <Alert key={idx} variant={issue.type === "error" ? "destructive" : "default"}>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription className="text-xs ml-2">{issue.text}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="w-4 h-4" /> Data Quality Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Salary Distribution */}
          {salaries.length > 0 && (
            <div className="p-2.5 bg-muted/50 rounded text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Annual Salary</span>
                <Badge variant="secondary" className="text-[10px]">Financial Data</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div>
                  <p className="text-muted-foreground">Min</p>
                  <p className="font-semibold">${Math.min(...salaries).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Avg</p>
                  <p className="font-semibold">${Math.round(avgSalary).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Max</p>
                  <p className="font-semibold">${Math.max(...salaries).toLocaleString()}</p>
                </div>
              </div>
              {outliers.length > 0 && (
                <p className="text-amber-600 pt-1">⚠️ {outliers.length} salary outlier(s) detected ({'>'}50% deviation)</p>
              )}
            </div>
          )}

          {/* Age Demographics */}
          {ages.length > 0 && (
            <div className="p-2.5 bg-muted/50 rounded text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Age Demographics</span>
                <Badge variant="secondary" className="text-[10px]">Demographic</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div>
                  <p className="text-muted-foreground">Min</p>
                  <p className="font-semibold">{Math.min(...ages)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Avg</p>
                  <p className="font-semibold">{avgAge}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Max</p>
                  <p className="font-semibold">{Math.max(...ages)}</p>
                </div>
              </div>
              {ageOutliers.length > 0 && (
                <p className="text-amber-600 pt-1">⚠️ {ageOutliers.length} unusual age(s) ({'<'}20 or {'>'}70)</p>
              )}
            </div>
          )}

          {/* Field Completeness Summary */}
          <div className="p-2.5 bg-muted/50 rounded text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Field Completeness</span>
              <Badge variant="secondary" className="text-[10px]">Data Quality</Badge>
            </div>
            <div className="space-y-1 text-[11px]">
              {Object.entries(fieldStats)
                .filter(([_, stats]) => stats.completeness < 100)
                .slice(0, 3)
                .map(([field, stats]) => (
                  <div key={field} className="flex items-center justify-between">
                    <span className="capitalize text-muted-foreground">{field.replace(/_/g, " ")}</span>
                    <span className="font-semibold">{stats.completeness}%</span>
                  </div>
                ))}
              {Object.entries(fieldStats).filter(([_, s]) => s.completeness < 100).length > 3 && (
                <p className="text-muted-foreground italic">...and {Object.entries(fieldStats).filter(([_, s]) => s.completeness < 100).length - 3} more incomplete field(s)</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        💡 Review highlighted issues before import to ensure data quality. Members with errors will still import but marked for review.
      </p>
    </div>
  );
}