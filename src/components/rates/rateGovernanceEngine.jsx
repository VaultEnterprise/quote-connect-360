export function sortRateTablesByEffectiveDate(rateTables = []) {
  return [...rateTables].sort((a, b) => new Date(b.effective_date || 0) - new Date(a.effective_date || 0));
}

export function pickEffectiveRateTable(rateTables = [], effectiveDate, state) {
  const targetDate = effectiveDate ? new Date(effectiveDate) : null;
  const scoped = state ? rateTables.filter((table) => !table.state || table.state === state) : rateTables;
  const sorted = sortRateTablesByEffectiveDate(scoped);
  if (!targetDate) return sorted[0] || null;
  return sorted.find((table) => new Date(table.effective_date || 0) <= targetDate) || sorted[0] || null;
}

export function getCompositeTierRate(rateTable, tier = "employee_only") {
  if (!rateTable) return 0;
  const lookup = {
    employee_only: Number(rateTable.ee_rate || 0),
    employee_spouse: Number(rateTable.es_rate || rateTable.ee_rate || 0),
    employee_children: Number(rateTable.ec_rate || rateTable.ee_rate || 0),
    family: Number(rateTable.fam_rate || rateTable.ee_rate || 0),
  };
  return lookup[tier] || lookup.employee_only;
}

export function getAgeBandedRate(rateTable, age) {
  if (!rateTable?.age_banded_rates?.length) return 0;
  const sorted = [...rateTable.age_banded_rates].sort((a, b) => Number(a.age || 0) - Number(b.age || 0));
  const matched = sorted.find((row) => Number(row.age) >= Number(age || 0));
  return Number((matched || sorted[sorted.length - 1])?.rate || 0);
}

export function summarizeRatePlan(plan, rateTables = []) {
  const sorted = sortRateTablesByEffectiveDate(rateTables);
  const latest = sorted[0];
  const future = sorted.filter((table) => new Date(table.effective_date || 0) > new Date());
  const historical = sorted.slice(1);

  return {
    latest,
    futureCount: future.length,
    historicalCount: historical.length,
    hasRates: sorted.length > 0,
    versionCount: sorted.length,
    pricingMode: latest?.rate_type || null,
  };
}

export function buildRateDependencySummary({ plans = [], rateTables = [], scenarioPlans = [], quoteScenarios = [], employeeEnrollments = [], renewals = [] }) {
  const plansWithoutRates = plans.filter((plan) => !rateTables.some((table) => table.plan_id === plan.id));
  const scenarioPlanIds = new Set(scenarioPlans.map((item) => item.plan_id));
  const quotedPlansWithoutRates = [...scenarioPlanIds].filter((planId) => !rateTables.some((table) => table.plan_id === planId));
  const enrollmentPlans = employeeEnrollments.filter((item) => item.selected_plan_id);

  return {
    plansWithoutRates: plansWithoutRates.length,
    quotedPlansWithoutRates: quotedPlansWithoutRates.length,
    quotedScenarios: quoteScenarios.length,
    enrollmentDependencies: enrollmentPlans.length,
    renewalDependencies: renewals.length,
  };
}

export function validateRateTablePayload(payload) {
  const errors = [];
  if (!payload.effective_date) errors.push("Effective date is required.");
  if (!payload.rate_type) errors.push("Rate type is required.");

  if (payload.rate_type === "composite") {
    if ([payload.ee_rate, payload.es_rate, payload.ec_rate, payload.fam_rate].every((value) => value == null || value === "")) {
      errors.push("At least one composite tier rate is required.");
    }
  }

  if (payload.rate_type === "age_banded") {
    if (!payload.age_banded_rates?.length) errors.push("At least one age band row is required.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}