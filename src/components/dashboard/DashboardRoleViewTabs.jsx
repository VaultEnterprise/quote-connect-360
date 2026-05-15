import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const VIEWS = [
  { value: "admin", label: "Admin" },
  { value: "operations", label: "Operations" },
  { value: "broker", label: "Broker" },
  { value: "employer", label: "Employer" },
];

export default function DashboardRoleViewTabs({ value, onChange }) {
  return (
    <Tabs value={value} onValueChange={onChange}>
      <TabsList className="h-auto flex w-full flex-wrap justify-start gap-2 rounded-2xl border border-border/70 bg-card/95 p-2 shadow-sm">
        {VIEWS.map((view) => (
          <TabsTrigger
            key={view.value}
            value={view.value}
            className="rounded-xl px-4 py-2 text-sm data-[state=active]:shadow-sm"
          >
            {view.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}