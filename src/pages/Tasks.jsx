import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2, Search, Filter, Plus, Clock, Pencil, Trash2,
  AlertCircle, Calendar, User, Briefcase, ChevronDown, ChevronRight,
  ArrowUpRight, ListChecks, BarChart2, Circle, Loader2, Ban, XCircle,
  Star, ChevronUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import TaskModal from "@/components/cases/TaskModal";
import { format, isToday, isTomorrow, isPast, isThisWeek } from "date-fns";
import useRouteContext from "@/hooks/useRouteContext";
import useTasksPageModel from "@/domain/tasks/useTasksPageModel";
import { buildRoute } from "@/contracts/routeContracts";

const PRIORITY_ORDER = { urgent: 0, high: 1, normal: 2, low: 3 };
const STATUS_ICON = {
  pending: <Circle className="w-4 h-4 text-muted-foreground" />,
  in_progress: <Loader2 className="w-4 h-4 text-blue-500" />,
  completed: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  blocked: <Ban className="w-4 h-4 text-destructive" />,
  cancelled: <XCircle className="w-4 h-4 text-muted-foreground" />,
};
const PRIORITY_COLOR = {
  urgent: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  normal: "bg-slate-100 text-slate-600 border-slate-200",
  low: "bg-gray-100 text-gray-500 border-gray-200",
};
const TYPE_LABELS = {
  action_required: "Action Required",
  follow_up: "Follow Up",
  review: "Review",
  approval: "Approval",
  document: "Document",
  system: "System",
};

function dueDateLabel(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isPast(d) && !isToday(d)) return { label: "Overdue", color: "text-destructive font-semibold" };
  if (isToday(d)) return { label: "Due Today", color: "text-orange-600 font-semibold" };
  if (isTomorrow(d)) return { label: "Due Tomorrow", color: "text-amber-600" };
  if (isThisWeek(d)) return { label: `Due ${format(d, "EEE")}`, color: "text-blue-600" };
  return { label: `Due ${format(d, "MMM d")}`, color: "text-muted-foreground" };
}

function TaskRow({ task, onEdit, onDelete, onStatusChange, selected, onSelect }) {
  const [expanded, setExpanded] = useState(false);
  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date)) && task.status !== "completed";
  const isDone = task.status === "completed" || task.status === "cancelled";
  const due = dueDateLabel(task.due_date);
  const hasNotes = task.description && task.description.length > 60;

  return (
    <div className={`rounded-xl border transition-all hover:shadow-sm group ${isOverdue ? "border-destructive/30 bg-red-50/30" : "border-border bg-card"} ${isDone ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-3 p-3.5">
        {/* Select checkbox */}
        <Checkbox checked={selected} onCheckedChange={onSelect} className="mt-0.5 shrink-0" />

        {/* Status toggle */}
        <button
          className="mt-0.5 shrink-0 hover:scale-110 transition-transform"
          onClick={() => onStatusChange(task)}
          title={`Mark as ${task.status === "completed" ? "pending" : "completed"}`}
        >
          {STATUS_ICON[task.status] || STATUS_ICON.pending}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <p className={`text-sm font-medium leading-snug ${isDone ? "line-through text-muted-foreground" : ""}`}>
              {task.title}
            </p>
            <Badge variant="outline" className={`text-[10px] py-0 px-1.5 border ${PRIORITY_COLOR[task.priority] || PRIORITY_COLOR.normal}`}>
              {task.priority || "normal"}
            </Badge>
            {task.task_type && task.task_type !== "action_required" && (
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-muted-foreground">
                {TYPE_LABELS[task.task_type] || task.task_type}
              </Badge>
            )}
          </div>

          {/* Short description preview (collapsed) */}
          {task.description && !expanded && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
          )}

          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {task.employer_name && task.case_id && (
              <Link
                to={buildRoute("caseDetail", { caseId: task.case_id })}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
                onClick={e => e.stopPropagation()}
              >
                <Briefcase className="w-3 h-3" />
                {task.employer_name}
                <ArrowUpRight className="w-2.5 h-2.5" />
              </Link>
            )}
            {task.employer_name && !task.case_id && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Briefcase className="w-3 h-3" />
                {task.employer_name}
              </span>
            )}
            {task.assigned_to && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="w-3 h-3" />
                {task.assigned_to}
              </span>
            )}
            {due && (
              <span className={`flex items-center gap-1 text-xs ${due.color}`}>
                <Clock className="w-3 h-3" />
                {due.label}
              </span>
            )}
            {/* Expand notes toggle */}
            {task.description && (
              <button
                onClick={() => setExpanded(v => !v)}
                className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto"
              >
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {expanded ? "Hide notes" : "Show notes"}
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(task)}>
            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(task.id)}>
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Expanded notes panel */}
      {expanded && task.description && (
        <div className="px-4 pb-3.5 pt-0 ml-10 border-t border-border/50">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 mt-2.5">Notes</p>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{task.description}</p>
          {task.notes && (
            <>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 mt-3">Additional Notes</p>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{task.notes}</p>
            </>
          )}
          {task.completed_at && (
            <p className="text-xs text-muted-foreground mt-2">Completed {format(new Date(task.completed_at), "MMM d, yyyy 'at' h:mm a")}</p>
          )}
        </div>
      )}
    </div>
  );
}

function GroupedSection({ title, tasks, collapsed, onToggle, onEdit, onDelete, onStatusChange, selected, onSelect, accent }) {
  return (
    <div className="space-y-1">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-1 py-1 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        <span className={accent}>{title}</span>
        <Badge variant="secondary" className="text-[10px] ml-1">{tasks.length}</Badge>
      </button>
      {!collapsed && (
        <div className="space-y-1.5 pl-2">
          {tasks.map(t => (
            <TaskRow
              key={t.id} task={t}
              onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange}
              selected={selected.includes(t.id)}
              onSelect={(v) => onSelect(t.id, v)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Tasks() {
  const routeContext = useRouteContext();
  const caseScope = routeContext.caseId || "";
  const [statusFilter, setStatusFilter] = useState("active");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [myTasksOnly, setMyTasksOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [groupBy, setGroupBy] = useState("due_date");
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [collapsed, setCollapsed] = useState({});
  const [selected, setSelected] = useState([]);

  const {
    cases,
    isLoading,
    assignees,
    filtered,
    groups,
    activeTasks,
    overdueTasks,
    completedToday,
    dueTodayCount,
    toggleStatus,
    deleteTask,
    bulkComplete,
    bulkDelete,
  } = useTasksPageModel({
    caseScope,
    search,
    statusFilter,
    priorityFilter,
    typeFilter,
    assigneeFilter,
    myTasksOnly,
    groupBy,
    selectedIds: selected,
  });

  const handleSelect = (id, val) => {
    setSelected((prev) => (val ? [...prev, id] : prev.filter((item) => item !== id)));
  };

  const handleSelectAll = () => {
    setSelected((prev) => (prev.length === filtered.length ? [] : filtered.map((task) => task.id)));
  };

  const toggleGroup = (key) => setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description={`${activeTasks.length} active · ${overdueTasks.length} overdue · ${completedToday.length} done today`}
        actions={
          <Button size="sm" onClick={() => { setEditingTask(null); setShowModal(true); }}>
            <Plus className="w-4 h-4 mr-1.5" /> New Task
          </Button>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Active", value: activeTasks.length, icon: ListChecks, color: "text-primary", bg: "bg-primary/5" },
          { label: "Overdue", value: overdueTasks.length, icon: AlertCircle, color: "text-destructive", bg: "bg-red-50" },
          { label: "Due Today", value: dueTodayCount, icon: Calendar, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Completed", value: completedToday.length, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
        ].map(s => (
          <Card key={s.label} className="cursor-pointer hover:shadow-sm transition-all" onClick={() => setStatusFilter(s.label === "Overdue" ? "active" : s.label === "Active" ? "active" : s.label === "Completed" ? "completed" : "active")}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.bg}`}><s.icon className={`w-4 h-4 ${s.color}`} /></div>
              <div>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
        {/* My Tasks toggle */}
        <button
          onClick={() => { setMyTasksOnly(v => !v); setAssigneeFilter("all"); }}
          className={`flex items-center gap-1.5 px-3 h-9 rounded-md border text-sm font-medium transition-colors shrink-0 ${myTasksOnly ? "bg-primary text-primary-foreground border-primary" : "bg-background border-input hover:bg-muted text-foreground"}`}
        >
          <Star className={`w-3.5 h-3.5 ${myTasksOnly ? "fill-current" : ""}`} />
          My Tasks
        </button>

        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search tasks, employer, assignee..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        {/* Assignee filter — only show if there are multiple assignees */}
        {assignees.length > 1 && !myTasksOnly && (
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-44 h-9"><SelectValue placeholder="All Assignees" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              {assignees.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Select value={groupBy} onValueChange={setGroupBy}>
          <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="due_date">Group: Due Date</SelectItem>
            <SelectItem value="priority">Group: Priority</SelectItem>
            <SelectItem value="case">Group: Case</SelectItem>
            <SelectItem value="status">Group: Status</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk actions bar */}
      {selected.length > 0 && (
        <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-2.5">
          <span className="text-sm font-medium">{selected.length} selected</span>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => bulkComplete.mutate()} disabled={bulkComplete.isPending}>
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Mark Complete
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs text-destructive border-destructive/30" onClick={() => bulkDelete.mutate()} disabled={bulkDelete.isPending}>
            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs ml-auto" onClick={() => setSelected([])}>Clear</Button>
        </div>
      )}

      {/* Select all */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-2 px-1">
          <Checkbox
            checked={selected.length === filtered.length && filtered.length > 0}
            onCheckedChange={handleSelectAll}
            className="w-3.5 h-3.5"
          />
          <span className="text-xs text-muted-foreground">{filtered.length} task{filtered.length !== 1 ? "s" : ""} shown</span>
        </div>
      )}

      {/* Task list */}
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title={statusFilter === "active" && !search ? "All caught up!" : "No tasks found"}
          description={search ? "Try different search terms or filters" : "No tasks match the current filters"}
          actionLabel="New Task"
          onAction={() => { setEditingTask(null); setShowModal(true); }}
        />
      ) : (
        <div className="space-y-4">
          {groups.map(g => (
            <GroupedSection
              key={g.key}
              title={g.label}
              tasks={g.tasks}
              accent={g.accent}
              collapsed={!!collapsed[g.key]}
              onToggle={() => toggleGroup(g.key)}
              onEdit={(t) => { setEditingTask(t); setShowModal(true); }}
              onDelete={(id) => deleteTask.mutate(id)}
              onStatusChange={(t) => toggleStatus.mutate(t)}
              selected={selected}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}

      {showModal && (
        <TaskModal
          caseId={editingTask?.case_id || ""}
          employerName={editingTask?.employer_name || ""}
          task={editingTask}
          open={showModal}
          cases={cases}
          onClose={() => { setShowModal(false); setEditingTask(null); }}
        />
      )}
    </div>
  );
}