import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileX } from "lucide-react";

export default function CarrierUploadCensusTab({ censusFile, onFileSelect, onFileReplace, carrierName }) {
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

      {censusFile && (
        <Button type="button" className="w-full bg-blue-600 hover:bg-blue-700" disabled>
          Analyze Census (pending backend integration)
        </Button>
      )}
    </div>
  );
}