import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, AlertCircle, AlertTriangle } from "lucide-react";

export default function ErrorDetailPanel({ rows, mapping, validateRow, transformRow }) {
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Find rows with issues
  const rowsWithIssues = rows
    .map((row, idx) => ({
      idx,
      row,
      issues: validateRow(row, mapping),
      transformed: transformRow(row, mapping)
    }))
    .filter(r => r.issues.length > 0);

  const toggleExpanded = (rowIdx) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowIdx)) {
      newExpanded.delete(rowIdx);
    } else {
      newExpanded.add(rowIdx);
    }
    setExpandedRows(newExpanded);
  };

  if (rowsWithIssues.length === 0) {
    return null;
  }

  const errorCount = rowsWithIssues.reduce((sum, r) => sum + r.issues.filter(i => i.type === "error").length, 0);
  const warningCount = rowsWithIssues.reduce((sum, r) => sum + r.issues.filter(i => i.type === "warning").length, 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm">
        {errorCount > 0 && (
          <Badge variant="destructive" className="text-[10px]">
            <AlertCircle className="w-3 h-3 mr-1" />
            {errorCount} Error{errorCount !== 1 ? "s" : ""}
          </Badge>
        )}
        {warningCount > 0 && (
          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 text-[10px]">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {warningCount} Warning{warningCount !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {rowsWithIssues.map(({ idx, row, issues }) => {
          const isExpanded = expandedRows.has(idx);
          const hasErrors = issues.some(i => i.type === "error");

          return (
            <Card
              key={idx}
              className={hasErrors ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}
            >
              <CardContent className="p-3">
                <button
                  onClick={() => toggleExpanded(idx)}
                  className="w-full flex items-center gap-2 text-xs hover:opacity-70 transition-opacity"
                >
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 shrink-0" />
                  )}
                  <span className="font-medium">
                    Row {idx + 2}: {row[Object.values(mapping)[0]] || "Unknown"}
                  </span>
                  <div className="flex items-center gap-1 ml-auto">
                    {issues.filter(i => i.type === "error").length > 0 && (
                      <Badge className="bg-red-600 text-[10px] py-0">
                        {issues.filter(i => i.type === "error").length}E
                      </Badge>
                    )}
                    {issues.filter(i => i.type === "warning").length > 0 && (
                      <Badge className="bg-amber-600 text-[10px] py-0">
                        {issues.filter(i => i.type === "warning").length}W
                      </Badge>
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-3 space-y-2 border-t pt-3">
                    {issues.map((issue, i) => (
                      <div key={i} className="text-xs">
                        <div className={`font-medium ${issue.type === "error" ? "text-red-700" : "text-amber-700"}`}>
                          {issue.message}
                        </div>
                        <div className="text-muted-foreground mt-0.5">
                          Field: <span className="font-mono bg-white px-1 rounded py-0.5">{issue.field}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}