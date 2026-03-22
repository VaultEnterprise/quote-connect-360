import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Mail, MessageSquare, Slack, Plus, Trash2 } from "lucide-react";

const NOTIFICATION_CHANNELS = [
  { id: "email", name: "Email", icon: Mail, desc: "Send to your inbox" },
  { id: "slack", name: "Slack", icon: Slack, desc: "Post to Slack channel" },
  { id: "sms", name: "SMS", icon: MessageSquare, desc: "Text message alert" },
  { id: "webhook", name: "Webhook", icon: Bell, desc: "Custom HTTP endpoint" },
];

export default function ExceptionNotificationSettings() {
  const [channels, setChannels] = useState([
    { id: "email_1", type: "email", config: "alice@company.com", severity: ["critical", "high"], active: true },
    { id: "slack_1", type: "slack", config: "#exceptions-critical", severity: ["critical"], active: true },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [newChannel, setNewChannel] = useState({ type: "email", config: "", severity: [] });

  const addChannel = () => {
    if (!newChannel.config) return;
    setChannels(prev => [...prev, { id: `${newChannel.type}_${Date.now()}`, ...newChannel, active: true }]);
    setNewChannel({ type: "email", config: "", severity: [] });
    setShowAdd(false);
  };

  const removeChannel = (id) => {
    setChannels(prev => prev.filter(c => c.id !== id));
  };

  const toggleChannel = (id) => {
    setChannels(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" /> Notification Rules
          </p>
          <p className="text-xs text-muted-foreground">Configure alerts for exceptions based on severity</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="w-4 h-4" /> Add Channel
        </Button>
      </div>

      {showAdd && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 space-y-3">
            <div>
              <label className="text-xs font-medium mb-1.5 block">Channel Type</label>
              <Select value={newChannel.type} onValueChange={t => setNewChannel(p => ({ ...p, type: t }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {NOTIFICATION_CHANNELS.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block">
                {newChannel.type === "email" ? "Email Address" : newChannel.type === "slack" ? "Slack Channel" : "Webhook URL"}
              </label>
              <Input
                value={newChannel.config}
                onChange={e => setNewChannel(p => ({ ...p, config: e.target.value }))}
                placeholder={newChannel.type === "email" ? "user@example.com" : newChannel.type === "slack" ? "#channel-name" : "https://..."}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block">Alert on severity</label>
              <div className="flex gap-2">
                {["critical", "high", "medium", "low"].map(s => (
                  <button
                    key={s}
                    onClick={() => setNewChannel(p => ({ ...p, severity: p.severity.includes(s) ? p.severity.filter(x => x !== s) : [...p.severity, s] }))}
                    className={`text-xs px-2.5 py-1 rounded border transition-colors capitalize ${newChannel.severity.includes(s) ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={addChannel}>Save Channel</Button>
              <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {channels.map(c => {
          const channelInfo = NOTIFICATION_CHANNELS.find(x => x.id === c.type);
          const Icon = channelInfo?.icon;
          return (
            <Card key={c.id}>
              <CardContent className="p-3 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {Icon && <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-xs font-semibold">{channelInfo?.name}</p>
                      {c.active && <Badge className="text-[8px] bg-green-100 text-green-700 border-green-200 border py-0">Active</Badge>}
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">{c.config}</p>
                    <div className="flex gap-1 mt-1">
                      {c.severity.map(s => (
                        <Badge key={s} variant="outline" className="text-[8px] py-0 capitalize">{s}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Switch checked={c.active} onCheckedChange={() => toggleChannel(c.id)} />
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => removeChannel(c.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}