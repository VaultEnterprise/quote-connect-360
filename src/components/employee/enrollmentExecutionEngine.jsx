import { differenceInCalendarDays } from "date-fns";

export function getEmployerEnrollmentProfile(employer) {
  const settings = employer?.settings || {};
  return {
    eligibility: settings.eligibility || {},
    contributions: settings.contributions || {},
    plans: settings.plans || {},
    billing: settings.billing || {},
    integrations: settings.integrations || {},
  };
}

export function evaluateEmployeeEligibility({ member, employer, enrollmentWindow }) {
  const profile = getEmployerEnrollmentProfile(employer);
  const minimumHours = Number(profile.eligibility?.minimum_hours_per_week ?? 30);
  const waitingPeriodDays = Number(profile.eligibility?.waiting_period_days ?? 0);
  const allowedEmploymentTypes = profile.eligibility?.eligible_employment_types || ["full_time"];
  const allowDependents = profile.eligibility?.allow_dependents !== false;
  const issues = [];

  if (!member) issues.push("Employee census record is missing.");
  if (member?.employment_status && member.employment_status !== "active") issues.push("Employee is not active.");
  if (member?.is_eligible === false) issues.push(member?.eligibility_reason || "Employee is marked ineligible.");
  if (member?.hours_per_week != null && Number(member.hours_per_week) < minimumHours) issues.push("Employee does not meet minimum hours requirement.");
  if (member?.employment_type && !allowedEmploymentTypes.includes(member.employment_type)) issues.push("Employee employment type is not eligible.");

  if (member?.hire_date && enrollmentWindow?.effective_date) {
    const hireDate = new Date(member.hire_date);
    const effectiveDate = new Date(enrollmentWindow.effective_date);
    const daysEmployed = differenceInCalendarDays(effectiveDate, hireDate);
    if (daysEmployed < waitingPeriodDays) issues.push("Employee has not satisfied the waiting period.");
  }

  return {
    status: issues.length === 0 ? "eligible" : "ineligible",
    allowDependents,
    minimumHours,
    waitingPeriodDays,
    allowedEmploymentTypes,
    issues,
  };
}

export function getCoverageTierRequirements(coverageTier) {
  if (coverageTier === "employee_spouse") return { spouse: 1, children: 0 };
  if (coverageTier === "employee_children") return { spouse: 0, children: 1 };
  if (coverageTier === "family") return { spouse: 0, children: 1, allowEitherSpouseOrChildren: true };
  return { spouse: 0, children: 0 };
}

export function summarizeDependents(dependents = []) {
  const spouseCount = dependents.filter((dep) => ["spouse", "domestic_partner"].includes(dep.relationship)).length;
  const childCount = dependents.filter((dep) => ["child", "stepchild"].includes(dep.relationship)).length;
  return {
    total: dependents.length,
    spouseCount,
    childCount,
  };
}

export function buildContributionSnapshot({ selectedPlans = [], coverageTier, employer }) {
  const profile = getEmployerEnrollmentProfile(employer);
  const employeePercent = Number(profile.contributions?.employee_percent ?? 80);
  const dependentPercent = Number(profile.contributions?.dependent_percent ?? 50);
  const strategy = profile.contributions?.strategy || "percentage";

  const totals = selectedPlans.reduce((acc, plan) => {
    const rate = Number(plan.monthly_rate || 0);
    const employeeOnlyShare = rate * (employeePercent / 100);
    const dependentShare = coverageTier === "employee_only" ? 0 : rate * (dependentPercent / 100);
    const employerCost = Math.min(rate, employeeOnlyShare + dependentShare);
    const employeeCost = Math.max(0, rate - employerCost);

    acc.totalMonthlyPremium += rate;
    acc.employerMonthlyCost += employerCost;
    acc.employeeMonthlyCost += employeeCost;
    acc.planBreakdown.push({
      plan_type: plan.plan_type,
      plan_id: plan.plan_id || plan.id,
      plan_name: plan.plan_name,
      monthly_rate: rate,
      employer_monthly_cost: employerCost,
      employee_monthly_cost: employeeCost,
    });
    return acc;
  }, {
    strategy,
    employee_percent: employeePercent,
    dependent_percent: dependentPercent,
    totalMonthlyPremium: 0,
    employerMonthlyCost: 0,
    employeeMonthlyCost: 0,
    planBreakdown: [],
  });

  return {
    ...totals,
    payroll_deduction_per_month: totals.employeeMonthlyCost,
    payroll_deduction_per_pay_period: totals.employeeMonthlyCost / 2,
  };
}

export function validateEnrollmentExecution({ enrollmentWindow, employeeEnrollment, member, employer, selectedPlans = [], coverageTier, dependents = [], acknowledged }) {
  const eligibility = evaluateEmployeeEligibility({ member, employer, enrollmentWindow });
  const dependentSummary = summarizeDependents(dependents);
  const tierRules = getCoverageTierRequirements(coverageTier);
  const errors = [];

  if (!enrollmentWindow) errors.push("Enrollment window is missing.");
  if (!employeeEnrollment) errors.push("Employee enrollment record is missing.");
  if (!coverageTier) errors.push("Coverage tier is required.");
  if (!acknowledged) errors.push("Acknowledgement is required before submission.");
  if (eligibility.status !== "eligible") errors.push(...eligibility.issues);
  if (!selectedPlans.length && employeeEnrollment?.status !== "waived") errors.push("At least one plan election is required.");

  const hasMedical = selectedPlans.some((plan) => plan.plan_type === "medical");
  if (employeeEnrollment?.status !== "waived" && !hasMedical) errors.push("A medical plan election is required.");

  if (tierRules.spouse && dependentSummary.spouseCount < tierRules.spouse) {
    errors.push("Selected coverage tier requires a spouse or domestic partner dependent.");
  }
  if (tierRules.children && dependentSummary.childCount < tierRules.children && !tierRules.allowEitherSpouseOrChildren) {
    errors.push("Selected coverage tier requires at least one child dependent.");
  }
  if (coverageTier === "family" && dependentSummary.total === 0) {
    errors.push("Family coverage requires at least one dependent.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    eligibility,
    dependentSummary,
  };
}

export function buildCommittedElectionPayload({ enrollmentWindow, employeeEnrollment, employer, member, selectedPlans = [], coverageTier, dependents = [], waiverReason = null, acknowledged = false, step = "review" }) {
  const validation = validateEnrollmentExecution({
    enrollmentWindow,
    employeeEnrollment,
    member,
    employer,
    selectedPlans,
    coverageTier,
    dependents,
    acknowledged,
  });

  const contributionSnapshot = buildContributionSnapshot({ selectedPlans, coverageTier, employer });
  const now = new Date().toISOString();

  return {
    status: waiverReason ? "waived" : "completed",
    execution_status: waiverReason ? "committed" : "ready_for_signature",
    eligibility_status: validation.eligibility.status,
    eligibility_snapshot: validation.eligibility,
    coverage_tier: coverageTier,
    selected_plan_id: selectedPlans[0]?.plan_id || selectedPlans[0]?.id,
    selected_plan_name: selectedPlans[0]?.plan_name,
    selected_plans: selectedPlans,
    waiver_reason: waiverReason,
    dependents,
    dependent_summary: validation.dependentSummary,
    effective_date: enrollmentWindow?.effective_date,
    acknowledged_at: acknowledged ? now : null,
    completed_at: now,
    committed_at: waiverReason ? now : null,
    last_saved_step: step,
    last_saved_at: now,
    contribution_snapshot: contributionSnapshot,
    payroll_deduction_snapshot: {
      monthly_employee_deduction: contributionSnapshot.employeeMonthlyCost,
      per_pay_period_employee_deduction: contributionSnapshot.payroll_deduction_per_pay_period,
    },
    validation_summary: {
      is_valid: validation.isValid,
      errors: validation.errors,
      checked_at: now,
    },
    plan_selection_snapshot: {
      case_id: enrollmentWindow?.case_id,
      coverage_tier: coverageTier,
      selected_plan_count: selectedPlans.length,
    },
  };
}

export function buildInProgressPayload({ coverageTier, selectedPlans = [], dependents = [], acknowledged = false, step = "coverage" }) {
  const now = new Date().toISOString();
  return {
    execution_status: "in_progress",
    coverage_tier: coverageTier,
    selected_plan_id: selectedPlans[0]?.plan_id || selectedPlans[0]?.id,
    selected_plan_name: selectedPlans[0]?.plan_name,
    selected_plans: selectedPlans,
    dependents,
    dependent_summary: summarizeDependents(dependents),
    last_saved_step: step,
    last_saved_at: now,
    validation_summary: {
      is_valid: false,
      errors: acknowledged ? [] : ["Acknowledgement pending."],
      checked_at: now,
    },
  };
}