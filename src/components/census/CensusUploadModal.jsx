import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Download, CheckCircle2 } from "lucide-react";
import { generateCensusTemplate } from "@/utils/censusHelpers";

const STEPS = ["upload", "processing", "done"];

export default function CensusUploadModal({ caseId, open, onClose }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState("upload");
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState("");
  const [importing, setImporting] = useState(false);
  const [entityReady, setEntityReady] = useState(true);
  const [entityError, setEntityError] = useState("");

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

  const handleImport = async () => {
    if (!file || !entityReady) return;
    setImporting(true);
    setStep("processing");

    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const census_import_id = crypto.randomUUID();

    const me = await base44.auth.me();
    const job = await base44.entities.CensusImportJob.create({
      case_id: caseId,
      census_import_id,
      status: "uploaded",
      source_template: "vault_census",
      source_file_name: file.name,
      source_file_url: file_url,
      created_by_email: me?.email || "",
    });

    await base44.entities.CensusImportAuditEvent.create({
      case_id: caseId,
      census_import_id,
      census_import_job_id: job.id,
      event_type: "upload",
      actor_id: me?.email || "",
      payload: { notes, source_file_name: file.name },
    });

    await base44.functions.invoke("processCensusImportJob", {
      caseId,
      census_import_id,
      source_file_url: file_url,
      source_file_name: file.name,
      censusImportJobId: job.id,
      notes,
    });

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
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Census Snapshot</DialogTitle>
          <div className="flex items-center gap-2 pt-2">
            {["Upload", "Processing", "Done"].map((label, i) => {
              const stepKey = STEPS[i];
              const active = step === stepKey;
              const done = STEPS.indexOf(step) > i;
              return (
                <React.Fragment key={stepKey}>
                  <div className={`flex items-center gap-1.5 text-xs font-medium ${active ? "text-primary" : done ? "text-green-600" : "text-muted-foreground"}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${active ? "bg-primary text-white" : done ? "bg-green-500 text-white" : "bg-muted"}`}>
                      {done ? "✓" : i + 1}
                    </div>
                    {label}
                  </div>
                  {i < 2 && <div className="flex-1 h-px bg-border" />}
                </React.Fragment>
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

        {step === "processing" && (
          <div className="py-10 flex flex-col items-center gap-3">
            <Upload className="w-14 h-14 text-primary animate-pulse" />
            <p className="text-lg font-semibold">Processing Census Import</p>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Your file is being processed on the server with template-aware parsing, normalization, validation, persistence, and audit logging.
            </p>
          </div>
        )}

        {step === "done" && (
          <div className="py-10 flex flex-col items-center gap-3">
            <CheckCircle2 className="w-14 h-14 text-green-500" />
            <p className="text-lg font-semibold">Census Import Submitted</p>
            <p className="text-sm text-muted-foreground">The server processed your file and updated the case import history.</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>{step === "done" ? "Close" : "Cancel"}</Button>
          {step === "upload" && (
            <Button onClick={handleImport} disabled={!file || importing}>
              {importing ? "Submitting..." : "Submit Server Import"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}