import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { census_version_id, case_id } = await req.json();

    if (!census_version_id || !case_id) {
      return Response.json({ error: 'census_version_id and case_id required' }, { status: 400 });
    }

    // Fetch case
    const benefitCase = await base44.entities.BenefitCase.filter({ id: case_id }, '', 1);
    if (!benefitCase.length) {
      return Response.json({ error: 'Case not found' }, { status: 404 });
    }

    const caseData = benefitCase[0];

    // Fetch high-risk members
    const members = await base44.entities.CensusMember.filter({
      census_version_id,
      "gradient_ai_data.risk_tier": "high"
    }, '', 10000);

    // Fetch elevated-risk members
    const elevatedMembers = await base44.entities.CensusMember.filter({
      census_version_id,
      "gradient_ai_data.risk_tier": "elevated"
    }, '', 10000);

    const createdExceptions = [];
    const openExceptions = await base44.entities.ExceptionItem.filter({
      case_id,
      entity_type: 'CensusMember'
    }, '', 10000);
    const existingMemberIds = new Set(
      openExceptions
        .filter((item) => item.status !== 'resolved')
        .map((item) => item.entity_id)
        .filter(Boolean)
    );

    const exceptionsToCreate = [];

    for (const member of members) {
      if (existingMemberIds.has(member.id)) continue;
      exceptionsToCreate.push({
        case_id,
        employer_name: caseData.employer_name,
        category: 'census',
        severity: 'high',
        status: 'new',
        title: `High Risk Member: ${member.first_name} ${member.last_name}`,
        description: `GradientAI risk score: ${member.gradient_ai_data.risk_score}. Predicted annual claims: $${Math.round(member.gradient_ai_data.predicted_annual_claims)}. Requires underwriting review.`,
        suggested_action: 'Conduct detailed underwriting review. Consider enhanced benefits or rate adjustments.',
        entity_type: 'CensusMember',
        entity_id: member.id,
        due_by: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    }

    for (const member of elevatedMembers) {
      if (existingMemberIds.has(member.id)) continue;
      exceptionsToCreate.push({
        case_id,
        employer_name: caseData.employer_name,
        category: 'census',
        severity: 'medium',
        status: 'new',
        title: `Elevated Risk Member: ${member.first_name} ${member.last_name}`,
        description: `GradientAI risk score: ${member.gradient_ai_data.risk_score}. Predicted annual claims: $${Math.round(member.gradient_ai_data.predicted_annual_claims)}. Monitor during enrollment.`,
        suggested_action: 'Review coverage recommendations. Consider wellness program enrollment.',
        entity_type: 'CensusMember',
        entity_id: member.id,
        due_by: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    }

    for (let index = 0; index < exceptionsToCreate.length; index += 25) {
      const batch = exceptionsToCreate.slice(index, index + 25);
      try {
        await base44.entities.ExceptionItem.bulkCreate(batch);
        createdExceptions.push(...batch);
      } catch (err) {
        console.error(`Error creating exception batch starting at ${index}:`, err.message);
      }
    }

    return Response.json({
      status: 'success',
      data: {
        high_risk_members: members.length,
        elevated_risk_members: elevatedMembers.length,
        exceptions_created: createdExceptions.length
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});