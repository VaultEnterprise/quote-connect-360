import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Terminal, Play, Trash2 } from "lucide-react";

const SAMPLE_LOGS = [
  { ts: "2026-03-21T09:14:02.001Z", level: "INFO", event: "operation_started", operation_name: "carrier_submission_send", idempotency_key: "carrier_submission_send:a3f8b1c2..." },
  { ts: "2026-03-21T09:14:03.221Z", level: "INFO", event: "endpoint_health_check", endpoint_name: "CarrierAPI", url: "https://carrier.example.com/api/carrier-submissions", status_code: 200, latency_ms: 112.4, healthy: true },
  { ts: "2026-03-21T09:14:04.882Z", level: "INFO", event: "operation_completed", operation_name: "carrier_submission_send", idempotency_key: "carrier_submission_send:a3f8b1c2..." },
  { ts: "2026-03-21T08:47:11.003Z", level: "INFO", event: "operation_started", operation_name: "docusign_send_packet", idempotency_key: "docusign_send_packet:b7c9d2e1..." },
  { ts: "2026-03-21T08:47:13.440Z", level: "INFO", event: "operation_completed", operation_name: "docusign_send_packet", idempotency_key: "docusign_send_packet:b7c9d2e1..." },
  { ts: "2026-03-20T16:33:01.005Z", level: "WARNING", event: "retry_attempt", operation_name: "tpa_export_send", attempt: 2, delay_seconds: 2.0 },
  { ts: "2026-03-20T16:33:05.100Z", level: "WARNING", event: "retry_attempt", operation_name: "tpa_export_send", attempt: 3, delay_seconds: 4.0 },
  { ts: "2026-03-20T16:33:10.200Z", level: "ERROR", event: "operation_failed", operation_name: "tpa_export_send", idempotency_key: "tpa_export_send:c1d2e3f4...", error: "ConnectionError: tpa.example.com refused connection" },
  { ts: "2026-03-21T10:02:44.900Z", level: "INFO", event: "payload_validation_passed", operation_name: "billing_setup_send" },
  { ts: "2026-03-21T07:21:01.111Z", level: "ERROR", event: "payload_validation_failed", operation_name: "carrier_submission_send", errors: ["records must be a non-empty list"] },
  { ts: "2026-03-21T07:00:00.000Z", level: "INFO", event: "idempotent_replay_returned", operation_name: "docusign_send_packet", idempotency_key: "docusign_send_packet:a9b0c1d2..." },
  { ts: "2026-03-21T10:15:44.122Z", level: "INFO", event: "endpoint_health_check_failed", endpoint_name: "TpaAPI", url: "https://tpa.example.com/api/health", error: "503 Service Unavailable", latency_ms: 1240.2 },
];

const LEVEL_STYLE = {
  INFO: "bg-blue-100 text-blue-700 border-blue-200",
  WARNING: "bg-amber-100 text-amber-700 border-amber-200",
  ERROR: "bg-red-100 text-red-700 border-red-200",
};

function redactedJson(obj) {
  const REDACTED = new Set(["token", "authorization", "api_key", "private_key", "password", "ssn", "dob"]);
  const clean = {};
  for (const [k, v] of Object.entries(obj)) {
    clean[k] = REDACTED.has(k.toLowerCase()) ? "***REDACTED***" : v;
  }
  return JSON.stringify(clean, null, 2);
}

export default function StructuredLoggerPanel() {
  const [logs, setLogs] = useState(SAMPLE_LOGS);
  const [levelFilter, setLevelFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [streaming, setStreaming] = useState(false);
  const streamRef = useRef(null);
  const bottomRef = useRef(null);

  const NEW_EVENTS = [
    { level: "INFO", event: "operation_started", operation_name: "payroll_deduction_send", idempotency_key: "payroll_deduction_send:live..." },
    { level: "INFO", event: "endpoint_health_check", endpoint_name: "PayrollAPI", status_code: 200, latency_ms: 94.1, healthy: true },
    { level: "INFO", event: "operation_completed", operation_name: "payroll_deduction_send" },
  ];

  const startStream = () => {
    setStreaming(true);
    let i = 0;
    streamRef.current = setInterval(() => {
      if (i >= NEW_EVENTS.length) { clearInterval(streamRef.current); setStreaming(false); return; }
      const entry = { ...NEW_EVENTS[i], ts: new Date().toISOString() };
      setLogs(prev => [entry, ...prev]);
      i++;
    }, 800);
  };

  useEffect(() => () => clearInterval(streamRef.current), []);

  const filtered = logs.filter(l => {
    const matchLevel = levelFilter === "all" || l.level === levelFilter;
    const matchSearch = !search || l.event.includes(search) || l.operation_name?.includes(search) || JSON.stringify(l).toLowerCase().includes(search.toLowerCase());
    return matchLevel && matchSearch;
  });

  return (
    <div className="space-y-4">
      {/* Redaction note */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-4">
          <p className="text-xs text-amber-800 font-medium">PII/PHI Redaction Active</p>
          <p className="text-xs text-amber-700 mt-0.5">Fields <code className="font-mono">ssn · dob · token · authorization · api_key · private_key · password</code> are automatically replaced with <code className="font-mono">***REDACTED***</code> before emission.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2"><Terminal className="w-4 h-4 text-primary" /> Structured Log Stream</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="INFO">INFO</SelectItem>
                  <SelectItem value="WARNING">WARNING</SelectItem>
                  <SelectItem value="ERROR">ERROR</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter events..." className="pl-8 h-8 text-xs w-44" />
              </div>
              <Button size="sm" variant="outline" onClick={startStream} disabled={streaming}>
                <Play className="w-3.5 h-3.5 mr-1.5" />{streaming ? "Streaming..." : "Simulate Events"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setLogs(SAMPLE_LOGS)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-96 overflow-y-auto font-mono text-[10px]">
            {filtered.map((log, i) => {
              const { ts, level, ...rest } = log;
              return (
                <div key={i} className={`p-2 rounded border leading-relaxed ${level === "ERROR" ? "border-red-200 bg-red-50/40" : level === "WARNING" ? "border-amber-200 bg-amber-50/40" : "border-border bg-muted/20"}`}>
                  <div className="flex items-start gap-2">
                    <span className="text-muted-foreground flex-shrink-0">{ts}</span>
                    <Badge variant="outline" className={`text-[9px] py-0 px-1 flex-shrink-0 border ${LEVEL_STYLE[level]}`}>{level}</Badge>
                    <pre className="whitespace-pre-wrap break-all text-foreground">{redactedJson(rest)}</pre>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}