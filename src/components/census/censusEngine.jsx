export const REQUIRED_CENSUS_FIELDS = ["first_name", "last_name"];

export const CENSUS_FIELDS = [
  { key: "employee_id", label: "Employee ID", required: false },
  { key: "first_name", label: "First Name", required: true },
  { key: "last_name", label: "Last Name", required: true },
  { key: "date_of_birth", label: "Date of Birth", required: false },
  { key: "gender", label: "Gender", required: false },
  { key: "email", label: "Email", required: false },
  { key: "phone", label: "Phone", required: false },
  { key: "ssn_last4", label: "SSN Last 4", required: false },
  { key: "hire_date", label: "Hire Date", required: false },
  { key: "employment_status", label: "Employment Status", required: false },
  { key: "employment_type", label: "Employment Type", required: false },
  { key: "hours_per_week", label: "Hours/Week", required: false },
  { key: "annual_salary", label: "Annual Salary", required: false },
  { key: "job_title", label: "Job Title", required: false },
  { key: "department", label: "Department", required: false },
  { key: "address", label: "Address", required: false },
  { key: "city", label: "City", required: false },
  { key: "state", label: "State", required: false },
  { key: "zip", label: "ZIP", required: false },
  { key: "coverage_tier", label: "Coverage Tier", required: false },
  { key: "dependent_count", label: "Dependent Count", required: false },
  { key: "class_code", label: "Class Code", required: false },
];

export const AUTOMAP_HINTS = {
  employee_id: ["employee_id","employee id","emp id","emp_id","member id","subscriber id"],
  first_name: ["first_name","first name","firstname","fname","given name"],
  last_name: ["last_name","last name","lastname","lname","surname"],
  date_of_birth: ["date_of_birth","date of birth","birth date","birthdate","dob"],
  gender: ["gender","sex"],
  email: ["email","email address","work email"],
  phone: ["phone","phone number","mobile","cell"],
  ssn_last4: ["ssn last 4","ssn_last4","last4","last 4 ssn"],
  hire_date: ["hire_date","hire date","date hired","start date"],
  employment_status: ["employment_status","employment status","status"],
  employment_type: ["employment_type","employment type","employee type"],
  hours_per_week: ["hours_per_week","hours per week","weekly hours"],
  annual_salary: ["annual_salary","annual salary","salary","compensation"],
  job_title: ["job_title","job title","title","position"],
  department: ["department","dept"],
  address: ["address","street","street address"],
  city: ["city"],
  state: ["state","st"],
  zip: ["zip","zip code","zipcode","postal code"],
  coverage_tier: ["coverage_tier","coverage tier","tier","coverage"],
  dependent_count: ["dependent_count","dependent count","dependents","dep count"],
  class_code: ["class_code","class code","employee class"],
};

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeName(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

function normalizeDate(value) {
  const input = normalizeText(value);
  if (!input) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;

  const parts = input.split(/[\/\-]/).map((part) => part.trim());
  if (parts.length !== 3) return input;

  if (parts[0].length === 4) {
    const [yyyy, mm, dd] = parts;
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }

  let [mm, dd, yyyy] = parts;
  if (yyyy.length === 2) yyyy = `20${yyyy}`;
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

function normalizeGender(value) {
  const normalized = normalizeText(value).toLowerCase();
  if (!normalized) return undefined;
  if (normalized.startsWith("m")) return "male";
  if (normalized.startsWith("f")) return "female";
  return "other";
}

function normalizeEmploymentStatus(value) {
  const normalized = normalizeText(value).toLowerCase();
  if (!normalized) return "active";
  if (normalized.includes("term")) return "terminated";
  if (normalized.includes("leave")) return "leave";
  return "active";
}

function normalizeEmploymentType(value) {
  const normalized = normalizeText(value).toLowerCase();
  if (!normalized) return "full_time";
  if (normalized.includes("part")) return "part_time";
  if (normalized.includes("contract")) return "contractor";
  return "full_time";
}

function normalizeCoverageTier(value) {
  const normalized = normalizeText(value).toLowerCase();
  if (!normalized) return "employee_only";
  if (normalized.includes("family") || normalized.includes("fam")) return "family";
  if (normalized.includes("spouse") || normalized.includes("ee+s")) return "employee_spouse";
  if (normalized.includes("child") || normalized.includes("children") || normalized.includes("ee+c")) return "employee_children";
  return "employee_only";
}

function normalizeState(value) {
  return normalizeText(value).toUpperCase() || undefined;
}

function normalizeNumber(value) {
  const normalized = normalizeText(value).replace(/[$,]/g, "");
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export function autoMap(headers = []) {
  const mapping = {};
  headers.forEach((header) => {
    const normalizedHeader = header.toLowerCase().replace(/[_\s-]+/g, " ").trim();
    Object.entries(AUTOMAP_HINTS).forEach(([field, hints]) => {
      if (mapping[field]) return;
      const matched = hints.some((hint) => hint.replace(/[_\s-]+/g, " ").trim() === normalizedHeader);
      if (matched) mapping[field] = header;
    });
  });
  return mapping;
}

export function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map((header) => header.replace(/^["']|["']$/g, "").trim());
  const rows = lines.slice(1).map((line) => {
    const values = line.split(",").map((value) => value.replace(/^["']|["']$/g, "").trim());
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    return row;
  }).filter((row) => Object.values(row).some((value) => value));
  return { headers, rows };
}

export function buildCanonicalMemberKey(member) {
  const employeeId = normalizeText(member.employee_id);
  const email = normalizeText(member.email).toLowerCase();
  const nameDob = [normalizeText(member.first_name).toLowerCase(), normalizeText(member.last_name).toLowerCase(), normalizeText(member.date_of_birth)].filter(Boolean).join("|");
  return employeeId || email || nameDob || undefined;
}

export function transformRow(row, mapping) {
  const get = (field) => row[mapping[field]] || "";
  const transformed = {
    employee_id: normalizeText(get("employee_id")) || undefined,
    first_name: normalizeName(get("first_name")),
    last_name: normalizeName(get("last_name")),
    date_of_birth: normalizeDate(get("date_of_birth")),
    gender: normalizeGender(get("gender")),
    email: normalizeText(get("email")).toLowerCase() || undefined,
    phone: normalizeText(get("phone")) || undefined,
    ssn_last4: normalizeText(get("ssn_last4")) || undefined,
    hire_date: normalizeDate(get("hire_date")),
    employment_status: normalizeEmploymentStatus(get("employment_status")),
    employment_type: normalizeEmploymentType(get("employment_type")),
    hours_per_week: normalizeNumber(get("hours_per_week")),
    annual_salary: normalizeNumber(get("annual_salary")),
    job_title: normalizeText(get("job_title")) || undefined,
    department: normalizeText(get("department")) || undefined,
    address: normalizeText(get("address")) || undefined,
    city: normalizeName(get("city")) || undefined,
    state: normalizeState(get("state")),
    zip: normalizeText(get("zip")) || undefined,
    coverage_tier: normalizeCoverageTier(get("coverage_tier")),
    dependent_count: normalizeNumber(get("dependent_count")) || 0,
    class_code: normalizeText(get("class_code")) || undefined,
    validation_status: "pending",
  };

  transformed.is_eligible = transformed.employment_status === "active" && transformed.employment_type !== "contractor" && Number(transformed.hours_per_week || 0) >= 30;
  transformed.eligibility_reason = transformed.is_eligible ? "Meets active full-time eligibility rules" : "Does not meet active full-time eligibility rules";
  transformed.canonical_member_key = buildCanonicalMemberKey(transformed);
  return transformed;
}

export function validateRow(row, mapping) {
  const transformed = transformRow(row, mapping);
  const issues = [];

  REQUIRED_CENSUS_FIELDS.forEach((field) => {
    if (!transformed[field]) {
      issues.push({ field, type: "error", message: `Missing ${field.replace(/_/g, " ")}` });
    }
  });

  if (transformed.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(transformed.email)) {
    issues.push({ field: "email", type: "warning", message: "Invalid email format" });
  }

  if (transformed.date_of_birth && !/^\d{4}-\d{2}-\d{2}$/.test(transformed.date_of_birth)) {
    issues.push({ field: "date_of_birth", type: "warning", message: "Date of birth could not be normalized to YYYY-MM-DD" });
  }

  if (!transformed.canonical_member_key) {
    issues.push({ field: "canonical_member_key", type: "error", message: "No canonical identity could be created for this record" });
  }

  if (transformed.hours_per_week !== undefined && transformed.hours_per_week < 0) {
    issues.push({ field: "hours_per_week", type: "error", message: "Hours per week cannot be negative" });
  }

  if (transformed.annual_salary !== undefined && transformed.annual_salary < 0) {
    issues.push({ field: "annual_salary", type: "error", message: "Annual salary cannot be negative" });
  }

  return issues;
}

export function detectDuplicates(rows, mapping) {
  const seenKeys = new Map();
  const duplicates = [];

  rows.forEach((row, index) => {
    const transformed = transformRow(row, mapping);
    const key = transformed.canonical_member_key;
    if (!key) return;
    if (seenKeys.has(key)) {
      duplicates.push({
        row: index,
        prevRow: seenKeys.get(key),
        canonical_member_key: key,
        type: "canonical_member_key",
      });
      return;
    }
    seenKeys.set(key, index);
  });

  return duplicates;
}

export function analyzeDataQuality(rows, mapping) {
  const stats = {};
  Object.entries(mapping).forEach(([field, column]) => {
    if (!column) return;
    const populated = rows.filter((row) => String(row[column] || "").trim()).length;
    stats[field] = {
      column,
      populated,
      total: rows.length,
      completeness: rows.length ? Math.round((populated / rows.length) * 100) : 0,
      isEmpty: populated === 0,
    };
  });
  return stats;
}

export function buildValidationSummary(rows, mapping) {
  let errors = 0;
  let warnings = 0;
  rows.forEach((row) => {
    validateRow(row, mapping).forEach((issue) => {
      if (issue.type === "error") errors += 1;
      if (issue.type === "warning") warnings += 1;
    });
  });
  return { total: rows.length, errors, warnings };
}

export function buildDownstreamReadiness({ caseRecord, censusVersions = [], members = [] }) {
  const latestVersion = [...censusVersions].sort((a, b) => Number(b.version_number || 0) - Number(a.version_number || 0))[0];
  const validMembers = members.filter((member) => member.validation_status === "valid");
  const erroredMembers = members.filter((member) => member.validation_status === "has_errors");

  return {
    latestVersion,
    validMembers: validMembers.length,
    erroredMembers: erroredMembers.length,
    censusValidated: latestVersion?.status === "validated",
    quoteReady: latestVersion?.status === "validated" && erroredMembers.length === 0,
    enrollmentReady: latestVersion?.status === "validated" && validMembers.length > 0,
    renewalReady: !!latestVersion,
    dashboardHealthy: erroredMembers.length === 0,
    caseStatus: caseRecord?.census_status || "not_started",
  };
}