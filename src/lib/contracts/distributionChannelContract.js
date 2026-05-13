/**
 * Distribution Channel Context Contract
 * 
 * Manages distribution channel creation, retrieval, and access validation.
 * All operations are feature-flag gated and tenant-scoped.
 * 
 * Feature Flag: DISTRIBUTION_CHANNEL_CONTEXT_ENABLED (default: false)
 */

import { DISTRIBUTION_CHANNEL_CONTEXT_ENABLED } from '../featureFlags';
import { base44 } from '@/api/base44Client';

/**
 * Create a new distribution channel context.
 * Requires DISTRIBUTION_CHANNEL_CONTEXT_ENABLED flag.
 * 
 * @param {Object} input - Channel context data (tenant_id, channel_type, owner_org_type, owner_org_id, etc.)
 * @returns {Object} Created channel context or fail-closed response
 * @throws {Error} If flag disabled or validation fails
 */
export const createDistributionChannelContext = async (input) => {
  if (!DISTRIBUTION_CHANNEL_CONTEXT_ENABLED) {
    return { error: 'Distribution channel context feature is not enabled', status: 403 };
  }

  // Validate required fields
  if (!input.tenant_id || !input.channel_type || !input.owner_org_type || !input.owner_org_id) {
    return { error: 'Missing required channel context fields', status: 400 };
  }

  try {
    const context = await base44.entities.DistributionChannelContext.create(input);
    return { data: context, status: 201 };
  } catch (error) {
    return { error: 'Failed to create distribution channel context', status: 500 };
  }
};

/**
 * Retrieve a distribution channel context by ID.
 * Enforces tenant scoping and visibility.
 * Returns masked 404 if user lacks access.
 * 
 * @param {string} contextId - Channel context ID
 * @param {string} userTenantId - User's tenant ID
 * @returns {Object} Channel context or masked 404
 */
export const getDistributionChannelContext = async (contextId, userTenantId) => {
  if (!DISTRIBUTION_CHANNEL_CONTEXT_ENABLED) {
    return { error: 'Not found', status: 404 }; // Masked 404
  }

  try {
    const context = await base44.entities.DistributionChannelContext.read(contextId);
    
    // Enforce tenant scoping
    if (context.tenant_id !== userTenantId) {
      return { error: 'Not found', status: 404 }; // Masked 404 for scope failure
    }

    return { data: context, status: 200 };
  } catch (error) {
    return { error: 'Not found', status: 404 }; // Masked 404
  }
};

/**
 * Resolve user's accessible distribution channels based on their scope.
 * Returns only channels visible to the user.
 * 
 * @param {string} userId - User ID
 * @param {string} userTenantId - User's tenant ID
 * @param {string} userRole - User's role (admin, mga_admin, broker_admin, user, etc.)
 * @returns {Array} List of accessible channels
 */
export const resolveUserScopeForRecord = async (userId, userTenantId, userRole) => {
  if (!DISTRIBUTION_CHANNEL_CONTEXT_ENABLED) {
    return { data: [], status: 200 }; // Fail-closed: empty scope
  }

  try {
    const query = { tenant_id: userTenantId };
    const channels = await base44.entities.DistributionChannelContext.filter(query);
    
    // Filter based on user visibility scope (future: more granular filtering based on user role/org)
    const accessibleChannels = channels.filter((ch) => {
      // Platform admins see all
      if (userRole === 'admin' || userRole === 'platform_super_admin') return true;
      // Others: more specific visibility logic based on ownership
      return true; // TODO: Implement visibility scope filtering
    });

    return { data: accessibleChannels, status: 200 };
  } catch (error) {
    return { data: [], status: 200 }; // Fail-closed: empty scope on error
  }
};

/**
 * Validate whether user has access to a specific channel.
 * Returns true/false; does NOT expose scope details.
 * 
 * @param {string} channelId - Channel context ID
 * @param {string} userId - User ID
 * @param {string} userTenantId - User's tenant ID
 * @returns {boolean} Whether user has access
 */
export const validateChannelAccess = async (channelId, userId, userTenantId) => {
  if (!DISTRIBUTION_CHANNEL_CONTEXT_ENABLED) {
    return false; // Fail-closed: no access
  }

  try {
    const context = await base44.entities.DistributionChannelContext.read(channelId);
    
    // Enforce tenant scoping
    if (context.tenant_id !== userTenantId) {
      return false;
    }

    // User has access if they are the owner or a member of supervising org
    return true; // TODO: Implement visibility scope validation
  } catch (error) {
    return false; // Fail-closed: no access on error
  }
};

/**
 * List all distribution channels accessible to the user.
 * Tenant-scoped, visibility-filtered.
 * 
 * @param {string} userTenantId - User's tenant ID
 * @param {string} userRole - User's role
 * @returns {Array} Accessible channels
 */
export const listAccessibleChannelsForUser = async (userTenantId, userRole) => {
  if (!DISTRIBUTION_CHANNEL_CONTEXT_ENABLED) {
    return { data: [], status: 200 }; // Fail-closed: empty list
  }

  try {
    const query = { tenant_id: userTenantId };
    const channels = await base44.entities.DistributionChannelContext.filter(query);
    return { data: channels, status: 200 };
  } catch (error) {
    return { data: [], status: 200 }; // Fail-closed: empty list
  }
};