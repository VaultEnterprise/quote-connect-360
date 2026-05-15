import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

export default function RatesGridSection({ rows, selectedIds, setSelectedIds, onOpenPreview }) {
  const toggleSelect = (id) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-3 text-sm text-muted-foreground">
        <Button variant="outline" size="sm">Columns</Button>
        <Button variant="outline" size="sm">Export View</Button>
        <Button variant="outline" size="sm">Grouping</Button>
        <Button variant="outline" size="sm">Sort Presets</Button>
        <Button variant="outline" size="sm">Reset Columns</Button>
        <Button variant="outline" size="sm">Density</Button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1900px] text-sm">
            <thead className="sticky top-0 bg-muted/50">
              <tr>
                <th className="px-3 py-3"><Checkbox checked={rows.length > 0 && selectedIds.length === rows.length} onCheckedChange={() => {}} /></th>
                <th className="px-3 py-3 text-left">Rate Set Name</th>
                <th className="px-3 py-3 text-left">Code</th>
                <th className="px-3 py-3 text-left">Linked Plan</th>
                <th className="px-3 py-3 text-left">Plan Type</th>
                <th className="px-3 py-3 text-left">Carrier</th>
                <th className="px-3 py-3 text-left">Rate Model</th>
                <th className="px-3 py-3 text-left">Version</th>
                <th className="px-3 py-3 text-left">Version Status</th>
                <th className="px-3 py-3 text-left">Readiness</th>
                <th className="px-3 py-3 text-left">Effective</th>
                <th className="px-3 py-3 text-left">End</th>
                <th className="px-3 py-3 text-left">Scope</th>
                <th className="px-3 py-3 text-left">Master Groups</th>
                <th className="px-3 py-3 text-left">Tenants</th>
                <th className="px-3 py-3 text-left">Tier Summary</th>
                <th className="px-3 py-3 text-left">Contribution</th>
                <th className="px-3 py-3 text-left">Quote Usage</th>
                <th className="px-3 py-3 text-left">Enrollment Usage</th>
                <th className="px-3 py-3 text-left">Updated</th>
                <th className="px-3 py-3 text-left">Updated By</th>
                <th className="px-3 py-3 text-left">Issues</th>
                <th className="px-3 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-3 py-3"><Checkbox checked={selectedIds.includes(row.id)} onCheckedChange={() => toggleSelect(row.id)} /></td>
                  <td className="px-3 py-3"><button onClick={() => onOpenPreview(row)} className="font-semibold text-left hover:underline">{row.rate_set_name || row.linkedPlanName}</button></td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{row.internal_code || row.id.slice(0, 8)}</td>
                  <td className="px-3 py-3">{row.linkedPlanName}</td>
                  <td className="px-3 py-3">{row.planType}</td>
                  <td className="px-3 py-3">{row.carrier}</td>
                  <td className="px-3 py-3">{row.rate_type}</td>
                  <td className="px-3 py-3">{row.version_number || 1}</td>
                  <td className="px-3 py-3"><Badge variant="outline">{row.versionStatus}</Badge></td>
                  <td className="px-3 py-3"><Badge variant="outline">{row.readinessStatus}</Badge></td>
                  <td className="px-3 py-3">{row.effective_date || "—"}</td>
                  <td className="px-3 py-3">{row.end_date || "—"}</td>
                  <td className="px-3 py-3">{row.scopeType}</td>
                  <td className="px-3 py-3">{row.masterGroupCount}</td>
                  <td className="px-3 py-3">{row.tenantAssignmentCount}</td>
                  <td className="px-3 py-3">{row.coverageTierSummary}</td>
                  <td className="px-3 py-3">{row.contributionLinkageStatus}</td>
                  <td className="px-3 py-3">{row.quoteUsageStatus}</td>
                  <td className="px-3 py-3">{row.enrollmentUsageStatus}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{row.updated_date ? new Date(row.updated_date).toLocaleDateString() : "—"}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{row.created_by || "System"}</td>
                  <td className="px-3 py-3"><Badge variant="secondary">{row.issueCount}</Badge></td>
                  <td className="px-3 py-3"><Button size="sm" variant="ghost" onClick={() => onOpenPreview(row)}>Open</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm text-muted-foreground">
        <span>{rows.length} rate sets</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Previous</Button>
          <Button variant="outline" size="sm">Next</Button>
        </div>
      </div>
    </div>
  );
}