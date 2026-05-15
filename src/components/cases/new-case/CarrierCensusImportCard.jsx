import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Trash2, Paperclip } from "lucide-react";
import DaltonRulesToggle from "./DaltonRulesToggle";
import CarrierUploadCensusTab from "./CarrierUploadCensusTab";
import CarrierColumnMappingTab from "./CarrierColumnMappingTab";
import CarrierValidationTab from "./CarrierValidationTab";
import CarrierRequiredDocumentsTab from "./CarrierRequiredDocumentsTab";
import CarrierReviewSubmitTab from "./CarrierReviewSubmitTab";

const TAB_LIST = [
  { id: "upload", label: "Upload Census" },
  { id: "mapping", label: "Map Columns" },
  { id: "validation", label: "Validate Census" },
  { id: "dalton", label: "Dalton Rules" },
  { id: "documents", label: "Required Documents" },
  { id: "review", label: "Review & Submit" },
];

const CARRIER_INFO = {
  ast: { name: "AST", badge: "bg-purple-100 text-purple-700" },
  sus: { name: "SUS", badge: "bg-blue-100 text-blue-700" },
  triad: { name: "Triad", badge: "bg-green-100 text-green-700" },
  mecMvp: { name: "MEC / MVP", badge: "bg-orange-100 text-orange-700" },
};

export default function CarrierCensusImportCard({
  carrierId,
  workflow,
  onUpdate,
  onRemove,
}) {
  const [expanded, setExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState(workflow.activeTab || "upload");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const carrierInfo = CARRIER_INFO[carrierId];

  const handleAnalyzeSuccess = (result) => {
    // Store analysisResult and transition to mapping tab
    handleUpdateWorkflow("analysisResult", result);
    setIsAnalyzing(false);
    setAnalysisError(null);
    setActiveTab("mapping");
  };

  const getStatusBadge = () => {
    switch (workflow.validationStatus) {
      case "validated":
        return <Badge className="bg-green-100 text-green-700">Validated</Badge>;
      case "validated_with_warnings":
        return <Badge className="bg-amber-100 text-amber-700">Warnings</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-700">Failed</Badge>;
      case "validating":
        return <Badge className="bg-blue-100 text-blue-700">Validating</Badge>;
      default:
        return <Badge variant="outline">Ready to Configure</Badge>;
    }
  };

  const handleUpdateWorkflow = (key, value) => {
    onUpdate(carrierId, { ...workflow, [key]: value });
  };

  return (
    <Card>
      <CardHeader className="pb-0 pt-4 px-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="p-1 hover:bg-muted rounded transition-colors"
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <Badge className={carrierInfo.badge}>{carrierInfo.name}</Badge>
              <h3 className="font-semibold">{carrierInfo.name} Census Import</h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => setActiveTab("documents")}
            >
              <Paperclip className="w-3.5 h-3.5 mr-1" />
              Attach
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => onRemove(carrierId)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="text-xs text-muted-foreground">
            {workflow.censusFile ? `File: ${workflow.censusFile.name}` : "No file selected"}
          </div>
          <DaltonRulesToggle
            checked={workflow.daltonRules || false}
            onChange={(checked) => handleUpdateWorkflow("daltonRules", checked)}
          />
        </div>

        {workflow.daltonRules && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-4 text-xs text-blue-900">
            <p>
              <strong>Dalton Rules selected.</strong> Rule definitions will be configured in a later phase and applied after census validation.
            </p>
          </div>
        )}

        <div className="flex gap-1 flex-wrap">
          {TAB_LIST.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-4">
          {activeTab === "upload" && (
            <CarrierUploadCensusTab
              censusFile={workflow.censusFile}
              onFileSelect={(file) => {
                handleUpdateWorkflow("censusFile", file);
                setAnalysisError(null); // Clear error when user selects new file
              }}
              onFileReplace={() => {
                handleUpdateWorkflow("censusFile", null);
                handleUpdateWorkflow("analysisResult", null);
                setAnalysisError(null);
              }}
              carrierName={carrierInfo.name}
              onAnalyzeStart={() => {
                setIsAnalyzing(true);
                setAnalysisError(null);
              }}
              isAnalyzing={isAnalyzing}
              analysisError={analysisError}
              onAnalysisError={(error) => {
                setIsAnalyzing(false);
                setAnalysisError(error);
              }}
              onAnalysisSuccess={handleAnalyzeSuccess}
            />
          )}

          {activeTab === "mapping" && (
            <CarrierColumnMappingTab
              censusFile={workflow.censusFile}
              mapping={workflow.mapping}
              analysisResult={workflow.analysisResult}
              onMappingChange={(colIdx, fieldType) => {
                const newMapping = { ...workflow.mapping, [colIdx]: fieldType };
                handleUpdateWorkflow("mapping", newMapping);
              }}
            />
          )}

          {activeTab === "validation" && (
            <CarrierValidationTab
              validationStatus={workflow.validationStatus}
              onValidate={() => handleUpdateWorkflow("validationStatus", "validated")}
            />
          )}

          {activeTab === "dalton" && (
            <div className="space-y-4">
              <DaltonRulesToggle
                checked={workflow.daltonRules || false}
                onChange={(checked) => handleUpdateWorkflow("daltonRules", checked)}
              />
              {workflow.daltonRules && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900">
                  <p>
                    <strong>Dalton Rules selected.</strong> Rule definitions will be configured in a later phase and applied after census validation.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "documents" && (
            <CarrierRequiredDocumentsTab
              carrierId={carrierId}
              attachments={workflow.attachments || []}
              onAttachmentChange={(idx, action, file) => {
                const newAttachments = [...(workflow.attachments || [])];
                if (action === "add") {
                  newAttachments.push({ file, notes: "" });
                } else if (action === "remove") {
                  newAttachments.splice(idx, 1);
                }
                handleUpdateWorkflow("attachments", newAttachments);
              }}
              requiredForms={workflow.requiredForms || {}}
              onFormUpdate={(formId, key, value) => {
                const newForms = { ...workflow.requiredForms };
                if (!newForms[formId]) newForms[formId] = {};
                newForms[formId][key] = value;
                handleUpdateWorkflow("requiredForms", newForms);
              }}
            />
          )}

          {activeTab === "review" && (
            <CarrierReviewSubmitTab
              carrierId={carrierId}
              workflow={workflow}
              carrierName={carrierInfo.name}
            />
          )}
        </CardContent>
      )}
    </Card>
  );
}