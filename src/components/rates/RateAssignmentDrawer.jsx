import React, { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RateAssignmentDrawer({ open, onClose, row, masterGroups, tenants, onSave }) {
  const [masterGroupId, setMasterGroupId] = useState("all");
  const [tenantId, setTenantId] = useState("all");
  const filteredTenants = useMemo(() => masterGroupId === "all" ? tenants : tenants.filter((item) => item.master_group_id === masterGroupId), [tenants, masterGroupId]);

  if (!row) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Assign Rate Set</SheetTitle>
        </SheetHeader>
        <div className="mt-5 space-y-4">
          <p className="text-sm text-muted-foreground">Configure assignment scope for {row.rate_set_name || row.linkedPlanName}.</p>
          <Select value={masterGroupId} onValueChange={setMasterGroupId}>
            <SelectTrigger><SelectValue placeholder="Master Group" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Master Groups</SelectItem>
              {masterGroups.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={tenantId} onValueChange={setTenantId}>
            <SelectTrigger><SelectValue placeholder="Tenant" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tenants</SelectItem>
              {filteredTenants.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
            Existing scope: {row.scopeType} · Direct assignments: {row.assignmentSummary.totalAssignments}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => onSave({ row, masterGroupId, tenantId })}>Save Assignment</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}