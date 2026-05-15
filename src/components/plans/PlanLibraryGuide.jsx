import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, BookOpen, Lightbulb } from "lucide-react";

export default function PlanLibraryGuide() {
  const tips = [
    { title: "Complete Your Medical Plans", desc: "Medical plans should include deductibles, OOP max, and copays for accurate quote runs.", category: "Medical" },
    { title: "Add Rate Tables", desc: "Every plan needs at least one rate table showing employee/employer rates by coverage tier.", category: "Required" },
    { title: "Use Plan Codes", desc: "Unique carrier plan codes help with carrier connectivity and identification.", category: "Reference" },
    { title: "Mark HSA Eligibility", desc: "HDHP plans eligible for HSA help employers with tax-advantaged strategies.", category: "Medical" },
    { title: "Organize by Carrier", desc: "Group plans by carrier makes filtering and proposal building faster.", category: "Organization" },
  ];

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-blue-600" /> Plan Library Tips
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tips.map((tip, i) => (
          <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-white/60">
            <Badge className="text-[8px] bg-blue-100 text-blue-700 border-blue-200 border py-0 flex-shrink-0 mt-0.5">
              {tip.category}
            </Badge>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-blue-900">{tip.title}</p>
              <p className="text-[10px] text-blue-700 mt-0.5">{tip.desc}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}