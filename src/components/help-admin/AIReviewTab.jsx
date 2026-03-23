import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, AlertCircle, Sparkles, MessageSquare, TrendingUp } from "lucide-react";
import { HELP_TARGETS } from "@/lib/helpTargetRegistry";

export default function AIReviewTab({ onEditTarget }) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("pending");

  const { data: aiLogs = [] } = useQuery({
    queryKey: ["helpai-logs-all"],
    queryFn: () => base44.entities.HelpAIQuestionLog.list("-created_date", 100),
  });

  const pending = aiLogs.filter(l => l.requires_admin_review && !l.reviewed_by_admin);
  const reviewed = aiLogs.filter(l => l.reviewed_by_admin);
  const lowConf = aiLogs.filter(l => (l.confidence_score || 0) < 0.4);
  const unanswered = aiLogs.filter(l => l.answer_status === "unanswered");

  const shown = filter === "pending" ? pending
    : filter === "low_confidence" ? lowConf
    : filter === "unanswered" ? unanswered
    : filter === "reviewed" ? reviewed
    : aiLogs;

  const markReviewed = async (log) => {
    await base44.entities.HelpAIQuestionLog.update(log.id, { reviewed_by_admin: true, requires_admin_review: false });
    queryClient.invalidateQueries({ queryKey: ["helpai-logs-all"] });
    queryClient.invalidateQueries({ queryKey: ["helpai-logs"] });
  };

  const confColor = (score) => {
    if (!score) return "bg-red-100 text-red-700";
    if (score >= 0.7) return "bg-emerald-100 text-emerald-700";
    if (score >= 0.4) return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <div className="space-y-4">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Pending Review", value: pending.length, color: "text-red-600", filter: "pending" },
          { label: "Low Confidence", value: lowConf.length, color: "text-amber-600", filter: "low_confidence" },
          { label: "Unanswered", value: unanswered.length, color: "text-orange-600", filter: "unanswered" },
          { label: "Reviewed", value: reviewed.length, color: "text-emerald-600", filter: "reviewed" },
        ].map(kpi => (
          <Card key={kpi.label} className="cursor-pointer hover:border-primary/40" onClick={() => setFilter(kpi.filter)}>
            <CardContent className="p-3 text-center">
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-muted-foreground" />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending Review ({pending.length})</SelectItem>
            <SelectItem value="low_confidence">Low Confidence ({lowConf.length})</SelectItem>
            <SelectItem value="unanswered">Unanswered ({unanswered.length})</SelectItem>
            <SelectItem value="reviewed">Reviewed ({reviewed.length})</SelectItem>
            <SelectItem value="all">All Questions ({aiLogs.length})</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{shown.length} items</span>
      </div>

      {/* Log items */}
      {shown.length === 0 ? (
        <Card className="text-center py-10">
          <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400/40 mb-2" />
          <p className="text-sm text-muted-foreground">
            {filter === "pending" ? "No items pending review." : "No items in this filter."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {shown.map(log => (
            <Card key={log.id} className={log.requires_admin_review && !log.reviewed_by_admin ? "border-amber-200" : ""}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        {log.page_code || "Unknown page"} · {log.user_email || "Anonymous"} · {log.created_date ? new Date(log.created_date).toLocaleDateString() : ""}
                      </p>
                    </div>
                    <p className="font-semibold text-sm">"{log.question_text}"</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <Badge className={`text-[9px] ${confColor(log.confidence_score)}`}>
                      {log.confidence_score !== undefined ? `${Math.round((log.confidence_score || 0) * 100)}% conf` : "No score"}
                    </Badge>
                    {log.answer_status && (
                      <Badge variant="outline" className="text-[8px]">{log.answer_status}</Badge>
                    )}
                  </div>
                </div>

                {log.answer_text && (
                  <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
                    <p className="font-medium text-foreground mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3" /> HelpAI's answer:</p>
                    <p className="line-clamp-3">{log.answer_text}</p>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  {!log.reviewed_by_admin && (
                    <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => markReviewed(log)}>
                      <CheckCircle2 className="w-3 h-3" /> Mark Reviewed
                    </Button>
                  )}
                  {log.source_target_codes?.length > 0 && (
                    <Button size="sm" variant="outline" className="text-xs h-7 gap-1"
                      onClick={() => {
                        const t = HELP_TARGETS.find(ht => ht.target_code === log.source_target_codes[0]);
                        if (t) onEditTarget(t);
                      }}>
                      <TrendingUp className="w-3 h-3" /> Improve Source Content
                    </Button>
                  )}
                  {log.reviewed_by_admin && (
                    <Badge className="text-[9px] bg-emerald-100 text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Reviewed
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}