import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, Search, Plus } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import PlanFormModal from "@/components/plans/PlanFormModal";
import RateTableManagerCard from "@/components/rates/RateTableManagerCard";

export default function Rates() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showPlanModal, setShowPlanModal] = useState(false);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["rates-plans"],
    queryFn: () => base44.entities.BenefitPlan.list("-created_date", 500),
  });

  const { data: rateTables = [] } = useQuery({
    queryKey: ["rates-tables"],
    queryFn: () => base44.entities.PlanRateTable.list("-created_date", 1000),
  });

  const filteredPlans = useMemo(() => {
    return plans
      .filter((plan) => plan.status !== "archived")
      .filter((plan) => typeFilter === "all" || plan.plan_type === typeFilter)
      .filter((plan) => {
        const q = search.toLowerCase();
        return !q ||
          plan.plan_name?.toLowerCase().includes(q) ||
          plan.carrier?.toLowerCase().includes(q) ||
          plan.plan_code?.toLowerCase().includes(q);
      });
  }, [plans, search, typeFilter]);

  const ratesByPlan = useMemo(() => {
    return rateTables.reduce((acc, table) => {
      acc[table.plan_id] = acc[table.plan_id] || [];
      acc[table.plan_id].push(table);
      return acc;
    }, {});
  }, [rateTables]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rates"
        description="Manage plan rate tables in one dedicated place."
        actions={
          <Button onClick={() => setShowPlanModal(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Plan
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plans, carriers, or codes..."
            className="pl-10 h-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-44 h-9"><SelectValue /></SelectTrigger>
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
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="h-56 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filteredPlans.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="No rate plans found"
          description="Add a plan first, then manage its rate tables here."
          actionLabel="Add Plan"
          onAction={() => setShowPlanModal(true)}
        />
      ) : (
        <div className="space-y-4">
          {filteredPlans.map((plan) => (
            <RateTableManagerCard key={plan.id} plan={plan} rateTables={ratesByPlan[plan.id] || []} />
          ))}
        </div>
      )}

      {showPlanModal ? (
        <PlanFormModal
          open={showPlanModal}
          onClose={() => setShowPlanModal(false)}
        />
      ) : null}
    </div>
  );
}