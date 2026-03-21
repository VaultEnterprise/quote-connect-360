import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Pencil, Plus, X } from "lucide-react";
import { format } from "date-fns";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import TaskModal from "@/components/cases/TaskModal";

/**
 * CaseTasksTab
 * Displays all CaseTask records for a given case_id.
 * Supports create, edit, and delete actions inline.
 *
 * Props:
 *   caseId       — string (BenefitCase.id)
 *   employerName — string (for task creation context)
 *   tasks        — CaseTask[]
 */
export default function CaseTasksTab({ caseId, employerName, tasks }) {
  const queryClient = useQueryClient();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const deleteTask = useMutation({
    mutationFn: (id) => base44.entities.CaseTask.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["case-tasks", caseId] }),
  });

  const openCreate = () => { setEditingTask(null); setShowTaskModal(true); };
  const openEdit = (task) => { setEditingTask(task); setShowTaskModal(true); };
  const closeModal = () => { setShowTaskModal(false); setEditingTask(null); };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">{tasks.length} task(s)</h3>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Task
        </Button>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No Tasks"
          description="Tasks will appear here as the case progresses"
          actionLabel="Add Task"
          onAction={openCreate}
        />
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => {
            const isOverdue = t.due_date && new Date(t.due_date) < new Date() && t.status !== "completed";
            return (
              <Card key={t.id} className={isOverdue ? "border-destructive/30" : ""}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${t.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                      {t.title}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                      {t.assigned_to && <span>{t.assigned_to}</span>}
                      {t.due_date && (
                        <span className={isOverdue ? "text-destructive font-medium" : ""}>
                          Due {format(new Date(t.due_date), "MMM d")}
                        </span>
                      )}
                      {t.description && <span className="truncate max-w-48">{t.description}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={t.priority} />
                    <StatusBadge status={t.status} />
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7"
                      onClick={() => openEdit(t)}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => deleteTask.mutate(t.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showTaskModal && (
        <TaskModal
          caseId={caseId}
          employerName={employerName}
          task={editingTask}
          open={showTaskModal}
          onClose={closeModal}
        />
      )}
    </>
  );
}