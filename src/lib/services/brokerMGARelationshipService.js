/**
 * BrokerMGARelationshipService
 * 
 * Business logic wrapper for relationship lifecycle.
 * Handles validation, audit events, and guardrails.
 * 
 * Gate 7A-3 Implementation Phase 7A-3.1
 */

import brokerMGARelationshipContract from '@/lib/contracts/brokerMGARelationshipContract.js';
import { auditWriter } from '@/lib/auditWriter.js';
import { base44 } from '@/api/base44Client';

class BrokerMGARelationshipService {
  /**
   * Propose a relationship with full audit trail
   * Guardrail: No implicit broker-wide visibility
   */
  async proposeBrokerMGARelationship(
    broker_agency_id,
    master_general_agent_id,
    operational_scope,
    scope_definition,
    proposed_by_email,
    proposed_by_role
  ) {
    // Validate brokers exist
    const broker = await base44.entities.BrokerAgencyProfile.get(broker_agency_id);
    if (!broker) throw new Error('Broker Agency not found');

    const mga = await base44.entities.MasterGeneralAgent.get(master_general_agent_id);
    if (!mga) throw new Error('Master General Agent not found');

    // Guardrail: No implicit broker-wide MGA visibility
    if (scope_definition && scope_definition.allowed_operations && scope_definition.allowed_operations.includes('*')) {
      throw new Error('Scope wildcard not permitted; enumerate specific operations');
    }

    // Create relationship
    const relationship = await brokerMGARelationshipContract.proposeBrokerMGARelationship(
      broker_agency_id,
      master_general_agent_id,
      operational_scope,
      scope_definition,
      proposed_by_email,
      proposed_by_role
    );

    // Audit event
    await auditWriter.recordEvent({
      event_type: 'relationship_proposed',
      entity_id: relationship.id,
      entity_type: 'BrokerMGARelationship',
      actor_email: proposed_by_email,
      actor_role: proposed_by_role,
      action: 'propose',
      detail: `Proposed MGA relationship: ${broker.name} ↔ ${mga.name} (scope: ${operational_scope})`,
      new_value: { status: 'PROPOSED', broker_agency_id, master_general_agent_id, operational_scope },
      outcome: 'success',
      correlation_id: relationship.audit_correlation_id
    });

    return relationship;
  }

  /**
   * Accept a proposed relationship
   */
  async acceptBrokerMGARelationship(relationship_id, accepted_by_email) {
    const relationship = await brokerMGARelationshipContract.getRelationship(relationship_id);
    if (!relationship) throw new Error('Relationship not found');

    const updated = await brokerMGARelationshipContract.acceptBrokerMGARelationship(
      relationship_id,
      accepted_by_email
    );

    // Audit event
    await auditWriter.recordEvent({
      event_type: 'relationship_accepted',
      entity_id: relationship_id,
      entity_type: 'BrokerMGARelationship',
      actor_email: accepted_by_email,
      action: 'accept',
      detail: `Accepted MGA relationship; visibility now active`,
      old_value: { status: 'PROPOSED' },
      new_value: { status: 'ACTIVE', visibility_active: true },
      outcome: 'success',
      correlation_id: relationship.audit_correlation_id
    });

    return updated;
  }

  /**
   * Request scope change
   */
  async requestScopeChange(relationship_id, new_scope_definition, requested_by_email) {
    const relationship = await brokerMGARelationshipContract.getRelationship(relationship_id);
    if (!relationship) throw new Error('Relationship not found');

    // Guardrail: No implicit broker-wide visibility
    if (new_scope_definition.allowed_operations && new_scope_definition.allowed_operations.includes('*')) {
      throw new Error('Scope wildcard not permitted; enumerate specific operations');
    }

    const updated = await brokerMGARelationshipContract.requestScopeChange(
      relationship_id,
      new_scope_definition,
      requested_by_email
    );

    // Audit event
    await auditWriter.recordEvent({
      event_type: 'relationship_scope_change_requested',
      entity_id: relationship_id,
      entity_type: 'BrokerMGARelationship',
      actor_email: requested_by_email,
      action: 'request_scope_change',
      detail: `Requested scope change; awaiting approval`,
      old_value: { scope: relationship.scope_definition },
      new_value: { proposed_scope: new_scope_definition },
      outcome: 'success',
      correlation_id: relationship.audit_correlation_id
    });

    return updated;
  }

  /**
   * Accept scope change
   */
  async acceptScopeChange(relationship_id, approved_by_email) {
    const relationship = await brokerMGARelationshipContract.getRelationship(relationship_id);
    if (!relationship) throw new Error('Relationship not found');

    const updated = await brokerMGARelationshipContract.acceptScopeChange(
      relationship_id,
      approved_by_email
    );

    // Audit event
    await auditWriter.recordEvent({
      event_type: 'relationship_scope_change_accepted',
      entity_id: relationship_id,
      entity_type: 'BrokerMGARelationship',
      actor_email: approved_by_email,
      action: 'accept_scope_change',
      detail: `Accepted scope change; relationship reactivated with new scope`,
      old_value: { scope: relationship.scope_definition },
      new_value: { scope: relationship.scope_change_proposed_definition },
      outcome: 'success',
      correlation_id: relationship.audit_correlation_id
    });

    return updated;
  }

  /**
   * Suspend a relationship
   * Guardrail: Visibility stops immediately
   */
  async suspendBrokerMGARelationship(relationship_id, suspended_by_email, reason) {
    const relationship = await brokerMGARelationshipContract.getRelationship(relationship_id);
    if (!relationship) throw new Error('Relationship not found');

    const updated = await brokerMGARelationshipContract.suspendBrokerMGARelationship(
      relationship_id,
      suspended_by_email,
      reason
    );

    // Audit event
    await auditWriter.recordEvent({
      event_type: 'relationship_suspended',
      entity_id: relationship_id,
      entity_type: 'BrokerMGARelationship',
      actor_email: suspended_by_email,
      action: 'suspend',
      detail: `Suspended MGA relationship; visibility deactivated. Reason: ${reason}`,
      old_value: { status: 'ACTIVE', visibility_active: true },
      new_value: { status: 'SUSPENDED', visibility_active: false },
      outcome: 'success',
      correlation_id: relationship.audit_correlation_id
    });

    return updated;
  }

  /**
   * Resume a suspended relationship
   */
  async resumeBrokerMGARelationship(relationship_id, resumed_by_email) {
    const relationship = await brokerMGARelationshipContract.getRelationship(relationship_id);
    if (!relationship) throw new Error('Relationship not found');

    const updated = await brokerMGARelationshipContract.resumeBrokerMGARelationship(
      relationship_id,
      resumed_by_email
    );

    // Audit event
    await auditWriter.recordEvent({
      event_type: 'relationship_resumed',
      entity_id: relationship_id,
      entity_type: 'BrokerMGARelationship',
      actor_email: resumed_by_email,
      action: 'resume',
      detail: `Resumed MGA relationship; visibility reactivated`,
      old_value: { status: 'SUSPENDED', visibility_active: false },
      new_value: { status: 'ACTIVE', visibility_active: true },
      outcome: 'success',
      correlation_id: relationship.audit_correlation_id
    });

    return updated;
  }

  /**
   * Terminate a relationship
   * Guardrail: Historical records preserved with prior relationship reference
   */
  async terminateBrokerMGARelationship(relationship_id, terminated_by_email, reason) {
    const relationship = await brokerMGARelationshipContract.getRelationship(relationship_id);
    if (!relationship) throw new Error('Relationship not found');

    const updated = await brokerMGARelationshipContract.terminateBrokerMGARelationship(
      relationship_id,
      terminated_by_email,
      reason
    );

    // Audit event
    await auditWriter.recordEvent({
      event_type: 'relationship_terminated',
      entity_id: relationship_id,
      entity_type: 'BrokerMGARelationship',
      actor_email: terminated_by_email,
      action: 'terminate',
      detail: `Terminated MGA relationship; future visibility stopped. Historical records preserved. Reason: ${reason}`,
      old_value: { status: relationship.relationship_status, visibility_active: relationship.visibility_active },
      new_value: { status: 'TERMINATED', visibility_active: false },
      outcome: 'success',
      correlation_id: relationship.audit_correlation_id
    });

    return updated;
  }

  /**
   * List relationships for a broker
   */
  async listBrokerRelationships(broker_agency_id, filters = {}) {
    return await brokerMGARelationshipContract.listBrokerRelationships(broker_agency_id, filters);
  }

  /**
   * List relationships for an MGA
   */
  async listMGARelationships(master_general_agent_id, filters = {}) {
    return await brokerMGARelationshipContract.listMGARelationships(master_general_agent_id, filters);
  }

  /**
   * Get a relationship
   */
  async getRelationship(relationship_id) {
    return await brokerMGARelationshipContract.getRelationship(relationship_id);
  }

  /**
   * Check if relationship is active and visible
   */
  async isRelationshipActive(relationship_id) {
    return await brokerMGARelationshipContract.isRelationshipActive(relationship_id);
  }
}

export default new BrokerMGARelationshipService();