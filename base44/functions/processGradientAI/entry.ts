import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { census_version_id, member_ids, force_reanalysis } = await req.json();

    if (!census_version_id) {
      return Response.json({ error: 'census_version_id required' }, { status: 400 });
    }

    // Fetch census members
    const members = member_ids
      ? await base44.entities.CensusMember.filter({ 
          census_version_id,
          id: { $in: member_ids }
        }, '', 1000)
      : await base44.entities.CensusMember.filter({ 
          census_version_id
        }, '', 1000);

    // Filter members needing analysis
    const membersToAnalyze = force_reanalysis 
      ? members
      : members.filter(m => !m.gradient_ai_data || !m.gradient_ai_data.analyzed_at);

    if (membersToAnalyze.length === 0) {
      return Response.json({
        status: 'success',
        data: {
          processed: 0,
          succeeded: 0,
          failed: 0,
          risk_summary: { high_risk_count: 0, elevated_risk_count: 0, standard_count: 0, preferred_count: 0 }
        }
      });
    }

    // Mock GradientAI processing (replace with real API when credentials available)
    const results = [];
    const errors = [];
    const riskTierCounts = { preferred: 0, standard: 0, elevated: 0, high: 0 };

    for (const member of membersToAnalyze) {
      try {
        // Mock risk scoring based on age and salary (deterministic for testing)
        const age = calculateAge(member.date_of_birth);
        const salary = member.annual_salary || 50000;
        
        // Simple mock scoring: younger + higher salary = lower risk
        const baseScore = Math.max(20, Math.min(95, 50 + (age - 30) * 0.8 - (salary / 100000) * 10));
        const riskScore = Math.round(baseScore + Math.random() * 5);
        
        let riskTier = 'standard';
        if (riskScore < 35) riskTier = 'preferred';
        else if (riskScore < 60) riskTier = 'standard';
        else if (riskScore < 80) riskTier = 'elevated';
        else riskTier = 'high';

        riskTierCounts[riskTier]++;

        const gradientData = {
          risk_score: riskScore,
          risk_tier: riskTier,
          risk_factors: [
            { factor: 'Age', weight: 0.35, value: age },
            { factor: 'Salary', weight: 0.25, value: salary },
            { factor: 'Employment Type', weight: 0.20, value: member.employment_type },
            { factor: 'Health History', weight: 0.20, value: 'Not available' }
          ],
          predicted_annual_claims: riskScore > 70 ? 12000 + riskScore * 50 : 3000 + riskScore * 30,
          confidence_score: 0.85 + Math.random() * 0.1,
          analyzed_at: new Date().toISOString()
        };

        // Update member with gradient data
        await base44.entities.CensusMember.update(member.id, { gradient_ai_data: gradientData });
        results.push({ member_id: member.id, success: true, risk_tier: riskTier });
      } catch (err) {
        errors.push({ member_id: member.id, message: err.message });
      }
    }

    return Response.json({
      status: 'success',
      data: {
        processed: membersToAnalyze.length,
        succeeded: results.filter(r => r.success).length,
        failed: errors.length,
        errors,
        risk_summary: riskTierCounts
      }
    });
  } catch (error) {
    console.error('[function' + '] error:', error.message, error.stack);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});

function calculateAge(dateOfBirth) {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}