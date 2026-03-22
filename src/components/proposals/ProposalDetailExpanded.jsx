import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

export default function ProposalDetailExpanded({ proposal }) {
  if (!proposal) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Detailed Information</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary" className="space-y-3">
          <TabsList className="grid grid-cols-3 w-full text-xs h-8">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-2">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-muted/30 border">
                <p className="text-muted-foreground font-medium mb-0.5">Employer</p>
                <p className="font-semibold">{proposal.employer_name || "—"}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/30 border">
                <p className="text-muted-foreground font-medium mb-0.5">Broker</p>
                <p className="font-semibold">{proposal.broker_name || "—"}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/30 border">
                <p className="text-muted-foreground font-medium mb-0.5">Effective Date</p>
                <p className="font-semibold">{proposal.effective_date ? format(new Date(proposal.effective_date), "MMM d, yyyy") : "—"}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/30 border">
                <p className="text-muted-foreground font-medium mb-0.5">Agency</p>
                <p className="font-semibold">{proposal.agency_name || "—"}</p>
              </div>
            </div>
            {proposal.cover_message && (
              <div className="p-3 rounded-lg bg-muted/30 border">
                <p className="text-muted-foreground font-medium mb-1 text-xs">Cover Message</p>
                <p className="text-xs leading-relaxed">{proposal.cover_message}</p>
              </div>
            )}
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-2">
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border">
                <span className="text-muted-foreground">Created</span>
                <span className="font-semibold">{proposal.created_date ? format(new Date(proposal.created_date), "MMM d, yyyy h:mm a") : "—"}</span>
              </div>
              {proposal.sent_at && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-blue-50 border border-blue-200">
                  <span className="text-blue-700">Sent</span>
                  <span className="font-semibold text-blue-700">{format(new Date(proposal.sent_at), "MMM d, yyyy h:mm a")}</span>
                </div>
              )}
              {proposal.viewed_at && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-purple-50 border border-purple-200">
                  <span className="text-purple-700">Viewed</span>
                  <span className="font-semibold text-purple-700">{format(new Date(proposal.viewed_at), "MMM d, yyyy h:mm a")}</span>
                </div>
              )}
              {proposal.approved_at && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                  <span className="text-emerald-700">Approved</span>
                  <span className="font-semibold text-emerald-700">{format(new Date(proposal.approved_at), "MMM d, yyyy h:mm a")}</span>
                </div>
              )}
              {proposal.expires_at && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                  <span className="text-amber-700">Expires</span>
                  <span className="font-semibold text-amber-700">{format(new Date(proposal.expires_at), "MMM d, yyyy")}</span>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="space-y-2">
            <div className="space-y-2 text-xs">
              {proposal.total_monthly_premium !== undefined && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border">
                  <span className="text-muted-foreground">Total Monthly Premium</span>
                  <span className="font-bold text-primary">${proposal.total_monthly_premium.toLocaleString()}</span>
                </div>
              )}
              {proposal.employer_monthly_cost !== undefined && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border">
                  <span className="text-muted-foreground">Employer Monthly Cost</span>
                  <span className="font-semibold">${proposal.employer_monthly_cost.toLocaleString()}</span>
                </div>
              )}
              {proposal.employee_avg_cost !== undefined && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border">
                  <span className="text-muted-foreground">Avg Employee Cost</span>
                  <span className="font-semibold">${proposal.employee_avg_cost.toLocaleString()}</span>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}