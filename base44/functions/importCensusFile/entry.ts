import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const NUMERIC_FIELDS = ["hours_per_week", "annual_salary", "dependent_count"];
const ALLOWED_FIELDS = [
  "employee_id", "first_name", "last_name", "date_of_birth", "gender", "ssn_last4", "email", "phone", "address", "city", "state", "zip", "hire_date", "employment_status", "employment_type", "hours_per_week", "annual_salary", "job_title", "department", "class_code", "is_eligible", "dependent_count", "coverage_tier", "validation_status", "validation_issues",
];
const AUTOMAP_HINTS = {
  first_name: ["first_name", "first name", "firstname", "fname", "given name", "given_name"],
  last_name: ["last_name", "last name", "lastname", "lname", "surname", "family name"],
  date_of_birth: ["date_of_birth", "dob", "birth date", "birthdate", "birth_date", "date of birth"],
  gender: ["gender", "sex"],
  email: ["email", "email address", "e-mail", "work email"],
  phone: ["phone", "phone number", "mobile", "cell", "telephone"],
  employee_id: ["employee_id", "emp id", "emp_id", "employee id", "staff id"],
  ssn_last4: ["ssn", "ssn4", "ssn_last4", "last 4", "last4", "social security"],
  hire_date: ["hire_date", "hire date", "start date", "start_date", "date hired"],
  employment_status: ["employment_status", "emp status", "status", "active"],
  employment_type: ["employment_type", "emp type", "type", "full time", "part time"],
  hours_per_week: ["hours", "hours_per_week", "hours per week", "weekly hours"],
  annual_salary: ["salary", "annual_salary", "annual salary", "compensation", "wage"],
  job_title: ["job_title", "title", "position", "job title", "role"],
  department: ["department", "dept", "division", "team"],
  address: ["address", "street", "address1", "street address"],
  city: ["city", "town"],
  state: ["state", "st", "province"],
  zip: ["zip", "zip_code", "postal", "postal_code", "zipcode"],
  coverage_tier: ["coverage_tier", "coverage", "tier", "plan tier", "coverage type"],
  dependent_count: ["dependents", "dependent_count", "dep count"],
  class_code: ["class", "class_code", "employee class", "grade"],
};
const ALLOWED_MODES = ["inspect", "validate", "import"];
const ALLOWED_REQUEST_KEYS = ["mode", "caseId", "fileUrl", "fileName", "mapping", "notes", "currentVersionCount"];
const RESPONSE_CONTRACTS = {
  inspect: {
    allowed: ["file_name", "headers", "row_count", "sample_rows", "suggested_mapping"],
    required: ["file_name", "headers", "row_count", "sample_rows", "suggested_mapping"],
  },
  validate: {
    allowed: ["row_count", "validation_summary", "field_stats", "duplicates", "transformed_preview"],
    required: ["row_count", "validation_summary", "field_stats", "duplicates", "transformed_preview"],
  },
  import: {
    allowed: ["row_count", "validation_summary", "field_stats", "duplicates", "transformed_preview", "import_run_id", "census_version_id"],
    required: ["row_count", "validation_summary", "field_stats", "duplicates", "transformed_preview", "import_run_id", "census_version_id"],
  },
  importError: {
    allowed: ["row_count", "validation_summary", "field_stats", "duplicates", "transformed_preview", "error"],
    required: ["row_count", "validation_summary", "field_stats", "duplicates", "transformed_preview", "error"],
  },
};

function stripUndefined(input) {
  return Object.fromEntries(Object.entries(input || {}).filter(([, value]) => value !== undefined));
}

function assertKnownKeys(input, allowedKeys, context) {
  const unknownKeys = Object.keys(stripUndefined(input)).filter((key) => !allowedKeys.includes(key));
  if (unknownKeys.length > 0) throw new Error(`${context} contains unsupported keys: ${unknownKeys.join(', ')}`);
}

function assertRequiredKeys(input, requiredKeys, context) {
  const missingKeys = requiredKeys.filter((key) => {
    const value = input?.[key];
    return value === undefined || value === null || value === '';
  });
  if (missingKeys.length > 0) throw new Error(`${context} is missing required keys: ${missingKeys.join(', ')}`);
}

function validateRequest(body) {
  assertKnownKeys(body, ALLOWED_REQUEST_KEYS, 'census import request');
  assertRequiredKeys(body, ['mode', 'fileUrl'], 'census import request');
  if (!ALLOWED_MODES.includes(body.mode)) throw new Error(`Unsupported census import mode: ${body.mode}`);
  if (["validate", "import"].includes(body.mode)) {
    assertRequiredKeys(body, ['caseId', 'mapping'], 'census import request');
    Object.keys(body.mapping || {}).forEach((fieldKey) => {
      if (!ALLOWED_FIELDS.includes(fieldKey)) throw new Error(`Unsupported mapped field: ${fieldKey}`);
    });
  }
  return body;
}

function validateResponseShape(payload, contractKey) {
  const contract = RESPONSE_CONTRACTS[contractKey];
  assertKnownKeys(payload, contract.allowed, `${contractKey} response`);
  assertRequiredKeys(payload, contract.required, `${contractKey} response`);
  return payload;
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const character = line[i];
    const nextCharacter = line[i + 1];
    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (character === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }
    current += character;
  }
  values.push(current.trim());
  return values;
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = parseCsvLine(lines[0]).map((value) => value.replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return headers.reduce((accumulator, header, index) => {
      accumulator[header] = (values[index] || '').replace(/^"|"$/g, '');
      return accumulator;
    }, {});
  }).filter((row) => Object.values(row).some(Boolean));

  return { headers, rows };
}

function autoMap(headers) {
  const mapping = {};
  headers.forEach((header) => {
    const normalizedHeader = header.toLowerCase().replace(/[_\s-]+/g, ' ').trim();
    Object.entries(AUTOMAP_HINTS).forEach(([fieldKey, hints]) => {
      if (mapping[fieldKey]) return;
      const matched = hints.some((hint) => hint.replace(/[_\s-]+/g, ' ').trim() === normalizedHeader);
      if (matched) mapping[fieldKey] = header;
    });
  });
  return mapping;
}

function normalizeDate(value) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 10);
}

function transformField(fieldKey, value) {
  if (!value) return undefined;
  if (NUMERIC_FIELDS.includes(fieldKey)) {
    const parsed = Number(String(value).replace(/[$,]/g, ''));
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  if (["date_of_birth", "hire_date"].includes(fieldKey)) return normalizeDate(value);
  if (fieldKey === "gender") {
    const normalized = String(value).toLowerCase();
    if (normalized.startsWith('m')) return 'male';
    if (normalized.startsWith('f')) return 'female';
    return 'other';
  }
  if (fieldKey === "employment_status") {
    const normalized = String(value).toLowerCase();
    if (normalized.includes('term')) return 'terminated';
    if (normalized.includes('leave')) return 'leave';
    return 'active';
  }
  if (fieldKey === "employment_type") {
    const normalized = String(value).toLowerCase();
    if (normalized.includes('part')) return 'part_time';
    if (normalized.includes('contract')) return 'contractor';
    return 'full_time';
  }
  if (fieldKey === "coverage_tier") {
    const normalized = String(value).toLowerCase();
    if (normalized.includes('family') || normalized.includes('fam')) return 'family';
    if (normalized.includes('spouse')) return 'employee_spouse';
    if (normalized.includes('child')) return 'employee_children';
    return 'employee_only';
  }
  return String(value).trim();
}

function validateMember(member) {
  const issues = [];
  if (!member.first_name) issues.push({ field: 'first_name', type: 'error', message: 'Missing first name' });
  if (!member.last_name) issues.push({ field: 'last_name', type: 'error', message: 'Missing last name' });
  if (member.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email)) issues.push({ field: 'email', type: 'warning', message: 'Invalid email format' });
  if (member.date_of_birth && !/^\d{4}-\d{2}-\d{2}$/.test(member.date_of_birth)) issues.push({ field: 'date_of_birth', type: 'warning', message: 'Invalid date format' });
  return issues;
}

function analyzeFieldStats(rows, mapping) {
  return Object.entries(mapping || {}).reduce((accumulator, [fieldKey, columnName]) => {
    if (!columnName) return accumulator;
    const populated = rows.filter((row) => row[columnName]).length;
    accumulator[fieldKey] = {
      column: columnName,
      populated,
      total: rows.length,
      completeness: rows.length === 0 ? 0 : Math.round((populated / rows.length) * 100),
    };
    return accumulator;
  }, {});
}

async function logImportExceptions(base44, importRunId, issuesByRow) {
  const writes = [];
  issuesByRow.forEach(({ rowNumber, issues, rawRow }) => {
    issues.forEach((issue) => {
      writes.push(base44.asServiceRole.entities.ImportException.create({
        import_run_id: importRunId,
        entity_name: 'CensusMember',
        sheet_name: 'Census',
        source_row_number: rowNumber,
        error_code: issue.type === 'error' ? 'MISSING_REQUIRED_FIELD' : 'UNKNOWN',
        error_message: issue.message,
        severity: issue.type,
        raw_payload_json: rawRow,
        field_name: issue.field,
        resolved: false,
      }));
    });
  });
  await Promise.all(writes);
}

function buildPreview(rows, mapping) {
  const duplicates = [];
  const seenIdentity = new Map();
  const issuesByRow = [];
  let errorCount = 0;
  let warningCount = 0;

  const transformedRows = rows.map((rawRow, index) => {
    const member = { is_eligible: true };
    Object.entries(mapping || {}).forEach(([fieldKey, columnName]) => {
      member[fieldKey] = transformField(fieldKey, rawRow[columnName]);
    });

    const issues = validateMember(member);
    const identity = member.email || member.employee_id;
    if (identity && seenIdentity.has(identity)) {
      duplicates.push({ row: index, prevRow: seenIdentity.get(identity), identity });
      issues.push({ field: 'employee_id', type: 'warning', message: 'Potential duplicate employee' });
    } else if (identity) {
      seenIdentity.set(identity, index);
    }

    errorCount += issues.filter((issue) => issue.type === 'error').length;
    warningCount += issues.filter((issue) => issue.type === 'warning').length;
    issuesByRow.push({ rowNumber: index + 2, issues, rawRow });

    return {
      ...Object.fromEntries(Object.entries(member).filter(([key, value]) => ALLOWED_FIELDS.includes(key) && value !== undefined)),
      validation_issues: issues,
      validation_status: issues.some((issue) => issue.type === 'error') ? 'has_errors' : issues.some((issue) => issue.type === 'warning') ? 'has_warnings' : 'valid',
    };
  });

  return {
    preview: {
      row_count: rows.length,
      validation_summary: { total: rows.length, errors: errorCount, warnings: warningCount },
      field_stats: analyzeFieldStats(rows, mapping),
      duplicates,
      transformed_preview: transformedRows.slice(0, 5),
    },
    transformedRows,
    issuesByRow,
    errorCount,
    warningCount,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = validateRequest(await req.json());
    const fileResponse = await fetch(body.fileUrl);
    if (!fileResponse.ok) return Response.json({ error: 'Unable to read uploaded file' }, { status: 400 });

    const text = await fileResponse.text();
    const { headers, rows } = parseCsv(text);

    if (body.mode === 'inspect') {
      const response = validateResponseShape({
        file_name: body.fileName || 'census.csv',
        headers,
        row_count: rows.length,
        sample_rows: rows.slice(0, 5),
        suggested_mapping: autoMap(headers),
      }, 'inspect');
      return Response.json(response);
    }

    const { preview, transformedRows, issuesByRow, errorCount, warningCount } = buildPreview(rows, body.mapping || {});

    if (body.mode === 'validate') {
      return Response.json(validateResponseShape(preview, 'validate'));
    }

    if (errorCount > 0) {
      return Response.json(validateResponseShape({ ...preview, error: 'Validation failed. Fix blocking errors before import.' }, 'importError'), { status: 400 });
    }

    const importRun = await base44.asServiceRole.entities.ImportRun.create({
      import_type: 'census_members',
      source_file_name: body.fileName || 'census.csv',
      case_id: body.caseId,
      status: 'running',
      started_at: new Date().toISOString(),
      total_rows: rows.length,
      success_rows: 0,
      error_rows: 0,
      warning_rows: 0,
      created_by: user.email,
      rollback_available: true,
      notes: body.notes || undefined,
    });

    await logImportExceptions(base44, importRun.id, issuesByRow.filter((item) => item.issues.length > 0));

    const version = await base44.entities.CensusVersion.create({
      case_id: body.caseId,
      version_number: Number(body.currentVersionCount || 0) + 1,
      file_url: body.fileUrl,
      file_name: body.fileName || 'census.csv',
      status: warningCount > 0 ? 'has_issues' : 'validated',
      total_employees: transformedRows.length,
      eligible_employees: transformedRows.filter((member) => member.is_eligible).length,
      validation_errors: errorCount,
      validation_warnings: warningCount,
      uploaded_by: user.email,
      validated_at: new Date().toISOString(),
      notes: body.notes || undefined,
    });

    const membersToInsert = transformedRows.map((member) => ({
      ...member,
      census_version_id: version.id,
      case_id: body.caseId,
    }));

    for (let index = 0; index < membersToInsert.length; index += 50) {
      await base44.entities.CensusMember.bulkCreate(membersToInsert.slice(index, index + 50));
    }

    await base44.entities.BenefitCase.update(body.caseId, {
      census_status: warningCount > 0 ? 'issues_found' : 'validated',
      stage: 'census_in_progress',
    });

    await base44.asServiceRole.entities.ImportRun.update(importRun.id, {
      status: warningCount > 0 ? 'completed_with_warnings' : 'completed',
      completed_at: new Date().toISOString(),
      success_rows: transformedRows.length,
      error_rows: errorCount,
      warning_rows: warningCount,
    });

    return Response.json(validateResponseShape({ ...preview, import_run_id: importRun.id, census_version_id: version.id }, 'import'));
  } catch (error) {
    const status = /census import request|Unsupported mapped field|Unsupported census import mode/i.test(error.message) ? 400 : 500;
    return Response.json({ error: error.message }, { status });
  }
});