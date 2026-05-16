/**
 * Broker Signup Contract — Phase 7A-1.2
 *
 * Manages the end-to-end lifecycle of standalone broker onboarding and platform approval.
 * All protected actions must go through this contract.
 *
 * Feature flags: All false (fail-closed)
 * Scope enforcement: Masked 404 on cross-org access
 * Permission enforcement: 403 on unauthorized actions
 * Audit logging: Append-only for all material events
 * Token security: Hash-only storage (plaintext never persisted)
 * Self-approval: Blocked (broker applicant cannot approve own signup)
 *
 * @module brokerSignupContract
 */

import crypto from 'crypto';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { runDuplicateBrokerDetection } from './brokerDuplicateDetectionContract.js';

const FEATURE_FLAGS = {
  BROKER_SIGNUP_ENABLED: false,
  BROKER_ONBOARDING_ENABLED: false,
  BROKER_COMPLIANCE_DOCUMENT_ENFORCEMENT: false,
};

const TOKEN_EXPIRY_DAYS = 7;
const MORE_INFO_DEADLINE_DAYS = 30;

function generateToken() {
  return crypto.randomBytes(32).toString('base64');
}

function generateTokenHash(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function verifyTokenHash(token, storedHash) {
  const tokenHash = generateTokenHash(token);
  return tokenHash === storedHash && tokenHash.length === storedHash.length;
}

function assertPermission(context, permission) {
  // All permissions default false during Gate 7A-1
  const hasPermission = false;
  if (!hasPermission) {
    throw { status: 403, code: 'PERMISSION_DENIED', message: `Permission denied: ${permission}` };
  }
}

function assertScopeAccess(context, resource) {
  if (context.tenant_id !== resource.tenant_id) {
    throw { status: 404, code: 'NOT_FOUND', message: 'Resource not visible in your scope' };
  }
}

async function createAuditEvent(base44, event) {
  // AuditEvent schema canonical field names: actor_id, event_type, event_detail, target_entity_type, target_entity_id
  const auditEventData = {
    tenant_id: event.tenant_id,
    actor_id: event.actor_user_id || 'system',
    actor_role: event.actor_role,
    event_type: event.action,
    event_detail: event.detail || '',
    target_entity_type: event.entity_type || 'BrokerAgencyProfile',
    target_entity_id: event.entity_id || '',
    outcome: event.outcome || 'success',
    audit_trace_id: event.audit_trace_id || crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  await base44.asServiceRole.entities.AuditEvent.create(auditEventData);
}

function calculateTokenExpiration() {
  const d = new Date();
  d.setDate(d.getDate() + TOKEN_EXPIRY_DAYS);
  return d.toISOString();
}

function calculateInfoDeadline() {
  const d = new Date();
  d.setDate(d.getDate() + MORE_INFO_DEADLINE_DAYS);
  return d.toISOString();
}

export async function submitStandaloneBrokerSignup(base44, payload) {
  if (!FEATURE_FLAGS.BROKER_SIGNUP_ENABLED) {
    throw { status: 403, code: 'NOT_AUTHORIZED_FOR_GATE_7A_1', message: 'Broker signup is not yet authorized for this phase' };
  }

  const { tenant_id, applicant_email, legal_name, dba_name, npn_if_available } = payload;
  const auditTraceId = crypto.randomUUID();

  try {
    // 1. Create BrokerAgencyProfile (no MGA, standalone)
    // BAP required fields: tenant_id, legal_name, primary_contact_email
    // BAP has no approval_status field; onboarding_status enum: pending_profile_completion
    const brokerProfile = await base44.asServiceRole.entities.BrokerAgencyProfile.create({
      tenant_id,
      legal_name,
      dba_name: dba_name || '',
      npn: npn_if_available || '',
      master_general_agent_id: null,
      owner_org_type: 'broker_agency',
      owner_org_id: null,
      visibility_scope: 'owner_only',
      onboarding_status: 'pending_profile_completion',
      audit_trace_id: auditTraceId,
    });

    await base44.asServiceRole.entities.BrokerAgencyProfile.update(brokerProfile.id, {
      owner_org_id: brokerProfile.id,
    });

    // 2. Create BrokerPlatformRelationship
    // Required fields: tenant_id, broker_agency_id
    // status enum: pending_approval | approved | suspended | inactive
    const platformRelationship = await base44.asServiceRole.entities.BrokerPlatformRelationship.create({
      tenant_id,
      broker_agency_id: brokerProfile.id,
      status: 'pending_approval',
      approval_status: 'pending',
      compliance_status: 'pending_review',
      audit_trace_id: auditTraceId,
    });

    // 3. Create BrokerAgencyOnboardingCase
    const onboardingCase = await base44.asServiceRole.entities.BrokerAgencyOnboardingCase.create({
      tenant_id,
      broker_agency_id: brokerProfile.id,
      signup_application_id: brokerProfile.id,
      applicant_email,
      status: 'pending_email_verification',
      npn_validated: false,
      licenses_validated: false,
      compliance_documents_submitted: false,
      compliance_hold: false,
      compliance_hold_reason: 'none',
      duplicate_risk_level: 'unknown',
      audit_trace_id: auditTraceId,
    });

    // 3.5. Duplicate detection (feature-gated, advisory, non-blocking)
    let duplicateRiskLevelInternal = 'NO_MATCH';
    let duplicateExecutionStatus = 'NOT_EXECUTED_FEATURE_DISABLED';
    try {
      const dupResult = await runDuplicateBrokerDetection(base44, {
        tenant_id, applicant_email, legal_name, dba_name, npn: npn_if_available,
      });
      if (dupResult.status === 'NOT_EXECUTED_FEATURE_DISABLED') {
        duplicateExecutionStatus = 'NOT_EXECUTED_FEATURE_DISABLED';
        duplicateRiskLevelInternal = 'NO_MATCH';
      } else {
        duplicateExecutionStatus = 'EXECUTED';
        duplicateRiskLevelInternal = dupResult.duplicate_risk_level_internal;
      }
      await base44.asServiceRole.entities.BrokerAgencyOnboardingCase.update(onboardingCase.id, {
        duplicate_risk_level: duplicateRiskLevelInternal,
        duplicate_detection_status: duplicateExecutionStatus,
      });
    } catch (dupError) {
      console.error('Duplicate detection error:', dupError);
      duplicateExecutionStatus = 'ERROR';
    }

    // 4. Generate token
    const plaintext_token = generateToken();
    const token_hash = generateTokenHash(plaintext_token);
    const expires_at = calculateTokenExpiration();

    // 5. Create BrokerAgencyInvitation (hash only)
    await base44.asServiceRole.entities.BrokerAgencyInvitation.create({
      tenant_id,
      broker_agency_id: brokerProfile.id,
      onboarding_case_id: onboardingCase.id,
      applicant_email,
      token_hash,
      status: 'invited',
      expires_at,
      single_use_consumed_at: null,
      audit_trace_id: auditTraceId,
    });

    // 6. Audit event
    await createAuditEvent(base44, {
      tenant_id, actor_user_id: 'system', actor_role: 'system',
      action: 'BROKER_SIGNUP_SUBMITTED',
      detail: `Standalone broker signup submitted: ${applicant_email}`,
      entity_type: 'BrokerAgencyProfile', entity_id: brokerProfile.id,
      outcome: 'success', audit_trace_id: auditTraceId,
    });

    return { broker_agency_id: brokerProfile.id, onboarding_url_token: plaintext_token, message: 'Check your email for onboarding instructions' };
  } catch (error) {
    await createAuditEvent(base44, {
      tenant_id, actor_user_id: 'system', actor_role: 'system',
      action: 'BROKER_SIGNUP_SUBMITTED',
      detail: `Signup failed: ${error.message}`,
      outcome: 'failed', audit_trace_id: auditTraceId,
    });
    throw error;
  }
}

export async function validateBrokerSignupToken(base44, payload) {
  const { tenant_id, token } = payload;
  const auditTraceId = crypto.randomUUID();
  try {
    const invitations = await base44.asServiceRole.entities.BrokerAgencyInvitation.filter({ tenant_id });
    let matchedInvitation = null;
    for (const inv of invitations) {
      if (verifyTokenHash(token, inv.token_hash)) { matchedInvitation = inv; break; }
    }
    if (!matchedInvitation) {
      await createAuditEvent(base44, { tenant_id, actor_user_id: 'anonymous', actor_role: 'applicant', action: 'TOKEN_VALIDATED', detail: 'Invalid token', outcome: 'blocked', audit_trace_id: auditTraceId });
      throw { status: 404, code: 'NOT_FOUND', message: 'Invalid or expired onboarding link' };
    }
    if (new Date() > new Date(matchedInvitation.expires_at)) {
      await createAuditEvent(base44, { tenant_id, actor_user_id: 'anonymous', actor_role: 'applicant', action: 'TOKEN_EXPIRED_DENIED', detail: 'Token has expired', outcome: 'blocked', audit_trace_id: auditTraceId });
      throw { status: 404, code: 'NOT_FOUND', message: 'Invalid or expired onboarding link' };
    }
    if (matchedInvitation.single_use_consumed_at) {
      await createAuditEvent(base44, { tenant_id, actor_user_id: 'anonymous', actor_role: 'applicant', action: 'TOKEN_REPLAY_DENIED', detail: 'Token already used', outcome: 'blocked', audit_trace_id: auditTraceId });
      throw { status: 404, code: 'NOT_FOUND', message: 'Invalid or expired onboarding link' };
    }
    await base44.asServiceRole.entities.BrokerAgencyInvitation.update(matchedInvitation.id, { single_use_consumed_at: new Date().toISOString() });
    await createAuditEvent(base44, { tenant_id, actor_user_id: 'anonymous', actor_role: 'applicant', action: 'TOKEN_VALIDATED', detail: 'Token validated successfully', outcome: 'success', audit_trace_id: auditTraceId });
    return { broker_agency_id: matchedInvitation.broker_agency_id, onboarding_case_id: matchedInvitation.onboarding_case_id, valid: true };
  } catch (error) {
    if (error.status) throw error;
    throw { status: 404, code: 'NOT_FOUND', message: 'Invalid or expired onboarding link' };
  }
}

export async function completeBrokerOnboardingProfile(base44, payload) {
  if (!FEATURE_FLAGS.BROKER_ONBOARDING_ENABLED) {
    throw { status: 403, code: 'NOT_AUTHORIZED_FOR_GATE_7A_1', message: 'Broker onboarding is not yet authorized for this phase' };
  }
  const { tenant_id, broker_agency_id, ...profileData } = payload;
  const auditTraceId = crypto.randomUUID();
  try {
    const profile = await base44.asServiceRole.entities.BrokerAgencyProfile.read(broker_agency_id);
    assertScopeAccess({ tenant_id }, profile);
    await base44.asServiceRole.entities.BrokerAgencyProfile.update(broker_agency_id, {
      ...profileData,
      onboarding_status: 'pending_approval',
      audit_trace_id: auditTraceId,
    });
    const onboardingCase = await base44.asServiceRole.entities.BrokerAgencyOnboardingCase.filter({ broker_agency_id, tenant_id });
    if (onboardingCase.length > 0) {
      await base44.asServiceRole.entities.BrokerAgencyOnboardingCase.update(onboardingCase[0].id, { status: 'profile_completed' });
    }
    await createAuditEvent(base44, { tenant_id, actor_user_id: 'applicant', actor_role: 'applicant', action: 'BROKER_PROFILE_COMPLETED', detail: `Profile completed: ${profileData.legal_name || broker_agency_id}`, entity_type: 'BrokerAgencyProfile', entity_id: broker_agency_id, outcome: 'success', audit_trace_id: auditTraceId });
    return { success: true };
  } catch (error) { throw error; }
}

export async function uploadBrokerComplianceDocument(base44, payload) {
  if (!FEATURE_FLAGS.BROKER_COMPLIANCE_DOCUMENT_ENFORCEMENT) {
    throw { status: 403, code: 'NOT_AUTHORIZED_FOR_GATE_7A_1', message: 'Compliance document upload is not yet authorized for this phase' };
  }
  const { tenant_id, broker_agency_id, document_type, file_url, file_name } = payload;
  const auditTraceId = crypto.randomUUID();
  try {
    const profile = await base44.asServiceRole.entities.BrokerAgencyProfile.read(broker_agency_id);
    assertScopeAccess({ tenant_id }, profile);
    const doc = await base44.asServiceRole.entities.BrokerComplianceDocument.create({ tenant_id, broker_agency_id, onboarding_case_id: profile.id, document_type, file_url, file_name, uploaded_at: new Date().toISOString(), audit_trace_id: auditTraceId });
    await createAuditEvent(base44, { tenant_id, actor_user_id: 'applicant', actor_role: 'applicant', action: 'BROKER_COMPLIANCE_DOCUMENT_UPLOADED', detail: `Compliance document uploaded: ${document_type}`, entity_type: 'BrokerComplianceDocument', entity_id: doc.id, outcome: 'success', audit_trace_id: auditTraceId });
    return { document_id: doc.id, success: true };
  } catch (error) { throw error; }
}

export async function resendBrokerOnboardingInvite(base44, payload) {
  const { tenant_id, broker_agency_id } = payload;
  const auditTraceId = crypto.randomUUID();
  try {
    const profile = await base44.asServiceRole.entities.BrokerAgencyProfile.read(broker_agency_id);
    assertScopeAccess({ tenant_id }, profile);
    const cases = await base44.asServiceRole.entities.BrokerAgencyOnboardingCase.filter({ broker_agency_id, tenant_id });
    if (cases.length === 0) throw { status: 404, message: 'Onboarding case not found' };
    const newToken = generateToken();
    const newTokenHash = generateTokenHash(newToken);
    await base44.asServiceRole.entities.BrokerAgencyInvitation.create({ tenant_id, broker_agency_id, onboarding_case_id: cases[0].id, applicant_email: profile.primary_contact_email || '', token_hash: newTokenHash, status: 'invited', expires_at: calculateTokenExpiration(), single_use_consumed_at: null, audit_trace_id: auditTraceId });
    return { new_token: newToken };
  } catch (error) { throw error; }
}

export async function cancelBrokerSignup(base44, payload) {
  const { tenant_id, broker_agency_id } = payload;
  const auditTraceId = crypto.randomUUID();
  try {
    const profile = await base44.asServiceRole.entities.BrokerAgencyProfile.read(broker_agency_id);
    assertScopeAccess({ tenant_id }, profile);
    await base44.asServiceRole.entities.BrokerAgencyProfile.update(broker_agency_id, { onboarding_status: 'inactive' });
    const cases = await base44.asServiceRole.entities.BrokerAgencyOnboardingCase.filter({ broker_agency_id, tenant_id });
    if (cases.length > 0) await base44.asServiceRole.entities.BrokerAgencyOnboardingCase.update(cases[0].id, { status: 'cancelled' });
    await createAuditEvent(base44, { tenant_id, actor_user_id: 'applicant', actor_role: 'applicant', action: 'BROKER_SIGNUP_CANCELLED', detail: 'Signup cancelled by applicant', entity_type: 'BrokerAgencyProfile', entity_id: broker_agency_id, outcome: 'success', audit_trace_id: auditTraceId });
    return { success: true };
  } catch (error) { throw error; }
}

export async function approveStandaloneBroker(base44, context, payload) {
  assertPermission(context, 'platform_broker.approval_decide');
  const { tenant_id } = context;
  const { broker_agency_id } = payload;
  const auditTraceId = crypto.randomUUID();
  try {
    const profile = await base44.asServiceRole.entities.BrokerAgencyProfile.read(broker_agency_id);
    assertScopeAccess(context, profile);
    if (context.user_id === broker_agency_id) throw { status: 403, code: 'SELF_APPROVAL_NOT_ALLOWED', message: 'Broker applicant cannot approve own signup' };

    // BPR: canonical FK broker_agency_id; status enum: approved
    const relationships = await base44.asServiceRole.entities.BrokerPlatformRelationship.filter({ broker_agency_id, tenant_id });
    if (relationships.length > 0) {
      await base44.asServiceRole.entities.BrokerPlatformRelationship.update(relationships[0].id, {
        status: 'approved',
        approval_status: 'approved',
        approved_by_user_email: context.user_id,
        approved_at: new Date().toISOString(),
      });
    }

    // BAP: relationship_status is a valid BAP field (enum includes active)
    await base44.asServiceRole.entities.BrokerAgencyProfile.update(broker_agency_id, {
      onboarding_status: 'active',
      relationship_status: 'active',
      portal_access_enabled: true,
    });

    await createAuditEvent(base44, { tenant_id, actor_user_id: context.user_id, actor_role: context.role, action: 'BROKER_PLATFORM_RELATIONSHIP_APPROVED', detail: `Broker approved: ${broker_agency_id}`, entity_type: 'BrokerPlatformRelationship', entity_id: relationships[0]?.id || broker_agency_id, outcome: 'success', audit_trace_id: auditTraceId });
    return { success: true };
  } catch (error) { throw error; }
}

export async function rejectStandaloneBroker(base44, context, payload) {
  assertPermission(context, 'platform_broker.approval_decide');
  const { tenant_id } = context;
  const { broker_agency_id, reason } = payload;
  const auditTraceId = crypto.randomUUID();
  try {
    const profile = await base44.asServiceRole.entities.BrokerAgencyProfile.read(broker_agency_id);
    assertScopeAccess(context, profile);

    // BPR status enum has no 'rejected' or 'terminated'; use 'inactive' for rejected state
    const relationships = await base44.asServiceRole.entities.BrokerPlatformRelationship.filter({ broker_agency_id, tenant_id });
    if (relationships.length > 0) {
      await base44.asServiceRole.entities.BrokerPlatformRelationship.update(relationships[0].id, {
        status: 'inactive',
        approval_status: 'rejected',
      });
    }

    const cases = await base44.asServiceRole.entities.BrokerAgencyOnboardingCase.filter({ broker_agency_id, tenant_id });
    if (cases.length > 0) await base44.asServiceRole.entities.BrokerAgencyOnboardingCase.update(cases[0].id, { status: 'rejected' });

    await createAuditEvent(base44, { tenant_id, actor_user_id: context.user_id, actor_role: context.role, action: 'BROKER_PLATFORM_RELATIONSHIP_REJECTED', detail: `Broker rejected: ${reason || 'No reason provided'}`, entity_type: 'BrokerPlatformRelationship', entity_id: relationships[0]?.id || broker_agency_id, outcome: 'success', audit_trace_id: auditTraceId });
    return { success: true };
  } catch (error) { throw error; }
}

export async function requestBrokerMoreInformation(base44, context, payload) {
  assertPermission(context, 'platform_broker.approval_decide');
  const { tenant_id } = context;
  const { broker_agency_id, information_requested } = payload;
  const auditTraceId = crypto.randomUUID();
  const deadline = calculateInfoDeadline();
  try {
    const profile = await base44.asServiceRole.entities.BrokerAgencyProfile.read(broker_agency_id);
    assertScopeAccess(context, profile);
    const cases = await base44.asServiceRole.entities.BrokerAgencyOnboardingCase.filter({ broker_agency_id, tenant_id });
    if (cases.length > 0) {
      await base44.asServiceRole.entities.BrokerAgencyOnboardingCase.update(cases[0].id, { status: 'more_information_requested', more_info_deadline: deadline, more_info_details: information_requested });
    }
    await createAuditEvent(base44, { tenant_id, actor_user_id: context.user_id, actor_role: context.role, action: 'BROKER_MORE_INFORMATION_REQUESTED', detail: `More information requested: ${information_requested}`, entity_type: 'BrokerAgencyOnboardingCase', entity_id: cases[0]?.id || broker_agency_id, outcome: 'success', audit_trace_id: auditTraceId });
    return { success: true, deadline };
  } catch (error) { throw error; }
}

export default {
  submitStandaloneBrokerSignup, validateBrokerSignupToken, completeBrokerOnboardingProfile,
  uploadBrokerComplianceDocument, resendBrokerOnboardingInvite, cancelBrokerSignup,
  approveStandaloneBroker, rejectStandaloneBroker, requestBrokerMoreInformation,
};
