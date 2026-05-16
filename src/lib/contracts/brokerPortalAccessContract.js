/**
 * Broker Portal Access Contract — Phase 7A-1.8
 *
 * Evaluates broker portal access eligibility based on:
 * 1. BrokerAgencyProfile.onboarding_status = active
 * 2. BrokerPlatformRelationship.status = approved
 * 3. BrokerAgencyProfile.portal_access_enabled = true (set after approval)
 * 4. BrokerAgencyProfile.compliance_status is not compliance_hold
 * 5. Authenticated user has valid BrokerAgencyUser role
 * 6. Future Gate 7A-2 workspace feature flags are enabled
 * 7. Tenant scope is valid
 * 8. Broker agency scope is valid
 *
 * Portal access eligibility does NOT equal workspace activation.
 * During Gate 7A-1: /broker remains hidden, workspace inactive.
 * Gate 7A-2 will activate workspace when all flags + approval ready.
 *
 * Access States (12 total):
 * - NOT_STARTED
 * - PENDING_EMAIL_VERIFICATION
 * - PROFILE_INCOMPLETE
 * - PENDING_COMPLIANCE
 * - PENDING_PLATFORM_REVIEW
 * - PENDING_MORE_INFORMATION
 * - COMPLIANCE_HOLD
 * - REJECTED
 * - SUSPENDED
 * - APPROVED_BUT_WORKSPACE_DISABLED
 * - ELIGIBLE_PENDING_WORKSPACE_ACTIVATION
 * - ACTIVE (reserved for Gate 7A-2)
 *
 * Feature Flags: All false during Gate 7A-1
 * Audit Events: 7 events for access evaluation
 *
 * @module brokerPortalAccessContract
 */

import crypto from 'crypto';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const PORTAL_ACCESS_STATES = {
  NOT_STARTED: 'not_started',
  PENDING_EMAIL_VERIFICATION: 'pending_email_verification',
  PROFILE_INCOMPLETE: 'profile_incomplete',
  PENDING_COMPLIANCE: 'pending_compliance',
  PENDING_PLATFORM_REVIEW: 'pending_platform_review',
  PENDING_MORE_INFORMATION: 'pending_more_information',
  COMPLIANCE_HOLD: 'compliance_hold',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
  APPROVED_BUT_WORKSPACE_DISABLED: 'approved_but_workspace_disabled',
  ELIGIBLE_PENDING_WORKSPACE_ACTIVATION: 'eligible_pending_workspace_activation',
  ACTIVE: 'active',
};

const FEATURE_FLAGS = {
  BROKER_WORKSPACE_ENABLED: false,
  BROKER_PORTAL_ACCESS_CHECK_ENABLED: false,
};

function assertScopeAccess(context, tenant_id) {
  if (context.tenant_id !== tenant_id) {
    throw { status: 404, code: 'NOT_FOUND', message: 'Resource not found' };
  }
}

async function createAuditEvent(base44, event) {
  // AuditEvent schema canonical field names
  const auditEventData = {
    tenant_id: event.tenant_id,
    actor_id: event.actor_user_id || 'system',
    actor_role: event.actor_role || 'system',
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

export async function evaluateBrokerPortalAccess(base44, context, payload) {
  const { tenant_id, user_id, user_email } = context;
  const { broker_agency_id } = payload;
  const auditTraceId = crypto.randomUUID();

  try {
    const profile = await base44.asServiceRole.entities.BrokerAgencyProfile.read(broker_agency_id);
    assertScopeAccess(context, profile.tenant_id);

    const relationships = await base44.asServiceRole.entities.BrokerPlatformRelationship.filter(
      { broker_agency_id, tenant_id }
    );
    const relationship = relationships.length > 0 ? relationships[0] : null;

    const brokerUsers = await base44.asServiceRole.entities.BrokerAgencyUser.filter(
      { broker_agency_id, user_email, tenant_id }
    );
    const brokerUser = brokerUsers.length > 0 ? brokerUsers[0] : null;

    const conditions = {
      onboarding_active: profile.onboarding_status === 'active',
      relationship_active: relationship?.status === 'approved',
      portal_access_enabled: profile.portal_access_enabled === true,
      compliance_not_held: profile.compliance_status !== 'compliance_hold',
      valid_broker_user: brokerUser !== null && brokerUser.status === 'active',
      workspace_flags_enabled: FEATURE_FLAGS.BROKER_WORKSPACE_ENABLED === true,
      tenant_scope_valid: profile.tenant_id === tenant_id,
      broker_scope_valid: profile.id === broker_agency_id,
    };

    const conditionsMet = Object.values(conditions).filter((c) => c === true).length;
    const totalConditions = Object.keys(conditions).length;
    const allConditionsMet =
      conditions.onboarding_active && conditions.relationship_active &&
      conditions.portal_access_enabled && conditions.compliance_not_held &&
      conditions.valid_broker_user && conditions.workspace_flags_enabled &&
      conditions.tenant_scope_valid && conditions.broker_scope_valid;

    let accessState = PORTAL_ACCESS_STATES.NOT_STARTED;
    let reason = '';
    let isEligible = false;

    if (!conditions.tenant_scope_valid || !conditions.broker_scope_valid) {
      accessState = PORTAL_ACCESS_STATES.NOT_STARTED; reason = 'Invalid scope';
    } else if (profile.onboarding_status === 'pending_email_verification') {
      accessState = PORTAL_ACCESS_STATES.PENDING_EMAIL_VERIFICATION; reason = 'Awaiting email verification';
    } else if (profile.onboarding_status === 'profile_completed' || !conditions.onboarding_active) {
      accessState = PORTAL_ACCESS_STATES.PROFILE_INCOMPLETE; reason = 'Profile incomplete';
    } else if (profile.compliance_status === 'pending_review' || profile.compliance_status === 'warning') {
      accessState = PORTAL_ACCESS_STATES.PENDING_COMPLIANCE; reason = 'Compliance review pending';
    } else if (!relationship || relationship.approval_status === 'pending') {
      accessState = PORTAL_ACCESS_STATES.PENDING_PLATFORM_REVIEW; reason = 'Awaiting platform review';
    } else if (profile.onboarding_status === 'pending_more_information') {
      accessState = PORTAL_ACCESS_STATES.PENDING_MORE_INFORMATION; reason = 'More information requested';
    } else if (profile.compliance_status === 'compliance_hold') {
      accessState = PORTAL_ACCESS_STATES.COMPLIANCE_HOLD; reason = 'Compliance hold active';
    } else if (profile.onboarding_status === 'rejected' || relationship?.approval_status === 'rejected') {
      accessState = PORTAL_ACCESS_STATES.REJECTED; reason = 'Application rejected';
    } else if (profile.onboarding_status === 'suspended') {
      accessState = PORTAL_ACCESS_STATES.SUSPENDED; reason = 'Account suspended';
    } else if (
      conditions.onboarding_active && conditions.relationship_active &&
      conditions.portal_access_enabled && conditions.compliance_not_held &&
      conditions.valid_broker_user && !conditions.workspace_flags_enabled
    ) {
      accessState = PORTAL_ACCESS_STATES.APPROVED_BUT_WORKSPACE_DISABLED;
      reason = 'Workspace not yet activated (awaiting Gate 7A-2 activation)';
      isEligible = true;
    } else if (allConditionsMet) {
      accessState = PORTAL_ACCESS_STATES.ELIGIBLE_PENDING_WORKSPACE_ACTIVATION;
      reason = 'Eligible for workspace activation (Gate 7A-2)';
      isEligible = true;
    } else {
      accessState = PORTAL_ACCESS_STATES.NOT_STARTED;
      reason = `${totalConditions - conditionsMet} conditions not met`;
    }

    const auditAction = isEligible
      ? 'BROKER_PORTAL_ACCESS_ELIGIBLE_PENDING_ACTIVATION'
      : `BROKER_PORTAL_ACCESS_DENIED_${accessState.toUpperCase()}`;

    await createAuditEvent(base44, {
      tenant_id,
      actor_user_id: user_id || 'anonymous',
      actor_role: context.role || 'applicant',
      action: auditAction,
      detail: `Portal access evaluation: ${accessState} (${conditionsMet}/${totalConditions} conditions met)`,
      entity_type: 'BrokerAgencyProfile',
      entity_id: broker_agency_id,
      outcome: 'success',
      audit_trace_id: auditTraceId,
    });

    return {
      access_state: accessState,
      is_eligible: isEligible,
      reason,
      conditions_met: conditionsMet,
      total_conditions: totalConditions,
      message: isEligible
        ? 'Your application has been approved. Your workspace will be available shortly.'
        : 'Your application is being reviewed. Thank you for your patience.',
      details: {
        profile_complete: conditions.onboarding_active,
        platform_review_complete: conditions.relationship_active,
        compliance_clear: conditions.compliance_not_held,
      },
      audit_trace_id: auditTraceId,
    };
  } catch (error) {
    if (error.status && error.code === 'NOT_FOUND') throw error;
    throw { status: 500, code: 'INTERNAL_ERROR', message: 'Failed to evaluate portal access', detail: error.message };
  }
}

export async function getBrokerPortalAccessState(base44, context, payload) {
  const { tenant_id } = context;
  const { broker_agency_id } = payload;

  try {
    const profile = await base44.asServiceRole.entities.BrokerAgencyProfile.read(broker_agency_id);
    assertScopeAccess(context, profile.tenant_id);

    const relationships = await base44.asServiceRole.entities.BrokerPlatformRelationship.filter(
      { broker_agency_id, tenant_id }
    );
    const relationship = relationships.length > 0 ? relationships[0] : null;
    const result = await evaluateBrokerPortalAccess(base44, context, payload);

    return {
      broker_agency_id,
      access_state: result.access_state,
      is_eligible: result.is_eligible,
      reason: result.reason,
      profile_status: {
        onboarding_status: profile.onboarding_status,
        portal_access_enabled: profile.portal_access_enabled,
        compliance_status: profile.compliance_status,
      },
      relationship_status: relationship ? relationship.status : 'not_started',
      workspace_flag_enabled: FEATURE_FLAGS.BROKER_WORKSPACE_ENABLED,
      conditions_met: result.conditions_met,
      total_conditions: result.total_conditions,
    };
  } catch (error) {
    throw error;
  }
}

export async function canBrokerAccessWorkspace(base44, context, payload) {
  try {
    const result = await evaluateBrokerPortalAccess(base44, context, payload);
    const canAccess = result.is_eligible && FEATURE_FLAGS.BROKER_WORKSPACE_ENABLED === true;
    return {
      can_access: canAccess,
      access_state: result.access_state,
      reason: result.reason,
      message: canAccess ? 'Workspace access granted' : 'Workspace access not available',
    };
  } catch (error) {
    return {
      can_access: false,
      access_state: 'not_started',
      reason: 'Access check failed',
      message: 'Unable to determine workspace access',
    };
  }
}

export default { PORTAL_ACCESS_STATES, evaluateBrokerPortalAccess, getBrokerPortalAccessState, canBrokerAccessWorkspace };
