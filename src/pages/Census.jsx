import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Users, FileUp, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { format } from "date-fns";

export default function Census() {
  const { data: versions = [] } = useQuery({
    queryKey: ["census-all"],
    queryFn: () => base44.entities.CensusVersion.list("-created_date", 50),
  });

  const { data: cases = [] } = useQuery({
    queryKey: ["cases"],
    queryFn: () => base44.entities.BenefitCase.list("-created_date", 100),
  });

  const caseMap = Object.fromEntries(cases.map(c => [c.id, c]));

  return (
    <div>
      <PageHeader
        title="Census"
        description="Manage employee census data across all cases"
      />

      {versions.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Census Data"
          description="Census data will appear here when uploaded to cases"
        />
      ) : (
        <div className="space-y-2">
          {versions.map((cv) => {
            const relatedCase = caseMap[cv.case_id];
            return (
              <Link key={cv.id} to={`/cases/${cv.case_id}`}>
                <Card className="hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{relatedCase?.employer_name || "Unknown Employer"} — v{cv.version_number}</p>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                          <span>{cv.total_employees || 0} employees</span>
                          <span>{cv.total_dependents || 0} dependents</span>
                          {cv.validation_errors > 0 && (
                            <span className="text-destructive">{cv.validation_errors} errors</span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(cv.created_date), "MMM d, yyyy")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={cv.status} />
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