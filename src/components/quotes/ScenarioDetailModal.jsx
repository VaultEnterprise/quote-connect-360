import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Copy, Download, DollarSign, Calendar, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import StatusBadge from "@/components/shared/StatusBadge";

export default function ScenarioDetailModal({ scenario, open, onClose }) {
  const [copiedField, setCopiedField] = useState(null);

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!scenario) return null;

  const totalPremium = scenario.total_monthly_premium || 0;
  const employerCost = scenario.employer_monthly_cost || 0;
  const eeCost = scenario.employee_monthly_cost_avg || 0;
  const employerPct = totalPremium > 0 ? Math.round((employerCost / totalPremium) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {scenario.name}
            <StatusBadge status={scenario.status} />
            {scenario.is_recommended && <Badge className="bg-amber-100 text-amber-700"><Star className="w-3 h-3 mr-1" /> Recommended</Badge>}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="financials">Financials</TabsTrigger>
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="approval">Approval</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Status</p>
                    <StatusBadge status={scenario.status} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Recommendation Score</p>
                    <p className="text-sm font-semibold">{scenario.recommendation_score || "—"}/100</p>
                    {scenario.confidence_level && (
                      <Badge className="text-[10px] mt-1 capitalize">{scenario.confidence_level} confidence</Badge>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Effective Date</p>
                    <p className="text-sm">{scenario.effective_date ? format(parseISO(scenario.effective_date), "MMM d, yyyy") : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Disruption Score</p>
                    <p className="text-sm font-semibold">{scenario.disruption_score ?? "—"}/100</p>
                  </div>
                </div>

                {scenario.description && (
                  <div className="border-t pt-4">
                    <p className="text-xs text-muted-foreground font-medium mb-2">Description</p>
                    <p className="text-sm whitespace-pre-wrap">{scenario.description}</p>
                  </div>
                )}

                {scenario.tags && scenario.tags.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-xs text-muted-foreground font-medium mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {scenario.tags.map(tag => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {scenario.products_included && scenario.products_included.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-xs text-muted-foreground font-medium mb-2">Products</p>
                    <div className="flex flex-wrap gap-2">
                      {scenario.products_included.map(p => (
                        <Badge key={p} variant="outline" className="capitalize">{p.replace(/_/g, " ")}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {scenario.carriers_included && scenario.carriers_included.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-xs text-muted-foreground font-medium mb-2">Carriers</p>
                    <div className="flex flex-wrap gap-2">
                      {scenario.carriers_included.map(c => (
                        <Badge key={c} variant="outline">{c}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financials Tab */}
          <TabsContent value="financials" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <p className="text-xs text-blue-600 font-medium mb-1">Total Monthly Premium</p>
                    <p className="text-xl font-bold text-blue-700">${totalPremium.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                    <p className="text-xs text-green-600 font-medium mb-1">Employer Cost</p>
                    <p className="text-xl font-bold text-green-700">${employerCost.toLocaleString()}/mo</p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                    <p className="text-xs text-purple-600 font-medium mb-1">Avg Employee Cost</p>
                    <p className="text-xl font-bold text-purple-700">${eeCost.toLocaleString()}/mo</p>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="text-xs text-amber-600 font-medium mb-1">Cost Share</p>
                    <p className="text-xl font-bold text-amber-700">{employerPct}% / {100 - employerPct}%</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-xs text-muted-foreground font-medium mb-3">Cost Distribution</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Employer ({employerPct}%)</span>
                      <span className="font-semibold">${employerCost.toLocaleString()}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden flex">
                      <div className="bg-primary rounded-l-full" style={{ width: `${employerPct}%` }} />
                      <div className="bg-muted-foreground/30 flex-1" />
                    </div>
                    <div className="flex justify-between text-sm mt-3">
                      <span>Employee ({100 - employerPct}%)</span>
                      <span className="font-semibold">${eeCost.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">Contribution Strategy</p>
                    <p className="text-sm font-semibold capitalize">{scenario.contribution_strategy?.replace(/_/g, " ") || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">Plans Included</p>
                    <p className="text-sm font-semibold">{scenario.plan_count || 0} plans</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  {scenario.plan_count ? `${scenario.plan_count} plans included in this scenario` : "No plans added yet"}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Approval Tab */}
          <TabsContent value="approval" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-2">Approval Status</p>
                  <Badge className="capitalize">{scenario.approval_status || "none"}</Badge>
                </div>

                {scenario.approval_status === "pending" && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="text-xs text-amber-700 font-medium mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Pending Approval
                    </p>
                    <p className="text-xs text-amber-600">
                      Requested by {scenario.approval_requested_by || "unknown"} on{" "}
                      {scenario.approval_requested_at
                        ? format(parseISO(scenario.approval_requested_at), "MMM d, yyyy")
                        : "—"}
                    </p>
                  </div>
                )}

                {scenario.approval_status === "approved" && (
                  <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                    <p className="text-xs text-green-700 font-medium mb-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Approved
                    </p>
                    <p className="text-xs text-green-600">
                      Approved by {scenario.approval_approved_by || "unknown"} on{" "}
                      {scenario.approval_approved_at
                        ? format(parseISO(scenario.approval_approved_at), "MMM d, yyyy")
                        : "—"}
                    </p>
                  </div>
                )}

                {scenario.approval_notes && (
                  <div className="border-t pt-4">
                    <p className="text-xs text-muted-foreground font-medium mb-2">Notes</p>
                    <p className="text-sm whitespace-pre-wrap bg-muted/50 p-2 rounded">{scenario.approval_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  {scenario.versions && scenario.versions.length > 0
                    ? `${scenario.versions.length} historical versions`
                    : "No version history available"}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}