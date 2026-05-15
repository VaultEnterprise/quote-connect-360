import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { GitMerge, Play, Copy, Sparkles, Loader2, ChevronRight, Plus, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";

const PRESET_TRANSFORMS = [
  {
    name: "CSV → Census Members",
    desc: "Map payroll CSV columns to CQ360 census member schema",
    inputSample: `first_name,last_name,dob,email,hire_date,salary
Jane,Doe,1985-03-14,jane@acme.com,2020-01-15,85000
John,Smith,1990-07-22,john@acme.com,2021-06-01,72000`,
    outputSample: `[
  {
    "first_name": "Jane",
    "last_name": "Doe",
    "date_of_birth": "1985-03-14",
    "email": "jane@acme.com",
    "hire_date": "2020-01-15",
    "annual_salary": 85000,
    "employment_status": "active",
    "is_eligible": true
  }
]`,
  },
  {
    name: "ADP Export → Census",
    desc: "Transform ADP workforce export to census format",
    inputSample: `EmpID,PreferredName,Legal Last,BirthDate,WorkEmail,Position,FTEStatus
A1001,Jessica,Williams,19880415,jwilliams@corp.com,Sr. Engineer,FT
A1002,Marcus,Johnson,19920801,mjohnson@corp.com,Analyst,PT`,
    outputSample: `[
  {
    "employee_id": "A1001",
    "first_name": "Jessica",
    "last_name": "Williams",
    "date_of_birth": "1988-04-15",
    "email": "jwilliams@corp.com",
    "job_title": "Sr. Engineer",
    "employment_type": "full_time"
  }
]`,
  },
  {
    name: "Enrollment → Payroll Deductions",
    desc: "Convert enrollment data to payroll deduction file",
    inputSample: `{
  "member": { "employee_id": "EMP001", "name": "Jane Doe" },
  "plan": { "name": "Aetna PPO", "ee_rate": 540.00 },
  "coverage_tier": "employee_spouse",
  "employer_contribution_pct": 80
}`,
    outputSample: `{
  "employee_id": "EMP001",
  "deduction_code": "MED",
  "payroll_amount": 108.00,
  "frequency": "semi_monthly",
  "effective_date": "2026-07-01",
  "plan_code": "AETNA_PPO_ES"
}`,
  },
];

const FIELD_MAPPERS = [
  { from: "BirthDate (YYYYMMDD)", to: "date_of_birth (YYYY-MM-DD)", transform: "Date reformat" },
  { from: "FTEStatus (FT/PT)", to: "employment_type (full_time/part_time)", transform: "Enum mapping" },
  { from: "salary (string '$85,000')", to: "annual_salary (number 85000)", transform: "Currency parse" },
  { from: "PreferredName + Legal Last", to: "full_name", transform: "String concat" },
];

export default function DataTransformationPanel({ aiEnabled }) {
  const [activePreset, setActivePreset] = useState(PRESET_TRANSFORMS[0]);
  const [customInput, setCustomInput] = useState("");
  const [customSchema, setCustomSchema] = useState("CQ360 Census Member");
  const [aiOutput, setAiOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mappings, setMappings] = useState(FIELD_MAPPERS);

  const runAITransform = async () => {
    if (!customInput.trim()) return;
    setLoading(true);
    setAiOutput("");
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a data transformation expert for ConnectQuote360, a health benefits platform.
Transform the following input data into the ${customSchema} JSON schema format used by the CQ360 API.
Normalize dates to ISO 8601, map enum values to CQ360 enums, parse currencies to numbers.
Return ONLY the transformed JSON array, no explanation.

Input data:
${customInput}`,
        model: "claude_sonnet_4_6",
      });
      setAiOutput(res);
    } catch (e) {
      setAiOutput(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold">Data Transformation Engine</p>
        <p className="text-xs text-muted-foreground">Field mapping, schema conversion, and AI-assisted ETL for census and enrollment data</p>
      </div>

      {/* Preset transforms */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Preset Transformations</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
          {PRESET_TRANSFORMS.map(p => (
            <button key={p.name} onClick={() => setActivePreset(p)}
              className={`text-left p-3 rounded-lg border transition-all ${activePreset.name === p.name ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
              <p className="text-xs font-semibold mb-0.5">{p.name}</p>
              <p className="text-[10px] text-muted-foreground">{p.desc}</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Sample Input</p>
            <pre className="text-[10px] bg-slate-900 text-amber-300 rounded-lg p-3 overflow-x-auto font-mono whitespace-pre-wrap min-h-[120px]">
              {activePreset.inputSample}
            </pre>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Transformed Output</p>
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
              <Badge className="text-[9px] bg-green-100 text-green-700 border-green-200 border py-0">CQ360 Schema</Badge>
            </div>
            <pre className="text-[10px] bg-slate-900 text-green-400 rounded-lg p-3 overflow-x-auto font-mono whitespace-pre-wrap min-h-[120px]">
              {activePreset.outputSample}
            </pre>
          </div>
        </div>
      </div>

      {/* Visual field mapper */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <GitMerge className="w-4 h-4 text-primary" /> Visual Field Mapper
            <Button size="sm" className="ml-auto h-7 text-xs gap-1" onClick={() => setMappings([...mappings, { from: "", to: "", transform: "Direct" }])}>
              <Plus className="w-3 h-3" /> Add Mapping
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {mappings.map((m, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2">
              <Input value={m.from} onChange={e => setMappings(prev => prev.map((x, j) => j === i ? { ...x, from: e.target.value } : x))} placeholder="Source field" className="h-7 text-xs font-mono" />
              <div className="flex flex-col items-center gap-0.5">
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <Badge variant="outline" className="text-[8px] py-0 font-mono whitespace-nowrap">{m.transform}</Badge>
              </div>
              <Input value={m.to} onChange={e => setMappings(prev => prev.map((x, j) => j === i ? { ...x, to: e.target.value } : x))} placeholder="Target field" className="h-7 text-xs font-mono" />
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => setMappings(prev => prev.filter((_, j) => j !== i))}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
          <Button size="sm" className="w-full mt-2 gap-1.5">
            <Play className="w-3.5 h-3.5" /> Apply Mappings & Preview
          </Button>
        </CardContent>
      </Card>

      {/* AI Transform */}
      <Card className={aiEnabled ? "border-primary/40" : "border-dashed"}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> AI-Assisted Transform
            {!aiEnabled && <Badge className="text-[9px] bg-muted text-muted-foreground border py-0 ml-auto">AI Disabled</Badge>}
            {aiEnabled && <Badge className="text-[9px] bg-primary/20 text-primary border-primary/30 border py-0 ml-auto">Powered by Claude</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!aiEnabled ? (
            <p className="text-xs text-muted-foreground">Enable AI in the AI Assistant tab to use this feature.</p>
          ) : (
            <>
              <div>
                <label className="text-xs font-medium mb-1.5 block">Paste your raw data (any format — CSV, JSON, XML, fixed-width)</label>
                <textarea
                  value={customInput}
                  onChange={e => setCustomInput(e.target.value)}
                  placeholder="Paste any data format here..."
                  className="w-full h-28 text-xs font-mono border border-input rounded-md bg-transparent px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <Button size="sm" onClick={runAITransform} disabled={loading || !customInput} className="gap-1.5">
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {loading ? "Transforming..." : "Transform with AI"}
              </Button>
              {aiOutput && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    <p className="text-xs font-semibold">AI Transformed Output</p>
                    <Button variant="ghost" size="sm" className="h-6 text-xs ml-auto gap-1" onClick={() => navigator.clipboard.writeText(aiOutput)}>
                      <Copy className="w-3 h-3" /> Copy
                    </Button>
                  </div>
                  <pre className="text-[10px] bg-slate-900 text-green-400 rounded-lg p-3 overflow-x-auto font-mono whitespace-pre-wrap max-h-48">{aiOutput}</pre>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}