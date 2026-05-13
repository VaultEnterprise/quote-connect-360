# Gate 7A-3 MGA Relationship Support — Discovery / Preflight

**Date:** 2026-05-13  
**Phase:** Discovery / Preflight (Read-Only Analysis)  
**Runtime Status:** INACTIVE  
**Implementation Status:** NOT AUTHORIZED

---

## Executive Summary

Gate 7A-3 must enable MGA/Broker Agency relationships while preserving Broker Agencies as first-class standalone entities. Relationships are optional, explicit, scoped, and auditable. An MGA can only access records within active relationship scope. Broker Agency direct business remains independent. This discovery identifies current architecture, proposes relationship model, and catalogs implementation requirements.

---

## Current Architecture Baseline (Post-Gate 7A-2)

### Entities Established

#### Core Broker Agency Entities
- **BrokerAgencyProfile** — First-class entity, core identity
- **BrokerPlatformRelationship** — Broker ↔ Platform relationship (not MGA-dependent)
- **BrokerScopeAccessGrant** — Access grant issuance to users
- **BrokerAgencyUser** — Broker agency users

#### Distribution Channel Context
- **DistributionChannelContext** — Classification (direct_book, mga_affiliated)
- Direct book records: distribution_channel = "direct_book", master_general_agent_id = null
- MGA-affiliated records: distribution_channel = "mga_affiliated", master_general_agent_id = set

#### Existing Relationship Entity (Pre-Gate 7A-3)
- **BrokerMGARelationship** — (Schema exists via Gate 7A-0, not yet operationalized)
  - broker_agency_id (required)
  - master_general_agent_id (required)
  - relationship_status (enum: proposed, active, suspended, terminated)
  - effective_date (date)
  - termination_date (date, nullable)
  - operational_scope (enum: limited, full, custom)
  - audit_correlation_id

### Scope & Permission Architecture

#### Scope Resolver (Gate 7A-0)
- Resolves user scope based on role, agency, MGA affiliation
- Returns scopes (agency, mga)
- Used to filter queries

#### Permission Resolver (Gate 7A-0)
- Maps role ↔ action
- Examples: read_list, create_case, upload_census, manage_users
- Enforces RBAC

#### Audit Writer (Gate 7A-0)
- Records all state changes
- Immutable audit trail
- ActivityLog entity

### Routes & Feature Flags (Gate 7A-2)

#### Routes
- /broker (direct workspace, fails closed while BROKER_WORKSPACE_ENABLED = false)
- /mga/command (MGA admin interface, accessible only to mga_admin/mga_user roles)
- No dedicated MGA-specific broker relationship UI routes yet

#### Feature Flags (All False)
- BROKER_WORKSPACE_ENABLED = false
- BROKER_DIRECT_BOOK_ENABLED = false
- 12 other workspace/action flags = false
- No MGA-specific feature flags yet created

### Current Limitations

- MGA relationship entity exists (schema) but NOT operationalized
- No MGA visibility rules implemented
- No relationship lifecycle management
- No scoped data access based on relationship
- Broker Agency workspace isolation does NOT yet consider MGA relationships
- No MGA-affiliate dashboard or relationship management UI

---

## Proposed Gate 7A-3 Relationship Model

### Design Principles

1. **Broker Agency Primacy:** Broker Agencies are first-class entities, never subordinate to MGAs.
2. **Relationship Optionality:** Broker Agencies can operate independently without any MGA relationship.
3. **Explicit Affiliation:** MGA access requires active, documented BrokerMGARelationship record.
4. **Scope Binding:** MGA visibility limited to records tagged with relationship scope.
5. **Book Separation:** Direct broker business (direct_book channel) never MGA-visible.
6. **Auditability:** All relationship state changes audited with correlation IDs.
7. **Regulatory Compliance:** Relationship termination does not retroactively grant/revoke access.

### Relationship Lifecycle

#### States (Enhanced from current schema)

```
PROPOSED → ACTIVE → ACTIVE (modified) → SUSPENDED → TERMINATED
   ↓        ↓          ↓                     ↓
[Pending]  [Live]   [Renegotiated]     [Paused] [End]
```

#### Lifecycle Events

| Event | From | To | Audit | Example |
|-------|------|----|----|---------|
| Propose | — | PROPOSED | ✓ | Broker initiates MGA relationship request |
| Accept | PROPOSED | ACTIVE | ✓ | MGA accepts broker partnership |
| Modify Scope | ACTIVE | ACTIVE* | ✓ | Broker and MGA negotiate scope change |
| Suspend | ACTIVE | SUSPENDED | ✓ | Temporary relationship pause |
| Resume | SUSPENDED | ACTIVE | ✓ | Relationship resumed |
| Terminate | ACTIVE/SUSPENDED | TERMINATED | ✓ | Relationship ends |

**Audit Requirement:** Every state transition records:
- State from/to
- Actor (broker user email, MGA user email, platform admin)
- Timestamp
- Correlation ID
- Reason/notes

### Scoped Visibility Model

#### Book Separation

**Broker Direct Book (distribution_channel = "direct_book")**
- Master General Agent ID: null
- MGA Access: ❌ NO (never)
- Platform Access: ✅ YES
- Broker Access: ✅ YES
- Visibility: Broker + Platform only

**MGA-Affiliated Records (distribution_channel = "mga_affiliated", active relationship)**
- Master General Agent ID: set
- MGA Access: ✅ YES (if active relationship + operation in scope)
- Platform Access: ✅ YES
- Broker Access: ✅ YES (owner)
- Visibility: Broker + MGA + Platform

#### Record Classification

When a Broker Agency creates a record, it chooses:
1. **Direct Book** (broker owns entirely)
   - distribution_channel = "direct_book"
   - master_general_agent_id = null
   - MGA cannot see

2. **MGA-Affiliated** (broker elects MGA visibility)
   - distribution_channel = "mga_affiliated"
   - master_general_agent_id = [MGA ID]
   - Only visible to MGA if relationship is ACTIVE
   - Relationship scope must permit operation type

### Relationship Scope Levels

#### Limited Scope
- MGA can READ: cases, census, proposals (read-only)
- MGA can CREATE: tasks, annotations
- MGA CANNOT: modify quotes, manage users, access financials

#### Full Scope
- MGA can READ/CREATE/UPDATE: cases, census, quotes, proposals
- MGA CANNOT: delete records, manage broker users, modify broker settings

#### Custom Scope
- Platform admin / broker + MGA negotiate specific operations
- Explicitly enumerated allowed/denied operations

### Scope Resolver Implications

**Current Behavior:**
```javascript
resolveScope(user) → {
  user_id: string,
  role: "broker_user" | "mga_user" | "platform_admin",
  broker_agency_id: string | null,
  master_general_agent_id: string | null
}
```

**Enhanced Behavior (Gate 7A-3):**
```javascript
resolveScope(user, context) → {
  user_id: string,
  role: "broker_user" | "mga_user" | "platform_admin",
  broker_agency_id: string | null,
  master_general_agent_id: string | null,
  active_relationships: [
    {
      broker_agency_id: string,
      master_general_agent_id: string,
      relationship_status: "ACTIVE",
      operational_scope: "limited" | "full" | "custom",
      scope_definition: {...}
    }
  ],
  effective_scope_boundary: "direct_book" | "mga_affiliated" | "both"
}
```

**Query Filtering (Enhanced):**
- Broker user: See own broker records (all channels) + MGA-affiliated records linked to own broker ID
- MGA user: See MGA-affiliated records ONLY where:
  - master_general_agent_id = user's MGA ID
  - relationship status = ACTIVE
  - Operation type in allowed scope
  - Record's broker_agency_id matches relationship broker_agency_id

### Permission Resolver Implications

**Current Permissions:**
- create_case, read_case, update_case, delete_case
- upload_census, validate_census
- create_quote, read_quote, submit_quote
- etc.

**Enhanced (Gate 7A-3):**
- Permissions now include relationship scope context
- Example: create_quote (allowed only if operational_scope includes "quote_creation")
- Scope violations return 403 FORBIDDEN (not 401)
- Audit event records denied scope violations

### Audit Requirements

#### New Audit Events for Gate 7A-3

| Event | Entity | Recorded Fields |
|-------|--------|-----------------|
| relationship_proposed | BrokerMGARelationship | broker_id, mga_id, proposed_scope, actor, timestamp |
| relationship_accepted | BrokerMGARelationship | broker_id, mga_id, scope, actor, timestamp |
| relationship_scope_modified | BrokerMGARelationship | broker_id, mga_id, old_scope, new_scope, actor, timestamp |
| relationship_suspended | BrokerMGARelationship | broker_id, mga_id, reason, actor, timestamp |
| relationship_resumed | BrokerMGARelationship | broker_id, mga_id, actor, timestamp |
| relationship_terminated | BrokerMGARelationship | broker_id, mga_id, reason, actor, timestamp |
| scope_boundary_violation | ActivityLog | user_id, action, scope_required, actor, timestamp |
| mga_record_accessed | ActivityLog | mga_id, broker_id, record_id, record_type, scope_used, actor, timestamp |

#### Audit Correlation
- All relationship events tagged with audit_correlation_id
- Allows tracing multi-step relationship state changes

### Safe Payload Requirements

#### Visibility in API Responses

**Broker User Response (own records):**
```json
{
  "id": "case1",
  "broker_agency_id": "broker1",
  "distribution_channel": "direct_book",
  "master_general_agent_id": null,
  "case_type": "new_business"
}
```

**MGA User Response (affiliated records only):**
```json
{
  "id": "case2",
  "broker_agency_id": "broker1",
  "distribution_channel": "mga_affiliated",
  "master_general_agent_id": "mga1",
  "case_type": "new_business"
}
```

**MGA User Response (denied scope):**
```json
{
  "error": "SCOPE_BOUNDARY_VIOLATION",
  "message": "Operation not permitted within relationship scope",
  "required_scope": "full",
  "current_scope": "limited"
}
```

#### Prohibited Exposures
- ❌ MGA cannot see broker direct book records
- ❌ MGA cannot see broker financials/pricing/commissions
- ❌ MGA cannot see broker internal users/roles
- ❌ MGA cannot see other MGAs' relationships
- ❌ Direct access to BrokerMGARelationship pivot fields only for authorized parties

---

## UI / UX Surfaces Likely Needed

### Broker Agency Workspace (Gate 7A-2 Extended)
- **MGA Relationships Dashboard:**
  - List active/proposed MGA relationships
  - Show relationship status, scope, effective date
  - Action buttons: propose, accept, modify scope, suspend, terminate
  - Audit trail of relationship state changes

- **MGA Relationship Detail View:**
  - Edit scope (for ACTIVE relationships)
  - View MGA user activity/access logs
  - Export relationship terms (PDF)
  - Terminate relationship with reason

- **Book Management:**
  - Create case → choice: "Direct Book" vs "MGA-Affiliated"
  - If MGA-affiliated, select MGA relationship
  - Display current visibility: "Broker + Platform" vs "Broker + MGA + Platform"

### MGA Command Center (Gate 6K Extended)
- **Affiliated Broker List:**
  - List all brokers with ACTIVE relationships
  - Filter by scope, effective date, status
  - View relationship terms, scope definition

- **Affiliated Book Dashboard:**
  - Cases, quotes, proposals from affiliated brokers
  - Scoped to permitted operations only
  - "Read-only" badge if limited scope

- **Relationship Activity:**
  - Audit trail of MGA access to broker records
  - User activity logs per broker relationship

### Platform Admin / Command Center
- **Relationship Governance:**
  - Arbitrate relationship disputes
  - Modify scope (admin override)
  - Suspend/terminate relationships
  - Audit trail of all relationship actions

---

## Backend Contract Surfaces Likely Needed

### New Contracts (Not Yet Implemented)

#### 1. BrokerMGARelationshipContract
- `proposeBrokerMGARelationship(broker_id, mga_id, scope)` → relationship
- `acceptBrokerMGARelationship(relationship_id)` → relationship
- `modifyRelationshipScope(relationship_id, new_scope)` → relationship
- `suspendBrokerMGARelationship(relationship_id, reason)` → relationship
- `resumeBrokerMGARelationship(relationship_id)` → relationship
- `terminateBrokerMGARelationship(relationship_id, reason)` → relationship
- `listBrokerRelationships(broker_id)` → [relationship]
- `listMGARelationships(mga_id)` → [relationship]
- `getRelationshipScope(relationship_id)` → scope_definition

#### 2. MGAVisibilityContract
- `getMGAAffiliatedRecords(mga_id, record_type, relationship_id)` → [records]
- `getMGAAccessLog(mga_id, record_id, relationship_id)` → [access_events]
- `validateMGAAccess(mga_id, operation, record_id, relationship_id)` → {allowed: bool, reason?: string}

#### 3. BrokerBookSeparationContract
- `classifyRecord(broker_id, record_type, distribution_channel)` → classification
- `listBrokerDirectBook(broker_id)` → [direct_records]
- `listBrokerMGAAffiliatedRecords(broker_id, mga_id)` → [affiliated_records]

### Enhanced Contracts (Gate 7A-0 + Gate 7A-3)

#### Scope Resolver (Enhanced)
- Input: user, context (record_id, operation, relationship_id)
- Output: effective_scope with relationship list
- Logic: Check active relationships, validate scope boundaries

#### Permission Resolver (Enhanced)
- Input: user, action, scope_boundary
- Output: {allowed: bool, reason?: string}
- Logic: Check role + relationship scope

#### Audit Writer (Enhanced)
- Input: event_type, entity_id, scope_context
- Output: audit_event_id
- Logic: Record relationship lifecycle events

---

## Feature Flags Required (All Default False)

### Proposed Gate 7A-3 Feature Flags

| Flag | Scope | Description | Default |
|------|-------|-------------|---------|
| MGA_RELATIONSHIP_WORKFLOWS_ENABLED | parent | Enable MGA/broker relationship lifecycle | false |
| MGA_RELATIONSHIP_PROPOSAL_ENABLED | relationship_workflow | Allow broker to propose relationships | false |
| MGA_RELATIONSHIP_ACCEPTANCE_ENABLED | relationship_workflow | Allow MGA to accept relationships | false |
| MGA_RELATIONSHIP_SCOPE_MANAGEMENT_ENABLED | relationship_workflow | Allow scope modification | false |
| MGA_AFFILIATED_RECORD_VISIBILITY_ENABLED | visibility | Enable MGA to see affiliated records | false |
| MGA_AFFILIATED_BOOK_DASHBOARD_ENABLED | dashboard | Show MGA affiliated broker book | false |
| BROKER_MGA_RELATIONSHIP_UI_ENABLED | ui | Show relationship management UI in broker workspace | false |
| SCOPE_BOUNDARY_ENFORCEMENT_ENABLED | enforcement | Enforce relationship scope in queries/operations | false |
| MGA_ACTIVITY_AUDIT_ENABLED | audit | Log MGA access to affiliated records | false |

**Dependency Tree:**
```
MGA_RELATIONSHIP_WORKFLOWS_ENABLED (parent)
├─ MGA_RELATIONSHIP_PROPOSAL_ENABLED
├─ MGA_RELATIONSHIP_ACCEPTANCE_ENABLED
├─ MGA_RELATIONSHIP_SCOPE_MANAGEMENT_ENABLED
│
MGA_AFFILIATED_RECORD_VISIBILITY_ENABLED (parent)
├─ SCOPE_BOUNDARY_ENFORCEMENT_ENABLED
├─ MGA_AFFILIATED_BOOK_DASHBOARD_ENABLED
│
BROKER_MGA_RELATIONSHIP_UI_ENABLED (parent)
├─ (sub-flags depend on workflow flags)
```

---

## Migration / Backfill Implications

### Data Migration Required

#### BrokerMGARelationship Population
- **Scenario 1:** No historical MGA relationships exist (clean slate)
  - No backfill needed
  - Relationships created via UI/API during Gate 7A-3+

- **Scenario 2:** Historical MGA affiliations exist (e.g., from legacy system)
  - Dry-run migration: classify existing brokers
  - Map legacy affiliation → BrokerMGARelationship record
  - Set initial status (ACTIVE if currently affiliated, TERMINATED if not)
  - Audit correlation IDs for traceability
  - Platform admin review required

#### Record Classification
- **Scenario 1:** All new Gate 7A-2/7A-3 records classified at creation time
  - No backfill needed for future records
  - Historical records (if any) default to direct_book

- **Scenario 2:** Existing case/census/quote records need classification
  - Dry-run query: identify records with broker_agency_id
  - Classify as direct_book (unless known to be MGA-affiliated from legacy mapping)
  - Audit event for each classification
  - Non-destructive (no record mutations, only metadata stamps)

### Feature Flag Rollout

- Phase 1: Activate MGA_RELATIONSHIP_WORKFLOWS_ENABLED
- Phase 2: Activate MGA_AFFILIATED_RECORD_VISIBILITY_ENABLED
- Phase 3: Activate SCOPE_BOUNDARY_ENFORCEMENT_ENABLED
- Phase 4: Activate UI/dashboard flags

---

## Regression Risks

### Risk Assessment by Prior Gate

#### Gate 7A-0 (Core Model)
- **Risk Level:** LOW
- **Concern:** Scope resolver changes
- **Mitigation:** Enhanced scope resolver is backward-compatible; standalone broker scope unchanged
- **Confidence:** HIGH

#### Gate 7A-1 (Broker Signup)
- **Risk Level:** LOW
- **Concern:** Broker agency creation flow
- **Mitigation:** No changes to signup/compliance flow; MGA relationship is post-signup
- **Confidence:** HIGH

#### Gate 7A-2 (Broker Workspace)
- **Risk Level:** MEDIUM
- **Concern:** Workspace data filtering, access control
- **Mitigation:** Workspace access rules must be tested with relationship-scoped scope
- **Confidence:** MEDIUM (requires comprehensive integration tests)

#### Gate 6K (MGA Analytics)
- **Risk Level:** MEDIUM
- **Concern:** MGA analytics now scoped to affiliated relationships only
- **Mitigation:** Analytics queries must filter by active relationships
- **Confidence:** MEDIUM (scope boundary enforcement critical)

#### Gate 6L-A (Broker Contacts)
- **Risk Level:** LOW
- **Concern:** Broker contact visibility to MGA users
- **Mitigation:** Broker contacts remain broker-private; MGA users do not see broker internal users
- **Confidence:** HIGH

#### Deferred Gates (6I-B, 6J-B, 6J-C, 6L-B)
- **Risk Level:** LOW
- **Concern:** Minimal interaction with deferred features
- **Mitigation:** No changes to deferred feature schemas/permissions
- **Confidence:** HIGH

### Risk Mitigation Checklist

- [ ] Backward-compatibility test: standalone broker scope unchanged
- [ ] Integration test: scope resolver with relationships
- [ ] Integration test: permission resolver with scope boundaries
- [ ] Integration test: workspace data filtering with relationship scope
- [ ] Integration test: MGA analytics with affiliated books only
- [ ] Audit trail test: all relationship state changes logged
- [ ] Safe payload test: MGA responses exclude prohibited fields
- [ ] Regression test: Gate 7A-0/1/2, 6K, 6L-A remain functional

---

## Recommended Implementation Phases

### Phase 7A-3.1 (Contract Layer)
- Implement BrokerMGARelationshipContract (propose, accept, modify, suspend, terminate)
- Implement MGAVisibilityContract (scoped record access)
- Implement BrokerBookSeparationContract (direct vs affiliated)
- Enhanced scope/permission resolvers
- Unit tests for contracts (~40 tests)

### Phase 7A-3.2 (Backend Functions)
- Backend function: proposeBrokerMGARelationship
- Backend function: acceptBrokerMGARelationship
- Backend function: getMGAAffiliatedRecords
- Backend function: validateMGAScope
- Integration tests (~30 tests)

### Phase 7A-3.3 (Broker Workspace UI)
- MGA Relationships dashboard card
- Relationship proposal/acceptance modals
- Book classification UI (direct vs affiliated)
- Scope management views
- UI integration tests (~25 tests)

### Phase 7A-3.4 (MGA Command Center UI)
- Affiliated broker list
- Affiliated book dashboard
- Relationship activity logs
- UI integration tests (~25 tests)

### Phase 7A-3.5 (Validation & Cleanup)
- Full regression test suite (Gate 7A-0, 7A-1, 7A-2, 6K, 6L-A)
- Safe payload validation
- Audit trail validation
- Scope boundary enforcement tests
- ~50 validation tests

**Estimated Total Test Count:** 170-200 tests across phases

---

## Minimum Acceptance Test Categories

### Unit Tests (40-50 tests)
- BrokerMGARelationshipContract methods (propose, accept, modify, suspend, terminate, list)
- MGAVisibilityContract methods (scoped queries, access validation)
- Scope resolver with relationship context
- Permission resolver with scope boundaries
- Audit event generation

### Integration Tests (50-60 tests)
- Relationship lifecycle (propose → active → suspend → terminate)
- Scope modification workflow
- MGA visibility after relationship activation
- Record classification (direct vs affiliated)
- Cross-broker isolation (MGAs cannot see other brokers' relationships)
- Workspace data filtering with relationship scope
- MGA analytics scoped filtering

### Regression Tests (40-50 tests)
- Gate 7A-0: Scope/permission resolution unchanged for standalone brokers
- Gate 7A-1: Broker signup unaffected
- Gate 7A-2: Workspace access control with relationships
- Gate 6K: MGA analytics scoped to affiliated brokers
- Gate 6L-A: Broker contacts not visible to MGA users
- Feature flag dependency enforcement

### Safe Payload Tests (20-30 tests)
- MGA users cannot see direct_book records
- MGA users cannot see broker financials/commissions
- MGA users cannot see broker internal users
- Scope boundary violation responses (403, not 401)
- Audit trail does not leak sensitive data

### UI/UX Tests (30-40 tests, if E2E)
- Relationship proposal workflow
- Relationship acceptance workflow
- Scope modification workflow
- MGA affiliated book dashboard
- Broker workspace relationship management
- Audit trail visibility

**Total Estimated Test Count: 180-230 tests**

---

## Open Questions / Operator Decisions Required

### Architecture Questions

1. **Backward Compatibility for Legacy Records:**
   - Should existing broker records (if any from pre-Gate 7A-3) be auto-classified as direct_book?
   - Or require explicit broker choice via migration/backfill?
   - **Operator Decision Required:** [ ]

2. **Relationship Proposal Initiator:**
   - Can only brokers propose relationships, or can MGAs propose?
   - If both, do they require different approval paths?
   - **Operator Decision Required:** [ ]

3. **Scope Modification:**
   - Can broker and MGA modify scope collaboratively, or only broker?
   - Does scope modification require platform admin approval?
   - **Operator Decision Required:** [ ]

4. **Relationship Termination Cascades:**
   - When relationship terminates, should MGA lose access to historical affiliated records?
   - Or retain read-only access for audit/compliance reasons?
   - **Operator Decision Required:** [ ]

5. **Multi-MGA Affiliation:**
   - Can a single Broker Agency have relationships with multiple MGAs simultaneously?
   - Can MGAs have overlapping visibility into broker records?
   - **Operator Decision Required:** [ ]

### Regulatory / Compliance Questions

6. **Audit Trail Retention:**
   - How long should relationship state change audit events be retained?
   - Separate retention policy from case/quote audit trail?
   - **Operator Decision Required:** [ ]

7. **Scope Violation Auditing:**
   - Should denied MGA access attempts be logged (security vs privacy)?
   - Should failed scope boundary checks trigger alerts?
   - **Operator Decision Required:** [ ]

### Implementation Questions

8. **Phase Ordering:**
   - Must contract layer (7A-3.1) be complete before UI work (7A-3.3)?
   - Can phases run in parallel?
   - **Operator Decision Required:** [ ]

9. **Feature Flag Activation:**
   - Should all relationship flags activate simultaneously or staggered?
   - Can subset of features (e.g., proposal) activate before others (acceptance)?
   - **Operator Decision Required:** [ ]

10. **Migration / Historical Data:**
    - If legacy affiliations exist, is dry-run migration required before backfill?
    - Who approves legacy relationship mappings?
    - **Operator Decision Required:** [ ]

---

## Summary: Key Constraints & Success Criteria

### Constraints (Non-Negotiable)
✅ Broker Agencies remain first-class  
✅ Broker Agencies optional (no MGA required)  
✅ MGA access relationship-scoped  
✅ Direct book never MGA-visible  
✅ All relationship changes audited  
✅ Scope violations return 403  
✅ No backward incompatibility with prior gates  

### Success Criteria
✅ BrokerMGARelationship operationalized with lifecycle  
✅ MGA visibility scoped to affiliated records only  
✅ Scope boundary enforcement in queries/operations  
✅ Relationship audit trail complete  
✅ Safe payloads prevent data leakage  
✅ 180-230 tests all passing  
✅ 0 lint violations  
✅ Regression tests for 7A-0, 7A-1, 7A-2, 6K, 6L-A pass  

---

## Preflight Checklist (Post-Discovery)

- [ ] Current architecture baseline confirmed
- [ ] Proposed relationship model reviewed by stakeholders
- [ ] Lifecycle states agreed upon
- [ ] Scope levels defined and accepted
- [ ] Audit requirements specified
- [ ] UI/UX surfaces identified
- [ ] Backend contract signatures drafted
- [ ] Feature flags designed (all default false)
- [ ] Migration implications assessed
- [ ] Regression risks identified and mitigation planned
- [ ] Implementation phases outlined
- [ ] Test categories and counts estimated
- [ ] Open questions documented
- [ ] Operator decisions requested (10 items)

---

**Discovery / Preflight Phase Complete**

**Awaiting operator review and decision responses before proceeding to Gate 7A-3 Design Specification.**