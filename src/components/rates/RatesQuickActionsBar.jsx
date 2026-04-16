import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Copy, ArrowRightLeft, Link2, Upload, ShieldAlert, Rocket, Archive, Download, Settings2 } from "lucide-react";

function ActionButton({ label, icon: IconComponent, onClick, disabled, reason }) {
  return (
    <Button size="sm" variant="outline" onClick={onClick} disabled={disabled} title={reason || label}>
      <IconComponent className="mr-1.5 h-4 w-4" />{label}
    </Button>
  );
}

export default function RatesQuickActionsBar({ actions }) {
  return (
    <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-3 shadow-sm">
      <ActionButton label="Create Rate Set" icon={Plus} onClick={actions.onCreate} />
      <ActionButton label="Clone Rate Set" icon={Copy} onClick={actions.onClone} disabled={actions.cloneDisabled} reason={actions.cloneReason} />
      <ActionButton label="Open Rate Builder" icon={Settings2} onClick={actions.onBuilder} disabled={actions.builderDisabled} reason={actions.builderReason} />
      <ActionButton label="Compare Rates" icon={ArrowRightLeft} onClick={actions.onCompare} disabled={actions.compareDisabled} reason={actions.compareReason} />
      <ActionButton label="Assign Rate Set" icon={Link2} onClick={actions.onAssign} disabled={actions.assignDisabled} reason={actions.assignReason} />
      <ActionButton label="Import Rate Table" icon={Upload} onClick={actions.onImport} />
      <ActionButton label="Review Issues" icon={ShieldAlert} onClick={actions.onReviewIssues} />
      <ActionButton label="Activate Future Version" icon={Rocket} onClick={actions.onActivate} disabled={actions.activateDisabled} reason={actions.activateReason} />
      <ActionButton label="Archive Rate Set" icon={Archive} onClick={actions.onArchive} disabled={actions.archiveDisabled} reason={actions.archiveReason} />
      <ActionButton label="Export Rates" icon={Download} onClick={actions.onExport} />
    </div>
  );
}