import React from "react";
import { Link } from "react-router-dom";
import { FileWarning, ArrowRight } from "lucide-react";

export default function CensusGapAlert({ cases }) {
  const notStarted = cases.filter(c =>
    !["closed", "renewed"].includes(c.stage) && c.census_status === "not_started"
  );
  const hasIssues = cases.filter(c =>
    !["closed", "renewed"].includes(c.stage) && c.census_status === "issues_found"
  );

  if (notStarted.length === 0 && hasIssues.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {notStarted.length > 0 && (
        <Link to="/census">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800 hover:bg-blue-100 transition-colors cursor-pointer">
            <FileWarning className="w-3.5 h-3.5 flex-shrink-0" />
            <span><strong>{notStarted.length}</strong> active case{notStarted.length !== 1 ? "s" : ""} with no census uploaded</span>
            <ArrowRight className="w-3 h-3 ml-1" />
          </div>
        </Link>
      )}
      {hasIssues.length > 0 && (
        <Link to="/census">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-50 border border-orange-200 text-xs text-orange-800 hover:bg-orange-100 transition-colors cursor-pointer">
            <FileWarning className="w-3.5 h-3.5 flex-shrink-0" />
            <span><strong>{hasIssues.length}</strong> census{hasIssues.length !== 1 ? "es" : ""} with unresolved issues</span>
            <ArrowRight className="w-3 h-3 ml-1" />
          </div>
        </Link>
      )}
    </div>
  );
}