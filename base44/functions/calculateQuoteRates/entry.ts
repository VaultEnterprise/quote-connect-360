import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const VALID_SCENARIO_STATUSES = new Set(['draft', 'running', 'completed', 'error', 'expired']);
const DEPENDENT_TIERS = new Set(['employee_spouse', 'employee_children', 'family']);

function normalizeDate(value) {
  return value ? new Date(value) : null;
}

function pickBestRateTable(rateTables, scenarioEffectiveDate) {
  if (!rateTables.length) return null;
  const effectiveDate = normalizeDate(scenarioEffectiveDate);
  const sorted = [...rateTables]
    .filter((table) => table.effective_date)
    .sort((a, b) => new Date(b.effective_date) - new Date(a.effective_date));

  if (!effectiveDate) return sorted[0] || rateTables[0];

  const eligible = sorted.filter((table) => new Date(table.effective_date) <= effectiveDate);
  return eligible[0] || sorted[0] || rateTables[0];
}

function getCompositeRate(rateTable, tier) {
  const eeRate = Number(rateTable.ee_rate || 0);
  const esRate = Number(rateTable.es_rate || 0) || eeRate;
  const ecRate = Number(rateTable.ec_rate || 0) || eeRate;
  const famRate = Number(rateTable.fam_rate || 0) || eeRate;

  return {
    employee_only: eeRate,
    employee_spouse: esRate,
    employee_children: ecRate,
    family: famRate,
  }[tier] || eeRate;
}

function clampPercent(value) {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return 0;
  return Math.max(0, Math.min(100, num));
}

function calculateEmployerContribution({ contributionType, eeRate, totalRate, employerContributionEe, employerContributionDep }) {
  if (contributionType === 'flat_dollar') {
    const employerEe = Math.min(eeRate, Number(employerContributionEe || 0));
    const dependentPortion = Math.max(0, totalRate - eeRate);
    const employerDep = Math.min(dependentPortion, Number(employerContributionDep || 0));
    return employerEe + employerDep;
  }

  const eePct = clampPercent(employerContributionEe) / 100;
  const depPct = clampPercent(employerContributionDep) / 100;
  const dependentPortion = Math.max(0, totalRate - eeRate);
  return (eeRate * eePct) + (dependentPortion * depPct);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { scenario_id } = await req.json();
    if (!scenario_id) {
      return Response.json({ error: 'scenario_id required' }, { status: 400 });
    }

    const scenario = (await base44.asServiceRole.entities.QuoteScenario.filter({ id: scenario_id }))[0];
    if (!scenario) {
      return Response.json({ error: 'Scenario not found' }, { status: 404 });
    }

    if (!VALID_SCENARIO_STATUSES.has(scenario.status)) {
      return Response.json({ error: 'Invalid scenario status' }, { status: 400 });
    }

    const scenarioPlans = await base44.asServiceRole.entities.ScenarioPlan.filter({ scenario_id });
    if (!scenarioPlans.length) {
      await base44.asServiceRole.entities.QuoteScenario.update(scenario_id, { status: 'error' });
      return Response.json({ error: 'No plans in scenario' }, { status: 400 });
    }

    const [caseRecord] = await base44.asServiceRole.entities.BenefitCase.filter({ id: scenario.case_id });
    if (!caseRecord) {
      await base44.asServiceRole.entities.QuoteScenario.update(scenario_id, { status: 'error' });
      return Response.json({ error: 'Case not found for scenario' }, { status: 400 });
    }

    const censusVersions = await base44.asServiceRole.entities.CensusVersion.filter({ case_id: scenario.case_id });
    const latestCensus = [...censusVersions].sort((a, b) => Number(b.version_number || 0) - Number(a.version_number || 0))[0];
    const members = latestCensus
      ? await base44.asServiceRole.entities.CensusMember.filter({ case_id: scenario.case_id, census_version_id: latestCensus.id, is_eligible: true })
      : [];

    const censusState = {
      hasCensus: !!latestCensus,
      censusVersionId: latestCensus?.id || null,
      censusVersionNumber: latestCensus?.version_number || null,
      eligibleMemberCount: members.length,
      validationStatus: latestCensus?.status || 'missing',
      validationErrors: Number(latestCensus?.validation_errors || 0),
      validationWarnings: Number(latestCensus?.validation_warnings || 0),
    };

    const tierDistribution = members.reduce((acc, member) => {
      const tier = member.coverage_tier || 'employee_only';
      acc[tier] = (acc[tier] || 0) + 1;
      return acc;
    }, {});

    if (!latestCensus) {
      await base44.asServiceRole.entities.QuoteScenario.update(scenario_id, {
        status: 'error',
        notes: `${scenario.notes ? `${scenario.notes}\n\n` : ''}Calculation blocked: no census version is attached to this case.`,
      });
      return Response.json({ error: 'No census version found for this case' }, { status: 400 });
    }

    if (!Object.keys(tierDistribution).length) {
      tierDistribution.employee_only = Math.max(1, Number(caseRecord.employee_count || 1));
    }

    const totalMembers = Object.values(tierDistribution).reduce((sum, count) => sum + Number(count || 0), 0) || 1;

    let totalMonthlyPremium = 0;
    let totalEmployerCost = 0;
    let totalEmployeeCost = 0;
    const planResults = [];
    const skippedPlans = [];
    const allCarriers = new Set();
    const allProducts = new Set();

    for (const scenarioPlan of scenarioPlans) {
      if (scenarioPlan.carrier) allCarriers.add(scenarioPlan.carrier);
      if (scenarioPlan.plan_type) allProducts.add(scenarioPlan.plan_type);

      const rateTables = await base44.asServiceRole.entities.PlanRateTable.filter({ plan_id: scenarioPlan.plan_id });
      const rateTable = pickBestRateTable(rateTables, scenario.effective_date || caseRecord.effective_date);

      if (!rateTable) {
        skippedPlans.push({ plan_id: scenarioPlan.plan_id, plan_name: scenarioPlan.plan_name, reason: 'No rate table found' });
        continue;
      }

      let planPremium = 0;
      let planEmployer = 0;
      let planEmployee = 0;
      const tierBreakdown = {};

      for (const [tier, countRaw] of Object.entries(tierDistribution)) {
        const count = Number(countRaw || 0);
        const totalRate = getCompositeRate(rateTable, tier);
        const eeRate = Number(rateTable.ee_rate || 0);
        const contributionType = scenarioPlan.contribution_type || 'percentage';
        const employerContribution = calculateEmployerContribution({
          contributionType,
          eeRate,
          totalRate,
          employerContributionEe: scenarioPlan.employer_contribution_ee,
          employerContributionDep: scenarioPlan.employer_contribution_dep,
        });

        const cappedEmployerContribution = Math.max(0, Math.min(totalRate, employerContribution));
        const employeeContribution = Math.max(0, totalRate - cappedEmployerContribution);

        const totalTierPremium = totalRate * count;
        const totalTierEmployer = cappedEmployerContribution * count;
        const totalTierEmployee = employeeContribution * count;

        tierBreakdown[tier] = {
          count,
          total_rate: totalRate,
          employer_per_member: cappedEmployerContribution,
          employee_per_member: employeeContribution,
          total_premium: totalTierPremium,
          employer_cost: totalTierEmployer,
          employee_cost: totalTierEmployee,
          has_dependents: DEPENDENT_TIERS.has(tier),
        };

        planPremium += totalTierPremium;
        planEmployer += totalTierEmployer;
        planEmployee += totalTierEmployee;
      }

      planResults.push({
        plan_id: scenarioPlan.plan_id,
        scenario_plan_id: scenarioPlan.id,
        plan_name: scenarioPlan.plan_name,
        carrier: scenarioPlan.carrier,
        plan_type: scenarioPlan.plan_type,
        network_type: scenarioPlan.network_type,
        rate_table_id: rateTable.id,
        rate_table_effective_date: rateTable.effective_date,
        contribution_type: scenarioPlan.contribution_type,
        total_monthly_premium: planPremium,
        employer_monthly_cost: planEmployer,
        employee_monthly_cost: planEmployee,
        avg_employee_cost: totalMembers ? planEmployee / totalMembers : 0,
        tier_breakdown: tierBreakdown,
      });

      totalMonthlyPremium += planPremium;
      totalEmployerCost += planEmployer;
      totalEmployeeCost += planEmployee;
    }

    const scenarioStatus = planResults.length ? 'completed' : 'error';
    const recommendationScore = totalMonthlyPremium > 0
      ? Math.max(1, Math.min(100, Math.round(100 - ((totalEmployeeCost / totalMonthlyPremium) * 35))))
      : scenario.recommendation_score || null;

    const scenarioUpdate = {
      total_monthly_premium: totalMonthlyPremium,
      employer_monthly_cost: totalEmployerCost,
      employee_monthly_cost_avg: totalMembers ? totalEmployeeCost / totalMembers : 0,
      plan_count: planResults.length,
      carriers_included: Array.from(allCarriers),
      products_included: Array.from(allProducts),
      recommendation_score: recommendationScore,
      quoted_at: new Date().toISOString(),
      status: scenarioStatus,
      notes: skippedPlans.length
        ? `${scenario.notes ? `${scenario.notes}\n\n` : ''}Calculation warnings: ${skippedPlans.map((p) => `${p.plan_name}: ${p.reason}`).join('; ')}`
        : scenario.notes,
    };

    await base44.asServiceRole.entities.QuoteScenario.update(scenario_id, scenarioUpdate);
    await base44.asServiceRole.entities.BenefitCase.update(caseRecord.id, {
      quote_status: scenarioStatus === 'completed' ? 'completed' : 'in_progress',
      stage: ['ready_for_quote', 'quoting'].includes(caseRecord.stage) && scenarioStatus === 'completed' ? 'proposal_ready' : caseRecord.stage,
      last_activity_date: new Date().toISOString(),
    });

    await base44.asServiceRole.entities.ActivityLog.create({
      case_id: caseRecord.id,
      actor_email: user.email,
      actor_name: user.full_name,
      action: 'Quote scenario calculated',
      detail: `${scenario.name} calculated with ${planResults.length} rated plan(s)`,
      entity_type: 'QuoteScenario',
      entity_id: scenario_id,
      new_value: JSON.stringify({ total_monthly_premium: totalMonthlyPremium, employer_monthly_cost: totalEmployerCost, employee_monthly_cost_avg: totalMembers ? totalEmployeeCost / totalMembers : 0 }),
    });

    return Response.json({
      scenario_id,
      case_id: caseRecord.id,
      census: censusState,
      total_members: totalMembers,
      total_monthly_premium: totalMonthlyPremium,
      employer_monthly_cost: totalEmployerCost,
      employee_monthly_cost_avg: totalMembers ? totalEmployeeCost / totalMembers : 0,
      plan_results: planResults,
      skipped_plans: skippedPlans,
      tier_distribution: tierDistribution,
      calculated_at: new Date().toISOString(),
      status: scenarioStatus,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});