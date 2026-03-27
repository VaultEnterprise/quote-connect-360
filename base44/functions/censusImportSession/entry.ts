import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import * as XLSX from 'npm:xlsx@0.18.5';

const MODULE_CODE = 'census';
const PAGE_CODE = 'census_manager';
const SUPPORTED_EXTENSIONS = ['xlsx', 'xls', 'csv', 'tsv', 'txt', 'xlsm'];
const DELIMITER_BY_EXTENSION = { csv: ',', tsv: '\t', txt: null };
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const CENSUS_FIELDS = [
  { code: 'employee_id', label: 'Employee ID', data_type: 'string' },
  { code: 'first_name', label: 'First Name', data_type: 'string' },
  { code: 'last_name', label: 'Last Name', data_type: 'string' },
  { code: 'date_of_birth', label: 'Date of Birth', data_type: 'date' },
  { code: 'gender', label: 'Gender', data_type: 'string' },
  { code: 'email', label: 'Email', data_type: 'string' },
  { code: 'phone', label: 'Phone', data_type: 'string' },
  { code: 'address', label: 'Address', data_type: 'string' },
  { code: 'city', label: 'City', data_type: 'string' },
  { code: 'state', label: 'State', data_type: 'string' },
  { code: 'zip', label: 'ZIP', data_type: 'string' },
  { code: 'coverage_tier', label: 'Tier Code', data_type: 'string' },
  { code: 'hire_date', label: 'Coverage Effective Date', data_type: 'date' },
  { code: 'employment_status', label: 'Employment Status', data_type: 'string' },
  { code: 'employment_type', label: 'Employment Type', data_type: 'string' },
  { code: 'dependent_count', label: 'Dependent Indicator', data_type: 'number' },
  { code: 'class_code', label: 'Relationship', data_type: 'string' },
  { code: 'annual_salary', label: 'Annual Salary', data_type: 'number' },
  { code: 'hours_per_week', label: 'Hours Per Week', data_type: 'number' },
  { code: 'ssn_last4', label: 'Tobacco', data_type: 'string' }
];
const AUTOMAP_HINTS = {
  employee_id: ['employee id', 'employee_id', 'emp id', 'member id', 'subscriber id'],
  ssn_last4: ['ssn', 'ssn last 4', 'last4', 'ssn_last4'],
  hire_date: ['hire date', 'effective date', 'coverage effective date', 'eligibility date'],
  first_name: ['first name', 'first_name', 'firstname'],
  last_name: ['last name', 'last_name', 'lastname'],
  date_of_birth: ['dob', 'date of birth', 'birth date', 'date_of_birth'],
  gender: ['gender', 'sex'],
  email: ['email', 'email address'],
  phone: ['phone', 'phone number', 'mobile'],
  address: ['address', 'street'],
  city: ['city'],
  state: ['state'],
  zip: ['zip', 'zip code', 'postal code', 'zipcode'],
  coverage_tier: ['tier', 'coverage tier', 'coverage', 'tier code'],
  hire_date: ['hire date', 'effective date', 'coverage effective date'],
  employment_status: ['status', 'employment status'],
  employment_type: ['employment type', 'emp type'],
  dependent_count: ['dependent count', 'dependents', 'dependent indicator'],
  class_code: ['relationship', 'class', 'relation'],
  annual_salary: ['salary', 'annual salary'],
  hours_per_week: ['hours', 'hours per week'],
  ssn_last4: ['tobacco', 'tobacco flag']
};

function getExtension(fileName = '') {
  const parts = fileName.toLowerCase().split('.');
  return parts.length > 1 ? parts.pop() : '';
}

function normalizeHeader(value, fallbackIndex) {
  const normalized = String(value ?? '').trim();
  return normalized || `Unnamed Column ${fallbackIndex + 1}`;
}

function detectDelimiter(text) {
  const firstLines = text.split(/\r?\n/).slice(0, 5).join('\n');
  const candidates = [',', '\t', ';', '|'];
  const scored = candidates.map((delimiter) => ({
    delimiter,
    score: firstLines.split('\n').reduce((sum, line) => sum + line.split(delimiter).length, 0),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.delimiter || ',';
}

function parseDelimited(text, delimiter) {
  return XLSX.read(text, { type: 'string', raw: false, FS: delimiter });
}

function toMatrix(workbook, sheetName) {
  const targetSheet = sheetName || workbook.SheetNames[0];
  const worksheet = workbook.Sheets[targetSheet];
  if (!worksheet) {
    throw new Error(`WORKSHEET_NOT_FOUND: ${targetSheet}`);
  }
  const matrix = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false, defval: '' });
  return { sheetName: targetSheet, matrix };
}

function scoreHeaderRow(row) {
  const values = row.map((cell) => String(cell ?? '').trim()).filter(Boolean);
  if (!values.length) return 0;
  const uniqueCount = new Set(values.map((value) => value.toLowerCase())).size;
  const filledRatio = values.length / Math.max(row.length, 1);
  return uniqueCount + filledRatio;
}

function detectHeaderRow(matrix) {
  const candidates = matrix.slice(0, 10).map((row, index) => ({ index, score: scoreHeaderRow(row) }));
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  const second = candidates[1];
  const confidenceRatio = best ? best.score / Math.max(second?.score || 1, 1) : 0;
  const confidence = Math.min(1, confidenceRatio / 1.5);
  return {
    headerRowNumber: best ? best.index + 1 : 1,
    confidence,
    needsUserSelection: confidence < 0.75,
  };
}

function buildPromptState({ extension, sheetNames, headerDetection, columnRecords, dataRows }) {
  const duplicateHeaders = columnRecords.filter((column) => column.detected_as_duplicate).map((column) => column.source_column_name);
  const promptMessages = [];

  if (sheetNames.length > 1) {
    promptMessages.push('This workbook contains multiple sheets. Select the sheet you want to import.');
  }
  if (!dataRows.length) {
    promptMessages.push('No usable worksheet data was found.');
  }
  if (headerDetection.needsUserSelection) {
    promptMessages.push('We could not confidently identify the header row. Please choose the row that contains the column names.');
  }
  if (duplicateHeaders.length) {
    promptMessages.push('Duplicate column names were found. Please review the selected header row.');
  }

  return {
    duplicate_headers: duplicateHeaders,
    prompt_messages: promptMessages,
    needs_sheet_selection: sheetNames.length > 1,
    needs_header_selection: headerDetection.needsUserSelection,
    file_format_message: `Supported import detected: .${extension}`,
  };
}

function buildColumns(headers, rows) {
  const counts = {};
  return headers.map((header, index) => {
    const normalized = header.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
    counts[normalized] = (counts[normalized] || 0) + 1;
    return {
      source_column_name: header,
      source_column_index: index,
      normalized_column_name: normalized,
      sample_values_json: rows.slice(0, 5).map((row) => String(row[index] ?? '')).filter(Boolean),
      inferred_data_type: 'string',
      detected_as_duplicate: counts[normalized] > 1,
    };
  });
}

function inferMappings(headers, requiredConfig) {
  return CENSUS_FIELDS.map((field) => {
    const matchIndex = headers.findIndex((header) => {
      const normalizedHeader = header.toLowerCase().replace(/[_\s-]+/g, ' ').trim();
      return (AUTOMAP_HINTS[field.code] || []).some((hint) => hint === normalizedHeader);
    });
    const rule = requiredConfig[field.code] || {};
    return {
      application_field_code: field.code,
      application_field_label: field.label,
      source_column_name: matchIndex >= 0 ? headers[matchIndex] : '',
      source_column_index: matchIndex >= 0 ? matchIndex : undefined,
      default_value: '',
      transform_rule_code: rule.default_transform_rule || '',
      is_required_for_run: Boolean(rule.is_default_required || rule.is_hard_required),
      is_hard_required: Boolean(rule.is_hard_required),
      required_reason: rule.required_reason || '',
      mapping_confidence: matchIndex >= 0 ? 0.95 : 0,
      validation_rule_set: rule.validation_rule_set || [],
    };
  });
}

async function getRequiredFieldConfig(base44, caseId) {
  const plans = await base44.entities.ScenarioPlan.filter({ case_id: caseId }, '-created_date', 200);
  const hasAgeBanded = plans.some((plan) => plan.rate_table_id);
  const config = {
    employee_id: { is_default_required: true, is_hard_required: true, required_reason: 'Employee ID is required for row identity and updates.', validation_rule_set: ['required'] },
    first_name: { is_default_required: true, is_hard_required: true, required_reason: 'First name is required to create a census member.', validation_rule_set: ['required'] },
    last_name: { is_default_required: true, is_hard_required: true, required_reason: 'Last name is required to create a census member.', validation_rule_set: ['required'] },
    zip: { is_default_required: true, is_hard_required: false, required_reason: 'ZIP is required when rating and geographic logic depend on location.', validation_rule_set: ['zip'] },
    date_of_birth: { is_default_required: hasAgeBanded, is_hard_required: false, required_reason: hasAgeBanded ? 'DOB is required because age-based rating appears to be in use.' : 'DOB is optional unless age-based rating is used.', validation_rule_set: ['date'] },
    coverage_tier: { is_default_required: true, is_hard_required: false, required_reason: 'Tier code is needed when rates vary by enrollment tier.', validation_rule_set: ['tier'] },
    state: { is_default_required: true, is_hard_required: false, required_reason: 'State helps validate geography and ZIP consistency.', validation_rule_set: ['state'] },
    hire_date: { is_default_required: false, is_hard_required: false, required_reason: 'Coverage effective date is optional unless time-sensitive rating is used.', validation_rule_set: ['date'] },
    gender: { is_default_required: false, is_hard_required: false, required_reason: 'Gender is optional unless downstream rating depends on it.', validation_rule_set: [] },
    ssn_last4: { is_default_required: false, is_hard_required: false, required_reason: 'Tobacco is optional unless tobacco rates apply.', validation_rule_set: [] },
  };
  return config;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    if (!body.fileUrl || !body.fileName || !body.caseId) {
      return Response.json({ error: 'fileUrl, fileName, and caseId are required' }, { status: 400 });
    }

    const extension = getExtension(body.fileName);
    if (!SUPPORTED_EXTENSIONS.includes(extension)) {
      return Response.json({ error: `UNSUPPORTED_FILE_FORMAT: .${extension || 'unknown'}` }, { status: 400 });
    }

    const fileResponse = await fetch(body.fileUrl);
    if (!fileResponse.ok) {
      return Response.json({ error: 'Could not download the uploaded file. Please upload it again.' }, { status: 400 });
    }

    const contentLength = Number(fileResponse.headers.get('content-length') || 0);
    if (contentLength && contentLength > MAX_FILE_SIZE_BYTES) {
      return Response.json({ error: 'This file is too large to import. Please upload a file smaller than 10 MB.' }, { status: 400 });
    }

    const importSession = body.importSessionId
      ? await base44.entities.ImportSession.get(body.importSessionId)
      : await base44.entities.ImportSession.create({
          module_code: MODULE_CODE,
          page_code: PAGE_CODE,
          source_file_name: body.fileName,
          source_format: extension,
          source_mime_type: body.fileType || '',
          upload_user_id: user.id,
          upload_timestamp: new Date().toISOString(),
          parse_status: 'uploaded',
          validation_status: 'not_started',
          commit_status: 'not_started',
          import_mode: body.importMode || 'validate_only',
          notes_json: { case_id: body.caseId, file_url: body.fileUrl }
        });

    if (!importSession) {
      return Response.json({ error: 'Import session was not found.' }, { status: 404 });
    }

    let workbook;
    if (['xlsx', 'xls', 'xlsm'].includes(extension)) {
      const buffer = await fileResponse.arrayBuffer();
      workbook = XLSX.read(buffer, { type: 'array', raw: false, cellDates: true });
    } else {
      const text = await fileResponse.text();
      const delimiter = DELIMITER_BY_EXTENSION[extension] || detectDelimiter(text);
      workbook = parseDelimited(text, delimiter);
    }

    const sheetNames = workbook.SheetNames || [];
    const selectedSheet = body.selectedSheetName || sheetNames[0] || '';
    const { sheetName, matrix } = toMatrix(workbook, selectedSheet);
    const headerDetection = detectHeaderRow(matrix);
    const headerIndex = Math.max(0, (body.headerRowNumber || headerDetection.headerRowNumber) - 1);
    const rawHeaders = matrix[headerIndex] || [];
    const headers = rawHeaders.map((header, index) => normalizeHeader(header, index));
    const dataRows = matrix.slice(headerIndex + 1)
      .map((row) => row.slice(0, headers.length))
      .filter((row) => row.some((cell) => String(cell ?? '').trim() !== ''));
    const requiredConfig = await getRequiredFieldConfig(base44, body.caseId);
    const inferredMappings = inferMappings(headers, requiredConfig);
    const columnRecords = buildColumns(headers, dataRows);
    const promptState = buildPromptState({ extension, sheetNames, headerDetection, columnRecords, dataRows });

    if (!dataRows.length) {
      await base44.entities.ImportSession.update(importSession.id, {
        parse_status: 'failed',
        notes_json: { case_id: body.caseId, file_url: body.fileUrl, prompt_state: promptState }
      });
      return Response.json({ error: 'No usable worksheet data was found.' }, { status: 400 });
    }

    const existingColumns = await base44.asServiceRole.entities.ImportSessionColumn.filter({ import_session_id: importSession.id }, 'created_date', 500);
    if (existingColumns.length) {
      await Promise.all(existingColumns.map((column) => base44.asServiceRole.entities.ImportSessionColumn.delete(column.id)));
    }
    await Promise.all(columnRecords.map((column) => base44.entities.ImportSessionColumn.create({
      import_session_id: importSession.id,
      ...column,
    })));

    const existingFieldMappings = await base44.asServiceRole.entities.ImportFieldMapping.filter({ import_session_id: importSession.id }, 'created_date', 200);
    const mergedMappings = inferredMappings.map((mapping) => {
      const existingMapping = (body.existingMappings || []).find((item) => item.application_field_code === mapping.application_field_code);
      if (!existingMapping) return mapping;
      return {
        ...mapping,
        source_column_name: existingMapping.source_column_name || '',
        source_column_index: typeof existingMapping.source_column_index === 'number' ? existingMapping.source_column_index : mapping.source_column_index,
        default_value: existingMapping.default_value || '',
        transform_rule_code: existingMapping.transform_rule_code || mapping.transform_rule_code,
        is_required_for_run: typeof existingMapping.is_required_for_run === 'boolean' ? existingMapping.is_required_for_run : mapping.is_required_for_run,
        mapping_confidence: existingMapping.source_column_name ? Math.max(existingMapping.mapping_confidence || 0, 1) : mapping.mapping_confidence,
      };
    });

    if (existingFieldMappings.length) {
      await Promise.all(existingFieldMappings.map((item) => {
        const nextMapping = mergedMappings.find((mapping) => mapping.application_field_code === item.application_field_code);
        if (!nextMapping) return base44.asServiceRole.entities.ImportFieldMapping.delete(item.id);
        return base44.asServiceRole.entities.ImportFieldMapping.update(item.id, {
          source_column_name: nextMapping.source_column_name || '',
          source_column_index: typeof nextMapping.source_column_index === 'number' ? nextMapping.source_column_index : undefined,
          default_value: nextMapping.default_value || '',
          transform_rule_code: nextMapping.transform_rule_code || '',
          is_required_for_run: !!nextMapping.is_required_for_run,
          is_hard_required: !!nextMapping.is_hard_required,
          required_reason: nextMapping.required_reason || '',
          mapping_confidence: nextMapping.mapping_confidence || 0,
          validation_rule_set: nextMapping.validation_rule_set || []
        });
      }));
    }

    const missingMappings = mergedMappings.filter((mapping) => !existingFieldMappings.some((item) => item.application_field_code === mapping.application_field_code));
    if (missingMappings.length) {
      await Promise.all(missingMappings.map((mapping) => base44.entities.ImportFieldMapping.create({
        import_session_id: importSession.id,
        ...mapping,
      })));
    }

    await base44.entities.ImportSession.update(importSession.id, {
      selected_sheet_name: sheetName,
      header_row_number: headerIndex + 1,
      parse_status: headerDetection.needsUserSelection ? 'needs_header_selection' : 'parsed',
      validation_status: 'ready',
      commit_status: 'ready',
      total_rows: dataRows.length,
      total_columns: headers.length,
      created_row_count: 0,
      updated_row_count: 0,
      skipped_row_count: 0,
      failed_row_count: 0,
      last_error_message: '',
      notes_json: {
        case_id: body.caseId,
        file_url: body.fileUrl,
        prompt_state: promptState,
        available_sheet_names: sheetNames,
        structure_warnings: promptState.prompt_messages
      }
    });

    return Response.json({
      import_session_id: importSession.id,
      source_file_name: body.fileName,
      source_format: extension,
      sheet_names: sheetNames,
      selected_sheet_name: sheetName,
      header_row_number: headerIndex + 1,
      header_detection_confidence: headerDetection.confidence,
      needs_header_selection: headerDetection.needsUserSelection,
      columns: columnRecords,
      inferred_mappings: mergedMappings,
      preview_rows: dataRows.map((row, rowIndex) => ({
        row_number: headerIndex + 2 + rowIndex,
        raw_row_json: Object.fromEntries(headers.map((header, index) => [header, row[index] ?? '']))
      })),
      total_rows: dataRows.length,
      total_columns: headers.length,
      file_url: body.fileUrl,
      source_mime_type: body.fileType || '',
      required_field_rules: requiredConfig,
      prompt_state: promptState,
    });
  } catch (error) {
    const message = String(error?.message || '');
    if (message.includes('WORKSHEET_NOT_FOUND')) {
      return Response.json({ error: 'The selected worksheet could not be found. Please choose another sheet.' }, { status: 400 });
    }
    if (message.includes('UNSUPPORTED_FILE_FORMAT')) {
      return Response.json({ error: 'This file type is not supported.' }, { status: 400 });
    }
    return Response.json({ error: 'We could not read this file. Please verify the file is not corrupt.' }, { status: 500 });
  }
});