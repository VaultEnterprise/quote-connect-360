import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, Play, CheckCircle2, XCircle, Clock } from "lucide-react";

const DEFAULT_POLICY = {
  max_attempts: 3,
  base_delay_seconds: 1.0,
  backoff_multiplier: 2.0,
  retryable_status_codes: "408, 429, 500, 502, 503, 504",
};

const ADAPTER_POLICIES = [
  { adapter: "carrier_submission_send", max_attempts: 4, base_delay: 1.5, multiplier: 2.0, last_triggered: "2026-03-21 09:14", attempts_used: 2, outcome: "success" },
  { adapter: "docusign_send_packet", max_attempts: 3, base_delay: 1.0, multiplier: 2.0, last_triggered: "2026-03-21 08:47", attempts_used: 1, outcome: "success" },
  { adapter: "tpa_export_send", max_attempts: 3, base_delay: 1.0, multiplier: 2.0, last_triggered: "2026-03-20 16:33", attempts_used: 3, outcome: "failed" },
  { adapter: "payroll_deduction_send", max_attempts: 4, base_delay: 2.0, multiplier: 2.0, last_triggered: "2026-03-20 14:10", attempts_used: 1, outcome: "success" },
  { adapter: "billing_setup_send", max_attempts: 3, base_delay: 1.0, multiplier: 2.0, last_triggered: "2026-03-19 11:55", attempts_used: 2, outcome: "success" },
  { adapter: "notification_email_send", max_attempts: 2, base_delay: 0.5, multiplier: 1.5, last_triggered: "2026-03-21 10:02", attempts_used: 1, outcome: "success" },
];

function backoffSchedule(base, multiplier, max) {
  const steps = [];
  for (let i = 0; i < max; i++) {
    steps.push((base * Math.pow(multiplier, i)).toFixed(1) + "s");
  }
  return steps;
}

export default function RetryMiddlewarePanel() {
  const [policy, setPolicy] = useState(DEFAULT_POLICY);
  const [simRunning, setSimRunning] = useState(false);
  const [simSteps, setSimSteps] = useState([]);

  const setP = (k, v) => setPolicy(p => ({ ...p, [k]: v }));

  const runSim = () => {
    setSimRunning(true);
    setSimSteps([]);
    const schedule = backoffSchedule(parseFloat(policy.base_delay_seconds), parseFloat(policy.backoff_multiplier), parseInt(policy.max_attempts));
    schedule.forEach((delay, i) => {
      setTimeout(() => {
        const isLast = i === schedule.length - 1;
        setSimSteps(prev => [...prev, {
          attempt: i + 1,
          delay,
          status: isLast ? "failed" : "retrying",
          label: isLast ? `Attempt ${i + 1} — exhausted, throw` : `Attempt ${i + 1} → wait ${delay} + jitter`,
        }]);
        if (isLast) setSimRunning(false);
      }, i * 600);
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Policy Editor */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><RefreshCw className="w-4 h-4 text-primary" /> RetryPolicy Configuration</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">max_attempts</Label><Input type="number" value={policy.max_attempts} onChange={e => setP("max_attempts", e.target.value)} className="mt-1 h-8 text-xs font-mono" /></div>
              <div><Label className="text-xs">base_delay_seconds</Label><Input type="number" step="0.5" value={policy.base_delay_seconds} onChange={e => setP("base_delay_seconds", e.target.value)} className="mt-1 h-8 text-xs font-mono" /></div>
              <div><Label className="text-xs">backoff_multiplier</Label><Input type="number" step="0.5" value={policy.backoff_multiplier} onChange={e => setP("backoff_multiplier", e.target.value)} className="mt-1 h-8 text-xs font-mono" /></div>
            </div>
            <div><Label className="text-xs">retryable_status_codes</Label>
              <Input value={policy.retryable_status_codes} onChange={e => setP("retryable_status_codes", e.target.value)} className="mt-1 h-8 text-xs font-mono" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Backoff schedule preview</Label>
              <div className="flex gap-2 mt-1 flex-wrap">
                {backoffSchedule(parseFloat(policy.base_delay_seconds), parseFloat(policy.backoff_multiplier), parseInt(policy.max_attempts)).map((d, i) => (
                  <Badge key={i} variant="outline" className="font-mono text-[10px]">attempt {i + 1}: +{d}</Badge>
                ))}
              </div>
            </div>
            <Button size="sm" onClick={runSim} disabled={simRunning}>
              <Play className="w-3.5 h-3.5 mr-1.5" />
              {simRunning ? "Simulating..." : "Simulate Failure Sequence"}
            </Button>
          </CardContent>
        </Card>

        {/* Simulation Output */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Retry Simulation Output</CardTitle></CardHeader>
          <CardContent>
            {simSteps.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Run a simulation to see the retry sequence play out in real time.</p>
            ) : (
              <div className="space-y-2">
                {simSteps.map((step, i) => (
                  <div key={i} className={`flex items-center gap-2 p-2 rounded-lg text-xs font-mono border ${step.status === "failed" ? "border-red-200 bg-red-50/50 text-red-700" : "border-amber-200 bg-amber-50/50 text-amber-700"}`}>
                    {step.status === "failed" ? <XCircle className="w-3.5 h-3.5 flex-shrink-0" /> : <RefreshCw className="w-3.5 h-3.5 flex-shrink-0" />}
                    {step.label}
                  </div>
                ))}
                {!simRunning && simSteps.length > 0 && (
                  <div className="p-2 rounded-lg border border-red-300 bg-red-50 text-xs text-red-700 font-mono">
                    RuntimeError: Retry execution exhausted without result.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Per-adapter history */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Adapter Retry History</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {ADAPTER_POLICIES.map(a => (
              <div key={a.adapter} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                {a.outcome === "success"
                  ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  : <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono font-medium">{a.adapter}</p>
                  <p className="text-[10px] text-muted-foreground">max {a.max_attempts} attempts · base {a.base_delay}s · ×{a.multiplier}</p>
                </div>
                <div className="flex items-center gap-3 text-xs flex-shrink-0">
                  <Badge variant="outline" className={`text-[10px] ${a.attempts_used > 1 ? "border-amber-300 text-amber-700" : ""}`}>
                    {a.attempts_used}/{a.max_attempts} attempts
                  </Badge>
                  <span className="text-muted-foreground">{a.last_triggered}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}