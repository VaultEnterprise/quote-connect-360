import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, ArrowRight, ChevronUp, ExternalLink } from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import { CASE_STAGE_GROUPS } from "@/contracts/workflowRegistry";
import { buildRoute } from "@/lib/routing/buildRoute";

export default function InteractivePipeline({ cases = [] }) {
  const [activeStage, setActiveStage] = useState(null);

  const stageData = CASE_STAGE_GROUPS.map(g => ({
    ...g,
    cases: cases.filter(c => g.match(c.stage)),
    count: cases.filter(c => g.match(c.stage)).length,
  })).filter(g => g.count > 0);

  const maxCount = Math.max(...stageData.map(s => s.count), 1);

  const selectedGroup = stageData.find(g => g.key === activeStage);

  const handleStageClick = (key) => {
    setActiveStage(prev => prev === key ? null : key);
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" /> Case Pipeline
          <span className="text-xs font-normal text-muted-foreground ml-1">click a stage to explore</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Custom interactive bar chart */}
        <div className="flex items-end gap-2 h-36">
          {stageData.map(g => {
            const isActive = activeStage === g.key;
            const barHeight = Math.max((g.count / maxCount) * 100, 8);
            return (
              <button
                key={g.key}
                onClick={() => handleStageClick(g.key)}
                className="flex-1 flex flex-col items-center gap-1 group focus:outline-none"
              >
                {/* Count label */}
                <span className={`text-xs font-bold transition-colors ${isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
                  {g.count}
                </span>
                {/* Bar */}
                <div className="w-full flex items-end justify-center" style={{ height: "90px" }}>
                  <div
                    className="w-full rounded-t-md transition-all duration-200"
                    style={{
                      height: `${barHeight}%`,
                      background: isActive ? g.color : `${g.color}99`,
                      outline: isActive ? `2px solid ${g.color}` : "none",
                      outlineOffset: "2px",
                      transform: isActive ? "scaleY(1.03)" : "scaleY(1)",
                      transformOrigin: "bottom",
                      boxShadow: isActive ? `0 4px 12px ${g.color}44` : "none",
                    }}
                  />
                </div>
                {/* Label */}
                <span className={`text-[10px] font-medium transition-colors leading-tight text-center ${isActive ? g.textClass : "text-muted-foreground group-hover:text-foreground"}`}>
                  {g.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Expanded case list */}
        {selectedGroup && (
          <div className="border border-border rounded-xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border" style={{ background: `${selectedGroup.color}18` }}>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: selectedGroup.color }} />
                <span className="text-sm font-semibold">{selectedGroup.label} Stage</span>
                <Badge className={`text-[10px] py-0 border ${selectedGroup.bgClass} ${selectedGroup.textClass}`} style={{ borderColor: `${selectedGroup.color}40` }}>
                  {selectedGroup.count} cases
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Link to={buildRoute("cases", { stageGroup: selectedGroup.key })}>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                    View all <ExternalLink className="w-3 h-3" />
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setActiveStage(null)}>
                  <ChevronUp className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="divide-y divide-border max-h-56 overflow-y-auto">
              {selectedGroup.cases.slice(0, 10).map(c => (
                <Link key={c.id} to={buildRoute("caseDetail", { caseId: c.id })} className="block">
                  <div className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/40 transition-colors group">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {c.employer_name || "Unnamed Employer"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {c.case_number || `#${c.id?.slice(-6)}`}
                        {c.effective_date && ` · Effective ${c.effective_date}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {c.priority && c.priority !== "normal" && (
                        <Badge className={`text-[9px] py-0 ${c.priority === "urgent" ? "bg-red-100 text-red-700" : c.priority === "high" ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"}`}>
                          {c.priority}
                        </Badge>
                      )}
                      <StatusBadge status={c.stage} />
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </Link>
              ))}
              {selectedGroup.count > 10 && (
                <Link to={buildRoute("cases", { stageGroup: selectedGroup.key })} className="block">
                  <div className="px-4 py-2.5 text-center text-xs text-muted-foreground hover:text-primary hover:bg-muted/30 transition-colors">
                    +{selectedGroup.count - 10} more cases → View all
                  </div>
                </Link>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}