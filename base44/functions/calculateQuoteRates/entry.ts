import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { scenario_id } = await req.json();
    if (!scenario_id) return Response.json({ error: 'scenario_id required' }, { status: 400 });

    // Fetch scenario
    const scenarios = await base44.asServiceRole.entities.QuoteScenario.filter({ id: scenario_id });
    const scenario = scenarios[0];
    if (!scenario) return Response.json({ error: 'Scenario not found' }, { status: 404 });

    // Fetch plans in this scenario
    const scenarioPlans = await base44.asServiceRole.entities.ScenarioPlan.filter({ scenario_id });
    if (scenarioPlans.length === 0) return Response.json({ error: 'No plans in scenario' }, { status: 400 });

    // Fetch census members for this case
    const censusVersions = await base44.asServiceRole.entities.CensusVersion.filter({ case_id: scenario.case_id });
    const latestCensus = censusVersions.sort((a, b) => b.version_number - a.version_number)[0];

    let members = [];
    if (latestCensus) {
      members = await base44.asServiceRole.entities.CensusMember.filter({
        census_version_id: latestCensus.id,
        is_eligible: true,
      });
    }

    const totalMembers = members.length || 1;

    // Coverage tier distribution (default if no census)
    const tierDist = members.reduce((acc, m) => {
      const tier = m.coverage_tier || 'employee_only';
      acc[tier] = (acc[tier] || 0) + 1;
      return acc;
    }, {});
    if (members.length === 0) {
      tierDist['employee_only'] = 1; // fallback for empty census
    }

    let totalMonthlyPremium = 0;
    let totalEmployerCost = 0;
    let totalEmployeeCost = 0;
    const planResults = [];

    for (const sp of scenarioPlans) {
      // Find rate table for this plan
      const rateTables = await base44.asServiceRole.entities.PlanRateTable.filter({ plan_id: sp.plan_id });
      const rateTable = rateTables.sort((a, b) => new Date(b.effective_date) - new Date(a.effective_date))[0];

      if (!rateTable) {
        planResults.push({ plan_id: sp.plan_id, plan_name: sp.plan_name, skipped: true, reason: 'No rate table found' });
        continue;
      }

      const eeRate = rateTable.ee_rate || 0;
      const esRate = rateTable.es_rate || eeRate * 1.8;
      const ecRate = rateTable.ec_rate || eeRate * 1.6;
      const famRate = rateTable.fam_rate || eeRate * 2.2;

      const rateByTier = {
        employee_only: eeRate,
        employee_spouse: esRate,
        employee_children: ecRate,
        family: famRate,
      };

      // Calculate premiums by tier
      let planTotalPremium = 0;
      let planEmployerCost = 0;
      let planEmployeeCost = 0;
      const tierBreakdown = {};

      const eePct = (sp.employer_contribution_ee || 100) / 100;
      const depPct = (sp.employer_contribution_dep || 50) / 100;

      for (const [tier, count] of Object.entries(tierDist)) {
        const rate = rateByTier[tier] || eeRate;
        const tierPremium = rate * count;

        // Employer contribution varies by whether dependents are included
        const hasDependent = ['employee_spouse', 'employee_children', 'family'].includes(tier);
        const empContrib = hasDependent ? (eeRate * eePct + (rate - eeRate) * depPct) * count : rate * eePct * count;
        const eeContrib = tierPremium - empContrib;

        tierBreakdown[tier] = {
          count,
          rate,
          total_premium: tierPremium,
          employer_cost: empContrib,
          employee_cost: eeContrib,
          employee_pct: rate > 0 ? Math.round((eeContrib / rate) * 100) : 0,
        };

        planTotalPremium += tierPremium;
        planEmployerCost += empContrib;
        planEmployeeCost += eeContrib;
      }

      planResults.push({
        plan_id: sp.plan_id,
        plan_name: sp.plan_name,
        carrier: sp.carrier,
        plan_type: sp.plan_type,
        network_type: sp.network_type,
        ee_rate: eeRate,
        total_monthly_premium: planTotalPremium,
        employer_monthly_cost: planEmployerCost,
        employee_monthly_cost: planEmployeeCost,
        avg_employee_cost: planEmployeeCost / totalMembers,
        tier_breakdown: tierBreakdown,
        rate_table_id: rateTable.id,
      });

      totalMonthlyPremium += planTotalPremium;
      totalEmployerCost += planEmployerCost;
      totalEmployeeCost += planEmployeeCost;
    }

    // Determine if any plans were skipped (missing rate tables)
    const skippedPlans = planResults.filter((p: any) => p.skipped === true);
    const hasIncompletePlans = skippedPlans.length > 0;

    // Update scenario with calculated totals — flag if incomplete
    await base44.asServiceRole.entities.QuoteScenario.update(scenario_id, {
      total_monthly_premium: totalMonthlyPremium,
      employer_monthly_cost: totalEmployerCost,
      employee_monthly_cost_avg: totalMembers > 0 ? totalEmployeeCost / totalMembers : 0,
      plan_count: scenarioPlans.length,
      // IMPORTANT: Use 'incomplete' status if any plans were skipped — UI must show a warning
      status: hasIncompletePlans ? 'incomplete' : 'completed',
      quoted_at: new Date().toISOString(),
      incomplete_plan_ids: hasIncompletePlans ? skippedPlans.map((p: any) => p.plan_id) : [],
      incomplete_reasons: hasIncompletePlans
        ? skippedPlans.map((p: any) => `${p.plan_name || p.plan_id}: ${p.reason || 'No rate table'}`)
        : [],
    });

    return Response.json({
      scenario_id,
      total_members: totalMembers,
      total_monthly_premium: totalMonthlyPremium,
      employer_monthly_cost: totalEmployerCost,
      employee_monthly_cost_avg: totalMembers > 0 ? totalEmployeeCost / totalMembers : 0,
      plan_results: planResults,
      tier_distribution: tierDist,
      calculated_at: new Date().toISOString(),
      // Surface incompleteness to the caller
      has_incomplete_plans: hasIncompletePlans,
      skipped_plans: skippedPlans,
      warning: hasIncompletePlans
        ? `${skippedPlans.length} plan(s) could not be calculated — missing rate tables. Totals are partial.`
        : undefined,
    });
  } catch (error) {
    console.error('[function' + '] error:', error.message, error.stack);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});