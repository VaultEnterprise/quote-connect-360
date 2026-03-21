import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Briefcase, Plus, Search, Filter, Calendar, Users, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { CaseListSkeleton } from "@/components/shared/LoadingSkeleton";
import { format } from "date-fns";

const STAGE_OPTIONS = [
  { value: "all", label: "All Stages" },
  { value: "draft", label: "Draft" },
  { value: "census_in_progress", label: "Census In Progress" },
  { value: "census_validated", label: "Census Validated" },
  { value: "ready_for_quote", label: "Ready for Quote" },
  { value: "quoting", label: "Quoting" },
  { value: "proposal_ready", label: "Proposal Ready" },
  { value: "employer_review", label: "Employer Review" },
  { value: "approved_for_enrollment", label: "Approved for Enrollment" },
  { value: "enrollment_open", label: "Enrollment Open" },
  { value: "enrollment_complete", label: "Enrollment Complete" },
  { value: "install_in_progress", label: "Install In Progress" },
  { value: "active", label: "Active" },
  { value: "renewal_pending", label: "Renewal Pending" },
];

export default function Cases() {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ["cases"],
    queryFn: () => base44.entities.BenefitCase.list("-created_date", 100),
  });

  const filtered = cases.filter((c) => {
    const matchSearch = !search ||
      c.employer_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.case_number?.toLowerCase().includes(search.toLowerCase()) ||
      c.assigned_to?.toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === "all" || c.stage === stageFilter;
    const matchType = typeFilter === "all" || c.case_type === typeFilter;
    const matchPriority = priorityFilter === "all" || c.priority === priorityFilter;
    return matchSearch && matchStage && matchType && matchPriority;
  });

  const activeFilters = [stageFilter, typeFilter, priorityFilter].filter(f => f !== "all").length;
  const clearFilters = () => { setStageFilter("all"); setTypeFilter("all"); setPriorityFilter("all"); setSearch(""); };

  return (
    <div>
      <PageHeader
        title="Cases"
        description="Manage your benefit cases across the lifecycle"
        actions={
          <Link to="/cases/new">
            <Button className="shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> New Case
            </Button>
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search employer, case #, or assignee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-44 h-9">
              <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              {STAGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Case Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="new_business">New Business</SelectItem>
              <SelectItem value="renewal">Renewal</SelectItem>
              <SelectItem value="mid_year_change">Mid-Year Change</SelectItem>
              <SelectItem value="takeover">Takeover</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {activeFilters > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{filtered.length} of {cases.length} cases</span>
            <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground" onClick={clearFilters}>
              <X className="w-3 h-3 mr-1" /> Clear filters
            </Button>
          </div>
        )}
      </div>

      {/* Case List */}
      {isLoading ? <CaseListSkeleton /> : filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No cases found"
          description={search || stageFilter !== "all" ? "Try adjusting your filters" : "Create your first benefit case to begin"}
          actionLabel={!search && stageFilter === "all" && typeFilter === "all" && priorityFilter === "all" ? "Create Case" : undefined}
          onAction={!search && stageFilter === "all" && typeFilter === "all" && priorityFilter === "all" ? () => window.location.href = "/cases/new" : undefined}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <Link key={c.id} to={`/cases/${c.id}`}>
              <Card className="hover:shadow-md transition-all duration-200 hover:border-primary/20 cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{c.employer_name || "Unnamed Employer"}</p>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          <span className="text-xs text-muted-foreground">{c.case_number || `#${c.id?.slice(-6)}`}</span>
                          <span className="text-xs text-muted-foreground capitalize">{c.case_type?.replace(/_/g, " ")}</span>
                          {c.effective_date && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(c.effective_date), "MMM d, yyyy")}
                            </span>
                          )}
                          {c.employee_count && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {c.employee_count} employees
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {c.assigned_to && (
                        <span className="text-xs text-muted-foreground hidden lg:block truncate max-w-28">{c.assigned_to}</span>
                      )}
                      {c.priority && c.priority !== "normal" && (
                        <StatusBadge status={c.priority} />
                      )}
                      <StatusBadge status={c.stage} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}