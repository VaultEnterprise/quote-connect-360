export function parseJsonConfig(value, fallback) {
  if (!value) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function buildEmployerControlPlane(employer, related = {}) {
  const censusMembers = related.censusMembers || [];
  const proposals = related.proposals || [];
  const enrollments = related.enrollments || [];
  const renewals = related.renewals || [];
  const cases = related.cases || [];

  const profile = {
    eligibility: parseJsonConfig(employer?.settings?.eligibility, {
      waiting_period_days: 0,
      minimum_hours_per_week: 30,
      allow_dependents: true,
      eligible_employment_types: ["full_time"],
    }),
    contributions: parseJsonConfig(employer?.settings?.contributions, {
      strategy: "percentage",
      employee_percent: 80,
      dependent_percent: 50,
    }),
    billing: parseJsonConfig(employer?.settings?.billing, {
      billing_method: "carrier_invoice",
      payroll_frequency: "biweekly",
      cobra_admin_enabled: false,
    }),
    plans: parseJsonConfig(employer?.settings?.plans, {
      enabled_products: ["medical", "dental", "vision"],
      default_funding: "fully_insured",
      allow_hsa: false,
    }),
    integrations: parseJsonConfig(employer?.settings?.integrations, {
      payroll_system: "none",
      carrier_edi: false,
      billing_sync: false,
    }),
  };

  const eligibleMembers = censusMembers.filter((member) => member.is_eligible !== false);
  const invalidMembers = censusMembers.filter((member) => member.validation_status === "has_errors");
  const pendingProposals = proposals.filter((item) => ["sent", "viewed"].includes(item.status));
  const activeEnrollment = enrollments.find((item) => ["open", "closing_soon", "scheduled"].includes(item.status));
  const openRenewal = renewals.find((item) => item.status !== "completed");
  const activeCases = cases.filter((item) => !["closed", "renewed"].includes(item.stage));

  return {
    profile,
    readiness: {
      censusAligned: invalidMembers.length === 0,
      quoteAligned: pendingProposals.length >= 0 && !!profile.plans.enabled_products?.length,
      enrollmentAligned: !!activeEnrollment ? eligibleMembers.length > 0 : true,
      renewalAligned: !!openRenewal ? !!profile.contributions : true,
      integrationsAligned: profile.integrations.payroll_system !== "none" || profile.integrations.carrier_edi || profile.integrations.billing_sync,
    },
    metrics: {
      eligibleMembers: eligibleMembers.length,
      invalidMembers: invalidMembers.length,
      activeCases: activeCases.length,
      pendingProposals: pendingProposals.length,
      enrollmentStatus: activeEnrollment?.status || "not_started",
      renewalStatus: openRenewal?.status || "not_started",
    },
  };
}

export function buildEmployerConfigDraft(employer) {
  const settings = employer?.settings || {};
  return {
    eligibility_waiting_period_days: parseJsonConfig(settings.eligibility, {}).waiting_period_days ?? 0,
    eligibility_minimum_hours_per_week: parseJsonConfig(settings.eligibility, {}).minimum_hours_per_week ?? 30,
    eligibility_allow_dependents: parseJsonConfig(settings.eligibility, {}).allow_dependents ?? true,
    contribution_strategy: parseJsonConfig(settings.contributions, {}).strategy || "percentage",
    contribution_employee_percent: parseJsonConfig(settings.contributions, {}).employee_percent ?? 80,
    contribution_dependent_percent: parseJsonConfig(settings.contributions, {}).dependent_percent ?? 50,
    billing_method: parseJsonConfig(settings.billing, {}).billing_method || "carrier_invoice",
    payroll_frequency: parseJsonConfig(settings.billing, {}).payroll_frequency || "biweekly",
    cobra_admin_enabled: parseJsonConfig(settings.billing, {}).cobra_admin_enabled ?? false,
    enabled_products: (parseJsonConfig(settings.plans, {}).enabled_products || ["medical", "dental", "vision"]).join(", "),
    default_funding: parseJsonConfig(settings.plans, {}).default_funding || "fully_insured",
    allow_hsa: parseJsonConfig(settings.plans, {}).allow_hsa ?? false,
    payroll_system: parseJsonConfig(settings.integrations, {}).payroll_system || "none",
    carrier_edi: parseJsonConfig(settings.integrations, {}).carrier_edi ?? false,
    billing_sync: parseJsonConfig(settings.integrations, {}).billing_sync ?? false,
  };
}

export function serializeEmployerConfigDraft(form) {
  return {
    eligibility: {
      waiting_period_days: Number(form.eligibility_waiting_period_days || 0),
      minimum_hours_per_week: Number(form.eligibility_minimum_hours_per_week || 30),
      allow_dependents: !!form.eligibility_allow_dependents,
      eligible_employment_types: ["full_time"],
    },
    contributions: {
      strategy: form.contribution_strategy,
      employee_percent: Number(form.contribution_employee_percent || 0),
      dependent_percent: Number(form.contribution_dependent_percent || 0),
    },
    billing: {
      billing_method: form.billing_method,
      payroll_frequency: form.payroll_frequency,
      cobra_admin_enabled: !!form.cobra_admin_enabled,
    },
    plans: {
      enabled_products: String(form.enabled_products || "").split(",").map((item) => item.trim()).filter(Boolean),
      default_funding: form.default_funding,
      allow_hsa: !!form.allow_hsa,
    },
    integrations: {
      payroll_system: form.payroll_system,
      carrier_edi: !!form.carrier_edi,
      billing_sync: !!form.billing_sync,
    },
  };
}