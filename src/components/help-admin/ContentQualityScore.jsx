import React from "react";
import { Badge } from "@/components/ui/badge";

/**
 * Computes a completeness score (0-100) for a help content form or record.
 * Shows as a colored badge/bar.
 */
function computeScore(form) {
  const checks = [
    { key: "help_title", weight: 10 },
    { key: "short_help_text", weight: 15 },
    { key: "detailed_help_text", weight: 25 },
    { key: "expected_user_action_text", weight: 15 },
    { key: "feature_capabilities_text", weight: 10 },
    { key: "warnings_text", weight: 5 },
    { key: "examples_text", weight: 10 },
    { key: "search_keywords", weight: 10 },
  ];
  let score = 0;
  for (const c of checks) {
    const val = form[c.key];
    if (val && val.trim().length > 0) score += c.weight;
  }
  // Bonus: detailed_help_text length
  if ((form.detailed_help_text || "").length > 200) score = Math.min(100, score + 5);
  return Math.min(100, score);
}

export default function ContentQualityScore({ form }) {
  const score = computeScore(form);
  const config = score >= 80 ? { label: "High Quality", color: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-500" }
    : score >= 55 ? { label: "Good", color: "bg-blue-100 text-blue-700", bar: "bg-blue-500" }
    : score >= 30 ? { label: "Partial", color: "bg-amber-100 text-amber-700", bar: "bg-amber-500" }
    : { label: "Sparse", color: "bg-red-100 text-red-700", bar: "bg-red-400" };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${config.bar}`} style={{ width: `${score}%` }} />
      </div>
      <Badge className={`text-[9px] flex-shrink-0 ${config.color}`}>{score}% — {config.label}</Badge>
    </div>
  );
}