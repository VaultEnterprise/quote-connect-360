/**
 * Broker Compliance Validation Contract — Phase 7A-1.4
 *
 * Manages NPN/license validation, compliance document tracking, compliance hold logic,
 * and compliance override approvals. All operations are feature-flag gated (fail-closed).
 *
 * Feature flags: All false (fail-closed)
 * Scope enforcement: Masked 404 on cross-org access
 * Permission enforcement: 403 on unauthorized actions
 * Audit logging: Append-only for all material events
 * Private documents: Signed references only, never raw public URLs
 * Compliance hold: Blocks portal access and approval unless override approved
 *
 * @module brokerComplianceValidationContract
 */

import crypto from 'crypto';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const FEATURE_FLAGS = {
  BROKER_COMPLIANCE_VALIDATION_ENABLED: false,
  BROKER_COMPLIANCE_HOLD_ENFORCEMENT_ENABLED: false,
  BROKER_COMPLIANCE_OVERRIDE_ENABLED: false,
};

const NPN_FORMAT_REGEX = /^[0-9]{1,8}$/; // NPN is 1-8 digits
const REQUIRED_LICENSE_STATES = ['primary_state']; // Customizable per broker
const LICENSE_EXPIRY_WARNING_DAYS = 90;
const DOCUMENT_EXPIRY_WARNING_DAYS = 90;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Normalize NPN (remove spaces, dashes, leading zeros).
 * @param {string} npn - Raw NPN input
 * @returns {string} Normalized NPN (numeric digits only)
 */
function normalizeNPN(npn) {
  if (!npn) return '';
  return npn.replace(/[\s\-]/g, '').replace(/^0+/, '');
}

/**
 * Validate NPN format (1-8 digits).
 * @param {string} npn - Normalized NPN
 * @returns {boolean} True if valid format
 */
function isValidNPNFormat(npn) {
  return NPN_FORMAT_REGEX.test(npn);
}

/**
 * Assert that actor has required permission.
 * @param {object} context - Authenticated context
 * @param {string} permission - Permission key (e.g., 'platform_broker.compliance_override')
 * @throws {Error} 403 if permission denied
 */
function assertPermission(context, permission) {
  // All permissions default false during Phase 7A-1
  const hasPermission = false;
  if (!hasPermission) {
    throw {
      status: 403,
      code: 'PERMISSION_DENIED',
      message: `Permission denied: ${permission}`,
    };
  }
}

/**
 * Assert that actor has access to resource within their scope.
 * @param {object} context - Authenticated context
 * @param {object} resource - Resource with tenant_id
 * @throws {Error} 404 masked if cross-tenant access
 */
function assertScopeAccess(context, resource) {
  if (context.tenant_id !== resource.tenant_id) {
    throw {
      status: 404,
      code: 'NOT_FOUND',
      message: 'Resource not visible in your scope',
    };
  }
}

/**
 * Create audit event (append-only, immutable).
 * @param {object} base44 - SDK client
 * @param {object} event - Audit event data
 */
async function createAuditEvent(base44, event) {
  const auditEventData = {
    tenant_id: event.tenant_id,
    actor_user_id: event.actor_user_id,
    actor_role: event.actor_role,
    action: event.action,
    detail: event.detail || '',
    entity_type: event.entity_type || 'BrokerAgencyOnboardingCase',
    entity_id: event.entity_id || '',
    outcome: event.outcome || 'success',
    audit_trace_id: event.audit_trace_id || crypto.randomUUID(),
  };

  await base44.asServiceRole.entities.AuditEvent.create(auditEventData);
}

/**
 * Check if date is within warning threshold.
 * @param {string} expirationDate - ISO 8601 date string
 * @param {number} warningDays - Days until warning threshold
 * @returns {boolean} True if expiring soon
 */
function isExpiringSoon(expirationDate, warningDays = LICENSE_EXPIRY_WARNING_DAYS) {
  const expiry = new Date(expirationDate);
  const today = new Date();
  const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  return daysUntilExpiry > 0 && daysUntilExpiry <= warningDays;
}

/**
 * Check if date has expired.
 * @param {string} expirationDate - ISO 8601 date string
 * @returns {boolean} True if expired
 */
function isExpired(expirationDate) {
  const expiry = new Date(expirationDate);
  const today = new Date();
  return expiry < today;
}

// ============================================================================
// CONTRACT METHODS
// ============================================================================

/**
 * Validate and update broker NPN (applicant-facing).
 *
 * @param {object} base44 - SDK client
 * @param {object} payload - { tenant_id, broker_agency_id, npn }
 * @returns {object} { success: true, npn_normalized }
 * @throws {Error} Feature flag or validation error
 */
export async function validateBrokerNPN(base44, payload) {
  // Feature flag check: fail-closed
  if (!FEATURE_FLAGS.BROKER_COMPLIANCE_VALIDATION_ENABLED) {
    throw {
      status: 403,
      code: 'NOT_AUTHORIZED_FOR_GATE_7A_1',
      message: 'NPN validation is not yet authorized for this phase',
    };
  }

  const { tenant_id, broker_agency_id, npn } = payload;
  const auditTraceId = crypto.randomUUID();

  try {
    // Normalize NPN
    const normalizedNPN = normalizeNPN(npn);

    // Validate format
    if (!isValidNPNFormat(normalizedNPN)) {
      throw {
        status: 400,
        code: 'INVALID_NPN_FORMAT',
        message: 'NPN must be 1-8 digits',
      };
    }

    // Get onboarding case
    const cases = await base44.asServiceRole.entities.BrokerAgencyOnboardingCase.filter(
      { broker_agency_id, tenant_id }
    );
    if (cases.length === 0) {
      throw {
        status: 404,
        code: 'NOT_FOUND',
        message: 'Onboarding case not found',
      };
    }

    const onboardingCase = cases[0];

    // Update NPN
    await base44.asServiceRole.entities.BrokerAgencyOnboardingCase.update(
      onboardingCase.id,
      {
        npn: normalizedNPN,
        npn_validated: true,
        npn_validation_error: null,
      }
    );

    // Audit: BROKER_NPN_VALIDATED
    await createAuditEvent(base44, {
      tenant_id,
      actor_user_id: 'applicant',
      actor_role: 'applicant',
      action: 'BROKER_NPN_VALIDATED',
      detail: `NPN validated: ${normalizedNPN}`,
      entity_type: 'BrokerAgencyOnboardingCase',
      entity_id: onboardingCase.id,
      outcome: 'success',
      audit_trace_id: auditTraceId,
    });

    return { success: true, npn_normalized: normalizedNPN };
  } catch (error) {
    if (error.status) throw error;
    throw {
      status: 500,
      code: 'VALIDATION_ERROR',
      message: error.message,
    };
  }
}

/**
 * Validate and update broker licenses (applicant-facing).
 *
 * @param {object} base44 - SDK client
 * @param {object} payload - { tenant_id, broker_agency_id, license_states, license_numbers, license_expirations }
 * @returns {object} { success: true, licenses_validated, warnings }
 * @throws {Error} Feature flag or validation error
 */
export async function validateBrokerLicenses(base44, payload) {
  // Feature flag check: fail-closed
  if (!FEATURE_FLAGS.BROKER_COMPLIANCE_VALIDATION_ENABLED) {
    throw {
      status: 403,
      code: 'NOT_AUTHORIZED_FOR_GATE_7A_1',
      message: 'License validation is not yet authorized for this phase',
    };
  }

  const { tenant_id, broker_agency_id, license_states, license_numbers, license_expirations } = payload;
  const auditTraceId = crypto.randomUUID();
  const warnings = [];
  const expiredLicenses = [];
  const expiringSoonLicenses = [];

  try {
    // Validate required states present
    if (!license_states || license_states.length === 0) {
      throw {
        status: 400,
        code: 'MISSING_LICENSE_STATES',
        message: 'At least one license state is required',
      };
    }

    // Check for expired/expiring licenses
    for (const state of license_states) {
      const expirationDate = license_expirations?.[state];
      if (!expirationDate) {
        warnings.push(`Missing expiration date for ${state}`);
        continue;
      }

      if (isExpired(expirationDate)) {
        expiredLicenses.push(state);
        warnings.push(`License in ${state} is expired`);
      } else if (isExpiringSoon(expirationDate)) {
        expiringSoonLicenses.push(state);
        warnings.push(`License in ${state} expires within 90 days`);
      }
    }

    // Get onboarding case
    const cases = await base44.asServiceRole.entities.BrokerAgencyOnboardingCase.filter(
      { broker_agency_id, tenant_id }
    );
    if (cases.length === 0) {
      throw {
        status: 404,
        code: 'NOT_FOUND',
        message: 'Onboarding case not found',
      };
    }

    const onboardingCase = cases[0];

    // Update licenses
    await base44.asServiceRole.entities.BrokerAgencyOnboardingCase.update(
      onboardingCase.id,
      {
        license_states,
        license_numbers: license_numbers || {},
        license_expirations: license_expirations || {},
        expired_licenses: expiredLicenses,
        expiring_soon_licenses: expiringSoonLicenses,
        licenses_validated: true,
        licenses_validation_error: null,
      }
    );

    // Audit: BROKER_LICENSE_VALIDATED
    await createAuditEvent(base44, {
      tenant_id,
      actor_user_id: 'applicant',
      actor_role: 'applicant',
      action: 'BROKER_LICENSE_VALIDATED',
      detail: `Licenses validated: ${license_states.length} states, ${expiredLicenses.length} expired, ${expiringSoonLicenses.length} expiring soon`,
      entity_type: 'BrokerAgencyOnboardingCase',
      entity_id: onboardingCase.id,
      outcome: 'success',
      audit_trace_id: auditTraceId,
    });

    // Audit expired/expiring warnings
    if (expiredLicenses.length > 0) {
      await createAuditEvent(base44, {
        tenant_id,
        actor_user_id: 'applicant',
        actor_role: 'applicant',
        action: 'BROKER_LICENSE_EXPIRED',
        detail: `Expired licenses: ${expiredLicenses.join(', ')}`,
        entity_type: 'BrokerAgencyOnboardingCase',
        entity_id: onboardingCase.id,
        outcome: 'success',
        audit_trace_id: auditTraceId,
      });
    }

    if (expiringSoonLicenses.length > 0) {
      await createAuditEvent(base44, {
        tenant_id,
        actor_user_id: 'applicant',
        actor_role: 'applicant',
        action: 'BROKER_LICENSE_EXPIRING_WARNING',
        detail: `Expiring soon: ${expiringSoonLicenses.join(', ')}`,
        entity_type: 'BrokerAgencyOnboardingCase',
        entity_id: onboardingCase.id,
        outcome: 'success',
        audit_trace_id: auditTraceId,
      });
    }

    return {
      success: true,
      licenses_validated: license_states.length,
      warnings,
      expired_licenses: expiredLicenses,
      expiring_soon_licenses: expiringSoonLicenses,
    };
  } catch (error) {
    if (error.status) throw error;
    throw {
      status: 500,
      code: 'VALIDATION_ERROR',
      message: error.message,
    };
  }
}

/**
 * Record compliance document submission (private storage reference).
 *
 * @param {object} base44 - SDK client
 * @param {object} payload - { tenant_id, broker_agency_id, document_type, document_id, expiration_date }
 * @returns {object} { success: true, warnings }
 * @throws {Error} Feature flag or validation error
 */
export async function submitComplianceDocument(base44, payload) {
  // Feature flag check: fail-closed
  if (!FEATURE_FLAGS.BROKER_COMPLIANCE_VALIDATION_ENABLED) {
    throw {
      status: 403,
      code: 'NOT_AUTHORIZED_FOR_GATE_7A_1',
      message: 'Document submission is not yet authorized for this phase',
    };
  }

  const { tenant_id, broker_agency_id, document_type, document_id, expiration_date } = payload;
  const auditTraceId = crypto.randomUUID();
  const warnings = [];

  try {
    // Get onboarding case
    const cases = await base44.asServiceRole.entities.BrokerAgencyOnboardingCase.filter(
      { broker_agency_id, tenant_id }
    );
    if (cases.length === 0) {
      throw {
        status: 404,
        code: 'NOT_FOUND',
        message: 'Onboarding case not found',
      };
    }

    const onboardingCase = cases[0];
    const updateData = {
      compliance_documents_submitted: true,
      compliance_submitted_at: new Date().toISOString(),
    };

    // Update document field and check expiration
    if (document_type === 'eo_certificate') {
      updateData.eo_certificate_document_id = document_id;
      updateData.eo_certificate_submitted = true;
      if (expiration_date) {
        updateData.eo_certificate_expiration = expiration_date;
        if (isExpiringSoon(expiration_date)) {
          warnings.push('E&O certificate expires within 90 days');
        }
        if (isExpired(expiration_date)) {
          warnings.push('E&O certificate is already expired');
        }
      }
    } else if (document_type === 'w9') {
      updateData.w9_document_id = document_id;
      updateData.w9_submitted = true;
    }

    await base44.asServiceRole.entities.BrokerAgencyOnboardingCase.update(
      onboardingCase.id,
      updateData
    );

    // Audit: BROKER_COMPLIANCE_DOCUMENT_UPLOADED
    await createAuditEvent(base44, {
      tenant_id,
      actor_user_id: 'applicant',
      actor_role: 'applicant',
      action: 'BROKER_COMPLIANCE_DOCUMENT_UPLOADED',
      detail: `Compliance document submitted: ${document_type}`,
      entity_type: 'BrokerAgencyOnboardingCase',
      entity_id: onboardingCase.id,
      outcome: 'success',
      audit_trace_id: auditTraceId,
    });

    return { success: true, warnings };
  } catch (error) {
    if (error.status) throw error;
    throw {
      status: 500,
      code: 'SUBMISSION_ERROR',
      message: error.message,
    };
  }
}

/**
 * Place compliance hold (platform operator action, permission-gated).
 *
 * @param {object} base44 - SDK client
 * @param {object} context - Authenticated context { tenant_id, user_id, role }
 * @param {object} payload - { broker_agency_id, reason }
 * @returns {object} { success: true }
 * @throws {Error} Permission/scope error
 */
export async function placeComplianceHold(base44, context, payload) {
  // Feature flag check
  if (!FEATURE_FLAGS.BROKER_COMPLIANCE_HOLD_ENFORCEMENT_ENABLED) {
    throw {
      status: 403,
      code: 'NOT_AUTHORIZED_FOR_GATE_7A_1',
      message: 'Compliance hold enforcement is not yet authorized for this phase',
    };
  }

  // Permission check: fail-closed
  assertPermission(context, 'platform_broker.compliance_hold');

  const { tenant_id } = context;
  const { broker_agency_id, reason } = payload;
  const auditTraceId = crypto.randomUUID();

  try {
    // Get onboarding case
    const cases = await base44.asServiceRole.entities.BrokerAgencyOnboardingCase.filter(
      { broker_agency_id, tenant_id }
    );
    if (cases.length === 0) {
      throw {
        status: 404,
        code: 'NOT_FOUND',
        message: 'Onboarding case not found',
      };
    }

    const onboardingCase = cases[0];

    // Place hold
    await base44.asServiceRole.entities.BrokerAgencyOnboardingCase.update(
      onboardingCase.id,
      {
        compliance_hold: true,
        compliance_hold_reason: reason,
        compliance_hold_placed_at: new Date().toISOString(),
        compliance_hold_placed_by: context.user_id,
        compliance_status: 'compliance_hold',
      }
    );

    // Audit: BROKER_COMPLIANCE_HOLD_PLACED
    await createAuditEvent(base44, {
      tenant_id,
      actor_user_id: context.user_id,
      actor_role: context.role,
      action: 'BROKER_COMPLIANCE_HOLD_PLACED',
      detail: `Compliance hold placed: ${reason}`,
      entity_type: 'BrokerAgencyOnboardingCase',
      entity_id: onboardingCase.id,
      outcome: 'success',
      audit_trace_id: auditTraceId,
    });

    return { success: true };
  } catch (error) {
    if (error.status) throw error;
    throw {
      status: 500,
      code: 'HOLD_ERROR',
      message: error.message,
    };
  }
}

/**
 * Release compliance hold (platform operator action, permission-gated).
 *
 * @param {object} base44 - SDK client
 * @param {object} context - Authenticated context { tenant_id, user_id, role }
 * @param {object} payload - { broker_agency_id }
 * @returns {object} { success: true }
 * @throws {Error} Permission/scope error
 */
export async function releaseComplianceHold(base44, context, payload) {
  // Feature flag check
  if (!FEATURE_FLAGS.BROKER_COMPLIANCE_HOLD_ENFORCEMENT_ENABLED) {
    throw {
      status: 403,
      code: 'NOT_AUTHORIZED_FOR_GATE_7A_1',
      message: 'Compliance hold enforcement is not yet authorized for this phase',
    };
  }

  // Permission check: fail-closed
  assertPermission(context, 'platform_broker.compliance_hold');

  const { tenant_id } = context;
  const { broker_agency_id } = payload;
  const auditTraceId = crypto.randomUUID();

  try {
    // Get onboarding case
    const cases = await base44.asServiceRole.entities.BrokerAgencyOnboardingCase.filter(
      { broker_agency_id, tenant_id }
    );
    if (cases.length === 0) {
      throw {
        status: 404,
        code: 'NOT_FOUND',
        message: 'Onboarding case not found',
      };
    }

    const onboardingCase = cases[0];

    // Release hold
    await base44.asServiceRole.entities.BrokerAgencyOnboardingCase.update(
      onboardingCase.id,
      {
        compliance_hold: false,
        compliance_hold_released_at: new Date().toISOString(),
        compliance_status: 'compliant',
      }
    );

    // Audit: BROKER_COMPLIANCE_HOLD_RELEASED
    await createAuditEvent(base44, {
      tenant_id,
      actor_user_id: context.user_id,
      actor_role: context.role,
      action: 'BROKER_COMPLIANCE_HOLD_RELEASED',
      detail: 'Compliance hold released',
      entity_type: 'BrokerAgencyOnboardingCase',
      entity_id: onboardingCase.id,
      outcome: 'success',
      audit_trace_id: auditTraceId,
    });

    return { success: true };
  } catch (error) {
    if (error.status) throw error;
    throw {
      status: 500,
      code: 'RELEASE_ERROR',
      message: error.message,
    };
  }
}

/**
 * Approve compliance override (platform operator action, permission-gated).
 *
 * @param {object} base44 - SDK client
 * @param {object} context - Authenticated context { tenant_id, user_id, role }
 * @param {object} payload - { broker_agency_id, override_reason }
 * @returns {object} { success: true }
 * @throws {Error} Permission/scope error
 */
export async function approveComplianceOverride(base44, context, payload) {
  // Feature flag check
  if (!FEATURE_FLAGS.BROKER_COMPLIANCE_OVERRIDE_ENABLED) {
    throw {
      status: 403,
      code: 'NOT_AUTHORIZED_FOR_GATE_7A_1',
      message: 'Compliance override is not yet authorized for this phase',
    };
  }

  // Permission check: fail-closed
  assertPermission(context, 'platform_broker.compliance_override');

  const { tenant_id } = context;
  const { broker_agency_id, override_reason } = payload;
  const auditTraceId = crypto.randomUUID();

  try {
    // Get onboarding case
    const cases = await base44.asServiceRole.entities.BrokerAgencyOnboardingCase.filter(
      { broker_agency_id, tenant_id }
    );
    if (cases.length === 0) {
      throw {
        status: 404,
        code: 'NOT_FOUND',
        message: 'Onboarding case not found',
      };
    }

    const onboardingCase = cases[0];

    // Approve override
    await base44.asServiceRole.entities.BrokerAgencyOnboardingCase.update(
      onboardingCase.id,
      {
        compliance_override_approved: true,
        compliance_override_reason: override_reason,
        compliance_override_approved_by: context.user_id,
        compliance_override_approved_at: new Date().toISOString(),
        compliance_hold: false,
        compliance_status: 'compliant',
      }
    );

    // Audit: BROKER_COMPLIANCE_OVERRIDE_APPROVED
    await createAuditEvent(base44, {
      tenant_id,
      actor_user_id: context.user_id,
      actor_role: context.role,
      action: 'BROKER_COMPLIANCE_OVERRIDE_APPROVED',
      detail: `Compliance override approved: ${override_reason}`,
      entity_type: 'BrokerAgencyOnboardingCase',
      entity_id: onboardingCase.id,
      outcome: 'success',
      audit_trace_id: auditTraceId,
    });

    return { success: true };
  } catch (error) {
    if (error.status) throw error;
    throw {
      status: 500,
      code: 'OVERRIDE_ERROR',
      message: error.message,
    };
  }
}

export default {
  validateBrokerNPN,
  validateBrokerLicenses,
  submitComplianceDocument,
  placeComplianceHold,
  releaseComplianceHold,
  approveComplianceOverride,
};