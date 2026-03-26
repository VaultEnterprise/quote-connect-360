import React from "react";
import KPITrendsPanel from "@/components/cases/KPITrendsPanel";
import CycleTimeAnalytics from "@/components/cases/CycleTimeAnalytics";
import TeamWorkloadHeatmap from "@/components/cases/TeamWorkloadHeatmap";
import RiskAlerts from "@/components/cases/RiskAlerts";
import AgingReport from "@/components/cases/AgingReport";
import RevenueForecast from "@/components/cases/RevenueForecast";
import RenewalPipelineView from "@/components/cases/RenewalPipelineView";
import ActivityFeed from "@/components/cases/ActivityFeed";

export default function CasesAnalyticsPanels({ cases }) {
  return (
    <div className="space-y-3">
      <KPITrendsPanel cases={cases} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <CycleTimeAnalytics cases={cases} />
        <RiskAlerts cases={cases} />
        <TeamWorkloadHeatmap cases={cases} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <RevenueForecast cases={cases} />
        <RenewalPipelineView cases={cases} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <AgingReport cases={cases} />
        <ActivityFeed cases={cases} />
      </div>
    </div>
  );
}