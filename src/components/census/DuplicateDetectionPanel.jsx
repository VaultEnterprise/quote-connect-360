import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle } from "lucide-react";

export default function DuplicateDetectionPanel({ duplicates, rows, onToggleSkip }) {
  const [skipped, setSkipped] = useState(new Set());

  const handleToggle = (rowIdx) => {
    const newSkipped = new Set(skipped);
    if (newSkipped.has(rowIdx)) {
      newSkipped.delete(rowIdx);
    } else {
      newSkipped.add(rowIdx);
    }
    setSkipped(newSkipped);
    onToggleSkip?.(newSkipped);
  };

  if (!duplicates || duplicates.length === 0) {
    return null;
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <CardTitle className="text-sm">{duplicates.length} Potential Duplicate(s)</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-amber-700">
          These rows may be duplicates. You can skip rows to prevent importing duplicates.
        </p>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {duplicates.map((dup) => (
            <div key={`${dup.row}-${dup.prevRow}`} className="flex items-center gap-2 p-2 bg-white rounded border border-amber-100 text-xs">
              <Checkbox
                checked={skipped.has(dup.row)}
                onCheckedChange={() => handleToggle(dup.row)}
              />
              <div className="flex-1">
                <div className="font-medium">
                  Row {dup.row + 2} {/* +2 because headers are row 1, data starts at row 2 */}
                </div>
                <div className="text-muted-foreground">
                  Matches row {dup.prevRow + 2} by {dup.type}: {dup.email || dup.employee_id}
                </div>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {skipped.has(dup.row) ? "Skip" : "Import"}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}