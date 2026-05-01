/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { canonicalCensusSchema } from '../lib/census/canonicalSchema.ts';

function generateId() {
  return crypto.randomUUID();
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function splitCsv(text) {
  const rows = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (current.trim() || current.includes(',')) rows.push(current);
      current = '';
      if (char === '\r' && next === '\n') i += 1;
    } else {
      current += char;
    }
  }
  if (current.trim() || current.includes(',')) rows.push(current);
  return rows.map(parseCsvLine);
}

function isEffectivelyBlank(row) {
  return row.every((cell) => !String(cell || '').trim());
}

function joinHeaderCell(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function detectVaultHeader(rows) {
  for (let i = 0; i < rows.length; i += 1) {
    const normalized = rows[i].map(joinHeaderCell);
    if (normalized.includes('Relationship') && normalized.includes('First Name') && normalized.includes('Last Name') && normalized.includes('DOB')) {
      return i;
    }
  }
  return -1;
}

function normalizeHeaderRow(row) {
  return row.map((cell) => joinHeaderCell(cell));
}

function buildHouseholdKey(employeeRow) {
  return [employeeRow.first_name, employeeRow.last_name, employeeRow.dob].filter(Boolean).join('|').toLowerCase();
}

function mapVaultRow(row, header, rowNumber, activeHouseholdKey) {
  const get = (name) => row[header.indexOf(name)] || '';
  const relationshipCode = String(get('Relationship') || '').trim().toUpperCase();
  const firstName = String(get('First Name') || '').trim();
  const lastName = String(get('Last Name') || '').trim();
  const record = {
    relationship_code: relationshipCode,
    employee_id: '',
    household_key: relationshipCode === 'EMP' ? buildHouseholdKey({ first_name: firstName, last_name: lastName, dob: get('DOB') }) : activeHouseholdKey,
    first_name: firstName,
    last_name: lastName,
    address: String(get('Address') || '').trim(),
    city: String(get('City') || '').trim(),
    state: String(get('State') || '').trim(),
    zip: String(get('ZIP') || '').trim(),
    gender: String(get('Gender') || '').trim(),
    dob: String(get('DOB') || '').trim(),
    coverage_type: String(get('Coverage Type (EE, ES, EC, EF, W)') || '').trim(),
    dependent_link_type: relationshipCode === 'EMP' ? 'employee' : relationshipCode === 'SPS' ? 'spouse' : relationshipCode === 'DEP' ? 'dependent' : '',
    source_row_number: rowNumber,
    source_payload: Object.fromEntries(header.map((key, index) => [key, row[index] || ''])),
  };
  return record;
}

function validateAgainstSchema(record) {
  const errors = [];
  Object.entries(canonicalCensusSchema).forEach(([field, config]) => {
    const value = record[field];
    if (config.required && !String(value || '').trim()) {
      errors.push({ field, code: 'REQUIRED_FIELD_MISSING', severity: 'critical', message: `${field} is required` });
      return;
    }
    if (!String(value || '').trim()) return;
    if (config.type === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(record[field])) {
      errors.push({ field, code: 'INVALID_DATE', severity: 'critical', message: 'Invalid date format' });
    }
    if (field === 'zip' && record.zip && !/^\d{5}(-\d{4})?$/.test(record.zip)) {
      errors.push({ field, code: 'INVALID_ZIP', severity: 'warning', message: 'ZIP format should be 5 or 9 digits' });
    }
    if (field === 'relationship_code' && !['EMP', 'SPS', 'DEP'].includes(record.relationship_code)) {
      errors.push({ field, code: 'INVALID_RELATIONSHIP', severity: 'critical', message: 'Relationship must be EMP, SPS, or DEP' });
    }
  });
  return errors;
}

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

    await base44.asServiceRole.entities.CensusImportAuditEvent.create({
      case_id: caseId,
      census_import_id,
      census_import_job_id: job.id,
      event_type: reprocess ? 'reprocess_started' : 'parse_start',
      actor_id: user.email,
      payload: { source_file_name },
    });

    await base44.asServiceRole.entities.CensusImportJob.update(job.id, {
      status: 'processing',
      last_processed_at: new Date().toISOString(),
    });

    const fileResponse = await fetch(source_file_url);
    if (!fileResponse.ok) {
      await base44.asServiceRole.entities.CensusImportJob.update(job.id, { status: 'failed', failure_reason: 'Stored source file could not be retrieved' });
      await base44.asServiceRole.entities.CensusImportAuditEvent.create({ case_id: caseId, census_import_id, census_import_job_id: job.id, event_type: 'process_failed', actor_id: user.email, payload: { reason: 'stored_file_missing' } });
      return Response.json({ error: 'Stored source file could not be retrieved' }, { status: 400 });
    }

    const csvText = await fileResponse.text();
    const csvRows = splitCsv(csvText);
    const headerIndex = detectVaultHeader(csvRows);
    if (headerIndex === -1) {
      await base44.asServiceRole.entities.CensusImportJob.update(job.id, { status: 'failed', failure_reason: 'Census header section not found' });
      await base44.asServiceRole.entities.CensusImportAuditEvent.create({ case_id: caseId, census_import_id, census_import_job_id: job.id, event_type: 'process_failed', actor_id: user.email, payload: { reason: 'header_not_found' } });
      return Response.json({ error: 'Census header section not found' }, { status: 400 });
    }

    const header = normalizeHeaderRow(csvRows[headerIndex]);
    const dataRows = csvRows.slice(headerIndex + 1);
    let activeHouseholdKey = '';
    const normalizedRecords = [];

    for (let index = 0; index < dataRows.length; index += 1) {
      const row = dataRows[index];
      const sourceRowNumber = headerIndex + index + 2;
      if (isEffectivelyBlank(row)) continue;
      const firstCell = String(row[0] || '').trim();
      const relationshipCell = String(row[1] || '').trim().toUpperCase();
      if (firstCell === 'CENSUS:' || firstCell.includes('GROUP INFORMATION')) continue;
      if (header.join('|') === normalizeHeaderRow(row).join('|')) continue;
      if (!['EMP', 'SPS', 'DEP'].includes(relationshipCell)) continue;

      const record = mapVaultRow(row, header, sourceRowNumber, activeHouseholdKey);
      const normalizePayloadResponse = await base44.functions.invoke('normalizeCensusSchema', { census_import_id, record });
      const normalizedRecord = normalizePayloadResponse.data.record;
      if (normalizedRecord.relationship_code === 'EMP') activeHouseholdKey = normalizedRecord.household_key;
      if (!normalizedRecord.household_key && activeHouseholdKey) normalizedRecord.household_key = activeHouseholdKey;
      normalizedRecords.push(normalizedRecord);
    }

    await base44.asServiceRole.entities.CensusImportAuditEvent.create({ case_id: caseId, census_import_id, census_import_job_id: job.id, event_type: 'normalize_complete', actor_id: user.email, payload: { row_count: normalizedRecords.length } });

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

    const parsedBlob = new Blob([JSON.stringify({ header, records: normalizedRecords }, null, 2)], { type: 'application/json' });
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

    await base44.asServiceRole.entities.CensusImportAuditEvent.create({
      case_id: caseId,
      census_import_id,
      census_import_job_id: job.id,
      event_type: reprocess ? 'reprocess_complete' : 'persist_complete',
      actor_id: user.email,
      payload: { status, census_version_id: persistResponse.data.census_version_id, summary: validation.summary },
    });

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