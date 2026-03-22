import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Send, Eye, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";

export default function ProposalHistoryTimeline({ proposals }) {
  const sortedProposals = [...proposals].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const STATUS_CONFIG = {
    draft: { icon: FileText, color: "bg-slate-100 border-slate-300", iconColor: "text-slate-600" },
    sent: { icon: Send, color: "bg-blue-100 border-blue-300", iconColor: "text-blue-600" },
    viewed: { icon: Eye, color: "bg-purple-100 border-purple-300", iconColor: "text-purple-600" },
    approved: { icon: CheckCircle, color: "bg-emerald-100 border-emerald-300", iconColor: "text-emerald-600" },
    rejected: { icon: XCircle, color: "bg-red-100 border-red-300", iconColor: "text-red-600" },
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Proposal History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {sortedProposals.slice(0, 8).map((p, i) => {
            const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.draft;
            const Icon = cfg.icon;
            return (
              <div key={p.id} className="relative pb-4 last:pb-0">
                {i < sortedProposals.length - 1 && (
                  <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-border" />
                )}

                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center relative z-10 ${cfg.color}`}>
                      <Icon className={`w-4 h-4 ${cfg.iconColor}`} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 py-1">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold truncate">{p.title}</p>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0 whitespace-nowrap">
                        {format(new Date(p.created_date), "MMM d, h:mm a")}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge className="text-[9px] py-0 capitalize">{p.status}</Badge>
                      {p.employer_name && <span className="text-[10px] text-muted-foreground">{p.employer_name}</span>}
                      {p.total_monthly_premium && <Badge className="text-[9px] py-0 bg-primary/10 text-primary">${p.total_monthly_premium.toLocaleString()}</Badge>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}