import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FileText, Send, Eye, CheckCircle, XCircle, Clock, AlertTriangle,
  ExternalLink, Pencil, Trash2, Copy, MoreHorizontal, ChevronRight,
  Bell, GitBranch, Mail, Phone
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { format, isAfter, differenceInDays, parseISO } from "date-fns";
import SendProposalDialog from "@/components/proposals/SendProposalDialog";
import SendReminderDialog from "@/components/proposals/SendReminderDialog";
import NewVersionDialog from "@/components/proposals/NewVersionDialog";

const STATUS_CONFIG = {
  draft:    { label: "Draft",    icon: Clock,        cls: "bg-gray-100 text-gray-600 border-gray-200",       border: "border-l-gray-300" },
  sent:     { label: "Sent",     icon: Send,         cls: "bg-blue-100 text-blue-700 border-blue-200",       border: "border-l-blue-400" },
  viewed:   { label: "Viewed",   icon: Eye,          cls: "bg-purple-100 text-purple-700 border-purple-200", border: "border-l-purple-400" },
  approved: { label: "Approved", icon: CheckCircle,  cls: "bg-green-100 text-green-700 border-green-200",   border: "border-l-green-500" },
  rejected: { label: "Rejected", icon: XCircle,      cls: "bg-red-100 text-red-700 border-red-200",         border: "border-l-red-400" },
  expired:  { label: "Expired",  icon: AlertTriangle,cls: "bg-orange-100 text-orange-700 border-orange-200",border: "border-l-orange-400" },
};

const PLAN_TYPE_COLORS = {
  medical:   "bg-blue-50 text-blue-700 border-blue-200",
  dental:    "bg-green-50 text-green-700 border-green-200",
  vision:    "bg-purple-50 text-purple-700 border-purple-200",
  life:      "bg-orange-50 text-orange-700 border-orange-200",
  std:       "bg-yellow-50 text-yellow-700 border-yellow-200",
  ltd:       "bg-red-50 text-red-700 border-red-200",
  voluntary: "bg-pink-50 text-pink-700 border-pink-200",
};

function PlanChips({ plans }) {
  if (!plans?.length) return null;
  const grouped = {};
  plans.forEach(p => {
    const type = p.plan_type || "other";
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(p);
  });
  return (
    <div className="flex items-center gap-1 mt-2 flex-wrap">
      {Object.entries(grouped).map(([type, items]) => (
        <span key={type} className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full border ${PLAN_TYPE_COLORS[type] || "bg-muted text-muted-foreground border-border"}`}>
          {type.charAt(0).toUpperCase() + type.slice(1)} ×{items.length}
        </span>
      ))}
    </div>
  );
}

export default function ProposalCard({ proposal, onView, onEdit, onReject, isSelected, onToggleSelect }) {
  const queryClient = useQueryClient();
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [showNewVersion, setShowNewVersion] = useState(false);
  const cfg = STATUS_CONFIG[proposal.status] || STATUS_CONFIG.draft;
  const StatusIcon = cfg.icon;

  const now = new Date();
  const expiresAt = proposal.expires_at ? parseISO(proposal.expires_at) : null;
  const daysUntilExpiry = expiresAt ? differenceInDays(expiresAt, now) : null;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 7;
  const isExpired = expiresAt && !isAfter(expiresAt, now) && !["approved","rejected","expired"].includes(proposal.status);

  // Stale: sent/viewed for >7 days
  const refDate = proposal.viewed_at || proposal.sent_at;
  const isStale = ["sent", "viewed"].includes(proposal.status) && refDate && differenceInDays(now, parseISO(refDate)) > 7;
  const staleDays = refDate ? differenceInDays(now, parseISO(refDate)) : 0;

  const updateStatus = useMutation({
    mutationFn: (payload) => base44.entities.Proposal.update(proposal.id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["proposals"] }),
  });

  const cloneProposal = useMutation({
    mutationFn: () => base44.entities.Proposal.create({
      ...proposal, id: undefined, title: `${proposal.title} (Copy)`, status: "draft",
      version: 1, sent_at: null, viewed_at: null, approved_at: null,
      created_date: undefined, updated_date: undefined,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["proposals"] }),
  });

  const deleteProposal = useMutation({
    mutationFn: () => base44.entities.Proposal.delete(proposal.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["proposals"] }),
  });

  const handleMarkViewed = (e) => {
    e.stopPropagation();
    updateStatus.mutate({ status: "viewed", viewed_at: new Date().toISOString() });
  };

  const handleApprove = (e) => {
    e.stopPropagation();
    updateStatus.mutate({ status: "approved", approved_at: new Date().toISOString() });
  };

  return (
    <>
      <Card
        className={`border-l-4 ${cfg.border} hover:shadow-md transition-all cursor-pointer ${isSelected ? "ring-2 ring-primary/30 bg-primary/5" : ""} ${isStale ? "border-orange-200" : ""}`}
        onClick={() => onView(proposal)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Bulk select */}
              {onToggleSelect && (
                <Checkbox
                  checked={!!isSelected}
                  onCheckedChange={() => onToggleSelect(proposal.id)}
                  onClick={e => e.stopPropagation()}
                  className="mt-1 flex-shrink-0"
                />
              )}
              <div className="w-9 h-9 rounded-lg bg-primary/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold truncate">{proposal.title}</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.cls}`}>
                    <StatusIcon className="w-2.5 h-2.5" />{cfg.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">v{proposal.version || 1}</span>
                  {isExpiringSoon && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <AlertTriangle className="w-2.5 h-2.5" />Expires in {daysUntilExpiry}d
                    </span>
                  )}
                  {isExpired && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                      <AlertTriangle className="w-2.5 h-2.5" /> Overdue
                    </span>
                  )}
                  {isStale && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-50 text-orange-600 border border-orange-200">
                      <Clock className="w-2.5 h-2.5" /> Stale {staleDays}d
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                  {proposal.employer_name && <span className="font-medium text-foreground">{proposal.employer_name}</span>}
                  {proposal.effective_date && <span>Eff. {format(parseISO(proposal.effective_date), "MMM d, yyyy")}</span>}
                  {proposal.total_monthly_premium && (
                    <span className="font-medium text-foreground">${proposal.total_monthly_premium.toLocaleString()}/mo</span>
                  )}
                  {proposal.employer_monthly_cost && (
                    <span>Employer: ${proposal.employer_monthly_cost.toLocaleString()}/mo</span>
                  )}
                  {proposal.broker_name && <span>{proposal.broker_name}</span>}
                </div>

                {/* Employer contact info */}
                {(proposal.primary_contact_email || proposal.primary_contact_phone) && (
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap" onClick={e => e.stopPropagation()}>
                    {proposal.primary_contact_email && (
                      <a href={`mailto:${proposal.primary_contact_email}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                        <Mail className="w-3 h-3" />{proposal.primary_contact_email}
                      </a>
                    )}
                    {proposal.primary_contact_phone && (
                      <a href={`tel:${proposal.primary_contact_phone}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                        <Phone className="w-3 h-3" />{proposal.primary_contact_phone}
                      </a>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                  {proposal.sent_at && <span>Sent {format(parseISO(proposal.sent_at), "MMM d")}</span>}
                  {proposal.viewed_at && <span className="text-purple-600">Viewed {format(parseISO(proposal.viewed_at), "MMM d")}</span>}
                  {proposal.approved_at && <span className="text-green-600">Approved {format(parseISO(proposal.approved_at), "MMM d")}</span>}
                  {expiresAt && !isExpired && !isExpiringSoon && (
                    <span>Expires {format(expiresAt, "MMM d, yyyy")}</span>
                  )}
                </div>

                <PlanChips plans={proposal.plan_summary} />

                {proposal.status === "approved" && (
                  <div className="flex items-center gap-2 mt-2">
                    <Link to={`/enrollment?case_id=${proposal.case_id}`} onClick={e => e.stopPropagation()}>
                      <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1 text-green-700 border-green-200 bg-green-50 hover:bg-green-100">
                        <ChevronRight className="w-3 h-3" /> Go to Enrollment
                      </Button>
                    </Link>
                    <Link to={`/cases/${proposal.case_id}`} onClick={e => e.stopPropagation()}>
                      <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1">
                        <ExternalLink className="w-3 h-3" /> Open Case
                      </Button>
                    </Link>
                  </div>
                )}

                {/* Follow-up reminder badge for stale */}
                {isStale && (
                  <div className="mt-2" onClick={e => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] gap-1 text-orange-700 border-orange-300 bg-orange-50 hover:bg-orange-100"
                      onClick={(e) => { e.stopPropagation(); setShowReminder(true); }}
                    >
                      <Bell className="w-3 h-3" /> Send Follow-Up
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
              {proposal.case_id && !["approved"].includes(proposal.status) && (
                <Link to={`/cases/${proposal.case_id}`}>
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Open Case">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              )}
              {proposal.status === "draft" && (
                <Button size="sm" className="h-7 text-xs gap-1" onClick={() => setShowSendDialog(true)}>
                  <Send className="w-3 h-3" /> Send
                </Button>
              )}
              {proposal.status === "sent" && (
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-purple-700 border-purple-200 hover:bg-purple-50" onClick={handleMarkViewed} disabled={updateStatus.isPending}>
                  <Eye className="w-3 h-3" /> Mark Viewed
                </Button>
              )}
              {["sent", "viewed"].includes(proposal.status) && (
                <Button size="sm" className="h-7 text-xs gap-1 bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={updateStatus.isPending}>
                  <CheckCircle className="w-3 h-3" /> Approve
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onView(proposal)}>
                    <Eye className="w-3.5 h-3.5 mr-2" /> View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(proposal)}>
                    <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => cloneProposal.mutate()}>
                    <Copy className="w-3.5 h-3.5 mr-2" /> Clone (New Draft)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowNewVersion(true)}>
                    <GitBranch className="w-3.5 h-3.5 mr-2" /> New Version (v{(proposal.version || 1) + 1})
                  </DropdownMenuItem>
                  {proposal.status === "draft" && (
                    <DropdownMenuItem onClick={() => setShowSendDialog(true)}>
                      <Send className="w-3.5 h-3.5 mr-2" /> Send / Share
                    </DropdownMenuItem>
                  )}
                  {["sent", "viewed"].includes(proposal.status) && (
                    <DropdownMenuItem onClick={() => setShowReminder(true)}>
                      <Bell className="w-3.5 h-3.5 mr-2" /> Send Reminder
                    </DropdownMenuItem>
                  )}
                  {["sent","viewed"].includes(proposal.status) && (
                    <DropdownMenuItem onClick={() => onReject(proposal)} className="text-destructive">
                      <XCircle className="w-3.5 h-3.5 mr-2" /> Mark Rejected
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => { if (window.confirm("Delete this proposal?")) deleteProposal.mutate(); }}
                    className="text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {showSendDialog && <SendProposalDialog proposal={proposal} open={showSendDialog} onClose={() => setShowSendDialog(false)} />}
      {showReminder && <SendReminderDialog proposal={proposal} open={showReminder} onClose={() => setShowReminder(false)} />}
      {showNewVersion && <NewVersionDialog proposal={proposal} open={showNewVersion} onClose={() => setShowNewVersion(false)} />}
    </>
  );
}