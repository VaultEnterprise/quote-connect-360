import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText, Send, Eye, CheckCircle, XCircle, Clock, AlertTriangle,
  ChevronRight, Bell, GitBranch
} from "lucide-react";
import { format, parseISO, differenceInDays, isAfter } from "date-fns";
import SendReminderDialog from "@/components/proposals/SendReminderDialog";
import NewVersionDialog from "@/components/proposals/NewVersionDialog";

const PIPELINE_STAGES = [
  { key: "draft",    label: "Draft",    icon: Clock,        color: "bg-gray-100 border-gray-200",     headerColor: "bg-gray-50 border-b-gray-200",    dot: "bg-gray-400" },
  { key: "sent",     label: "Sent",     icon: Send,         color: "bg-blue-50 border-blue-200",      headerColor: "bg-blue-50 border-b-blue-200",    dot: "bg-blue-500" },
  { key: "viewed",   label: "Viewed",   icon: Eye,          color: "bg-purple-50 border-purple-200",  headerColor: "bg-purple-50 border-b-purple-200",dot: "bg-purple-500" },
  { key: "approved", label: "Approved", icon: CheckCircle,  color: "bg-green-50 border-green-200",    headerColor: "bg-green-50 border-b-green-200",  dot: "bg-green-500" },
  { key: "rejected", label: "Rejected", icon: XCircle,      color: "bg-red-50 border-red-200",        headerColor: "bg-red-50 border-b-red-200",      dot: "bg-red-400" },
];

const NEXT_STATUS = {
  draft:  { label: "Mark Sent",   status: "sent",     extra: () => ({ sent_at: new Date().toISOString() }) },
  sent:   { label: "Mark Viewed", status: "viewed",   extra: () => ({ viewed_at: new Date().toISOString() }) },
  viewed: { label: "Approve",     status: "approved", extra: () => ({ approved_at: new Date().toISOString() }) },
};

const PREV_STATUS = {
  sent:     { label: "← Draft",   status: "draft" },
  viewed:   { label: "← Sent",    status: "sent" },
  approved: { label: "← Viewed",  status: "viewed" },
};

function MiniProposalCard({ proposal, onView, onAdvance, onReject }) {
  const [showReminder, setShowReminder] = useState(false);
  const [showNewVersion, setShowNewVersion] = useState(false);
  const now = new Date();
  const expiresAt = proposal.expires_at ? parseISO(proposal.expires_at) : null;
  const daysUntilExpiry = expiresAt ? differenceInDays(expiresAt, now) : null;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 7;

  const refDate = proposal.viewed_at || proposal.sent_at;
  const isStale = ["sent", "viewed"].includes(proposal.status) && refDate && differenceInDays(now, parseISO(refDate)) > 7;
  const staleDays = refDate ? differenceInDays(now, parseISO(refDate)) : 0;

  const nextStep = NEXT_STATUS[proposal.status];
  const prevStep = PREV_STATUS[proposal.status];

  // "Viewed X days ago" for viewed stage
  const viewedDaysAgo = proposal.viewed_at ? differenceInDays(now, parseISO(proposal.viewed_at)) : null;

  return (
    <>
      <div
        className={`bg-white rounded-lg border p-3 hover:shadow-sm cursor-pointer transition-all group ${isStale ? "border-orange-200 bg-orange-50/30" : ""}`}
        onClick={() => onView(proposal)}
      >
        <div className="flex items-start gap-2">
          <FileText className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">{proposal.title}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{proposal.employer_name || "—"}</p>
            {proposal.total_monthly_premium && (
              <p className="text-[10px] font-medium text-foreground mt-0.5">
                ${proposal.total_monthly_premium.toLocaleString()}/mo
              </p>
            )}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className="text-[9px] text-muted-foreground bg-muted px-1 py-0.5 rounded">v{proposal.version || 1}</span>
              {isExpiringSoon && (
                <span className="text-[9px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded flex items-center gap-0.5">
                  <AlertTriangle className="w-2 h-2" />{daysUntilExpiry}d left
                </span>
              )}
              {isStale && (
                <span className="text-[9px] bg-orange-100 text-orange-700 px-1 py-0.5 rounded flex items-center gap-0.5">
                  <Clock className="w-2 h-2" />Stale {staleDays}d
                </span>
              )}
              {proposal.status === "viewed" && viewedDaysAgo !== null && (
                <span className="text-[9px] text-purple-600">
                  Viewed {viewedDaysAgo === 0 ? "today" : `${viewedDaysAgo}d ago`}
                </span>
              )}
              {proposal.status === "sent" && proposal.sent_at && (
                <span className="text-[9px] text-muted-foreground">
                  Sent {format(parseISO(proposal.sent_at), "MMM d")}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Advance button */}
        {nextStep && (
          <button
            className="mt-2 w-full text-[10px] font-medium text-primary hover:text-primary/80 flex items-center justify-center gap-1 py-1 rounded border border-primary/20 hover:bg-primary/5 transition-colors"
            onClick={e => { e.stopPropagation(); onAdvance(proposal, nextStep); }}
          >
            <ChevronRight className="w-3 h-3" /> {nextStep.label}
          </button>
        )}

        {/* Reminder + New Version inline actions */}
        {["sent", "viewed"].includes(proposal.status) && (
          <div className="flex gap-1 mt-1" onClick={e => e.stopPropagation()}>
            <button
              className="flex-1 text-[10px] text-orange-600 hover:bg-orange-50 py-0.5 rounded border border-orange-200 flex items-center justify-center gap-0.5 transition-colors"
              onClick={() => setShowReminder(true)}
            >
              <Bell className="w-2.5 h-2.5" /> Remind
            </button>
            {["rejected", "approved"].includes(proposal.status) && (
              <button
                className="flex-1 text-[10px] text-primary hover:bg-primary/5 py-0.5 rounded border border-primary/20 flex items-center justify-center gap-0.5 transition-colors"
                onClick={() => setShowNewVersion(true)}
              >
                <GitBranch className="w-2.5 h-2.5" /> New Ver.
              </button>
            )}
          </div>
        )}
        {["rejected", "approved"].includes(proposal.status) && (
          <div className="mt-1" onClick={e => e.stopPropagation()}>
            <button
              className="w-full text-[10px] text-primary hover:bg-primary/5 py-0.5 rounded border border-primary/20 flex items-center justify-center gap-0.5 transition-colors"
              onClick={() => setShowNewVersion(true)}
            >
              <GitBranch className="w-2.5 h-2.5" /> New Version
            </button>
          </div>
        )}
      </div>

      {showReminder && <SendReminderDialog proposal={proposal} open={showReminder} onClose={() => setShowReminder(false)} />}
      {showNewVersion && <NewVersionDialog proposal={proposal} open={showNewVersion} onClose={() => setShowNewVersion(false)} />}
    </>
  );
}

export default function ProposalPipelineView({ proposals, onView }) {
  const queryClient = useQueryClient();

  const advance = useMutation({
    mutationFn: ({ id, status, extra }) => base44.entities.Proposal.update(id, { status, ...extra() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["proposals"] }),
  });

  const stageMap = {};
  PIPELINE_STAGES.forEach(s => { stageMap[s.key] = []; });
  proposals.forEach(p => {
    const key = p.status in stageMap ? p.status : "draft";
    stageMap[key].push(p);
  });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {PIPELINE_STAGES.map(stage => {
        const StageIcon = stage.icon;
        const items = stageMap[stage.key] || [];
        const stageTotal = items.reduce((s, p) => s + (p.total_monthly_premium || 0), 0);
        const staleCount = items.filter(p => {
          const ref = p.viewed_at || p.sent_at;
          return ref && differenceInDays(new Date(), parseISO(ref)) > 7;
        }).length;

        return (
          <div key={stage.key} className={`rounded-xl border ${stage.color} flex flex-col`}>
            <div className={`px-3 py-2.5 border-b ${stage.headerColor} rounded-t-xl`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${stage.dot}`} />
                  <span className="text-xs font-semibold">{stage.label}</span>
                </div>
                <Badge variant="outline" className="text-[10px] h-4 px-1.5">{items.length}</Badge>
              </div>
              {stageTotal > 0 && (
                <p className="text-[10px] text-muted-foreground mt-0.5">${stageTotal.toLocaleString()}/mo</p>
              )}
              {staleCount > 0 && (
                <p className="text-[9px] text-orange-600 mt-0.5 flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" /> {staleCount} stale
                </p>
              )}
            </div>
            <div className="p-2 space-y-2 flex-1 min-h-24 max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-[10px] text-muted-foreground">No proposals</p>
                </div>
              ) : (
                items.map(p => (
                  <MiniProposalCard
                    key={p.id}
                    proposal={p}
                    onView={onView}
                    onAdvance={(p, step) => advance.mutate({ id: p.id, status: step.status, extra: step.extra })}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}