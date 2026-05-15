/**
 * Audit Contract
 * 
 * Immutable append-only audit event logging for all broker model operations.
 * All audit events are append-only (no UPDATE/DELETE).
 * All sensitive operations are logged.
 * 
 * Feature Flag:
 * - No feature flag gating on audit (always available for logging)
 */

import { base44 } from '@/api/base44Client';

/**
 * Write audit event for broker agency operations.
 * Append-only: creates new AuditEvent record.
 * 
 * @param {Object} input - Event data
 * @returns {Object} Created audit event or error
 */
export const writeBrokerAuditEvent = async (input) => {
  try {
    const event = await base44.entities.AuditEvent.create({
      tenant_id: input.tenant_id,
      event_type: input.event_type || 'broker_operation',
      entity_type: 'BrokerAgencyProfile',
      entity_id: input.entity_id,
      actor_id: input.actor_id,
      actor_email: input.actor_email,
      actor_role: input.actor_role,
      description: input.description,
      changes: input.changes || {},
      outcome: input.outcome || 'success'
    });

    return { data: event, status: 201 };
  } catch (error) {
    // Audit failures should not block operations, but should be logged
    console.error('Failed to write broker audit event:', error);
    return { error: 'Audit event creation failed', status: 500 };
  }
};

/**
 * Write audit event for distribution channel operations.
 * Append-only: creates new AuditEvent record.
 * 
 * @param {Object} input - Event data
 * @returns {Object} Created audit event or error
 */
export const writeDistributionChannelAuditEvent = async (input) => {
  try {
    const event = await base44.entities.AuditEvent.create({
      tenant_id: input.tenant_id,
      event_type: input.event_type || 'channel_operation',
      entity_type: 'DistributionChannelContext',
      entity_id: input.entity_id,
      actor_id: input.actor_id,
      actor_email: input.actor_email,
      actor_role: input.actor_role,
      description: input.description,
      changes: input.changes || {},
      outcome: input.outcome || 'success'
    });

    return { data: event, status: 201 };
  } catch (error) {
    console.error('Failed to write distribution channel audit event:', error);
    return { error: 'Audit event creation failed', status: 500 };
  }
};

/**
 * Write audit event for scope access operations.
 * Append-only: creates new AuditEvent record.
 * 
 * @param {Object} input - Event data
 * @returns {Object} Created audit event or error
 */
export const writeScopeAccessAuditEvent = async (input) => {
  try {
    const event = await base44.entities.AuditEvent.create({
      tenant_id: input.tenant_id,
      event_type: input.event_type || 'scope_access_operation',
      entity_type: 'BrokerScopeAccessGrant',
      entity_id: input.entity_id,
      actor_id: input.actor_id,
      actor_email: input.actor_email,
      actor_role: input.actor_role,
      description: input.description,
      changes: input.changes || {},
      outcome: input.outcome || 'success'
    });

    return { data: event, status: 201 };
  } catch (error) {
    console.error('Failed to write scope access audit event:', error);
    return { error: 'Audit event creation failed', status: 500 };
  }
};

/**
 * Write audit event for quote delegation operations.
 * Append-only: creates new AuditEvent record.
 * 
 * @param {Object} input - Event data
 * @returns {Object} Created audit event or error
 */
export const writeQuoteDelegationAuditEvent = async (input) => {
  try {
    const event = await base44.entities.AuditEvent.create({
      tenant_id: input.tenant_id,
      event_type: input.event_type || 'quote_delegation_operation',
      entity_type: 'QuoteScenario',
      entity_id: input.entity_id,
      actor_id: input.actor_id,
      actor_email: input.actor_email,
      actor_role: input.actor_role,
      description: input.description,
      changes: input.changes || {},
      outcome: input.outcome || 'success'
    });

    return { data: event, status: 201 };
  } catch (error) {
    console.error('Failed to write quote delegation audit event:', error);
    return { error: 'Audit event creation failed', status: 500 };
  }
};

/**
 * Write audit event for benefits admin bridge operations.
 * Append-only: creates new AuditEvent record.
 * 
 * @param {Object} input - Event data
 * @returns {Object} Created audit event or error
 */
export const writeBenefitsBridgeAuditEvent = async (input) => {
  try {
    const event = await base44.entities.AuditEvent.create({
      tenant_id: input.tenant_id,
      event_type: input.event_type || 'benefits_bridge_operation',
      entity_type: input.entity_type || 'EnrollmentWindow',
      entity_id: input.entity_id,
      actor_id: input.actor_id,
      actor_email: input.actor_email,
      actor_role: input.actor_role,
      description: input.description,
      changes: input.changes || {},
      outcome: input.outcome || 'success'
    });

    return { data: event, status: 201 };
  } catch (error) {
    console.error('Failed to write benefits bridge audit event:', error);
    return { error: 'Audit event creation failed', status: 500 };
  }
};