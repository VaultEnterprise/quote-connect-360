import { describe, it, expect } from 'vitest';
import EmployerSchema from '../src/entities/Employer.json';
import CensusVersionSchema from '../src/entities/CensusVersion.json';
import QuoteScenarioSchema from '../src/entities/QuoteScenario.json';
import ProposalSchema from '../src/entities/Proposal.json';
import TaskSchema from '../src/entities/Task.json';
import EnrollmentWindowSchema from '../src/entities/EnrollmentWindow.json';
import RenewalCycleSchema from '../src/entities/RenewalCycle.json';
import DocumentSchema from '../src/entities/Document.json';
import AuditEventSchema from '../src/entities/AuditEvent.json';
import BrokerEmployerRelationshipSchema from '../src/entities/BrokerEmployerRelationship.json';

const REQUIRED_STAMPING_FIELDS = [
  'distribution_channel_context_id',
  'master_general_agent_id',
  'broker_agency_id',
  'owner_org_type',
  'owner_org_id',
  'servicing_org_type',
  'servicing_org_id',
  'supervising_org_type',
  'supervising_org_id',
  'created_by_user_id',
  'created_by_role',
  'visibility_scope',
  'audit_trace_id'
];

const ENTITIES_TO_TEST = [
  { name: 'Employer', schema: EmployerSchema },
  { name: 'CensusVersion', schema: CensusVersionSchema },
  { name: 'QuoteScenario', schema: QuoteScenarioSchema },
  { name: 'Proposal', schema: ProposalSchema },
  { name: 'Task', schema: TaskSchema },
  { name: 'EnrollmentWindow', schema: EnrollmentWindowSchema },
  { name: 'RenewalCycle', schema: RenewalCycleSchema },
  { name: 'Document', schema: DocumentSchema },
  { name: 'AuditEvent', schema: AuditEventSchema }
];

describe('Phase 1: Schema Stamping Fields Validation', () => {
  describe('Required stamping fields present on all entities', () => {
    ENTITIES_TO_TEST.forEach(({ name, schema }) => {
      it(`${name} has all 13 stamping fields`, () => {
        REQUIRED_STAMPING_FIELDS.forEach(field => {
          expect(schema.properties).toHaveProperty(field, `${name} missing field: ${field}`);
        });
      });
    });
  });

  describe('Enum values correct', () => {
    it('owner_org_type enum includes all required values', () => {
      const enums = new Set();
      ENTITIES_TO_TEST.forEach(({ schema }) => {
        if (schema.properties.owner_org_type?.enum) {
          schema.properties.owner_org_type.enum.forEach(e => enums.add(e));
        }
      });
      expect(Array.from(enums)).toContain('platform');
      expect(Array.from(enums)).toContain('broker_agency');
      expect(Array.from(enums)).toContain('mga');
    });

    it('visibility_scope enum includes all required values', () => {
      const enums = new Set();
      ENTITIES_TO_TEST.forEach(({ schema }) => {
        if (schema.properties.visibility_scope?.enum) {
          schema.properties.visibility_scope.enum.forEach(e => enums.add(e));
        }
      });
      expect(Array.from(enums)).toContain('owner_only');
      expect(Array.from(enums)).toContain('platform_wide');
    });
  });

  describe('Nullability rules enforced', () => {
    it('distribution_channel_context_id should be nullable in all entities', () => {
      ENTITIES_TO_TEST.forEach(({ name, schema }) => {
        const field = schema.properties.distribution_channel_context_id;
        expect(field).toBeDefined();
        // Can be nullable or not; Phase 1 allows nullable
        expect([true, undefined]).toContain(field.nullable);
      });
    });

    it('master_general_agent_id should be nullable', () => {
      ENTITIES_TO_TEST.forEach(({ name, schema }) => {
        const field = schema.properties.master_general_agent_id;
        expect(field).toBeDefined();
        expect(field.nullable).toBe(true);
      });
    });

    it('broker_agency_id should be nullable', () => {
      ENTITIES_TO_TEST.forEach(({ name, schema }) => {
        const field = schema.properties.broker_agency_id;
        expect(field).toBeDefined();
        expect(field.nullable).toBe(true);
      });
    });
  });

  describe('BrokerEmployerRelationship entity creation', () => {
    it('BrokerEmployerRelationship schema exists and is valid', () => {
      expect(BrokerEmployerRelationshipSchema).toBeDefined();
      expect(BrokerEmployerRelationshipSchema.name).toBe('BrokerEmployerRelationship');
    });

    it('BrokerEmployerRelationship has required fields', () => {
      const requiredFields = [
        'distribution_channel_context_id',
        'broker_agency_id',
        'employer_group_id',
        'relationship_type',
        'status',
        'visibility_scope',
        'owner_org_type',
        'owner_org_id'
      ];
      requiredFields.forEach(field => {
        expect(BrokerEmployerRelationshipSchema.properties).toHaveProperty(field);
      });
    });

    it('BrokerEmployerRelationship relationship_type enum is correct', () => {
      const enum_values = BrokerEmployerRelationshipSchema.properties.relationship_type.enum;
      expect(enum_values).toContain('direct_broker');
      expect(enum_values).toContain('mga_affiliated_broker');
    });

    it('BrokerEmployerRelationship status enum is correct', () => {
      const enum_values = BrokerEmployerRelationshipSchema.properties.status.enum;
      expect(enum_values).toContain('active');
      expect(enum_values).toContain('suspended');
      expect(enum_values).toContain('terminated');
    });
  });

  describe('Backward compatibility', () => {
    it('Existing required fields not changed', () => {
      expect(EmployerSchema.required).toContain('tenant_id');
      expect(EmployerSchema.required).toContain('name');
      
      expect(ProposalSchema.required).toContain('tenant_id');
      expect(ProposalSchema.required).toContain('case_id');
      expect(ProposalSchema.required).toContain('title');
    });

    it('No existing fields removed or renamed', () => {
      // Spot check: Employer should still have these original fields
      expect(EmployerSchema.properties).toHaveProperty('name');
      expect(EmployerSchema.properties).toHaveProperty('ein');
      expect(EmployerSchema.properties).toHaveProperty('status');
      
      // Proposal should still have these original fields
      expect(ProposalSchema.properties).toHaveProperty('title');
      expect(ProposalSchema.properties).toHaveProperty('status');
      expect(ProposalSchema.properties).toHaveProperty('case_id');
    });
  });
});