import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

function mapCoverageTier(value) {
  const raw = String(value || '').toLowerCase();
  if (raw === 'family') return 'family';
  if (raw === 'employee_spouse') return 'employee_spouse';
  if (raw === 'employee_children') return 'employee_children';
  return raw ? 'employee_only' : undefined;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    if (!body.importSessionId || !body.caseId || !body.importMode) {
      return Response.json({ error: 'importSessionId, caseId, and importMode are required' }, { status: 400 });
    }

    const session = await base44.entities.ImportSession.get(body.importSessionId);
    const stagedRows = [];
    let stagedRowOffset = 0;
    while (true) {
      const batch = await base44.asServiceRole.entities.ImportRowStaging.filter({ import_session_id: body.importSessionId }, 'source_row_number', 5000, stagedRowOffset);
      stagedRows.push(...batch);
      if (batch.length < 5000) break;
      stagedRowOffset += 5000;
    }

    const mappings = [];
    let mappingOffset = 0;
    while (true) {
      const batch = await base44.asServiceRole.entities.ImportFieldMapping.filter({ import_session_id: body.importSessionId }, 'created_date', 200, mappingOffset);
      mappings.push(...batch);
      if (batch.length < 200) break;
      mappingOffset += 200;
    }

    const hasErrors = stagedRows.some((row) => row.validation_status === 'error');
    if (body.importMode === 'block_on_any_error' && hasErrors) {
      await base44.entities.ImportSession.update(body.importSessionId, { commit_status: 'blocked' });
      return Response.json({ error: 'Block import if any error exists mode is enabled.', blocked: true }, { status: 400 });
    }

    const rowsToCommit = stagedRows.filter((row) => {
      if (body.importMode === 'validate_only') return false;
      if (body.importMode === 'import_valid_rows_only') return row.validation_status === 'valid' || row.validation_status === 'warning';
      if (body.importMode === 'import_all_and_flag_errors') return true;
      return row.validation_status !== 'error';
    });

    const currentVersions = await base44.entities.CensusVersion.filter({ case_id: body.caseId }, '-created_date', 200);
    const version = await base44.entities.CensusVersion.create({
      case_id: body.caseId,
      version_number: (currentVersions?.length || 0) + 1,
      file_name: session.source_file_name,
      status: hasErrors ? 'has_issues' : 'validated',
      total_employees: rowsToCommit.length,
      eligible_employees: rowsToCommit.length,
      validation_errors: stagedRows.reduce((sum, row) => sum + (row.error_count || 0), 0),
      validation_warnings: stagedRows.reduce((sum, row) => sum + (row.warning_count || 0), 0),
      uploaded_by: user.email,
      validated_at: new Date().toISOString(),
      notes: JSON.stringify({ import_session_id: body.importSessionId, import_mode: body.importMode, required_fields: mappings.filter((m) => m.is_required_for_run).map((m) => m.application_field_code) }),
    });

    for (const row of rowsToCommit) {
      const payload = row.normalized_row_json || {};
      const member = await base44.entities.CensusMember.create({
        census_version_id: version.id,
        case_id: body.caseId,
        employee_id: payload.employee_id || undefined,
        first_name: payload.first_name || 'Unknown',
        last_name: payload.last_name || 'Unknown',
        date_of_birth: payload.date_of_birth || undefined,
        gender: payload.gender || undefined,
        email: payload.email || undefined,
        phone: payload.phone || undefined,
        address: payload.address || undefined,
        city: payload.city || undefined,
        state: payload.state || undefined,
        zip: payload.zip || undefined,
        hire_date: payload.hire_date || undefined,
        employment_status: payload.employment_status || 'active',
        employment_type: payload.employment_type || 'full_time',
        hours_per_week: payload.hours_per_week || undefined,
        annual_salary: payload.annual_salary || undefined,
        class_code: payload.class_code || undefined,
        dependent_count: payload.dependent_count || 0,
        coverage_tier: mapCoverageTier(payload.coverage_tier),
        is_eligible: true,
        validation_status: row.validation_status === 'error' ? 'has_errors' : row.validation_status === 'warning' ? 'has_warnings' : 'valid',
        validation_issues: [...(row.errors_json || []), ...(row.warnings_json || [])],
      });

      await base44.asServiceRole.entities.ImportRowStaging.update(row.id, {
        commit_status: 'committed',
        committed_entity_id: member.id,
      });
    }

    await base44.entities.BenefitCase.update(body.caseId, {
      census_status: hasErrors ? 'issues_found' : 'validated',
      stage: hasErrors ? 'census_in_progress' : 'census_validated',
      employee_count: rowsToCommit.length,
      last_activity_date: new Date().toISOString(),
    });

    await base44.entities.ImportSession.update(body.importSessionId, {
      commit_status: hasErrors && body.importMode === 'import_all_and_flag_errors' ? 'partially_committed' : 'committed'
    });

    return Response.json({
      import_session_id: body.importSessionId,
      census_version_id: version.id,
      committed_rows: rowsToCommit.length,
      skipped_rows: stagedRows.length - rowsToCommit.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});