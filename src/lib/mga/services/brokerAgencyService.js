/**
 * Broker Agency Service
 * Handles dual-scope creation and retrieval (MGA-admin controlled + Broker self-service)
 */

import { base44 } from '@/api/base44Client';

/**
 * List broker agencies visible to actor (MGA-scoped)
 * MGAs see all brokers in their scope; Brokers see only their own
 */
export async function listBrokerAgencies(request) {
  const { actor_email, target_entity_id, request_channel } = request;
  
  try {
    const query = {
      master_general_agent_id: target_entity_id,
    };

    const agencies = await base44.entities.BrokerAgency.filter(query);
    
    return {
      success: true,
      data: agencies || [],
      reason_code: null,
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      reason_code: 'QUERY_ERROR',
      detail: error.message,
    };
  }
}

/**
 * Create broker agency (MGA-admin only)
 */
export async function createBrokerAgencyMGA(request) {
  const { 
    actor_email, 
    target_entity_id, // MGA ID
    actor_role,
    broker_data 
  } = request;

  // RBAC: Only mga_admin or platform_super_admin
  if (!['mga_admin', 'platform_super_admin', 'admin'].includes(actor_role)) {
    return {
      success: false,
      reason_code: 'PERMISSION_DENIED',
      detail: 'Only MGA admins can create broker agencies',
    };
  }

  try {
    const payload = {
      ...broker_data,
      master_general_agent_id: target_entity_id,
      created_scope: 'mga',
      visibility_scope: 'mga_only',
      created_by_user_id: actor_email,
      onboarding_status: 'not_started',
      relationship_status: 'prospect',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const result = await base44.entities.BrokerAgency.create(payload);

    return {
      success: true,
      data: result,
      reason_code: null,
    };
  } catch (error) {
    return {
      success: false,
      reason_code: 'CREATE_ERROR',
      detail: error.message,
    };
  }
}

/**
 * Create broker agency (Broker self-service)
 * Broker-created agencies are visible only to that broker
 */
export async function createBrokerAgencySelfService(request) {
  const { actor_email, broker_data } = request;

  try {
    const payload = {
      ...broker_data,
      created_scope: 'broker',
      visibility_scope: 'broker_only',
      created_by_user_id: actor_email,
      onboarding_status: 'not_started',
      relationship_status: 'prospect',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const result = await base44.entities.BrokerAgency.create(payload);

    return {
      success: true,
      data: result,
      reason_code: null,
    };
  } catch (error) {
    return {
      success: false,
      reason_code: 'CREATE_ERROR',
      detail: error.message,
    };
  }
}

/**
 * Update broker agency (MGA-admin or creator only)
 */
export async function updateBrokerAgency(request) {
  const { 
    broker_agency_id, 
    actor_email, 
    actor_role,
    target_entity_id, // MGA ID
    broker_data 
  } = request;

  try {
    // Fetch existing record
    const existing = await base44.entities.BrokerAgency.filter({
      id: broker_agency_id,
    });

    if (!existing || existing.length === 0) {
      return {
        success: false,
        reason_code: 'NOT_FOUND',
        detail: 'Broker agency not found',
      };
    }

    const record = existing[0];

    // RBAC: Only MGA admin or creator can update
    const isAdmin = ['mga_admin', 'platform_super_admin', 'admin'].includes(actor_role);
    const isCreator = record.created_by_user_id === actor_email;
    const isMGAScope = record.master_general_agent_id === target_entity_id;

    if (!isAdmin && !isCreator) {
      return {
        success: false,
        reason_code: 'PERMISSION_DENIED',
        detail: 'Only admins or creator can update this broker agency',
      };
    }

    const updated = {
      ...record,
      ...broker_data,
      updated_at: new Date().toISOString(),
    };

    await base44.entities.BrokerAgency.update(broker_agency_id, updated);

    return {
      success: true,
      data: updated,
      reason_code: null,
    };
  } catch (error) {
    return {
      success: false,
      reason_code: 'UPDATE_ERROR',
      detail: error.message,
    };
  }
}

/**
 * Delete/deactivate broker agency (MGA-admin only)
 */
export async function deleteBrokerAgency(request) {
  const { broker_agency_id, actor_role } = request;

  if (!['mga_admin', 'platform_super_admin', 'admin'].includes(actor_role)) {
    return {
      success: false,
      reason_code: 'PERMISSION_DENIED',
      detail: 'Only MGA admins can delete broker agencies',
    };
  }

  try {
    await base44.entities.BrokerAgency.delete(broker_agency_id);

    return {
      success: true,
      reason_code: null,
    };
  } catch (error) {
    return {
      success: false,
      reason_code: 'DELETE_ERROR',
      detail: error.message,
    };
  }
}

export default {
  listBrokerAgencies,
  createBrokerAgencyMGA,
  createBrokerAgencySelfService,
  updateBrokerAgency,
  deleteBrokerAgency,
};