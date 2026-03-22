import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Zap, Trash2, Edit2, CheckCircle2, Clock, Mail, Users } from "lucide-react";

const MOCK_RULES = [
  {
    id: "r1",
    name: "Auto-assign critical census exceptions",
    condition: "severity = critical AND category = census",
    action: "Assign to census_team@agency.com",
    enabled: true,
    trigger: "on_create",
    actionCount: 12,
    lastTriggered: "2026-03-22 10:30"
  },
  {
    id: "r2",
    name: "Auto-resolve carrier API timeouts after 48h",
    condition: "category = carrier AND description CONTAINS 'timeout'",
    action: "Resolve with note: 'Auto-resolved - carrier API recovered'",
    enabled: true,
    trigger: "scheduled_24h",
    actionCount: 3,
    lastTriggered: "2026-03-22 09:15"
  },
  {
    id: "r3",
    name: "Escalate overdue high-severity to manager",
    condition: "severity = high AND due_by < now() AND status NOT IN (resolved, dismissed)",
    action: "Reassign to manager; send Slack alert",
    enabled: true,
    trigger: "scheduled_4h",
    actionCount: 8,
    lastTriggered: "2026-03-22 11:00"
  },
  {
    id: "r4",
    name: "Auto-triage billing exceptions",
    condition: "category = billing AND severity NOT IN (critical, high)",
    action: "Assign priority=low; auto-tag 'review_batch'",
    enabled: false,
    trigger: "on_create",
    actionCount: 0,
    lastTriggered: null
  },
];

export default function ExceptionAutomationRules() {
  const [showCreate, setShowCreate] = useState(false);
  const [newRule, setNewRule] = useState({ name: "", condition: "", action: "", trigger: "on_create" });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Automation Rules</p>
          <p className="text-xs text-muted-foreground">Auto-assign, escalate, and resolve exceptions based on conditions</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(!showCreate)}>
          <Plus className="w-4 h-4" /> New Rule
        </Button>
      </div>

      {showCreate && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 space-y-3">
            <div>
              <label className="text-xs font-medium mb-1.5 block">Rule Name</label>
              <Input value={newRule.name} onChange={e => setNewRule(p => ({ ...p, name: e.target.value }))} placeholder="e.g., Auto-assign critical census issues" className="h-8 text-xs" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block">Condition (when to trigger)</label>
              <Input value={newRule.condition} onChange={e => setNewRule(p => ({ ...p, condition: e.target.value }))} placeholder="e.g., severity = critical AND category = census" className="h-8 text-xs font-mono" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block">Action (what to do)</label>
              <Input value={newRule.action} onChange={e => setNewRule(p => ({ ...p, action: e.target.value }))} placeholder="e.g., Assign to team_email@company.com" className="h-8 text-xs" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block">Trigger Timing</label>
              <Select value={newRule.trigger} onValueChange={v => setNewRule(p => ({ ...p, trigger: v }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="on_create">On exception created</SelectItem>
                  <SelectItem value="scheduled_4h">Every 4 hours</SelectItem>
                  <SelectItem value="scheduled_24h">Daily (midnight UTC)</SelectItem>
                  <SelectItem value="on_status_change">On status change</SelectItem>
                </SelectContent>
              </Select>
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
          <Card key={rule.id} className={rule.enabled ? "" : "opacity-60"}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="text-xs font-semibold">{rule.name}</p>
                    <Badge className={rule.enabled ? "bg-green-100 text-green-700 border-green-200 border text-[9px] py-0" : "bg-muted text-muted-foreground border text-[9px] py-0"}>
                      {rule.enabled ? "Active" : "Disabled"}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-mono mb-1.5">{rule.condition}</p>
                  <p className="text-[10px] text-muted-foreground mb-1.5">{rule.action}</p>
                  <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Zap className="w-2.5 h-2.5" /> {rule.trigger}</span>
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5" /> {rule.actionCount} executions</span>
                    {rule.lastTriggered && <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {rule.lastTriggered}</span>}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Edit2 className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}