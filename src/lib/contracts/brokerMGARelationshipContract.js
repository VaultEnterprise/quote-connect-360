/**
 * Broker MGA Relationship Contract
 * 
 * Manages broker-MGA affiliations and relationships.
 * All operations are tenant-scoped and feature-flag gated.
 * 
 * Feature Flags:
 * - FIRST_CLASS_BROKER_MODEL_ENABLED
 * - BROKER_MGA_RELATIONSHIP_ENABLED
 * - DISTRIBUTION_CHANNEL_CONTEXT_ENABLED
 */

import {
  FIRST_CLASS_BROKER_MODEL_ENABLED,
  BROKER_MGA_RELATIONSHIP_ENABLED,
  DISTRIBUTION_CHANNEL_CONTEXT_ENABLED
} from '../featureFlags';
import { base44 } from '@/api/base44Client';

/**
 * Request broker affiliation with an MGA.
 * Broker initiates affiliation request.
 * Requires FIRST_CLASS_BROKER_MODEL_ENABLED and BROKER_MGA_RELATIONSHIP_ENABLED.
 * 
 * @param {string} brokerAgencyId - Broker agency ID
 * @param {string} mgaId - MGA ID
 * @param {string} userTenantId - User's tenant ID
 * @param {string} userRole - User's role
 * @returns {Object} Relationship request or error
 */
export const requestBrokerAffiliation = async (
  brokerAgencyId,
  mgaId,
  userTenantId,
  userRole
) => {
  if (!FIRST_CLASS_BROKER_MODEL_ENABLED || !BROKER_MGA_RELATIONSHIP_ENABLED) {
    return { error: 'Forbidden', status: 403 };
  }

  // Only broker admins can request
  if (userRole !== 'admin' && userRole !== 'broker_admin') {
    return { error: 'Forbidden', status: 403 };
  }

  try {
    const agency = await base44.entities.BrokerAgencyProfile.read(brokerAgencyId);
    
    if (agency.tenant_id !== userTenantId) {
      return { error: 'Not found', status: 404 }; // Masked 404
    }

    // Create BrokerMGARelationship with status "pending"
    const relationship = await base44.entities.BrokerMGARelationship.create({
      tenant_id: userTenantId,
      broker_agency_id: brokerAgencyId,
      master_general_agent_id: mgaId,
      status: 'pending',
      relationship_type: 'affiliation_request'
    });

    return { data: relationship, status: 201 };
  } catch (error) {
    return { error: 'Failed to request affiliation', status: 500 };
  }
};

/**
 * Approve broker affiliation.
 * MGA admin approves broker request.
 * Requires FIRST_CLASS_BROKER_MODEL_ENABLED and BROKER_MGA_RELATIONSHIP_ENABLED.
 * 
 * @param {string} relationshipId - Relationship ID
 * @param {string} userTenantId - User's tenant ID
 * @param {string} userRole - User's role
 * @param {string} approverEmail - Approver email for audit
 * @returns {Object} Updated relationship or error
 */
export const approveBrokerAffiliation = async (
  relationshipId,
  userTenantId,
  userRole,
  approverEmail
) => {
  if (!FIRST_CLASS_BROKER_MODEL_ENABLED || !BROKER_MGA_RELATIONSHIP_ENABLED) {
    return { error: 'Forbidden', status: 403 };
  }

  // Only MGA admins or platform admins
  if (userRole !== 'admin' && userRole !== 'mga_admin') {
    return { error: 'Forbidden', status: 403 };
  }

  try {
    const rel = await base44.entities.BrokerMGARelationship.read(relationshipId);
    
    if (rel.tenant_id !== userTenantId) {
      return { error: 'Not found', status: 404 }; // Masked 404
    }

    const updated = await base44.entities.BrokerMGARelationship.update(relationshipId, {
      status: 'active',
      relationship_type: 'affiliate'
    });

    return { data: updated, status: 200 };
  } catch (error) {
    return { error: 'Not found', status: 404 }; // Masked 404
  }
};

/**
 * Reject broker affiliation.
 * MGA admin rejects broker request.
 * Requires FIRST_CLASS_BROKER_MODEL_ENABLED and BROKER_MGA_RELATIONSHIP_ENABLED.
 * 
 * @param {string} relationshipId - Relationship ID
 * @param {string} userTenantId - User's tenant ID
 * @param {string} userRole - User's role
 * @param {string} reason - Rejection reason
 * @returns {Object} Updated relationship or error
 */
export const rejectBrokerAffiliation = async (
  relationshipId,
  userTenantId,
  userRole,
  reason
) => {
  if (!FIRST_CLASS_BROKER_MODEL_ENABLED || !BROKER_MGA_RELATIONSHIP_ENABLED) {
    return { error: 'Forbidden', status: 403 };
  }

  // Only MGA admins or platform admins
  if (userRole !== 'admin' && userRole !== 'mga_admin') {
    return { error: 'Forbidden', status: 403 };
  }

  try {
    const rel = await base44.entities.BrokerMGARelationship.read(relationshipId);
    
    if (rel.tenant_id !== userTenantId) {
      return { error: 'Not found', status: 404 }; // Masked 404
    }

    const updated = await base44.entities.BrokerMGARelationship.update(relationshipId, {
      status: 'rejected',
      relationship_type: 'rejected'
    });

    return { data: updated, status: 200 };
  } catch (error) {
    return { error: 'Not found', status: 404 }; // Masked 404
  }
};

/**
 * Suspend broker-MGA relationship.
 * Requires FIRST_CLASS_BROKER_MODEL_ENABLED and BROKER_MGA_RELATIONSHIP_ENABLED.
 * 
 * @param {string} relationshipId - Relationship ID
 * @param {string} userTenantId - User's tenant ID
 * @param {string} userRole - User's role
 * @returns {Object} Updated relationship or error
 */
export const suspendBrokerMGARelationship = async (relationshipId, userTenantId, userRole) => {
  if (!FIRST_CLASS_BROKER_MODEL_ENABLED || !BROKER_MGA_RELATIONSHIP_ENABLED) {
    return { error: 'Forbidden', status: 403 };
  }

  // Only MGA admins or platform admins
  if (userRole !== 'admin' && userRole !== 'mga_admin') {
    return { error: 'Forbidden', status: 403 };
  }

  try {
    const rel = await base44.entities.BrokerMGARelationship.read(relationshipId);
    
    if (rel.tenant_id !== userTenantId) {
      return { error: 'Not found', status: 404 }; // Masked 404
    }

    const updated = await base44.entities.BrokerMGARelationship.update(relationshipId, {
      status: 'suspended'
    });

    return { data: updated, status: 200 };
  } catch (error) {
    return { error: 'Not found', status: 404 }; // Masked 404
  }
};

/**
 * Reactivate broker-MGA relationship.
 * Requires FIRST_CLASS_BROKER_MODEL_ENABLED and BROKER_MGA_RELATIONSHIP_ENABLED.
 * 
 * @param {string} relationshipId - Relationship ID
 * @param {string} userTenantId - User's tenant ID
 * @param {string} userRole - User's role
 * @returns {Object} Updated relationship or error
 */
export const reactivateBrokerMGARelationship = async (
  relationshipId,
  userTenantId,
  userRole
) => {
  if (!FIRST_CLASS_BROKER_MODEL_ENABLED || !BROKER_MGA_RELATIONSHIP_ENABLED) {
    return { error: 'Forbidden', status: 403 };
  }

  // Only MGA admins or platform admins
  if (userRole !== 'admin' && userRole !== 'mga_admin') {
    return { error: 'Forbidden', status: 403 };
  }

  try {
    const rel = await base44.entities.BrokerMGARelationship.read(relationshipId);
    
    if (rel.tenant_id !== userTenantId) {
      return { error: 'Not found', status: 404 }; // Masked 404
    }

    const updated = await base44.entities.BrokerMGARelationship.update(relationshipId, {
      status: 'active'
    });

    return { data: updated, status: 200 };
  } catch (error) {
    return { error: 'Not found', status: 404 }; // Masked 404
  }
};

/**
 * List all brokers affiliated with an MGA.
 * Requires FIRST_CLASS_BROKER_MODEL_ENABLED and BROKER_MGA_RELATIONSHIP_ENABLED.
 * 
 * @param {string} mgaId - MGA ID
 * @param {string} userTenantId - User's tenant ID
 * @returns {Array} Affiliated brokers
 */
export const listBrokersForMGA = async (mgaId, userTenantId) => {
  if (!FIRST_CLASS_BROKER_MODEL_ENABLED || !BROKER_MGA_RELATIONSHIP_ENABLED) {
    return { data: [], status: 200 }; // Fail-closed: empty list
  }

  try {
    const relationships = await base44.entities.BrokerMGARelationship.filter({
      tenant_id: userTenantId,
      master_general_agent_id: mgaId,
      status: 'active'
    });

    // Return broker agency IDs (TODO: optionally fetch full profiles)
    return { data: relationships, status: 200 };
  } catch (error) {
    return { data: [], status: 200 }; // Fail-closed
  }
};

/**
 * List all MGA relationships for a broker.
 * Requires FIRST_CLASS_BROKER_MODEL_ENABLED and BROKER_MGA_RELATIONSHIP_ENABLED.
 * 
 * @param {string} brokerAgencyId - Broker agency ID
 * @param {string} userTenantId - User's tenant ID
 * @returns {Array} MGA relationships
 */
export const listMGARelationshipsForBroker = async (brokerAgencyId, userTenantId) => {
  if (!FIRST_CLASS_BROKER_MODEL_ENABLED || !BROKER_MGA_RELATIONSHIP_ENABLED) {
    return { data: [], status: 200 }; // Fail-closed: empty list
  }

  try {
    const relationships = await base44.entities.BrokerMGARelationship.filter({
      tenant_id: userTenantId,
      broker_agency_id: brokerAgencyId
    });

    return { data: relationships, status: 200 };
  } catch (error) {
    return { data: [], status: 200 }; // Fail-closed
  }
};