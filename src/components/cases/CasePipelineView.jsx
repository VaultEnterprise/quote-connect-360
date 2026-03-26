import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, AlertTriangle } from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import { format, differenceInDays } from "date-fns";

const PIPELINE_STAGES = [
  { key: "draft",               label: "Draft"       },
  { key: "census_in_progress",  label: "Census"      },
  { key: "quoting",             label: "Quoting"     },
  { key: "proposal_ready",      label: "Proposal"    },
  { key: "employer_review",     label: "Review"      },
  { key: "enrollment_open",     label: "Enrollment"  },
  { key: "active",              label: "Active"      },
];

// Map all stages to one of the above pipeline buckets
const STAGE_BUCKET = {
  draft: "draft",
  census_in_progress: "census_in_progress",
  census_validated: "census_in_progress",
  ready_for_quote: "quoting",
  quoting: "quoting",
  proposal_ready: "proposal_ready",
  employer_review: "employer_review",
  approved_for_enrollment: "enrollment_open",
  enrollment_open: "enrollment_open",
  enrollment_complete: "enrollment_open",
  install_in_progress: "active",
  active: "active",
  renewal_pending: "active",
  renewed: "active",
  closed: null,
};

function CaseMiniCard({ c }) {
  const daysSince = c.last_activity_date
    ? differenceInDays(new Date(), new Date(c.last_activity_date))
    : null;
  const isStale = daysSince !== null && daysSince > 7;

  return (
    <Link to={`/cases/${c.id}`}>
      <div className={`p-3 rounded-lg border bg-background hover:shadow-md hover:border-primary/30 transition-all cursor-pointer mb-2 ${c.priority === "urgent" ? "border-l-2 border-l-red-500" : c.priority === "high" ? "border-l-2 border-l-amber-500" : ""}`}>
        <p className="text-xs font-semibold truncate">{c.employer_name || "Unnamed"}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{c.case_number || c.id?.slice(-6)}</p>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5">
            {c.employee_count && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Users className="w-2.5 h-2.5" />{c.employee_count}
              </span>
            )}
            {c.effective_date && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Calendar className="w-2.5 h-2.5" />{format(new Date(c.effective_date), "M/d/yy")}
              </span>
            )}
          </div>
          {isStale && (
            <span className="text-[9px] text-amber-600 font-medium flex items-center gap-0.5">
              <AlertTriangle className="w-2.5 h-2.5" />{daysSince}d idle
            </span>
          )}
        </div>
        {c.products_requested?.length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {c.products_requested.slice(0, 3).map(p => (
              <span key={p} className="text-[9px] bg-primary/10 text-primary rounded px-1 py-0.5 capitalize">{p}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

export default function CasePipelineView({ cases }) {
  const buckets = PIPELINE_STAGES.reduce((acc, s) => ({ ...acc, [s.key]: [] }), {});
  cases.forEach(c => {
    const bucket = STAGE_BUCKET[c.stage];
    if (bucket && buckets[bucket]) buckets[bucket].push(c);
  });

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {PIPELINE_STAGES.map(stage => (
        <div key={stage.key} className="flex-shrink-0 w-52">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-semibold text-muted-foreground">{stage.label}</span>
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{buckets[stage.key].length}</Badge>
          </div>
          <div className="bg-muted/40 rounded-xl p-2 min-h-32">
            {buckets[stage.key].length === 0 ? (
              <p className="text-[10px] text-muted-foreground/50 text-center pt-4">No cases</p>
            ) : (
              buckets[stage.key].map(c => <CaseMiniCard key={c.id} c={c} />)
            )}
          </div>
        </div>
      ))}
    </div>
  );
}