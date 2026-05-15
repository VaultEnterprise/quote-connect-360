import { pickEffectiveRateTable, getCompositeTierRate } from "@/components/rates/rateGovernanceEngine";

export function calculatePlanMonthlyRate({ plan, rateTables = [], coverageTier = "employee_only", effectiveDate, state }) {
  const relevantTables = rateTables.filter((table) => table.plan_id === (plan?.plan_id || plan?.id));
  const rateTable = pickEffectiveRateTable(relevantTables, effectiveDate, state);
  return {
    rateTable,
    monthlyRate: getCompositeTierRate(rateTable, coverageTier),
  };
}

export function calculateContributionSplit({ monthlyRate = 0, eeContribution = 0, depContribution = 0, coverageTier = "employee_only" }) {
  const employeeShareBase = monthlyRate * (Number(eeContribution || 0) / 100);
  const dependentShareBase = coverageTier === "employee_only" ? 0 : monthlyRate * (Number(depContribution || 0) / 100);
  const employerCost = Math.min(monthlyRate, employeeShareBase + dependentShareBase);
  const employeeCost = Math.max(0, monthlyRate - employerCost);

  return {
    employerCost,
    employeeCost,
  };
}

export function buildScenarioFinancialSnapshot({ scenarioPlans = [], rateTables = [], effectiveDate, state, coverageTier = "employee_only" }) {
  const planBreakdown = scenarioPlans.map((plan) => {
    const { rateTable, monthlyRate } = calculatePlanMonthlyRate({
      plan,
      rateTables,
      coverageTier,
      effectiveDate,
      state,
    });
    const contribution = calculateContributionSplit({
      monthlyRate,
      eeContribution: plan.employer_contribution_ee,
      depContribution: plan.employer_contribution_dep,
      coverageTier,
    });

    return {
      plan_id: plan.plan_id,
      plan_name: plan.plan_name,
      plan_type: plan.plan_type,
      carrier: plan.carrier,
      rate_table_id: rateTable?.id || null,
      monthly_rate: monthlyRate,
      employer_monthly_cost: contribution.employerCost,
      employee_monthly_cost: contribution.employeeCost,
      has_rate: !!rateTable,
    };
  });

  return {
    planBreakdown,
    totalMonthlyPremium: planBreakdown.reduce((sum, item) => sum + Number(item.monthly_rate || 0), 0),
    employerMonthlyCost: planBreakdown.reduce((sum, item) => sum + Number(item.employer_monthly_cost || 0), 0),
    employeeMonthlyCost: planBreakdown.reduce((sum, item) => sum + Number(item.employee_monthly_cost || 0), 0),
    missingRateCount: planBreakdown.filter((item) => !item.has_rate).length,
  };
}