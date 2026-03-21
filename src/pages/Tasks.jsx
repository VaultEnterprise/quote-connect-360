import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CheckCircle2, Search, Filter, Plus, Clock, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import TaskModal from "@/components/cases/TaskModal";
import { format } from "date-fns";

export default function Tasks() {
  const [statusFilter, setStatusFilter] = useState("active");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks-all"],
    queryFn: () => base44.entities.CaseTask.list("-created_date", 100),
  });

  const toggleTask = useMutation({
    mutationFn: ({ id, currentStatus }) => base44.entities.CaseTask.update(id, {
      status: currentStatus === "completed" ? "pending" : "completed",
      completed_at: currentStatus !== "completed" ? new Date().toISOString() : null,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks-all"] }),
  });

  const deleteTask = useMutation({
    mutationFn: (id) => base44.entities.CaseTask.delete(id),
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
        description={`${overdue.length > 0 ? `${overdue.length} overdue • ` : ""}${tasks.filter(t => !["completed", "cancelled"].includes(t.status)).length} active`}
        actions={
          <Button size="sm" onClick={() => { setEditingTask(null); setShowModal(true); }}>
            <Plus className="w-4 h-4 mr-1.5" /> New Task
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-9">
            <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" /><SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={CheckCircle2} title={statusFilter === "active" ? "All caught up!" : "No tasks found"} description="No tasks match your current filters" />
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => {
            const isOverdue = t.due_date && new Date(t.due_date) < new Date() && t.status !== "completed";
            return (
              <Card key={t.id} className={`transition-all ${isOverdue ? "border-destructive/30" : ""}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <Checkbox checked={t.status === "completed"} onCheckedChange={() => toggleTask.mutate({ id: t.id, currentStatus: t.status })} className="flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${t.status === "completed" ? "line-through text-muted-foreground" : ""}`}>{t.title}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                      {t.employer_name && (
                        <Link to={`/cases/${t.case_id}`} className="hover:text-primary transition-colors">{t.employer_name}</Link>
                      )}
                      {t.assigned_to && <span>→ {t.assigned_to}</span>}
                      {t.due_date && (
                        <span className={`flex items-center gap-1 ${isOverdue ? "text-destructive font-medium" : ""}`}>
                          <Clock className="w-3 h-3" />{isOverdue ? "Overdue: " : ""}{format(new Date(t.due_date), "MMM d")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={t.priority} />
                    <StatusBadge status={t.status} />
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingTask(t); setShowModal(true); }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteTask.mutate(t.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showModal && (
        <TaskModal
          caseId={editingTask?.case_id || ""}
          employerName={editingTask?.employer_name || ""}
          task={editingTask}
          open={showModal}
          onClose={() => { setShowModal(false); setEditingTask(null); }}
        />
      )}
    </div>
  );
}