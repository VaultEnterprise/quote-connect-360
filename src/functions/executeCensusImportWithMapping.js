/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { extractRowsFromCsv, normalizeCell, normalizeDateValue, normalizeHeaderLabel, buildAuditEvent, buildValidationIssues, summarizeValidation, normalizeRelationship, normalizeCoverageType } from '../lib/census/importPipeline.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json();
    const { caseId, census_import_id, source_file_url, source_file_name, mapping = {}, header_row_index = 0, mapping_profile_id = null } = payload || {};
    if (!caseId) return Response.json({ error: 'caseId is required' }, { status: 400 });
    if (!census_import_id) return Response.json({ error: 'census_import_id is required' }, { status: 400 });
    if (!source_file_url) return Response.json({ error: 'source_file_url is required' }, { status: 400 });

    // Create import job record
    const job = await base44.asServiceRole.entities.CensusImportJob.create({
      case_id: caseId,
      census_import_id,
      status: 'processing',
      source_template: 'universal_mapping',
      source_file_name,
      source_file_url,
      created_by_email: user.email,
    });

    // Audit: import started
    await base44.asServiceRole.entities.CensusImportAuditEvent.create(buildAuditEvent({
      caseId,
      census_import_id,
      census_import_job_id: job.id,
      event_type: 'census_import_started',
      stage: 'file_intake',
      message: 'Census import started with mapping',
      extra: { actor_id: user.email, mapping_profile_id },
    }));

    // Fetch and parse file
    const fileResponse = await fetch(source_file_url);
    if (!fileResponse.ok) throw new Error('Could not fetch file');

    const csvText = await fileResponse.text();
    const rawRows = extractRowsFromCsv(csvText);
    const dataRows = rawRows.slice(header_row_index + 1).filter(row => row.some(cell => cell && cell.trim()));

    // Reverse mapping: system_field -> source_column_index
    const reverseMapping = {};
    Object.entries(mapping).forEach(([sourceIndex, systemField]) => {
      if (systemField && systemField !== 'ignore') {
        reverseMapping[systemField] = parseInt(sourceIndex, 10);
      }
    });

    // Transform rows using mapping
    const records = [];
    let activeHouseholdKey = '';
    let householdSequence = 0;
    const seenHouseholds = new Set();

    dataRows.forEach((row, rowIdx) => {
      const mapped = {};
      const sourcePayload = {};

      // Apply mapping
      rawRows[header_row_index].forEach((headerName, colIdx) => {
        sourcePayload[headerName] = row[colIdx] || '';
        
        Object.entries(reverseMapping).forEach(([field, mappedColIdx]) => {
          if (mappedColIdx === colIdx) {
            const value = row[colIdx] || '';
            if (field === 'dob' || field === 'hire_date' || field === 'termination_date') {
              mapped[field] = normalizeDateValue(value);
            } else if (field === 'relationship') {
              mapped[field] = normalizeRelationship(value);
            } else if (field === 'coverage_type') {
              mapped[field] = normalizeCoverageType(value);
            } else if (field === 'zip') {
              mapped[field] = normalizeCell(value);
            } else {
              mapped[field] = normalizeCell(value);
            }
          }
        });
      });

      // Store custom fields (unmapped but retained columns)
      const customFields = {};
      Object.entries(mapping).forEach(([sourceIndex, systemField]) => {
        if (systemField === 'custom' || (systemField && systemField.startsWith('custom_'))) {
          const colIdx = parseInt(sourceIndex, 10);
          const headerName = rawRows[header_row_index][colIdx];
          customFields[headerName] = row[colIdx] || '';
        }
      });

      // Build record
      const relationship = mapped.relationship || '';
      if (!['EMP', 'SPS', 'DEP'].includes(relationship)) return;

      const record = {
        relationship_code: relationship,
        first_name: mapped.first_name || '',
        last_name: mapped.last_name || '',
        dob: mapped.dob || '',
        address: mapped.address || '',
        city: mapped.city || '',
        state: mapped.state || '',
        zip: mapped.zip || '',
        gender: mapped.gender || '',
        hire_date: mapped.hire_date || '',
        termination_date: mapped.termination_date || '',
        employment_status: mapped.employment_status || '',
        department: mapped.department || '',
        class_code: mapped.class_code || '',
        coverage_type: mapped.coverage_type || '',
        source_row_number: header_row_index + rowIdx + 2,
        source_payload: sourcePayload,
        custom_fields: customFields,
      };

      // Household linking
      let householdKey = [record.first_name, record.last_name, record.dob].filter(Boolean).join('|').toLowerCase();
      if (relationship === 'EMP') {
        if (!householdKey) {
          householdSequence += 1;
          householdKey = `household_${householdSequence}`;
        }
        if (seenHouseholds.has(householdKey)) {
          householdSequence += 1;
          householdKey = `${householdKey}_${householdSequence}`;
        }
        seenHouseholds.add(householdKey);
        activeHouseholdKey = householdKey;
      }
      record.household_key = relationship === 'EMP' ? householdKey : activeHouseholdKey;
      record.employee_id = '';
      record.dependent_link_type = relationship === 'EMP' ? 'employee' : relationship === 'SPS' ? 'spouse' : 'dependent';

      records.push(record);
    });

    // Validate records
    let hasActiveEmployee = false;
    const seenMembers = new Set();
    const validationResults = records.map((record, index) => {
      const duplicateKey = [record.household_key, record.first_name, record.last_name, record.dob, record.relationship_code].join('|').toLowerCase();
      const errors = buildValidationIssues(record, {
        hasActiveEmployee,
        isDuplicateMember: seenMembers.has(duplicateKey),
      });
      if (record.relationship_code === 'EMP') hasActiveEmployee = true;
      seenMembers.add(duplicateKey);
      return {
        case_id: caseId,
        census_import_id,
        census_import_job_id: job.id,
        record_id: `${census_import_id}-${index + 1}`,
        row_number: record.source_row_number,
        errors,
        status: errors.some((item) => item.severity === 'critical') ? 'failed' : errors.some((item) => item.severity === 'warning') ? 'warning' : 'passed',
        critical_error_count: errors.filter((item) => item.severity === 'critical').length,
        warning_count: errors.filter((item) => item.severity === 'warning').length,
        informational_count: errors.filter((item) => item.severity === 'informational').length,
      };
    });

    const summary = summarizeValidation(records, validationResults);

    // Persist via existing function
    const persistResponse = await base44.functions.invoke('persistCensusVersion', {
      caseId,
      census_import_id,
      censusImportJobId: job.id,
      source_file_name,
      source_file_url,
      records,
      validation_results: validationResults,
      summary,
    });

    // Save snapshot files
    const parsedBlob = new Blob([JSON.stringify({ mapping, records }, null, 2)], { type: 'application/json' });
    const parsedUpload = await base44.integrations.Core.UploadFile({ file: new File([parsedBlob], `${census_import_id}-mapped.json`, { type: 'application/json' }) });
    const validationBlob = new Blob([JSON.stringify(validationResults, null, 2)], { type: 'application/json' });
    const validationUpload = await base44.integrations.Core.UploadFile({ file: new File([validationBlob], `${census_import_id}-validation.json`, { type: 'application/json' }) });

    const status = summary.critical_error_count > 0 ? 'failed' : 'completed';
    await base44.asServiceRole.entities.CensusImportJob.update(job.id, {
      status,
      parsed_snapshot_url: parsedUpload.file_url,
      normalized_snapshot_url: validationUpload.file_url,
      row_count: summary.row_count,
      employee_count: summary.employee_count,
      dependent_count: summary.dependent_count,
      household_count: summary.household_count,
      critical_error_count: summary.critical_error_count,
      warning_count: summary.warning_count,
      informational_count: summary.informational_count,
      validation_summary: summary,
      last_processed_at: new Date().toISOString(),
    });

    // Audit: import completed
    await base44.asServiceRole.entities.CensusImportAuditEvent.create(buildAuditEvent({
      caseId,
      census_import_id,
      census_import_job_id: job.id,
      event_type: 'census_import_completed',
      stage: 'persistence',
      message: `Census import completed with ${summary.employee_count} employees and ${summary.dependent_count} dependents`,
      extra: { summary, status, census_version_id: persistResponse.data.census_version_id },
    }));

    return Response.json({
      census_import_id,
      census_import_job_id: job.id,
      status,
      summary,
      census_version_id: persistResponse.data.census_version_id,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});