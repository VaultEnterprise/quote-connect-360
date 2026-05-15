import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb, Send, AlertTriangle, Clock } from "lucide-react";

export default function ProposalWorkflowSuggestions({ proposals }) {
  const suggestions = [];

  // Drafts ready to send
  const readyDrafts = proposals.filter(p => p.status === "draft" && p.total_monthly_premium);
  if (readyDrafts.length > 0) {
    suggestions.push({
      type: "action",
      icon: Send,
      title: `Send ${readyDrafts.length} Draft${readyDrafts.length !== 1 ? "s" : ""}`,
      desc: "You have completed drafts ready to send to employers.",
      action: "Send Now",
      count: readyDrafts.length
    });
  }

  // Overdue follow-ups
  const overdueSent = proposals.filter(p => {
    if (p.status !== "sent" || !p.sent_at) return false;
    const sent = new Date(p.sent_at);
    const now = new Date();
    return (now - sent) > (7 * 24 * 60 * 60 * 1000); // 7 days
  });
  if (overdueSent.length > 0) {
    suggestions.push({
      type: "warning",
      icon: AlertTriangle,
      title: `Follow Up on ${overdueSent.length} Proposal${overdueSent.length !== 1 ? "s" : ""}`,
      desc: "These proposals were sent over a week ago with no response.",
      action: "Send Reminder",
      count: overdueSent.length
    });
  }

  // Expiring soon
  const expiringSoon = proposals.filter(p => {
    if (!p.expires_at) return false;
    const exp = new Date(p.expires_at);
    const now = new Date();
    const daysLeft = (exp - now) / (1000 * 60 * 60 * 24);
    return daysLeft > 0 && daysLeft <= 3;
  });
  if (expiringSoon.length > 0) {
    suggestions.push({
      type: "urgent",
      icon: Clock,
      title: `${expiringSoon.length} Proposal${expiringSoon.length !== 1 ? "s" : ""} Expiring Soon`,
      desc: "These proposals expire within 3 days.",
      action: "Extend Now",
      count: expiringSoon.length
    });
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {suggestions.map((s, i) => {
        const Icon = s.icon;
        const bgColor = s.type === "urgent" ? "bg-red-50 border-red-200" : s.type === "warning" ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200";
        const iconColor = s.type === "urgent" ? "text-red-600" : s.type === "warning" ? "text-amber-600" : "text-blue-600";
        const textColor = s.type === "urgent" ? "text-red-900" : s.type === "warning" ? "text-amber-900" : "text-blue-900";
        const btnVariant = s.type === "urgent" ? "bg-red-100 text-red-700 hover:bg-red-200" : s.type === "warning" ? "bg-amber-100 text-amber-700 hover:bg-amber-200" : "bg-blue-100 text-blue-700 hover:bg-blue-200";

        return (
          <Card key={i} className={`border ${bgColor}`}>
            <CardContent className="p-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <Icon className={`w-4 h-4 ${iconColor} flex-shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${textColor}`}>{s.title}</p>
                  <p className={`text-xs ${textColor} opacity-80 mt-0.5`}>{s.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge className={`text-[9px] py-0 ${btnVariant}`}>{s.count}</Badge>
                <Button size="sm" className={`text-xs h-7 ${btnVariant}`}>
                  {s.action}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}