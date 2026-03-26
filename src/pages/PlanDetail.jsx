import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, Pencil, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PageHeader from "@/components/shared/PageHeader";
import PlanFormModal from "@/components/plans/PlanFormModal";
import PlanWorkspaceSummary from "@/components/plans/PlanWorkspaceSummary";
import RateScheduleManager from "@/components/plans/RateScheduleManager";
import RateDetailGrid from "@/components/plans/RateDetailGrid";

export default function PlanDetail() {
  const { id } = useParams();
  const [showEdit, setShowEdit] = useState(false);

  const { data: allPlans = [], isLoading: loadingPlan } = useQuery({
    queryKey: ["benefit-plans"],
    queryFn: () => base44.entities.BenefitPlan.list("-created_date", 500),
  });

  const { data: schedules = [], isLoading: loadingSchedules } = useQuery({
    queryKey: ["plan-rate-schedules", id],
    queryFn: () => base44.entities.PlanRateSchedule.filter({ plan_id: id }),
    enabled: !!id,
  });

  const plan = allPlans.find((item) => item.id === id);
  const sortedSchedules = useMemo(() => {
    return [...schedules].sort((a, b) => {
      if (!!a.is_active !== !!b.is_active) return a.is_active ? -1 : 1;
      return (b.version_number || 0) - (a.version_number || 0);
    });
  }, [schedules]);

  const initialScheduleId = sortedSchedules.find((schedule) => schedule.is_active)?.id || sortedSchedules[0]?.id || "";

  if (loadingPlan || loadingSchedules) {
    return <div className="p-6"><div className="h-48 rounded-xl bg-muted animate-pulse" /></div>;
  }

  if (!plan) {
    return (
      <div className="p-6">
        <Card className="border-dashed">
          <CardContent className="p-10 text-center text-muted-foreground">
            This plan could not be found.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="Plan Workspace"
        description="Full-screen plan review with schedules and imported rates"
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" asChild>
              <Link to="/plans" className="gap-1.5"><ArrowLeft className="w-4 h-4" />Plan Library</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/plan-rate-editor?plan_id=${plan.id}`} className="gap-1.5"><Settings className="w-4 h-4" />Open in Rate Editor</Link>
            </Button>
            {plan.schedule_of_benefits_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={plan.schedule_of_benefits_url} target="_blank" rel="noreferrer" className="gap-1.5">
                  <ExternalLink className="w-4 h-4" />Schedule of Benefits
                </a>
              </Button>
            )}
            <Button size="sm" onClick={() => setShowEdit(true)} className="gap-1.5">
              <Pencil className="w-4 h-4" />Edit Plan
            </Button>
          </div>
        }
      />

      <PlanWorkspaceSummary plan={plan} schedules={sortedSchedules} />

      <div className="space-y-6">
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Rate schedules</h2>
            <p className="text-sm text-muted-foreground">Create, edit, or archive the schedules attached to this plan.</p>
          </div>
          <RateScheduleManager plans={[plan]} schedules={sortedSchedules} defaultPlanId={plan.id} />
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Rate details</h2>
            <p className="text-sm text-muted-foreground">Review imported rates, upload special workbooks, and manage schedule rows.</p>
          </div>
          <RateDetailGrid plans={[plan]} schedules={sortedSchedules} initialScheduleId={initialScheduleId} />
        </section>
      </div>

      {showEdit && (
        <PlanFormModal plan={plan} open={showEdit} onClose={() => setShowEdit(false)} defaultType={plan.plan_type || "medical"} />
      )}
    </div>
  );
}