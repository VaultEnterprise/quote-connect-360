// PolicyMatchAI — Intelligent Risk-Based Policy Optimization Engine
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { case_id, scenario_id, mode = 'guided', trigger_stage = 'post_quote' } = await req.json();
    if (!case_id) return Response.json({ error: 'case_id required' }, { status: 400 });

    // Fetch all necessary data in parallel
    const [cases, censusVersions, availablePlans] = await Promise.all([
      base44.asServiceRole.entities.BenefitCase.filter({ id: case_id }),
      base44.asServiceRole.entities.CensusVersion.filter({ case_id }),
      base44.asServiceRole.entities.BenefitPlan.filter({ status: 'active' }),
    ]);

    const benefitCase = cases[0];
    if (!benefitCase) return Response.json({ error: 'Case not found' }, { status: 404 });

    const latestCensus = censusVersions.sort((a, b) => b.version_number - a.version_number)[0];
    let members = [];
    if (latestCensus) {
      members = await base44.asServiceRole.entities.CensusMember.filter({
        census_version_id: latestCensus.id,
        is_eligible: true,
      });
    }

    // Fetch scenario plans if scenario_id provided
    let scenarioPlans = [];
    if (scenario_id) {
      scenarioPlans = await base44.asServiceRole.entities.ScenarioPlan.filter({ scenario_id });
    }

    // Build context for AI
    const memberCount = members.length || benefitCase.employee_count || 0;
    const avgAge = members.length > 0
      ? Math.round(members.reduce((sum, m) => {
          if (!m.date_of_birth) return sum + 40;
          const age = Math.floor((Date.now() - new Date(m.date_of_birth)) / (365.25 * 24 * 3600 * 1000));
          return sum + age;
        }, 0) / members.length)
      : 38;

    const smokerCount = members.filter(m => m.class_code === 'smoker').length;
    const smokerPct = members.length > 0 ? Math.round((smokerCount / members.length) * 100) : 0;
    const coverageTiers = members.reduce((acc, m) => { acc[m.coverage_tier || 'employee_only'] = (acc[m.coverage_tier || 'employee_only'] || 0) + 1; return acc; }, {});

    const medicalPlans = availablePlans.filter(p => p.plan_type === 'medical');
    const ancillaryPlans = availablePlans.filter(p => ['dental', 'vision', 'life', 'std', 'ltd', 'voluntary'].includes(p.plan_type));

    const existingPlanNames = scenarioPlans.map(p => p.plan_name).join(', ') || 'No plans selected yet';

    const prompt = `You are PolicyMatchAI, an intelligent risk-based policy optimization engine for group health insurance.

CASE DATA:
- Employer: ${benefitCase.employer_name}
- Case Type: ${benefitCase.case_type}
- Employee Count: ${memberCount}
- Average Member Age: ${avgAge}
- Smoker Percentage: ${smokerPct}%
- Coverage Tier Distribution: ${JSON.stringify(coverageTiers)}
- Current Plans in Scenario: ${existingPlanNames}
- Trigger Stage: ${trigger_stage}
- Optimization Mode: ${mode}

AVAILABLE MEDICAL PLANS (${medicalPlans.length} total):
${medicalPlans.slice(0, 10).map(p => `- ${p.plan_name} (${p.carrier}, ${p.network_type}, Ded: $${p.deductible_individual || '?'}, OOP: $${p.oop_max_individual || '?'}, PCP: $${p.copay_pcp || '?'})`).join('\n')}

AVAILABLE ANCILLARY PLANS (${ancillaryPlans.length} total):
${ancillaryPlans.slice(0, 10).map(p => `- ${p.plan_name} (${p.plan_type}, ${p.carrier})`).join('\n')}

TASK:
Perform a PolicyMatchAI optimization analysis. Evaluate the group risk profile and recommend the optimal policy bundle.

Return a JSON object with exactly this structure:
{
  "risk_score": <number 0-100, lower = better risk>,
  "risk_tier": <"preferred" | "standard" | "elevated" | "high">,
  "risk_factors": [
    { "factor": "string", "impact": "positive"|"negative"|"neutral", "weight": <0-1>, "detail": "string" }
  ],
  "optimized_plan_name": "string (name of best medical plan from available list, or existing if optimal)",
  "enhancements": [
    { "plan_type": "string", "plan_name": "string", "rationale": "string", "cost_delta_pmpm": <number>, "value_gain": "string" }
  ],
  "cost_delta_pmpm": <net total cost change per member per month, negative = savings>,
  "value_score": <0-100 perceived value gain>,
  "recommendation_summary": "2-3 sentence executive summary",
  "optimization_rationale": "detailed paragraph explaining the optimization logic and why the group qualifies",
  "auto_bindable": <true if risk_score < 35 and mode is full_auto>,
  "broker_talking_points": ["string", "string", "string"]
}

Be specific, data-driven, and realistic. If the group has favorable risk indicators (young, low smoker rate, large group), recommend genuine enhancements. If risk is elevated, explain appropriate structuring.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          risk_score: { type: 'number' },
          risk_tier: { type: 'string' },
          risk_factors: { type: 'array', items: { type: 'object' } },
          optimized_plan_name: { type: 'string' },
          enhancements: { type: 'array', items: { type: 'object' } },
          cost_delta_pmpm: { type: 'number' },
          value_score: { type: 'number' },
          recommendation_summary: { type: 'string' },
          optimization_rationale: { type: 'string' },
          auto_bindable: { type: 'boolean' },
          broker_talking_points: { type: 'array', items: { type: 'string' } },
        },
      },
    });

    // Save result to entity
    const saved = await base44.asServiceRole.entities.PolicyMatchResult.create({
      case_id,
      scenario_id: scenario_id || '',
      member_id: 'group',
      member_name: 'Group Analysis',
      employer_name: benefitCase.employer_name,
      mode,
      trigger_stage,
      risk_score: result.risk_score,
      risk_tier: result.risk_tier,
      risk_factors: result.risk_factors || [],
      optimized_plan_name: result.optimized_plan_name || '',
      enhancements: result.enhancements || [],
      cost_delta_pmpm: result.cost_delta_pmpm || 0,
      value_score: result.value_score || 0,
      recommendation_summary: result.recommendation_summary || '',
      optimization_rationale: result.optimization_rationale || '',
      broker_talking_points: result.broker_talking_points || [],
      auto_bindable: result.auto_bindable || false,
      member_count: memberCount,
      avg_age: avgAge,
      status: 'optimized',
      base_monthly_cost: 0,
      optimized_monthly_cost: 0,
    });

    return Response.json({
      ...result,
      result_id: saved.id,
      employer_name: benefitCase.employer_name,
      member_count: memberCount,
      avg_age: avgAge,
    });
  } catch (error) {
    console.error('[function' + '] error:', error.message, error.stack);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});