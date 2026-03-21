import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { FileText, DollarSign, Calendar, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { format } from "date-fns";

export default function Quotes() {
  const { data: scenarios = [] } = useQuery({
    queryKey: ["scenarios-all"],
    queryFn: () => base44.entities.QuoteScenario.list("-created_date", 50),
  });

  const { data: cases = [] } = useQuery({
    queryKey: ["cases"],
    queryFn: () => base44.entities.BenefitCase.list("-created_date", 100),
  });

  const caseMap = Object.fromEntries(cases.map(c => [c.id, c]));

  return (
    <div>
      <PageHeader
        title="Quotes"
        description="View and manage quote scenarios across all cases"
      />

      {scenarios.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Quote Scenarios"
          description="Quote scenarios will appear here when created within cases"
        />
      ) : (
        <div className="space-y-2">
          {scenarios.map((s) => {
            const relatedCase = caseMap[s.case_id];
            return (
              <Link key={s.id} to={`/cases/${s.case_id}`}>
                <Card className="hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{s.name}</p>
                          {s.is_recommended && (
                            <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">
                              <Star className="w-2.5 h-2.5 mr-0.5" /> Recommended
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                          <span>{relatedCase?.employer_name || "Unknown"}</span>
                          {s.total_monthly_premium && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />${s.total_monthly_premium.toLocaleString()}/mo
                            </span>
                          )}
                          {s.plan_count && <span>{s.plan_count} plans</span>}
                          {s.quoted_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(s.quoted_at), "MMM d, yyyy")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={s.status} />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}