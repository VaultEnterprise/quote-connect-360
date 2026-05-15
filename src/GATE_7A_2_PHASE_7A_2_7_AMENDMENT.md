# Gate 7A-2 Phase 7A-2.7 Amendment — Broker Business Action Contracts

## Amendment Status

**Phase 7A-2.7 Broker Business Action Contracts — HELD FOR AMENDMENT**

Three clarifications required before operator acceptance:
1. Corrected next-phase status language
2. DistributionChannelContext activation-safety plan
3. Entity naming / alias mapping table

---

## 1. Corrected Next-Phase Status

**ORIGINAL STATEMENT (INCORRECT):**
> Phase 7A-2.7 complete and ready for operator approval before Gate 7A-2 closure.

**CORRECTED STATEMENT:**
> Phase 7A-2.7 complete and ready for operator review before Phase 7A-2.8 Feature Flag Registry / Dependency Enforcement.

**Gate 7A-2 Remaining Phases:**
- ✅ Phase 7A-2.1: Broker Workspace Access Evaluation
- ✅ Phase 7A-2.2: Broker Workspace Portal Access Prerequisites
- ✅ Phase 7A-2.3: Broker Workspace Eligible Status (Reserved)
- ✅ Phase 7A-2.4: Broker Workspace Access State Resolution
- ✅ Phase 7A-2.5: Broker Workspace Dashboard UI Shell
- ✅ Phase 7A-2.6: Broker Workspace Data Fetching & State Management
- ✅ Phase 7A-2.7: Broker Business Action Contracts (CURRENT — HELD FOR AMENDMENT)
- ⏳ Phase 7A-2.8: Feature Flag Registry / Dependency Enforcement (NEXT)
- ⏳ Phase 7A-2.9: Audit / Security / Safe Payload Hardening (PLANNED)
- ⏳ Phase 7A-2.10: Test Suite Implementation (PLANNED)
- ⏳ Phase 7A-2.11: Registry / Ledger Updates (PLANNED)
- ⏳ Phase 7A-2.12: Validation Execution (PLANNED)
- ⏳ Phase 7A-2.13: Closeout Report Creation (PLANNED)

**Gate 7A-2 Closure Conditional:** Gate 7A-2 closure conditional on successful completion of all 13 phases with zero regression issues.

---

## 2. DistributionChannelContext Activation-Safety Plan

### Current State (Phase 7A-2.7 — Feature Flags False)

**All broker business action methods are fail-closed:**
- createBrokerEmployer: Returns 403 FEATURE_DISABLED while BROKER_EMPLOYER_CREATE_ENABLED=false
- createBrokerCase: Returns 403 FEATURE_DISABLED while BROKER_CASE_CREATE_ENABLED=false
- uploadBrokerCensus: Returns 403 FEATURE_DISABLED while BROKER_CENSUS_UPLOAD_ENABLED=false
- manageBrokerTask: Returns 403 FEATURE_DISABLED while BROKER_TASKS_ENABLED=false
- uploadBrokerDocument: Returns 403 FEATURE_DISABLED while BROKER_DOCUMENTS_ENABLED=false
- updateBrokerAgencyProfile: Returns 403 FEATURE_DISABLED while BROKER_SETTINGS_ENABLED=false

**No DistributionChannelContext creation occurs in Phase 7A-2.7.**

**Why:** Feature flags are hardcoded false; all methods fail before reaching entity creation logic.

### Activation-Safety Requirements (Future Phases)

**CRITICAL RULE (Phase 7A-2.8 onward):**

Once any feature flag is enabled (in later phases), the corresponding action method MUST enforce the following BEFORE entity creation:

```
Required Record Attributes (on entity creation):
- tenant_id (from user/context)
- broker_agency_id (from method parameter)
- distribution_channel_context_id (MUST be resolved or created; fails if absent)
- master_general_agent_id (null for direct_book; required for MGA visibility)
- owner_org_type: 'broker_agency' (for direct_book)
- visibility_scope (from distribution_channel_context)
- audit_trace_id (correlation ID for audit chain)
```

**DistributionChannelContext Resolution Logic (to be implemented in Phase 7A-2.8):**

1. **For Direct Book (Standalone Broker) Records:**
   - Query DistributionChannelContext where:
     - tenant_id = user context tenant
     - owner_org_type = 'broker_agency'
     - broker_agency_id = method parameter
     - channel = 'direct_book'
   - If exists: use existing context_id
   - If NOT exists: CREATE new DistributionChannelContext before entity creation
   - If creation fails: method fails with 500 (database error) or 403 (if security check fails)

2. **For MGA-Affiliated Records (future Gate 7A-3):**
   - Query DistributionChannelContext where:
     - tenant_id = user context tenant
     - owner_org_type = 'master_general_agent'
     - master_general_agent_id = active BrokerMGARelationship context
     - channel = 'mga_affiliated'
   - If exists: use existing context_id
   - If NOT exists: FAIL with 403 CONTEXT_RESOLUTION_FAILED (context must pre-exist for MGA; no auto-creation)

### Activation-Safety Enforcement Points

| Method | Flags to Enable | DistributionChannelContext Requirement | Failure Behavior |
|--------|-----------------|----------------------------------------|------------------|
| createBrokerEmployer | BROKER_WORKSPACE_ENABLED + BROKER_EMPLOYER_CREATE_ENABLED | Must exist or be created (direct_book) | 500 if creation fails; 403 if security check fails |
| createBrokerCase | BROKER_WORKSPACE_ENABLED + BROKER_CASE_CREATE_ENABLED | Inherit from employer; validate match | 403 if context mismatch |
| uploadBrokerCensus | BROKER_WORKSPACE_ENABLED + BROKER_CENSUS_UPLOAD_ENABLED | Validate from case context | 403 if context mismatch |
| manageBrokerTask | BROKER_WORKSPACE_ENABLED + BROKER_TASKS_ENABLED | Validate from case context | 403 if context mismatch |
| uploadBrokerDocument | BROKER_WORKSPACE_ENABLED + BROKER_DOCUMENTS_ENABLED | Validate from case context | 403 if context mismatch |
| updateBrokerAgencyProfile | BROKER_WORKSPACE_ENABLED + BROKER_SETTINGS_ENABLED | N/A (metadata update only) | No context check |

### Implementation Plan (Phase 7A-2.8 deliverable)

**Phase 7A-2.8 Feature Flag Registry / Dependency Enforcement MUST include:**
1. DistributionChannelContext resolution function
2. Validation checks for required attributes before entity creation
3. Audit trail linking records to DistributionChannelContext creation/resolution
4. Test coverage for context resolution success/failure paths

**Until Phase 7A-2.8 is complete:**
- All feature flags remain false (methods fail-closed)
- No DistributionChannelContext is created or resolved
- No entity records can be created via these methods (safe)

---

## 3. Entity Naming / Canonical Model Clarification

### Entity Mapping Table

| Method Parameter | Canonical Entity | Actual Implementation | Status | Notes |
|------------------|------------------|----------------------|--------|-------|
| Employer creation | Employer | base44.entities.Employer | ✅ CORRECT | Existing platform entity; renamed from "BrokerEmployer" in documentation for clarity |
| Case creation | EmployerCase or BenefitCase | base44.entities.BenefitCase | ✅ CORRECT | Canonical entity in system; used for employer benefit cases |
| Census version | CensusVersion | base44.entities.CensusVersion | ✅ CORRECT | Existing platform entity; metadata-only container |
| Task management | Task or CaseTask | base44.entities.CaseTask | ✅ CORRECT | Existing platform entity; case-scoped tasks |
| Document storage | Document | base44.entities.Document | ✅ CORRECT | Existing platform entity; generic document container |
| Audit logging | AuditEvent (canonical) | base44.entities.ActivityLog | ⚠️ REQUIRES CLARIFICATION | See audit target clarification below |

### Entity Naming Clarification

**Documentation Naming Inconsistency Resolved:**

1. **Employer (NOT "BrokerEmployer")**
   - Canonical entity: `base44.entities.Employer`
   - Phase 7A-2.7 checkpoint reference: Incorrectly labeled as "BrokerEmployer"
   - Correction: Single shared Employer entity; stamped with broker_agency_id and distribution_channel for broker context
   - No separate "BrokerEmployer" entity exists or should be created

2. **BenefitCase (NOT "EmployerCase")**
   - Canonical entity: `base44.entities.BenefitCase`
   - Phase 7A-2.7 implementation: Correctly uses BenefitCase
   - No separate "EmployerCase" entity; BenefitCase is the single case entity
   - Stamped with agency_id (or broker_agency_id), employer_group_id, distribution_channel

3. **Document (generic)**
   - Canonical entity: `base44.entities.Document`
   - Phase 7A-2.7 implementation: Correctly uses Document
   - No separate "BrokerDocument" entity
   - Single Document entity; stamped with broker context via case_id

4. **CaseTask (NOT "Task")**
   - Canonical entity: `base44.entities.CaseTask`
   - Phase 7A-2.7 implementation: Correctly uses CaseTask
   - Case-scoped; no separate Task entity for broker business actions

5. **CensusVersion**
   - Canonical entity: `base44.entities.CensusVersion`
   - Phase 7A-2.7 implementation: Correctly uses CensusVersion
   - No separate "BrokerCensus" entity

### No Duplicate Conceptual Entities Introduced

**CONFIRMED:** Phase 7A-2.7 implementation uses only existing canonical entities:
- ✅ Employer (not a new "BrokerEmployer")
- ✅ BenefitCase (not a new "EmployerCase")
- ✅ Document (generic; not a new "BrokerDocument")
- ✅ CaseTask (not a new "Task" or "BrokerTask")
- ✅ CensusVersion (not a new "BrokerCensus")

**No new entity schemas created.** All methods stamp existing entities with broker context.

---

## 4. Audit Target Clarification: ActivityLog vs AuditEvent

### Current Implementation (Phase 7A-2.7)

**Audit Target:** `base44.entities.ActivityLog`

**Reasoning:**
- ActivityLog is the existing entity designed for transaction/action auditing
- BenefitCase.stage_change and case workflow actions already logged to ActivityLog
- Phase 7A-0 audit writer contract uses ActivityLog as primary audit sink
- Consistent with existing platform audit patterns

**ActivityLog Record Structure (as used in brokerBusinessActionsContract):**
```javascript
{
  case_id: string|null,
  master_general_agent_id: null, // Direct book; not set
  master_group_id: null,
  actor_email: user.email,
  actor_name: user.full_name,
  actor_role: user.role,
  action: 'BROKER_EMPLOYER_CREATED' | 'BROKER_CASE_CREATED' | etc.,
  detail: JSON.stringify({ broker_agency_id, ...details }),
  entity_type: 'Employer' | 'BenefitCase' | 'Document' | etc.,
  entity_id: entity.id,
  outcome: 'success' | 'blocked' | 'failed',
  correlation_id: optional correlation ID,
}
```

### AuditEvent Entity (Alternative / Future)

**Status:** Available but not used in Phase 7A-2.7

**Reason Not Used:** 
- ActivityLog is the established audit path for case/business actions
- AuditEvent may be intended for system-level or financial audit (per earlier Gate 7A-0 discussions)
- Phase 7A-2.7 broker business actions are case/workflow related; ActivityLog is appropriate

### Audit Routing Decision

**DECISION:** Continue routing broker business action audits through ActivityLog (consistent with existing case workflows).

**IF** later phases (7A-2.9 Audit/Security Hardening) require dual-logging to AuditEvent for financial/compliance audit trail:
- Phase 7A-2.9 will add AuditEvent logging alongside ActivityLog
- No change to Phase 7A-2.7 audit implementation required

**CONFIRMATION:** ActivityLog usage is acceptable under Gate 7A audit model for broker business actions.

---

## 5. Implementation Confirmations

### ✅ All Action Methods Remain Fail-Closed While Flags Are False

| Method | Flag | Status | Behavior |
|--------|------|--------|----------|
| createBrokerEmployer | BROKER_EMPLOYER_CREATE_ENABLED | false | Returns 403 FEATURE_DISABLED |
| createBrokerCase | BROKER_CASE_CREATE_ENABLED | false | Returns 403 FEATURE_DISABLED |
| uploadBrokerCensus | BROKER_CENSUS_UPLOAD_ENABLED | false | Returns 403 FEATURE_DISABLED |
| manageBrokerTask | BROKER_TASKS_ENABLED | false | Returns 403 FEATURE_DISABLED |
| uploadBrokerDocument | BROKER_DOCUMENTS_ENABLED | false | Returns 403 FEATURE_DISABLED |
| updateBrokerAgencyProfile | BROKER_SETTINGS_ENABLED | false | Returns 403 FEATURE_DISABLED |

**All methods validate parent flag FIRST:** `BROKER_WORKSPACE_ENABLED=false`
**Parent flag blocks all actions before action-specific checks occur.**
**CONFIRMED: No runtime feature activation possible.**

### ✅ No Runtime Feature Activated

- No entity records created via these methods (all fail-closed)
- No DistributionChannelContext created (flags false)
- No UI action buttons exposed (feature flags control visibility)
- No workspace behavior activated (parent flag false)

### ✅ No UI Action Buttons Exposed

- BrokerDashboard integrates cards (read-only)
- All action methods exist only in contract layer
- No UI components call action methods while flags are false
- Dashboard cards display safe read-only metadata only

### ✅ No QuoteWorkspaceWrapper Exposure

- No quote creation method in Phase 7A-2.7
- No quote editing method in Phase 7A-2.7
- No quote submission method in Phase 7A-2.7
- Quote methods deferred to Gate 7A-4 (explicitly deferred)
- BROKER_QUOTE_CREATION_ENABLED=false (hardcoded)

### ✅ No Benefits Admin Setup Exposure

- No benefits admin setup method in Phase 7A-2.7
- No benefits admin case creation in Phase 7A-2.7
- No "Start Benefits Admin Setup" action in Phase 7A-2.7
- BrokerBenefitsAdminCard remains placeholder/inactive
- Benefits Admin deferred to Gate 7A-5/7A-6 (explicitly deferred)
- BROKER_BENEFITS_ADMIN_ENABLED=false (hardcoded)

### ✅ Gate 7A-0 and Gate 7A-1 Regressions Preserved

**Gate 7A-0 (First-Class Broker Core Model):**
- No changes to entity schemas
- No changes to scope resolver, permission resolver, audit writer
- No changes to DistributionChannelContext model
- No changes to BrokerAgencyProfile, BrokerPlatformRelationship, BrokerMGARelationship
- No changes to BrokerScopeAccessGrant, DistributionChannelContext

**Gate 7A-1 (Standalone Broker Signup & Approval):**
- No changes to broker signup workflow
- No changes to broker onboarding flow
- No changes to compliance document model
- No changes to broker agency user model
- No changes to token security contract
- No changes to platform review workflow
- No changes to portal access evaluation

**CONFIRMED: No regressions introduced.**

### ✅ Gate 6K and Gate 6L-A Untouched

**Gate 6K (MGA Analytics Dashboard):**
- No changes to MGA analytics contract
- No changes to MGA dashboard components
- No changes to MGA export functionality

**Gate 6L-A (Broker Agency Contacts & Settings):**
- No changes to broker agency contact model
- No changes to broker agency settings
- No changes to broker agency contact UI

**CONFIRMED: Gates 6K and 6L-A untouched.**

### ✅ Deferred Gates Untouched

**Gates 6I-B, 6J-B, 6J-C, 6L-B (MGA Features):**
- Report scheduling (6I-B): Not touched
- Export delivery enhancements (6J-B, 6J-C): Not touched
- Broker agency documents/collaboration (6L-B): Not touched

**Gates 7A-3 through 7A-6 (Future Broker Features):**
- Gate 7A-3 (MGA Relationship Support): Not started
- Gate 7A-4 (Quote Connect 360 Channel-Aware Wrapper): Not started
- Gate 7A-5 (Benefits Admin Bridge Phase 0): Not started
- Gate 7A-6 (Benefits Admin Foundation Shell): Not started

**CONFIRMED: No deferred gates touched.**

---

## Amendment Completion Status

✅ **Issue 1 — Corrected Next Status Language:** Clarified Phase 7A-2.7 leads to Phase 7A-2.8 (not Gate 7A-2 closure)

✅ **Issue 2 — DistributionChannelContext Activation-Safety Plan:** Confirmed fail-closed now; specified activation-safety requirements for future phases

✅ **Issue 3 — Entity Naming / Canonical Model Clarification:** Mapped all references to canonical entities; confirmed no duplicate conceptual entities

✅ **Audit Target Clarification:** Confirmed ActivityLog is appropriate for broker business action auditing

✅ **All Confirmations:** No runtime features, no UI exposure, no regressions, no deferred gate touches

---

## Next Step

**Phase 7A-2.7 Amendment Complete and Ready for Operator Acceptance.**

Once operator accepts this amendment, proceed to:

**PHASE 7A-2.8 FEATURE FLAG REGISTRY / DEPENDENCY ENFORCEMENT**