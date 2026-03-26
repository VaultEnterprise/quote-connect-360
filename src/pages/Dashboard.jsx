import React from "react";
import { Link } from "react-router-dom";
import { Briefcase } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";
import DashboardControls from "@/components/dashboard/DashboardControls";
import DashboardMetricGrid from "@/components/dashboard/DashboardMetricGrid";
import DashboardSecondaryMetrics from "@/components/dashboard/DashboardSecondaryMetrics";
import DashboardActivityPanels from "@/components/dashboard/DashboardActivityPanels";
import TodaysPriorities from "@/components/dashboard/TodaysPriorities";
import InteractivePipeline from "@/components/dashboard/InteractivePipeline";
import EnrollmentCountdowns from "@/components/dashboard/EnrollmentCountdowns";
import StalledCases from "@/components/dashboard/StalledCases";
import QuickActions from "@/components/dashboard/QuickActions";
import CensusGapAlert from "@/components/dashboard/CensusGapAlert";
import ProposalsKPI from "@/components/dashboard/ProposalsKPI";
import TeamWorkload from "@/components/dashboard/TeamWorkload";
import RevenueMetrics from "@/components/dashboard/RevenueMetrics";
import ComplianceAlerts from "@/components/dashboard/ComplianceAlerts";
import CarrierDistribution from "@/components/dashboard/CarrierDistribution";
import EnrollmentForecast from "@/components/dashboard/EnrollmentForecast";
import CycleTiming from "@/components/dashboard/CycleTiming";
import CaseTypesCard from "@/components/dashboard/CaseTypesCard";
import UpcomingRenewalsCard from "@/components/dashboard/UpcomingRenewalsCard";
import { Button } from "@/components/ui/button";
import { useDashboardPageController } from "@/domain/dashboard/useDashboardPageController";

export default function Dashboard() {
  const controller = useDashboardPageController();

  if (controller.isLoading || controller.isUserLoading) return <DashboardSkeleton />;

  if (controller.scopedData.currentCases.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Overview of your benefits operations"
          actions={
            <Link to="/cases/new">
              <Button className="shadow-sm">
                <Briefcase className="w-4 h-4 mr-2" />
                New Case
              </Button>
            </Link>
          }
        />
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-6">
            <Briefcase className="w-9 h-9 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">Welcome to Connect Quote 360</h2>
          <p className="text-sm text-muted-foreground max-w-md mb-8">Your benefits operating platform is ready. Start by creating your first benefit case.</p>
          <div className="flex gap-3">
            <Link to="/cases/new"><Button className="shadow-sm"><Briefcase className="w-4 h-4 mr-2" /> Create First Case</Button></Link>
            <Link to="/employers"><Button variant="outline">Add Employer Groups</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Benefits operations overview" />
      <DashboardControls
        filters={controller.filters}
        options={controller.options}
        presets={controller.presets}
        selectedPresetId={controller.selectedPresetId}
        onChange={controller.handleFilterChange}
        onPresetChange={controller.handlePresetChange}
        onSaveView={controller.handleSaveView}
        onSetDefault={controller.handleSetDefault}
        onRefresh={controller.handleRefresh}
        isRefreshing={controller.isRefreshing}
        lastUpdated={controller.lastUpdated}
      />
      <QuickActions />
      <CensusGapAlert cases={controller.scopedData.currentCases} />
      <TodaysPriorities tasks={controller.scopedData.currentTasks} exceptions={controller.scopedData.currentExceptions} cases={controller.scopedData.currentCases} enrollments={controller.scopedData.currentEnrollments} />
      <DashboardMetricGrid summary={controller.summary} />
      <DashboardSecondaryMetrics summary={controller.summary} currentEnrollments={controller.scopedData.currentEnrollments} currentRenewals={controller.scopedData.currentRenewals} upcomingRenewalsCount={controller.charts.upcomingRenewals} />
      <ProposalsKPI proposals={controller.scopedData.currentProposals} />
      <ComplianceAlerts cases={controller.scopedData.currentCases} scenarios={controller.scopedData.currentScenarios} />
      <RevenueMetrics scenarios={controller.scopedData.currentScenarios} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <InteractivePipeline cases={controller.scopedData.currentCases} />
        <CaseTypesCard data={controller.charts.typeData} />
        <CarrierDistribution scenarios={controller.scopedData.currentScenarios} />
      </div>

      <DashboardActivityPanels monthlyData={controller.charts.monthlyData} currentCases={controller.scopedData.currentCases} currentTasks={controller.scopedData.currentTasks} openExceptions={controller.summary.openExceptions} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><TeamWorkload cases={controller.scopedData.currentCases} tasks={controller.scopedData.currentTasks} /><EnrollmentForecast enrollments={controller.scopedData.currentEnrollments} /><CycleTiming cases={controller.scopedData.currentCases} /></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><EnrollmentCountdowns enrollments={controller.scopedData.currentEnrollments} /><StalledCases cases={controller.scopedData.currentCases} /></div>
      <UpcomingRenewalsCard renewals={controller.scopedData.currentRenewals} />
    </div>
  );
}