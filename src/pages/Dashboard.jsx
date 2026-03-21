import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Briefcase,
  Users,
  FileText,
  ClipboardCheck,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  Clock,
  TrendingUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MetricCard from "@/components/shared/MetricCard";
import StatusBadge from "@/components/shared/StatusBadge";
import PageHeader from "@/components/shared/PageHeader";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: cases = [] } = useQuery({
    queryKey: ["cases"],
    queryFn: () => base44.entities.BenefitCase.list("-created_date", 50),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks-pending"],
    queryFn: () => base44.entities.CaseTask.filter({ status: "pending" }, "-created_date", 10),
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["enrollments"],
    queryFn: () => base44.entities.EnrollmentWindow.list("-created_date", 10),
  });

  const { data: renewals = [] } = useQuery({
    queryKey: ["renewals"],
    queryFn: () => base44.entities.RenewalCycle.list("-renewal_date", 10),
  });

  const activeCases = cases.filter(c => !["closed", "renewed"].includes(c.stage));
  const quotingCases = cases.filter(c => ["ready_for_quote", "quoting"].includes(c.stage));
  const enrollmentOpen = enrollments.filter(e => ["open", "closing_soon"].includes(e.status));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your benefits operations"
        actions={
          <Link to="/cases/new">
            <Button className="shadow-sm">
              <Briefcase className="w-4 h-4 mr-2" /> New Case
            </Button>
          </Link>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Active Cases" value={activeCases.length} icon={Briefcase} trendLabel={`${cases.length} total`} />
        <MetricCard label="Quoting" value={quotingCases.length} icon={FileText} />
        <MetricCard label="Open Enrollments" value={enrollmentOpen.length} icon={ClipboardCheck} />
        <MetricCard label="Pending Tasks" value={tasks.length} icon={AlertCircle} trendLabel="needs attention" trend={tasks.length > 5 ? "down" : undefined} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Cases */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Recent Cases</CardTitle>
              <Link to="/cases">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
                  View all <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {cases.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No cases yet. Create your first case to get started.</p>
            ) : (
              <div className="space-y-2">
                {cases.slice(0, 6).map((c) => (
                  <Link key={c.id} to={`/cases/${c.id}`} className="block">
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                          {c.employer_name || "Unnamed Employer"}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">{c.case_number || `#${c.id?.slice(-6)}`}</span>
                          {c.effective_date && (
                            <span className="text-xs text-muted-foreground">• Eff. {format(new Date(c.effective_date), "MMM d, yyyy")}</span>
                          )}
                        </div>
                      </div>
                      <StatusBadge status={c.stage} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Tasks</CardTitle>
              <Link to="/tasks">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
                  View all <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">All caught up!</p>
            ) : (
              <div className="space-y-2">
                {tasks.slice(0, 5).map((t) => (
                  <div key={t.id} className="p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                    <p className="text-sm font-medium text-foreground">{t.title}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-xs text-muted-foreground">{t.employer_name}</span>
                      {t.due_date && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {format(new Date(t.due_date), "MMM d")}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pipeline + Renewals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Case Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PipelineBreakdown cases={cases} />
          </CardContent>
        </Card>

        {/* Upcoming Renewals */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-primary" /> Upcoming Renewals
              </CardTitle>
              <Link to="/renewals">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">View all</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {renewals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No upcoming renewals</p>
            ) : (
              <div className="space-y-2">
                {renewals.slice(0, 5).map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="text-sm font-medium">{r.employer_name || "Unknown Employer"}</p>
                      <p className="text-xs text-muted-foreground">
                        Renews {r.renewal_date ? format(new Date(r.renewal_date), "MMM d, yyyy") : "TBD"}
                      </p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PipelineBreakdown({ cases }) {
  const stages = [
    { key: "draft", label: "Draft" },
    { key: "census", label: "Census", match: (s) => s.includes("census") },
    { key: "quoting", label: "Quoting", match: (s) => ["ready_for_quote", "quoting"].includes(s) },
    { key: "proposal", label: "Proposal", match: (s) => ["proposal_ready", "employer_review"].includes(s) },
    { key: "enrollment", label: "Enrollment", match: (s) => s.includes("enrollment") },
    { key: "active", label: "Active/Install", match: (s) => ["install_in_progress", "active"].includes(s) },
  ];

  const total = cases.filter(c => !["closed", "renewed"].includes(c.stage)).length || 1;

  return (
    <div className="space-y-3">
      {stages.map((stage) => {
        const count = cases.filter((c) =>
          stage.match ? stage.match(c.stage) : c.stage === stage.key
        ).length;
        const pct = Math.round((count / total) * 100);
        return (
          <div key={stage.key} className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground w-20 text-right">{stage.label}</span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary/70 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs font-semibold text-foreground w-6 text-right">{count}</span>
          </div>
        );
      })}
    </div>
  );
}