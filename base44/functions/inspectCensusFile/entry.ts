import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    if (!body.fileUrl) return Response.json({ error: 'fileUrl required' }, { status: 400 });

    const fileResponse = await fetch(body.fileUrl);
    if (!fileResponse.ok) return Response.json({ error: 'Unable to read uploaded file' }, { status: 400 });

    const text = await fileResponse.text();
    const { headers, rows } = parseCsv(text);

    return Response.json({
      file_name: body.fileName || 'census.csv',
      headers,
      row_count: rows.length,
      sample_rows: rows.slice(0, 5),
      suggested_mapping: autoMap(headers),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});