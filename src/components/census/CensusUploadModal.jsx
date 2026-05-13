import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Download, CheckCircle2, AlertCircle } from "lucide-react";
import { generateCensusTemplate } from "@/utils/censusHelpers";
import CensusColumnMapper from "./CensusColumnMapper";
import CensusMappingPreview from "./CensusMappingPreview";
import { censusImportClient } from "./CensusImportClient";

const STEPS = ["upload", "analyze", "mapping", "preview", "processing", "done"];

export default function CensusUploadModal({ caseId, open, onClose }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState("upload");
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState("");
  const [importing, setImporting] = useState(false);
  const [entityReady, setEntityReady] = useState(true);
  const [entityError, setEntityError] = useState("");
  const [headers, setHeaders] = useState([]);
  const [headerRowIndex, setHeaderRowIndex] = useState(0);
  const [mapping, setMapping] = useState({});
  const [preview, setPreview] = useState([]);
  const [mappingError, setMappingError] = useState("");
  const [fileUrl, setFileUrl] = useState(null);

  useEffect(() => {
    if (!open) return;
    base44.entities.CensusImportJob.list('-created_date', 1)
      .then(() => {
        setEntityReady(true);
        setEntityError('');
      })
      .catch(() => {
        setEntityReady(false);
        setEntityError('Census import system not initialized. Entity missing.');
      });
  }, [open]);

  const handleFile = (selectedFile) => {
    setFile(selectedFile);
  };

  const handleFileSelect = async () => {
    if (!file || !entityReady) return;
    setStep("analyze");

    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFileUrl(file_url);

    try {
      const analysisRes = await censusImportClient.analyzeWorkbook(file_url);
      setHeaders(analysisRes.data.headers);
      setHeaderRowIndex(analysisRes.data.header_row_index);

      // Auto-suggest mapping
      const suggestedMapping = {};
      analysisRes.data.headers.forEach((h, idx) => {
        const normalized = h.normalized;
        if (normalized.includes("relationship") || normalized.includes("relation")) suggestedMapping[idx] = "relationship";
        else if (normalized.includes("first") && normalized.includes("name")) suggestedMapping[idx] = "first_name";
        else if (normalized.includes("last") && normalized.includes("name")) suggestedMapping[idx] = "last_name";
        else if (normalized.includes("dob") || normalized.includes("birth")) suggestedMapping[idx] = "dob";
        else if (normalized.includes("address")) suggestedMapping[idx] = "address";
        else if (normalized.includes("city")) suggestedMapping[idx] = "city";
        else if (normalized.includes("state")) suggestedMapping[idx] = "state";
        else if (normalized.includes("zip")) suggestedMapping[idx] = "zip";
        else if (normalized.includes("gender") || normalized.includes("sex")) suggestedMapping[idx] = "gender";
      });

      setMapping(suggestedMapping);
      setStep("mapping");
      } catch (error) {
      setMappingError(`Analysis failed: ${error.message}`);
      setStep("upload");
      }
  };

  const handleMappingChange = async (newMapping) => {
    setMapping(newMapping);
    
    const validationRes = await censusImportClient.validateMapping(newMapping);
    if (!validationRes.data.valid) {
      setMappingError(`Missing required: ${validationRes.data.missing_required.join(", ")}`);
    } else {
      setMappingError("");
    }
  };

  const handlePreview = async () => {
    const previewRes = await censusImportClient.previewMapping(fileUrl, mapping, headerRowIndex);
    setPreview(previewRes.data.preview);
    setStep("preview");
  };

  const handleImport = async () => {
    if (!fileUrl || !entityReady || mappingError) return;
    setImporting(true);
    setStep("processing");

    const census_import_id = crypto.randomUUID();

    try {
      await censusImportClient.executeImport(
        caseId,
        census_import_id,
        fileUrl,
        file.name,
        mapping,
        headerRowIndex
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["case", caseId] }),
        queryClient.invalidateQueries({ queryKey: ["census-all"] }),
        queryClient.invalidateQueries({ queryKey: ["census-versions", caseId] }),
        queryClient.invalidateQueries({ queryKey: ["census-members"] }),
        queryClient.invalidateQueries({ queryKey: ["census-members-page", caseId] }),
        queryClient.invalidateQueries({ queryKey: ["census-import-job", caseId] }),
        queryClient.invalidateQueries({ queryKey: ["census-validation-results", caseId] }),
      ]);

      setImporting(false);
      setStep("done");
    } catch (error) {
      setMappingError(error.message);
      setStep("preview");
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csv = generateCensusTemplate();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "census-template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setStep("upload");
    setFile(null);
    setNotes("");
    setImporting(false);
    setHeaders([]);
    setMapping({});
    setPreview([]);
    setMappingError("");
    setFileUrl(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Census with Column Mapping</DialogTitle>
          <div className="flex items-center gap-1 pt-2 overflow-x-auto pb-2">
            {STEPS.map((stepKey, i) => {
              const active = step === stepKey;
              const done = STEPS.indexOf(step) > i;
              const label = ["Upload", "Analyze", "Map", "Preview", "Import", "Done"][i];
              return (
                <div key={stepKey} className="flex items-center gap-1 flex-shrink-0">
                  <div className={`flex items-center gap-1.5 text-xs font-medium ${active ? "text-primary" : done ? "text-green-600" : "text-muted-foreground"}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${active ? "bg-primary text-white" : done ? "bg-green-500 text-white" : "bg-muted"}`}>
                      {done ? "✓" : i + 1}
                    </div>
                    <span className="hidden sm:inline">{label}</span>
                  </div>
                  {i < STEPS.length - 1 && <div className="w-6 h-px bg-border flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4 py-2">
            <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-10 cursor-pointer hover:bg-muted/50 transition-colors">
              <Upload className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Click to select a census file</p>
              <p className="text-xs text-muted-foreground mt-1">Server-side parsing, validation, audit tracking, and reprocessing ready</p>
              <input type="file" accept=".csv,.xlsx" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} disabled={!entityReady} />
            </label>

            {!entityReady && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                {entityError}
              </div>
            )}

            {file && (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <p className="font-medium">Selected file</p>
                <p className="text-muted-foreground mt-1">{file.name}</p>
              </div>
            )}

            <Button variant="outline" size="sm" onClick={downloadTemplate} className="w-full text-xs">
              <Download className="w-3.5 h-3.5 mr-2" /> Download Template
            </Button>

            <div>
              <Label>Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="mt-1.5"
                placeholder="Any notes about this census import..."
              />
            </div>
          </div>
        )}

        {step === "analyze" && (
          <div className="py-10 flex flex-col items-center gap-3">
            <Upload className="w-14 h-14 text-primary animate-pulse" />
            <p className="text-lg font-semibold">Analyzing File</p>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Reading file structure and detecting column headers...
            </p>
          </div>
        )}

        {step === "mapping" && (
          <div className="space-y-4 py-4">
            <CensusColumnMapper
              headers={headers}
              mapping={mapping}
              onMappingChange={handleMappingChange}
              validationErrors={mappingError ? [mappingError] : []}
            />
            {mappingError && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 flex gap-2">
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">{mappingError}</p>
              </div>
            )}
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4 py-4">
            <CensusMappingPreview preview={preview} mapping={mapping} />
            {mappingError && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 flex gap-2">
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">{mappingError}</p>
              </div>
            )}
          </div>
        )}

        {step === "processing" && (
          <div className="py-10 flex flex-col items-center gap-3">
            <Upload className="w-14 h-14 text-primary animate-pulse" />
            <p className="text-lg font-semibold">Importing Census</p>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Processing your mapped data, validating records, and persisting to the system...
            </p>
          </div>
        )}

        {step === "done" && (
          <div className="py-10 flex flex-col items-center gap-3">
            <CheckCircle2 className="w-14 h-14 text-green-500" />
            <p className="text-lg font-semibold">Census Import Complete</p>
            <p className="text-sm text-muted-foreground">Your census data has been successfully imported and validated.</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {step === "done" ? "Close" : "Cancel"}
          </Button>
          {step === "upload" && (
            <Button onClick={handleFileSelect} disabled={!file || !entityReady || importing}>
              Next: Analyze File
            </Button>
          )}
          {step === "mapping" && (
            <Button onClick={handlePreview} disabled={!!mappingError || importing}>
              Next: Preview
            </Button>
          )}
          {step === "preview" && (
            <Button onClick={handleImport} disabled={!!mappingError || importing}>
              {importing ? "Importing..." : "Complete Import"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}