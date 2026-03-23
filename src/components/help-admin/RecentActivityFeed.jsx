import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity, Edit2, CheckCircle2, Trash2, Plus, Sparkles, Eye,
  MessageSquare, RefreshCw, X
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const EVENT_CONFIG = {
  HELP_CONTENT_CREATED:   { icon: Plus,        color: "text-emerald-600", bg: "bg-emerald-50", label: "Content Created" },
  HELP_CONTENT_UPDATED:   { icon: Edit2,        color: "text-blue-600",    bg: "bg-blue-50",    label: "Content Updated" },
  HELP_CONTENT_ACTIVATED: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", label: "Activated" },
  HELP_CONTENT_DEACTIVATED:{ icon: Eye,         color: "text-slate-500",   bg: "bg-slate-50",   label: "Deactivated" },
  HELP_CONTENT_ARCHIVED:  { icon: Trash2,       color: "text-slate-400",   bg: "bg-slate-50",   label: "Archived" },
  HELP_CONTENT_APPROVED:  { icon: CheckCircle2, color: "text-emerald-700", bg: "bg-emerald-50", label: "Approved" },
  HELP_MANUAL_TOPIC_CREATED: { icon: Plus,      color: "text-indigo-600",  bg: "bg-indigo-50",  label: "Topic Created" },
  HELP_MANUAL_TOPIC_PUBLISHED: { icon: Eye,     color: "text-indigo-600",  bg: "bg-indigo-50",  label: "Topic Published" },
  HELP_AI_QUESTION_ASKED: { icon: MessageSquare,color: "text-purple-600",  bg: "bg-purple-50",  label: "AI Question" },
  HELP_AI_LOW_CONFIDENCE_FLAGGED: { icon: Sparkles, color: "text-amber-600", bg: "bg-amber-50", label: "Low Confidence" },
  HELP_TARGET_SCANNED:    { icon: RefreshCw,    color: "text-blue-500",    bg: "bg-blue-50",    label: "Target Scanned" },
  HELP_AI_REVIEW_RESOLVED:{ icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", label: "Review Resolved" },
};

export default function RecentActivityFeed({ onClose }) {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["help-audit-logs-recent"],
    queryFn: () => base44.entities.HelpAuditLog.list("-created_date", 40),
  });

  return (
    <Card className="border-border">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-muted-foreground" />
          <CardTitle className="text-sm">Recent Activity</CardTitle>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="w-3.5 h-3.5" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="max-h-80 overflow-y-auto space-y-1 pt-0">
        {isLoading && (
          <div className="space-y-1">
            {[...Array(5)].map((_, i) => <div key={i} className="h-8 rounded bg-muted animate-pulse" />)}
          </div>
        )}
        {!isLoading && logs.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">No activity logged yet.</p>
        )}
        {logs.map(log => {
          const cfg = EVENT_CONFIG[log.event_type] || { icon: Activity, color: "text-muted-foreground", bg: "bg-muted", label: log.event_type };
          const Icon = cfg.icon;
          return (
            <div key={log.id} className="flex items-start gap-2.5 py-1.5 px-2 rounded-lg hover:bg-muted/40 transition-colors group">
              <div className={`mt-0.5 p-1 rounded-md flex-shrink-0 ${cfg.bg}`}>
                <Icon className={`w-3 h-3 ${cfg.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-[10px] font-semibold ${cfg.color}`}>{cfg.label}</span>
                  {log.target_code && (
                    <span className="text-[9px] font-mono text-muted-foreground truncate max-w-[120px]">{log.target_code}</span>
                  )}
                </div>
                {log.notes && <p className="text-[10px] text-muted-foreground truncate">{log.notes}</p>}
                <div className="flex items-center gap-2 mt-0.5">
                  {log.actor_email && <span className="text-[9px] text-muted-foreground">{log.actor_email}</span>}
                  <span className="text-[9px] text-muted-foreground">
                    {log.created_date ? formatDistanceToNow(new Date(log.created_date), { addSuffix: true }) : ""}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}