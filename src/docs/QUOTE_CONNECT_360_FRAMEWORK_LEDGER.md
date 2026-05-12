# Quote Connect 360 Framework Ledger

**Master registry for Quote Connect 360 frameworks and feature gates.**

Last Updated: 2026-05-12

---

## Active Frameworks

### 1. First-Class Broker Agency Model, Quote Connect 360, and Benefits Admin Bridge

```json
{
  "framework_id": "FIRST_CLASS_BROKER_AGENCY_MODEL",
  "name": "First-Class Broker Agency Model, Quote Connect 360, and Benefits Admin Bridge",
  "status": "FRAMEWORK_SAVED",
  "runtime_status": "INACTIVE",
  "implementation_status": "NOT_STARTED",
  "created_date": "2026-05-12",
  "created_by": "operator_directive",
  "supersedes": "Tenant → MGA → Broker Agency mandatory hierarchy",
  "core_principle": "BrokerAgencyProfile.master_general_agent_id must not be required or identifying",
  "document": "docs/QUOTE_CONNECT_360_FIRST_CLASS_BROKER_AGENCY_MODEL_FRAMEWORK.md",
  "phases": [
    {
      "phase": 0,
      "name": "Correct Core Model",
      "status": "pending_implementation"
    },
    {
      "phase": 1,
      "name": "Standalone Broker Signup",
      "status": "pending_implementation"
    },
    {
      "phase": 2,
      "name": "Broker Direct Workspace",
      "status": "pending_implementation"
    },
    {
      "phase": 3,
      "name": "MGA Relationship Support",
      "status": "pending_implementation"
    },
    {
      "phase": 4,
      "name": "Quote Connect 360 Channel-Aware Wrapper",
      "status": "pending_implementation"
    },
    {
      "phase": 5,
      "name": "Benefits Admin Bridge Phase 0",
      "status": "pending_implementation"
    },
    {
      "phase": 6,
      "name": "Full Benefits Admin Foundation",
      "status": "pending_implementation"
    }
  ],
  "key_entities": [
    "BrokerAgencyProfile",
    "BrokerPlatformRelationship",
    "BrokerMGARelationship",
    "BrokerAgencyUser",
    "BrokerEmployerRelationship",
    "BrokerScopeAccessGrant",
    "DistributionChannelContext",
    "QuoteAssignment",
    "QuoteAssignmentEvent",
    "QuoteToBenefitsPackage",
    "BenefitsImplementationCase"
  ],
  "key_ui_routes": [
    "/command-center/broker-agencies",
    "/command-center/mga/broker-agencies",
    "/broker",
    "/broker/employers",
    "/broker/cases",
    "/broker/quotes",
    "/broker/proposals",
    "/broker/benefits-admin"
  ],
  "dependent_gates": [
    "Gate 7A - Benefits Admin Phase 0 Integration"
  ],
  "next_action": "Await authorization to begin Phase 0 implementation"
}
```

**Key Rules:**
- Brokers are first-class platform organizations
- Standalone brokers do NOT require an MGA parent
- Affiliated brokers optionally link to MGA via `BrokerMGARelationship`
- Hybrid brokers maintain separate books (direct + affiliated)
- All records carry `DistributionChannelContext` for scope control
- Quote builder reused via `QuoteWorkspaceWrapper` (not duplicated)
- Benefits Admin bridge preserves broker/MGA lineage
- Phase 0 stops at case creation (no full activation, enrollment, payroll, EDI yet)

**Relationship to Gate 7A:**
This framework must be incorporated into Gate 7A before Gate 7A implementation planning. Gate 7A Benefits Admin bridge must support all distribution channels (platform_direct, standalone_broker, mga_direct, mga_affiliated_broker, hybrid_broker_direct, hybrid_broker_mga).

---

## Framework Implementation Status Summary

| Framework | Status | Runtime | Implementation | Phase | Doc |
|-----------|--------|---------|-----------------|-------|-----|
| First-Class Broker Agency Model | SAVED | INACTIVE | NOT_STARTED | Phase 0 (Correct Core Model) | docs/QUOTE_CONNECT_360_FIRST_CLASS_BROKER_AGENCY_MODEL_FRAMEWORK.md |

---

## Implementation Authorization Queue

**Next Framework Ready for Implementation:**

1. **FIRST_CLASS_BROKER_AGENCY_MODEL** (Phase 0: Correct Core Model)
   - Status: Awaiting authorization
   - Dependencies: None
   - Estimated complexity: High
   - Database impact: Significant
   - Timeline impact: Blocks Gate 7A planning

---

## Framework Supersession Record

| Prior Requirement | Superseded By | Effective Date | Reason |
|-------------------|---------------|----------------|--------|
| Tenant → MGA → Broker Agency mandatory hierarchy | First-Class Broker Agency Model | 2026-05-12 | Brokers must be independent first-class orgs |