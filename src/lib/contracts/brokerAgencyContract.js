/**
 * Broker Agency Contract
 * 
 * Manages broker agency profile operations, user management, and lifecycle.
 * All operations are tenant-scoped and feature-flag gated.
 * 
 * Feature Flags:
 * - FIRST_CLASS_BROKER_MODEL_ENABLED (required for all operations)
 */

import { FIRST_CLASS_BROKER_MODEL_ENABLED } from '../featureFlags';
import { base44 } from '@/api/base44Client';

/**
 * Retrieve broker agency profile.
 * Requires FIRST_CLASS_BROKER_MODEL_ENABLED.
 * 
 * @param {string} brokerAgencyId - Broker agency ID
 * @param {string} userTenantId - User's tenant ID
 * @returns {Object} Broker agency profile or masked 404
 */
export const getBrokerAgencyProfile = async (brokerAgencyId, userTenantId) => {
  if (!FIRST_CLASS_BROKER_MODEL_ENABLED) {
    return { error: 'Not found', status: 404 }; // Masked 404
  }

  try {
    const agency = await base44.entities.BrokerAgencyProfile.read(brokerAgencyId);
    
    // Enforce tenant scoping
    if (agency.tenant_id !== userTenantId) {
      return { error: 'Not found', status: 404 }; // Masked 404
    }

    return { data: agency, status: 200 };
  } catch (error) {
    return { error: 'Not found', status: 404 }; // Masked 404
  }
};

/**
 * Update broker agency profile.
 * Requires FIRST_CLASS_BROKER_MODEL_ENABLED and admin role.
 * 
 * @param {string} brokerAgencyId - Broker agency ID
 * @param {Object} updates - Profile fields to update
 * @param {string} userTenantId - User's tenant ID
 * @param {string} userRole - User's role
 * @returns {Object} Updated profile or error
 */
export const updateBrokerAgencyProfile = async (
  brokerAgencyId,
  updates,
  userTenantId,
  userRole
) => {
  if (!FIRST_CLASS_BROKER_MODEL_ENABLED) {
    return { error: 'Forbidden', status: 403 };
  }

  // Only admins can update
  if (userRole !== 'admin' && userRole !== 'broker_admin') {
    return { error: 'Forbidden', status: 403 };
  }

  try {
    const agency = await base44.entities.BrokerAgencyProfile.read(brokerAgencyId);
    
    // Enforce tenant scoping
    if (agency.tenant_id !== userTenantId) {
      return { error: 'Not found', status: 404 }; // Masked 404
    }

    const updated = await base44.entities.BrokerAgencyProfile.update(brokerAgencyId, updates);
    return { data: updated, status: 200 };
  } catch (error) {
    return { error: 'Failed to update broker agency', status: 500 };
  }
};

/**
 * Invite a user to a broker agency.
 * Requires FIRST_CLASS_BROKER_MODEL_ENABLED and broker admin role.
 * 
 * @param {string} brokerAgencyId - Broker agency ID
 * @param {string} email - User email to invite
 * @param {string} role - Role to assign (owner, manager, viewer)
 * @param {string} userTenantId - User's tenant ID
 * @param {string} userRole - User's role
 * @returns {Object} Invitation or error
 */
export const inviteBrokerUser = async (
  brokerAgencyId,
  email,
  role,
  userTenantId,
  userRole
) => {
  if (!FIRST_CLASS_BROKER_MODEL_ENABLED) {
    return { error: 'Forbidden', status: 403 };
  }

  // Only broker admins can invite
  if (userRole !== 'admin' && userRole !== 'broker_admin') {
    return { error: 'Forbidden', status: 403 };
  }

  try {
    const agency = await base44.entities.BrokerAgencyProfile.read(brokerAgencyId);
    
    // Enforce tenant scoping
    if (agency.tenant_id !== userTenantId) {
      return { error: 'Not found', status: 404 }; // Masked 404
    }

    // Create BrokerAgencyUser record with status "invited"
    const invitation = await base44.entities.BrokerAgencyUser.create({
      tenant_id: userTenantId,
      broker_agency_id: brokerAgencyId,
      email,
      first_name: '',
      last_name: '',
      role,
      status: 'invited'
    });

    return { data: invitation, status: 201 };
  } catch (error) {
    return { error: 'Failed to invite user', status: 500 };
  }
};

/**
 * List all users for a broker agency.
 * Requires FIRST_CLASS_BROKER_MODEL_ENABLED.
 * 
 * @param {string} brokerAgencyId - Broker agency ID
 * @param {string} userTenantId - User's tenant ID
 * @returns {Array} Broker users
 */
export const listBrokerUsers = async (brokerAgencyId, userTenantId) => {
  if (!FIRST_CLASS_BROKER_MODEL_ENABLED) {
    return { data: [], status: 200 }; // Fail-closed: empty list
  }

  try {
    const agency = await base44.entities.BrokerAgencyProfile.read(brokerAgencyId);
    
    // Enforce tenant scoping
    if (agency.tenant_id !== userTenantId) {
      return { error: 'Not found', status: 404 }; // Masked 404
    }

    const users = await base44.entities.BrokerAgencyUser.filter({
      tenant_id: userTenantId,
      broker_agency_id: brokerAgencyId
    });

    return { data: users, status: 200 };
  } catch (error) {
    return { data: [], status: 200 }; // Fail-closed
  }
};

/**
 * Update a broker user's role.
 * Requires FIRST_CLASS_BROKER_MODEL_ENABLED and broker admin role.
 * 
 * @param {string} brokerAgencyId - Broker agency ID
 * @param {string} userId - User ID
 * @param {string} newRole - New role (owner, manager, viewer)
 * @param {string} userTenantId - User's tenant ID
 * @param {string} userRole - User's role
 * @returns {Object} Updated user or error
 */
export const updateBrokerUserRole = async (
  brokerAgencyId,
  userId,
  newRole,
  userTenantId,
  userRole
) => {
  if (!FIRST_CLASS_BROKER_MODEL_ENABLED) {
    return { error: 'Forbidden', status: 403 };
  }

  // Only broker admins
  if (userRole !== 'admin' && userRole !== 'broker_admin') {
    return { error: 'Forbidden', status: 403 };
  }

  try {
    const users = await base44.entities.BrokerAgencyUser.filter({
      id: userId,
      tenant_id: userTenantId,
      broker_agency_id: brokerAgencyId
    });

    if (users.length === 0) {
      return { error: 'Not found', status: 404 }; // Masked 404
    }

    const updated = await base44.entities.BrokerAgencyUser.update(userId, { role: newRole });
    return { data: updated, status: 200 };
  } catch (error) {
    return { error: 'Failed to update user role', status: 500 };
  }
};

/**
 * Suspend broker agency.
 * Requires admin role.
 * 
 * @param {string} brokerAgencyId - Broker agency ID
 * @param {string} userTenantId - User's tenant ID
 * @param {string} userRole - User's role
 * @returns {Object} Updated agency or error
 */
export const suspendBrokerAgency = async (brokerAgencyId, userTenantId, userRole) => {
  if (!FIRST_CLASS_BROKER_MODEL_ENABLED) {
    return { error: 'Forbidden', status: 403 };
  }

  // Only admins
  if (userRole !== 'admin') {
    return { error: 'Forbidden', status: 403 };
  }

  try {
    const agency = await base44.entities.BrokerAgencyProfile.read(brokerAgencyId);
    
    if (agency.tenant_id !== userTenantId) {
      return { error: 'Not found', status: 404 }; // Masked 404
    }

    const updated = await base44.entities.BrokerAgencyProfile.update(brokerAgencyId, {
      relationship_status: 'suspended',
      suspended_at: new Date().toISOString()
    });

    return { data: updated, status: 200 };
  } catch (error) {
    return { error: 'Failed to suspend broker agency', status: 500 };
  }
};

/**
 * Reactivate broker agency.
 * Requires admin role.
 * 
 * @param {string} brokerAgencyId - Broker agency ID
 * @param {string} userTenantId - User's tenant ID
 * @param {string} userRole - User's role
 * @returns {Object} Updated agency or error
 */
export const reactivateBrokerAgency = async (brokerAgencyId, userTenantId, userRole) => {
  if (!FIRST_CLASS_BROKER_MODEL_ENABLED) {
    return { error: 'Forbidden', status: 403 };
  }

  // Only admins
  if (userRole !== 'admin') {
    return { error: 'Forbidden', status: 403 };
  }

  try {
    const agency = await base44.entities.BrokerAgencyProfile.read(brokerAgencyId);
    
    if (agency.tenant_id !== userTenantId) {
      return { error: 'Not found', status: 404 }; // Masked 404
    }

    const updated = await base44.entities.BrokerAgencyProfile.update(brokerAgencyId, {
      relationship_status: 'active'
    });

    return { data: updated, status: 200 };
  } catch (error) {
    return { error: 'Failed to reactivate broker agency', status: 500 };
  }
};

/**
 * Get broker agency compliance status.
 * Requires FIRST_CLASS_BROKER_MODEL_ENABLED.
 * 
 * @param {string} brokerAgencyId - Broker agency ID
 * @param {string} userTenantId - User's tenant ID
 * @returns {Object} Compliance status or error
 */
export const getBrokerComplianceStatus = async (brokerAgencyId, userTenantId) => {
  if (!FIRST_CLASS_BROKER_MODEL_ENABLED) {
    return { error: 'Not found', status: 404 }; // Masked 404
  }

  try {
    const agency = await base44.entities.BrokerAgencyProfile.read(brokerAgencyId);
    
    if (agency.tenant_id !== userTenantId) {
      return { error: 'Not found', status: 404 }; // Masked 404
    }

    return {
      data: {
        status: agency.compliance_status,
        onboarding_status: agency.onboarding_status,
        portal_access_enabled: agency.portal_access_enabled
      },
      status: 200
    };
  } catch (error) {
    return { error: 'Not found', status: 404 }; // Masked 404
  }
};