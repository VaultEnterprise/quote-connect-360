/**
 * Gate 6D — Export Delivery History & Tracking
 * Safe payload field allowlist and prohibited-field enforcement.
 * Ensures no signed URLs, file URIs, PHI, tokens, or stack traces are returned.
 *
 * Step 3 of Gate 6D Implementation Work Order.
 */

// ─── Allowed History Fields ───────────────────────────────────────────────────

export const ALLOWED_HISTORY_FIELDS = new Set([
  'export_request_id',
  'report_type',
  'format',
  'status',
  'requested_by_user_id',
  'requested_by_role',
  'requested_at',
  'generated_at',
  'downloaded_at',
  'expires_at',
  'record_count',
  'failure_reason_code',
  'artifact_available',
]);

// ─── Prohibited Field Patterns ────────────────────────────────────────────────
// Any field matching these patterns must NEVER appear in a history response.

const PROHIBITED_FIELD_PATTERNS = [
  /signed_url/i,
  /presigned_url/i,
  /download_url/i,
  /private_url/i,
  /file_uri/i,
  /storage_path/i,
  /access_token/i,
  /session_token/i,
  /^jwt$/i,
  /base44_token/i,
  /service_role_key/i,
  /stack_?trace/i,
  /internal_error/i,
  /raw_payload/i,
  /export_body/i,
  /phi_/i,
  /pii_/i,
  /ssn/i,
  /date_of_birth/i,
];

// ─── Utility Functions ────────────────────────────────────────────────────────

/**
 * Returns true if a field name matches any prohibited pattern.
 */
function isProhibitedField(fieldName) {
  return PROHIBITED_FIELD_PATTERNS.some(pattern => pattern.test(fieldName));
}

/**
 * Applies the safe payload policy to a single history record.
 * Strips all fields not in the allowlist.
 * Throws if a prohibited field is detected before stripping (security scan).
 */
export function applySafePayloadPolicy(record) {
  if (!record || typeof record !== 'object') return {};

  // Security scan — throw if prohibited field present before filtering
  for (const key of Object.keys(record)) {
    if (isProhibitedField(key)) {
      throw new Error(`PAYLOAD_POLICY_VIOLATION: Prohibited field detected: ${key}`);
    }
  }

  // Apply allowlist — only return permitted fields
  const safe = {};
  for (const key of ALLOWED_HISTORY_FIELDS) {
    if (key in record) {
      safe[key] = record[key];
    }
  }
  return safe;
}

/**
 * Applies safe payload policy to an array of history records.
 */
export function applySafePayloadPolicyToList(records) {
  if (!Array.isArray(records)) return [];
  return records.map(applySafePayloadPolicy);
}

/**
 * Validates a payload is clean — used in tests.
 * Returns { valid: boolean, violations: string[] }
 */
export function validatePayloadSafety(record) {
  const violations = [];
  if (!record || typeof record !== 'object') return { valid: true, violations };
  for (const key of Object.keys(record)) {
    if (isProhibitedField(key)) violations.push(key);
    if (!ALLOWED_HISTORY_FIELDS.has(key)) violations.push(`unlisted:${key}`);
  }
  return { valid: violations.length === 0, violations };
}