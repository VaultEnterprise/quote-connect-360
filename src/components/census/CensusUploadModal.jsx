import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, CheckCircle2 } from "lucide-react";

export default function CensusUploadModal({ caseId, currentVersionCount, open, onClose }) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.CensusVersion.create({
      case_id: caseId,
      version_number: (currentVersionCount || 0) + 1,
      file_url,
      file_name: file.name,
      status: "uploaded",
      notes,
    });
    await base44.entities.BenefitCase.update(caseId, { census_status: "uploaded", stage: "census_in_progress" });
    queryClient.invalidateQueries({ queryKey: ["census-versions", caseId] });
    queryClient.invalidateQueries({ queryKey: ["case", caseId] });
    setUploading(false);
    setUploaded(true);
  };

  const handleClose = () => {
    setFile(null);
    setNotes("");
    setUploaded(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Census File</DialogTitle>
        </DialogHeader>
        {uploaded ? (
          <div className="py-8 flex flex-col items-center gap-3">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
            <p className="text-sm font-medium">Census uploaded successfully</p>
            <p className="text-xs text-muted-foreground">Version {(currentVersionCount || 0) + 1} created</p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div>
              <Label>Census File (CSV, XLSX)</Label>
              <label className="mt-1.5 flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 cursor-pointer hover:bg-muted/50 transition-colors">
                {file ? (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="font-medium">{file.name}</span>
                    <span className="text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Click to select a file</p>
                    <p className="text-xs text-muted-foreground mt-1">CSV, XLSX supported</p>
                  </>
                )}
                <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
              </label>
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="mt-1.5" placeholder="Any notes about this census version..." />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>{uploaded ? "Close" : "Cancel"}</Button>
          {!uploaded && (
            <Button onClick={handleUpload} disabled={!file || uploading}>
              {uploading ? "Uploading..." : "Upload Census"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}