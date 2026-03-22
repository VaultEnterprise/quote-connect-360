import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Mail, Tag, Users, Zap } from "lucide-react";

export default function ExceptionBulkActionsPanel({ selectedCount, onAction }) {
  const [action, setAction] = useState("assign");
  const [assignEmail, setAssignEmail] = useState("");
  const [bulkTag, setBulkTag] = useState("");

  const handleExecute = () => {
    if (action === "assign" && !assignEmail) return;
    if (action === "tag" && !bulkTag) return;
    onAction?.(action, { email: assignEmail, tag: bulkTag });
    setAssignEmail("");
    setBulkTag("");
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">{selectedCount} selected</span>
          </div>

          <Select value={action} onValueChange={setAction}>
            <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="assign"><Users className="w-3 h-3 mr-1 inline" /> Assign to</SelectItem>
              <SelectItem value="status"><Zap className="w-3 h-3 mr-1 inline" /> Change status</SelectItem>
              <SelectItem value="tag"><Tag className="w-3 h-3 mr-1 inline" /> Add tag</SelectItem>
              <SelectItem value="notify"><Mail className="w-3 h-3 mr-1 inline" /> Send notification</SelectItem>
            </SelectContent>
          </Select>

          {action === "assign" && (
            <Input
              value={assignEmail}
              onChange={e => setAssignEmail(e.target.value)}
              placeholder="user@example.com"
              className="h-8 text-xs font-mono flex-1 min-w-[150px]"
            />
          )}
          {action === "tag" && (
            <Input
              value={bulkTag}
              onChange={e => setBulkTag(e.target.value)}
              placeholder="e.g., urgent_review"
              className="h-8 text-xs flex-1 min-w-[150px]"
            />
          )}

          <Button size="sm" onClick={handleExecute} className="gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Apply to {selectedCount}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}