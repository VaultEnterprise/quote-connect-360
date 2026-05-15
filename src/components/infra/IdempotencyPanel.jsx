import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, Clock, Search, Hash } from "lucide-react";

const SAMPLE_RECORDS = [
  { key: "carrier_submission_send:a3f8b1c2...", operation: "carrier_submission_send", status: "completed", request_hash: "a3f8b1c2d4e5f6a7", created_at: "2026-03-21 09:14:02", completed_at: "2026-03-21 09:14:04", response_payload: { submission_id: "CS-88421", status: "submitted" } },
  { key: "docusign_send_packet:b7c9d2e1...", operation: "docusign_send_packet", status: "completed", request_hash: "b7c9d2e1f3a4b5c6", created_at: "2026-03-21 08:47:11", completed_at: "2026-03-21 08:47:13", response_payload: { envelopeId: "abc-123-def", status: "sent" } },
  { key: "tpa_export_send:c1d2e3f4...", operation: "tpa_export_send", status: "failed", request_hash: "c1d2e3f4a5b6c7d8", created_at: "2026-03-20 16:33:01", completed_at: null, response_payload: null },
  { key: "payroll_deduction_send:d4e5f6a7...", operation: "payroll_deduction_send", status: "completed", request_hash: "d4e5f6a7b8c9d0e1", created_at: "2026-03-20 14:10:33", completed_at: "2026-03-20 14:10:35", response_payload: { batch_id: "PAY-9910", status: "submitted" } },
  { key: "carrier_submission_send:e5f6a7b8...", operation: "carrier_submission_send", status: "completed", request_hash: "e5f6a7b8c9d0e1f2", created_at: "2026-03-19 11:55:10", completed_at: "2026-03-19 11:55:12", response_payload: { submission_id: "CS-88399", status: "submitted" } },
  { key: "billing_setup_send:f1a2b3c4...", operation: "billing_setup_send", status: "in_progress", request_hash: "f1a2b3c4d5e6f7a8", created_at: "2026-03-21 10:02:44", completed_at: null, response_payload: null },
  { key: "docusign_send_packet:a9b0c1d2...", operation: "docusign_send_packet", status: "completed", request_hash: "a9b0c1d2e3f4a5b6", created_at: "2026-03-21 07:21:05", completed_at: "2026-03-21 07:21:07", response_payload: { envelopeId: "xyz-456-uvw", status: "sent" } },
];

const STATUS_STYLE = {
  completed: "bg-green-100 text-green-700 border-green-200",
  failed: "bg-red-100 text-red-700 border-red-200",
  in_progress: "bg-blue-100 text-blue-700 border-blue-200",
};

export default function IdempotencyPanel() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);

  const records = SAMPLE_RECORDS.filter(r =>
    !search || r.key.includes(search) || r.operation.includes(search)
  );

  const completed = SAMPLE_RECORDS.filter(r => r.status === "completed").length;
  const failed = SAMPLE_RECORDS.filter(r => r.status === "failed").length;
  const inProgress = SAMPLE_RECORDS.filter(r => r.status === "in_progress").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Completed", value: completed, color: "text-green-600", bg: "bg-green-50", icon: CheckCircle2 },
          { label: "In Progress", value: inProgress, color: "text-blue-600", bg: "bg-blue-50", icon: Clock },
          { label: "Failed", value: failed, color: "text-destructive", bg: "bg-red-50", icon: XCircle },
        ].map(s => (
          <Card key={s.label}><CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${s.bg}`}><s.icon className={`w-4 h-4 ${s.color}`} /></div>
            <div><p className={`text-xl font-bold ${s.color}`}>{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2"><Hash className="w-4 h-4 text-primary" /> Idempotency Records</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search key or operation..." className="pl-8 h-8 text-xs" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {records.map((r, i) => (
              <div key={i}>
                <button
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors text-left"
                >
                  <Badge variant="outline" className={`text-[10px] border flex-shrink-0 ${STATUS_STYLE[r.status]}`}>{r.status}</Badge>
                  <span className="text-xs font-mono text-muted-foreground truncate flex-1">{r.key}</span>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">{r.created_at}</span>
                </button>
                {expanded === i && (
                  <div className="mx-3 mb-2 p-3 rounded-b-lg border border-t-0 bg-muted/20 text-xs space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="text-muted-foreground">operation_name</span><p className="font-mono mt-0.5">{r.operation}</p></div>
                      <div><span className="text-muted-foreground">request_hash</span><p className="font-mono mt-0.5">{r.request_hash}</p></div>
                      <div><span className="text-muted-foreground">created_at</span><p className="font-mono mt-0.5">{r.created_at}</p></div>
                      <div><span className="text-muted-foreground">completed_at</span><p className="font-mono mt-0.5">{r.completed_at || "—"}</p></div>
                    </div>
                    {r.response_payload && (
                      <div>
                        <span className="text-muted-foreground">response_payload</span>
                        <pre className="mt-0.5 p-2 rounded bg-muted font-mono text-[10px] overflow-x-auto">{JSON.stringify(r.response_payload, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Schema Reference */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">PostgreSQL Table: idempotency_record</CardTitle></CardHeader>
        <CardContent>
          <pre className="text-[10px] font-mono text-muted-foreground leading-relaxed overflow-x-auto">{`CREATE TABLE idempotency_record (
    idempotency_record_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key        TEXT NOT NULL UNIQUE,
    operation_name         TEXT NOT NULL,
    status                 TEXT NOT NULL CHECK (status IN ('in_progress','completed','failed')),
    request_hash           TEXT NOT NULL,
    response_payload       JSONB,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at           TIMESTAMPTZ
);
CREATE INDEX idx_idempotency_operation_status
    ON idempotency_record (operation_name, status);`}</pre>
        </CardContent>
      </Card>
    </div>
  );
}