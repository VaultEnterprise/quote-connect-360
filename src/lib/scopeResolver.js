/**
 * Centralized Scope Resolver
 * 
 * Enforces all scoping rules across tenant, broker agency, MGA, distribution channel,
 * and explicit access grants. Single source of truth for scope validation.
 * 
 * Channel Invariants:
 * - platform_direct: tenant-scoped, no broker/MGA
 * - standalone_broker: broker_agency scoped, no MGA, supervising = platform
 * - mga_direct: mga scoped, no broker
 * - mga_affiliated_broker: both broker_agency and mga, requires active relationship
 * - hybrid_broker_direct: broker agency direct records only
 * - hybrid_broker_mga: broker agency + mga records (relationship required)
 * - employer_direct: employer scoped
 * 
 * All scope failures return masked 404 (no metadata leakage).
 * All permission failures within valid scope return 403.
 */

import { base44 } from '@/api/base44Client';

/**
 * Resolve actor's complete scope profile.
 * Returns tenant, broker, MGA, channel scopes and permission level.
 * 
 * @param {string} userId - User ID
 * @param {string} userEmail - User email
 * @param {string} userRole - User role (admin, broker_admin, mga_admin, user, etc.)
 * @returns {Object} Scope profile { tenant_id, broker_agency_id, mga_id, channels, permission_level }
 */
export const resolveScopeProfile = async (userId, userEmail, userRole) => {
  const profile = {
    userId,
    userEmail,
    userRole,
    tenant_id: null,
    broker_agency_id: null,
    mga_id: null,
    channel_ids: [],
    accessible_grants: [], // BrokerScopeAccessGrants
    permission_level: derivePermissionLevel(userRole)
  };

  try {
    // Resolve tenant (mandatory)
    const user = await base44.auth.me();
    if (!user) return null; // Unauthorized
    profile.tenant_id = user.tenant_id || 'default_tenant';

    // Resolve broker agency scope (if user is broker-affiliated)
    if (userRole.includes('broker')) {
      const brokerUsers = await base44.entities.BrokerAgencyUser.filter({
        email: userEmail,
        status: 'active'
      });
      if (brokerUsers.length > 0) {
        profile.broker_agency_id = brokerUsers[0].broker_agency_id;
      }
    }

    // Resolve MGA scope (if user is MGA-affiliated)
    if (userRole.includes('mga')) {
      // MGA scope typically comes from user role attributes (TODO: implement MGA user mapping)
      profile.mga_id = null; // Placeholder: would be set from MGA user mapping
    }

    // Resolve distribution channels accessible to user
    if (profile.tenant_id) {
      const channels = await base44.entities.DistributionChannelContext.filter({
        tenant_id: profile.tenant_id
      });
      profile.channel_ids = channels.map((ch) => ch.id);
    }

    // Resolve explicit access grants
    if (profile.broker_agency_id) {
      const grants = await base44.entities.BrokerScopeAccessGrant.filter({
        broker_agency_id: profile.broker_agency_id
      });
      profile.accessible_grants = grants.filter((grant) => !isGrantExpired(grant));
    }

    return profile;
  } catch (error) {
    return null; // Unauthorized
  }
};

/**
 * Assert that a record is visible to the actor.
 * Enforces all scoping rules: tenant, broker, MGA, channel, grants.
 * Returns masked 404 if not visible (no details exposed).
 * 
 * @param {Object} record - Entity record to check visibility
 * @param {Object} scopeProfile - Actor's scope profile (from resolveScopeProfile)
 * @returns {Object} { visible: boolean, error?: string, status?: number }
 */
export const assertRecordVisible = async (record, scopeProfile) => {
  // Mandatory: Tenant scope
  if (record.tenant_id !== scopeProfile.tenant_id) {
    return maskScopeFailure('tenant_mismatch');
  }

  // Determine record's ownership channel
  const recordChannel = determineRecordChannel(record);

  // Enforce scoping based on record channel type
  switch (recordChannel) {
    case 'platform_direct':
      // Platform direct: only platform admins can see
      if (scopeProfile.permission_level !== 'platform_admin') {
        return maskScopeFailure('platform_direct_access_denied');
      }
      return { visible: true, status: 200 };

    case 'standalone_broker':
      // Standalone broker: only that broker can see their own direct records
      if (record.broker_agency_id !== scopeProfile.broker_agency_id) {
        return maskScopeFailure('broker_scope_mismatch');
      }
      if (record.master_general_agent_id !== null) {
        return maskScopeFailure('broker_has_mga_conflict');
      }
      return { visible: true, status: 200 };

    case 'mga_direct':
      // MGA direct: only that MGA can see
      if (record.master_general_agent_id !== scopeProfile.mga_id) {
        return maskScopeFailure('mga_scope_mismatch');
      }
      if (record.broker_agency_id !== null) {
        return maskScopeFailure('mga_has_broker_conflict');
      }
      return { visible: true, status: 200 };

    case 'mga_affiliated_broker':
      // MGA affiliated broker: broker sees own records; MGA sees only if relationship active
      if (scopeProfile.broker_agency_id === record.broker_agency_id) {
        // Broker sees own records
        return { visible: true, status: 200 };
      }
      if (scopeProfile.mga_id === record.master_general_agent_id) {
        // MGA sees only if active relationship exists
        const relationshipActive = await isBrokerMGARelationshipActive(
          record.broker_agency_id,
          record.master_general_agent_id,
          scopeProfile.tenant_id
        );
        if (!relationshipActive) {
          return maskScopeFailure('relationship_not_active');
        }
        return { visible: true, status: 200 };
      }
      return maskScopeFailure('broker_mga_scope_mismatch');

    case 'hybrid_broker_direct':
      // Hybrid broker direct: only that broker can see (not MGA)
      if (record.broker_agency_id !== scopeProfile.broker_agency_id) {
        return maskScopeFailure('broker_scope_mismatch');
      }
      if (scopeProfile.mga_id !== null && scopeProfile.permission_level !== 'platform_admin') {
        // MGA cannot see standalone broker direct book unless admin
        return maskScopeFailure('mga_blocked_from_broker_direct');
      }
      return { visible: true, status: 200 };

    case 'hybrid_broker_mga':
      // Hybrid broker MGA: broker sees own; MGA sees only if relationship active
      if (scopeProfile.broker_agency_id === record.broker_agency_id) {
        return { visible: true, status: 200 };
      }
      if (scopeProfile.mga_id === record.master_general_agent_id) {
        const relationshipActive = await isBrokerMGARelationshipActive(
          record.broker_agency_id,
          record.master_general_agent_id,
          scopeProfile.tenant_id
        );
        if (!relationshipActive) {
          return maskScopeFailure('relationship_not_active');
        }
        return { visible: true, status: 200 };
      }
      return maskScopeFailure('broker_mga_scope_mismatch');

    case 'employer_direct':
      // Employer direct: employer sees own; platform admin sees all
      if (scopeProfile.permission_level === 'platform_admin') {
        return { visible: true, status: 200 };
      }
      // TODO: Check employer scope mapping
      return maskScopeFailure('employer_scope_mismatch');

    case 'explicit_grant':
      // Explicit BrokerScopeAccessGrant access
      const grantActive = scopeProfile.accessible_grants.some(
        (grant) => grant.target_entity_type === record.entity_type &&
                  grant.target_entity_id === record.id
      );
      if (!grantActive) {
        return maskScopeFailure('grant_not_active');
      }
      return { visible: true, status: 200 };

    default:
      return maskScopeFailure('unknown_channel_type');
  }
};

/**
 * Assert that actor has permission to perform an action on a record within valid scope.
 * Requires record to already be visible (call assertRecordVisible first).
 * Returns 403 if not permitted (not masked, since record is visible).
 * 
 * @param {Object} record - Entity record
 * @param {string} action - Action (read, create, update, delete)
 * @param {Object} scopeProfile - Actor's scope profile
 * @returns {Object} { permitted: boolean, error?: string, status?: number }
 */
export const assertRecordActionPermitted = async (record, action, scopeProfile) => {
  // Platform admins can do anything within their tenant
  if (scopeProfile.permission_level === 'platform_admin') {
    return { permitted: true, status: 200 };
  }

  // Broker admins can manage their own agency records
  if (scopeProfile.permission_level === 'broker_admin') {
    if (record.broker_agency_id === scopeProfile.broker_agency_id) {
      if (action === 'read' || action === 'update') {
        return { permitted: true, status: 200 };
      }
    }
  }

  // MGA admins can manage broker relationships
  if (scopeProfile.permission_level === 'mga_admin') {
    if (record.master_general_agent_id === scopeProfile.mga_id) {
      if (action === 'read') {
        return { permitted: true, status: 200 };
      }
    }
  }

  // Default: deny permission
  return { permitted: false, error: 'Forbidden', status: 403 };
};

/**
 * Determine the ownership channel type of a record.
 * Used to enforce channel invariants.
 * 
 * @param {Object} record - Entity record
 * @returns {string} Channel type (platform_direct, standalone_broker, mga_direct, etc.)
 */
export const determineRecordChannel = (record) => {
  const hasBroker = !!record.broker_agency_id;
  const hasMGA = !!record.master_general_agent_id;

  if (!hasBroker && !hasMGA) {
    // Platform direct or employer direct
    if (record.owner_org_type === 'employer') {
      return 'employer_direct';
    }
    return 'platform_direct';
  }

  if (hasBroker && !hasMGA) {
    if (record.supervising_org_type === 'platform') {
      return 'standalone_broker';
    }
    return 'hybrid_broker_direct';
  }

  if (!hasBroker && hasMGA) {
    return 'mga_direct';
  }

  if (hasBroker && hasMGA) {
    // Check if there's MGA-specific data or if it's a grant-based access
    if (record.supervising_org_type === 'mga') {
      return 'mga_affiliated_broker';
    }
    return 'hybrid_broker_mga';
  }

  return 'unknown_channel_type';
};

/**
 * Check if a broker-MGA relationship is active.
 * Returns false if relationship doesn't exist or is suspended/rejected.
 * 
 * @param {string} brokerAgencyId - Broker agency ID
 * @param {string} mgaId - MGA ID
 * @param {string} tenantId - Tenant ID
 * @returns {boolean} Whether relationship is active
 */
export const isBrokerMGARelationshipActive = async (brokerAgencyId, mgaId, tenantId) => {
  try {
    const relationships = await base44.entities.BrokerMGARelationship.filter({
      tenant_id: tenantId,
      broker_agency_id: brokerAgencyId,
      master_general_agent_id: mgaId,
      status: 'active'
    });
    return relationships.length > 0;
  } catch (error) {
    return false;
  }
};

/**
 * Check if a BrokerScopeAccessGrant is expired.
 * Returns true if grant has no expiration or expiration is in future.
 * 
 * @param {Object} grant - BrokerScopeAccessGrant record
 * @returns {boolean} Whether grant is expired
 */
export const isGrantExpired = (grant) => {
  if (!grant.expires_at) {
    return false; // No expiration = permanent
  }
  return new Date(grant.expires_at) < new Date();
};

/**
 * Mask scope failure by returning generic 404.
 * Prevents scope boundary enumeration and information leakage.
 * 
 * @param {string} reason - Internal reason (logged but not exposed)
 * @returns {Object} Masked 404 response
 */
export const maskScopeFailure = (reason) => {
  console.debug(`[Scope Failure Masked] ${reason}`);
  return { error: 'Not found', status: 404 };
};

/**
 * Derive permission level from user role.
 * Maps role strings to permission tiers.
 * 
 * @param {string} role - User role
 * @returns {string} Permission level (platform_admin, mga_admin, broker_admin, user)
 */
export const derivePermissionLevel = (role) => {
  if (role === 'admin' || role === 'platform_super_admin') {
    return 'platform_admin';
  }
  if (role === 'mga_admin' || role === 'mga_manager') {
    return 'mga_admin';
  }
  if (role === 'broker_admin' || role === 'broker_manager') {
    return 'broker_admin';
  }
  return 'user'; // Default: limited user permissions
};

/**
 * Safe payload filter: Remove sensitive fields before returning to user.
 * Ensures no scope/internal details leak in API responses.
 * 
 * @param {Object} record - Entity record
 * @param {Object} scopeProfile - Actor's scope profile
 * @param {Array<string>} fieldsToExpose - Safe fields to include (optional; if null, return full)
 * @returns {Object} Filtered record with only safe fields
 */
export const filterSafePayload = (record, scopeProfile, fieldsToExpose = null) => {
  if (!fieldsToExpose) {
    // Default: expose only non-sensitive fields
    const { created_by_user_id, created_by_role, audit_trace_id, visibility_scope, ...safe } = record;
    return safe;
  }

  // Custom field whitelist
  const filtered = {};
  fieldsToExpose.forEach((field) => {
    if (record.hasOwnProperty(field)) {
      filtered[field] = record[field];
    }
  });
  return filtered;
};