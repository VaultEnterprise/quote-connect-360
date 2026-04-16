export function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function computeScenarioContributionView({ scenario, employeeCount = 0, dependentCount = 0 }) {
  const totalPremium = Number(scenario?.total_monthly_premium || 0);
  const employerMonthlyCost = Number(scenario?.employer_monthly_cost || 0);
  const employeeMonthlyCostAvg = Number(scenario?.employee_monthly_cost_avg || 0);
  const employeeTotal = Math.max(1, Number(employeeCount || 0));
  const dependentTotal = Math.max(0, Number(dependentCount || 0));
  const totalMembers = employeeTotal + dependentTotal;
  const employeeMonthlyTotal = Math.max(0, totalPremium - employerMonthlyCost);
  const employerPct = totalPremium > 0 ? Math.round((employerMonthlyCost / totalPremium) * 100) : 0;

  return {
    totalPremium,
    employerMonthlyCost,
    employeeMonthlyCostAvg,
    employeeMonthlyTotal,
    employerPct,
    employeePct: 100 - employerPct,
    employeeCount: employeeTotal,
    dependentCount: dependentTotal,
    totalMembers,
    annualEmployerCost: employerMonthlyCost * 12,
    annualEmployeeCost: employeeMonthlyTotal * 12,
  };
}

export function computeModeledContribution({ totalPremium, employeeCount = 0, dependentCount = 0, eeContribution = 0, depContribution = 0 }) {
  const employees = Math.max(1, Number(employeeCount || 0));
  const dependents = Math.max(0, Number(dependentCount || 0));
  const totalLives = employees + dependents;
  const employeePortion = totalLives > 0 ? totalPremium * (employees / totalLives) : totalPremium;
  const dependentPortion = Math.max(0, totalPremium - employeePortion);

  const employerEmployeeCost = employeePortion * (eeContribution / 100);
  const employerDependentCost = dependentPortion * (depContribution / 100);
  const employerCost = employerEmployeeCost + employerDependentCost;
  const employeeCost = Math.max(0, totalPremium - employerCost);
  const employeeOnlyMonthlyContribution = employees > 0 ? (employeePortion * (1 - eeContribution / 100)) / employees : 0;

  return {
    employerCost,
    employeeCost,
    employerEmployeeCost,
    employerDependentCost,
    employeeOnlyMonthlyContribution,
    avgEmployeeCost: employees > 0 ? employeeCost / employees : 0,
  };
}

export function getScenarioCensusStats(censusMembers = []) {
  const eligible = censusMembers.filter((member) => member.is_eligible !== false);
  const dependentCount = eligible.filter((member) => member.coverage_tier && member.coverage_tier !== 'employee_only').length;
  return {
    employeeCount: eligible.length,
    dependentCount,
  };
}