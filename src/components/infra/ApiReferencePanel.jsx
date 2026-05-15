import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, Copy, Play, Search } from "lucide-react";

const ENDPOINTS = [
  {
    group: "Cases",
    items: [
      { method: "GET", path: "/api/cases", desc: "List all benefit cases", params: [{ name: "stage", type: "string", required: false }, { name: "limit", type: "number", required: false }], response: '{ "data": [{ "id": "...", "case_number": "...", "stage": "draft", "employer_name": "..." }] }' },
      { method: "POST", path: "/api/cases", desc: "Create a new benefit case", params: [{ name: "employer_group_id", type: "string", required: true }, { name: "case_type", type: "string", required: true }, { name: "effective_date", type: "date", required: false }], response: '{ "id": "...", "case_number": "CQ-2026-0001", "stage": "draft" }' },
      { method: "GET", path: "/api/cases/:id", desc: "Get a single case by ID", params: [{ name: "id", type: "string", required: true }], response: '{ "id": "...", "stage": "enrollment_open", "employer_name": "Acme Corp" }' },
      { method: "PATCH", path: "/api/cases/:id", desc: "Update case fields", params: [{ name: "id", type: "string", required: true }, { name: "stage", type: "string", required: false }, { name: "priority", type: "string", required: false }], response: '{ "id": "...", "updated": true }' },
    ]
  },
  {
    group: "Census",
    items: [
      { method: "GET", path: "/api/census/:case_id/members", desc: "List census members for a case", params: [{ name: "case_id", type: "string", required: true }], response: '{ "data": [{ "id": "...", "first_name": "Jane", "last_name": "Doe", "validation_status": "valid" }] }' },
      { method: "POST", path: "/api/census/:case_id/upload", desc: "Upload a census file (CSV/XLSX)", params: [{ name: "case_id", type: "string", required: true }, { name: "file", type: "file", required: true }], response: '{ "version_id": "...", "total_employees": 42, "validation_errors": 0 }' },
    ]
  },
  {
    group: "Quotes",
    items: [
      { method: "GET", path: "/api/quotes/:case_id/scenarios", desc: "List quote scenarios", params: [{ name: "case_id", type: "string", required: true }], response: '{ "data": [{ "id": "...", "name": "Scenario A", "status": "completed" }] }' },
      { method: "POST", path: "/api/quotes/:case_id/run", desc: "Trigger a new quote run", params: [{ name: "case_id", type: "string", required: true }, { name: "carriers", type: "array", required: false }, { name: "effective_date", type: "date", required: true }], response: '{ "scenario_id": "...", "status": "running" }' },
    ]
  },
  {
    group: "Enrollment",
    items: [
      { method: "GET", path: "/api/enrollment/:window_id", desc: "Get enrollment window status", params: [{ name: "window_id", type: "string", required: true }], response: '{ "enrolled_count": 38, "total_eligible": 42, "participation_rate": 0.9 }' },
      { method: "POST", path: "/api/enrollment/:window_id/invite", desc: "Send enrollment invitations", params: [{ name: "window_id", type: "string", required: true }, { name: "employee_emails", type: "array", required: false }], response: '{ "invited": 42, "skipped": 0 }' },
    ]
  },
  {
    group: "Proposals",
    items: [
      { method: "GET", path: "/api/proposals/:case_id", desc: "List proposals for a case", params: [{ name: "case_id", type: "string", required: true }], response: '{ "data": [{ "id": "...", "title": "...", "status": "sent" }] }' },
      { method: "POST", path: "/api/proposals/:case_id/send", desc: "Send proposal to employer", params: [{ name: "case_id", type: "string", required: true }, { name: "scenario_id", type: "string", required: true }, { name: "recipient_email", type: "string", required: true }], response: '{ "proposal_id": "...", "sent_at": "2026-03-22T..." }' },
    ]
  },
];

const METHOD_COLORS = {
  GET: "bg-blue-100 text-blue-700",
  POST: "bg-green-100 text-green-700",
  PATCH: "bg-amber-100 text-amber-700",
  DELETE: "bg-red-100 text-red-700",
  PUT: "bg-purple-100 text-purple-700",
};

function EndpointRow({ ep }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden mb-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
      >
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono flex-shrink-0 ${METHOD_COLORS[ep.method]}`}>{ep.method}</span>
        <code className="text-xs text-foreground font-mono flex-1">{ep.path}</code>
        <span className="text-xs text-muted-foreground hidden sm:block">{ep.desc}</span>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-border px-4 py-4 bg-muted/20 space-y-4">
          <p className="text-sm text-muted-foreground">{ep.desc}</p>

          {ep.params.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2">Parameters</p>
              <div className="space-y-1.5">
                {ep.params.map(p => (
                  <div key={p.name} className="flex items-center gap-2 text-xs">
                    <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">{p.name}</code>
                    <span className="text-muted-foreground">{p.type}</span>
                    {p.required ? <Badge className="text-[9px] bg-red-100 text-red-600 border-red-200 border py-0">required</Badge>
                      : <Badge className="text-[9px] bg-muted text-muted-foreground border py-0">optional</Badge>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold">Example Response</p>
              <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => copy(ep.response)}>
                <Copy className="w-3 h-3" />{copied ? "Copied!" : "Copy"}
              </Button>
            </div>
            <pre className="text-[11px] bg-slate-900 text-green-400 rounded-lg p-3 overflow-x-auto font-mono whitespace-pre-wrap">
              {ep.response}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ApiReferencePanel() {
  const [search, setSearch] = useState("");

  const filtered = ENDPOINTS.map(g => ({
    ...g,
    items: g.items.filter(ep =>
      ep.path.toLowerCase().includes(search.toLowerCase()) ||
      ep.desc.toLowerCase().includes(search.toLowerCase()) ||
      ep.method.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(g => g.items.length > 0);

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search endpoints..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.map(group => (
        <div key={group.group}>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">{group.group}</p>
          {group.items.map(ep => <EndpointRow key={ep.path + ep.method} ep={ep} />)}
        </div>
      ))}
    </div>
  );
}