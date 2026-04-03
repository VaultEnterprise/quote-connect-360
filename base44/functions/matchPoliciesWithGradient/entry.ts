import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { scenario_id, case_id } = await req.json();

    if (!scenario_id || !case_id) {
      return Response.json({ error: 'scenario_id and case_id required' }, { status: 400 });
    }

    // Fetch scenario and census
    const scenario = await base44.entities.QuoteScenario.filter({ id: scenario_id }, '', 1);
    if (!scenario.length) {
      return Response.json({ error: 'Scenario not found' }, { status: 404 });
    }

    const censusVersion = await base44.entities.CensusVersion.filter({ id: scenario[0].census_version_id }, '', 1);
    const members = await base44.entities.CensusMember.filter({ census_version_id: censusVersion[0].id }, '', 10000);

    // Fetch plan data
    const plans = await base44.entities.BenefitPlan.filter({ status: 'active' }, '', 100);

    // Create policy matches enriched with GradientAI data
    const matches = [];
    let successCount = 0;

    for (const member of members) {
      try {
        const gradientData = member.gradient_ai_data || { risk_tier: 'standard', risk_score: 50 };
        
        // Select plan based on risk tier
        let selectedPlan = plans[0];
        if (gradientData.risk_tier === 'high') {
          selectedPlan = plans.find(p => p.network_type === 'HMO') || plans[0];
        } else if (gradientData.risk_tier === 'elevated') {
          selectedPlan = plans.find(p => p.network_type === 'PPO') || plans[0];
        }

        // Calculate risk-adjusted cost
        const baseCost = 500 + (member.annual_salary ? member.annual_salary / 2400 : 300);
        const riskMultiplier = 0.8 + (gradientData.risk_score / 100) * 0.4; // 0.8x to 1.2x
        const riskAdjustedCost = Math.round(baseCost * riskMultiplier);

        const match = {
          case_id,
          scenario_id,
          member_id: member.id,
          member_name: `${member.first_name} ${member.last_name}`,
          employer_name: '', // Would be fetched from case
          risk_score: gradientData.risk_score || 50,
          risk_tier: gradientData.risk_tier || 'standard',
          gradient_ai_risk_tier: gradientData.risk_tier,
          gradient_ai_predicted_claims: gradientData.predicted_annual_claims,
          base_plan_id: selectedPlan.id,
          base_plan_name: selectedPlan.plan_name,
          optimized_plan_id: selectedPlan.id,
          optimized_plan_name: selectedPlan.plan_name,
          base_monthly_cost: baseCost,
          optimized_monthly_cost: riskAdjustedCost,
          risk_adjusted_monthly_cost: riskAdjustedCost,
          cost_delta_pmpm: riskAdjustedCost - baseCost,
          value_score: Math.max(50, 100 - (riskAdjustedCost - baseCost) * 2),
          recommendation_summary: `${gradientData.risk_tier.charAt(0).toUpperCase() + gradientData.risk_tier.slice(1)} risk profile recommends ${selectedPlan.plan_name}`,
          broker_talking_points: generateTalkingPoints(gradientData),
          status: 'optimized'
        };

        // Create or update match result
        const existing = await base44.entities.PolicyMatchResult.filter({
          scenario_id,
          member_id: member.id
        }, '', 1);

        if (existing.length) {
          await base44.entities.PolicyMatchResult.update(existing[0].id, match);
        } else {
          await base44.entities.PolicyMatchResult.create(match);
        }

        matches.push(match);
        successCount++;
      } catch (err) {
        console.error(`Error matching policy for member ${member.id}:`, err.message);
      }
    }

    return Response.json({
      status: 'success',
      data: {
        total: members.length,
        succeeded: successCount,
        failed: members.length - successCount,
        matches_created: matches.length
      }
    });
  } catch (error) {
    console.error('[function' + '] error:', error.message, error.stack);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});

function generateTalkingPoints(gradientData) {
  const points = [];
  
  if (gradientData.risk_tier === 'preferred') {
    points.push("Excellent health profile - eligible for preferred rates");
    points.push("Low predicted claims - strong for cost optimization");
  } else if (gradientData.risk_tier === 'standard') {
    points.push("Standard risk profile with competitive pricing");
    points.push("Good candidate for core plan selection");
  } else if (gradientData.risk_tier === 'elevated') {
    points.push("Enhanced coverage recommended given health factors");
    points.push("Consider supplemental benefits for better protection");
  } else {
    points.push("Comprehensive coverage strongly recommended");
    points.push("Priority for preventive care and wellness programs");
  }
  
  return points;
}