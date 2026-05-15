# Gate 7A-3 MGA Relationship Support — Implementation Work Order

**Date:** 2026-05-13  
**Phase:** Implementation Work Order (Planning / Authorization)  
**Runtime Status:** NOT ACTIVE — AWAITING OPERATOR APPROVAL  
**Implementation Status:** BLOCKED UNTIL APPROVED

---

## Executive Implementation Summary

Gate 7A-3 implements MGA/Broker Agency relationship workflows, scoped visibility, and audit controls. This work order authorizes the controlled implementation of relationship lifecycle management, scope-bound record visibility, permission enforcement, and analytics scoping while preserving Broker Agency autonomy, enforcing MGA affiliation optionality, and ensuring all relationship-scoped access is auditable and denials are loggable.

**Estimated Effort:** 6-8 weeks (5 sequential implementation phases)  
**Estimated Test Count:** 275-330 tests  
**Risk Level:** MEDIUM  
**Rollback Capability:** FULL (feature flags + code rollback)  

---

## Authorized Scope

### AUTHORIZED

✅ Implement BrokerMGARelationship lifecycle (propose, accept, modify, suspend, terminate)  
✅ Enhance scope resolver (backward-compatible, relationship-aware)  
✅ Enhance permission resolver (scope boundary validation)  
✅ Implement backend service contracts (BrokerMGARelationshipContract, MGAVisibilityContract, BrokerBookSeparationContract)  
✅ Implement frontend UI surfaces (relationship management, affiliated book dashboard)  
✅ Implement MGA dashboard visibility rules  
✅ Implement broker workspace relationship management  
✅ Implement analytics/reporting scoping  
✅ Implement safe payload filtering  
✅ Implement audit event logging (relationship lifecycle + MGA access)  
✅ Design feature flags (all default false, no activation without separate approval)  
✅ Design migration/backfill plan (no execution)  
✅ Create 275-330 acceptance tests  
✅ Implement rollback procedures  

### NOT AUTHORIZED (Explicitly Blocked)

❌ Schema modifications to existing entities (only field usage, no schema changes)  
❌ Route exposure or routing changes  
❌ Feature flag activation during implementation  
❌ Broker Agency workspace structural changes  
❌ MGA Command Center workflow changes  
❌ Permission system overhauls  
❌ Scope resolver behavior changes for standalone brokers  
❌ Migration/backfill execution (design only)  
❌ Gate 7A-2 closure re-opening or modification  
❌ Runtime code without backend contract wrapping  
❌ Frontend direct entity reads for relationship data  

---

## Files to Create

### Documentation Files
1. docs/GATE_7A_3_IMPLEMENTATION_PHASE_LEDGER.md (progress tracking)
2. docs/GATE_7A_3_TEST_SPECIFICATION.md (detailed test matrix)
3. docs/GATE_7A_3_SAFE_PAYLOAD_REFERENCE.md (API response specifications)

### Code Files (Backend Layer)
4. lib/contracts/brokerMGARelationshipContract.js (relationship CRUD)
5. lib/contracts/mgaVisibilityContract.js (scoped queries)
6. lib/contracts/brokerBookSeparationContract.js (record classification)
7. lib/services/brokerMGARelationshipService.js (business logic)
8. lib/services/mgaVisibilityService.js (visibility enforcement)
9. src/functions/proposeBrokerMGARelationship.js (backend function)
10. src/functions/acceptBrokerMGARelationship.js (backend function)
11. src/functions/modifyRelationshipScope.js (backend function)
12. src/functions/suspendBrokerMGARelationship.js (backend function)
13. src/functions/terminateBrokerMGARelationship.js (backend function)
14. src/functions/getMGAAffiliatedRecords.js (backend function)
15. src/functions/getMGAAccessLog.js (backend function)
16. src/functions/validateMGAAccess.js (backend function)

### Code Files (Frontend Layer)
17. components/broker/BrokerMGARelationshipDashboard.jsx (dashboard card)
18. components/broker/BrokerMGARelationshipListView.jsx (relationship list)
19. components/broker/BrokerMGARelationshipDetailModal.jsx (detail view)
20. components/broker/BrokerScopeEditorModal.jsx (scope custom editor)
21. components/broker/RecordVisibilitySelector.jsx (direct vs affiliated)
22. components/mga/MGAAffiliatedBrokersList.jsx (broker list)
23. components/mga/MGAAffiliatedBookDashboard.jsx (book view)
24. components/mga/MGARelationshipActivityLog.jsx (audit log)

### Test Files
25. tests/gate7a/gate7a-3-relationship-lifecycle.test.js
26. tests/gate7a/gate7a-3-scope-resolver.test.js
27. tests/gate7a/gate7a-3-permission-resolver.test.js
28. tests/gate7a/gate7a-3-mga-visibility.test.js
29. tests/gate7a/gate7a-3-broker-book-separation.test.js
30. tests/gate7a/gate7a-3-safe-payloads.test.js
31. tests/gate7a/gate7a-3-audit-events.test.js
32. tests/gate7a/gate7a-3-regression-guardrails.test.js
33. tests/gate7a/gate7a-3-ui-integration.test.js
34. tests/gate7a/gate7a-3-analytics-scoping.test.js

---

## Files to Modify

### Core Backend (Non-Breaking Enhancements)
1. lib/scopeResolver.js — Add relationship context to scope resolution (backward-compatible)
2. lib/permissionResolver.js — Add scope boundary validation (backward-compatible)
3. lib/auditWriter.js — Add relationship event types (new event types, existing preserved)
4. lib/contracts/brokerDuplicateDetectionContract.js — (no changes, reference only)
5. lib/contracts/brokerPlatformRelationshipContract.js — (no changes, reference only)

### Service Layer (New Methods)
6. lib/mga/services/mgaService.js — Add relationship-scoped queries
7. lib/mga/services/auditService.js — Add relationship audit event recording

### Feature Flag Configuration
8. lib/featureFlags/brokerWorkspaceFlags.js — Register 9 new Gate 7A-3 flags (all default false)

### Frontend Components (No Route Changes)
9. components/broker/BrokerDashboard.jsx — Add relationship dashboard card (conditional on flag)
10. components/mga/MGACommandCenter.jsx — Add affiliated book section (conditional on flag)

### Test Suite (No Modifications to Existing Tests)
11. tests/gate7a/gate7a-2-regression-guardrails.test.js — (reference only, no changes)

---

## BrokerMGARelationship Lifecycle Implementation Plan

### Phase 7A-3.1: Data Model & CRUD Operations

**Objective:** Implement complete relationship CRUD and lifecycle management.

**Implementation Steps:**

1. **BrokerMGARelationshipContract** (lib/contracts/brokerMGARelationshipContract.js)
   - `proposeBrokerMGARelationship(broker_id, mga_id, scope, proposed_by_email, proposed_by_role)` → relationship
   - `acceptBrokerMGARelationship(relationship_id, accepted_by_email)` → relationship (status: ACTIVE)
   - `requestScopeChange(relationship_id, new_scope_definition, requested_by_email)` → relationship (status: SCOPE_CHANGE_REQUESTED)
   - `acceptScopeChange(relationship_id, approved_by_email)` → relationship (status: ACTIVE, updated scope)
   - `suspendBrokerMGARelationship(relationship_id, suspended_by_email, reason)` → relationship (status: SUSPENDED)
   - `resumeBrokerMGARelationship(relationship_id, resumed_by_email)` → relationship (status: ACTIVE)
   - `terminateBrokerMGARelationship(relationship_id, terminated_by_email, reason)` → relationship (status: TERMINATED, visibility_active: false)
   - `listBrokerRelationships(broker_id, filters)` → [relationships]
   - `listMGARelationships(mga_id, filters)` → [relationships]
   - `getRelationship(relationship_id)` → relationship
   - `getRelationshipScope(relationship_id)` → scope_definition

2. **BrokerMGARelationshipService** (lib/services/brokerMGARelationshipService.js)
   - Wrap contract methods with business logic
   - Validate state transitions
   - Trigger audit events
   - Enforce role/actor checks

3. **Backend Functions** (src/functions/)
   - proposeBrokerMGARelationship.js (invoke contract.propose)
   - acceptBrokerMGARelationship.js (invoke contract.accept)
   - modifyRelationshipScope.js (invoke contract.request_scope_change + accept)
   - suspendBrokerMGARelationship.js (invoke contract.suspend)
   - terminateBrokerMGARelationship.js (invoke contract.terminate)

4. **Tests** (tests/gate7a/gate7a-3-relationship-lifecycle.test.js)
   - Unit: Each contract method (10 tests per method = 100 tests)
   - Integration: Full lifecycle workflows (50 tests)
   - Regression: Gate 7A-0/1/2 unaffected (15 tests)
   - **Total: 165 tests**

**Success Criteria:**
- All contract methods callable and return correct state
- All state transitions audit-logged
- All lifecycle flows tested and passing
- No breaking changes to Gate 7A-0, 7A-1, 7A-2

---

## Scope Resolver Implementation Plan

### Phase 7A-3.2: Enhanced Scope Resolution

**Objective:** Enhance scope resolver to include relationship context without breaking existing behavior.

**Implementation Steps:**

1. **Scope Resolver Enhancement** (lib/scopeResolver.js)
   - Add `resolveScope(user, context)` → enhanced scope object
   - Include `active_relationships` array in scope
   - Include `visibility_boundary` (direct_broker_owned, mga_affiliated, or both)
   - Preserve existing behavior for standalone users (no relationships)
   - Call listBrokerRelationships or listMGARelationships as needed

2. **Query Filter Application** (lib/scopeResolver.js)
   - `applyScopeFilter(query, scope, record_type)` function
   - Broker: Filter by own broker_agency_id + distribution_channel + relationship_id
   - MGA: Filter by master_general_agent_id + relationship_id + distribution_channel = mga_affiliated
   - Platform: No filter

3. **Backward Compatibility Tests**
   - Standalone broker scope unchanged
   - Existing queries unaffected
   - Scope filtering additive (no removals)

4. **Tests** (tests/gate7a/gate7a-3-scope-resolver.test.js)
   - Unit: Scope resolution with relationships (30 tests)
   - Integration: Query filtering with scope (25 tests)
   - Regression: Standalone broker scope unchanged (15 tests)
   - **Total: 70 tests**

**Success Criteria:**
- Scope resolver returns relationship context
- Query filters apply relationship scopes correctly
- Standalone brokers unaffected
- All tests passing

---

## Permission Resolver Implementation Plan

### Phase 7A-3.3: Scope-Aware Permission Enforcement

**Objective:** Enhance permission resolver to validate relationship scope boundaries.

**Implementation Steps:**

1. **Permission Resolver Enhancement** (lib/permissionResolver.js)
   - Add scope_definition context to resolvePermission(user, action, scope, context)
   - Check allowed_operations, denied_operations, read_only_operations
   - Return { allowed: bool, reason?: string } with scope context
   - Log scope boundary violations as audit events

2. **Scope Boundary Validation** (lib/permissionResolver.js)
   - `validateScopeOperation(operation, scope_definition, user_role)` → {allowed: bool, reason?: string}
   - Check operation in allowed_operations
   - Check operation not in denied_operations
   - Check read-only constraints if applicable

3. **Tests** (tests/gate7a/gate7a-3-permission-resolver.test.js)
   - Unit: Permission resolution with scope (35 tests)
   - Integration: Scope boundary validation (25 tests)
   - Regression: Role/action permissions unchanged (15 tests)
   - **Total: 75 tests**

**Success Criteria:**
- Scope boundaries enforced
- Denied operations return 403 SCOPE_BOUNDARY_VIOLATION
- Audit events logged for violations
- Role-based permissions unchanged

---

## Backend Service / Contract Implementation Plan

### Phase 7A-3.4: Visibility & Book Separation Services

**Objective:** Implement MGA visibility queries and broker book separation.

**Implementation Steps:**

1. **MGAVisibilityContract** (lib/contracts/mgaVisibilityContract.js)
   - `getMGAAffiliatedRecords(mga_id, record_type, relationship_id, filters)` → [records]
   - `getMGAAccessLog(mga_id, record_id, relationship_id)` → [access_events]
   - `validateMGAAccess(mga_id, operation, record_id, relationship_id)` → {allowed: bool}
   - `getMGAAffiliatedBookSummary(mga_id)` → {total_brokers, cases, quotes, proposals}

2. **BrokerBookSeparationContract** (lib/contracts/brokerBookSeparationContract.js)
   - `classifyRecord(broker_id, record_type, record_data, relationship_id)` → {distribution_channel, relationship_id}
   - `listBrokerDirectBook(broker_id, record_type, filters)` → [direct_records]
   - `listBrokerMGAAffiliatedRecords(broker_id, mga_id, filters)` → [affiliated_records]
   - `getDirectBookSummary(broker_id)` → {cases, quotes, census}
   - `getAffiliatedBookSummary(broker_id, mga_id)` → {cases, quotes, by_mga}

3. **MGAVisibilityService** (lib/services/mgaVisibilityService.js)
   - Query filtering for MGA visibility
   - Scope boundary checking per record type
   - Access logging

4. **Backend Functions** (src/functions/)
   - getMGAAffiliatedRecords.js (invoke contract.get)
   - getMGAAccessLog.js (invoke contract.getAccessLog)
   - validateMGAAccess.js (invoke contract.validate)

5. **Tests** (tests/gate7a/gate7a-3-mga-visibility.test.js + gate7a-3-broker-book-separation.test.js)
   - Unit: Visibility contract methods (40 tests)
   - Integration: Scoped queries (35 tests)
   - Book separation: Direct vs affiliated (30 tests)
   - **Total: 105 tests**

**Success Criteria:**
- MGA queries scoped to relationship
- Direct book hidden from MGA
- Book separation verified
- All tests passing

---

## Frontend UI / UX Implementation Plan

### Phase 7A-3.5: User Interfaces for Relationship Management

**Objective:** Implement UI surfaces for broker relationship management and MGA affiliated book dashboard.

**Implementation Steps:**

1. **Broker Workspace Components:**
   - `BrokerMGARelationshipDashboard.jsx` — Dashboard card (conditional on BROKER_MGA_RELATIONSHIP_UI_ENABLED)
   - `BrokerMGARelationshipListView.jsx` — Relationship list table
   - `BrokerMGARelationshipDetailModal.jsx` — Detail/edit modal
   - `BrokerScopeEditorModal.jsx` — Scope definition editor
   - `RecordVisibilitySelector.jsx` — Direct vs affiliated radio/toggle

2. **MGA Dashboard Components:**
   - `MGAAffiliatedBrokersList.jsx` — Broker relationship list
   - `MGAAffiliatedBookDashboard.jsx` — Affiliated records view
   - `MGARelationshipActivityLog.jsx` — Audit trail view

3. **Integration Points:**
   - Modify `BrokerDashboard.jsx` to include relationship card (conditional)
   - Modify `MGACommandCenter.jsx` to include affiliated book section (conditional)
   - Add relationship selection to case/census/quote/proposal creation flows

4. **Tests** (tests/gate7a/gate7a-3-ui-integration.test.js)
   - UI render tests (20 tests)
   - User interaction tests (30 tests)
   - Data binding tests (15 tests)
   - **Total: 65 tests**

**Success Criteria:**
- UI surfaces render correctly (feature flag controlled)
- User workflows functional
- Data bindings correct
- No workspace structural changes

---

## MGA Dashboard Visibility Implementation Plan

### Objective: Implement MGA-specific visibility rules

**Implementation Steps:**

1. **MGAAffiliatedBrokersList Component:**
   - Query: listMGARelationships(mga_id) → filter to ACTIVE only
   - Display: Broker name, status, scope, effective date, book size
   - Actions: View affiliated book, scope details, audit trail

2. **MGAAffiliatedBookDashboard Component:**
   - Query: getMGAAffiliatedRecords(mga_id, record_type, relationship_id)
   - Filter by relationship scope (allowed_operations)
   - Display: Cases, quotes, proposals (read-only per scope)
   - Actions: View details, export (if permitted)

3. **MGARelationshipActivityLog Component:**
   - Query: getMGAAccessLog(mga_id, relationship_id)
   - Display: User, action, timestamp, scope used
   - Filter: By broker, action, date range

4. **Tests:**
   - Included in UI integration tests (15 tests dedicated to MGA visibility)

**Success Criteria:**
- MGA sees only affiliated records
- MGA cannot see direct broker book
- Scoping enforced in queries
- Audit trail shows access history

---

## Broker Workspace Visibility Implementation Plan

### Objective: Implement broker-side relationship management without workspace structural changes

**Implementation Steps:**

1. **Broker Workspace Modifications (No Structural Changes):**
   - Add MGA Relationships dashboard card (conditional on BROKER_MGA_RELATIONSHIP_UI_ENABLED)
   - Add relationship management modals (no new routes)
   - Add book classification UI to record creation flows (no new pages)
   - Preserve existing workspace access control

2. **Record Creation Flows:**
   - When creating case/census/quote/proposal, add checkbox: "MGA-affiliated?"
   - If yes: Select MGA relationship from active relationships
   - If no: Default to direct_broker_owned
   - Save both distribution_channel and relationship_id

3. **Record Listing Filters:**
   - Broker sees direct book + affiliated books (from own relationships)
   - Add filter: "Show direct book only" / "Show affiliated" / "Show all"
   - Preserve existing filters and sorting

4. **Tests:**
   - Included in UI integration tests (20 tests for broker workspace)

**Success Criteria:**
- Relationship management UI integrated
- Record classification working
- Workspace access unchanged
- No structural changes to workspace

---

## Analytics / Reporting Scope Implementation Plan

### Objective: Scope analytics queries to relationship boundaries

**Implementation Steps:**

1. **Enhanced Analytics Queries:**
   - Broker analytics: Direct book + affiliated books by relationship
   - MGA analytics: Affiliated books only (by active relationships)
   - Platform analytics: All books unrestricted

2. **Analytics Components:**
   - No new components; modify existing analytics queries to use scope resolver
   - Apply relationship filters to existing analytics dashboards

3. **Feature Flag:**
   - `MGA_AFFILIATED_BOOK_ANALYTICS_ENABLED` (parent: `MGA_AFFILIATED_RECORD_VISIBILITY_ENABLED`)
   - Default: false

4. **Tests:**
   - Included in analytics scoping tests (25 tests)

**Success Criteria:**
- Analytics scoped to relationship boundaries
- MGA cannot see cross-broker aggregate data
- Broker can see own direct + affiliated analytics

---

## Safe Payload Enforcement Plan

### Objective: Ensure API responses never expose prohibited fields to MGA users

**Implementation Steps:**

1. **Safe Payload Sanitizer** (lib/security/safePayloadSanitizer.js)
   - Implement `sanitizeResponseForMGA(record, user_role, scope)` → sanitized_record
   - Remove prohibited fields based on role:
     - ❌ broker_internal_users
     - ❌ broker_financials
     - ❌ broker_commissions
     - ❌ broker_ein_tax_id
     - ❌ other_mga_relationships

2. **API Response Middleware:**
   - Apply sanitizer to all API responses where MGA users present
   - Check user role in scope context
   - Filter response fields accordingly

3. **Backend Functions:**
   - All getMGA* functions apply sanitizer before response
   - All relationship-returning functions apply sanitizer

4. **Tests** (tests/gate7a/gate7a-3-safe-payloads.test.js)
   - Field exposure tests (25 tests)
   - Role-based filtering tests (15 tests)
   - **Total: 40 tests**

**Success Criteria:**
- No prohibited fields exposed to MGA
- Responses safe for MGA visibility
- Broker/platform responses unaffected

---

## Audit Event Implementation Plan

### Objective: Implement complete audit logging for relationship lifecycle and MGA access

**Implementation Steps:**

1. **Audit Event Types** (lib/auditWriter.js)
   - relationship_proposed
   - relationship_accepted
   - relationship_scope_change_requested
   - relationship_scope_change_accepted
   - relationship_suspended
   - relationship_resumed
   - relationship_terminated
   - mga_record_accessed
   - scope_boundary_violation

2. **Audit Event Recording:**
   - Record in ActivityLog entity
   - Include correlation_id for multi-step operations
   - Timestamp, actor_email, actor_role, outcome

3. **Scope Violation Logging:**
   - Every 403 SCOPE_BOUNDARY_VIOLATION creates audit event
   - Records user, action, required scope, actual scope

4. **Tests** (tests/gate7a/gate7a-3-audit-events.test.js)
   - Event recording tests (35 tests)
   - Correlation ID tests (10 tests)
   - Scope violation logging tests (15 tests)
   - **Total: 60 tests**

**Success Criteria:**
- All relationship events logged
- All MGA access logged
- All violations logged
- Audit trail immutable and complete

---

## Feature Flag Implementation Matrix

### Feature Flags (All Default False)

```javascript
const gate7a3FeatureFlags = {
  // Parent: Relationship Workflows
  MGA_RELATIONSHIP_WORKFLOWS_ENABLED: {
    default: false,
    category: "relationship_management",
    activation_order: 1
  },

  // Child: Proposal/Acceptance
  MGA_RELATIONSHIP_PROPOSAL_ENABLED: {
    default: false,
    parent: "MGA_RELATIONSHIP_WORKFLOWS_ENABLED",
    activation_order: 2
  },

  MGA_RELATIONSHIP_ACCEPTANCE_ENABLED: {
    default: false,
    parent: "MGA_RELATIONSHIP_WORKFLOWS_ENABLED",
    activation_order: 3
  },

  // Child: Scope Management
  MGA_RELATIONSHIP_SCOPE_MANAGEMENT_ENABLED: {
    default: false,
    parent: "MGA_RELATIONSHIP_WORKFLOWS_ENABLED",
    activation_order: 4
  },

  // Parent: Visibility
  MGA_AFFILIATED_RECORD_VISIBILITY_ENABLED: {
    default: false,
    category: "visibility",
    activation_order: 5
  },

  // Child: Enforcement
  SCOPE_BOUNDARY_ENFORCEMENT_ENABLED: {
    default: false,
    parent: "MGA_AFFILIATED_RECORD_VISIBILITY_ENABLED",
    activation_order: 6
  },

  // Child: Dashboard
  MGA_AFFILIATED_BOOK_DASHBOARD_ENABLED: {
    default: false,
    parent: "MGA_AFFILIATED_RECORD_VISIBILITY_ENABLED",
    activation_order: 7
  },

  // Parent: UI
  BROKER_MGA_RELATIONSHIP_UI_ENABLED: {
    default: false,
    category: "ui_surfaces",
    activation_order: 8
  },

  // Parent: Audit
  MGA_ACTIVITY_AUDIT_ENABLED: {
    default: false,
    parent: "MGA_AFFILIATED_RECORD_VISIBILITY_ENABLED",
    activation_order: 9
  }
};
```

**Flag Activation Rules (Implementation Phase):**
- ❌ NO FLAGS ACTIVATED during implementation
- ✅ All flags default false
- ✅ Flags registered in lib/featureFlags/brokerWorkspaceFlags.js
- ✅ Activation controlled by separate operator directive
- ✅ Sequential activation (one surface at a time)
- ✅ Validation required before each activation

---

## Migration / Backfill Handling

### Explicitly Deferred

**Status:** Design phase complete; execution deferred.

**If Historical Data Discovered:**
1. Separate operator approval required
2. Dry-run migration mandatory
3. Reconciliation report required
4. Platform admin review required
5. No production execution without approval

**Current Phase:** Forward-going records only; no historical backfill.

---

## Regression Guardrails

### Gate 7A-0 Guardrails
✓ Scope resolver enhancements backward-compatible (standalone broker scope unchanged)  
✓ Permission resolver enhancements backward-compatible (existing roles/actions preserved)  
✓ Audit writer unchanged (new event types added, existing events preserved)  
✓ Test coverage: Gate 7A-0 tests pass without modification  

### Gate 7A-1 Guardrails
✓ Broker signup/compliance unchanged  
✓ MGA relationships post-signup only  
✓ Test coverage: Gate 7A-1 tests pass without modification  

### Gate 7A-2 Guardrails
✓ Workspace access control unchanged  
✓ Workspace remains fail-closed  
✓ Book of business filtering with relationships  
✓ Test coverage: Gate 7A-2 tests pass without modification  

### Gate 6K Guardrails
✓ MGA analytics scoped to relationships only  
✓ No cross-broker aggregate leakage  
✓ Test coverage: Gate 6K tests pass without modification  

### Gate 6L-A Guardrails
✓ Broker contacts remain private (not visible to MGA)  
✓ MGA user management separate  
✓ Test coverage: Gate 6L-A tests pass without modification  

---

## Acceptance Test Plan

### Target Test Count: 275-330 Tests

### Unit Tests (50-60 tests)
- BrokerMGARelationshipContract methods (35 tests)
- MGAVisibilityContract methods (15 tests)
- Scope/permission resolver unit tests (10 tests)

### Integration Tests (70-80 tests)
- Relationship lifecycle workflows (30 tests)
- Scope resolver + query filtering (20 tests)
- Permission resolver + scope boundaries (15 tests)
- Book separation logic (15 tests)

### Regression Tests (50-60 tests)
- Gate 7A-0 (scope/permission unchanged) (15 tests)
- Gate 7A-1 (broker signup unaffected) (5 tests)
- Gate 7A-2 (workspace access unchanged) (15 tests)
- Gate 6K (MGA analytics scoped) (10 tests)
- Gate 6L-A (broker contacts private) (10 tests)

### Safe Payload Tests (25-30 tests)
- MGA cannot see direct book (5 tests)
- MGA cannot see broker financials (5 tests)
- Scope violation responses (403) (5 tests)
- API field filtering (10 tests)

### UI/E2E Tests (40-50 tests)
- Relationship proposal workflow (10 tests)
- Relationship acceptance workflow (10 tests)
- Scope modification workflow (8 tests)
- MGA affiliated book dashboard (8 tests)
- Broker workspace relationship UI (8 tests)

### Feature Flag Tests (20-25 tests)
- Flag dependency validation (5 tests)
- Flag activation sequencing (5 tests)
- Feature gating correctness (10 tests)

### Security & Abuse-Case Tests (20-25 tests)
- MGA direct book probing (5 tests)
- Scope escalation attempts (5 tests)
- Relationship manipulation attempts (5 tests)
- Audit trail immutability (5 tests)

---

## Lint / Build Validation Plan

### Lint Standards
- ESLint configuration (existing)
- No new linting rules for Gate 7A-3
- All new files must pass existing lint (0 violations)
- CI/CD gates: No merge until lint clean

### Build Validation
- No breaking TypeScript/JSX syntax errors
- All imports resolvable
- No circular dependencies
- Tree-shaking compatible

### Test Coverage
- Minimum 85% coverage for new code
- Target 90% for critical paths (scope, permissions, audit)
- Coverage reports generated per phase

---

## Rollback Plan

### Rollback Level 1: Feature Flag Deactivation (Fastest)
- Set all MGA_* flags to false
- Time: <5 minutes
- Data: Immutable (no changes)
- Rollback: Instant, no side effects

### Rollback Level 2: Code Rollback (If Needed)
- Revert contract implementations
- Revert scope/permission enhancements
- Revert service layer changes
- Time: 15-30 minutes
- Data: No mutations; queries adjust
- Rollback: Staged, infrastructure restart required

### Rollback Level 3: Data Cleanup (If Needed)
- Remove relationship_id and distribution_channel stamps
- Preserve immutable audit trail (no deletion)
- Restore visibility to pre-relationship state
- Time: 1-4 hours depending on data volume
- Data: Non-destructive (only metadata stamps removed)
- Rollback: Full (no residual relationship records)

### Rollback Triggers (Any One Activates)
- Critical scope violation not caught
- Regression in prior gates
- Data corruption or unauthorized access
- Audit trail integrity failure
- Test failure rate >5%

---

## Implementation Sequence

### Phase 7A-3.1: Relationship Lifecycle (Weeks 1-2)
- Implement BrokerMGARelationshipContract
- Implement BrokerMGARelationshipService
- Implement backend functions (propose, accept, terminate, etc.)
- Create 165 unit + integration tests
- Validate: All lifecycle tests passing

### Phase 7A-3.2: Scope Resolution (Weeks 2-3)
- Enhance scopeResolver.js
- Implement query filtering
- Ensure backward compatibility
- Create 70 tests
- Validate: Standalone brokers unaffected

### Phase 7A-3.3: Permission Enforcement (Weeks 3-4)
- Enhance permissionResolver.js
- Implement scope boundary validation
- Add audit logging for violations
- Create 75 tests
- Validate: Scope violations logged and blocked

### Phase 7A-3.4: Visibility & Book Separation (Weeks 4-5)
- Implement MGAVisibilityContract
- Implement BrokerBookSeparationContract
- Implement backend functions
- Create 105 tests
- Validate: MGA visibility scoped correctly

### Phase 7A-3.5: UI, Analytics, Audit (Weeks 5-7)
- Implement frontend components
- Implement analytics scoping
- Implement audit event logging
- Create 40 safe payload tests + 65 UI tests + 60 audit tests
- Validate: All surfaces integrated and tested

### Phase 7A-3.6: Regression & Cleanup (Weeks 7-8)
- Run full regression suite (all prior gates)
- Performance testing
- Documentation finalization
- Feature flag registry completion
- Operator readiness review

---

## Stop Conditions

### STOP if:
- [ ] Any regression test failure (7A-0, 7A-1, 7A-2, 6K, 6L-A)
- [ ] Scope violation not auditable
- [ ] Direct book visible to MGA in any query
- [ ] Scope boundary violation returns 403 with correct reason
- [ ] Feature flag activation occurs without approval
- [ ] Schema modification attempted
- [ ] Route exposure occurs
- [ ] >5% test failure rate
- [ ] Lint violations introduced
- [ ] Audit trail corruption detected

### PAUSE if:
- [ ] Open design questions emerge
- [ ] Operator decisions required (unexpected)
- [ ] Cross-gate risk identified
- [ ] Performance regression >10%
- [ ] Security vulnerability discovered

---

## Explicit Guardrails (Non-Negotiable)

### Broker Agency Autonomy
✅ No broker-wide MGA visibility  
✅ No implicit MGA ownership of Broker Agency  
✅ Broker Agency remains first-class entity  

### Direct Business Protection
✅ Direct broker business NOT converted to MGA-affiliated  
✅ Direct book never visible to MGA  
✅ Broker control over book classification retained  

### Relationship Governance
✅ No relationship activation without required approval or platform override  
✅ Scope modification requires explicit authorization  
✅ Termination stops future visibility (historical preserved)  

### Data Integrity
✅ No schema migration execution (deferred)  
✅ No raw entity reads for protected data (backend contracts required)  
✅ All access through backend service wrappers  

### Auditability
✅ All denied scope access auditable  
✅ All relationship state changes logged  
✅ Audit trail permanent and immutable  

### Security
✅ Feature flags default false (no silent activation)  
✅ Scope violations return 403 (not 401)  
✅ All prohibited fields filtered from MGA responses  

### Prior Work Preservation
✅ Gate 7A-2 closed state not reopened or modified  
✅ Gate 7A-0/1/2 tests unchanged and passing  
✅ All prior gates remain locked  

---

## Operator Approval Block

### OPERATOR DECISION — GATE 7A-3 IMPLEMENTATION WORK ORDER:

```
[ ] APPROVE — Proceed to controlled implementation per work order

[ ] REJECT — Remediation required (specify issues below)

[ ] HOLD — Additional review required (specify concerns below)
```

### Operator Notes

**Approver Name:** ___________________________

**Approver Email:** ___________________________

**Approval Date:** ___________________________

**Additional Conditions (if any):**

```
[Space for operator-specific conditions, constraints, or dependencies]
```

**Contingency Actions (if implementation encounters blockers):**

```
[Space for pre-authorized escalation procedures]
```

---

## Work Order Acceptance Criteria

**This work order is READY FOR OPERATOR REVIEW.**

✅ Scope clearly defined (authorized vs. blocked)  
✅ Files to create/modify listed  
✅ Implementation phases sequenced  
✅ Test strategy specified (275-330 tests)  
✅ Regression guardrails documented  
✅ Feature flags designed (all default false)  
✅ Rollback procedures defined  
✅ Stop conditions identified  
✅ Guardrails explicit and non-negotiable  
✅ Operator approval block included  

**Next Action:** Operator review and approval/rejection/hold decision.

---

**Gate 7A-3 Implementation Work Order — Complete and Ready for Operator Authorization**