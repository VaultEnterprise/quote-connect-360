import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  CheckCircle2, AlertCircle, Sparkles, MessageSquare, TrendingUp,
  Star, Search, X, ChevronDown, ChevronUp, Trash2, RefreshCw
} from "lucide-react";
import { HELP_TARGETS } from "@/lib/helpTargetRegistry";
import { formatDistanceToNow } from "date-fns";

export default function AIReviewTab({ onEditTarget }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({});
  const [resolveNotes, setResolveNotes] = useState({});

  const { data: aiLogs = [], isLoading } = useQuery({
    queryKey: ["helpai-logs-all"],
    queryFn: () => base44.entities.HelpAIQuestionLog.list("-created_date", 200),
  });

  const pending = aiLogs.filter(l => l.requires_admin_review && !l.reviewed_by_admin);
  const reviewed = aiLogs.filter(l => l.reviewed_by_admin);
  const lowConf = aiLogs.filter(l => (l.confidence_score || 0) < 0.4);
  const unanswered = aiLogs.filter(l => l.answer_status === "unanswered");
  const escalated = aiLogs.filter(l => l.answer_status === "escalated");

  const shown = (filter === "pending" ? pending
    : filter === "low_confidence" ? lowConf
    : filter === "unanswered" ? unanswered
    : filter === "escalated" ? escalated
    : filter === "reviewed" ? reviewed
    : aiLogs
  ).filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return l.question_text?.toLowerCase().includes(q) ||
      l.answer_text?.toLowerCase().includes(q) ||
      l.user_email?.toLowerCase().includes(q) ||
      l.page_code?.toLowerCase().includes(q);
  });

  const markReviewed = useMutation({
    mutationFn: ({ log, note }) => base44.entities.HelpAIQuestionLog.update(log.id, {
      reviewed_by_admin: true,
      requires_admin_review: false,
      answer_status: "reviewed",
      resolved_by: "admin",
      resolved_at: new Date().toISOString(),
      feedback_notes: note || log.feedback_notes,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["helpai-logs-all"] });
      queryClient.invalidateQueries({ queryKey: ["helpai-logs"] });
      toast({ title: "Marked as reviewed" });
    },
  });

  const escalateLog = useMutation({
    mutationFn: (id) => base44.entities.HelpAIQuestionLog.update(id, { answer_status: "escalated", requires_admin_review: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["helpai-logs-all"] }),
  });

  const deleteLog = useMutation({
    mutationFn: (id) => base44.entities.HelpAIQuestionLog.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["helpai-logs-all"] });
      toast({ title: "Log entry deleted" });
    },
  });

  const bulkReviewAll = useMutation({
    mutationFn: () => Promise.all(pending.map(l =>
      base44.entities.HelpAIQuestionLog.update(l.id, {
        reviewed_by_admin: true,
        requires_admin_review: false,
        answer_status: "reviewed",
        resolved_by: "admin",
        resolved_at: new Date().toISOString(),
      })
    )),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["helpai-logs-all"] });
      queryClient.invalidateQueries({ queryKey: ["helpai-logs"] });
      toast({ title: `Bulk reviewed ${pending.length} items` });
    },
  });

  const confColor = (score) => {
    if (!score) return "bg-red-100 text-red-700";
    if (score >= 0.7) return "bg-emerald-100 text-emerald-700";
    if (score >= 0.4) return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  };

  const renderStars = (rating) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-0.5">
        {[1,2,3,4,5].map(i => (
          <Star key={i} className={`w-3 h-3 ${i <= rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`} />
        ))}
      </div>
    );
  };

  // Trends: top questions by frequency
  const questionFreq = aiLogs.reduce((acc, l) => {
    const norm = l.normalized_question_text || l.question_text || "";
    acc[norm] = (acc[norm] || 0) + 1;
    return acc;
  }, {});
  const topQuestions = Object.entries(questionFreq).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Pending Review", value: pending.length, color: "text-red-600", filter: "pending" },
          { label: "Low Confidence", value: lowConf.length, color: "text-amber-600", filter: "low_confidence" },
          { label: "Unanswered", value: unanswered.length, color: "text-orange-600", filter: "unanswered" },
          { label: "Escalated", value: escalated.length, color: "text-purple-600", filter: "escalated" },
          { label: "Reviewed", value: reviewed.length, color: "text-emerald-600", filter: "reviewed" },
        ].map(kpi => (
          <Card key={kpi.label} className={`cursor-pointer hover:border-primary/40 transition-all ${filter === kpi.filter ? "border-primary" : ""}`}
            onClick={() => setFilter(prev => prev === kpi.filter ? "all" : kpi.filter)}>
            <CardContent className="p-3 text-center">
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top repeated questions insight */}
      {topQuestions.some(([, c]) => c > 1) && (
        <Card className="border-blue-100 bg-blue-50/30">
          <CardContent className="p-3">
            <p className="text-xs font-semibold text-blue-800 mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> Frequently Asked Questions (consider improving these topics)
            </p>
            <div className="space-y-1">
              {topQuestions.filter(([, c]) => c > 1).map(([q, count]) => (
                <div key={q} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-blue-800 truncate flex-1">"{q}"</span>
                  <Badge className="bg-blue-100 text-blue-700 text-[9px] flex-shrink-0">{count}×</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Search questions, answers, users…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-8 text-xs" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending Review ({pending.length})</SelectItem>
            <SelectItem value="low_confidence">Low Confidence ({lowConf.length})</SelectItem>
            <SelectItem value="unanswered">Unanswered ({unanswered.length})</SelectItem>
            <SelectItem value="escalated">Escalated ({escalated.length})</SelectItem>
            <SelectItem value="reviewed">Reviewed ({reviewed.length})</SelectItem>
            <SelectItem value="all">All Questions ({aiLogs.length})</SelectItem>
          </SelectContent>
        </Select>
        {search && (
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setSearch("")}>
            <X className="w-3 h-3 mr-1" /> Clear
          </Button>
        )}
        <span className="text-xs text-muted-foreground">{shown.length} items</span>
        {pending.length > 1 && (
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1 ml-auto"
            onClick={() => { if (confirm(`Mark all ${pending.length} pending items as reviewed?`)) bulkReviewAll.mutate(); }}
            disabled={bulkReviewAll.isPending}>
            <CheckCircle2 className="w-3 h-3" /> Review All ({pending.length})
          </Button>
        )}
      </div>

      {/* Log items */}
      {isLoading && <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />)}</div>}
      {!isLoading && shown.length === 0 ? (
        <Card className="text-center py-10">
          <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400/40 mb-2" />
          <p className="text-sm text-muted-foreground">
            {filter === "pending" ? "No items pending review — great work!" : "No items in this filter."}
          </p>
        </Card>
      ) : (
        <div className="space-y-2 max-h-[700px] overflow-y-auto">
          {shown.map(log => {
            const isExpanded = expanded[log.id];
            const note = resolveNotes[log.id] || "";
            return (
              <Card key={log.id} className={log.requires_admin_review && !log.reviewed_by_admin ? "border-amber-200 bg-amber-50/20" : ""}>
                <CardContent className="p-4 space-y-2">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <MessageSquare className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs text-muted-foreground">
                          {log.page_code && <span className="font-medium text-foreground">{log.page_code}</span>}
                          {log.page_code && log.user_email && " · "}
                          {log.user_email || "Anonymous"}
                          {log.created_date && " · " + formatDistanceToNow(new Date(log.created_date), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="font-semibold text-sm">"{log.question_text}"</p>
                      {log.feedback_rating && renderStars(log.feedback_rating)}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <Badge className={`text-[9px] ${confColor(log.confidence_score)}`}>
                        {log.confidence_score !== undefined ? `${Math.round((log.confidence_score || 0) * 100)}% conf` : "No score"}
                      </Badge>
                      {log.answer_status && (
                        <Badge variant="outline" className="text-[8px]">{log.answer_status}</Badge>
                      )}
                      {log.reviewed_by_admin && (
                        <Badge className="text-[9px] bg-emerald-100 text-emerald-700">✓ Reviewed</Badge>
                      )}
                    </div>
                  </div>

                  {/* Expandable answer */}
                  {log.answer_text && (
                    <button className="w-full text-left" onClick={() => setExpanded(p => ({ ...p, [log.id]: !p[log.id] }))}>
                      <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground hover:bg-muted/70 transition-colors">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-foreground flex items-center gap-1"><Sparkles className="w-3 h-3" /> HelpAI's answer:</p>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </div>
                        <p className={isExpanded ? "" : "line-clamp-2"}>{log.answer_text}</p>
                      </div>
                    </button>
                  )}

                  {/* Resolve notes input */}
                  {!log.reviewed_by_admin && (
                    <div>
                      <Input
                        placeholder="Resolution note (optional)…"
                        value={note}
                        onChange={e => setResolveNotes(p => ({ ...p, [log.id]: e.target.value }))}
                        className="h-7 text-xs"
                      />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap items-center">
                    {!log.reviewed_by_admin && (
                      <Button size="sm" variant="outline" className="text-xs h-7 gap-1"
                        onClick={() => markReviewed.mutate({ log, note })}
                        disabled={markReviewed.isPending}>
                        <CheckCircle2 className="w-3 h-3" /> Mark Reviewed
                      </Button>
                    )}
                    {!log.reviewed_by_admin && log.answer_status !== "escalated" && (
                      <Button size="sm" variant="outline" className="text-xs h-7 gap-1 text-purple-600 border-purple-200"
                        onClick={() => escalateLog.mutate(log.id)}
                        disabled={escalateLog.isPending}>
                        <AlertCircle className="w-3 h-3" /> Escalate
                      </Button>
                    )}
                    {log.source_target_codes?.length > 0 && (
                      <Button size="sm" variant="outline" className="text-xs h-7 gap-1"
                        onClick={() => {
                          const t = HELP_TARGETS.find(ht => ht.target_code === log.source_target_codes[0]);
                          if (t) onEditTarget(t);
                        }}>
                        <TrendingUp className="w-3 h-3" /> Improve Source
                      </Button>
                    )}
                    {log.feedback_notes && (
                      <span className="text-[10px] text-muted-foreground italic">Note: {log.feedback_notes}</span>
                    )}
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 ml-auto text-destructive"
                      title="Delete log entry"
                      onClick={() => { if (confirm("Delete this AI log entry?")) deleteLog.mutate(log.id); }}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}