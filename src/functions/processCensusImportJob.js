/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import {
  buildAuditEvent,
  detectFileType,
  extractGroupMetadata,
  extractRowsFromCsv,
  locateCensusSection,
  normalizeCensusHeaders,
  parseHouseholds,
} from '../lib/census/importPipeline.js';


Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json();
    const { caseId, census_import_id, source_file_url, source_file_name, reprocess = false, censusImportJobId } = payload || {};
    if (!census_import_id) return Response.json({ error: 'census_import_id is required' }, { status: 400 });
    if (!caseId) return Response.json({ error: 'caseId is required' }, { status: 400 });
    if (!source_file_url) return Response.json({ error: 'source_file_url is required' }, { status: 400 });

    const jobs = censusImportJobId
      ? await base44.asServiceRole.entities.CensusImportJob.filter({ id: censusImportJobId }, '-created_date', 1)
      : await base44.asServiceRole.entities.CensusImportJob.filter({ census_import_id }, '-created_date', 1);
    const job = jobs[0];
    if (!job) return Response.json({ error: 'Census import job not found' }, { status: 404 });

    await base44.asServiceRole.entities.CensusImportAuditEvent.create(buildAuditEvent({
      caseId,
      census_import_id,
      census_import_job_id: job.id,
      event_type: reprocess ? 'reprocess_started' : 'parse_start',
      stage: 'file_intake',
      message: reprocess ? 'Reprocess started' : 'Parse started',
      source_file_name,
      extra: { actor_id: user.email },
    }));

    await base44.asServiceRole.entities.CensusImportJob.update(job.id, {
      status: 'processing',
      last_processed_at: new Date().toISOString(),
    });

    const fileResponse = await fetch(source_file_url);
    if (!fileResponse.ok) {
      await base44.asServiceRole.entities.CensusImportJob.update(job.id, { status: 'failed', failure_reason: 'Stored source file could not be retrieved' });
      await base44.asServiceRole.entities.CensusImportAuditEvent.create(buildAuditEvent({
        caseId,
        census_import_id,
        census_import_job_id: job.id,
        event_type: 'process_failed',
        stage: 'file_intake',
        message: 'Stored source file could not be retrieved',
        severity: 'critical',
        source_file_name,
        recommended_fix: 'Verify the stored file URL and re-upload the source file if needed.',
      }));
      return Response.json({ error: 'Stored source file could not be retrieved' }, { status: 400 });
    }

    const fileType = detectFileType({ source_file_name, content_type: fileResponse.headers.get('content-type') || '' });
    let rawRows = [];
    if (fileType === 'xlsx') {
      await base44.asServiceRole.entities.CensusImportJob.update(job.id, { status: 'failed', failure_reason: 'Live XLSX workbook extraction is not yet available in this runtime.' });
      await base44.asServiceRole.entities.CensusImportAuditEvent.create(buildAuditEvent({
        caseId,
        census_import_id,
        census_import_job_id: job.id,
        event_type: 'process_failed',
        stage: 'file_decode',
        message: 'XLSX workbook extraction is not available in the live runtime path',
        severity: 'critical',
        source_file_name,
        recommended_fix: 'Enable workbook binary extraction before certifying XLSX imports.',
      }));
      return Response.json({ error: 'XLSX workbook extraction is not available in the live runtime path' }, { status: 400 });
    }

    const csvText = await fileResponse.text();
    rawRows = extractRowsFromCsv(csvText);
    const section = locateCensusSection(rawRows);
    if (section.headerIndex === -1) {
      await base44.asServiceRole.entities.CensusImportJob.update(job.id, { status: 'failed', failure_reason: 'Census header section not found' });
      await base44.asServiceRole.entities.CensusImportAuditEvent.create(buildAuditEvent({
        caseId,
        census_import_id,
        census_import_job_id: job.id,
        event_type: 'process_failed',
        stage: 'section_detect',
        message: 'Census header section not found',
        severity: 'critical',
        source_file_name,
        recommended_fix: 'Confirm the file contains Relationship, First Name, Last Name, and DOB columns.',
      }));
      return Response.json({ error: 'Census header section not found' }, { status: 400 });
    }

    const groupMetadata = extractGroupMetadata(rawRows.slice(0, section.headerIndex));
    const header = normalizeCensusHeaders(rawRows[section.headerIndex]);
    const normalizedRecords = parseHouseholds(rawRows.slice(section.headerIndex + 1), header, section.headerIndex);

    await base44.asServiceRole.entities.CensusImportAuditEvent.create(buildAuditEvent({
      caseId,
      census_import_id,
      census_import_job_id: job.id,
      event_type: 'normalize_complete',
      stage: 'household_parse',
      message: 'Household parsing complete',
      source_file_name,
      extra: { row_count: normalizedRecords.length, group_metadata: groupMetadata },
    }));

    const validationResponse = await base44.functions.invoke('validateCensusRecords', { caseId, census_import_id, censusImportJobId: job.id, records: normalizedRecords });
    const validation = validationResponse.data;
    const persistResponse = await base44.functions.invoke('persistCensusVersion', {
      caseId,
      census_import_id,
      censusImportJobId: job.id,
      source_file_name,
      source_file_url,
      records: normalizedRecords,
      validation_results: validation.results,
      summary: validation.summary,
    });

    const parsedBlob = new Blob([JSON.stringify({ header, groupMetadata, records: normalizedRecords }, null, 2)], { type: 'application/json' });
    const parsedUpload = await base44.integrations.Core.UploadFile({ file: new File([parsedBlob], `${census_import_id}-parsed.json`, { type: 'application/json' }) });
    const normalizedBlob = new Blob([JSON.stringify(validation.results, null, 2)], { type: 'application/json' });
    const normalizedUpload = await base44.integrations.Core.UploadFile({ file: new File([normalizedBlob], `${census_import_id}-validation.json`, { type: 'application/json' }) });

    const status = validation.summary.critical_error_count > 0 ? 'failed' : reprocess ? 'reprocessed' : 'completed';
    await base44.asServiceRole.entities.CensusImportJob.update(job.id, {
      status,
      parsed_snapshot_url: parsedUpload.file_url,
      normalized_snapshot_url: normalizedUpload.file_url,
      row_count: validation.summary.row_count,
      employee_count: validation.summary.employee_count,
      dependent_count: validation.summary.dependent_count,
      household_count: validation.summary.household_count,
      critical_error_count: validation.summary.critical_error_count,
      warning_count: validation.summary.warning_count,
      informational_count: validation.summary.informational_count,
      validation_summary: validation.summary,
      last_processed_at: new Date().toISOString(),
      last_reprocessed_at: reprocess ? new Date().toISOString() : job.last_reprocessed_at,
    });

    await base44.asServiceRole.entities.CensusImportAuditEvent.create(buildAuditEvent({
      caseId,
      census_import_id,
      census_import_job_id: job.id,
      event_type: reprocess ? 'reprocess_complete' : 'persist_complete',
      stage: 'persistence',
      message: reprocess ? 'Reprocess completed' : 'Persistence completed',
      source_file_name,
      extra: { status, census_version_id: persistResponse.data.census_version_id, summary: validation.summary },
    }));

    return Response.json({
      census_import_id,
      census_import_job_id: job.id,
      status,
      summary: validation.summary,
      census_version_id: persistResponse.data.census_version_id,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});