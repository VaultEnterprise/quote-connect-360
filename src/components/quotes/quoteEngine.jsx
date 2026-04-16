export function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function getScenarioCensusStats(censusMembers = []) {
  const eligibleMembers = censusMembers.filter((member) => member.is_eligible !== false);
  const tierCounts = eligibleMembers.reduce((acc, member) => {
    const tier = member.coverage_tier || "employee_only";
    acc[tier] = (acc[tier] || 0) + 1;
    return acc;
  }, {});

  const employeeCount = eligibleMembers.length;
  const enrollingMembers = Object.values(tierCounts).reduce((sum, count) => sum + Number(count || 0), 0);
  const dependentElectionCount = (tierCounts.employee_spouse || 0) + (tierCounts.employee_children || 0) + (tierCounts.family || 0);

  return {
    eligibleMembers,
    employeeCount,
    dependentCount: dependentElectionCount,
    enrollingMembers,
    tierCounts: {
      employee_only: tierCounts.employee_only || 0,
      employee_spouse: tierCounts.employee_spouse || 0,
      employee_children: tierCounts.employee_children || 0,
      family: tierCounts.family || 0,
    },
  };
}

export function computeScenarioContributionView({ scenario, censusStats }) {
  const totalPremium = Number(scenario?.total_monthly_premium || 0);
  const employerMonthlyCost = Number(scenario?.employer_monthly_cost || 0);
  const employeeMonthlyCostAvg = Number(scenario?.employee_monthly_cost_avg || 0);
  const employeeCount = Math.max(1, Number(censusStats?.employeeCount || 0));
  const dependentCount = Math.max(0, Number(censusStats?.dependentCount || 0));
  const totalMembers = Math.max(employeeCount, Number(censusStats?.enrollingMembers || employeeCount));
  const employeeMonthlyTotal = Math.max(0, totalPremium - employerMonthlyCost);
  const employerPct = totalPremium > 0 ? Math.round((employerMonthlyCost / totalPremium) * 100) : 0;

  return {
    totalPremium,
    employerMonthlyCost,
    employeeMonthlyCostAvg,
    employeeMonthlyTotal,
    employerPct,
    employeePct: Math.max(0, 100 - employerPct),
    employeeCount,
    dependentCount,
    totalMembers,
    annualEmployerCost: employerMonthlyCost * 12,
    annualEmployeeCost: employeeMonthlyTotal * 12,
  };
}

export function computeModeledContribution({ totalPremium, censusStats, eeContribution = 0, depContribution = 0 }) {
  const tierCounts = censusStats?.tierCounts || {};
  const employeeOnlyCount = Number(tierCounts.employee_only || 0);
  const spouseCount = Number(tierCounts.employee_spouse || 0);
  const childrenCount = Number(tierCounts.employee_children || 0);
  const familyCount = Number(tierCounts.family || 0);
  const enrolledEmployees = Math.max(1, employeeOnlyCount + spouseCount + childrenCount + familyCount);
  const dependentElections = spouseCount + childrenCount + familyCount;

  const employeePremiumWeight = enrolledEmployees;
  const dependentPremiumWeight = dependentElections;
  const totalWeight = Math.max(1, employeePremiumWeight + dependentPremiumWeight);

  const employeePortion = totalPremium * (employeePremiumWeight / totalWeight);
  const dependentPortion = totalPremium - employeePortion;
  const employerEmployeeCost = employeePortion * (Number(eeContribution || 0) / 100);
  const employerDependentCost = dependentPortion * (Number(depContribution || 0) / 100);
  const employerCost = employerEmployeeCost + employerDependentCost;
  const employeeCost = Math.max(0, totalPremium - employerCost);
  const employeeOnlyMonthlyContribution = enrolledEmployees > 0 ? (employeePortion - employerEmployeeCost) / enrolledEmployees : 0;

  return {
    employerCost,
    employeeCost,
    employerEmployeeCost,
    employerDependentCost,
    employeeOnlyMonthlyContribution,
    avgEmployeeCost: enrolledEmployees > 0 ? employeeCost / enrolledEmployees : 0,
  };
}

export function buildScenarioOperationalSummary({ scenario, caseRecord, censusStats, scenarioPlans = [] }) {
  const missingPlanAssignments = scenarioPlans.length === 0;
  const missingCensus = !censusStats || censusStats.employeeCount === 0;
  const isCalculated = scenario.status === "completed";

  return {
    missingPlanAssignments,
    missingCensus,
    isCalculated,
    readyForEnrollment: isCalculated && !missingPlanAssignments && !missingCensus,
    downstreamStatus: {
      caseStage: caseRecord?.stage || "draft",
      quoteStatus: caseRecord?.quote_status || "not_started",
      enrollmentStatus: caseRecord?.enrollment_status || "not_started",
    },
  };
}