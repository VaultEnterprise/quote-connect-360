import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ExternalLink, Trash2, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

/**
 * ExceptionDetailDrawer
 * Slide-out detail view with full record, status workflow, editable fields, case link.
 *
 * Props:
 *   exception  — ExceptionItem
 *   open       — boolean
 *   onClose    — () => void
 */
export default function ExceptionDetailDrawer({ exception, open, onClose }) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: exception?.title || "",
    description: exception?.description || "",
    category: exception?.category || "system",
    severity: exception?.severity || "medium",
    status: exception?.status || "new",
    assigned_to: exception?.assigned_to || "",
    due_by: exception?.due_by || "",
    suggested_action: exception?.suggested_action || "",
    resolution_notes: exception?.resolution_notes || "",
  });

  const { data: linkedCase } = useQuery({
    queryKey: ["exception-case", exception?.case_id],
    queryFn: () => exception?.case_id ? base44.entities.BenefitCase.filter({ id: exception.case_id }) : Promise.resolve([]),
    enabled: open && !!exception?.case_id,
  });

  const update = useMutation({
    mutationFn: () => base44.entities.ExceptionItem.update(exception.id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exceptions"] });
      setIsEditing(false);
    },
  });

  const deleteException = useMutation({
    mutationFn: () => base44.entities.ExceptionItem.delete(exception.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exceptions"] });
      onClose();
    },
  });

  const caseLink = linkedCase?.[0];

  if (!exception) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:w-96 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{exception.title}</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 mt-6">
          {/* Linked case */}
          {caseLink && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Linked Case</p>
                  <p className="text-sm font-medium text-blue-900 mt-0.5">{caseLink.employer_name}</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/cases/${caseLink.id}`} target="_blank">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Status and key fields */}
          {!isEditing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/40">
                  <p className="text-xs text-muted-foreground font-medium">Status</p>
                  <p className="text-sm font-semibold mt-1 capitalize">{exception.status?.replace(/_/g, " ")}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/40">
                  <p className="text-xs text-muted-foreground font-medium">Severity</p>
                  <p className="text-sm font-semibold mt-1 capitalize">{exception.severity}</p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/40">
                <p className="text-xs text-muted-foreground font-medium">Category</p>
                <p className="text-sm font-semibold mt-1 capitalize">{exception.category}</p>
              </div>

              {exception.assigned_to && (
                <div className="p-3 rounded-lg bg-muted/40 flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-medium">Assigned To</p>
                    <p className="text-sm font-semibold mt-0.5 truncate">{exception.assigned_to}</p>
                  </div>
                </div>
              )}

              {exception.due_by && (
                <div className="p-3 rounded-lg bg-muted/40 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground font-medium">Due By</p>
                    <p className="text-sm font-semibold mt-0.5">{format(new Date(exception.due_by), "MMM d, yyyy")}</p>
                  </div>
                </div>
              )}

              {exception.description && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Description</p>
                  <p className="text-sm leading-relaxed">{exception.description}</p>
                </div>
              )}

              {exception.suggested_action && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Suggested Action</p>
                  <p className="text-sm font-medium text-primary">{exception.suggested_action}</p>
                </div>
              )}

              {exception.resolution_notes && (
                <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-xs text-green-700 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Resolved
                  </p>
                  <p className="text-sm text-green-700 mt-1">{exception.resolution_notes}</p>
                </div>
              )}

              <div className="text-xs text-muted-foreground pt-2 border-t space-y-1">
                <p>Created: {format(new Date(exception.created_date), "MMM d, h:mm a")}</p>
                {exception.resolved_at && <p>Resolved: {format(new Date(exception.resolved_at), "MMM d, h:mm a")}</p>}
              </div>
            </div>
          ) : (
            /* Edit mode */
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Title</Label>
                <Input
                  value={formData.title}
                  onChange={e => setFormData(f => ({ ...f, title: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Category</Label>
                  <Select value={formData.category} onValueChange={v => setFormData(f => ({ ...f, category: v }))}>
                    <SelectTrigger className="mt-1 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["census", "quote", "enrollment", "carrier", "document", "billing", "system"].map(c => (
                        <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Severity</Label>
                  <Select value={formData.severity} onValueChange={v => setFormData(f => ({ ...f, severity: v }))}>
                    <SelectTrigger className="mt-1 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["low", "medium", "high", "critical"].map(s => (
                        <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs">Status</Label>
                <Select value={formData.status} onValueChange={v => setFormData(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="mt-1 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["new", "triaged", "in_progress", "waiting_external", "resolved", "dismissed"].map(s => (
                      <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Assigned To (email)</Label>
                <Input
                  type="email"
                  value={formData.assigned_to}
                  onChange={e => setFormData(f => ({ ...f, assigned_to: e.target.value }))}
                  placeholder="user@example.com"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Due By</Label>
                <Input
                  type="date"
                  value={formData.due_by}
                  onChange={e => setFormData(f => ({ ...f, due_by: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Suggested Action</Label>
                <Input
                  value={formData.suggested_action}
                  onChange={e => setFormData(f => ({ ...f, suggested_action: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Resolution Notes</Label>
                <Textarea
                  value={formData.resolution_notes}
                  onChange={e => setFormData(f => ({ ...f, resolution_notes: e.target.value }))}
                  rows={2}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t">
            {!isEditing ? (
              <>
                <Button variant="outline" className="flex-1 text-xs h-8" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => {
                    if (confirm("Delete this exception?")) {
                      deleteException.mutate();
                    }
                  }}
                  disabled={deleteException.isPending}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" className="flex-1 text-xs h-8" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button className="flex-1 text-xs h-8" onClick={() => update.mutate()} disabled={update.isPending}>
                  {update.isPending ? "Saving..." : "Save"}
                </Button>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}