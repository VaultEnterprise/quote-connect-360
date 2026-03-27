import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Download, FileUp, RefreshCw, Upload } from "lucide-react";

const IMPORT_MODES = [
  { value: "validate_only", label: "Validate only" },
  { value: "import_valid_rows_only", label: "Import valid rows only" },
  { value: "import_all_and_flag_errors", label: "Import all rows and flag errors" },
  { value: "block_on_any_error", label: "Block import if any error exists" },
];

export default function CensusImportWorkspace({ caseId, onComplete, onCancel }) {
  const [file, setFile] = useState(null);
  const [importMode, setImportMode] = useState("validate_only");
  const [importSession, setImportSession] = useState(null);
  const [selectedSheetName, setSelectedSheetName] = useState("");
  const [headerRowNumber, setHeaderRowNumber] = useState(1);
  const [mappings, setMappings] = useState([]);
  const [validationResult, setValidationResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [templateName, setTemplateName] = useState("");

  const { data: templates = [] } = useQuery({
    queryKey: ["import-templates", "census"],
    queryFn: () => base44.entities.ImportTemplate.filter({ module_code: "census", page_code: "census_manager" }, "template_name", 100),
    enabled: !!caseId,
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const response = await base44.functions.invoke("censusImportSession", {
        caseId,
        fileUrl: file_url,
        fileName: file.name,
        fileType: file.type,
        selectedSheetName: selectedSheetName || undefined,
        headerRowNumber: headerRowNumber || undefined,
        importMode,
      });
      return response.data;
    },
    onSuccess: (data) => {
      setImportSession(data);
      setSelectedSheetName(data.selected_sheet_name || "");
      setHeaderRowNumber(data.header_row_number || 1);
      setMappings(data.inferred_mappings || []);
      setValidationResult(null);
      setErrorMessage("");
    },
    onError: (error) => setErrorMessage(error?.response?.data?.error || error.message || "Upload failed."),
  });

  const validateMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke("censusImportValidate", {
        importSessionId: importSession.import_session_id,
        mappings,
        previewRows: importSession.preview_rows,
      });
      return response.data;
    },
    onSuccess: (data) => {
      setValidationResult(data);
      setErrorMessage("");
    },
    onError: (error) => {
      const responseData = error?.response?.data;
      if (responseData?.missing_required_fields) {
        setErrorMessage(responseData.missing_required_fields.map((field) => `${field.field_name}: ${field.why_required}`).join(" | "));
      } else {
        setErrorMessage(responseData?.error || error.message || "Validation failed.");
      }
    },
  });

  const commitMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke("censusImportCommit", {
        importSessionId: importSession.import_session_id,
        caseId,
        importMode,
      });
      return response.data;
    },
    onSuccess: (data) => {
      onComplete?.(data.census_version_id, data.message);
    },
    onError: (error) => setErrorMessage(error?.response?.data?.error || error.message || "Commit failed."),
  });

  const saveTemplateMutation = useMutation({
    mutationFn: async () => {
      return base44.entities.ImportTemplate.create({
        template_name: templateName,
        module_code: "census",
        page_code: "census_manager",
        is_global: false,
        source_format_family: importSession?.source_format || "spreadsheet",
        header_row_number: headerRowNumber,
        field_mapping_json: mappings,
        default_required_flags_json: Object.fromEntries(mappings.map((mapping) => [mapping.application_field_code, mapping.is_required_for_run])),
        default_values_json: Object.fromEntries(mappings.map((mapping) => [mapping.application_field_code, mapping.default_value || ""])),
        transform_rules_json: Object.fromEntries(mappings.map((mapping) => [mapping.application_field_code, mapping.transform_rule_code || ""])),
      });
    },
    onSuccess: () => {
      setTemplateName("");
      setErrorMessage("");
    },
    onError: (error) => setErrorMessage(error.message || "Could not save template."),
  });

  const previewHeaders = useMemo(() => importSession?.columns?.map((column) => column.source_column_name) || [], [importSession]);
  const promptMessages = importSession?.prompt_state?.prompt_messages || [];
  const unresolvedRequiredFields = mappings.filter((mapping) => mapping.is_required_for_run && !mapping.source_column_name && !(mapping.default_value || "").trim());
  const canCommit = Boolean(validationResult) && importMode !== "validate_only";
  const unresolvedSourceWarnings = mappings.filter((mapping) => mapping.mapping_confidence < 0.5 && !mapping.source_column_name && !mapping.default_value);

  const updateMapping = (fieldCode, updates) => {
    setMappings((current) => current.map((mapping) => {
      if (mapping.application_field_code !== fieldCode) return mapping;
      const nextSourceColumnName = Object.prototype.hasOwnProperty.call(updates, "source_column_name") ? updates.source_column_name : mapping.source_column_name;
      return {
        ...mapping,
        ...updates,
        source_column_index: nextSourceColumnName ? previewHeaders.indexOf(nextSourceColumnName) : undefined,
        mapping_confidence: nextSourceColumnName ? Math.max(mapping.mapping_confidence || 0, 1) : 0,
      };
    }));
  };

  const applyTemplate = (templateId) => {
    const template = templates.find((item) => item.id === templateId);
    if (!template) return;
    setMappings((template.field_mapping_json || []).map((mapping) => ({
      ...mapping,
      source_column_index: mapping.source_column_name ? previewHeaders.indexOf(mapping.source_column_name) : undefined,
      mapping_confidence: mapping.source_column_name ? Math.max(mapping.mapping_confidence || 0, 1) : 0,
    })));
    if (template.header_row_number) setHeaderRowNumber(template.header_row_number);
  };

  const resetState = () => {
    setFile(null);
    setImportSession(null);
    setSelectedSheetName("");
    setHeaderRowNumber(1);
    setMappings([]);
    setValidationResult(null);
    setErrorMessage("");
    setTemplateName("");
    setImportMode("validate_only");
  };

  const downloadErrorReport = () => {
    if (!validationResult?.rows?.length) return;
    const issueRows = validationResult.rows.flatMap((row) => ([...(row.errors_json || []), ...(row.warnings_json || [])]));
    const header = ["row_number", "field", "code", "message", "severity", "suggested_fix"];
    const lines = [header.join(",")].concat(issueRows.map((issue) => ([
      issue.row_number,
      issue.application_field,
      issue.error_code,
      JSON.stringify(issue.error_message || ""),
      issue.severity,
      JSON.stringify(issue.suggested_fix || "")
    ].join(","))));
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "census-import-errors.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Census Import Workspace</h2>
        <p className="text-sm text-muted-foreground mt-1">Upload, map, validate, and commit census files in a full-page workflow.</p>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {uploadMutation.isPending && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-700 rounded-full animate-spin"></div>
          <span>Uploading and reading your file...</span>
        </div>
      )}

      {!importSession && !uploadMutation.isPending && (
        <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Upload a census file to begin.
        </div>
      )}

      {promptMessages.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 space-y-1">
          {promptMessages.map((message) => (
            <div key={message}>{message}</div>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">File Intake</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-xs text-muted-foreground">Supported formats: .xls, .xlsx, .csv, .tsv, .txt, .xlsm</div>
          <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 cursor-pointer hover:bg-muted/40 transition-colors">
            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
            <span className="text-sm font-medium">Drag and drop or choose a file</span>
            <span className="text-xs text-muted-foreground mt-1">We preserve raw columns and guide you through mapping before import.</span>
            <input type="file" accept=".xls,.xlsx,.csv,.tsv,.txt,.xlsm" className="hidden" onChange={(event) => setFile(event.target.files?.[0] || null)} />
          </label>
          {file && <div className="text-xs text-muted-foreground">Selected: {file.name}</div>}

          <div className="grid md:grid-cols-4 gap-3">
            <div>
              <Label>Import mode</Label>
              <Select value={importMode} onValueChange={setImportMode}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{IMPORT_MODES.map((mode) => <SelectItem key={mode.value} value={mode.value}>{mode.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Saved template</Label>
              <Select onValueChange={applyTemplate}>
                <SelectTrigger><SelectValue placeholder="Select template" /></SelectTrigger>
                <SelectContent>{templates.map((template) => <SelectItem key={template.id} value={template.id}>{template.template_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Header row</Label>
              <Input type="number" value={headerRowNumber} onChange={(event) => setHeaderRowNumber(Number(event.target.value || 1))} />
            </div>
            <div className="flex items-end">
              <Button onClick={() => uploadMutation.mutate()} disabled={!file || uploadMutation.isPending} className="w-full">
                <FileUp className="w-4 h-4 mr-2" /> {uploadMutation.isPending ? "Parsing..." : "Start Import Session"}
              </Button>
            </div>
          </div>

          {importSession?.sheet_names?.length > 1 && (
            <div className="space-y-2">
              <Label>Worksheet</Label>
              <Select value={selectedSheetName} onValueChange={setSelectedSheetName}>
                <SelectTrigger><SelectValue placeholder="Choose worksheet" /></SelectTrigger>
                <SelectContent>{importSession.sheet_names.map((sheet) => <SelectItem key={sheet} value={sheet}>{sheet}</SelectItem>)}</SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => uploadMutation.mutate()} disabled={uploadMutation.isPending}>
                Change sheet
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {importSession && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">File Review</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-5 gap-3 text-sm">
              <div><div className="text-muted-foreground text-xs">Rows detected</div><div className="font-semibold">{importSession.total_rows}</div></div>
              <div><div className="text-muted-foreground text-xs">Columns detected</div><div className="font-semibold">{importSession.total_columns}</div></div>
              <div><div className="text-muted-foreground text-xs">Worksheet</div><div className="font-semibold">{importSession.selected_sheet_name}</div></div>
              <div><div className="text-muted-foreground text-xs">Header row</div><div className="font-semibold">{importSession.header_row_number}</div></div>
              <div><div className="text-muted-foreground text-xs">Header confidence</div><div className="font-semibold">{Math.round((importSession.header_detection_confidence || 0) * 100)}%</div></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Field Mapping</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {unresolvedRequiredFields.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 space-y-1">
                  <div>The following required fields are not yet mapped: {unresolvedRequiredFields.map((field) => field.application_field_label).join(", ")}.</div>
                  <div className="text-red-700">Match each one to a source column, or enter a default value where allowed, before you continue.</div>
                </div>
              )}

              {unresolvedSourceWarnings.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Some fields could not be matched automatically. Please review the unmapped rows before validating.
                </div>
              )}

              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left">Application Field</th>
                      <th className="px-3 py-2 text-left">Code</th>
                      <th className="px-3 py-2 text-left">Source Column</th>
                      <th className="px-3 py-2 text-left">Sample Values</th>
                      <th className="px-3 py-2 text-left">Confidence</th>
                      <th className="px-3 py-2 text-left">Required</th>
                      <th className="px-3 py-2 text-left">Default Value</th>
                      <th className="px-3 py-2 text-left">Transform</th>
                      <th className="px-3 py-2 text-left">Rules</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappings.map((mapping) => {
                      const sourceColumn = importSession.columns?.find((column) => column.source_column_name === mapping.source_column_name);
                      return (
                        <tr key={mapping.application_field_code} className="border-t align-top">
                          <td className="px-3 py-2 font-medium">{mapping.application_field_label}</td>
                          <td className="px-3 py-2 text-muted-foreground">{mapping.application_field_code}</td>
                          <td className="px-3 py-2 min-w-[180px]">
                            <Select value={mapping.source_column_name || "__none__"} onValueChange={(value) => updateMapping(mapping.application_field_code, { source_column_name: value === "__none__" ? "" : value })}>
                              <SelectTrigger><SelectValue placeholder="Unmapped" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">Unmapped</SelectItem>
                                {previewHeaders.map((header) => <SelectItem key={header} value={header}>{header}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground max-w-[220px]">{(sourceColumn?.sample_values_json || []).slice(0, 3).join(", ") || "—"}</td>
                          <td className="px-3 py-2">{Math.round((mapping.mapping_confidence || 0) * 100)}%</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <Checkbox checked={!!mapping.is_required_for_run} disabled={!!mapping.is_hard_required} onCheckedChange={(checked) => updateMapping(mapping.application_field_code, { is_required_for_run: !!checked })} />
                              {mapping.is_hard_required ? <Badge variant="outline">Locked</Badge> : null}
                            </div>
                            {mapping.required_reason && <div className="text-[11px] text-muted-foreground mt-1">{mapping.required_reason}</div>}
                          </td>
                          <td className="px-3 py-2"><Input value={mapping.default_value || ""} onChange={(event) => updateMapping(mapping.application_field_code, { default_value: event.target.value })} /></td>
                          <td className="px-3 py-2"><Input value={mapping.transform_rule_code || ""} onChange={(event) => updateMapping(mapping.application_field_code, { transform_rule_code: event.target.value })} placeholder="Optional" /></td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">{(mapping.validation_rule_set || []).join(", ") || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label>Save current mapping as template</Label>
                  <Input value={templateName} onChange={(event) => setTemplateName(event.target.value)} placeholder="Template name" />
                </div>
                <Button variant="outline" onClick={() => saveTemplateMutation.mutate()} disabled={!templateName || saveTemplateMutation.isPending}>Save Template</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Raw Source Preview</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50"><tr>{previewHeaders.map((header) => <th key={header} className="px-3 py-2 text-left whitespace-nowrap">{header}</th>)}</tr></thead>
                <tbody>
                  {(importSession.preview_rows || []).slice(0, 8).map((row) => (
                    <tr key={row.row_number} className="border-t">
                      {previewHeaders.map((header) => <td key={header} className="px-3 py-2 whitespace-nowrap text-muted-foreground">{row.raw_row_json?.[header] || ""}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {validationResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Validation Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="rounded-lg border p-4"><div className="text-xs text-muted-foreground">Passed</div><div className="text-2xl font-semibold">{validationResult.row_pass_count}</div></div>
                  <div className="rounded-lg border p-4"><div className="text-xs text-muted-foreground">Warnings</div><div className="text-2xl font-semibold">{validationResult.row_warning_count}</div></div>
                  <div className="rounded-lg border p-4"><div className="text-xs text-muted-foreground">Errors</div><div className="text-2xl font-semibold">{validationResult.row_error_count}</div></div>
                </div>
                <div className="rounded-lg border bg-muted/20 px-4 py-3 text-sm space-y-1">
                  <div className="font-medium">{validationResult.prompts?.validation_complete}</div>
                  {validationResult.prompts?.warnings_found && <div>{validationResult.prompts.warnings_found}</div>}
                  {validationResult.prompts?.errors_found && <div>{validationResult.prompts.errors_found}</div>}
                  {validationResult.prompts?.import_ready && <div>{validationResult.prompts.import_ready}</div>}
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={downloadErrorReport}>
                    <Download className="w-4 h-4 mr-2" /> Download error report
                  </Button>
                </div>
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50"><tr><th className="px-3 py-2 text-left">Row</th><th className="px-3 py-2 text-left">Field</th><th className="px-3 py-2 text-left">Code</th><th className="px-3 py-2 text-left">Message</th></tr></thead>
                    <tbody>
                      {(validationResult.top_validation_issues || []).map((issue, index) => (
                        <tr key={`${issue.row_number}-${issue.error_code}-${index}`} className="border-t">
                          <td className="px-3 py-2">{issue.row_number}</td>
                          <td className="px-3 py-2">{issue.application_field}</td>
                          <td className="px-3 py-2">{issue.error_code}</td>
                          <td className="px-3 py-2">{issue.error_message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <div className="flex flex-wrap gap-3 justify-end">
        <Button variant="outline" onClick={resetState}>
          <RefreshCw className="w-4 h-4 mr-2" /> Retry import
        </Button>
        <Button variant="outline" onClick={() => { resetState(); onCancel?.(); }}>Cancel</Button>
        {importSession && <Button variant="outline" onClick={() => validateMutation.mutate()} disabled={validateMutation.isPending}>{validateMutation.isPending ? "Validating..." : "Validate Import"}</Button>}
        {validationResult && validationResult.row_error_count > 0 && <Button variant="outline" onClick={() => setValidationResult(null)}>Return to mapping</Button>}
        {canCommit && <Button onClick={() => commitMutation.mutate()} disabled={commitMutation.isPending || unresolvedRequiredFields.length > 0}>{commitMutation.isPending ? "Importing..." : "Commit Import"}</Button>}
      </div>
    </div>
  );
}