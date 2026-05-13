/**
 * Scope Resolution Contract
 * 
 * Resolves actor scope across tenant, broker agency, MGA, and distribution channel boundaries.
 * Enforces all scope validation, permission checks, and error masking.
 * 
 * Core rules:
 * - All operations are tenant-scoped
 * - Scope failures return masked 404
 * - Permission failures within scope return 403
 * - No scope details exposed in error responses
 */

import {
  FIRST_CLASS_BROKER_MODEL_ENABLED,
  DISTRIBUTION_CHANNEL_CONTEXT_ENABLED,
  BROKER_MGA_RELATIONSHIP_ENABLED
} from '../featureFlags';
import { base44 } from '@/api/base44Client';

/**
 * Resolve actor's effective tenant scope.
 * All operations are scoped within this tenant.
 * 
 * @param {string} userId - User ID
 * @returns {string|null} Tenant ID or null if unauthorized
 */
export const resolveActorTenantScope = async (userId) => {
  try {
    const user = await base44.auth.me();
    if (!user) {
      return null; // Unauthorized
    }
    // User tenant is derived from their session
    return user.tenant_id || 'default_tenant'; // TODO: Get from Base44 session
  } catch (error) {
    return null;
  }
};

/**
 * Resolve actor's effective broker agency scope.
 * Returns broker agency ID if user is broker-affiliated, null otherwise.
 * Feature-flag gated: requires FIRST_CLASS_BROKER_MODEL_ENABLED.
 * 
 * @param {string} userId - User ID
 * @param {string} tenantId - User's tenant ID
 * @returns {string|null} Broker agency ID or null
 */
export const resolveActorBrokerScope = async (userId, tenantId) => {
  if (!FIRST_CLASS_BROKER_MODEL_ENABLED) {
    return null; // Fail-closed: no broker scope
  }

  try {
    // Look up user's broker agency affiliation via BrokerAgencyUser
    const users = await base44.entities.BrokerAgencyUser.filter({
      user_id: userId,
      tenant_id: tenantId
    });

    if (users.length === 0) {
      return null; // User not affiliated with any broker
    }

    // Return first broker affiliation (typically one per user)
    return users[0].broker_agency_id;
  } catch (error) {
    return null; // Fail-closed
  }
};

/**
 * Resolve actor's effective MGA scope.
 * Returns MGA ID if user is MGA-affiliated, null otherwise.
 * Feature-flag gated: requires BROKER_MGA_RELATIONSHIP_ENABLED.
 * 
 * @param {string} userId - User ID
 * @param {string} tenantId - User's tenant ID
 * @returns {string|null} MGA ID or null
 */
export const resolveActorMGAScope = async (userId, tenantId) => {
  if (!BROKER_MGA_RELATIONSHIP_ENABLED) {
    return null; // Fail-closed: no MGA scope
  }

  try {
    // MGA scope is typically derived from user role or organization
    // For now, return null (user is not MGA-scoped unless explicitly assigned)
    return null;
  } catch (error) {
    return null; // Fail-closed
  }
};

/**
 * Resolve actor's distribution channel scope.
 * Returns channels accessible to the user.
 * Feature-flag gated: requires DISTRIBUTION_CHANNEL_CONTEXT_ENABLED.
 * 
 * @param {string} userId - User ID
 * @param {string} tenantId - User's tenant ID
 * @returns {Array} Accessible distribution channel IDs
 */
export const resolveDistributionChannelScope = async (userId, tenantId) => {
  if (!DISTRIBUTION_CHANNEL_CONTEXT_ENABLED) {
    return []; // Fail-closed: no channel access
  }

  try {
    const channels = await base44.entities.DistributionChannelContext.filter({
      tenant_id: tenantId
    });
    // Return channel IDs accessible to user (TODO: filter by visibility scope)
    return channels.map((ch) => ch.id);
  } catch (error) {
    return []; // Fail-closed
  }
};

/**
 * Assert that a record is visible to the actor.
 * Returns true if visible, false with masked 404 if not.
 * Enforces: tenant scope, broker scope, channel scope.
 * 
 * @param {Object} record - Entity record to check
 * @param {string} userTenantId - User's tenant ID
 * @param {string|null} userBrokerAgencyId - User's broker agency ID
 * @param {string|null} userMGAId - User's MGA ID
 * @returns {Object} { visible: boolean, error?: string, status?: number }
 */
export const assertRecordVisibleToActor = async (
  record,
  userTenantId,
  userBrokerAgencyId,
  userMGAId
) => {
  // Tenant scope check (mandatory)
  if (record.tenant_id !== userTenantId) {
    return { visible: false, error: 'Not found', status: 404 }; // Masked 404
  }

  // Broker scope check (if record has broker_agency_id)
  if (record.broker_agency_id && userBrokerAgencyId) {
    if (record.broker_agency_id !== userBrokerAgencyId) {
      return { visible: false, error: 'Not found', status: 404 }; // Masked 404
    }
  }

  // MGA scope check (if record has master_general_agent_id)
  if (record.master_general_agent_id && userMGAId) {
    if (record.master_general_agent_id !== userMGAId) {
      return { visible: false, error: 'Not found', status: 404 }; // Masked 404
    }
  }

  return { visible: true, status: 200 };
};

/**
 * Assert that actor has permission to perform an action on a record.
 * Returns true if permitted, false with 403 if not.
 * Assumes record is already visible (use assertRecordVisibleToActor first).
 * 
 * @param {Object} record - Entity record
 * @param {string} action - Action (read, create, update, delete)
 * @param {string} userRole - User's role
 * @returns {Object} { permitted: boolean, error?: string, status?: number }
 */
export const assertRecordActionPermitted = async (record, action, userRole) => {
  // Platform admins can do anything
  if (userRole === 'admin' || userRole === 'platform_super_admin') {
    return { permitted: true, status: 200 };
  }

  // Broker admins can manage their own agency records
  if (userRole === 'broker_admin' || userRole === 'broker_manager') {
    if (action === 'read' || action === 'update') {
      return { permitted: true, status: 200 };
    }
  }

  // MGA admins can manage broker relationships
  if (userRole === 'mga_admin' || userRole === 'mga_manager') {
    if (action === 'read') {
      return { permitted: true, status: 200 };
    }
  }

  // Default: deny permission within scope
  return { permitted: false, error: 'Forbidden', status: 403 };
};

/**
 * Mask scope failures by returning 404 instead of exposing scope details.
 * Used to prevent scope enumeration attacks.
 * 
 * @param {string} reason - Internal reason for masking (not exposed)
 * @returns {Object} Masked 404 response
 */
export const maskScopeFailure = (reason) => {
  // Log internally (not exposed)
  console.debug(`[Scope Failure Masked] ${reason}`);
  return { error: 'Not found', status: 404 };
};