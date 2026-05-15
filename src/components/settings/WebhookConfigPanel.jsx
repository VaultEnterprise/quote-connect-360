import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, Plus, Trash2, Copy, CheckCircle2, XCircle, Edit2 } from "lucide-react";

const MOCK_WEBHOOKS = [
  { id: "wh1", url: "https://payroll.acme.com/webhooks/benefits", events: ["enrollment.completed", "enrollment.waived"], status: "active", lastDelivery: "2026-03-22 10:15" },
  { id: "wh2", url: "https://crm.mycompany.com/hooks/cq360", events: ["case.updated", "proposal.sent"], status: "active", lastDelivery: "2026-03-22 09:30" },
  { id: "wh3", url: "https://backup-system.com/webhooks", events: ["enrollment.completed"], status: "inactive", lastDelivery: "2026-03-20 14:22" },
];

export default function WebhookConfigPanel() {
  const [webhooks, setWebhooks] = useState(MOCK_WEBHOOKS);
  const [showCreate, setShowCreate] = useState(false);
  const [newWebhook, setNewWebhook] = useState({ url: "", events: [] });

  const toggleWebhook = (id) => {
    setWebhooks(prev => prev.map(wh =>
      wh.id === id ? { ...wh, status: wh.status === "active" ? "inactive" : "active" } : wh
    ));
  };

  const removeWebhook = (id) => {
    setWebhooks(prev => prev.filter(wh => wh.id !== id));
  };

  const addWebhook = () => {
    if (!newWebhook.url || newWebhook.events.length === 0) return;
    setWebhooks(prev => [...prev, {
      id: `wh${prev.length + 1}`,
      ...newWebhook,
      status: "active",
      lastDelivery: null
    }]);
    setNewWebhook({ url: "", events: [] });
    setShowCreate(false);
  };

  const EVENTS = [
    "enrollment.started",
    "enrollment.completed",
    "enrollment.waived",
    "case.created",
    "case.updated",
    "case.closed",
    "proposal.sent",
    "proposal.approved",
    "proposal.rejected",
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Webhooks</p>
          <p className="text-xs text-muted-foreground">Push real-time events to external systems</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(!showCreate)}>
          <Plus className="w-4 h-4" /> Add Webhook
        </Button>
      </div>

      {showCreate && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 space-y-3">
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Webhook URL</Label>
              <Input
                value={newWebhook.url}
                onChange={e => setNewWebhook(p => ({ ...p, url: e.target.value }))}
                placeholder="https://..."
                className="h-8 text-xs font-mono"
              />
            </div>
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Subscribe to Events</Label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 bg-background rounded border border-input">
                {EVENTS.map(event => (
                  <label key={event} className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newWebhook.events.includes(event)}
                      onChange={e => setNewWebhook(p => ({
                        ...p,
                        events: e.target.checked
                          ? [...p.events, event]
                          : p.events.filter(x => x !== event)
                      }))}
                      className="rounded"
                    />
                    {event}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={addWebhook}>Add Webhook</Button>
              <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {webhooks.map(wh => (
          <Card key={wh.id} className={wh.status === "active" ? "" : "opacity-60"}>
            <CardContent className="p-4 flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <code className="text-xs font-mono text-foreground bg-muted px-2 py-0.5 rounded truncate max-w-xs">{wh.url}</code>
                  <Badge className={wh.status === "active" ? "bg-green-100 text-green-700 border-green-200 border text-[9px] py-0" : "bg-muted text-muted-foreground border text-[9px] py-0"}>
                    {wh.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {wh.events.map(e => (
                    <Badge key={e} variant="outline" className="text-[9px] font-mono py-0">{e}</Badge>
                  ))}
                </div>
                {wh.lastDelivery && (
                  <p className="text-[10px] text-muted-foreground">Last delivery: {wh.lastDelivery}</p>
                )}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Edit2 className="w-3 h-3" /></Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1"
                  onClick={() => toggleWebhook(wh.id)}
                >
                  {wh.status === "active" ? "Disable" : "Enable"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeWebhook(wh.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}