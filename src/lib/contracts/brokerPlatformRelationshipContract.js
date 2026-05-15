/**
 * Broker Platform Relationship Contract
 * 
 * Manages broker-platform relationships, signup approval, and platform oversight.
 * All operations are tenant-scoped and feature-flag gated.
 * 
 * Feature Flags:
 * - FIRST_CLASS_BROKER_MODEL_ENABLED
 * - BROKER_PLATFORM_RELATIONSHIP_ENABLED
 */

import {
  FIRST_CLASS_BROKER_MODEL_ENABLED,
  BROKER_PLATFORM_RELATIONSHIP_ENABLED
} from '../featureFlags';
import { base44 } from '@/api/base44Client';

/**
 * List pending broker signups awaiting approval.
 * Requires both feature flags and admin role.
 * 
 * @param {string} userTenantId - User's tenant ID
 * @param {string} userRole - User's role
 * @returns {Array} Pending broker signups
 */
export const listPendingBrokerSignups = async (userTenantId, userRole) => {
  if (!FIRST_CLASS_BROKER_MODEL_ENABLED || !BROKER_PLATFORM_RELATIONSHIP_ENABLED) {
    return { data: [], status: 200 }; // Fail-closed: empty list
  }

  // Only admins
  if (userRole !== 'admin') {
    return { data: [], status: 200 }; // Fail-closed
  }

  try {
    const pending = await base44.entities.BrokerAgencyProfile.filter({
      tenant_id: userTenantId,
      onboarding_status: 'pending_profile_completion'
    });

    return { data: pending, status: 200 };
  } catch (error) {
    return { data: [], status: 200 }; // Fail-closed
  }
};

/**
 * Approve a standalone broker signup.
 * Requires admin role and both feature flags.
 * Creates BrokerPlatformRelationship record.
 * 
 * @param {string} brokerAgencyId - Broker agency ID
 * @param {string} userTenantId - User's tenant ID
 * @param {string} userRole - User's role
 * @param {string} approverEmail - Approver email for audit
 * @returns {Object} Relationship or error
 */
export const approveStandaloneBroker = async (
  brokerAgencyId,
  userTenantId,
  userRole,
  approverEmail
) => {
  if (!FIRST_CLASS_BROKER_MODEL_ENABLED || !BROKER_PLATFORM_RELATIONSHIP_ENABLED) {
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

    // Create BrokerPlatformRelationship record
    const relationship = await base44.entities.BrokerPlatformRelationship.create({
      tenant_id: userTenantId,
      broker_agency_id: brokerAgencyId,
      status: 'approved',
      approval_status: 'approved',
      approved_by_user_email: approverEmail,
      approved_at: new Date().toISOString()
    });

    // Update broker agency onboarding status
    await base44.entities.BrokerAgencyProfile.update(brokerAgencyId, {
      onboarding_status: 'active',
      relationship_status: 'active',
      approved_by_user_email: approverEmail,
      approved_at: new Date().toISOString()
    });

    return { data: relationship, status: 201 };
  } catch (error) {
    return { error: 'Failed to approve broker', status: 500 };
  }
};

/**
 * Reject a broker signup.
 * Requires admin role and both feature flags.
 * 
 * @param {string} brokerAgencyId - Broker agency ID
 * @param {string} userTenantId - User's tenant ID
 * @param {string} userRole - User's role
 * @param {string} reason - Rejection reason
 * @returns {Object} Updated relationship or error
 */
export const rejectStandaloneBroker = async (
  brokerAgencyId,
  userTenantId,
  userRole,
  reason
) => {
  if (!FIRST_CLASS_BROKER_MODEL_ENABLED || !BROKER_PLATFORM_RELATIONSHIP_ENABLED) {
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

    // Update broker agency status
    await base44.entities.BrokerAgencyProfile.update(brokerAgencyId, {
      onboarding_status: 'rejected',
      relationship_status: 'inactive'
    });

    return { data: { status: 'rejected' }, status: 200 };
  } catch (error) {
    return { error: 'Failed to reject broker', status: 500 };
  }
};

/**
 * Request more information from broker during signup.
 * Requires admin role and both feature flags.
 * 
 * @param {string} brokerAgencyId - Broker agency ID
 * @param {string} userTenantId - User's tenant ID
 * @param {string} userRole - User's role
 * @param {string} message - Information request message
 * @returns {Object} Updated relationship or error
 */
export const requestBrokerMoreInformation = async (
  brokerAgencyId,
  userTenantId,
  userRole,
  message
) => {
  if (!FIRST_CLASS_BROKER_MODEL_ENABLED || !BROKER_PLATFORM_RELATIONSHIP_ENABLED) {
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

    // Update status to pending more info (TODO: implement in schema if needed)
    await base44.entities.BrokerAgencyProfile.update(brokerAgencyId, {
      onboarding_status: 'pending_profile_completion'
    });

    return { data: { status: 'pending_more_info', message }, status: 200 };
  } catch (error) {
    return { error: 'Failed to request more information', status: 500 };
  }
};

/**
 * Create broker-platform relationship.
 * Requires admin role and both feature flags.
 * 
 * @param {Object} input - Relationship data
 * @param {string} userTenantId - User's tenant ID
 * @param {string} userRole - User's role
 * @returns {Object} Relationship or error
 */
export const createBrokerPlatformRelationship = async (input, userTenantId, userRole) => {
  if (!FIRST_CLASS_BROKER_MODEL_ENABLED || !BROKER_PLATFORM_RELATIONSHIP_ENABLED) {
    return { error: 'Forbidden', status: 403 };
  }

  // Only admins
  if (userRole !== 'admin') {
    return { error: 'Forbidden', status: 403 };
  }

  try {
    const relationship = await base44.entities.BrokerPlatformRelationship.create({
      ...input,
      tenant_id: userTenantId
    });

    return { data: relationship, status: 201 };
  } catch (error) {
    return { error: 'Failed to create relationship', status: 500 };
  }
};

/**
 * Suspend broker-platform relationship.
 * Requires admin role and both feature flags.
 * 
 * @param {string} relationshipId - Relationship ID
 * @param {string} userTenantId - User's tenant ID
 * @param {string} userRole - User's role
 * @returns {Object} Updated relationship or error
 */
export const suspendBrokerPlatformRelationship = async (
  relationshipId,
  userTenantId,
  userRole
) => {
  if (!FIRST_CLASS_BROKER_MODEL_ENABLED || !BROKER_PLATFORM_RELATIONSHIP_ENABLED) {
    return { error: 'Forbidden', status: 403 };
  }

  // Only admins
  if (userRole !== 'admin') {
    return { error: 'Forbidden', status: 403 };
  }

  try {
    const rel = await base44.entities.BrokerPlatformRelationship.read(relationshipId);
    
    if (rel.tenant_id !== userTenantId) {
      return { error: 'Not found', status: 404 }; // Masked 404
    }

    const updated = await base44.entities.BrokerPlatformRelationship.update(relationshipId, {
      status: 'suspended'
    });

    return { data: updated, status: 200 };
  } catch (error) {
    return { error: 'Not found', status: 404 }; // Masked 404
  }
};

/**
 * Reactivate broker-platform relationship.
 * Requires admin role and both feature flags.
 * 
 * @param {string} relationshipId - Relationship ID
 * @param {string} userTenantId - User's tenant ID
 * @param {string} userRole - User's role
 * @returns {Object} Updated relationship or error
 */
export const reactivateBrokerPlatformRelationship = async (
  relationshipId,
  userTenantId,
  userRole
) => {
  if (!FIRST_CLASS_BROKER_MODEL_ENABLED || !BROKER_PLATFORM_RELATIONSHIP_ENABLED) {
    return { error: 'Forbidden', status: 403 };
  }

  // Only admins
  if (userRole !== 'admin') {
    return { error: 'Forbidden', status: 403 };
  }

  try {
    const rel = await base44.entities.BrokerPlatformRelationship.read(relationshipId);
    
    if (rel.tenant_id !== userTenantId) {
      return { error: 'Not found', status: 404 }; // Masked 404
    }

    const updated = await base44.entities.BrokerPlatformRelationship.update(relationshipId, {
      status: 'approved'
    });

    return { data: updated, status: 200 };
  } catch (error) {
    return { error: 'Not found', status: 404 }; // Masked 404
  }
};