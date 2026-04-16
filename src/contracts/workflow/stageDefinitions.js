export const STAGE_ORDER = [
  "draft",
  "census_in_progress",
  "census_validated",
  "ready_for_quote",
  "quoting",
  "proposal_ready",
  "employer_review",
  "approved_for_enrollment",
  "enrollment_open",
  "enrollment_complete",
  "install_in_progress",
  "active",
  "renewal_pending",
  "renewed",
  "closed",
];

export const STAGE_LABELS = {
  draft: "Draft",
  census_in_progress: "Census In Progress",
  census_validated: "Census Validated",
  ready_for_quote: "Ready for Quote",
  quoting: "Quoting",
  proposal_ready: "Proposal Ready",
  employer_review: "Employer Review",
  approved_for_enrollment: "Approved for Enrollment",
  enrollment_open: "Enrollment Open",
  enrollment_complete: "Enrollment Complete",
  install_in_progress: "Install In Progress",
  active: "Active",
  renewal_pending: "Renewal Pending",
  renewed: "Renewed",
  closed: "Closed",
};

export const STAGE_OPTIONS = [
  { value: "all", label: "All Stages" },
  ...STAGE_ORDER.map((value) => ({ value, label: STAGE_LABELS[value] })),
];