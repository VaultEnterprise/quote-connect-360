import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck, Plus, Search, Filter, AlertTriangle, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import EnrollmentKPIBar from "@/components/enrollment/EnrollmentKPIBar";
import EnrollmentWindowCard from "@/components/enrollment/EnrollmentWindowCard";
import CreateEnrollmentModal from "@/components/enrollment/CreateEnrollmentModal";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { exportToCSV, generateFilename } from "@/utils/exportHelpers";
import { parseISO, differenceInDays } from "date-fns";

const STATUS_ORDER = { open: 0, closing_soon: 1, scheduled: 2, closed: 3, finalized: 4 };

export default function Enrollment() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [showCreate, setShowCreate] = useState(false);
  const [showUrgentOnly, setShowUrgentOnly] = useState(false);

  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ["enrollments-all"],
    queryFn: () => base44.entities.EnrollmentWindow.list("-created_date", 100),
  });

  const now = new Date();

  const closingSoon = useMemo(() => enrollments.filter(e => {
    if (!e.end_date || !["open","closing_soon"].includes(e.status)) return false;
    const d = differenceInDays(parseISO(e.end_date), now);
    return d >= 0 && d <= 7;
  }), [enrollments]);

  const filtered = useMemo(() => {
    let result = enrollments.filter(e => {
      const matchSearch = !search ||
        e.employer_name?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all"
        || (statusFilter === "active" && ["open","closing_soon","scheduled"].includes(e.status))
        || e.status === statusFilter;
      const matchUrgent = !showUrgentOnly || closingSoon.some(c => c.id === e.id);
      return matchSearch && matchStatus && matchUrgent;
    });

    return [...result].sort((a, b) =>
      (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99)
    );
  }, [enrollments, search, statusFilter, showUrgentOnly, closingSoon]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enrollment"
        description="Track and manage open enrollment windows"
        actions={
          <div className="flex items-center gap-2">
            {closingSoon.length > 0 && (
              <button
                onClick={() => setShowUrgentOnly(v => !v)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  showUrgentOnly
                    ? "bg-amber-100 text-amber-700 border-amber-300"
                    : "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                {closingSoon.length} closing ≤7 days
              </button>
            )}
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-2" /> New Enrollment Window
            </Button>
          </div>
        }
      />

      {/* KPI Bar */}
      <EnrollmentKPIBar enrollments={enrollments} />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by employer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 h-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-9">
            <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active Windows</SelectItem>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closing_soon">Closing Soon</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="finalized">Finalized</SelectItem>
          </SelectContent>
        </Select>

        {(search || statusFilter !== "active" || showUrgentOnly) && (
          <Button
            variant="ghost" size="sm"
            className="h-9 text-xs text-muted-foreground"
            onClick={() => { setSearch(""); setStatusFilter("active"); setShowUrgentOnly(false); }}
          >
            Clear filters
          </Button>
        )}

        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} window{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title={enrollments.length === 0 ? "No Enrollment Windows" : "No Windows Match"}
          description={
            enrollments.length === 0
              ? "Create an enrollment window when a case is approved for enrollment"
              : "Try adjusting your filters"
          }
          actionLabel={enrollments.length === 0 ? "New Enrollment Window" : undefined}
          onAction={enrollments.length === 0 ? () => setShowCreate(true) : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(e => (
            <EnrollmentWindowCard key={e.id} enrollment={e} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateEnrollmentModal open={showCreate} onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}