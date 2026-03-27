import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const FIELD_RULES = {
  employee_id: { hardRequired: true },
  first_name: { hardRequired: true },
  last_name: { hardRequired: true },
  zip: { type: 'zip' },
  date_of_birth: { type: 'date' },
  hire_date: { type: 'date' },
  coverage_tier: { type: 'tier' },
  state: { type: 'state' },
  dependent_count: { type: 'number' },
  annual_salary: { type: 'number' },
  hours_per_week: { type: 'number' },
};
const VALID_TIERS = ['employee_only', 'employee_spouse', 'employee_children', 'family', 'ee', 'es', 'ec', 'fam'];
const VALID_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

function normalizeDate(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
}

function normalizeTier(value) {
  const raw = String(value ?? '').trim().toLowerCase();
  if (!raw) return '';
  if (raw.includes('family') || raw === 'fam') return 'family';
  if (raw.includes('spouse') || raw === 'es') return 'employee_spouse';
  if (raw.includes('child') || raw === 'ec') return 'employee_children';
  return 'employee_only';
}

function normalizeState(value) {
  return String(value ?? '').trim().toUpperCase();
}

function buildError({ rowNumber, sourceColumn, applicationField, rawValue, normalizedValue, errorCode, errorMessage, severity = 'error', suggestedFix }) {
  return { row_number: rowNumber, source_column: sourceColumn, application_field: applicationField, raw_value: rawValue, normalized_value: normalizedValue, error_code: errorCode, error_message: errorMessage, severity, suggested_fix: suggestedFix };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    if (!body.importSessionId || !Array.isArray(body.mappings) || !Array.isArray(body.previewRows)) {
      return Response.json({ error: 'importSessionId, mappings, and previewRows are required' }, { status: 400 });
    }

    const requiredMappings = body.mappings.filter((mapping) => mapping.is_required_for_run);
    const unmappedRequired = requiredMappings.filter((mapping) => !mapping.source_column_name && !mapping.default_value);
    if (unmappedRequired.length > 0) {
      return Response.json({
        error: 'UNMAPPED_REQUIRED_FIELD',
        missing_required_fields: unmappedRequired.map((mapping) => ({
          field_name: mapping.application_field_label,
          application_field_code: mapping.application_field_code,
          why_required: mapping.required_reason || 'Required for this import run',
          options: ['map a source column', 'enter a default value', 'mark optional if allowed', 'cancel import']
        }))
      }, { status: 400 });
    }

    const existingRows = [];
    let existingOffset = 0;
    while (true) {
      const batch = await base44.asServiceRole.entities.ImportRowStaging.filter({ import_session_id: body.importSessionId }, 'source_row_number', 5000, existingOffset);
      existingRows.push(...batch);
      if (batch.length < 5000) break;
      existingOffset += 5000;
    }
    if (existingRows.length) {
      await Promise.all(existingRows.map((row) => base44.asServiceRole.entities.ImportRowStaging.delete(row.id)));
    }

    const stagedRows = [];
    const validationIssues = [];
    const seenEmployeeIds = new Set();

    for (const previewRow of body.previewRows) {
      const normalizedRow = {};
      const errors = [];
      const warnings = [];

      for (const mapping of body.mappings) {
        const rawValue = mapping.source_column_name ? previewRow.raw_row_json?.[mapping.source_column_name] : mapping.default_value;
        let normalizedValue = rawValue;
        const fieldRule = FIELD_RULES[mapping.application_field_code] || {};

        if (fieldRule.type === 'date') normalizedValue = normalizeDate(rawValue);
        if (fieldRule.type === 'tier') normalizedValue = normalizeTier(rawValue);
        if (fieldRule.type === 'state') normalizedValue = normalizeState(rawValue);
        if (fieldRule.type === 'number') normalizedValue = rawValue === '' || rawValue == null ? '' : Number(String(rawValue).replace(/[$,]/g, ''));

        normalizedRow[mapping.application_field_code] = normalizedValue;

        if (mapping.is_required_for_run && !String(normalizedValue ?? '').trim()) {
          errors.push(buildError({
            rowNumber: previewRow.row_number,
            sourceColumn: mapping.source_column_name || '',
            applicationField: mapping.application_field_code,
            rawValue,
            normalizedValue,
            errorCode: 'MISSING_REQUIRED_FIELD',
            errorMessage: `${mapping.application_field_label} is required for this import run.`,
            suggestedFix: 'Map a source column or provide a default value.'
          }));
        }

        if (fieldRule.type === 'zip' && normalizedValue && !/^\d{5}(-\d{4})?$/.test(String(normalizedValue))) {
          errors.push(buildError({ rowNumber: previewRow.row_number, sourceColumn: mapping.source_column_name || '', applicationField: mapping.application_field_code, rawValue, normalizedValue, errorCode: 'INVALID_ZIP', errorMessage: 'ZIP must be 5 digits or ZIP+4.', suggestedFix: 'Use a valid ZIP format.' }));
        }
        if (fieldRule.type === 'date' && rawValue && !normalizedValue) {
          errors.push(buildError({ rowNumber: previewRow.row_number, sourceColumn: mapping.source_column_name || '', applicationField: mapping.application_field_code, rawValue, normalizedValue, errorCode: 'INVALID_DATE', errorMessage: 'Date could not be parsed.', suggestedFix: 'Use a recognizable date format.' }));
        }
        if (fieldRule.type === 'tier' && rawValue && !VALID_TIERS.includes(String(rawValue).trim().toLowerCase()) && !normalizedValue) {
          errors.push(buildError({ rowNumber: previewRow.row_number, sourceColumn: mapping.source_column_name || '', applicationField: mapping.application_field_code, rawValue, normalizedValue, errorCode: 'INVALID_TIER_CODE', errorMessage: 'Tier code is not supported.', suggestedFix: 'Use employee_only, employee_spouse, employee_children, or family.' }));
        }
        if (fieldRule.type === 'state' && normalizedValue && !VALID_STATES.includes(normalizedValue)) {
          errors.push(buildError({ rowNumber: previewRow.row_number, sourceColumn: mapping.source_column_name || '', applicationField: mapping.application_field_code, rawValue, normalizedValue, errorCode: 'INVALID_STATE_CODE', errorMessage: 'State abbreviation is not valid.', suggestedFix: 'Use a 2-letter US state code.' }));
        }
        if (fieldRule.type === 'number' && rawValue !== '' && rawValue != null && Number.isNaN(normalizedValue)) {
          errors.push(buildError({ rowNumber: previewRow.row_number, sourceColumn: mapping.source_column_name || '', applicationField: mapping.application_field_code, rawValue, normalizedValue, errorCode: 'UNSUPPORTED_DATA_TYPE', errorMessage: 'Value must be numeric.', suggestedFix: 'Remove text and keep numeric characters only.' }));
        }
      }

      const employeeId = String(normalizedRow.employee_id || '').trim();
      if (employeeId) {
        if (seenEmployeeIds.has(employeeId)) {
          errors.push(buildError({ rowNumber: previewRow.row_number, sourceColumn: 'employee_id', applicationField: 'employee_id', rawValue: employeeId, normalizedValue: employeeId, errorCode: 'DUPLICATE_EMPLOYEE_ID', errorMessage: 'Employee ID is duplicated in this import file.', suggestedFix: 'Use one unique employee ID per row.' }));
        }
        seenEmployeeIds.add(employeeId);
      }

      const validationStatus = errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'valid';
      validationIssues.push(...errors, ...warnings);
      stagedRows.push({
        import_session_id: body.importSessionId,
        source_row_number: previewRow.row_number,
        raw_row_json: previewRow.raw_row_json,
        normalized_row_json: normalizedRow,
        validation_status: validationStatus,
        error_count: errors.length,
        warning_count: warnings.length,
        errors_json: errors,
        warnings_json: warnings,
        commit_status: 'not_started',
      });
    }

    for (let i = 0; i < stagedRows.length; i += 50) {
      await base44.asServiceRole.entities.ImportRowStaging.bulkCreate(stagedRows.slice(i, i + 50));
    }

    const validRowCount = stagedRows.filter((row) => row.validation_status === 'valid').length;
    const warningRowCount = stagedRows.filter((row) => row.validation_status === 'warning').length;
    const errorRowCount = stagedRows.filter((row) => row.validation_status === 'error').length;

    await base44.entities.ImportSession.update(body.importSessionId, {
      validation_status: errorRowCount > 0 ? 'has_errors' : warningRowCount > 0 ? 'has_warnings' : 'validated',
      valid_row_count: validRowCount,
      warning_row_count: warningRowCount,
      error_row_count: errorRowCount,
    });

    return Response.json({
      import_session_id: body.importSessionId,
      row_pass_count: validRowCount,
      row_warning_count: warningRowCount,
      row_error_count: errorRowCount,
      top_validation_issues: validationIssues.slice(0, 25),
      rows: stagedRows,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});