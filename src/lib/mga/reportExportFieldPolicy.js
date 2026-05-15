/**
 * MGA Gate 6C — Report Export Field Policy
 * Defines field inclusion/exclusion/masking rules per export type.
 * Enforced before serialization in reportExportService.js.
 */

// Fields that are NEVER exported — system, security, or migration-sensitive
const NEVER_EXPORT_FIELDS = [
  'access_token',
  'docusign_envelope_id',
  'docusign_signed_at',
  'docusign_document_url',
  'docusign_declined_reason',
  'mga_migration_batch_id',
  'mga_migration_status',
  'mga_migration_anomaly_class',
  'mga_migration_anomaly_detail',
  'mga_business_approver',
  'mga_business_approved_at',
  'gradient_ai_data',
  'validation_issues',
];

// Fields that are RESTRICTED — PII/PHI sensitive
const RESTRICTED_FIELDS = {
  full_name: true,
  email: true,
  phone: true,
  address: true,
  city: true,
  state: true,
  zip: true,
  ssn_last4: true,
  date_of_birth: true,
  annual_salary: true,
  tax_id_ein: true,
  producer_license_number: true,
  primary_contact_name: true,
  primary_contact_email: true,
  primary_contact_phone: true,
};

// Fields that are MASKED — PII displayed as partial/redacted
const MASKED_FIELDS = {
  phone: (val) => val ? val.slice(-4).padStart(val.length, '*') : val,
  email: (val) => val ? val.split('@')[0].slice(0, 1) + '***@' + val.split('@')[1] : val,
  ssn_last4: (val) => val ? '***-' + val : val,
};

/**
 * Export type field policies
 * Each policy defines allowed and excluded fields.
 */
export const FIELD_POLICIES = {
  case_summary: {
    allowed: [
      'id',
      'case_number',
      'case_type',
      'effective_date',
      'stage',
      'priority',
      'employer_name',
      'employee_count',
      'census_status',
      'quote_status',
      'enrollment_status',
      'last_activity_date',
      'target_close_date',
      'closed_date',
      'closed_reason',
      'notes',
    ],
    excluded: ['created_by', 'master_general_agent_id', 'master_group_id', 'agency_id', 'employer_group_id', 'assigned_to'],
    masked: [],
  },

  quote_scenario: {
    allowed: [
      'id',
      'case_id',
      'name',
      'description',
      'status',
      'effective_date',
      'products_included',
      'carriers_included',
      'contribution_strategy',
      'total_monthly_premium',
      'employer_monthly_cost',
      'employee_monthly_cost_avg',
      'plan_count',
      'is_recommended',
      'recommendation_score',
      'confidence_level',
      'disruption_score',
      'quoted_at',
      'approval_status',
      'approval_notes',
    ],
    excluded: ['master_general_agent_id', 'master_group_id', 'rate_locked_by', 'versions'],
    masked: [],
  },

  census_member: {
    allowed: [
      'id',
      'census_version_id',
      'case_id',
      'employee_id',
      'first_name',
      'last_name',
      'gender',
      'hire_date',
      'employment_status',
      'employment_type',
      'hours_per_week',
      'job_title',
      'department',
      'location',
      'class_code',
      'is_eligible',
      'dependent_count',
      'coverage_tier',
      'validation_status',
    ],
    excluded: [
      'master_general_agent_id',
      'master_group_id',
      'date_of_birth',
      'ssn_last4',
      'email',
      'phone',
      'address',
      'city',
      'state',
      'zip',
      'annual_salary',
      'eligibility_reason',
    ],
    masked: [],
  },

  audit_activity: {
    allowed: [
      'id',
      'case_id',
      'actor_email',
      'actor_name',
      'actor_role',
      'action',
      'detail',
      'entity_type',
      'old_value',
      'new_value',
      'outcome',
      'created_date',
    ],
    excluded: [
      'master_general_agent_id',
      'master_group_id',
      'correlation_id',
      'mga_migration_batch_id',
      'mga_migration_status',
    ],
    masked: ['actor_email'],
  },

  mga_summary: {
    allowed: [
      'id',
      'name',
      'legal_entity_name',
      'dba_name',
      'code',
      'status',
      'carrier_access_status',
      'agreement_status',
      'compliance_status',
      'onboarding_status',
      'activation_date',
      'suspension_date',
      'created_date',
    ],
    excluded: [
      'primary_contact_name',
      'primary_contact_email',
      'primary_contact_phone',
      'business_address_line1',
      'business_address_line2',
      'city',
      'state',
      'zip',
      'tax_id_ein',
      'producer_license_number',
      'notes',
    ],
    masked: [],
  },
};

/**
 * Apply field policy to a record.
 * Removes disallowed fields, applies masking where needed.
 * @param {Object} record - The record to filter
 * @param {string} exportType - Export type (case_summary, quote_scenario, etc.)
 * @returns {Object} Filtered record
 */
export function applyFieldPolicy(record, exportType) {
  if (!record || typeof record !== 'object') return record;

  const policy = FIELD_POLICIES[exportType];
  if (!policy) {
    console.warn(`No field policy found for export type: ${exportType}`);
    return record;
  }

  const filtered = {};

  // Copy allowed fields
  for (const field of policy.allowed) {
    if (field in record) {
      let value = record[field];

      // Apply masking if needed
      if (policy.masked.includes(field) && MASKED_FIELDS[field]) {
        value = MASKED_FIELDS[field](value);
      }

      filtered[field] = value;
    }
  }

  // Ensure no never-export fields are included
  for (const field of NEVER_EXPORT_FIELDS) {
    delete filtered[field];
  }

  return filtered;
}

/**
 * Validate that a record doesn't contain restricted fields.
 * Used for security verification; throws if violation found.
 * @param {Object} record - The record to validate
 * @param {string} exportType - Export type
 * @throws {Error} If restricted field detected
 */
export function validateFieldPolicySafety(record, exportType) {
  if (!record || typeof record !== 'object') return;

  const policy = FIELD_POLICIES[exportType];
  if (!policy) return;

  // Check that no excluded fields are present
  for (const field of policy.excluded) {
    if (field in record && record[field] !== undefined && record[field] !== null) {
      throw new Error(`Restricted field "${field}" detected in ${exportType} export — policy violation`);
    }
  }

  // Check that no never-export fields are present
  for (const field of NEVER_EXPORT_FIELDS) {
    if (field in record && record[field] !== undefined && record[field] !== null) {
      throw new Error(`Never-export field "${field}" detected in export — policy violation`);
    }
  }
}