import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const stageConfig = {
  // Case stages
  draft: { label: "Draft", variant: "outline" },
  census_in_progress: { label: "Census In Progress", color: "bg-blue-100 text-blue-700 border-blue-200" },
  census_validated: { label: "Census Validated", color: "bg-blue-100 text-blue-700 border-blue-200" },
  ready_for_quote: { label: "Ready for Quote", color: "bg-amber-100 text-amber-700 border-amber-200" },
  quoting: { label: "Quoting", color: "bg-amber-100 text-amber-700 border-amber-200" },
  proposal_ready: { label: "Proposal Ready", color: "bg-purple-100 text-purple-700 border-purple-200" },
  employer_review: { label: "Employer Review", color: "bg-purple-100 text-purple-700 border-purple-200" },
  approved_for_enrollment: { label: "Approved", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  enrollment_open: { label: "Enrollment Open", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  enrollment_complete: { label: "Enrollment Complete", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  install_in_progress: { label: "Installing", color: "bg-teal-100 text-teal-700 border-teal-200" },
  active: { label: "Active", color: "bg-green-100 text-green-700 border-green-200" },
  renewal_pending: { label: "Renewal Pending", color: "bg-orange-100 text-orange-700 border-orange-200" },
  renewed: { label: "Renewed", color: "bg-green-100 text-green-700 border-green-200" },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-500 border-gray-200" },

  // Task statuses
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700 border-amber-200" },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700 border-blue-200" },
  completed: { label: "Completed", color: "bg-green-100 text-green-700 border-green-200" },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-500 border-gray-200" },
  blocked: { label: "Blocked", color: "bg-red-100 text-red-700 border-red-200" },

  // Enrollment statuses
  scheduled: { label: "Scheduled", variant: "outline" },
  open: { label: "Open", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  closing_soon: { label: "Closing Soon", color: "bg-orange-100 text-orange-700 border-orange-200" },
  finalized: { label: "Finalized", color: "bg-green-100 text-green-700 border-green-200" },

  // Renewal statuses
  pre_renewal: { label: "Pre-Renewal", variant: "outline" },
  marketed: { label: "Marketed", color: "bg-blue-100 text-blue-700 border-blue-200" },
  options_prepared: { label: "Options Prepared", color: "bg-purple-100 text-purple-700 border-purple-200" },
  decision_made: { label: "Decision Made", color: "bg-green-100 text-green-700 border-green-200" },
  install_renewal: { label: "Installing", color: "bg-teal-100 text-teal-700 border-teal-200" },
  active_renewal: { label: "Active", color: "bg-green-100 text-green-700 border-green-200" },

  // Priority
  low: { label: "Low", variant: "outline" },
  normal: { label: "Normal", variant: "secondary" },
  high: { label: "High", color: "bg-orange-100 text-orange-700 border-orange-200" },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-700 border-red-200" },

  // Census
  uploaded: { label: "Uploaded", color: "bg-blue-100 text-blue-700 border-blue-200" },
  mapping: { label: "Mapping", color: "bg-amber-100 text-amber-700 border-amber-200" },
  validating: { label: "Validating", color: "bg-amber-100 text-amber-700 border-amber-200" },
  validated: { label: "Validated", color: "bg-green-100 text-green-700 border-green-200" },
  has_issues: { label: "Has Issues", color: "bg-red-100 text-red-700 border-red-200" },

  // Quote
  running: { label: "Running", color: "bg-blue-100 text-blue-700 border-blue-200" },
  error: { label: "Error", color: "bg-red-100 text-red-700 border-red-200" },
  expired: { label: "Expired", color: "bg-gray-100 text-gray-500 border-gray-200" },

  // Generic
  not_started: { label: "Not Started", variant: "outline" },
  issues_found: { label: "Issues Found", color: "bg-red-100 text-red-700 border-red-200" },
};

export default function StatusBadge({ status, className }) {
  const config = stageConfig[status] || { label: status?.replace(/_/g, " ") || "Unknown", variant: "outline" };

  return (
    <Badge
      variant={config.variant || "secondary"}
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize shadow-sm",
        config.color,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}