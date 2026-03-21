import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, AlertTriangle, Play, ShieldCheck } from "lucide-react";

const VALIDATORS = {
  carrier: {
    label: "CarrierPayloadValidator",
    adapter: "carrier_submission_send",
    rules: [
      { field: "benefit_case_id", rule: "required string" },
      { field: "records", rule: "required non-empty array" },
      { field: "metadata", rule: "optional object" },
    ],
    sample: JSON.stringify({ benefit_case_id: "CASE-123", records: [{ employee_external_id: "E1001", coverage_code: "PPO500" }], metadata: { carrier_code: "VAULT" } }, null, 2),
  },
  tpa: {
    label: "TpaPayloadValidator",
    adapter: "tpa_export_send",
    rules: [
      { field: "benefit_case_id", rule: "required string" },
      { field: "records", rule: "required (any)" },
    ],
    sample: JSON.stringify({ benefit_case_id: "CASE-123", records: [{ employee_external_id: "E1001" }] }, null, 2),
  },
  payroll: {
    label: "PayrollPayloadValidator",
    adapter: "payroll_deduction_send",
    rules: [
      { field: "records[*].employee_external_id", rule: "required per row" },
      { field: "records[*].deduction_amount", rule: "required per row" },
    ],
    sample: JSON.stringify({ benefit_case_id: "CASE-123", records: [{ employee_external_id: "E1001", deduction_amount: 245.50 }] }, null, 2),
  },
  billing: {
    label: "BillingPayloadValidator",
    adapter: "billing_setup_send",
    rules: [
      { field: "benefit_case_id", rule: "required string" },
    ],
    sample: JSON.stringify({ benefit_case_id: "CASE-123", records: [], metadata: {} }, null, 2),
  },
  docusign: {
    label: "SignaturePacketValidator",
    adapter: "docusign_send_packet",
    rules: [
      { field: "subject", rule: "required string" },
      { field: "documents", rule: "required non-empty array" },
      { field: "recipients", rule: "required non-empty array" },
    ],
    sample: JSON.stringify({ subject: "Benefits Enrollment Signature", email_blurb: "Please sign.", documents: [{ name: "Form", file_name: "form.pdf", content_base64: "abc123" }], recipients: [{ name: "John Smith", email: "john@example.com", role: "employee" }] }, null, 2),
  },
};

function runValidation(validatorKey, raw) {
  const errors = [];
  const warnings = [];
  let payload;
  try { payload = JSON.parse(raw); } catch (e) { return { valid: false, errors: ["Invalid JSON: " + e.message], warnings: [] }; }

  if (validatorKey === "carrier") {
    if (!payload.benefit_case_id) errors.push("benefit_case_id is required");
    if (!Array.isArray(payload.records) || payload.records.length === 0) errors.push("records must be a non-empty list");
  }
  if (validatorKey === "tpa") {
    if (!payload.benefit_case_id) errors.push("benefit_case_id is required");
    if (!("records" in payload)) errors.push("records is required");
  }
  if (validatorKey === "payroll") {
    (payload.records || []).forEach((row, idx) => {
      if (!row.employee_external_id) errors.push(`records[${idx}].employee_external_id is required`);
      if (row.deduction_amount == null) errors.push(`records[${idx}].deduction_amount is required`);
    });
    if (!payload.records || payload.records.length === 0) warnings.push("records array is empty — no deductions will be exported");
  }
  if (validatorKey === "billing") {
    if (!payload.benefit_case_id) errors.push("benefit_case_id is required");
  }
  if (validatorKey === "docusign") {
    if (!payload.subject) errors.push("subject is required");
    if (!payload.documents || payload.documents.length === 0) errors.push("documents are required");
    if (!payload.recipients || payload.recipients.length === 0) errors.push("recipients are required");
  }
  return { valid: errors.length === 0, errors, warnings };
}

const RECENT_RUNS = [
  { validator: "CarrierPayloadValidator", ts: "2026-03-21 09:14:02", valid: true, errors: [], warnings: [] },
  { validator: "SignaturePacketValidator", ts: "2026-03-21 08:47:11", valid: true, errors: [], warnings: [] },
  { validator: "CarrierPayloadValidator", ts: "2026-03-21 07:21:01", valid: false, errors: ["records must be a non-empty list"], warnings: [] },
  { validator: "PayrollPayloadValidator", ts: "2026-03-20 14:10:33", valid: true, errors: [], warnings: ["records array is empty — no deductions will be exported"] },
  { validator: "TpaPayloadValidator", ts: "2026-03-20 16:33:01", valid: false, errors: ["benefit_case_id is required"], warnings: [] },
];

export default function PayloadValidatorPanel() {
  const [selectedValidator, setSelectedValidator] = useState("carrier");
  const [payload, setPayload] = useState(VALIDATORS.carrier.sample);
  const [result, setResult] = useState(null);

  const handleValidatorChange = (v) => {
    setSelectedValidator(v);
    setPayload(VALIDATORS[v].sample);
    setResult(null);
  };

  const handleRun = () => {
    setResult(runValidation(selectedValidator, payload));
  };

  const v = VALIDATORS[selectedValidator];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Live validator */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" /> Live Validator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={selectedValidator} onValueChange={handleValidatorChange}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(VALIDATORS).map(([k, vv]) => (
                  <SelectItem key={k} value={k}><span className="font-mono text-xs">{vv.label}</span></SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Rules */}
            <div className="space-y-1">
              {v.rules.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px]">
                  <span className="font-mono text-primary">{r.field}</span>
                  <span className="text-muted-foreground">→ {r.rule}</span>
                </div>
              ))}
            </div>

            <Textarea
              value={payload}
              onChange={e => { setPayload(e.target.value); setResult(null); }}
              rows={10}
              className="font-mono text-[11px]"
            />

            <Button size="sm" onClick={handleRun} className="w-full">
              <Play className="w-3.5 h-3.5 mr-1.5" /> Run Validation
            </Button>

            {result && (
              <div className={`p-3 rounded-xl border space-y-2 ${result.valid ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"}`}>
                <div className="flex items-center gap-2">
                  {result.valid
                    ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                    : <XCircle className="w-4 h-4 text-destructive" />}
                  <span className={`text-sm font-semibold ${result.valid ? "text-green-700" : "text-destructive"}`}>
                    {result.valid ? "ValidationResult(valid=True)" : "ValidationResult(valid=False)"}
                  </span>
                </div>
                {result.errors.map((e, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-destructive font-mono">
                    <XCircle className="w-3 h-3 flex-shrink-0" /> {e}
                  </div>
                ))}
                {result.warnings.map((w, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-amber-700 font-mono">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" /> {w}
                  </div>
                ))}
                {result.valid && result.errors.length === 0 && result.warnings.length === 0 && (
                  <p className="text-xs text-green-700">All validation rules passed.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent runs */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Recent Validation Runs</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {RECENT_RUNS.map((r, i) => (
                <div key={i} className={`p-3 rounded-lg border ${r.valid ? "border-green-200 bg-green-50/30" : "border-red-200 bg-red-50/30"}`}>
                  <div className="flex items-center gap-2">
                    {r.valid
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      : <XCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0" />}
                    <span className="text-xs font-mono font-medium flex-1">{r.validator}</span>
                    <span className="text-[10px] text-muted-foreground">{r.ts}</span>
                  </div>
                  {r.errors.map((e, j) => (
                    <p key={j} className="text-[10px] text-destructive font-mono mt-1 ml-5">{e}</p>
                  ))}
                  {r.warnings.map((w, j) => (
                    <p key={j} className="text-[10px] text-amber-700 font-mono mt-1 ml-5">{w}</p>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}