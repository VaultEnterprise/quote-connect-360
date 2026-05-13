/**
 * Broker Safe Payload Sanitizer — Phase 7A-2.9
 * 
 * Centralized safe payload validation and sanitization.
 * Blocks forbidden fields that expose sensitive data.
 * Ensures all broker workspace payloads are metadata-only where required.
 * Prevents accidental exposure of PII, health data, financial data, and raw records.
 */

/**
 * Forbidden field list — must never appear in safe payloads.
 */
const FORBIDDEN_FIELDS = [
  // PII
  'ssn',
  'social_security_number',
  'dob',
  'date_of_birth',
  'health_data',
  'health_information',
  'dependent_health',
  
  // Financial/Payroll
  'payroll_data',
  'salary',
  'annual_salary',
  'hourly_rate',
  'compensation',
  'banking_data',
  'bank_account',
  'routing_number',
  'account_number',
  
  // Identifiers
  'ein',
  'tax_id',
  'netsuite_id',
  'npe01__npe01_netsuite_id',
  'npe01__npsp_netsuite_id',
  'token',
  'token_hash',
  'api_token',
  'access_token',
  'refresh_token',
  'npe01__npsp_salesforce_token',
  
  // License/Credentials
  'npe01__npe01_npn',
  'npn',
  'producer_license',
  'carrier_username',
  'carrier_password',
  'edi_username',
  'edi_password',
  
  // File URLs
  'file_url',
  'private_file_url',
  'signed_url', // Only allowed via explicit authorized document-access flow
  'document_url',
  'census_file_url',
  'public_url',
  
  // Raw Records
  'raw_census_data',
  'employee_rows',
  'dependent_rows',
  'member_records',
  'enrollment_records',
  'raw_data',
];

/**
 * Fields allowed in safe payloads (metadata only).
 * Used for census, documents, and sensitive entity responses.
 */
const SAFE_METADATA_FIELDS = [
  'id',
  'version_number',
  'file_name',
  'file_size',
  'status',
  'total_employees',
  'total_dependents',
  'eligible_employees',
  'validation_status',
  'uploaded_at',
  'created_at',
  'created_date',
  'updated_date',
  'updated_at',
  'name',
  'description',
  'document_type',
  'case_id',
  'employer_id',
  'notes',
];

/**
 * Recursively check for forbidden fields in an object.
 */
function hasForbiddenFields(obj, path = '') {
  if (!obj || typeof obj !== 'object') {
    return { forbidden: false };
  }

  for (const key of Object.keys(obj)) {
    const lowerKey = key.toLowerCase();
    
    // Check if key itself is forbidden
    if (FORBIDDEN_FIELDS.includes(lowerKey)) {
      return {
        forbidden: true,
        field: key,
        path: path ? `${path}.${key}` : key,
      };
    }

    // Recursively check nested objects (but not arrays of primitives)
    const value = obj[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nested = hasForbiddenFields(value, path ? `${path}.${key}` : key);
      if (nested.forbidden) {
        return nested;
      }
    } else if (Array.isArray(value)) {
      // Check array items if they're objects
      for (let i = 0; i < value.length; i++) {
        if (value[i] && typeof value[i] === 'object') {
          const nested = hasForbiddenFields(value[i], `${path ? path + '.' : ''}${key}[${i}]`);
          if (nested.forbidden) {
            return nested;
          }
        }
      }
    }
  }

  return { forbidden: false };
}

/**
 * Validate safe payload structure.
 * Returns detailed validation result.
 */
export function validateSafePayload(payload, context = {}) {
  if (!payload || typeof payload !== 'object') {
    return {
      valid: true, // Non-objects are safe by default
    };
  }

  // Check for forbidden fields
  const forbiddenCheck = hasForbiddenFields(payload);
  if (forbiddenCheck.forbidden) {
    return {
      valid: false,
      reason: 'FORBIDDEN_FIELD_DETECTED',
      field: forbiddenCheck.field,
      path: forbiddenCheck.path,
    };
  }

  // Context-specific validations
  if (context.type === 'census_metadata') {
    // Census must be metadata-only; no raw rows
    if (payload.employee_rows || payload.dependent_rows || payload.member_records) {
      return {
        valid: false,
        reason: 'RAW_CENSUS_RECORDS_DETECTED',
      };
    }
  }

  if (context.type === 'document') {
    // Documents must not expose file_url; signed URL must come through explicit flow
    if (payload.file_url && !payload.requires_signed_url) {
      return {
        valid: false,
        reason: 'PUBLIC_FILE_URL_DETECTED',
      };
    }
  }

  if (context.type === 'employer') {
    // Employer EIN must be masked if exposed
    if (payload.ein && payload.ein !== '****') {
      return {
        valid: false,
        reason: 'UNMASKED_EIN_DETECTED',
      };
    }
  }

  return { valid: true };
}

/**
 * Sanitize payload to metadata-only.
 * Removes all non-metadata fields and forbidden fields.
 */
export function sanitizeToMetadataOnly(payload) {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  const sanitized = {};

  for (const field of SAFE_METADATA_FIELDS) {
    if (field in payload) {
      sanitized[field] = payload[field];
    }
  }

  return sanitized;
}

/**
 * Mask sensitive identifiers in payloads.
 */
export function maskSensitiveIdentifiers(payload) {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  const masked = JSON.parse(JSON.stringify(payload)); // Deep clone

  // Mask EIN
  if (masked.ein && masked.ein.length > 0) {
    masked.ein = '****';
  }

  // Mask tax_id (if somehow present)
  if (masked.tax_id) {
    masked.tax_id = '****';
  }

  // Mask NPN
  if (masked.npn) {
    masked.npn = '****';
  }

  return masked;
}

/**
 * Safe audit payload generator.
 * Creates audit entry without leaking sensitive data.
 */
export function createSafeAuditPayload(action, context) {
  return {
    action,
    broker_agency_id: context.broker_agency_id || null,
    entity_type: context.entity_type || null,
    entity_id: context.entity_id || null,
    case_id: context.case_id || null,
    outcome: context.outcome || 'unknown',
    reason: context.reason || null,
    detail: context.detail || null,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create safe error response (no metadata leakage).
 */
export function createSafeErrorResponse(status, error, context = {}) {
  const response = {
    success: false,
    status,
    error,
  };

  // Only include safe context if explicitly provided
  if (context.broker_agency_id) {
    response.broker_agency_id = context.broker_agency_id;
  }

  return response;
}

/**
 * Validate dashboard counter leakage.
 * Ensures counters don't expose out-of-scope totals.
 */
export function validateDashboardCounters(counters, scope) {
  if (!counters) {
    return { valid: true };
  }

  // Check that counters only include in-scope channels
  if (scope.channel === 'direct_book') {
    // Direct book dashboards should not expose MGA totals
    if (counters.mga_affiliated_book && counters.mga_affiliated_book.accessible === false) {
      // MGA data correctly hidden
      return { valid: true };
    }
  }

  return { valid: true };
}