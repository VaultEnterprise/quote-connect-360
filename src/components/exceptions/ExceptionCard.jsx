import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, AlertCircle, Info, Zap, Clock, User, ExternalLink, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { format, differenceInDays } from "date-fns";

const SEVERITY_CONFIG = {
  critical: { color: "bg-red-100 text-red-700", icon: Zap, border: "border-l-red-500" },
  high: { color: "bg-orange-100 text-orange-700", icon: AlertTriangle, border: "border-l-orange-400" },
  medium: { color: "bg-amber-100 text-amber-700", icon: AlertCircle, border: "border-l-amber-400" },
  low: { color: "bg-blue-100 text-blue-700", icon: Info, border: "border-l-blue-400" },
};

const CATEGORY_COLORS = {
  census: "bg-purple-100 text-purple-700",
  quote: "bg-blue-100 text-blue-700",
  enrollment: "bg-emerald-100 text-emerald-700",
  carrier: "bg-orange-100 text-orange-700",
  document: "bg-gray-100 text-gray-700",
  billing: "bg-red-100 text-red-700",
  system: "bg-slate-100 text-slate-700",
};

/**
 * ExceptionCard
 * Rich exception card with overdue highlight, assign-to-me, status workflow menu.
 *
 * Props:
 *   exception       — ExceptionItem
 *   selected        — boolean
 *   onToggleSelect  — (id) => void
 *   onResolve       — (exception) => void
 *   onDismiss       — (id) => void
 *   onAssignToMe    — (id) => void
 *   onDetail        — (exception) => void
 *   currentUserEmail — string (optional)
 */
export default function ExceptionCard({
  exception,
  selected,
  onToggleSelect,
  onResolve,
  onDismiss,
  onAssignToMe,
  onDetail,
  currentUserEmail,
}) {
  const sev = SEVERITY_CONFIG[exception.severity] || SEVERITY_CONFIG.medium;
  const SevIcon = sev.icon;

  const isOverdue = exception.due_by && differenceInDays(new Date(exception.due_by), new Date()) < 0;
  const isResolved = ["resolved", "dismissed"].includes(exception.status);
  const isAssignedToMe = currentUserEmail && exception.assigned_to === currentUserEmail;

  return (
    <Card className={`border-l-4 ${sev.border} ${isOverdue ? "border-t-2 border-t-destructive" : ""} ${isResolved ? "opacity-60" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Checkbox */}
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggleSelect(exception.id)}
            className="mt-0.5"
          />

          {/* Content */}
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onDetail(exception)}>
            <div className="flex items-center gap-2 flex-wrap">
              <SevIcon className={`w-4 h-4 flex-shrink-0 ${
                exception.severity === "critical" ? "text-red-600" :
                exception.severity === "high" ? "text-orange-500" :
                exception.severity === "medium" ? "text-amber-500" : "text-blue-500"
              }`} />
              <p className="text-sm font-semibold flex-1">{exception.title}</p>
              {isOverdue && <Badge className="bg-destructive text-white text-[10px]">Overdue</Badge>}
              {isAssignedToMe && <Badge className="bg-primary/10 text-primary text-[10px]">My Exception</Badge>}
            </div>

            <div className="flex items-center gap-2 flex-wrap mt-1">
              <Badge className={`text-[10px] ${sev.color}`}>{exception.severity}</Badge>
              <Badge className={`text-[10px] ${CATEGORY_COLORS[exception.category] || "bg-gray-100 text-gray-700"}`}>
                {exception.category}
              </Badge>
              {exception.status !== "new" && (
                <Badge variant="outline" className="text-[10px] capitalize">{exception.status?.replace(/_/g, " ")}</Badge>
              )}
            </div>

            {exception.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{exception.description}</p>
            )}

            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
              {exception.employer_name && <span>{exception.employer_name}</span>}
              {exception.assigned_to && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />{exception.assigned_to.split("@")[0]}
                </span>
              )}
              {exception.due_by && (
                <span className={`flex items-center gap-1 ${isOverdue ? "text-destructive font-medium" : ""}`}>
                  <Clock className="w-3 h-3" />
                  Due {format(new Date(exception.due_by), "MMM d")}
                </span>
              )}
              {exception.case_id && (
                <Link
                  to={`/cases/${exception.case_id}`}
                  className="flex items-center gap-1 hover:text-primary"
                  onClick={e => e.stopPropagation()}
                >
                  <ExternalLink className="w-3 h-3" />Case
                </Link>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {!isResolved ? (
              <>
                {!exception.assigned_to && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => onAssignToMe(exception.id)}
                  >
                    Assign to me
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => onResolve(exception)}
                >
                  Resolve
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 text-muted-foreground hover:text-foreground"
                  onClick={() => onDismiss(exception.id)}
                >
                  Dismiss
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 text-muted-foreground"
                onClick={() => onDetail(exception)}
              >
                <ChevronRight className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}