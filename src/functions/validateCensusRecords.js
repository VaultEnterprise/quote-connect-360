/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function buildError(field, code, severity, message) {
  return { field, code, severity, message };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json();
    const { caseId, census_import_id, censusImportJobId, records = [] } = payload || {};
    if (!census_import_id) return Response.json({ error: 'census_import_id is required' }, { status: 400 });
    if (!caseId) return Response.json({ error: 'caseId is required' }, { status: 400 });

    const householdSeen = new Set();
    let employee_count = 0;
    let dependent_count = 0;
    let critical_error_count = 0;
    let warning_count = 0;
    let informational_count = 0;

    const results = records.map((record, index) => {
      const errors = [];
      if (!record.relationship_code) errors.push(buildError('relationship_code', 'REQUIRED_FIELD_MISSING', 'critical', 'Relationship code is required'));
      if (!record.first_name) errors.push(buildError('first_name', 'REQUIRED_FIELD_MISSING', 'critical', 'First name is required'));
      if (!record.last_name) errors.push(buildError('last_name', 'REQUIRED_FIELD_MISSING', 'critical', 'Last name is required'));
      if (!record.dob || !/^\d{4}-\d{2}-\d{2}$/.test(record.dob)) errors.push(buildError('dob', 'INVALID_DATE', 'critical', 'DOB must normalize to YYYY-MM-DD'));
      if (record.zip && !/^\d{5}(-\d{4})?$/.test(record.zip)) errors.push(buildError('zip', 'INVALID_ZIP', 'warning', 'ZIP should be 5 or 9 digits'));
      if (record.relationship_code !== 'EMP' && !record.household_key) errors.push(buildError('household_key', 'MISSING_EMPLOYEE_LINK', 'critical', 'Dependent/spouse must link to an employee household'));
      if (record.relationship_code === 'EMP') {
        employee_count += 1;
        householdSeen.add(record.household_key);
      } else {
        dependent_count += 1;
      }
      if (record.coverage_type === 'W') {
        errors.push(buildError('coverage_type', 'WAIVED_COVERAGE', 'informational', 'Coverage is waived'));
      }
      critical_error_count += errors.filter((item) => item.severity === 'critical').length;
      warning_count += errors.filter((item) => item.severity === 'warning').length;
      informational_count += errors.filter((item) => item.severity === 'informational').length;
      return {
        case_id: caseId,
        census_import_id,
        census_import_job_id: censusImportJobId,
        record_id: `${census_import_id}-${index + 1}`,
        row_number: record.source_row_number,
        errors,
        status: errors.some((item) => item.severity === 'critical') ? 'failed' : errors.some((item) => item.severity === 'warning') ? 'warning' : 'passed',
        critical_error_count: errors.filter((item) => item.severity === 'critical').length,
        warning_count: errors.filter((item) => item.severity === 'warning').length,
        informational_count: errors.filter((item) => item.severity === 'informational').length,
      };
    });

    const summary = {
      row_count: records.length,
      employee_count,
      dependent_count,
      household_count: householdSeen.size,
      critical_error_count,
      warning_count,
      informational_count,
    };

    return Response.json({ census_import_id, results, summary });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});