import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut, Search, Download, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

const MOCK_LOGS = [
  { id: "1", actor: "alice@agency.com", action: "Toggle API", resource: "DocuSign Integration (enabled)", ts: new Date(Date.now() - 2 * 60 * 60 * 1000), risk: "low" },
  { id: "2", actor: "bob@agency.com", action: "Change Feature", resource: "GradientAI Risk Scoring (disabled)", ts: new Date(Date.now() - 5 * 60 * 60 * 1000), risk: "medium" },
  { id: "3", actor: "alice@agency.com", action: "Update Branding", resource: "Portal Logo changed", ts: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), risk: "low" },
  { id: "4", actor: "admin@agency.com", action: "Rotate API Key", resource: "Stripe API Key rotated", ts: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), risk: "high" },
  { id: "5", actor: "charlie@agency.com", action: "Invite User", resource: "invited sarah@company.com as broker_admin", ts: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), risk: "medium" },
];

export default function AuditLogPanel() {
  const [logs, setLogs] = useState(MOCK_LOGS);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("all");

  const filtered = logs.filter(log => {
    const matchSearch = !search || log.actor.includes(search) || log.resource.includes(search);
    const matchAction = filterAction === "all" || log.action === filterAction;
    return matchSearch && matchAction;
  });

  const actions = [...new Set(logs.map(l => l.action))];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-sm font-semibold">Audit Log</p>
          <p className="text-xs text-muted-foreground">All changes to settings, features, and integrations are logged</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Download className="w-3.5 h-3.5" /> Export Log
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by actor or resource..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-8 text-xs"
          />
        </div>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {actions.map(a => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Logs */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">No logs match your filters.</div>
            ) : (
              filtered.map(log => (
                <div key={log.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-semibold">{log.action}</p>
                        <Badge
                          className={log.risk === "high"
                            ? "bg-red-100 text-red-700 border-red-200 border text-[8px] py-0"
                            : log.risk === "medium"
                              ? "bg-amber-100 text-amber-700 border-amber-200 border text-[8px] py-0"
                              : "bg-green-100 text-green-700 border-green-200 border text-[8px] py-0"}
                        >
                          {log.risk}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">{log.resource}</p>
                      <div className="flex items-center gap-3 mt-2 text-[9px] text-muted-foreground">
                        <span>{log.actor}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> {format(log.ts, "MMM d, h:mm a")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}