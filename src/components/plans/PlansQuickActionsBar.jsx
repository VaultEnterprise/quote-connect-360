import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Copy, ArrowRightLeft, Upload, Archive, FileWarning, FolderOpen } from "lucide-react";

export default function PlansQuickActionsBar({
  onCreate,
  onImport,
  onCompare,
  onClone,
  onReviewIssues,
  onShowArchived,
  compareDisabled,
  cloneDisabled,
}) {
  return (
    <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-3">
      <Button size="sm" onClick={onCreate}><Plus className="mr-1.5 h-4 w-4" />Create Plan</Button>
      <Button size="sm" variant="outline" onClick={onImport}><Upload className="mr-1.5 h-4 w-4" />Import</Button>
      <Button size="sm" variant="outline" onClick={onCompare} disabled={compareDisabled}><ArrowRightLeft className="mr-1.5 h-4 w-4" />Compare</Button>
      <Button size="sm" variant="outline" onClick={onClone} disabled={cloneDisabled}><Copy className="mr-1.5 h-4 w-4" />Clone</Button>
      <Button size="sm" variant="outline" onClick={onReviewIssues}><FileWarning className="mr-1.5 h-4 w-4" />Review Missing Data</Button>
      <Button size="sm" variant="outline" onClick={onShowArchived}><FolderOpen className="mr-1.5 h-4 w-4" />View Archived</Button>
    </div>
  );
}