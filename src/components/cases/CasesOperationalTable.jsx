import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, Clock3, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/shared/StatusBadge";

export default function CasesOperationalTable({ cases }) {
  if (!cases.length) return null;

  return (
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-[2.1fr,1fr,1fr,1.2fr,1fr,1.2fr] gap-4 border-b px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <div>Case</div>
            <div>Workflow</div>
            <div>Ownership</div>
            <div>System Issues</div>
            <div>SLA</div>
            <div>Action</div>
          </div>
          {cases.map((item) => (
            <div key={item.id} className="grid grid-cols-[2.1fr,1fr,1fr,1.2fr,1fr,1.2fr] gap-4 border-b last:border-b-0 px-5 py-4 items-center">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Link to={`/cases/${item.id}`} className="font-semibold hover:text-primary transition-colors">
                    {item.employer_name || "Unnamed Employer"}
                  </Link>
                  <span className="text-xs text-muted-foreground">{item.case_number || item.id.slice(-6)}</span>
                  {item.priority !== "normal" && <StatusBadge status={item.priority} />}
                </div>
                <p className="mt-1 text-xs text-muted-foreground capitalize">{item.case_type?.replace(/_/g, " ")}</p>
                {item.hasRateGap && <p className="mt-1 text-xs text-red-600 font-medium">Quoted plans missing rate tables</p>}
              </div>

              <div className="space-y-1">
                <StatusBadge status={item.stage} />
                <p className="text-xs text-muted-foreground">{item.products_requested?.length || 0} products</p>
              </div>

              <div>
                <p className="text-sm font-medium">{item.assigned_to ? item.assigned_to.split("@")[0] : "Unassigned"}</p>
                <p className="text-xs text-muted-foreground">{item.escalated ? "Escalated" : "Standard routing"}</p>
                {item.hasRateGap && <p className="text-xs text-red-600">Needs rate setup</p>}
              </div>

              <div className="flex flex-wrap gap-2">
                {item.systemIssues.length === 0 ? (
                  <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50">Clear</Badge>
                ) : (
                  item.systemIssues.slice(0, 3).map((issue) => (
                    <Badge key={issue.label} variant="outline" className={issue.tone}>
                      <issue.icon className="w-3 h-3 mr-1" />
                      {issue.label}
                    </Badge>
                  ))
                )}
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border bg-background">
                  {item.slaRisk ? <ShieldAlert className="w-3.5 h-3.5 text-red-600" /> : <Clock3 className="w-3.5 h-3.5 text-emerald-600" />}
                  <span className={item.slaRisk ? "text-red-700" : "text-emerald-700"}>{item.slaLabel}</span>
                </div>
                {item.staleDays !== null && <p className="mt-1 text-xs text-muted-foreground">{item.staleDays}d since activity</p>}
              </div>

              <div>
                <Link to={`/cases/${item.id}`}>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    Open Case
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}