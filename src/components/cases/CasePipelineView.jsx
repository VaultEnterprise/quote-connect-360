import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, AlertTriangle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { CASE_STAGE_GROUPS } from "@/contracts/workflowRegistry";
import { buildRoute } from "@/lib/routing/buildRoute";

function CaseMiniCard({ c }) {
  const daysSince = c.last_activity_date ? differenceInDays(new Date(), new Date(c.last_activity_date)) : null;
  const isStale = daysSince !== null && daysSince > 7;

  return (
    <Link to={buildRoute("caseDetail", { caseId: c.id })}>
      <div className={`p-3 rounded-lg border bg-background hover:shadow-md hover:border-primary/30 transition-all cursor-pointer mb-2 ${c.priority === "urgent" ? "border-l-2 border-l-red-500" : c.priority === "high" ? "border-l-2 border-l-amber-500" : ""}`}>
        <p className="text-xs font-semibold truncate">{c.employer_name || "Unnamed"}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{c.case_number || c.id?.slice(-6)}</p>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5">
            {c.employee_count && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Users className="w-2.5 h-2.5" />{c.employee_count}</span>}
            {c.effective_date && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" />{format(new Date(c.effective_date), "M/d/yy")}</span>}
          </div>
          {isStale && <span className="text-[9px] text-amber-600 font-medium flex items-center gap-0.5"><AlertTriangle className="w-2.5 h-2.5" />{daysSince}d idle</span>}
        </div>
        {c.products_requested?.length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {c.products_requested.slice(0, 3).map((product) => (
              <span key={product} className="text-[9px] bg-primary/10 text-primary rounded px-1 py-0.5 capitalize">{product}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

export default function CasePipelineView({ cases }) {
  const buckets = CASE_STAGE_GROUPS.reduce((accumulator, group) => ({ ...accumulator, [group.key]: [] }), {});
  cases.forEach((caseItem) => {
    const bucket = CASE_STAGE_GROUPS.find((group) => group.match(caseItem.stage));
    if (bucket) buckets[bucket.key].push(caseItem);
  });

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {CASE_STAGE_GROUPS.map((group) => (
        <div key={group.key} className="flex-shrink-0 w-52">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-semibold text-muted-foreground">{group.label}</span>
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{buckets[group.key].length}</Badge>
          </div>
          <div className="bg-muted/40 rounded-xl p-2 min-h-32">
            {buckets[group.key].length === 0 ? (
              <p className="text-[10px] text-muted-foreground/50 text-center pt-4">No cases</p>
            ) : (
              buckets[group.key].map((caseItem) => <CaseMiniCard key={caseItem.id} c={caseItem} />)
            )}
          </div>
        </div>
      ))}
    </div>
  );
}