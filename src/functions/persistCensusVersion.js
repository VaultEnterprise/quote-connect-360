/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { determineCaseImportStatus } from '../lib/census/importPipeline.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json();
    const { caseId, census_import_id, censusImportJobId, source_file_name, source_file_url, records = [], validation_results = [], summary = {} } = payload || {};
    if (!census_import_id) return Response.json({ error: 'census_import_id is required' }, { status: 400 });
    if (!caseId) return Response.json({ error: 'caseId is required' }, { status: 400 });

    const existingVersions = await base44.asServiceRole.entities.CensusVersion.filter({ case_id: caseId }, '-version_number', 200);
    const caseStatus = determineCaseImportStatus(summary);
    const version = await base44.asServiceRole.entities.CensusVersion.create({
      case_id: caseId,
      census_import_id,
      version_number: existingVersions.length + 1,
      file_url: source_file_url,
      file_name: source_file_name,
      status: caseStatus.version_status,
      total_employees: summary.employee_count,
      total_dependents: summary.dependent_count,
      validation_errors: summary.critical_error_count,
      validation_warnings: summary.warning_count,
      notes: `Import job ${censusImportJobId}`,
    });

    const members = records.map((record, index) => {
      const validation = validation_results[index] || { status: 'passed', errors: [] };
      return {
        census_import_id,
        census_version_id: version.id,
        case_id: caseId,
        employee_id: record.employee_id || undefined,
        first_name: record.first_name,
        last_name: record.last_name,
        date_of_birth: record.dob,
        gender: record.gender || undefined,
        address: record.address || undefined,
        city: record.city || undefined,
        state: record.state || undefined,
        zip: record.zip || undefined,
        coverage_tier: record.coverage_type === 'EF' ? 'family' : record.coverage_type === 'ES' ? 'employee_spouse' : record.coverage_type === 'EC' ? 'employee_children' : 'employee_only',
        dependent_count: record.relationship_code === 'EMP' ? records.filter((item) => item.household_key === record.household_key && item.relationship_code !== 'EMP').length : 0,
        validation_status: validation.status === 'failed' ? 'has_errors' : validation.status === 'warning' ? 'has_warnings' : 'valid',
        validation_issues: validation.errors,
      };
    });

    for (let index = 0; index < members.length; index += 50) {
      await base44.asServiceRole.entities.CensusMember.bulkCreate(members.slice(index, index + 50));
    }

    for (let index = 0; index < validation_results.length; index += 50) {
      const chunk = validation_results.slice(index, index + 50).map((item) => ({ ...item, census_version_id: version.id }));
      await base44.asServiceRole.entities.CensusValidationResult.bulkCreate(chunk);
    }

    await base44.asServiceRole.entities.BenefitCase.update(caseId, {
      census_import_id,
      census_status: caseStatus.census_status,
      stage: caseStatus.stage,
      last_activity_date: new Date().toISOString(),
    });

    return Response.json({ census_import_id, census_version_id: version.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});