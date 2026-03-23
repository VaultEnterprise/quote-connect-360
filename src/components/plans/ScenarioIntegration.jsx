import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { FileText } from "lucide-react";

export default function ScenarioIntegration({ plan }) {
  const { data: scenarioPlanLinks = [] } = useQuery({
    queryKey: ["scenario-plans"],
    queryFn: () => base44.entities.ScenarioPlan.list("-created_date", 500),
  });

  const { data: scenarios = [] } = useQuery({
    queryKey: ["scenarios-all"],
    queryFn: () => base44.entities.QuoteScenario.list("-created_date", 500),
  });

  const linkedScenarios = useMemo(() => {
    const spLinks = scenarioPlanLinks.filter((sp) => sp.plan_id === plan?.id);
    return scenarios.filter((s) => spLinks.some((sp) => sp.scenario_id === s.id));
  }, [scenarioPlanLinks, scenarios, plan?.id]);

  if (linkedScenarios.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="w-4 h-4" /> Used in Scenarios
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">
          {linkedScenarios.length} scenario{linkedScenarios.length !== 1 ? "s" : ""}
        </p>
        {linkedScenarios.slice(0, 5).map((s) => (
          <Link
            key={s.id}
            to={`/quotes?scenario=${s.id}`}
            className="block text-xs p-2 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="truncate font-medium">{s.name}</span>
              <Badge variant="outline" className="text-[10px] flex-shrink-0">
                {s.status}
              </Badge>
            </div>
          </Link>
        ))}
        {linkedScenarios.length > 5 && (
          <p className="text-xs text-muted-foreground">+{linkedScenarios.length - 5} more</p>
        )}
      </CardContent>
    </Card>
  );
}