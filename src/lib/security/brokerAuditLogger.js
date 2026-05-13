/**
 * Broker Audit Logger — Phase 7A-2.9
 * 
 * Centralized audit logging for broker workspace actions.
 * Logs material actions, access attempts, and denials safely.
 * Prevents metadata leakage in audit records.
 */

import { base44 } from '@/api/base44Client';
import { createSafeAuditPayload } from './brokerSafePayloadSanitizer';

/**
 * Get authenticated user for audit context.
 */
async function getAuthenticatedUser() {
  try {
    return await base44.auth.me();
  } catch {
    return null;
  }
}

/**
 * Log broker workspace access evaluation.
 */
export async function auditBrokerAccessEvaluation(brokerAgencyId, result) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return;

    const action = result.eligible ? 'BROKER_PORTAL_ACCESS_EVALUATED_ELIGIBLE' : 'BROKER_PORTAL_ACCESS_EVALUATED_INELIGIBLE';

    await base44.entities.ActivityLog.create({
      case_id: null,
      master_general_agent_id: null,
      master_group_id: null,
      actor_email: user.email,
      actor_name: user.full_name,
      actor_role: user.role,
      action,
      detail: JSON.stringify({
        broker_agency_id: brokerAgencyId,
        access_state: result.access_state,
      }),
      entity_type: 'BrokerAgencyProfile',
      entity_id: brokerAgencyId,
      outcome: 'success',
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
}

/**
 * Log broker dashboard view.
 */
export async function auditBrokerDashboardView(brokerAgencyId) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return;

    await base44.entities.ActivityLog.create({
      case_id: null,
      master_general_agent_id: null,
      master_group_id: null,
      actor_email: user.email,
      actor_name: user.full_name,
      actor_role: user.role,
      action: 'BROKER_DASHBOARD_VIEWED',
      detail: JSON.stringify({
        broker_agency_id: brokerAgencyId,
      }),
      entity_type: 'BrokerDashboard',
      entity_id: brokerAgencyId,
      outcome: 'success',
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
}

/**
 * Log book of business view.
 */
export async function auditBrokerBookOfBusinessView(brokerAgencyId, channelAccessed) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return;

    await base44.entities.ActivityLog.create({
      case_id: null,
      master_general_agent_id: null,
      master_group_id: null,
      actor_email: user.email,
      actor_name: user.full_name,
      actor_role: user.role,
      action: 'BROKER_BOOK_OF_BUSINESS_VIEWED',
      detail: JSON.stringify({
        broker_agency_id: brokerAgencyId,
        channel: channelAccessed, // 'direct_book' or 'mga_affiliated'
      }),
      entity_type: 'BrokerBookOfBusiness',
      entity_id: brokerAgencyId,
      outcome: 'success',
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
}

/**
 * Log feature-disabled action attempt.
 */
export async function auditFeatureDisabledAttempt(brokerAgencyId, actionName, disabledFlag) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return;

    await base44.entities.ActivityLog.create({
      case_id: null,
      master_general_agent_id: null,
      master_group_id: null,
      actor_email: user.email,
      actor_name: user.full_name,
      actor_role: user.role,
      action: 'BROKER_BUSINESS_ACTION_DENIED_FEATURE_DISABLED',
      detail: JSON.stringify({
        broker_agency_id: brokerAgencyId,
        action: actionName,
        disabled_flag: disabledFlag,
      }),
      entity_type: 'BrokerAction',
      entity_id: null,
      outcome: 'blocked',
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
}

/**
 * Log scope-denied action attempt.
 */
export async function auditScopeDeniedAttempt(brokerAgencyId, actionName, reason = 'scope_mismatch') {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return;

    await base44.entities.ActivityLog.create({
      case_id: null,
      master_general_agent_id: null,
      master_group_id: null,
      actor_email: user.email,
      actor_name: user.full_name,
      actor_role: user.role,
      action: 'BROKER_BUSINESS_ACTION_DENIED_SCOPE',
      detail: JSON.stringify({
        broker_agency_id: brokerAgencyId,
        action: actionName,
        reason,
      }),
      entity_type: 'BrokerAction',
      entity_id: null,
      outcome: 'blocked',
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
}

/**
 * Log permission-denied action attempt.
 */
export async function auditPermissionDeniedAttempt(brokerAgencyId, actionName) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return;

    await base44.entities.ActivityLog.create({
      case_id: null,
      master_general_agent_id: null,
      master_group_id: null,
      actor_email: user.email,
      actor_name: user.full_name,
      actor_role: user.role,
      action: 'BROKER_BUSINESS_ACTION_DENIED_PERMISSION',
      detail: JSON.stringify({
        broker_agency_id: brokerAgencyId,
        action: actionName,
      }),
      entity_type: 'BrokerAction',
      entity_id: null,
      outcome: 'blocked',
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
}

/**
 * Log platform support action with explicit audit context.
 */
export async function auditPlatformSupportAction(actionName, context) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return;

    // Platform support actions require explicit audit trail
    await base44.entities.ActivityLog.create({
      case_id: context.case_id || null,
      master_general_agent_id: null,
      master_group_id: null,
      actor_email: user.email,
      actor_name: user.full_name,
      actor_role: user.role,
      action: `PLATFORM_SUPPORT_${actionName}`,
      detail: JSON.stringify({
        broker_agency_id: context.broker_agency_id || null,
        support_reason: context.support_reason || null,
      }),
      entity_type: context.entity_type || 'PlatformSupport',
      entity_id: context.entity_id || null,
      outcome: context.outcome || 'success',
      correlation_id: context.correlation_id || null,
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
}