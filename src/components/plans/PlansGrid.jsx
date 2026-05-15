import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, Pencil, Copy, Archive } from "lucide-react";

export default function PlansGrid({ plans, selectedIds, onToggleSelect, onOpenPreview, onEdit, onClone, onArchive }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="px-4 py-3"><Checkbox checked={plans.length > 0 && selectedIds.length === plans.length} onCheckedChange={() => {}} /></th>
              <th className="px-4 py-3 font-semibold">Plan</th>
              <th className="px-4 py-3 font-semibold">Carrier</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Version</th>
              <th className="px-4 py-3 font-semibold">Effective</th>
              <th className="px-4 py-3 font-semibold">Rates</th>
              <th className="px-4 py-3 font-semibold">Usage</th>
              <th className="px-4 py-3 font-semibold">Readiness</th>
              <th className="px-4 py-3 font-semibold">Updated</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id} className="border-t border-border align-top hover:bg-muted/20">
                <td className="px-4 py-3"><Checkbox checked={selectedIds.includes(plan.id)} onCheckedChange={() => onToggleSelect(plan.id)} /></td>
                <td className="px-4 py-3">
                  <button onClick={() => onOpenPreview(plan)} className="text-left hover:underline">
                    <p className="font-semibold text-foreground">{plan.plan_name}</p>
                    <p className="text-xs text-muted-foreground">{plan.plan_type} • {plan.plan_code || "No code"}</p>
                  </button>
                </td>
                <td className="px-4 py-3">{plan.carrier}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline">{plan.status}</Badge>
                    {plan.issues?.length > 0 && <Badge variant="secondary">{plan.issues.length} issues</Badge>}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{plan.versionLabel}</td>
                <td className="px-4 py-3 text-xs">{plan.effective_date || "—"}</td>
                <td className="px-4 py-3">
                  <Badge variant={plan.rateSummary?.hasRates ? "default" : "secondary"}>{plan.rateSummary?.hasRates ? "Ready" : "Missing"}</Badge>
                </td>
                <td className="px-4 py-3 text-xs">{plan.totalUsageCount || 0}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <Badge variant="outline">{plan.readinessStatus}</Badge>
                    <span className="text-[11px] text-muted-foreground">{plan.readinessScore}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{plan.updated_date ? new Date(plan.updated_date).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenPreview(plan)}><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(plan)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onClone(plan)}><Copy className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onArchive(plan)}><Archive className="h-4 w-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}