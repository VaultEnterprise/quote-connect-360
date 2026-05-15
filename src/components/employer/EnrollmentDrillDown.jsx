import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ClipboardCheck, Download, Users } from "lucide-react";
import { format } from "date-fns";
import EmptyState from "@/components/shared/EmptyState";
import StatusBadge from "@/components/shared/StatusBadge";

const STATUS_COLORS = {
  enrolled:   "bg-green-100 text-green-700",
  invited:    "bg-blue-100 text-blue-700",
  pending:    "bg-amber-100 text-amber-700",
  waived:     "bg-gray-100 text-gray-600",
  terminated: "bg-red-100 text-red-700",
};

/**
 * EnrollmentDrillDown
 * Shows aggregate enrollment stats + employee-level breakdown with export.
 *
 * Props:
 *   enrollment — EnrollmentWindow | null
 *   caseId     — string
 */
export default function EnrollmentDrillDown({ enrollment, caseId }) {
  const [showAll, setShowAll] = useState(false);

  const { data: members = [] } = useQuery({
    queryKey: ["enrollment-members", enrollment?.id],
    queryFn: () => base44.entities.EnrollmentMember.filter({ enrollment_window_id: enrollment.id }, "-enrolled_at"),
    enabled: !!enrollment?.id,
  });

  if (!enrollment) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="No Enrollment Window"
        description="Enrollment hasn't started yet. Your broker will notify you when it opens."
      />
    );
  }

  const enrolled  = members.filter(m => m.status === "enrolled");
  const waived    = members.filter(m => m.status === "waived");
  const pending   = members.filter(m => ["pending", "invited"].includes(m.status));
  const total     = enrollment.total_eligible || members.length || 1;
  const pct       = Math.round(((enrollment.enrolled_count || enrolled.length) / total) * 100);

  const displayMembers = showAll ? members : members.slice(0, 10);

  const exportCSV = () => {
    const rows = [
      ["Name", "Email", "Status", "Coverage Tier", "Plan", "Enrolled At"],
      ...members.map(m => [
        `${m.first_name} ${m.last_name}`,
        m.email || "",
        m.status,
        m.coverage_tier || "",
        "",
        m.enrolled_at ? format(new Date(m.enrolled_at), "yyyy-MM-dd") : "",
      ]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "enrollment-status.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Aggregate stats */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Open Enrollment</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {enrollment.start_date && format(new Date(enrollment.start_date), "MMM d")}
                {enrollment.end_date && ` — ${format(new Date(enrollment.end_date), "MMM d, yyyy")}`}
              </p>
            </div>
            <StatusBadge status={enrollment.status} />
          </div>

          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Participation</span>
              <span className="font-semibold text-primary">{pct}%</span>
            </div>
            <Progress value={pct} className="h-3" />
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="rounded-lg bg-green-50 p-3">
              <p className="text-xl font-bold text-green-700">{enrollment.enrolled_count ?? enrolled.length}</p>
              <p className="text-xs text-green-600">Enrolled</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-3">
              <p className="text-xl font-bold text-amber-700">{enrollment.waived_count ?? waived.length}</p>
              <p className="text-xs text-amber-600">Waived</p>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xl font-bold text-muted-foreground">{enrollment.pending_count ?? pending.length}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee-level breakdown */}
      {members.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">Employee Breakdown ({members.length})</p>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={exportCSV}>
              <Download className="w-3.5 h-3.5" /> Export CSV
            </Button>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 text-left">
                  <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground">Employee</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Coverage</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {displayMembers.map(m => (
                  <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-sm">{m.first_name} {m.last_name}</p>
                      {m.email && <p className="text-xs text-muted-foreground">{m.email}</p>}
                    </td>
                    <td className="px-3 py-2.5 hidden sm:table-cell">
                      <span className="text-xs text-muted-foreground capitalize">
                        {m.coverage_tier?.replace(/_/g, " ") || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[m.status] || "bg-muted text-muted-foreground"}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 hidden md:table-cell text-xs text-muted-foreground">
                      {m.enrolled_at ? format(new Date(m.enrolled_at), "MMM d") : m.invited_at ? `Invited ${format(new Date(m.invited_at), "MMM d")}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {members.length > 10 && (
            <Button variant="ghost" size="sm" className="w-full mt-2 text-xs" onClick={() => setShowAll(v => !v)}>
              {showAll ? "Show Less" : `Show All ${members.length} Employees`}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}