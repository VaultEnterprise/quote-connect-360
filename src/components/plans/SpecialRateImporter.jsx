import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileSpreadsheet, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function SpecialRateImporter({ planId, rateScheduleId, scheduleName }) {
  const qc = useQueryClient();
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    try {
      const upload = await base44.integrations.Core.UploadFile({ file });
      const response = await base44.functions.invoke("importSpecialRateWorkbook", {
        file_url: upload.file_url,
        planId,
        rateScheduleId,
        sourceFileName: file.name,
      });
      setResult(response.data);
      qc.invalidateQueries({ queryKey: ["rate-detail", rateScheduleId] });
      qc.invalidateQueries({ queryKey: ["plan-rate-schedules"] });
      toast.success(`Imported ${response.data.imported_rate_rows} rate rows and ${response.data.imported_zip_rows} ZIP mappings`);
    } catch (error) {
      toast.error(error.message || "Special importer failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setOpen(true)}>
        <Sparkles className="w-3 h-3" />Special Importer
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Special Importer</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
              Imports this workbook format into <strong>{scheduleName}</strong> by reading <strong>Rates by Area Tier</strong> and <strong>Zip Code to Area</strong>.
            </div>
            <button onClick={() => inputRef.current?.click()} className="w-full rounded-lg border-2 border-dashed border-border p-6 text-center hover:border-primary/40 transition-colors">
              <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">{file ? file.name : "Choose Excel workbook"}</p>
              <p className="text-xs text-muted-foreground mt-1">Accepted: .xlsx</p>
            </button>
            <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => { setFile(e.target.files?.[0] || null); setResult(null); }} />
            {result && (
              <div className="rounded-lg border p-3 text-xs space-y-1">
                <p><strong>Rate rows:</strong> {result.imported_rate_rows}</p>
                <p><strong>ZIP mappings:</strong> {result.imported_zip_rows}</p>
                <p><strong>Skipped duplicates:</strong> {result.skipped_duplicates}</p>
                <p><strong>Errors:</strong> {result.error_rows}</p>
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={handleImport} disabled={!file || importing} className="flex-1 gap-1.5">
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {importing ? "Importing..." : "Run Import"}
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}