// functions/processCensusImport.ts
// Runtime-orchestrated census import with GradientAI scoring

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

interface ImportProgress {
  step: 'validating' | 'scoring' | 'creating' | 'completed';
  total: number;
  processed: number;
  errors: number;
  high_risk_count: number;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const {
    case_id,
    census_version_id,
    members_data,
    mapping,
  } = await req.json();

  const logger = console;
  let progress: ImportProgress = {
    step: 'validating',
    total: members_data.length,
    processed: 0,
    errors: 0,
    high_risk_count: 0,
  };

  try {
    // Step 1: Validate members
    logger.log('census_import_validating', { case_id, member_count: members_data.length });
    
    const validatedMembers = [];
    for (const member of members_data) {
      const issues = validateMember(member);
      validatedMembers.push({
        ...member,
        validation_issues: issues,
        validation_status: issues.some(i => i.type === 'error') ? 'has_errors'
          : issues.some(i => i.type === 'warning') ? 'has_warnings' : 'valid',
      });
      progress.processed++;
    }

    progress.errors = validatedMembers.filter(m => m.validation_status === 'has_errors').length;
    logger.log('census_import_validation_complete', { errors: progress.errors });

    // Step 2: Score with GradientAI (batch)
    progress.step = 'scoring';
    progress.processed = 0;
    logger.log('census_import_scoring_started');

    const scoredMembers = [];
    const batchSize = 50;

    for (let i = 0; i < validatedMembers.length; i += batchSize) {
      const batch = validatedMembers.slice(i, i + batchSize);
      
      try {
        // Call GradientAI in batches
        const riskScores = await base44.integrations.Core.InvokeLLM({
          prompt: `Score risk for these employees. Return JSON with risk_score (0-100), risk_tier (preferred|standard|elevated|high), predicted_annual_claims.`,
          response_json_schema: {
            type: 'object',
            properties: {
              scores: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    member_id: { type: 'string' },
                    risk_score: { type: 'number' },
                    risk_tier: { type: 'string' },
                    predicted_annual_claims: { type: 'number' },
                  },
                },
              },
            },
          },
          file_urls: [], // Could attach census data as context
        });

        for (const member of batch) {
          const score = riskScores.scores?.find((s: any) => s.member_id === member.id) || {
            risk_score: 50,
            risk_tier: 'standard',
            predicted_annual_claims: 5000,
          };

          scoredMembers.push({
            ...member,
            gradient_ai_data: {
              risk_score: score.risk_score,
              risk_tier: score.risk_tier,
              predicted_annual_claims: score.predicted_annual_claims,
              analyzed_at: new Date().toISOString(),
            },
          });

          if (score.risk_score > 75) {
            progress.high_risk_count++;
          }
        }

        progress.processed += batch.length;
      } catch (error) {
        logger.error('gradient_ai_batch_failed', { batch_index: i, error: error.message });
        // Continue with non-scored members
        scoredMembers.push(...batch);
        progress.processed += batch.length;
      }
    }

    logger.log('census_import_scoring_complete', { high_risk_count: progress.high_risk_count });

    // Step 3: Create members in batches
    progress.step = 'creating';
    progress.processed = 0;

    const createdIds = [];
    for (let i = 0; i < scoredMembers.length; i += 50) {
      const batch = scoredMembers.slice(i, i + 50);
      
      const created = await base44.entities.CensusMember.bulkCreate(batch);
      createdIds.push(...created.map((m: any) => m.id));
      progress.processed += batch.length;
    }

    // Step 4: Update version status
    await base44.entities.CensusVersion.update(census_version_id, {
      status: progress.errors > 0 ? 'has_issues' : 'validated',
      validated_at: new Date().toISOString(),
    });

    // Step 5: Create exceptions for high-risk members
    for (const member of scoredMembers.filter(m => m.gradient_ai_data?.risk_score > 75)) {
      await base44.entities.ExceptionItem.create({
        case_id,
        employer_name: '', // Would come from case lookup
        category: 'census',
        severity: 'high',
        title: `High-risk member: ${member.first_name} ${member.last_name}`,
        description: `Risk score: ${member.gradient_ai_data.risk_score}, Predicted claims: $${member.gradient_ai_data.predicted_annual_claims}`,
        status: 'new',
      });
    }

    // Log audit event
    await base44.entities.ActivityLog.create({
      case_id,
      actor_email: user.email,
      action: 'CENSUS_IMPORT_COMPLETED',
      detail: `Imported ${createdIds.length} members, ${progress.high_risk_count} high-risk`,
      entity_type: 'CensusVersion',
      entity_id: census_version_id,
    });

    progress.step = 'completed';
    logger.log('census_import_completed', progress);

    return Response.json({
      success: true,
      progress,
      created_members: createdIds.length,
      high_risk_count: progress.high_risk_count,
    });
  } catch (error) {
    logger.error('census_import_failed', { error: error.message });
    return Response.json({
      success: false,
      error: error.message,
      progress,
    }, { status: 500 });
  }
});

function validateMember(member: any) {
  const issues = [];

  if (!member.first_name) issues.push({ field: 'first_name', type: 'error', message: 'Missing first name' });
  if (!member.last_name) issues.push({ field: 'last_name', type: 'error', message: 'Missing last name' });

  const dob = member.date_of_birth;
  if (dob) {
    const age = new Date().getFullYear() - new Date(dob).getFullYear();
    if (age < 16 || age > 100) {
      issues.push({ field: 'date_of_birth', type: 'warning', message: `Age ${age} seems unusual` });
    }
  }

  if (member.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email)) {
    issues.push({ field: 'email', type: 'warning', message: 'Invalid email format' });
  }

  if (member.annual_salary && (member.annual_salary < 0 || member.annual_salary > 1000000)) {
    issues.push({ field: 'annual_salary', type: 'warning', message: 'Salary outside expected range' });
  }

  return issues;
}