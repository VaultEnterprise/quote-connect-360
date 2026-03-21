import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { AlertCircle, Clock, CheckCircle2, Search, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { format } from "date-fns";

export default function Tasks() {
  const [statusFilter, setStatusFilter] = useState("active");
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks-all"],
    queryFn: () => base44.entities.CaseTask.list("-created_date", 100),
  });

  const toggleTask = useMutation({
    mutationFn: async ({ id, currentStatus }) => {
      const newStatus = currentStatus === "completed" ? "pending" : "completed";
      await base44.entities.CaseTask.update(id, {
        status: newStatus,
        completed_at: newStatus === "completed" ? new Date().toISOString() : null,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks-all"] }),
  });

  const filtered = tasks.filter((t) => {
    const matchSearch = !search || t.title?.toLowerCase().includes(search.toLowerCase()) || t.employer_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || (statusFilter === "active" && !["completed", "cancelled"].includes(t.status)) || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const overdue = filtered.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== "completed");

  return (
    <div>
      <PageHeader
        title="Tasks"
        description={`${overdue.length > 0 ? `${overdue.length} overdue • ` : ""}${filtered.filter(t => t.status === "pending").length} pending`}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-9">
            <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title={statusFilter === "active" ? "All caught up!" : "No tasks found"}
          description="No tasks match your current filters"
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => {
            const isOverdue = t.due_date && new Date(t.due_date) < new Date() && t.status !== "completed";
            return (
              <Card key={t.id} className={`transition-all ${isOverdue ? "border-destructive/30" : ""}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <Checkbox
                    checked={t.status === "completed"}
                    onCheckedChange={() => toggleTask.mutate({ id: t.id, currentStatus: t.status })}
                    className="flex-shrink-0"
                  />
                  <Link to={`/cases/${t.case_id}`} className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${t.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                      {t.title}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                      {t.employer_name && <span>{t.employer_name}</span>}
                      {t.assigned_to && <span>→ {t.assigned_to}</span>}
                      {t.due_date && (
                        <span className={`flex items-center gap-1 ${isOverdue ? "text-destructive font-medium" : ""}`}>
                          <Clock className="w-3 h-3" />
                          {isOverdue ? "Overdue: " : ""}
                          {format(new Date(t.due_date), "MMM d")}
                        </span>
                      )}
                    </div>
                  </Link>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={t.priority} />
                    <StatusBadge status={t.status} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}