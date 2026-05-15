import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle2, Clock } from "lucide-react";
import MetricCard from "@/components/shared/MetricCard";

export default function ProposalsKPI({ proposals = [] }) {
  const pending = proposals.filter(p => p.status === "sent" || p.status === "viewed").length;
  const approved = proposals.filter(p => p.status === "approved").length;
  const completion = proposals.length > 0 ? Math.round((approved / proposals.length) * 100) : 0;

  return (
    <div className="grid grid-cols-3 gap-4">
      <MetricCard label="Pending Proposals" value={pending} icon={Clock} />
      <MetricCard label="Approved" value={approved} icon={CheckCircle2} />
      <MetricCard label="Completion Rate" value={`${completion}%`} icon={FileText} />
    </div>
  );
}