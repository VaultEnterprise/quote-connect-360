import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Zap, CheckCircle2, XCircle, RotateCcw, Trash2, Play, ChevronDown, ChevronRight } from "lucide-react";
import { format } from "date-fns";

const EVENTS = [
  { group: "Cases", events: ["case.created", "case.stage_changed", "case.closed"] },
  { group: "Census", events: ["census.uploaded", "census.validated", "census.issues_found"] },
  { group: "Quotes", events: ["quote.run_started", "quote.completed", "quote.expired"] },
  { group: "Proposals", events: ["proposal.sent", "proposal.viewed", "proposal.approved", "proposal.rejected"] },
  { group: "Enrollment", events: ["enrollment.opened", "enrollment.member_enrolled", "enrollment.closed"] },
  { group: "Renewals", events: ["renewal.created", "renewal.decision_made"] },
];

const MOCK_ENDPOINTS = [
  {
    id: "wh_1", url: "https://payroll.acme.com/webhooks/benefits",
    events: ["enrollment.member_enrolled", "enrollment.closed"],
    status: "active", lastDelivery: new Date("2026-03-21T14:30:00"), lastStatus: 200,
  },
  {
    id: "wh_2", url: "https://carrier-portal.example.com/hooks/qc360",
    events: ["case.stage_changed", "proposal.approved"],
    status: "active", lastDelivery: new Date("2026-03-21T09:15:00"), lastStatus: 500,
  },
];

const MOCK_DELIVERIES = [
  { id: "d1", event: "enrollment.member_enrolled", status: 200, ts: new Date("2026-03-21T14:30:00"), duration: "142ms" },
  { id: "d2", event: "case.stage_changed", status: 200, ts: new Date("2026-03-21T11:22:00"), duration: "98ms" },
  { id: "d3", event: "proposal.approved", status: 500, ts: new Date("2026-03-20T16:05:00"), duration: "3001ms" },
  { id: "d4", event: "enrollment.closed", status: 200, ts: new Date("2026-03-20T10:00:00"), duration: "201ms" },
];

export default function WebhooksPanel() {
  const [showCreate, setShowCreate] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [expandedEvents, setExpandedEvents] = useState({});

  const toggleEvent = (e) => setSelectedEvents(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]);
  const toggleGroup = (g) => setExpandedEvents(prev => ({ ...prev, [g]: !prev[g] }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Webhook Endpoints</p>
          <p className="text-xs text-muted-foreground">Push events to external systems in real time</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(!showCreate)} className="gap-1.5">
          <Plus className="w-4 h-4" /> Add Endpoint
        </Button>
      </div>

      {showCreate && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Zap className="w-4 h-4 text-primary" /> New Webhook Endpoint</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium mb-1.5 block">Endpoint URL</label>
              <Input placeholder="https://your-system.com/webhooks/benefits" value={newUrl} onChange={e => setNewUrl(e.target.value)} className="h-8 text-sm font-mono" />
            </div>
            <div>
              <label className="text-xs font-medium mb-2 block">Subscribe to Events</label>
              <div className="space-y-2 border border-border rounded-lg p-3 bg-background max-h-56 overflow-y-auto">
                {EVENTS.map(g => (
                  <div key={g.group}>
                    <button onClick={() => toggleGroup(g.group)} className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-full hover:text-foreground">
                      {expandedEvents[g.group] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      {g.group}
                    </button>
                    {expandedEvents[g.group] && (
                      <div className="ml-4 mt-1 space-y-1">
                        {g.events.map(ev => (
                          <label key={ev} className="flex items-center gap-2 text-xs cursor-pointer">
                            <input type="checkbox" checked={selectedEvents.includes(ev)} onChange={() => toggleEvent(ev)} className="rounded" />
                            <code className="font-mono">{ev}</code>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" disabled={!newUrl || selectedEvents.length === 0}>Register Endpoint</Button>
              <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Registered endpoints */}
      <div className="space-y-3">
        {MOCK_ENDPOINTS.map(ep => (
          <Card key={ep.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-xs font-mono text-foreground truncate max-w-xs">{ep.url}</code>
                    <Badge className={ep.status === "active" ? "bg-green-100 text-green-700 border-green-200 border text-[10px] py-0" : "bg-red-100 text-red-600 border-red-200 border text-[10px] py-0"}>
                      {ep.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {ep.events.map(e => <Badge key={e} variant="outline" className="text-[9px] font-mono py-0">{e}</Badge>)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Last delivery: {format(ep.lastDelivery, "MMM d, HH:mm")}</span>
                    {ep.lastStatus === 200
                      ? <span className="flex items-center gap-0.5 text-green-600"><CheckCircle2 className="w-3 h-3" /> 200 OK</span>
                      : <span className="flex items-center gap-0.5 text-red-600"><XCircle className="w-3 h-3" /> {ep.lastStatus} Error</span>
                    }
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1"><Play className="w-3 h-3" /> Test</Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs text-destructive hover:text-destructive gap-1"><Trash2 className="w-3 h-3" /> Remove</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delivery log */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Recent Deliveries</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {MOCK_DELIVERIES.map(d => (
              <div key={d.id} className="flex items-center gap-3 px-4 py-2.5">
                {d.status === 200
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  : <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                }
                <code className="text-xs font-mono flex-1">{d.event}</code>
                <span className={`text-xs font-mono ${d.status === 200 ? "text-green-600" : "text-red-600"}`}>{d.status}</span>
                <span className="text-xs text-muted-foreground">{d.duration}</span>
                <span className="text-xs text-muted-foreground hidden sm:block">{format(d.ts, "MMM d HH:mm")}</span>
                {d.status !== 200 && (
                  <Button variant="ghost" size="sm" className="h-6 text-xs gap-1 p-1"><RotateCcw className="w-3 h-3" /> Retry</Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}