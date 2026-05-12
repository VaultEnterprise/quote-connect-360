/**
 * MGA Gate 6K — Analytics Payload Policy
 * lib/mga/analyticsPayloadPolicy.js
 *
 * Safe-payload filtering for analytics responses
 * Ensures no PII, raw records, or sensitive data is exposed
 */

export const analyticsPayloadWhitelist = {
  command_summary: ['total_users', 'users_by_role', 'active_users', 'invite_rate_pct', 'trend'],
  case_analytics: ['case_count', 'cases_by_stage', 'census_uploads', 'validation_rate_pct', 'avg_validation_days'],
  quote_analytics: ['scenarios_created', 'by_approval_status', 'transmissions_sent', 'success_rate_pct', 'latency_avg_min', 'top_carriers'],
  export_analytics: ['total_exports', 'by_format', 'by_type', 'avg_duration_sec', 'format_distribution', 'user_frequency'],
  broker_agency_analytics: ['total_agencies', 'by_status', 'creation_rate_7d', 'lifecycle_events', 'contact_count'],
  invite_analytics: ['total_invites_7d', 'total_invites_30d', 'by_role_distribution', 'acceptance_rate_pct', 'pending_count'],
  audit_analytics: ['event_count', 'by_type_distribution', 'access_denials_count', 'scope_violations_count'],
  delivery_analytics: ['deliveries_by_status', 'success_rate_pct', 'retry_avg', 'cancel_count', 'resend_count'],
  exception_analytics: ['total_exceptions', 'by_status_distribution', 'severity_distribution', 'avg_resolution_time_hours'],
};

export const prohibitedPayloadPatterns = [
  'ssn',
  'date_of_birth',
  'email',
  'phone',
  'address',
  'salary',
  'health',
  'medical',
  'claim',
  'benefit_detail',
  'census_member',
  'employee_id',
  'dependent_name',
  'recipient_email',
  'recipient_phone',
  'signed_url',
  'file_uri',
  'private_',
  'secret_',
  'token_',
  'password',
];

/**
 * Check if a value contains prohibited patterns
 */
function containsProhibitedData(value) {
  if (typeof value !== 'string') return false;
  
  const lowerValue = value.toLowerCase();
  return prohibitedPayloadPatterns.some(pattern => lowerValue.includes(pattern));
}

/**
 * Recursively filter object to enforce whitelist
 */
export function enforceAnalyticsPayloadPolicy(data, category) {
  if (!analyticsPayloadWhitelist[category]) {
    return {};
  }

  const whitelist = analyticsPayloadWhitelist[category];
  const filtered = {};

  whitelist.forEach(field => {
    if (data[field] !== undefined) {
      const value = data[field];
      
      // Check for prohibited patterns
      if (typeof value === 'string' && containsProhibitedData(value)) {
        return; // Skip this field
      }

      filtered[field] = value;
    }
  });

  return filtered;
}

export default {
  analyticsPayloadWhitelist,
  prohibitedPayloadPatterns,
  enforceAnalyticsPayloadPolicy,
};