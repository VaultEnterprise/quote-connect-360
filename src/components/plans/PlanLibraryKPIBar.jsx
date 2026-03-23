import React from "react";
import { ShieldCheck, Stethoscope, Eye, Heart, FileText, Star, Archive } from "lucide-react";

export default function PlanLibraryKPIBar({ plans = [], archivedPlans = [] }) {
  const medical = plans.filter(p => p.plan_type === "medical");
  const mecMvp = medical.filter(p => ["mec","mvp","mec_bronze","mec_elite"].includes(p.plan_subtype));
  const ancillary = plans.filter(p => p.plan_type !== "medical");
  const featured = plans.filter(p => p.is_featured);

  const kpis = [
    { label: "Total Plans", value: plans.length, icon: FileText, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
    { label: "Medical Plans", value: medical.length, icon: Stethoscope, color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-200" },
    { label: "MEC / MVP", value: mecMvp.length, icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
    { label: "Ancillary Plans", value: ancillary.length, icon: Heart, color: "text-pink-600", bg: "bg-pink-50 border-pink-200" },
    { label: "Featured", value: featured.length, icon: Star, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
    { label: "Archived", value: archivedPlans.length, icon: Archive, color: "text-slate-500", bg: "bg-slate-50 border-slate-200" },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
      {kpis.map(k => (
        <div key={k.label} className={`rounded-xl border p-3 ${k.bg}`}>
          <div className="flex items-center gap-2 mb-1">
            <k.icon className={`w-3.5 h-3.5 ${k.color}`} />
            <p className="text-[10px] text-muted-foreground font-medium leading-none">{k.label}</p>
          </div>
          <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
        </div>
      ))}
    </div>
  );
}