import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import RetryMiddlewarePanel from "@/components/infra/RetryMiddlewarePanel";
import IdempotencyPanel from "@/components/infra/IdempotencyPanel";
import StructuredLoggerPanel from "@/components/infra/StructuredLoggerPanel";
import SecretsProviderPanel from "@/components/infra/SecretsProviderPanel";
import EndpointHealthPanel from "@/components/infra/EndpointHealthPanel";
import PayloadValidatorPanel from "@/components/infra/PayloadValidatorPanel";
import { RefreshCw, Shield, CheckCircle2, AlertCircle, XCircle } from "lucide-react";

const LAYERS = [
  { id: "health", label: "Endpoint Health", shortLabel: "Health" },
  { id: "retry", label: "Retry Middleware", shortLabel: "Retry" },
  { id: "idempotency", label: "Idempotency", shortLabel: "Idempotency" },
  { id: "logger", label: "Structured Logger", shortLabel: "Logger" },
  { id: "secrets", label: "Secrets Provider", shortLabel: "Secrets" },
  { id: "validators", label: "Payload Validators", shortLabel: "Validators" },
];

function OverallStatusBadge({ status }) {
  if (status === "healthy") return <Badge className="bg-green-100 text-green-700 border-green-200 border">All Systems Healthy</Badge>;
  if (status === "degraded") return <Badge className="bg-amber-100 text-amber-700 border-amber-200 border">Degraded</Badge>;
  return <Badge className="bg-red-100 text-red-700 border-red-200 border">Issues Detected</Badge>;
}

export default function IntegrationInfrastructure() {
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [overallStatus, setOverallStatus] = useState("healthy");

  const handleRefresh = () => setLastRefresh(new Date());

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integration Infrastructure"
        description="Production hardening layer · QC360 adapter runtime"
        actions={
          <div className="flex items-center gap-3">
            <OverallStatusBadge status={overallStatus} />
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Stack diagram */}
      <StackDiagram />

      <Tabs defaultValue="health">
        <TabsList className="bg-muted/50 flex-wrap h-auto gap-1">
          {LAYERS.map(l => (
            <TabsTrigger key={l.id} value={l.id} className="text-xs">{l.shortLabel}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="health" className="mt-4">
          <EndpointHealthPanel lastRefresh={lastRefresh} onStatusChange={setOverallStatus} />
        </TabsContent>
        <TabsContent value="retry" className="mt-4">
          <RetryMiddlewarePanel />
        </TabsContent>
        <TabsContent value="idempotency" className="mt-4">
          <IdempotencyPanel />
        </TabsContent>
        <TabsContent value="logger" className="mt-4">
          <StructuredLoggerPanel />
        </TabsContent>
        <TabsContent value="secrets" className="mt-4">
          <SecretsProviderPanel />
        </TabsContent>
        <TabsContent value="validators" className="mt-4">
          <PayloadValidatorPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StackDiagram() {
  const layers = [
    { label: "Base44 UI", sub: "React frontend", color: "bg-primary/10 border-primary/30 text-primary" },
    { label: "QC360 Services", sub: "Census · Quote · Proposal · Enrollment · Install · Renewal", color: "bg-accent/10 border-accent/30 text-accent-foreground" },
    { label: "Hardening Middleware", sub: "Retry · Idempotency · Validation · Logging · Secrets", color: "bg-amber-50 border-amber-200 text-amber-800", highlight: true },
    { label: "Adapter Layer", sub: "DocuSign · Carrier · TPA · Payroll · Billing · Notifications", color: "bg-purple-50 border-purple-200 text-purple-800" },
    { label: "PostgreSQL Repositories", sub: "Audit · Census · Quote · Proposal · Enrollment · Install · Renewal", color: "bg-slate-100 border-slate-300 text-slate-700" },
    { label: "External Endpoints", sub: "DocuSign API · Carrier APIs · TPA · Payroll · Billing", color: "bg-green-50 border-green-200 text-green-800" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          QC360 Runtime Stack
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-0">
          {layers.map((layer, i) => (
            <React.Fragment key={layer.label}>
              <div className={`w-full max-w-2xl border rounded-lg px-4 py-2.5 text-center ${layer.color} ${layer.highlight ? "ring-2 ring-amber-400 ring-offset-1 shadow-sm" : ""}`}>
                <p className="text-xs font-semibold">{layer.label}</p>
                <p className="text-[10px] opacity-70 mt-0.5">{layer.sub}</p>
                {layer.highlight && (
                  <Badge className="mt-1 text-[9px] bg-amber-200 text-amber-800 border-amber-300 border py-0">
                    ← You are here
                  </Badge>
                )}
              </div>
              {i < layers.length - 1 && (
                <div className="w-px h-3 bg-border" />
              )}
            </React.Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}