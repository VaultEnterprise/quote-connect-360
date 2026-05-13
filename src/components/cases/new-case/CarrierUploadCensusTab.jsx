import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, AlertCircle, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { censusImportClient } from "@/components/census/CensusImportClient";

export default function CarrierUploadCensusTab({
  censusFile,
  onFileSelect,
  onFileReplace,
  carrierName,
  onAnalyzeStart,
  isAnalyzing = false,
  analysisError = null,
  onAnalysisError,
  onAnalysisSuccess,
}) {
  const fileInputRef = useRef(null);

  const handleDragDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if ([".csv", ".xlsx", ".xls"].some(ext => file.name.toLowerCase().endsWith(ext))) {
        onFileSelect(file);
      }
    }
  };

  const detectLayout = (filename) => {
    if (filename.toLowerCase().includes("vault")) return "VAULT";
    return "Standard";
  };

  const handleAnalyzeCensus = async () => {
    if (!censusFile) return;

    onAnalyzeStart();
    try {
      // First upload the file
      const uploadResponse = await base44.integrations.Core.UploadFile({
        file: censusFile,
      });

      if (!uploadResponse.data?.file_url) {
        onAnalysisError("Failed to upload file");
        return;
      }

      // Then analyze using the uploaded file URL
      const analyzeResponse = await censusImportClient.analyzeWorkbook(
        uploadResponse.data.file_url,
        censusFile.name,
        censusFile.type || ""
      );

      if (analyzeResponse.data) {
        onAnalysisSuccess(analyzeResponse.data);
      } else if (analyzeResponse.error) {
        onAnalysisError(analyzeResponse.error);
      }
    } catch (error) {
      onAnalysisError(error.message || "Failed to analyze census file");
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Upload the census file for {carrierName}. The system will detect columns and allow manual mapping before validation.
      </p>

      {!censusFile ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDragDrop}
          className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
        >
          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Drag and drop your census file here or click to select
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Supported: .csv, .xlsx, .xls
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                onFileSelect(e.target.files[0]);
              }
            }}
            className="hidden"
          />
          <Button
            type="button"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            Choose File
          </Button>
        </div>
      ) : (
        <div className="border border-border rounded-lg p-4 bg-green-50 border-green-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-900">{censusFile.name}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {detectLayout(censusFile.name)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {(censusFile.size / 1024).toFixed(1)} KB
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onFileReplace}
            >
              Replace
            </Button>
          </div>
        </div>
      )}

      {analysisError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-900">
            <p className="font-medium">Analysis Failed</p>
            <p className="text-xs mt-1">{analysisError}</p>
          </div>
        </div>
      )}

      {censusFile && (
        <Button
          type="button"
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          onClick={handleAnalyzeCensus}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing census...
            </>
          ) : (
            "Analyze Census"
          )}
        </Button>
      )}
    </div>
  );
}