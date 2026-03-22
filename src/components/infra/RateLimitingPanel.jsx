import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Gauge, AlertTriangle, TrendingUp, Settings, Plus, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const USAGE_DATA = [
  { time: "00:00", requests: 420, limit: 1000 },
  { time: "04:00", requests: 180, limit: 1000 },
  { time: "08:00", requests: 750, limit: 1000 },
  { time: "10:00", requests: 980, limit: 1000 },
  { time: "12:00", requests: 640, limit: 1000 },
  { time: "14:00", requests: 870, limit: 1000 },
  { time: "16:00", requests: 920, limit: 1000 },
  { time: "18:00", requests: 510, limit: 1000 },
  { time: "20:00", requests: 340, limit: 1000 },
  { time: "22:00", requests: 220, limit: 1000 },
];

const MOCK_RULES = [
  { id: "r1", scope: "Global", key: "per_api_key", limit: 1000, window: "1 min", burst: 1200, current: 342, status: "ok" },
  { id: "r2", scope: "Endpoint", key: "/api/census/:id/upload", limit: 10, window: "1 min", burst: 15, current: 3, status: "ok" },
  { id: "r3", scope: "Endpoint", key: "/api/quotes/:id/run", limit: 5, window: "1 min", burst: 8, current: 4, status: "warning" },
  { id: "r4", scope: "IP", key: "per_ip_address", limit: 200, window: "1 min", burst: 250, current: 198, status: "warning" },
  { id: "r5", scope: "Org", key: "per_organization", limit: 10000, window: "1 hr", burst: 12000, current: 2840, status: "ok" },
];

const THROTTLE_STRATEGIES = [
  { name: "Token Bucket", desc: "Smooth request flow with burst allowance. Best for interactive APIs.", recommended: true },
  { name: "Fixed Window", desc: "Simple counter reset per window. Risk of thundering herd at boundary.", recommended: false },
  { name: "Sliding Window Log", desc: "Most accurate. Stores per-request timestamps. Higher memory use.", recommended: false },
  { name: "Sliding Window Counter", desc: "Good balance of accuracy vs memory. Uses two fixed windows.", recommended: false },
];

function StatusBar({ current, limit, burst }) {
  const pct = Math.min((current / limit) * 100, 100);
  const color = pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-400" : "bg-green-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap">{current}/{limit}</span>
    </div>
  );
}

export default function RateLimitingPanel() {
  const [showCreate, setShowCreate] = useState(false);
  const [strategy, setStrategy] = useState("Token Bucket");

  return (
    <div className="space-y-5">
      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Req / Min (now)", value: "342", sub: "of 1,000 global limit", color: "text-green-600" },
          { label: "429 Rate (24h)", value: "0.3%", sub: "12 throttled requests", color: "text-amber-600" },
          { label: "Burst Headroom", value: "658", sub: "requests available", color: "text-primary" },
          { label: "Active Keys", value: "3", sub: "consuming quota", color: "text-foreground" },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{k.label}</p>
              <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
              <p className="text-[10px] text-muted-foreground">{k.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Usage Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Request Rate — Last 24h
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={USAGE_DATA} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Bar dataKey="requests" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} name="Requests" />
              <Bar dataKey="limit" fill="hsl(var(--destructive)/0.15)" radius={[3, 3, 0, 0]} name="Limit" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Throttle strategy */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Settings className="w-4 h-4 text-primary" /> Throttle Strategy</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {THROTTLE_STRATEGIES.map(s => (
            <button key={s.name} onClick={() => setStrategy(s.name)}
              className={`text-left p-3 rounded-lg border transition-all ${strategy === s.name ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs font-semibold">{s.name}</p>
                {s.recommended && <Badge className="text-[9px] bg-green-100 text-green-700 border-green-200 border py-0">Recommended</Badge>}
                {strategy === s.name && <Badge className="text-[9px] bg-primary/20 text-primary border-primary/30 border py-0 ml-auto">Active</Badge>}
              </div>
              <p className="text-[10px] text-muted-foreground">{s.desc}</p>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Rate limit rules */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Rate Limit Rules</p>
          <p className="text-xs text-muted-foreground">Per-key, per-endpoint, and per-org limits</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(!showCreate)}>
          <Plus className="w-4 h-4" /> Add Rule
        </Button>
      </div>

      {showCreate && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1.5 block">Scope</label>
                <Select>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select scope" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global</SelectItem>
                    <SelectItem value="endpoint">Endpoint</SelectItem>
                    <SelectItem value="ip">IP Address</SelectItem>
                    <SelectItem value="org">Organization</SelectItem>
                    <SelectItem value="key">API Key</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block">Window</label>
                <Select>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Time window" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1s">1 second</SelectItem>
                    <SelectItem value="1m">1 minute</SelectItem>
                    <SelectItem value="1h">1 hour</SelectItem>
                    <SelectItem value="1d">1 day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block">Request Limit</label>
                <Input type="number" placeholder="1000" className="h-8 text-xs" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block">Burst Limit</label>
                <Input type="number" placeholder="1200" className="h-8 text-xs" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm">Save Rule</Button>
              <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {MOCK_RULES.map(rule => (
          <Card key={rule.id}>
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[9px] font-mono py-0">{rule.scope}</Badge>
                  <code className="text-xs font-mono text-foreground">{rule.key}</code>
                  <Badge className={rule.status === "warning" ? "bg-amber-100 text-amber-700 border-amber-200 border text-[9px] py-0" : "bg-green-100 text-green-700 border-green-200 border text-[9px] py-0"}>
                    {rule.status === "warning" ? "Near Limit" : "OK"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>Limit: <strong className="text-foreground">{rule.limit}</strong></span>
                  <span>Window: <strong className="text-foreground">{rule.window}</strong></span>
                  <span>Burst: <strong className="text-foreground">{rule.burst}</strong></span>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
              <StatusBar current={rule.current} limit={rule.limit} burst={rule.burst} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}