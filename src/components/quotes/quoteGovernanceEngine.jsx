export const QUOTE_PIPELINE_STATUSES = [
  "draft",
  "in_progress",
  "running",
  "reviewed",
  "approved",
  "completed",
  "converted_to_enrollment",
  "error",
  "expired",
];

export function getLatestCaseCensusVersion(caseId, censusVersions = []) {
  return [...censusVersions]
    .filter((version) => version.case_id === caseId)
    .sort((a, b) => Number(b.version_number || 0) - Number(a.version_number || 0))[0] || null;
}

export function buildQuoteReadiness({ scenario, caseRecord, censusVersions = [], enrollments = [], renewals = [] }) {
  const latestCensus = getLatestCaseCensusVersion(scenario?.case_id, censusVersions);
  const enrollmentWindow = enrollments.find((item) => item.case_id === scenario?.case_id);
  const renewal = renewals.find((item) => item.case_id === scenario?.case_id);
  const hasRatedPlans = Number(scenario?.plan_count || 0) > 0;
  const censusValidated = latestCensus?.status === "validated" && Number(latestCensus?.validation_errors || 0) === 0;
  const pricingReady = censusValidated && hasRatedPlans && scenario?.status === "completed";

  return {
    latestCensus,
    checks: {
      censusValidated,
      hasRatedPlans,
      pricingReady,
      enrollmentCompatible: pricingReady && !!enrollmentWindow,
      renewalCompatible: pricingReady && !!renewal,
      caseReady: ["ready_for_quote", "quoting", "proposal_ready", "employer_review", "approved_for_enrollment"].includes(caseRecord?.stage),
    },
  };
}

export function validateQuoteScenarioForm({ form, caseRecord, latestCensus }) {
  const errors = [];
  if (!form.name?.trim()) errors.push("Scenario name is required.");
  if (!form.products_included?.length) errors.push("Select at least one product.");
  if (!form.effective_date) errors.push("Effective date is required.");
  if (!latestCensus) errors.push("A census snapshot is required before creating a quote scenario.");
  if (latestCensus && latestCensus.status !== "validated") errors.push("The latest census snapshot must be validated before quoting.");
  if (caseRecord && !["census_validated", "ready_for_quote", "quoting", "proposal_ready", "employer_review", "approved_for_enrollment"].includes(caseRecord.stage)) {
    errors.push("This case is not in a quote-ready stage.");
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function buildQuoteAuditEntry({ action, scenario, latestCensus, userEmail }) {
  return {
    action,
    actor_email: userEmail || null,
    scenario_id: scenario?.id || null,
    scenario_name: scenario?.name || null,
    census_version_id: latestCensus?.id || null,
    census_version_number: latestCensus?.version_number || null,
    timestamp: new Date().toISOString(),
  };
}

export function buildScenarioVersionSnapshot(scenario) {
  return {
    timestamp: new Date().toISOString(),
    status: scenario.status,
    total_monthly_premium: scenario.total_monthly_premium || 0,
    employer_monthly_cost: scenario.employer_monthly_cost || 0,
    employee_monthly_cost_avg: scenario.employee_monthly_cost_avg || 0,
    plan_count: scenario.plan_count || 0,
    recommendation_score: scenario.recommendation_score || null,
    census_version_id: scenario.census_version_id || null,
  };
}

export function appendScenarioVersion(existingVersions = [], snapshot) {
  return [...existingVersions, snapshot].slice(-25);
}