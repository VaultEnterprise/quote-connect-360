import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Database, MapPin, Table2, ShieldCheck, Zap } from "lucide-react";
import RateScheduleManager from "@/components/plans/RateScheduleManager";
import RateDetailGrid from "@/components/plans/RateDetailGrid";
import ZipAreaMappingManager from "@/components/plans/ZipAreaMappingManager";
import RateValidationConsole from "@/components/plans/RateValidationConsole";
import CaseRatingRunner from "@/components/plans/CaseRatingRunner";
import ImportRunLog from "@/components/plans/ImportRunLog";

export default function PlanRatingEngine() {
  const { data: plans = [] } = useQuery({
    queryKey: ["benefit-plans"],
    queryFn: () => base44.entities.BenefitPlan.filter({ status: "active" }),
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ["plan-rate-schedules"],
    queryFn: () => base44.entities.PlanRateSchedule.list("-created_date", 100),
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <Link to="/plans" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 mb-1">
          <ArrowLeft className="w-4 h-4" /> Plan Library
        </Link>
        <h1 className="text-2xl font-bold">Rating Engine</h1>
        <p className="text-muted-foreground text-sm">
          Normalized rate schedules · ZIP-to-area mapping · age-band/tier resolution · census rating
        </p>
      </div>

      {/* Architecture summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
        {[
          { icon: Database, label: "Plan Master", sub: `${plans.length} plans` },
          { icon: Table2, label: "Rate Schedules", sub: `${schedules.length} schedules` },
          { icon: Table2, label: "Rate Detail", sub: "Normalized rows" },
          { icon: MapPin, label: "ZIP → Area", sub: "Lookup table" },
          { icon: Zap, label: "Rating Engine", sub: "Backend service" },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2 p-2.5 rounded-lg border bg-card">
            <item.icon className="w-4 h-4 text-primary flex-shrink-0" />
            <div>
              <p className="font-semibold">{item.label}</p>
              <p className="text-muted-foreground">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="schedules">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="schedules" className="gap-1.5"><Database className="w-3.5 h-3.5" />Rate Schedules</TabsTrigger>
          <TabsTrigger value="rates" className="gap-1.5"><Table2 className="w-3.5 h-3.5" />Rate Detail Grid</TabsTrigger>
          <TabsTrigger value="zip" className="gap-1.5"><MapPin className="w-3.5 h-3.5" />ZIP / Area Mapping</TabsTrigger>
          <TabsTrigger value="validate" className="gap-1.5"><ShieldCheck className="w-3.5 h-3.5" />Validation Console</TabsTrigger>
          <TabsTrigger value="rate" className="gap-1.5"><Zap className="w-3.5 h-3.5" />Run Rating</TabsTrigger>
          <TabsTrigger value="log" className="gap-1.5"><Database className="w-3.5 h-3.5" />Import Log</TabsTrigger>
        </TabsList>

        <TabsContent value="schedules" className="mt-4">
          <RateScheduleManager plans={plans} schedules={schedules} />
        </TabsContent>
        <TabsContent value="rates" className="mt-4">
          <RateDetailGrid plans={plans} schedules={schedules} />
        </TabsContent>
        <TabsContent value="zip" className="mt-4">
          <ZipAreaMappingManager plans={plans} />
        </TabsContent>
        <TabsContent value="validate" className="mt-4">
          <RateValidationConsole schedules={schedules} />
        </TabsContent>
        <TabsContent value="rate" className="mt-4">
          <CaseRatingRunner plans={plans} schedules={schedules} />
        </TabsContent>
        <TabsContent value="log" className="mt-4">
          <ImportRunLog />
        </TabsContent>
      </Tabs>
    </div>
  );
}