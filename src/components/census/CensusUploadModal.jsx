import React, { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle2, AlertCircle, ArrowRight, RefreshCw, AlertTriangle, Download } from "lucide-react";
import CensusQualityDashboard from "./CensusQualityDashboard";
import DuplicateDetectionPanel from "./DuplicateDetectionPanel";
import ErrorDetailPanel from "./ErrorDetailPanel";
import TransformPreview from "./TransformPreview";
import MappingProfileManager from "./MappingProfileManager";
import DataQualityInsights from "./DataQualityInsights";
import { generateCensusTemplate } from "@/utils/censusHelpers";
import { CENSUS_FIELDS, autoMap, parseCSV, validateRow, transformRow, detectDuplicates, analyzeDataQuality, buildValidationSummary } from "./censusEngine";
import { buildVersionedSnapshotRows, buildVersionSummary } from "./censusSnapshotEngine";

// ─── Steps ────────────────────────────────────────────────────────────────────
const STEPS = ["upload", "mapping", "validate", "done"];

export default function CensusUploadModal({ caseId, currentVersionCount, open, onClose }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState("upload");
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState("");
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [validationSummary, setValidationSummary] = useState(null);
  const [importing, setImporting] = useState(false);
  const [fieldStats, setFieldStats] = useState(null);
  const [duplicates, setDuplicates] = useState([]);
  const [skippedRows, setSkippedRows] = useState(new Set());
  const [showTransformTab, setShowTransformTab] = useState(false);

  const handleFile = (f) => {
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const { headers: h, rows: r } = parseCSV(ev.target.result);
      setHeaders(h);
      setRows(r);
      setMapping(autoMap(h));
      setStep("mapping");
    };
    reader.readAsText(f);
  };

  const handleValidate = () => {
    const summary = buildValidationSummary(rows, mapping);
    const stats = analyzeDataQuality(rows, mapping);
    const dups = detectDuplicates(rows, mapping);

    setFieldStats(stats);
    setDuplicates(dups);
    setValidationSummary(summary);
    setStep("validate");
  };

  const handleImport = async () => {
    setImporting(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const rowsToImport = rows.filter((_, idx) => !skippedRows.has(idx));

    const version = await base44.entities.CensusVersion.create({
      case_id: caseId,
      version_number: (currentVersionCount || 0) + 1,
      file_url,
      file_name: file.name,
      status: "validating",
      total_employees: rowsToImport.length,
      validation_errors: validationSummary?.errors || 0,
      validation_warnings: validationSummary?.warnings || 0,
      notes,
    });

    const members = buildVersionedSnapshotRows(rowsToImport, mapping, caseId, version.id);

    for (let i = 0; i < members.length; i += 50) {
      await base44.entities.CensusMember.bulkCreate(members.slice(i, i + 50));
    }

    const versionSummary = buildVersionSummary({ rows: rowsToImport, mapping, members });
    await base44.entities.CensusVersion.update(version.id, {
      status: versionSummary.status,
      eligible_employees: versionSummary.eligible_count,
      total_dependents: members.reduce((sum, member) => sum + Number(member.dependent_count || 0), 0),
      total_employees: versionSummary.total_rows,
      validation_errors: versionSummary.validation_errors,
      validation_warnings: versionSummary.validation_warnings,
    });

    await base44.entities.BenefitCase.update(caseId, {
      census_status: versionSummary.status === "validated" ? "validated" : "issues_found",
      stage: versionSummary.status === "validated" ? "census_validated" : "census_in_progress",
    });

    await base44.entities.ActivityLog.create({
      case_id: caseId,
      action: "Census snapshot imported",
      detail: `${rowsToImport.length} census records imported as canonical snapshot version ${(currentVersionCount || 0) + 1}`,
      entity_type: "CensusVersion",
      entity_id: version.id,
      new_value: JSON.stringify({
        status: versionSummary.status,
        eligible_employees: versionSummary.eligible_count,
        duplicate_count: versionSummary.duplicate_count,
      }),
    });

    queryClient.invalidateQueries({ queryKey: ["census-all"] });
    queryClient.invalidateQueries({ queryKey: ["census-members"] });
    queryClient.invalidateQueries({ queryKey: ["census-members-page", caseId] });
    queryClient.invalidateQueries({ queryKey: ["case", caseId] });
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
    setHeaders([]);
    setRows([]);
    setMapping({});
    setValidationSummary(null);
    setImporting(false);
    setFieldStats(null);
    setDuplicates([]);
    setSkippedRows(new Set());
    setShowTransformTab(false);
    onClose();
  };

  const mappedRequired = CENSUS_FIELDS.filter(f => f.required && !mapping[f.key]);
  const canProceedFromMapping = mappedRequired.length === 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Census Snapshot</DialogTitle>
          {/* Step indicator */}
          <div className="flex items-center gap-2 pt-2">
            {["Upload", "Map Fields", "Validate", "Done"].map((label, i) => {
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
                  {i < 3 && <div className="flex-1 h-px bg-border" />}
                </React.Fragment>
              );
            })}
          </div>
        </DialogHeader>

        {/* ── Step 1: Upload ── */}
        {step === "upload" && (
          <div className="space-y-4 py-2">
            <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-10 cursor-pointer hover:bg-muted/50 transition-colors">
              <Upload className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Click to select a census snapshot file</p>
              <p className="text-xs text-muted-foreground mt-1">CSV supported — data will be normalized into a new canonical versioned snapshot</p>
              <input type="file" accept=".csv" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </label>
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="w-full text-xs">
              <Download className="w-3.5 h-3.5 mr-2" /> Download Template
            </Button>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="mt-1.5" placeholder="Any notes about this census version..." />
            </div>
          </div>
        )}

        {/* ── Step 2: Field Mapping ── */}
        {step === "mapping" && (
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{rows.length} rows</span> detected in <span className="font-medium text-foreground">{file?.name}</span>
              </p>
              <Button variant="outline" size="sm" onClick={() => setMapping(autoMap(headers))}>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Re-automap
              </Button>
            </div>

            {mappedRequired.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Required fields not mapped: {mappedRequired.map(f => f.label).join(", ")}
              </div>
            )}

            {/* Mapping Profile Manager */}
            <MappingProfileManager mapping={mapping} headers={headers} onLoadProfile={setMapping} />

            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-3 py-2 text-xs font-semibold text-muted-foreground grid grid-cols-2 gap-4">
                <span>Field</span><span>Column in Your File</span>
              </div>
              <div className="divide-y max-h-72 overflow-y-auto">
                {CENSUS_FIELDS.map(({ key, label, required }) => (
                  <div key={key} className="px-3 py-2 grid grid-cols-2 gap-4 items-center">
                    <div className="text-sm flex items-center gap-1.5">
                      {required && <span className="text-destructive">*</span>}
                      <span className={required ? "font-medium" : "text-muted-foreground"}>{label}</span>
                      {mapping[key] && <Badge variant="secondary" className="text-[10px] py-0">auto</Badge>}
                    </div>
                    <Select value={mapping[key] || "__none__"} onValueChange={v => setMapping(m => ({ ...m, [key]: v === "__none__" ? undefined : v }))}>
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="— skip —" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— skip —</SelectItem>
                        {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview first 3 rows */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-3 py-2 text-xs font-semibold text-muted-foreground">Preview (first 3 rows)</div>
              <div className="overflow-x-auto max-h-32">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      {CENSUS_FIELDS.filter(f => mapping[f.key]).map(f => (
                        <th key={f.key} className="px-3 py-1.5 text-left font-medium whitespace-nowrap">{f.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 3).map((row, i) => (
                      <tr key={i} className="border-b last:border-0">
                        {CENSUS_FIELDS.filter(f => mapping[f.key]).map(f => (
                          <td key={f.key} className="px-3 py-1.5 text-muted-foreground whitespace-nowrap">{row[mapping[f.key]] || "—"}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Validate ── */}
        {step === "validate" && validationSummary && (
          <div className="space-y-4 py-2 max-h-[calc(90vh-250px)] overflow-y-auto">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border p-4 text-center">
                <p className="text-2xl font-bold">{validationSummary.total}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Rows</p>
              </div>
              <div className={`rounded-xl border p-4 text-center ${validationSummary.errors > 0 ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}>
                <p className={`text-2xl font-bold ${validationSummary.errors > 0 ? "text-red-600" : "text-green-600"}`}>{validationSummary.errors}</p>
                <p className="text-xs text-muted-foreground mt-1">Errors</p>
              </div>
              <div className={`rounded-xl border p-4 text-center ${validationSummary.warnings > 0 ? "border-amber-200 bg-amber-50" : "border-green-200 bg-green-50"}`}>
                <p className={`text-2xl font-bold ${validationSummary.warnings > 0 ? "text-amber-600" : "text-green-600"}`}>{validationSummary.warnings}</p>
                <p className="text-xs text-muted-foreground mt-1">Warnings</p>
              </div>
            </div>

            {validationSummary.errors > 0 && (
              <div className="flex items-start gap-2 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-red-700">Errors found</p>
                  <p className="text-red-600 text-xs mt-0.5">Members with errors will be imported with <code>has_errors</code> status. You can review and fix them after import.</p>
                </div>
              </div>
            )}

            {validationSummary.errors === 0 && validationSummary.warnings === 0 && (
              <div className="flex items-center gap-2 text-sm bg-green-50 border border-green-200 rounded-lg p-3">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <p className="text-green-700 font-medium">All rows passed validation — ready to import!</p>
              </div>
            )}

            {/* Data Quality Dashboard */}
            <CensusQualityDashboard fieldStats={fieldStats} />

            {/* Data Quality Insights */}
            <DataQualityInsights fieldStats={fieldStats} rows={rows} />

            {/* Duplicate Detection */}
            <DuplicateDetectionPanel duplicates={duplicates} rows={rows} onToggleSkip={setSkippedRows} />

            {/* Error Details */}
            <ErrorDetailPanel rows={rows} mapping={mapping} validateRow={validateRow} transformRow={transformRow} />

            {/* Transform Preview */}
            {showTransformTab && (
              <TransformPreview rows={rows} mapping={mapping} transformRow={transformRow} />
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTransformTab(!showTransformTab)}
              className="w-full text-xs"
            >
              {showTransformTab ? "Hide" : "Show"} Data Transform Preview
            </Button>

            <p className="text-xs text-muted-foreground">
              Fields mapped: {Object.keys(mapping).filter(k => mapping[k]).length} of {CENSUS_FIELDS.length}
            </p>
          </div>
        )}

        {/* ── Step 4: Done ── */}
        {step === "done" && (
          <div className="py-10 flex flex-col items-center gap-3">
            <CheckCircle2 className="w-14 h-14 text-green-500" />
            <p className="text-lg font-semibold">Census Imported!</p>
            <p className="text-sm text-muted-foreground">{rows.length} members created · Version {(currentVersionCount || 0) + 1}</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>{step === "done" ? "Close" : "Cancel"}</Button>
          {step === "mapping" && (
            <Button onClick={handleValidate} disabled={!canProceedFromMapping}>
              Validate <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          )}
          {step === "validate" && (
            <Button onClick={handleImport} disabled={importing}>
              {importing ? "Importing..." : `Import ${rows.length} Members`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}