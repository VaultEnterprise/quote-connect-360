import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, Clock, Wifi } from "lucide-react";

const ENDPOINTS = [
  { name: "DocuSign API", url: "https://demo.docusign.net/restapi/v2.1", category: "e-sign", healthPath: "/ping" },
  { name: "Carrier Submission", url: "https://carrier.example.com/api", category: "carrier", healthPath: "/health" },
  { name: "TPA Export", url: "https://tpa.example.com/api", category: "tpa", healthPath: "/health" },
  { name: "Payroll Deductions", url: "https://payroll.example.com/api", category: "payroll", healthPath: "/health" },
  { name: "Billing Setup", url: "https://billing.example.com/api", category: "billing", healthPath: "/health" },
  { name: "Email Service", url: "https://email.example.com", category: "notification", healthPath: "/health" },
  { name: "SMS Gateway", url: "https://sms.example.com", category: "notification", healthPath: "/status" },
  { name: "Employee Portal API", url: "https://portal.example.com/api", category: "portal", healthPath: "/health" },
];

function simulateHealth(name) {
  const seed = name.length % 5;
  if (seed === 4) return { healthy: false, status_code: 503, latency_ms: 1240, message: "Service Unavailable" };
  if (seed === 2) return { healthy: true, status_code: 200, latency_ms: 380 + Math.random() * 200, message: "ok" };
  return { healthy: true, status_code: 200, latency_ms: 80 + Math.random() * 150, message: "ok" };
}

export default function EndpointHealthPanel({ lastRefresh, onStatusChange }) {
  const [results, setResults] = useState([]);
  const [checking, setChecking] = useState(false);
  const [checkedAt, setCheckedAt] = useState(null);

  const runChecks = () => {
    setChecking(true);
    setTimeout(() => {
      const r = ENDPOINTS.map(ep => ({ ...ep, ...simulateHealth(ep.name) }));
      setResults(r);
      setCheckedAt(new Date());
      setChecking(false);
      const unhealthy = r.filter(x => !x.healthy).length;
      onStatusChange?.(unhealthy === 0 ? "healthy" : unhealthy > 2 ? "down" : "degraded");
    }, 900);
  };

  useEffect(() => { runChecks(); }, [lastRefresh]);

  const healthy = results.filter(r => r.healthy).length;
  const unhealthy = results.filter(r => !r.healthy).length;

  const latencyColor = (ms) => {
    if (!ms) return "text-muted-foreground";
    if (ms < 150) return "text-green-600";
    if (ms < 400) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-50"><CheckCircle2 className="w-4 h-4 text-green-600" /></div>
          <div><p className="text-xl font-bold text-green-600">{healthy}</p><p className="text-xs text-muted-foreground">Healthy</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-50"><XCircle className="w-4 h-4 text-destructive" /></div>
          <div><p className="text-xl font-bold text-destructive">{unhealthy}</p><p className="text-xs text-muted-foreground">Unhealthy</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50"><Wifi className="w-4 h-4 text-blue-600" /></div>
          <div>
            <p className="text-xl font-bold text-blue-600">
              {results.length > 0 ? Math.round(results.reduce((a, r) => a + (r.latency_ms || 0), 0) / results.length) : "—"}ms
            </p>
            <p className="text-xs text-muted-foreground">Avg Latency</p>
          </div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Wifi className="w-4 h-4 text-primary" /> Endpoint Status
            </CardTitle>
            <div className="flex items-center gap-2">
              {checkedAt && <span className="text-xs text-muted-foreground">Checked {checkedAt.toLocaleTimeString()}</span>}
              <Button variant="outline" size="sm" onClick={runChecks} disabled={checking}>
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${checking ? "animate-spin" : ""}`} />
                {checking ? "Checking..." : "Re-check All"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {checking ? (
            <div className="space-y-2">
              {ENDPOINTS.map(ep => (
                <div key={ep.name} className="flex items-center gap-3 p-3 rounded-lg border border-dashed bg-muted/30 animate-pulse">
                  <div className="w-3 h-3 rounded-full bg-muted" />
                  <span className="text-sm text-muted-foreground">{ep.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {results.map(r => (
                <div key={r.name} className={`flex items-center gap-3 p-3 rounded-lg border ${r.healthy ? "border-green-200 bg-green-50/30" : "border-red-200 bg-red-50/30"}`}>
                  {r.healthy
                    ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    : <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{r.name}</span>
                      <Badge variant="outline" className="text-[10px] py-0">{r.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{r.url}{r.healthPath}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs flex-shrink-0">
                    {r.status_code && (
                      <span className={r.healthy ? "text-green-600 font-mono" : "text-destructive font-mono"}>{r.status_code}</span>
                    )}
                    {r.latency_ms && (
                      <span className={`font-mono ${latencyColor(r.latency_ms)}`}>{Math.round(r.latency_ms)}ms</span>
                    )}
                    {!r.healthy && r.message && (
                      <span className="text-destructive">{r.message}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}