import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Database, ChevronDown, ChevronRight } from "lucide-react";

const MODELS = [
  {
    name: "BenefitCase",
    description: "Core case record linking an employer to a benefits workflow",
    fields: [
      { name: "id", type: "string", required: true, desc: "Unique case ID" },
      { name: "case_number", type: "string", required: false, desc: "Human-readable reference e.g. CQ-2026-0001" },
      { name: "agency_id", type: "string", required: true, desc: "Parent agency ID" },
      { name: "employer_group_id", type: "string", required: true, desc: "Linked employer group" },
      { name: "case_type", type: "enum", required: true, desc: "new_business | renewal | mid_year_change | takeover" },
      { name: "stage", type: "enum", required: false, desc: "draft → active → closed (see Stage Reference)" },
      { name: "effective_date", type: "date", required: false, desc: "Coverage effective date" },
      { name: "priority", type: "enum", required: false, desc: "low | normal | high | urgent" },
      { name: "assigned_to", type: "string", required: false, desc: "Email of assigned broker/rep" },
      { name: "created_date", type: "datetime", required: false, desc: "Auto-set on creation" },
    ]
  },
  {
    name: "CensusMember",
    description: "Individual employee or dependent in a case census",
    fields: [
      { name: "id", type: "string", required: true, desc: "Unique member ID" },
      { name: "case_id", type: "string", required: true, desc: "Parent case ID" },
      { name: "first_name", type: "string", required: true, desc: "" },
      { name: "last_name", type: "string", required: true, desc: "" },
      { name: "date_of_birth", type: "date", required: false, desc: "Used for age-banded rating" },
      { name: "employment_status", type: "enum", required: false, desc: "active | leave | terminated" },
      { name: "annual_salary", type: "number", required: false, desc: "Used for ACA affordability checks" },
      { name: "coverage_tier", type: "enum", required: false, desc: "employee_only | employee_spouse | employee_children | family" },
      { name: "validation_status", type: "enum", required: false, desc: "pending | valid | has_warnings | has_errors" },
    ]
  },
  {
    name: "EnrollmentWindow",
    description: "Defines an open enrollment period with tracking metrics",
    fields: [
      { name: "id", type: "string", required: true, desc: "" },
      { name: "case_id", type: "string", required: true, desc: "" },
      { name: "start_date", type: "date", required: true, desc: "Window opens" },
      { name: "end_date", type: "date", required: true, desc: "Window closes" },
      { name: "effective_date", type: "date", required: false, desc: "Coverage begins" },
      { name: "total_eligible", type: "number", required: false, desc: "" },
      { name: "enrolled_count", type: "number", required: false, desc: "Auto-updated" },
      { name: "participation_rate", type: "number", required: false, desc: "0.0 – 1.0" },
      { name: "status", type: "enum", required: false, desc: "scheduled | open | closing_soon | closed | finalized" },
    ]
  },
  {
    name: "QuoteScenario",
    description: "A set of plan options and contribution rules for a case",
    fields: [
      { name: "id", type: "string", required: true, desc: "" },
      { name: "case_id", type: "string", required: true, desc: "" },
      { name: "name", type: "string", required: true, desc: "Scenario label" },
      { name: "status", type: "enum", required: false, desc: "draft | running | completed | error | expired" },
      { name: "total_monthly_premium", type: "number", required: false, desc: "Total across all members" },
      { name: "employer_monthly_cost", type: "number", required: false, desc: "" },
      { name: "employee_monthly_cost_avg", type: "number", required: false, desc: "Average per employee" },
      { name: "is_recommended", type: "boolean", required: false, desc: "AI-flagged best option" },
      { name: "expires_at", type: "datetime", required: false, desc: "Quote validity window" },
    ]
  },
  {
    name: "Proposal",
    description: "Employer-facing benefit proposal document",
    fields: [
      { name: "id", type: "string", required: true, desc: "" },
      { name: "case_id", type: "string", required: true, desc: "" },
      { name: "title", type: "string", required: true, desc: "" },
      { name: "status", type: "enum", required: false, desc: "draft | sent | viewed | approved | rejected | expired" },
      { name: "total_monthly_premium", type: "number", required: false, desc: "" },
      { name: "sent_at", type: "datetime", required: false, desc: "" },
      { name: "approved_at", type: "datetime", required: false, desc: "" },
      { name: "expires_at", type: "datetime", required: false, desc: "" },
    ]
  },
];

const TYPE_COLORS = {
  string: "bg-blue-100 text-blue-700",
  number: "bg-purple-100 text-purple-700",
  boolean: "bg-green-100 text-green-700",
  date: "bg-amber-100 text-amber-700",
  datetime: "bg-amber-100 text-amber-700",
  enum: "bg-pink-100 text-pink-700",
  array: "bg-slate-100 text-slate-700",
};

function ModelCard({ model }) {
  const [open, setOpen] = useState(false);

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
      >
        <Database className="w-4 h-4 text-primary flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold">{model.name}</p>
          <p className="text-xs text-muted-foreground">{model.description}</p>
        </div>
        <Badge variant="outline" className="text-[10px] py-0">{model.fields.length} fields</Badge>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/40">
                <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Field</th>
                <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Type</th>
                <th className="text-left px-4 py-2 font-semibold text-muted-foreground hidden sm:table-cell">Required</th>
                <th className="text-left px-4 py-2 font-semibold text-muted-foreground hidden md:table-cell">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {model.fields.map(f => (
                <tr key={f.name} className="hover:bg-muted/20">
                  <td className="px-4 py-2"><code className="font-mono">{f.name}</code></td>
                  <td className="px-4 py-2">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${TYPE_COLORS[f.type] || "bg-muted text-muted-foreground"}`}>
                      {f.type}
                    </span>
                  </td>
                  <td className="px-4 py-2 hidden sm:table-cell">
                    {f.required ? <span className="text-red-500 font-bold">✓</span> : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground hidden md:table-cell">{f.desc || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export default function DataModelsPanel() {
  const [search, setSearch] = useState("");
  const filtered = MODELS.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search models..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>
      {filtered.map(m => <ModelCard key={m.name} model={m} />)}
    </div>
  );
}