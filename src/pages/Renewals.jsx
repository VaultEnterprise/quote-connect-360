import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, LayoutGrid, List, Plus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";

// Renewal components
import RenewalKPIBar from "@/components/renewals/RenewalKPIBar";
import RateDistributionChart from "@/components/renewals/RateDistributionChart";
import RenewalCard from "@/components/renewals/RenewalCard";
import RenewalPipelineView from "@/components/renewals/RenewalPipelineView";
import RenewalDetailModal from "@/components/renewals/RenewalDetailModal";
import CreateRenewalModal from "@/components/renewals/CreateRenewalModal";

export default function Renewals() {
  const [selectedRenewal, setSelectedRenewal] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState("list"); // "list" or "pipeline"

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterUrgency, setFilterUrgency] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [filterRateDirection, setFilterRateDirection] = useState("all");

  const { data: renewals = [] } = useQuery({
    queryKey: ["renewals-all"],
    queryFn: () => base44.entities.RenewalCycle.list("-renewal_date", 100),
  });

  // ── Derived: unique assignees for filter ──────────────────────────────────────
  const uniqueAssignees = useMemo(() => {
    const assignees = [...new Set(renewals.map(r => r.assigned_to).filter(Boolean))];
    return assignees.sort();
  }, [renewals]);

  // ── Filtering logic ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return renewals.filter(r => {
      // Search by employer name
      if (searchQuery && !r.employer_name?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Filter by status
      if (filterStatus !== "all" && r.status !== filterStatus) {
        return false;
      }

      // Filter by urgency (due this month/60days/90days)
      if (filterUrgency !== "all" && r.renewal_date) {
        const now = new Date();
        const daysUntil = Math.ceil((new Date(r.renewal_date) - now) / (1000 * 60 * 60 * 24));
        if (filterUrgency === "30" && daysUntil > 30) return false;
        if (filterUrgency === "60" && (daysUntil > 60 || daysUntil <= 30)) return false;
        if (filterUrgency === "90" && (daysUntil > 90 || daysUntil <= 60)) return false;
      }

      // Filter by assignee
      if (filterAssignee !== "all" && r.assigned_to !== filterAssignee) {
        return false;
      }

      // Filter by rate direction
      if (filterRateDirection !== "all") {
        if (filterRateDirection === "increases" && (!r.rate_change_percent || r.rate_change_percent <= 0)) return false;
        if (filterRateDirection === "decreases" && (!r.rate_change_percent || r.rate_change_percent >= 0)) return false;
        if (filterRateDirection === "flat" && r.rate_change_percent !== 0) return false;
      }

      return true;
    });
  }, [renewals, searchQuery, filterStatus, filterUrgency, filterAssignee, filterRateDirection]);

  // ── Sort: by urgency (soonest first) ──────────────────────────────────────────
  const sortedByUrgency = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (!a.renewal_date || !b.renewal_date) return 0;
      return new Date(a.renewal_date) - new Date(b.renewal_date);
    });
  }, [filtered]);

  const handleExportCSV = () => {
    const rows = [
      ["Employer", "Status", "Renewal Date", "Current Premium", "Renewal Premium", "Rate Change %", "Disruption Score", "Recommendation", "Assigned To"],
      ...filtered.map(r => [
        r.employer_name || "",
        r.status || "",
        r.renewal_date || "",
        r.current_premium || "",
        r.renewal_premium || "",
        r.rate_change_percent || "",
        r.disruption_score || "",
        r.recommendation || "",
        r.assigned_to || "",
      ]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "renewals-pipeline.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <PageHeader title="Renewals" description="Track and manage upcoming renewals" />
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Renewal
        </Button>
      </div>

      {/* KPI Bar */}
      <RenewalKPIBar renewals={renewals} />

      {/* Rate distribution chart */}
      <RateDistributionChart renewals={renewals} />

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap bg-muted/30 p-3 rounded-lg">
        <Input
          placeholder="Search employer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-48 h-8"
        />

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pre_renewal">Pre-Renewal</SelectItem>
            <SelectItem value="marketed">Marketed</SelectItem>
            <SelectItem value="options_prepared">Options Prepared</SelectItem>
            <SelectItem value="employer_review">Employer Review</SelectItem>
            <SelectItem value="decision_made">Decision Made</SelectItem>
            <SelectItem value="install_renewal">Installing</SelectItem>
            <SelectItem value="active_renewal">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterUrgency} onValueChange={setFilterUrgency}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="Urgency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dates</SelectItem>
            <SelectItem value="30">Due within 30 days</SelectItem>
            <SelectItem value="60">Due within 60 days</SelectItem>
            <SelectItem value="90">Due within 90 days</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterAssignee} onValueChange={setFilterAssignee}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignees</SelectItem>
            {uniqueAssignees.map(assignee => (
              <SelectItem key={assignee} value={assignee}>
                {assignee.split("@")[0]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterRateDirection} onValueChange={setFilterRateDirection}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="Rate" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Rate Changes</SelectItem>
            <SelectItem value="increases">Rate Increases</SelectItem>
            <SelectItem value="decreases">Rate Decreases</SelectItem>
            <SelectItem value="flat">Flat (0%)</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <div className="flex items-center gap-1">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            className="h-8 px-2"
            onClick={() => setViewMode("list")}
          >
            <List className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant={viewMode === "pipeline" ? "default" : "outline"}
            size="sm"
            className="h-8 px-2"
            onClick={() => setViewMode("pipeline")}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </Button>
        </div>

        <Button variant="outline" size="sm" className="h-8 gap-1" onClick={handleExportCSV}>
          <Download className="w-3.5 h-3.5" /> Export
        </Button>
      </div>

      {/* No results */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={RefreshCw}
          title="No Renewals"
          description={renewals.length === 0
            ? "Renewal cycles will appear here as cases approach their renewal dates. Create one to get started."
            : "No renewals match your filters."}
        />
      ) : viewMode === "pipeline" ? (
        /* Pipeline view */
        <RenewalPipelineView
          renewals={sortedByUrgency}
          onSelect={setSelectedRenewal}
          onEdit={setSelectedRenewal}
        />
      ) : (
        /* List view */
        <div className="space-y-2">
          {sortedByUrgency.map(renewal => (
            <RenewalCard
              key={renewal.id}
              renewal={renewal}
              onClick={() => setSelectedRenewal(renewal)}
              onEdit={() => setSelectedRenewal(renewal)}
            />
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selectedRenewal && (
        <RenewalDetailModal
          renewal={selectedRenewal}
          open={!!selectedRenewal}
          onClose={() => setSelectedRenewal(null)}
        />
      )}

      {/* Create modal */}
      <CreateRenewalModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}