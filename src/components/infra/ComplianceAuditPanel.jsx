import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Download, Search, CheckCircle2, AlertTriangle, XCircle, Lock, FileText, Clock, Filter } from "lucide-react";
import { format } from "date-fns";

const COMPLIANCE_FRAMEWORKS = [
  { name: "HIPAA", status: "compliant", score: 98, controls: 54, passing: 53, lastAssessed: new Date("2026-03-01"), desc: "Health Insurance Portability and Accountability Act" },
  { name: "SOC 2 Type II", status: "compliant", score: 96, controls: 64, passing: 62, lastAssessed: new Date("2026-02-15"), desc: "Service Organization Control — Security & Availability" },
  { name: "PCI DSS", status: "compliant", score: 94, controls: 12, passing: 12, lastAssessed: new Date("2026-03-10"), desc: "Payment Card Industry Data Security Standard" },
  { name: "ERISA", status: "attention", score: 87, controls: 18, passing: 16, lastAssessed: new Date("2026-03-20"), desc: "Employee Retirement Income Security Act" },
  { name: "ACA Reporting", status: "compliant", score: 100, controls: 8, passing: 8, lastAssessed: new Date("2026-03-15"), desc: "Affordable Care Act 1095-C/B reporting requirements" },
  { name: "GDPR", status: "compliant", score: 91, controls: 36, passing: 33, lastAssessed: new Date("2026-02-28"), desc: "General Data Protection Regulation (EU)" },
];

const AUDIT_LOG = [
  { id: "a1", actor: "broker@agencyxyz.com", action: "API Key Created", resource: "api_key:key_prod_003", ip: "192.168.1.1", ts: new Date("2026-03-22T10:14:00"), risk: "low" },
  { id: "a2", actor: "admin@connectquote.com", action: "User Role Changed", resource: "user:sarah@broker.com → broker_admin", ip: "10.0.0.5", ts: new Date("2026-03-22T09:55:00"), risk: "medium" },
  { id: "a3", actor: "api:cq360_prod_key", action: "Census Bulk Upload", resource: "case:CQ-2026-0042 · 84 records", ip: "203.0.113.42", ts: new Date("2026-03-22T09:30:00"), risk: "low" },
  { id: "a4", actor: "unknown", action: "Failed Auth Attempt", resource: "POST /auth/token", ip: "185.220.101.0", ts: new Date("2026-03-22T08:12:00"), risk: "high" },
  { id: "a5", actor: "broker@agencyxyz.com", action: "PHI Data Export", resource: "census:case_abc · 84 members", ip: "192.168.1.1", ts: new Date("2026-03-21T16:45:00"), risk: "medium" },
  { id: "a6", actor: "admin@connectquote.com", action: "Webhook Endpoint Added", resource: "wh:https://payroll.acme.com/hooks", ip: "10.0.0.5", ts: new Date("2026-03-21T15:20:00"), risk: "low" },
  { id: "a7", actor: "system", action: "Key Auto-Rotated", resource: "api_key:key_stg_002", ip: "internal", ts: new Date("2026-03-21T00:00:00"), risk: "low" },
];

const RISK_COLORS = {
  low: "bg-green-100 text-green-700 border-green-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  high: "bg-red-100 text-red-700 border-red-200",
};

export default function ComplianceAuditPanel() {
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");

  const filteredLog = AUDIT_LOG.filter(e => {
    const matchSearch = !search || e.actor.includes(search) || e.action.toLowerCase().includes(search.toLowerCase()) || e.resource.includes(search);
    const matchRisk = riskFilter === "all" || e.risk === riskFilter;
    return matchSearch && matchRisk;
  });

  return (
    <div className="space-y-5">
      {/* Compliance scorecard */}
      <div>
        <p className="text-sm font-semibold mb-1">Compliance Frameworks</p>
        <p className="text-xs text-muted-foreground mb-3">Continuous compliance monitoring across regulatory requirements</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {COMPLIANCE_FRAMEWORKS.map(f => (
            <Card key={f.name} className={f.status === "compliant" ? "border-green-200" : "border-amber-200"}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-bold">{f.name}</p>
                    <p className="text-[10px] text-muted-foreground">{f.desc}</p>
                  </div>
                  <Badge className={f.status === "compliant"
                    ? "bg-green-100 text-green-700 border-green-200 border text-[9px] py-0"
                    : "bg-amber-100 text-amber-700 border-amber-200 border text-[9px] py-0"}>
                    {f.status === "compliant" ? "✓ Compliant" : "⚠ Attention"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${f.status === "compliant" ? "bg-green-500" : "bg-amber-400"}`}
                      style={{ width: `${f.score}%` }} />
                  </div>
                  <span className="text-xs font-bold text-foreground">{f.score}%</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{f.passing}/{f.controls} controls · assessed {format(f.lastAssessed, "MMM d")}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Data residency & encryption */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Lock className="w-4 h-4 text-primary" /> Data Security Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { label: "Encryption at Rest", value: "AES-256-GCM", status: "ok" },
              { label: "Encryption in Transit", value: "TLS 1.3", status: "ok" },
              { label: "Field-Level Encryption", value: "SSN, DOB, PHI fields", status: "ok" },
              { label: "Key Management", value: "AWS KMS + HSM", status: "ok" },
              { label: "Data Residency", value: "US-East-1 (primary), US-West-2 (DR)", status: "ok" },
              { label: "Backup Retention", value: "90 days · point-in-time recovery", status: "ok" },
              { label: "PHI Tokenization", value: "Member IDs, SSN last 4", status: "ok" },
              { label: "Pen Test", value: "Last: Jan 2026 · Grade: A", status: "ok" },
            ].map(c => (
              <div key={c.label} className="flex items-center justify-between gap-3 p-2.5 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  <span className="text-xs text-muted-foreground">{c.label}</span>
                </div>
                <span className="text-xs font-medium text-foreground text-right">{c.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Audit log */}
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <p className="text-sm font-semibold">API Audit Log</p>
            <p className="text-xs text-muted-foreground">Immutable audit trail of all API and admin actions</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
              <Download className="w-3 h-3" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
              <FileText className="w-3 h-3" /> Export PDF Report
            </Button>
          </div>
        </div>

        <div className="flex gap-3 mb-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input placeholder="Search actor, action, resource..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-8 text-xs" />
          </div>
          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {filteredLog.map(e => (
                <div key={e.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {e.risk === "high"
                      ? <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                      : e.risk === "medium"
                        ? <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        : <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-xs font-semibold">{e.action}</span>
                      <Badge className={`${RISK_COLORS[e.risk]} border text-[9px] py-0`}>{e.risk} risk</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">{e.resource}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
                      <span>{e.actor}</span>
                      <span>IP: {e.ip}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    {format(e.ts, "MMM d HH:mm")}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}