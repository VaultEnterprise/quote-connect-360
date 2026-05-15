import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RatesFilterPanel({ filters, setFilters, plans, carriers }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Select value={filters.linkedPlanId} onValueChange={(value) => setFilters((prev) => ({ ...prev, linkedPlanId: value }))}>
          <SelectTrigger><SelectValue placeholder="Linked Plan" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            {plans.map((plan) => <SelectItem key={plan.id} value={plan.id}>{plan.plan_name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.planType} onValueChange={(value) => setFilters((prev) => ({ ...prev, planType: value }))}>
          <SelectTrigger><SelectValue placeholder="Plan Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="medical">Medical</SelectItem>
            <SelectItem value="dental">Dental</SelectItem>
            <SelectItem value="vision">Vision</SelectItem>
            <SelectItem value="life">Life</SelectItem>
            <SelectItem value="std">STD</SelectItem>
            <SelectItem value="ltd">LTD</SelectItem>
            <SelectItem value="voluntary">Voluntary</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.carrier} onValueChange={(value) => setFilters((prev) => ({ ...prev, carrier: value }))}>
          <SelectTrigger><SelectValue placeholder="Carrier" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Carriers</SelectItem>
            {carriers.map((carrier) => <SelectItem key={carrier} value={carrier}>{carrier}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.rateModel} onValueChange={(value) => setFilters((prev) => ({ ...prev, rateModel: value }))}>
          <SelectTrigger><SelectValue placeholder="Rate Model" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Models</SelectItem>
            <SelectItem value="composite">Composite</SelectItem>
            <SelectItem value="age_banded">Age Banded</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.readinessStatus} onValueChange={(value) => setFilters((prev) => ({ ...prev, readinessStatus: value }))}>
          <SelectTrigger><SelectValue placeholder="Readiness" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Readiness</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Incomplete">Incomplete</SelectItem>
            <SelectItem value="NeedsReview">Needs Review</SelectItem>
            <SelectItem value="ReadyToPublish">Ready to Publish</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Superseded">Superseded</SelectItem>
            <SelectItem value="Archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.scopeType} onValueChange={(value) => setFilters((prev) => ({ ...prev, scopeType: value }))}>
          <SelectTrigger><SelectValue placeholder="Scope Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Scope</SelectItem>
            <SelectItem value="global">Global</SelectItem>
            <SelectItem value="master_group">Master Group</SelectItem>
            <SelectItem value="tenant">Tenant</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.quoteUsage} onValueChange={(value) => setFilters((prev) => ({ ...prev, quoteUsage: value }))}>
          <SelectTrigger><SelectValue placeholder="Quote Usage" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Quote Usage</SelectItem>
            <SelectItem value="in_use">In Use</SelectItem>
            <SelectItem value="none">No Usage</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 md:col-span-2">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={filters.missingTiers} onChange={(e) => setFilters((prev) => ({ ...prev, missingTiers: e.target.checked }))} />Missing Tiers</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={filters.missingAssignments} onChange={(e) => setFilters((prev) => ({ ...prev, missingAssignments: e.target.checked }))} />Missing Assignments</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={filters.missingContributionLinkage} onChange={(e) => setFilters((prev) => ({ ...prev, missingContributionLinkage: e.target.checked }))} />Missing Contribution Linkage</label>
        </div>
        <div className="flex items-center gap-2 md:col-span-2">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={filters.expiringSoon} onChange={(e) => setFilters((prev) => ({ ...prev, expiringSoon: e.target.checked }))} />Expiring Soon</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={filters.futureEffective} onChange={(e) => setFilters((prev) => ({ ...prev, futureEffective: e.target.checked }))} />Future Effective</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={filters.invalidDates} onChange={(e) => setFilters((prev) => ({ ...prev, invalidDates: e.target.checked }))} />Invalid Dates</label>
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => setFilters((prev) => ({ ...prev, linkedPlanId: "all", planType: "all", carrier: "all", rateModel: "all", readinessStatus: "all", scopeType: "all", quoteUsage: "all", missingTiers: false, missingAssignments: false, missingContributionLinkage: false, expiringSoon: false, futureEffective: false, invalidDates: false }))}>Clear All</Button>
      </div>
    </div>
  );
}