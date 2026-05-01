/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { buildValidationIssues, summarizeValidation } from '../lib/census/importPipeline.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json();
    const { caseId, census_import_id, censusImportJobId, records = [] } = payload || {};
    if (!census_import_id) return Response.json({ error: 'census_import_id is required' }, { status: 400 });
    if (!caseId) return Response.json({ error: 'caseId is required' }, { status: 400 });

    const results = records.map((record, index) => {
      const errors = buildValidationIssues(record);
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

    const summary = summarizeValidation(records, results);

    return Response.json({ census_import_id, results, summary });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});