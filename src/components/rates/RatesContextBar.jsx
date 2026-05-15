import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SavedViewsDropdown from "@/components/plans/SavedViewsDropdown";

export default function RatesContextBar({
  masterGroups,
  tenants,
  filters,
  setFilters,
  onSavedView,
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="grid gap-3 xl:grid-cols-6">
        <Select value={filters.masterGroupId} onValueChange={(value) => setFilters((prev) => ({ ...prev, masterGroupId: value, tenantId: "all" }))}>
          <SelectTrigger><SelectValue placeholder="Master Group" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Master Groups</SelectItem>
            {masterGroups.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.tenantId} onValueChange={(value) => setFilters((prev) => ({ ...prev, tenantId: value }))}>
          <SelectTrigger><SelectValue placeholder="Tenant" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tenants</SelectItem>
            {tenants.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input value={filters.search} onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))} placeholder="Search rate set, plan, carrier, code..." />
        <Select value={filters.dateScope} onValueChange={(value) => setFilters((prev) => ({ ...prev, dateScope: value }))}>
          <SelectTrigger><SelectValue placeholder="Date Scope" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="current">Current Only</SelectItem>
            <SelectItem value="active_on_date">Active on Date</SelectItem>
            <SelectItem value="future">Future Effective</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="custom">Custom Date Range</SelectItem>
          </SelectContent>
        </Select>
        <SavedViewsDropdown onSelect={onSavedView} />
        <div className="flex items-center rounded-md border border-border bg-muted/40 px-3 text-xs text-muted-foreground">
          Scope: {filters.masterGroupId === "all" ? "All Master Groups" : "Scoped Master Group"} · {filters.tenantId === "all" ? "All Tenants" : "Scoped Tenant"}
        </div>
      </div>
    </div>
  );
}