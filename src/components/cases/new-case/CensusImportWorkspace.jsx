import React from "react";
import CarrierCensusImportCard from "./CarrierCensusImportCard";

export default function CensusImportWorkspace({
  selectedWorkflowOrder,
  importWorkflows,
  onUpdateWorkflow,
  onRemoveWorkflow,
}) {
  if (selectedWorkflowOrder.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Dynamic Census Import Workspace
        </h3>
      </div>
      {selectedWorkflowOrder.map((carrierId) => (
        <CarrierCensusImportCard
          key={carrierId}
          carrierId={carrierId}
          workflow={importWorkflows[carrierId]}
          onUpdate={onUpdateWorkflow}
          onRemove={onRemoveWorkflow}
        />
      ))}
    </div>
  );
}