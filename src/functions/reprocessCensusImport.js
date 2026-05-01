/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json();
    const { census_import_id } = payload || {};
    if (!census_import_id) return Response.json({ error: 'census_import_id is required' }, { status: 400 });

    const jobs = await base44.asServiceRole.entities.CensusImportJob.filter({ census_import_id }, '-created_date', 1);
    const job = jobs[0];
    if (!job) return Response.json({ error: 'Census import job not found' }, { status: 404 });

    const response = await base44.functions.invoke('processCensusImportJob', {
      caseId: job.case_id,
      census_import_id,
      source_file_url: job.source_file_url,
      source_file_name: job.source_file_name,
      censusImportJobId: job.id,
      reprocess: true,
    });

    return Response.json(response.data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});