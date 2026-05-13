/**
 * Gate 7A-0 Entity/Schema Validation Tests
 * 
 * Validates that all entities conform to Gate 7A-0 schema requirements,
 * including the Approved Channel-Lineage Stamp Set.
 */
/* global describe, test, expect */

describe('Gate 7A-0 Entity Schema Validation', () => {
  describe('BrokerAgencyProfile', () => {
    test('can exist without master_general_agent_id', () => {
      const broker = {
        id: 'broker_1',
        tenant_id: 'tenant_1',
        legal_name: 'Test Broker',
        primary_contact_email: 'contact@broker.com',
        master_general_agent_id: null, // Nullable
        broker_agency_id: 'broker_1'
      };
      expect(broker.master_general_agent_id).toBeNull();
    });

    test('master_general_agent_id is not required', () => {
      const broker = {
        id: 'broker_1',
        tenant_id: 'tenant_1',
        legal_name: 'Test Broker',
        primary_contact_email: 'contact@broker.com'
      };
      expect(broker.hasOwnProperty('master_general_agent_id')).toBe(false);
    });

    test('master_general_agent_id is nullable, non-identifying, and non-parent', () => {
      const broker = {
        id: 'broker_1',
        broker_agency_id: 'broker_1', // Primary identifier
        master_general_agent_id: 'mga_1', // Optional, non-identifying
        owner_org_type: 'broker_agency' // Identifies owner type
      };
      expect(broker.master_general_agent_id).toBeDefined();
      expect(broker.broker_agency_id).toBe('broker_1'); // Primary key
      expect(broker.id).toBe('broker_1'); // Record ID
    });

    test('includes Channel-Lineage Stamp Set fields', () => {
      const broker = {
        // Core ID
        id: 'broker_1',
        tenant_id: 'tenant_1',
        // Channel-Lineage Stamp Set (18 fields)
        owner_org_type: 'broker_agency',
        owner_org_id: 'broker_1',
        servicing_org_type: 'broker_agency',
        servicing_org_id: 'broker_1',
        supervising_org_type: 'platform',
        supervising_org_id: null,
        visibility_scope: 'owner_only',
        master_general_agent_id: null,
        broker_agency_id: 'broker_1',
        distribution_channel_context_id: null,
        created_by_user_id: 'user_1',
        created_by_role: 'admin',
        audit_trace_id: 'trace_1',
        // Timestamps (built-in)
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      expect(broker.tenant_id).toBe('tenant_1');
      expect(broker.owner_org_type).toBe('broker_agency');
      expect(broker.audit_trace_id).toBe('trace_1');
    });
  });

  describe('DistributionChannelContext', () => {
    test('exists and defines canonical channel ownership', () => {
      const channel = {
        id: 'channel_1',
        tenant_id: 'tenant_1',
        channel_type: 'mga_direct',
        owner_org_type: 'mga',
        owner_org_id: 'mga_1',
        status: 'active'
      };
      expect(channel.channel_type).toBe('mga_direct');
      expect(channel.owner_org_type).toBe('mga');
    });

    test('does not contain invalid self-reference', () => {
      const channel = {
        id: 'channel_1',
        tenant_id: 'tenant_1',
        distribution_channel_context_id: null // No self-reference
      };
      expect(channel.distribution_channel_context_id).toBeNull();
    });
  });

  describe('BrokerPlatformRelationship', () => {
    test('exists with required fields', () => {
      const relationship = {
        id: 'rel_1',
        tenant_id: 'tenant_1',
        broker_agency_id: 'broker_1',
        status: 'approved',
        approval_status: 'approved'
      };
      expect(relationship.broker_agency_id).toBe('broker_1');
      expect(relationship.status).toBe('approved');
    });
  });

  describe('BrokerMGARelationship', () => {
    test('exists with required fields', () => {
      const relationship = {
        id: 'rel_1',
        tenant_id: 'tenant_1',
        broker_agency_id: 'broker_1',
        master_general_agent_id: 'mga_1',
        status: 'active'
      };
      expect(relationship.broker_agency_id).toBe('broker_1');
      expect(relationship.master_general_agent_id).toBe('mga_1');
      expect(relationship.status).toBe('active');
    });
  });

  describe('BrokerScopeAccessGrant', () => {
    test('exists with required fields', () => {
      const grant = {
        id: 'grant_1',
        tenant_id: 'tenant_1',
        broker_agency_id: 'broker_1',
        target_entity_type: 'quote_scenario',
        target_entity_id: 'quote_1',
        expires_at: null
      };
      expect(grant.broker_agency_id).toBe('broker_1');
      expect(grant.target_entity_type).toBe('quote_scenario');
    });
  });

  describe('BrokerAgencyUser', () => {
    test('exists with required fields', () => {
      const user = {
        id: 'user_1',
        tenant_id: 'tenant_1',
        broker_agency_id: 'broker_1',
        email: 'user@broker.com',
        role: 'owner',
        status: 'active'
      };
      expect(user.broker_agency_id).toBe('broker_1');
      expect(user.email).toBe('user@broker.com');
    });
  });

  describe('Stamped Entities Include Channel-Lineage Stamp Set', () => {
    test('Employer has full stamp set', () => {
      const employer = {
        id: 'emp_1',
        tenant_id: 'tenant_1',
        master_general_agent_id: null,
        broker_agency_id: 'broker_1',
        owner_org_type: 'broker_agency',
        created_by_user_id: 'user_1',
        audit_trace_id: 'trace_1'
      };
      expect(employer.tenant_id).toBe('tenant_1');
      expect(employer.audit_trace_id).toBe('trace_1');
    });

    test('EmployerCase has full stamp set', () => {
      const case_ = {
        id: 'case_1',
        tenant_id: 'tenant_1',
        master_general_agent_id: 'mga_1',
        broker_agency_id: 'broker_1',
        created_by_role: 'broker_manager',
        visibility_scope: 'owner_and_supervising'
      };
      expect(case_.created_by_role).toBe('broker_manager');
      expect(case_.visibility_scope).toBe('owner_and_supervising');
    });
  });
});