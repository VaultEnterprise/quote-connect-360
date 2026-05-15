import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, Clock, Search, RotateCcw, ChevronDown, ChevronRight } from "lucide-react";
import { format } from "date-fns";

const MOCK_EVENTS = [
  { id: "e1", event: "enrollment.member_enrolled", source: "Employee Portal", target: "payroll.acme.com", status: "delivered", statusCode: 200, duration: "142ms", ts: new Date("2026-03-22T09:30:00"), payload: '{ "event": "enrollment.member_enrolled", "case_id": "abc123", "employee_email": "jane@acme.com", "coverage_tier": "family" }' },
  { id: "e2", event: "case.stage_changed", source: "Cases", target: "carrier-portal.example.com", status: "failed", statusCode: 500, duration: "3001ms", ts: new Date("2026-03-22T08:15:00"), payload: '{ "event": "case.stage_changed", "case_id": "xyz456", "old_stage": "quoting", "new_stage": "proposal_ready" }' },
  { id: "e3", event: "proposal.approved", source: "Employer Portal", target: "payroll.acme.com", status: "delivered", statusCode: 200, duration: "89ms", ts: new Date("2026-03-21T16:45:00"), payload: '{ "event": "proposal.approved", "proposal_id": "prop789", "case_id": "abc123", "employer_name": "Acme Corp" }' },
  { id: "e4", event: "census.validated", source: "Census", target: "carrier-portal.example.com", status: "pending", statusCode: null, duration: "—", ts: new Date("2026-03-21T14:00:00"), payload: '{ "event": "census.validated", "case_id": "def321", "total_employees": 42, "validation_errors": 0 }' },
  { id: "e5", event: "quote.completed", source: "Quotes", target: "payroll.acme.com", status: "delivered", statusCode: 200, duration: "201ms", ts: new Date("2026-03-21T11:20:00"), payload: '{ "event": "quote.completed", "scenario_id": "scn999", "total_monthly_premium": 28450 }' },
  { id: "e6", event: "renewal.created", source: "Renewals", target: "carrier-portal.example.com", status: "failed", statusCode: 404, duration: "412ms", ts: new Date("2026-03-20T15:30:00"), payload: '{ "event": "renewal.created", "renewal_id": "ren111", "employer_name": "Beta LLC", "renewal_date": "2026-09-01" }' },
];

function StatusIcon({ status }) {
  if (status === "delivered") return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
  if (status === "failed") return <XCircle className="w-3.5 h-3.5 text-red-500" />;
  return <Clock className="w-3.5 h-3.5 text-amber-500" />;
}

function EventRow({ ev }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left">
        <StatusIcon status={ev.status} />
        <code className="text-xs font-mono flex-1">{ev.event}</code>
        <span className="text-xs text-muted-foreground hidden sm:block truncate max-w-[120px]">{ev.target.replace("https://", "")}</span>
        {ev.statusCode && (
          <span className={`text-xs font-mono ${ev.statusCode === 200 ? "text-green-600" : "text-red-600"}`}>{ev.statusCode}</span>
        )}
        <span className="text-xs text-muted-foreground hidden md:block">{ev.duration}</span>
        <span className="text-xs text-muted-foreground">{format(ev.ts, "MMM d HH:mm")}</span>
        {ev.status === "failed" && (
          <Button variant="ghost" size="sm" className="h-6 text-xs gap-1 p-1 flex-shrink-0"><RotateCcw className="w-3 h-3" /></Button>
        )}
        {open ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-3 bg-muted/20">
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mb-1">Payload</p>
          <pre className="text-[11px] bg-slate-900 text-green-400 rounded-lg p-3 overflow-x-auto font-mono whitespace-pre-wrap">{ev.payload}</pre>
          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
            <span>Source: <strong className="text-foreground">{ev.source}</strong></span>
            <span>Target: <strong className="text-foreground">{ev.target}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EventLogPanel() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = MOCK_EVENTS.filter(e => {
    const matchSearch = e.event.includes(search) || e.target.includes(search);
    const matchFilter = filter === "all" || e.status === filter;
    return matchSearch && matchFilter;
  });

  const counts = {
    delivered: MOCK_EVENTS.filter(e => e.status === "delivered").length,
    failed: MOCK_EVENTS.filter(e => e.status === "failed").length,
    pending: MOCK_EVENTS.filter(e => e.status === "pending").length,
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Delivered", count: counts.delivered, color: "text-green-600" },
          { label: "Failed", count: counts.failed, color: "text-red-600" },
          { label: "Pending", count: counts.pending, color: "text-amber-600" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-3 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search events or endpoints..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-8 text-xs" />
        </div>
        {["all", "delivered", "failed", "pending"].map(f => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" className="h-8 text-xs capitalize" onClick={() => setFilter(f)}>{f}</Button>
        ))}
      </div>

      {/* Log */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2 border-b border-border">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Event Delivery Log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0
            ? <p className="text-sm text-muted-foreground text-center py-8">No events match your filter.</p>
            : filtered.map(ev => <EventRow key={ev.id} ev={ev} />)
          }
        </CardContent>
      </Card>
    </div>
  );
}