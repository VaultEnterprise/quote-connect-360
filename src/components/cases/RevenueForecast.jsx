import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign } from "lucide-react";

export default function RevenueForecast({ cases }) {
  const forecast = useMemo(() => {
    const stageMap = {
      "proposal_ready": 1.0,
      "employer_review": 0.8,
      "approved_for_enrollment": 0.95,
      "enrollment_open": 0.90,
      "enrollment_complete": 0.95,
      "install_in_progress": 0.98,
      "active": 1.0,
    };

    let total = 0;
    let weighted = 0;

    cases.forEach(c => {
      const premium = c.total_monthly_premium || 0;
      total += premium;
      const weight = stageMap[c.stage] || 0;
      weighted += premium * weight;
    });

    const pipeline = cases
      .filter(c => ["proposal_ready", "employer_review", "approved_for_enrollment"].includes(c.stage))
      .reduce((sum, c) => sum + (c.total_monthly_premium || 0), 0);

    return { total: Math.round(total), weighted: Math.round(weighted), pipeline: Math.round(pipeline), confidence: total > 0 ? Math.round((weighted / total) * 100) : 0 };
  }, [cases]);

  return (
    <Card>
      <CardHeader className="p-4 pb-3">
        <CardTitle className="text-sm flex items-center gap-2"><DollarSign className="w-4 h-4" /> Revenue Forecast</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-muted-foreground">Total Portfolio</span>
            <Badge variant="secondary" className="text-[10px] py-0 h-4">${(forecast.total / 1000).toFixed(1)}k/mo</Badge>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: "100%" }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-muted-foreground">Weighted (Pipeline)</span>
            <Badge variant="secondary" className="text-[10px] py-0 h-4">${(forecast.weighted / 1000).toFixed(1)}k/mo ({forecast.confidence}%)</Badge>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${forecast.confidence}%` }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}