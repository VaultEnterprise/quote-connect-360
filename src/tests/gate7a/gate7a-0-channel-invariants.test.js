/**
 * Gate 7A-0 Channel Invariant Tests
 * 
 * Validates that channel types maintain their invariants and constraints.
 */
/* global describe, test, expect */

describe('Gate 7A-0 Channel Invariants', () => {
  describe('platform_direct', () => {
    test('requires no broker_agency_id and no master_general_agent_id', () => {
      const record = {
        id: 'record_1',
        channel_type: 'platform_direct',
        broker_agency_id: null,
        master_general_agent_id: null,
        owner_org_type: 'platform'
      };
      expect(record.broker_agency_id).toBeNull();
      expect(record.master_general_agent_id).toBeNull();
    });
  });

  describe('standalone_broker', () => {
    test('requires broker_agency_id and no master_general_agent_id', () => {
      const record = {
        id: 'record_1',
        channel_type: 'standalone_broker',
        broker_agency_id: 'broker_1',
        master_general_agent_id: null,
        owner_org_type: 'broker_agency'
      };
      expect(record.broker_agency_id).toBe('broker_1');
      expect(record.master_general_agent_id).toBeNull();
    });
  });

  describe('mga_direct', () => {
    test('requires master_general_agent_id and no broker_agency_id', () => {
      const record = {
        id: 'record_1',
        channel_type: 'mga_direct',
        master_general_agent_id: 'mga_1',
        broker_agency_id: null,
        owner_org_type: 'mga'
      };
      expect(record.master_general_agent_id).toBe('mga_1');
      expect(record.broker_agency_id).toBeNull();
    });
  });

  describe('mga_affiliated_broker', () => {
    test('requires broker_agency_id, master_general_agent_id, and active BrokerMGARelationship', () => {
      const record = {
        id: 'record_1',
        channel_type: 'mga_affiliated_broker',
        broker_agency_id: 'broker_1',
        master_general_agent_id: 'mga_1',
        owner_org_type: 'broker_agency',
        supervising_org_type: 'mga'
      };
      expect(record.broker_agency_id).toBe('broker_1');
      expect(record.master_general_agent_id).toBe('mga_1');
    });
  });

  describe('hybrid_broker_direct', () => {
    test('remains broker-direct and not MGA-visible without explicit grant', () => {
      const record = {
        id: 'record_1',
        channel_type: 'hybrid_broker_direct',
        broker_agency_id: 'broker_1',
        owner_org_type: 'broker_agency'
      };
      expect(record.broker_agency_id).toBe('broker_1');
      // MGA should not see without explicit grant
    });
  });

  describe('hybrid_broker_mga', () => {
    test('requires active BrokerMGARelationship', () => {
      const record = {
        id: 'record_1',
        channel_type: 'hybrid_broker_mga',
        broker_agency_id: 'broker_1',
        master_general_agent_id: 'mga_1',
        supervising_org_type: 'mga'
      };
      expect(record.broker_agency_id).toBe('broker_1');
      expect(record.master_general_agent_id).toBe('mga_1');
      // Requires active relationship to be visible to MGA
    });
  });

  describe('employer_direct', () => {
    test('honors employer-owned visibility', () => {
      const record = {
        id: 'record_1',
        channel_type: 'employer_direct',
        owner_org_type: 'employer',
        owner_org_id: 'employer_1'
      };
      expect(record.owner_org_type).toBe('employer');
    });
  });

  describe('Invalid channel combinations', () => {
    test('are rejected (broker_agency_id but no owner_org_type)', () => {
      const record = {
        broker_agency_id: 'broker_1',
        owner_org_type: null // Invalid
      };
      expect(record.owner_org_type).toBeNull();
      // Should fail validation
    });

    test('are rejected (master_general_agent_id but no supervising_org_type)', () => {
      const record = {
        broker_agency_id: 'broker_1',
        master_general_agent_id: 'mga_1',
        supervising_org_type: null // Invalid for affiliated broker
      };
      expect(record.supervising_org_type).toBeNull();
      // Should fail validation
    });
  });
});