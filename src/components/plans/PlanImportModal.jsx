import React, { useState, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Upload, Download, CheckCircle2, AlertTriangle, RefreshCw,
  ArrowRight, ArrowLeft, FileText, X, AlertCircle, Info,
  ChevronDown, ChevronUp, Eye, EyeOff
} from "lucide-react";

// ─── Field definitions ────────────────────────────────────────────────────────
const PLAN_FIELDS = [
  { key: "plan_type",             label: "Plan Type",           required: true,  type: "enum",   values: ["medical","dental","vision","life","std","ltd","voluntary"] },
  { key: "carrier",               label: "Carrier",             required: true,  type: "string" },
  { key: "plan_name",             label: "Plan Name",           required: true,  type: "string" },
  { key: "plan_code",             label: "Plan Code",           required: false, type: "string" },
  { key: "network_type",          label: "Network Type",        required: false, type: "enum",   values: ["HMO","PPO","EPO","HDHP","POS","indemnity","other"] },
  { key: "state",                 label: "State",               required: false, type: "string" },
  { key: "effective_date",        label: "Effective Date",      required: false, type: "date" },
  { key: "deductible_individual", label: "Deductible (Ind)",    required: false, type: "number" },
  { key: "deductible_family",     label: "Deductible (Family)", required: false, type: "number" },
  { key: "oop_max_individual",    label: "OOP Max (Ind)",       required: false, type: "number" },
  { key: "oop_max_family",        label: "OOP Max (Family)",    required: false, type: "number" },
  { key: "copay_pcp",             label: "PCP Copay",           required: false, type: "number" },
  { key: "copay_specialist",      label: "Specialist Copay",    required: false, type: "number" },
  { key: "copay_er",              label: "ER Copay",            required: false, type: "number" },
  { key: "coinsurance",           label: "Coinsurance %",       required: false, type: "number" },
  { key: "rx_tier1",              label: "Rx Tier 1",           required: false, type: "number" },
  { key: "rx_tier2",              label: "Rx Tier 2",           required: false, type: "number" },
  { key: "rx_tier3",              label: "Rx Tier 3",           required: false, type: "number" },
  { key: "rx_tier4",              label: "Rx Tier 4",           required: false, type: "number" },
  { key: "hsa_eligible",          label: "HSA Eligible",        required: false, type: "boolean" },
  { key: "notes",                 label: "Notes",               required: false, type: "string" },
];

const AUTOMAP_HINTS = {
  plan_type:             ["plan_type","plan type","type","benefit type","benefit_type","line of coverage","line"],
  carrier:               ["carrier","insurance company","insurer","company","payer","ins company"],
  plan_name:             ["plan_name","plan name","name","plan","benefit plan","plan description"],
  plan_code:             ["plan_code","plan code","code","plan id","id","product code","code id"],
  network_type:          ["network_type","network","network type","plan design","design"],
  state:                 ["state","st","location","situs state"],
  effective_date:        ["effective_date","effective date","start date","date","eff date"],
  deductible_individual: ["deductible_individual","deductible (ind)","ind deductible","individual deductible","ded ind","single ded","ded ee"],
  deductible_family:     ["deductible_family","family deductible","deductible (family)","ded fam","fam deductible","family ded"],
  oop_max_individual:    ["oop_max_individual","oop individual","individual oop","oop ind","out of pocket individual","moop ind","oop ee"],
  oop_max_family:        ["oop_max_family","family oop","oop family","out of pocket family","moop fam","oop fam"],
  copay_pcp:             ["copay_pcp","pcp copay","primary care","primary copay","pcp","office visit","pcp visit"],
  copay_specialist:      ["copay_specialist","specialist copay","specialist","spec copay","spc copay"],
  copay_er:              ["copay_er","er copay","emergency room","emergency","er visit","emergency copay"],
  coinsurance:           ["coinsurance","co-insurance","coins","plan pays","coin","coinsurance pct"],
  rx_tier1:              ["rx_tier1","rx tier 1","tier 1","generic","tier1","rx1","generic rx"],
  rx_tier2:              ["rx_tier2","rx tier 2","tier 2","preferred brand","tier2","rx2"],
  rx_tier3:              ["rx_tier3","rx tier 3","tier 3","non-preferred","tier3","rx3","non preferred"],
  rx_tier4:              ["rx_tier4","rx tier 4","tier 4","specialty","tier4","rx4","specialty rx"],
  hsa_eligible:          ["hsa_eligible","hsa","hsa eligible","hsa eligible?","high deductible","hsa qualified"],
  notes:                 ["notes","note","comments","comment","description","additional info","remarks"],
};

function autoMap(headers) {
  const mapping = {};
  headers.forEach(h => {
    const normalized = h.toLowerCase().replace(/[_\-]+/g, " ").trim();
    for (const [field, hints] of Object.entries(AUTOMAP_HINTS)) {
      if (hints.some(hint => hint.replace(/[_\-]+/g, " ").trim() === normalized)) {
        if (!mapping[field]) mapping[field] = h;
        break;
      }
    }
  });
  return mapping;
}

// ─── CSV Parser (handles quoted fields) ───────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };

  const parseLine = (line) => {
    const result = [];
    let cur = "", inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"' && !inQuote) { inQuote = true; continue; }
      if (c === '"' && inQuote && line[i+1] === '"') { cur += '"'; i++; continue; }
      if (c === '"' && inQuote) { inQuote = false; continue; }
      if (c === ',' && !inQuote) { result.push(cur.trim()); cur = ""; continue; }
      cur += c;
    }
    result.push(cur.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(line => {
    const vals = parseLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
    return obj;
  }).filter(r => Object.values(r).some(v => v));
  return { headers, rows };
}

// ─── Row validation & transform ───────────────────────────────────────────────
function transformAndValidate(row, mapping, rowIndex) {
  const get = (field) => (row[mapping[field]] ?? "").toString().trim();
  const errors = [];
  const warnings = [];
  const obj = { status: "active" };

  PLAN_FIELDS.forEach(({ key, required, type, values }) => {
    if (!mapping[key]) {
      if (required) errors.push(`"${key}" is required but not mapped`);
      return;
    }
    const val = get(key);
    if (!val) {
      if (required) errors.push(`"${key}" is empty`);
      return;
    }
    if (type === "number") {
      const n = parseFloat(val.replace(/[$,\s]/g, ""));
      if (isNaN(n)) { warnings.push(`"${key}" value "${val}" is not a valid number, skipped`); return; }
      if (n < 0) warnings.push(`"${key}" is negative (${n})`);
      obj[key] = n;
    } else if (type === "boolean") {
      obj[key] = ["true","yes","1","y","x"].includes(val.toLowerCase());
    } else if (type === "date") {
      const d = new Date(val);
      if (isNaN(d.getTime())) { warnings.push(`"${key}" date "${val}" is invalid, skipped`); return; }
      obj[key] = val;
    } else if (type === "enum") {
      if (key === "plan_type") {
        const t = val.toLowerCase();
        const found = values.find(v => t === v || t.includes(v));
        if (!found) { warnings.push(`"${key}" value "${val}" not recognized, defaulting to "medical"`); obj[key] = "medical"; }
        else obj[key] = found;
      } else if (key === "network_type") {
        const n = val.toUpperCase();
        const found = values.find(v => v.toUpperCase() === n || n.includes(v.toUpperCase()));
        obj[key] = found || "other";
      } else {
        obj[key] = val;
      }
    } else {
      obj[key] = val;
    }
  });

  // Cross-field logical checks
  if (obj.deductible_individual && obj.deductible_family && obj.deductible_individual > obj.deductible_family)
    warnings.push("Individual deductible exceeds family deductible");
  if (obj.oop_max_individual && obj.deductible_individual && obj.oop_max_individual < obj.deductible_individual)
    warnings.push("OOP max is less than deductible");
  if (obj.coinsurance && (obj.coinsurance < 1 || obj.coinsurance > 100))
    warnings.push(`Coinsurance ${obj.coinsurance} looks unusual (expected 1-100)`);

  return { record: obj, errors, warnings, rowIndex, rowData: row };
}

// ─── Templates ────────────────────────────────────────────────────────────────
const MEDICAL_TEMPLATE = `plan_type,carrier,plan_name,plan_code,network_type,state,effective_date,deductible_individual,deductible_family,oop_max_individual,oop_max_family,copay_pcp,copay_specialist,copay_er,coinsurance,rx_tier1,rx_tier2,rx_tier3,rx_tier4,hsa_eligible,notes
medical,Aetna,Gold PPO 1000,MED-G-1000,PPO,CA,2026-01-01,1000,2000,5000,10000,25,50,250,80,10,35,65,150,false,Standard Gold PPO plan
medical,Aetna,Silver HDHP 2500,MED-S-2500,HDHP,CA,2026-01-01,2500,5000,7000,14000,0,0,250,80,10,35,65,150,true,HSA-qualified HDHP
medical,Cigna,PPO 500 Copay,CIG-P-500,PPO,TX,2026-01-01,500,1500,3000,6000,20,40,200,80,10,30,60,120,false,
medical,UnitedHealthcare,Bronze HDHP 3000,UHC-B-3000,HDHP,NY,2026-01-01,3000,6000,8000,16000,0,0,500,70,15,40,75,200,true,High deductible option`;

const ANCILLARY_TEMPLATE = `plan_type,carrier,plan_name,plan_code,state,effective_date,deductible_individual,deductible_family,oop_max_individual,coinsurance,notes
dental,Cigna,Basic Dental PPO,DEN-B-100,,2026-01-01,50,150,1000,80,Basic preventive + basic restorative
dental,Delta Dental,Premier Dental,DEN-P-200,,2026-01-01,0,0,2000,90,Enhanced dental with ortho
vision,VSP,Core Vision,VIS-C,,2026-01-01,0,0,,,Exam + $150 frames allowance
vision,EyeMed,Enhanced Vision,VIS-E,,2026-01-01,0,0,,,Enhanced frames and contacts
life,MetLife,Basic Life 1x,LIFE-B,,2026-01-01,,,,, 1x salary group term life
std,Unum,STD 60pct 90day,STD-60,,2026-01-01,,,,60,60% of salary after 14-day EP
ltd,Unum,LTD 60pct,LTD-60,,2026-01-01,,,,60,60% of salary long-term disability`;

const STEPS = ["upload", "mapping", "validate", "import", "done"];
const STEP_LABELS = ["Upload", "Map Fields", "Validate", "Import", "Done"];
const BATCH_SIZE = 25;

export default function PlanImportModal({ open, onClose }) {
  const queryClient = useQueryClient();
  const dropRef = useRef(null);

  const [step, setStep] = useState("upload");
  const [importMode, setImportMode] = useState("medical"); // medical | ancillary | mixed
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [validated, setValidated] = useState([]); // [{record, errors, warnings, rowIndex}]
  const [showErrors, setShowErrors] = useState(false);
  const [showWarnings, setShowWarnings] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Import progress
  const [progress, setProgress] = useState(0);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState({ success: 0, failed: 0, errors: [] });

  const reset = () => {
    setStep("upload"); setFile(null); setHeaders([]); setRows([]);
    setMapping({}); setValidated([]); setProgress(0); setImporting(false);
    setImportResults({ success: 0, failed: 0, errors: [] });
    setShowErrors(false); setShowWarnings(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const processFile = (f) => {
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const { headers: h, rows: r } = parseCSV(ev.target.result);
      setHeaders(h);
      setRows(r);
      const mapped = autoMap(h);
      setMapping(mapped);
      setStep("mapping");
    };
    reader.readAsText(f);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.name.endsWith(".csv")) processFile(f);
  }, []);

  const handleValidate = () => {
    const results = rows.map((row, i) => transformAndValidate(row, mapping, i + 2)); // +2 for header row
    setValidated(results);
    setStep("validate");
  };

  const validRows   = validated.filter(v => v.errors.length === 0);
  const errorRows   = validated.filter(v => v.errors.length > 0);
  const warnRows    = validated.filter(v => v.errors.length === 0 && v.warnings.length > 0);

  const handleImport = async () => {
    setImporting(true);
    setStep("import");
    const toImport = validRows.map(v => v.record);
    let success = 0, failed = 0;
    const errs = [];

    for (let i = 0; i < toImport.length; i += BATCH_SIZE) {
      const batch = toImport.slice(i, i + BATCH_SIZE);
      try {
        await base44.entities.BenefitPlan.bulkCreate(batch);
        success += batch.length;
      } catch (err) {
        // Retry individually on batch failure
        for (const record of batch) {
          try {
            await base44.entities.BenefitPlan.create(record);
            success++;
          } catch (e2) {
            failed++;
            errs.push(`Row: ${record.plan_name || "unknown"} — ${e2.message || "Unknown error"}`);
          }
        }
      }
      setProgress(Math.round(((i + BATCH_SIZE) / toImport.length) * 100));
    }

    queryClient.invalidateQueries({ queryKey: ["benefit-plans"] });
    setImportResults({ success, failed, errors: errs });
    setProgress(100);
    setImporting(false);
    setStep("done");
  };

  const downloadTemplate = (type) => {
    const content = type === "ancillary" ? ANCILLARY_TEMPLATE : MEDICAL_TEMPLATE;
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${type}_plan_import_template.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadErrorReport = () => {
    if (!errorRows.length) return;
    const lines = ["Row,Plan Name,Carrier,Errors,Warnings"];
    errorRows.forEach(v => {
      const name = v.rowData[mapping["plan_name"]] || "";
      const carrier = v.rowData[mapping["carrier"]] || "";
      lines.push(`${v.rowIndex},"${name}","${carrier}","${v.errors.join("; ")}","${v.warnings.join("; ")}"`);
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "import_errors.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const mappedRequired = PLAN_FIELDS.filter(f => f.required && !mapping[f.key]);
  const stepIndex = STEPS.indexOf(step);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Import Plans from CSV</DialogTitle>

          {/* Step indicator */}
          <div className="flex items-center pt-3 pb-1">
            {STEP_LABELS.map((label, i) => {
              const active = stepIndex === i;
              const done = stepIndex > i;
              return (
                <React.Fragment key={i}>
                  <div className={`flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${active ? "text-primary" : done ? "text-emerald-600" : "text-muted-foreground"}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-colors
                      ${active ? "border-primary bg-primary text-white"
                        : done ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-muted-foreground/30 text-muted-foreground"}`}>
                      {done ? "✓" : i + 1}
                    </div>
                    <span className="hidden sm:inline">{label}</span>
                  </div>
                  {i < STEP_LABELS.length - 1 && (
                    <div className={`flex-1 mx-2 h-0.5 rounded transition-colors ${stepIndex > i ? "bg-emerald-400" : "bg-border"}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </DialogHeader>

        {/* ── Step 1: Upload ── */}
        {step === "upload" && (
          <div className="space-y-5 py-2">
            {/* Import mode selector */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "medical", label: "Medical Plans", desc: "PPO, HMO, HDHP, EPO" },
                { key: "ancillary", label: "Ancillary Plans", desc: "Dental, Vision, Life, STD, LTD" },
                { key: "mixed", label: "Mixed / Both", desc: "Any combination" },
              ].map(({ key, label, desc }) => (
                <button
                  key={key}
                  onClick={() => setImportMode(key)}
                  className={`rounded-lg border-2 p-3 text-left transition-all ${
                    importMode === key ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"
                  }`}
                >
                  <p className={`text-sm font-semibold ${importMode === key ? "text-primary" : ""}`}>{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </button>
              ))}
            </div>

            {/* Template downloads */}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => downloadTemplate("medical")}>
                <Download className="w-3.5 h-3.5 mr-1.5" /> Medical Template
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadTemplate("ancillary")}>
                <Download className="w-3.5 h-3.5 mr-1.5" /> Ancillary Template
              </Button>
            </div>

            {/* Drop zone */}
            <label
              ref={dropRef}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-12 cursor-pointer transition-all
                ${isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "hover:bg-muted/40 hover:border-muted-foreground/40"}`}
            >
              <Upload className={`w-10 h-10 mb-3 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
              <p className="text-sm font-semibold text-foreground">Drop your CSV here, or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">Supports any column order — fields are auto-mapped</p>
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={e => e.target.files?.[0] && processFile(e.target.files[0])} />
            </label>

            {/* Field reference */}
            <details className="border rounded-lg overflow-hidden">
              <summary className="px-3 py-2 text-xs font-semibold text-muted-foreground cursor-pointer select-none flex items-center gap-1.5 bg-muted/30">
                <Info className="w-3.5 h-3.5" /> Supported Fields Reference
              </summary>
              <div className="p-3 grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1">
                {PLAN_FIELDS.map(f => (
                  <div key={f.key} className="flex items-center gap-1.5 text-xs py-0.5">
                    {f.required && <span className="text-destructive font-bold">*</span>}
                    <code className="bg-muted px-1 py-0.5 rounded text-[10px]">{f.key}</code>
                    <span className="text-muted-foreground">{f.label}</span>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}

        {/* ── Step 2: Field Mapping ── */}
        {step === "mapping" && (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm"><span className="font-semibold">{rows.length}</span> rows detected in <span className="font-semibold">{file?.name}</span></span>
              </div>
              <Button variant="outline" size="sm" onClick={() => setMapping(autoMap(headers))}>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Re-automap
              </Button>
            </div>

            {mappedRequired.length > 0 && (
              <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Required fields not mapped:</p>
                  <p>{mappedRequired.map(f => f.label).join(", ")}</p>
                </div>
              </div>
            )}

            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-3 py-2 text-xs font-semibold text-muted-foreground grid grid-cols-5 gap-3">
                <span className="col-span-2">QC360 Field</span>
                <span className="col-span-2">Your CSV Column</span>
                <span>Sample Value</span>
              </div>
              <div className="divide-y max-h-80 overflow-y-auto">
                {PLAN_FIELDS.map(({ key, label, required }) => {
                  const sampleVal = mapping[key] && rows[0] ? rows[0][mapping[key]] : null;
                  return (
                    <div key={key} className={`px-3 py-2 grid grid-cols-5 gap-3 items-center ${required && !mapping[key] ? "bg-red-50/50" : ""}`}>
                      <div className="col-span-2 text-sm flex items-center gap-1.5">
                        {required
                          ? <span className="text-destructive font-bold text-xs">REQ</span>
                          : <span className="text-muted-foreground text-xs">OPT</span>}
                        <span className={`font-medium ${!mapping[key] && required ? "text-destructive" : ""}`}>{label}</span>
                        {mapping[key] && <Badge variant="secondary" className="text-[9px] py-0 px-1.5">auto</Badge>}
                      </div>
                      <div className="col-span-2">
                        <Select
                          value={mapping[key] || "__none__"}
                          onValueChange={v => setMapping(m => ({ ...m, [key]: v === "__none__" ? undefined : v }))}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="— skip field —" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">— skip field —</SelectItem>
                            {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {sampleVal || <span className="text-muted-foreground/40 italic">—</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Validate & Review ── */}
        {step === "validate" && (
          <div className="space-y-4 py-2">
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border bg-emerald-50 border-emerald-200 p-3 text-center">
                <p className="text-2xl font-bold text-emerald-700">{validRows.length}</p>
                <p className="text-xs text-emerald-600 mt-0.5">Ready to Import</p>
              </div>
              <div className={`rounded-lg border p-3 text-center ${errorRows.length > 0 ? "bg-red-50 border-red-200" : "bg-muted border-border"}`}>
                <p className={`text-2xl font-bold ${errorRows.length > 0 ? "text-red-700" : "text-muted-foreground"}`}>{errorRows.length}</p>
                <p className={`text-xs mt-0.5 ${errorRows.length > 0 ? "text-red-600" : "text-muted-foreground"}`}>Will Be Skipped</p>
              </div>
              <div className={`rounded-lg border p-3 text-center ${warnRows.length > 0 ? "bg-amber-50 border-amber-200" : "bg-muted border-border"}`}>
                <p className={`text-2xl font-bold ${warnRows.length > 0 ? "text-amber-700" : "text-muted-foreground"}`}>{warnRows.length}</p>
                <p className={`text-xs mt-0.5 ${warnRows.length > 0 ? "text-amber-600" : "text-muted-foreground"}`}>Warnings</p>
              </div>
            </div>

            {/* Valid rows preview */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-3 py-2 text-xs font-semibold text-muted-foreground flex items-center justify-between">
                <span>Valid Plans ({validRows.length})</span>
                {validRows.length > 5 && <span className="text-muted-foreground/60">showing first 5</span>}
              </div>
              <div className="divide-y max-h-48 overflow-y-auto">
                {validRows.length === 0 ? (
                  <div className="px-3 py-4 text-center text-xs text-muted-foreground">No valid rows to import</div>
                ) : validRows.slice(0, 100).map((v, i) => (
                  <div key={i} className="px-3 py-2 grid grid-cols-4 gap-2 text-xs items-center">
                    <span className="font-medium truncate">{v.record.plan_name}</span>
                    <span className="text-muted-foreground truncate">{v.record.carrier}</span>
                    <Badge variant="secondary" className="text-[10px] w-fit capitalize">{v.record.plan_type}</Badge>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">{v.record.network_type || "—"}</span>
                      {v.warnings.length > 0 && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Error rows */}
            {errorRows.length > 0 && (
              <div className="border border-red-200 rounded-lg overflow-hidden">
                <button
                  className="w-full bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 flex items-center justify-between"
                  onClick={() => setShowErrors(!showErrors)}
                >
                  <span className="flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> {errorRows.length} rows with errors (will be skipped)</span>
                  <div className="flex items-center gap-2">
                    <button
                      className="text-[10px] underline text-red-600 hover:text-red-800"
                      onClick={(e) => { e.stopPropagation(); downloadErrorReport(); }}
                    >Download Error Report</button>
                    {showErrors ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </div>
                </button>
                {showErrors && (
                  <div className="divide-y border-t border-red-100 max-h-40 overflow-y-auto">
                    {errorRows.map((v, i) => (
                      <div key={i} className="px-3 py-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-red-700">Row {v.rowIndex}</span>
                          <span className="text-muted-foreground">{v.rowData[mapping["plan_name"]] || "(no name)"}</span>
                        </div>
                        {v.errors.map((e, ei) => <p key={ei} className="text-red-600 mt-0.5 ml-3">• {e}</p>)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Warning rows */}
            {warnRows.length > 0 && (
              <div className="border border-amber-200 rounded-lg overflow-hidden">
                <button
                  className="w-full bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 flex items-center justify-between"
                  onClick={() => setShowWarnings(!showWarnings)}
                >
                  <span className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> {warnRows.length} rows with warnings (will still be imported)</span>
                  {showWarnings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {showWarnings && (
                  <div className="divide-y border-t border-amber-100 max-h-40 overflow-y-auto">
                    {warnRows.map((v, i) => (
                      <div key={i} className="px-3 py-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Row {v.rowIndex}</span>
                          <span className="text-muted-foreground">{v.record.plan_name}</span>
                        </div>
                        {v.warnings.map((w, wi) => <p key={wi} className="text-amber-700 mt-0.5 ml-3">• {w}</p>)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Step 4: Importing in Progress ── */}
        {step === "import" && (
          <div className="py-10 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="w-7 h-7 text-primary animate-pulse" />
            </div>
            <p className="text-base font-semibold">Importing Plans...</p>
            <p className="text-sm text-muted-foreground">Processing {validRows.length} plans in batches of {BATCH_SIZE}</p>
            <div className="w-full max-w-sm space-y-1.5">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">{progress}% complete</p>
            </div>
          </div>
        )}

        {/* ── Step 5: Done ── */}
        {step === "done" && (
          <div className="py-8 flex flex-col items-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${importResults.failed > 0 ? "bg-amber-100" : "bg-emerald-100"}`}>
              <CheckCircle2 className={`w-8 h-8 ${importResults.failed > 0 ? "text-amber-600" : "text-emerald-600"}`} />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">Import Complete</p>
              <p className="text-sm text-muted-foreground mt-1">{importResults.success} plans successfully added to the Plan Library</p>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
              <div className="border rounded-lg p-3 text-center bg-emerald-50 border-emerald-200">
                <p className="text-2xl font-bold text-emerald-700">{importResults.success}</p>
                <p className="text-xs text-emerald-600">Imported</p>
              </div>
              <div className={`border rounded-lg p-3 text-center ${importResults.failed > 0 ? "bg-red-50 border-red-200" : "bg-muted border-border"}`}>
                <p className={`text-2xl font-bold ${importResults.failed > 0 ? "text-red-700" : "text-muted-foreground"}`}>{importResults.failed}</p>
                <p className={`text-xs ${importResults.failed > 0 ? "text-red-600" : "text-muted-foreground"}`}>Failed</p>
              </div>
            </div>
            {importResults.errors.length > 0 && (
              <details className="w-full border border-red-200 rounded-lg overflow-hidden">
                <summary className="px-3 py-2 text-xs font-semibold text-red-700 bg-red-50 cursor-pointer">
                  {importResults.errors.length} import errors (click to expand)
                </summary>
                <div className="p-3 max-h-32 overflow-y-auto">
                  {importResults.errors.map((e, i) => <p key={i} className="text-xs text-red-600 mb-1">• {e}</p>)}
                </div>
              </details>
            )}
          </div>
        )}

        <DialogFooter className="border-t pt-3 gap-2">
          <Button variant="outline" onClick={handleClose}>{step === "done" ? "Close" : "Cancel"}</Button>

          {step === "mapping" && (
            <>
              <Button variant="outline" onClick={() => { setStep("upload"); }}>
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
              </Button>
              <Button onClick={handleValidate} disabled={mappedRequired.length > 0}>
                Validate {rows.length} Rows <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </>
          )}

          {step === "validate" && (
            <>
              <Button variant="outline" onClick={() => setStep("mapping")}>
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={validRows.length === 0}
                className="min-w-[160px]"
              >
                Import {validRows.length} Plans <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}