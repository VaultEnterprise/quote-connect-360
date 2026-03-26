import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, CheckCircle2, AlertCircle, ArrowRight, RefreshCw, AlertTriangle, Download } from "lucide-react";
import CensusQualityDashboard from "./CensusQualityDashboard";
import MappingProfileManager from "./MappingProfileManager";
import DataQualityInsights from "./DataQualityInsights";
import { generateCensusTemplate } from "@/utils/censusHelpers";
import { CENSUS_FIELDS } from "@/contracts/importContracts";
import { CENSUS_UPLOAD_STEPS, useCensusUploadController } from "@/domain/imports/useCensusUploadController";

export default function CensusUploadModal({ caseId, currentVersionCount, open, onClose }) {
  const controller = useCensusUploadController({ caseId, currentVersionCount, onClose });

  const downloadTemplate = () => {
    const csv = generateCensusTemplate();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "census-template.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={controller.handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Census File</DialogTitle>
          <DialogDescription>Upload the file here and let the backend inspect, validate, and import it.</DialogDescription>
          <div className="flex items-center gap-2 pt-2">
            {["Upload", "Map Fields", "Validate", "Done"].map((label, index) => {
              const stepKey = CENSUS_UPLOAD_STEPS[index];
              const active = controller.step === stepKey;
              const done = CENSUS_UPLOAD_STEPS.indexOf(controller.step) > index;
              return (
                <React.Fragment key={stepKey}>
                  <div className={`flex items-center gap-1.5 text-xs font-medium ${active ? "text-primary" : done ? "text-green-600" : "text-muted-foreground"}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${active ? "bg-primary text-white" : done ? "bg-green-500 text-white" : "bg-muted"}`}>{done ? "✓" : index + 1}</div>
                    {label}
                  </div>
                  {index < 3 && <div className="flex-1 h-px bg-border" />}
                </React.Fragment>
              );
            })}
          </div>
        </DialogHeader>

        {controller.step === "upload" && (
          <div className="space-y-4 py-2">
            <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-10 cursor-pointer hover:bg-muted/50 transition-colors">
              <Upload className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Click to select a census file</p>
              <p className="text-xs text-muted-foreground mt-1">CSV supported — inspection, validation, and persistence run in the backend</p>
              <input type="file" accept=".csv" className="hidden" onChange={(event) => event.target.files?.[0] && controller.handleFile(event.target.files[0])} />
            </label>
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="w-full text-xs"><Download className="w-3.5 h-3.5 mr-2" /> Download Template</Button>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea value={controller.notes} onChange={(event) => controller.setNotes(event.target.value)} rows={2} className="mt-1.5" placeholder="Any notes about this census version..." />
            </div>
          </div>
        )}

        {controller.step === "mapping" && (
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">{controller.rowCount} rows</span> detected in <span className="font-medium text-foreground">{controller.file?.name}</span></p>
              <Button variant="outline" size="sm" onClick={controller.reInspect} disabled={!controller.file || controller.loading}><RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${controller.loading ? "animate-spin" : ""}`} /> Re-inspect</Button>
            </div>

            {controller.mappedRequired.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5"><AlertTriangle className="w-4 h-4 shrink-0" /> Required fields not mapped: {controller.mappedRequired.map((field) => field.label).join(", ")}</div>
            )}

            <MappingProfileManager mapping={controller.mapping} headers={controller.headers} onLoadProfile={controller.setMapping} />

            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-3 py-2 text-xs font-semibold text-muted-foreground grid grid-cols-2 gap-4"><span>Field</span><span>Column in Your File</span></div>
              <div className="divide-y max-h-72 overflow-y-auto">
                {CENSUS_FIELDS.map(({ key, label, required }) => (
                  <div key={key} className="px-3 py-2 grid grid-cols-2 gap-4 items-center">
                    <div className="text-sm flex items-center gap-1.5"><span className={required ? "text-destructive" : "hidden"}>*</span><span className={required ? "font-medium" : "text-muted-foreground"}>{label}</span>{controller.mapping[key] && <Badge variant="secondary" className="text-[10px] py-0">mapped</Badge>}</div>
                    <Select value={controller.mapping[key] || "__none__"} onValueChange={(value) => controller.setMapping((current) => ({ ...current, [key]: value === "__none__" ? undefined : value }))}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="— skip —" /></SelectTrigger>
                      <SelectContent><SelectItem value="__none__">— skip —</SelectItem>{controller.headers.map((header) => <SelectItem key={header} value={header}>{header}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-3 py-2 text-xs font-semibold text-muted-foreground">Preview (backend sample)</div>
              <div className="overflow-x-auto max-h-32">
                <table className="w-full text-xs">
                  <thead><tr className="border-b">{CENSUS_FIELDS.filter((field) => controller.mapping[field.key]).map((field) => <th key={field.key} className="px-3 py-1.5 text-left font-medium whitespace-nowrap">{field.label}</th>)}</tr></thead>
                  <tbody>
                    {controller.sampleRows.slice(0, 3).map((row, index) => (
                      <tr key={index} className="border-b last:border-0">{CENSUS_FIELDS.filter((field) => controller.mapping[field.key]).map((field) => <td key={field.key} className="px-3 py-1.5 text-muted-foreground whitespace-nowrap">{row[controller.mapping[field.key]] || "—"}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {controller.step === "validate" && controller.validationSummary && (
          <div className="space-y-4 py-2 max-h-[calc(90vh-250px)] overflow-y-auto">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border p-4 text-center"><p className="text-2xl font-bold">{controller.validationSummary.total}</p><p className="text-xs text-muted-foreground mt-1">Total Rows</p></div>
              <div className={`rounded-xl border p-4 text-center ${controller.validationSummary.errors > 0 ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}><p className={`text-2xl font-bold ${controller.validationSummary.errors > 0 ? "text-red-600" : "text-green-600"}`}>{controller.validationSummary.errors}</p><p className="text-xs text-muted-foreground mt-1">Errors</p></div>
              <div className={`rounded-xl border p-4 text-center ${controller.validationSummary.warnings > 0 ? "border-amber-200 bg-amber-50" : "border-green-200 bg-green-50"}`}><p className={`text-2xl font-bold ${controller.validationSummary.warnings > 0 ? "text-amber-600" : "text-green-600"}`}>{controller.validationSummary.warnings}</p><p className="text-xs text-muted-foreground mt-1">Warnings</p></div>
            </div>

            {controller.validationSummary.errors > 0 ? (
              <div className="flex items-start gap-2 text-sm bg-red-50 border border-red-200 rounded-lg p-3"><AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" /><div><p className="font-medium text-red-700">Errors found</p><p className="text-red-600 text-xs mt-0.5">The backend will block invalid rows and log import exceptions during import.</p></div></div>
            ) : (
              <div className="flex items-center gap-2 text-sm bg-green-50 border border-green-200 rounded-lg p-3"><CheckCircle2 className="w-4 h-4 text-green-600" /><p className="text-green-700 font-medium">Backend validation passed — ready to import.</p></div>
            )}

            <CensusQualityDashboard fieldStats={controller.fieldStats} />
            <DataQualityInsights fieldStats={controller.fieldStats} rows={controller.sampleRows} />

            {controller.duplicates.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-800">Potential duplicates detected</p>
                <div className="mt-2 space-y-1 text-xs text-amber-700">
                  {controller.duplicates.slice(0, 5).map((duplicate, index) => (
                    <p key={index}>Row {duplicate.row + 2} may duplicate row {duplicate.prevRow + 2} ({duplicate.identity})</p>
                  ))}
                </div>
              </div>
            )}

            {controller.transformedPreview.length > 0 && (
              <div className="rounded-xl border p-4">
                <p className="text-sm font-semibold">Canonical preview</p>
                <pre className="mt-2 max-h-56 overflow-auto rounded-lg bg-muted p-3 text-xs">{JSON.stringify(controller.transformedPreview, null, 2)}</pre>
              </div>
            )}
          </div>
        )}

        {controller.step === "done" && (
          <div className="py-10 flex flex-col items-center gap-3"><CheckCircle2 className="w-14 h-14 text-green-500" /><p className="text-lg font-semibold">Census Imported</p><p className="text-sm text-muted-foreground">{controller.rowCount} rows processed through the backend import pipeline.</p></div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={controller.handleClose}>{controller.step === "done" ? "Close" : "Cancel"}</Button>
          {controller.step === "mapping" && <Button onClick={controller.handleValidate} disabled={!controller.canProceedFromMapping || controller.loading}>{controller.loading ? "Validating..." : <>Validate <ArrowRight className="w-4 h-4 ml-1.5" /></>}</Button>}
          {controller.step === "validate" && <Button onClick={controller.handleImport} disabled={controller.loading || controller.validationSummary?.errors > 0}>{controller.loading ? "Importing..." : `Import ${controller.rowCount} Members`}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}