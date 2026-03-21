import React, { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle2, AlertCircle, ArrowRight, RefreshCw, AlertTriangle } from "lucide-react";

// ─── Field definitions ───────────────────────────────────────────────────────
const CENSUS_FIELDS = [
  { key: "first_name",        label: "First Name",        required: true },
  { key: "last_name",         label: "Last Name",         required: true },
  { key: "date_of_birth",     label: "Date of Birth",     required: false },
  { key: "gender",            label: "Gender",            required: false },
  { key: "email",             label: "Email",             required: false },
  { key: "phone",             label: "Phone",             required: false },
  { key: "employee_id",       label: "Employee ID",       required: false },
  { key: "ssn_last4",         label: "SSN Last 4",        required: false },
  { key: "hire_date",         label: "Hire Date",         required: false },
  { key: "employment_status", label: "Emp. Status",       required: false },
  { key: "employment_type",   label: "Emp. Type",         required: false },
  { key: "hours_per_week",    label: "Hours/Week",        required: false },
  { key: "annual_salary",     label: "Annual Salary",     required: false },
  { key: "job_title",         label: "Job Title",         required: false },
  { key: "department",        label: "Department",        required: false },
  { key: "address",           label: "Address",           required: false },
  { key: "city",              label: "City",              required: false },
  { key: "state",             label: "State",             required: false },
  { key: "zip",               label: "Zip Code",          required: false },
  { key: "coverage_tier",     label: "Coverage Tier",     required: false },
  { key: "dependent_count",   label: "Dependent Count",   required: false },
  { key: "class_code",        label: "Class Code",        required: false },
];

// ─── Auto-map heuristics ─────────────────────────────────────────────────────
const AUTOMAP_HINTS = {
  first_name:        ["first_name","first name","firstname","fname","given name","given_name"],
  last_name:         ["last_name","last name","lastname","lname","surname","family name"],
  date_of_birth:     ["date_of_birth","dob","birth date","birthdate","birth_date","date of birth"],
  gender:            ["gender","sex"],
  email:             ["email","email address","e-mail","work email"],
  phone:             ["phone","phone number","mobile","cell","telephone"],
  employee_id:       ["employee_id","emp id","emp_id","employee id","id","staff id"],
  ssn_last4:         ["ssn","ssn4","ssn_last4","last 4","last4","social security"],
  hire_date:         ["hire_date","hire date","start date","start_date","date hired"],
  employment_status: ["employment_status","emp status","status","active"],
  employment_type:   ["employment_type","emp type","type","full time","part time"],
  hours_per_week:    ["hours","hours_per_week","hours per week","weekly hours"],
  annual_salary:     ["salary","annual_salary","annual salary","compensation","wage"],
  job_title:         ["job_title","title","position","job title","role"],
  department:        ["department","dept","division","team"],
  address:           ["address","street","address1","street address"],
  city:              ["city","town"],
  state:             ["state","st","province"],
  zip:               ["zip","zip_code","postal","postal_code","zipcode"],
  coverage_tier:     ["coverage_tier","coverage","tier","plan tier","coverage type"],
  dependent_count:   ["dependents","dependent_count","dep count","# dependents"],
  class_code:        ["class","class_code","employee class","tier","grade"],
};

function autoMap(headers) {
  const mapping = {};
  headers.forEach(h => {
    const normalized = h.toLowerCase().replace(/[_\s-]+/g, " ").trim();
    for (const [field, hints] of Object.entries(AUTOMAP_HINTS)) {
      if (hints.some(hint => hint.replace(/[_\s-]+/g, " ").trim() === normalized)) {
        if (!mapping[field]) mapping[field] = h;
        break;
      }
    }
  });
  return mapping;
}

// ─── CSV Parser ───────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map(h => h.replace(/^["']|["']$/g, "").trim());
  const rows = lines.slice(1).map(line => {
    const vals = line.split(",").map(v => v.replace(/^["']|["']$/g, "").trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
    return obj;
  }).filter(r => Object.values(r).some(v => v));
  return { headers, rows };
}

// ─── Validation ───────────────────────────────────────────────────────────────
function validateRow(row, mapping) {
  const issues = [];
  const get = (field) => row[mapping[field]] || "";

  if (!get("first_name")) issues.push({ field: "first_name", type: "error", message: "Missing first name" });
  if (!get("last_name"))  issues.push({ field: "last_name",  type: "error", message: "Missing last name" });

  const dob = get("date_of_birth");
  if (dob && !/^\d{4}-\d{2}-\d{2}$/.test(dob) && !/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(dob)) {
    issues.push({ field: "date_of_birth", type: "warning", message: "Unrecognized date format" });
  }

  const email = get("email");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    issues.push({ field: "email", type: "warning", message: "Invalid email format" });
  }

  const salary = get("annual_salary");
  if (salary && isNaN(parseFloat(salary))) {
    issues.push({ field: "annual_salary", type: "warning", message: "Salary is not a number" });
  }

  return issues;
}

function transformRow(row, mapping) {
  const get = (field) => row[mapping[field]] || "";
  const numFields = ["hours_per_week","annual_salary","dependent_count"];

  const obj = { validation_status: "pending", is_eligible: true };
  CENSUS_FIELDS.forEach(({ key }) => {
    if (!mapping[key]) return;
    const val = get(key);
    if (!val) return;
    if (numFields.includes(key)) obj[key] = parseFloat(val.replace(/[$,]/g, "")) || undefined;
    else obj[key] = val;
  });

  // Normalize gender
  if (obj.gender) {
    const g = obj.gender.toLowerCase();
    if (g.startsWith("m")) obj.gender = "male";
    else if (g.startsWith("f")) obj.gender = "female";
    else obj.gender = "other";
  }

  // Normalize employment_status
  if (obj.employment_status) {
    const s = obj.employment_status.toLowerCase();
    if (s.includes("term")) obj.employment_status = "terminated";
    else if (s.includes("leave")) obj.employment_status = "leave";
    else obj.employment_status = "active";
  }

  // Normalize employment_type
  if (obj.employment_type) {
    const t = obj.employment_type.toLowerCase();
    if (t.includes("part")) obj.employment_type = "part_time";
    else if (t.includes("contract")) obj.employment_type = "contractor";
    else obj.employment_type = "full_time";
  }

  // Normalize coverage_tier
  if (obj.coverage_tier) {
    const t = obj.coverage_tier.toLowerCase();
    if (t.includes("family") || t.includes("fam")) obj.coverage_tier = "family";
    else if (t.includes("spouse") || t.includes("ee+s")) obj.coverage_tier = "employee_spouse";
    else if (t.includes("child") || t.includes("ee+c")) obj.coverage_tier = "employee_children";
    else obj.coverage_tier = "employee_only";
  }

  return obj;
}

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
    let errors = 0, warnings = 0;
    rows.forEach(row => {
      const issues = validateRow(row, mapping);
      issues.forEach(i => { if (i.type === "error") errors++; else warnings++; });
    });
    setValidationSummary({ errors, warnings, total: rows.length });
    setStep("validate");
  };

  const handleImport = async () => {
    setImporting(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const version = await base44.entities.CensusVersion.create({
      case_id: caseId,
      version_number: (currentVersionCount || 0) + 1,
      file_url,
      file_name: file.name,
      status: "validating",
      total_employees: rows.length,
      validation_errors: validationSummary?.errors || 0,
      validation_warnings: validationSummary?.warnings || 0,
      notes,
    });

    const members = rows.map(row => ({
      ...transformRow(row, mapping),
      census_version_id: version.id,
      case_id: caseId,
      validation_issues: validateRow(row, mapping),
      validation_status: validateRow(row, mapping).some(i => i.type === "error") ? "has_errors"
        : validateRow(row, mapping).some(i => i.type === "warning") ? "has_warnings" : "valid",
    }));

    // Bulk create in batches of 50
    for (let i = 0; i < members.length; i += 50) {
      await base44.entities.CensusMember.bulkCreate(members.slice(i, i + 50));
    }

    const finalStatus = (validationSummary?.errors || 0) > 0 ? "has_issues" : "validated";
    await base44.entities.CensusVersion.update(version.id, {
      status: finalStatus,
      eligible_employees: members.filter(m => m.is_eligible).length,
    });
    await base44.entities.BenefitCase.update(caseId, {
      census_status: finalStatus === "validated" ? "validated" : "issues_found",
      stage: "census_in_progress",
    });

    queryClient.invalidateQueries({ queryKey: ["census-versions", caseId] });
    queryClient.invalidateQueries({ queryKey: ["census-members"] });
    queryClient.invalidateQueries({ queryKey: ["case", caseId] });
    setImporting(false);
    setStep("done");
  };

  const handleClose = () => {
    setStep("upload"); setFile(null); setNotes(""); setHeaders([]); setRows([]);
    setMapping({}); setValidationSummary(null); setImporting(false);
    onClose();
  };

  const mappedRequired = CENSUS_FIELDS.filter(f => f.required && !mapping[f.key]);
  const canProceedFromMapping = mappedRequired.length === 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Census File</DialogTitle>
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
              <p className="text-sm font-medium text-muted-foreground">Click to select a census file</p>
              <p className="text-xs text-muted-foreground mt-1">CSV supported — columns will be auto-mapped</p>
              <input type="file" accept=".csv" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </label>
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
          <div className="space-y-4 py-2">
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