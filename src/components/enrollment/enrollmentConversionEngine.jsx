import { buildQuoteReadiness } from "@/components/quotes/quoteGovernanceEngine";

export function getApprovedScenarioForCase(caseId, scenarios = []) {
  return [...scenarios]
    .filter((scenario) => scenario.case_id === caseId && ["approved", "completed", "reviewed"].includes(scenario.status))
    .sort((a, b) => Number(b.recommendation_score || 0) - Number(a.recommendation_score || 0))[0] || null;
}

export function buildEnrollmentConversionPayload({ caseRecord, scenario, censusVersions = [], enrollments = [], renewals = [] }) {
  const readiness = buildQuoteReadiness({
    scenario,
    caseRecord,
    censusVersions,
    enrollments,
    renewals,
  });

  const errors = [];
  if (!caseRecord) errors.push("Case is required.");
  if (!scenario) errors.push("An approved quote scenario is required.");
  if (scenario && !readiness.checks.pricingReady) errors.push("Scenario pricing is not ready for enrollment.");

  return {
    isValid: errors.length === 0,
    errors,
    readiness,
    defaults: {
      case_id: caseRecord?.id || "",
      effective_date: scenario?.effective_date || caseRecord?.effective_date || "",
      total_eligible: readiness.latestCensus?.eligible_employees || caseRecord?.eligible_count || caseRecord?.employee_count || "",
      employer_name: caseRecord?.employer_name || "",
      quote_scenario_id: scenario?.id || "",
      quote_scenario_name: scenario?.name || "",
      quote_census_version_id: readiness.latestCensus?.id || scenario?.census_version_id || "",
      total_monthly_premium: scenario?.total_monthly_premium || 0,
      employer_monthly_cost: scenario?.employer_monthly_cost || 0,
      employee_monthly_cost_avg: scenario?.employee_monthly_cost_avg || 0,
    },
  };
}

export function buildEnrollmentWindowFromScenario({ form, conversion }) {
  return {
    case_id: form.case_id,
    start_date: form.start_date,
    end_date: form.end_date,
    effective_date: form.effective_date,
    total_eligible: form.total_eligible ? Number(form.total_eligible) : undefined,
    status: form.status,
    employer_name: conversion.defaults.employer_name,
    quote_scenario_id: conversion.defaults.quote_scenario_id,
    quote_scenario_name: conversion.defaults.quote_scenario_name,
    quote_census_version_id: conversion.defaults.quote_census_version_id,
    total_monthly_premium: conversion.defaults.total_monthly_premium,
    employer_monthly_cost: conversion.defaults.employer_monthly_cost,
    employee_monthly_cost_avg: conversion.defaults.employee_monthly_cost_avg,
  };
}