# Gate 7A-3 MGA Relationship Support — Design Specification

**Date:** 2026-05-13  
**Phase:** Design Specification (Design Only, No Implementation)  
**Runtime Status:** INACTIVE  
**Implementation Status:** NOT AUTHORIZED

---

## Executive Summary

Gate 7A-3 enables MGA/Broker Agency relationships while preserving Broker Agencies as first-class standalone entities. The design locks 10 operator decisions and specifies full system behavior: relationship lifecycle, scope binding, visibility separation, audit requirements, safe payloads, and feature flags (all default false). The architecture ensures Broker Agencies can operate independently, MGA relationships are optional/explicit, and MGAs access only affiliated records within relationship scope. Design is complete; implementation requires separate operator approval.

---

## Operator Decisions — Locked

### 1. Legacy Record Classification
**Decision:** Classify existing broker records as `direct_broker_owned` unless an explicit valid BrokerMGARelationship record exists for that broker and record era. No assumptions about historical affiliation.

**Rationale:** Clean slate approach; avoids retroactive MGA visibility.

**Implementation Impact:** Migration phase must explicitly validate relationship records before classifying records as MGA-affiliated.

---

### 2. Relationship Proposal Initiators
**Decision:** Platform admin, MGA admin, or broker admin may initiate; activation requires both MGA and broker consent OR platform admin override.

**Rationale:** Balanced control; neither party can unilaterally force relationship.

**State Machine:** PROPOSED (initiator) → AWAITING_ACCEPTANCE (recipient) → ACTIVE (both agree) OR ACTIVE (platform override).

---

### 3. Scope Modification Authority
**Decision:** Only platform admin or as part of approved relationship lifecycle action may alter scope. Broker/MGA may REQUEST scope change, but activation requires platform approval or mutual consent.

**Rationale:** Scope controls visibility; no unilateral changes to data access.

**Implementation:** Broker/MGA can propose scope change; state = SCOPE_CHANGE_REQUESTED; platform approves or denies.

---

### 4. Termination Cascade
**Decision:** Termination stops FUTURE MGA visibility immediately (flag visibility = false). Historical records retain audit trail and prior relationship reference (immutable). MGA cannot retroactively access post-termination records.

**Rationale:** Audit compliance; no retroactive access changes.

**Implementation:** relationship.visibility_active = false post-termination; historical records include relationship_id for lineage.

---

### 5. Multi-MGA Affiliation
**Decision:** Allow only if each relationship is explicitly scoped by case/book segment or explicit record tag. No global broker-wide MGA visibility via single relationship. Each relationship is isolated.

**Rationale:** Prevents accidental cross-MGA visibility; preserves broker control.

**Implementation:** Record must include specific relationship_id to be visible to MGA; cannot infer visibility from broker→MGA alone.

---

### 6. Audit Retention
**Decision:** Permanent immutable audit events (platform standard). No expiration for relationship state changes or MGA access logs. Compliance/audit trail never purged.

**Rationale:** Regulatory; financial audit trail non-negotiable.

**Implementation:** ActivityLog records for relationships never deleted; retention = PERMANENT.

---

### 7. Scope Violation Logging
**Decision:** Log ALL denied relationship-scope access attempts (security posture). Include user, action, required scope, actual scope, timestamp. May trigger alerts per platform policy.

**Rationale:** Security monitoring; detect MGA abuse/probing.

**Implementation:** Every 403 SCOPE_VIOLATION response creates audit event with full context.

---

### 8. Phase Execution Ordering
**Decision:** Relationship model → Scope Resolver → Permission Resolver → Service Contracts → UI surfaces → Analytics/Reporting. Sequential dependency; cannot parallelize earlier phases.

**Rationale:** Foundational layers must solidify before UI/reporting depend on them.

**Implementation Phases:** 7A-3.1 (model) → 7A-3.2 (resolvers) → 7A-3.3 (contracts) → 7A-3.4 (UI) → 7A-3.5 (analytics/validation).

---

### 9. Feature Flag Sequencing
**Decision:** All flags default false. Activate only ONE surface at a time after validation passing. Parent flags unlock child flags. Sequential activation prevents cascade failures.

**Rationale:** Safe rollout; isolate failures.

**Activation Order:** Workflows → Visibility → UI → Analytics.

---

### 10. Migration / Backfill
**Decision:** Design only; no execution now. If historical MGA affiliations discovered, separate operator approval required before dry-run migration and backfill. Current phase focuses on forward-going records only.

**Rationale:** High-risk operation; requires explicit approval and separate governance.

**Implementation:** Migration design deferred; backfill blocked until separate approval.

---

## Finalized Relationship Model

### BrokerMGARelationship Entity (Operationalized)

```json
{
  "id": "uuid",
  "broker_agency_id": "uuid (required)",
  "master_general_agent_id": "uuid (required)",
  "relationship_status": "enum (PROPOSED, AWAITING_ACCEPTANCE, ACTIVE, SCOPE_CHANGE_REQUESTED, SUSPENDED, TERMINATED)",
  "status_reason": "string (optional)",
  "operational_scope": "enum (limited, full, custom)",
  "scope_definition": {
    "allowed_operations": ["create_case", "read_case", "upload_census", ...],
    "read_only_operations": ["read_quote", "read_proposal"],
    "denied_operations": ["delete_case", "manage_users", "access_financials"]
  },
  "effective_date": "date",
  "termination_date": "date (nullable)",
  "scope_change_requested_date": "date (nullable)",
  "scope_change_requested_by": "email (nullable)",
  "scope_change_proposed_definition": "json (nullable)",
  "proposed_by_email": "email",
  "proposed_by_role": "enum (platform_admin, mga_admin, broker_admin)",
  "proposed_date": "date",
  "accepted_by_email": "email (nullable)",
  "accepted_date": "date (nullable)",
  "visibility_active": "boolean (true if ACTIVE and not post-termination)",
  "multi_affiliation_segment_tag": "string (nullable, used if multi-MGA setup)",
  "audit_correlation_id": "uuid",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Lifecycle State Machine

```
                 [PROPOSED]
                     ↓
         ↙─────────┴─────────↖
    [Broker/MGA    OR      [Platform
     Accept]              Override]
        ↓                    ↓
   [AWAITING_        [ACTIVE]
    ACCEPTANCE]         ↓
        ↓          ┌──────┴────────┐
    [ACTIVE]       ↓                ↓
        ↓     [Scope Change   [Suspend/
        ├─→   Requested]        Terminate]
        │        ↓              ↓
        │     [SCOPE_CHANGE]   [SUSPENDED]
        │        ↓              ↓ (Resume)
        └─────→[ACTIVE]     [ACTIVE]
                   ↓
              [TERMINATED]
                   ↓ (Terminal)
              [END]
```

### Lifecycle Events & Audit

| Event | From | To | Audit Fields | Actor Roles |
|-------|------|----|----|-------------|
| propose | — | PROPOSED | proposed_by, date, scope | platform_admin, mga_admin, broker_admin |
| accept | PROPOSED | ACTIVE | accepted_by, date | opposite side of proposer |
| override | PROPOSED | ACTIVE | platform_override_by, date, reason | platform_admin only |
| request_scope_change | ACTIVE | SCOPE_CHANGE_REQUESTED | requested_by, proposed_scope, date | platform_admin, relationship parties |
| accept_scope_change | SCOPE_CHANGE_REQUESTED | ACTIVE | approved_by, new_scope, date | opposite side or platform_admin |
| suspend | ACTIVE | SUSPENDED | suspended_by, reason, date | platform_admin |
| resume | SUSPENDED | ACTIVE | resumed_by, date | platform_admin |
| terminate | ACTIVE or SUSPENDED | TERMINATED | terminated_by, reason, date | platform_admin |

---

## Direct Broker Book vs MGA-Affiliated Book Separation

### Record Classification Model

#### Direct Broker Owned
```
{
  "id": "...",
  "broker_agency_id": "broker1",
  "distribution_channel": "direct_broker_owned",
  "master_general_agent_id": null,
  "relationship_id": null,
  "visibility": ["broker1", "platform"]
}
```
**MGA Access:** ❌ NO (never, regardless of relationships)

#### MGA-Affiliated
```
{
  "id": "...",
  "broker_agency_id": "broker1",
  "distribution_channel": "mga_affiliated",
  "master_general_agent_id": "mga1",
  "relationship_id": "rel_uuid",
  "visibility": ["broker1", "mga1", "platform"] (only if relationship ACTIVE)
}
```
**MGA Access:** ✅ YES (if relationship ACTIVE + operation in scope)

### Visibility Logic

**Broker User Query:**
```
SELECT * FROM records
WHERE broker_agency_id = user.broker_agency_id
  AND (
    distribution_channel = "direct_broker_owned"
    OR (distribution_channel = "mga_affiliated" AND master_general_agent_id IN (user.relationship_mga_ids))
  )
```

**MGA User Query:**
```
SELECT * FROM records
WHERE distribution_channel = "mga_affiliated"
  AND master_general_agent_id = user.master_general_agent_id
  AND relationship_id IN (user.active_relationship_ids)
  AND validateMGAScope(user, operation, scope_definition) = true
```

**Platform Admin Query:**
```
SELECT * FROM records
(no restrictions; full access)
```

---

## Entity and Field Usage Plan

### Entities Modified (No Schema Changes, Field Usage Only)

#### BenefitCase
- Add field: `relationship_id` (uuid, nullable) — if record created within MGA relationship context
- Add field: `distribution_channel` (enum: direct_broker_owned, mga_affiliated)
- Usage: Query filtering, scope isolation

#### CensusVersion
- Add field: `relationship_id` (nullable)
- Add field: `distribution_channel` (enum)
- Usage: Same as BenefitCase

#### QuoteScenario
- Add field: `relationship_id` (nullable)
- Add field: `distribution_channel` (enum)
- Usage: Same

#### Proposal
- Add field: `relationship_id` (nullable)
- Add field: `distribution_channel` (enum)
- Usage: Same

#### Document
- Add field: `relationship_id` (nullable)
- Add field: `distribution_channel` (enum)
- Usage: Same

#### ActivityLog
- Already supports case_id, entity_type
- Usage: Record relationship lifecycle events and MGA access logs

### No New Entities Created in Design Phase
(BrokerMGARelationship schema pre-exists from Gate 7A-0; operationalization in implementation)

---

## Scope Resolver Design

### Scope Resolver Function (Enhanced)

```javascript
/**
 * Resolve effective scope for user, including relationship context
 */
function resolveScope(user, context = {}) {
  const baseScope = {
    user_id: user.id,
    role: user.role,
    broker_agency_id: user.broker_agency_id || null,
    master_general_agent_id: user.master_general_agent_id || null,
  };

  // If user is broker user, fetch active relationships
  if (user.role === 'broker_admin' || user.role === 'broker_user') {
    const relationships = listBrokerRelationships(user.broker_agency_id).filter(
      r => r.relationship_status === 'ACTIVE' && r.visibility_active === true
    );
    baseScope.active_relationships = relationships.map(r => ({
      relationship_id: r.id,
      mga_id: r.master_general_agent_id,
      scope: r.operational_scope,
      scope_definition: r.scope_definition,
    }));
    baseScope.visibility_boundary = ['direct_broker_owned', 'mga_affiliated'];
  }

  // If user is MGA user, fetch active relationships from MGA side
  else if (user.role === 'mga_admin' || user.role === 'mga_user') {
    const relationships = listMGARelationships(user.master_general_agent_id).filter(
      r => r.relationship_status === 'ACTIVE' && r.visibility_active === true
    );
    baseScope.active_relationships = relationships.map(r => ({
      relationship_id: r.id,
      broker_id: r.broker_agency_id,
      scope: r.operational_scope,
      scope_definition: r.scope_definition,
    }));
    baseScope.visibility_boundary = ['mga_affiliated']; // Only MGA-affiliated records
  }

  // If platform admin, no restrictions
  else if (user.role === 'platform_admin') {
    baseScope.visibility_boundary = ['direct_broker_owned', 'mga_affiliated'];
    baseScope.effective_access_level = 'unrestricted';
  }

  return baseScope;
}
```

### Scope Resolver Query Integration

```javascript
/**
 * Apply scope resolver to query filter
 */
function applyScopeFilter(query, scope, record_type) {
  if (scope.role === 'platform_admin') {
    return query; // No additional filter
  }

  if (scope.role.includes('broker')) {
    // Broker sees own records (all channels) + affiliated records via MGA relationships
    return query.where(
      q => q.where('broker_agency_id', '=', scope.broker_agency_id)
        .and(
          q2 => q2.where('distribution_channel', '=', 'direct_broker_owned')
            .or('relationship_id', 'IN', scope.active_relationships.map(r => r.relationship_id))
        )
    );
  }

  if (scope.role.includes('mga')) {
    // MGA sees only MGA-affiliated records linked to active relationships
    return query
      .where('distribution_channel', '=', 'mga_affiliated')
      .where('master_general_agent_id', '=', scope.master_general_agent_id)
      .where('relationship_id', 'IN', scope.active_relationships.map(r => r.relationship_id));
  }

  throw new Error('Unknown role for scope filter');
}
```

---

## Permission Resolver Design

### Permission Resolver Function (Enhanced)

```javascript
/**
 * Validate permission with relationship scope context
 */
function resolvePermission(user, action, scope, context = {}) {
  // Platform admin always allowed
  if (user.role === 'platform_admin') {
    return { allowed: true };
  }

  // Check base role permission
  const basePermission = roleActionPermissions[user.role]?.[action];
  if (!basePermission) {
    return { allowed: false, reason: 'ROLE_LACKS_ACTION' };
  }

  // If action is relationship-scoped, validate scope boundary
  if (context.relationship_id && !context.is_direct_book) {
    const relationship = getRelationship(context.relationship_id);
    if (!relationship || relationship.relationship_status !== 'ACTIVE' || !relationship.visibility_active) {
      return { allowed: false, reason: 'RELATIONSHIP_INACTIVE' };
    }

    // Check if action is in allowed_operations
    const allowedOps = relationship.scope_definition.allowed_operations || [];
    const deniedOps = relationship.scope_definition.denied_operations || [];
    
    if (deniedOps.includes(action)) {
      return { allowed: false, reason: 'SCOPE_BOUNDARY_VIOLATION', required_scope: 'higher', current_scope: relationship.operational_scope };
    }

    if (!allowedOps.includes(action) && !allowedOps.includes('*')) {
      return { allowed: false, reason: 'SCOPE_BOUNDARY_VIOLATION', required_scope: 'higher', current_scope: relationship.operational_scope };
    }

    // Check if action is read-only for this user's role
    const readOnlyOps = relationship.scope_definition.read_only_operations || [];
    if (readOnlyOps.includes(action) && !action.startsWith('read_')) {
      return { allowed: false, reason: 'READ_ONLY_SCOPE' };
    }
  }

  return { allowed: true };
}
```

### Permission Matrix

| Role | create_case | read_case | update_case | delete_case | upload_census | manage_users |
|------|---|---|---|---|---|---|
| broker_admin | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ |
| broker_user | ✓* | ✓ | ✓* | ✗ | ✓* | ✗ |
| mga_admin | ✗ | ✓ (aff) | ✗ | ✗ | ✗ | ✗ |
| mga_user | ✗ | ✓ (aff) | ✗ | ✗ | ✗ | ✗ |
| platform_admin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

*MGA-affiliated only if relationship scope permits

---

## Backend Service / Contract Design

### BrokerMGARelationshipContract

```javascript
class BrokerMGARelationshipContract {
  // Propose relationship
  proposeBrokerMGARelationship(broker_agency_id, master_general_agent_id, proposed_scope, proposed_by_email, proposed_by_role)
    → { relationship_id, status: PROPOSED, ... }

  // Accept relationship (opposite side)
  acceptBrokerMGARelationship(relationship_id, accepted_by_email)
    → { relationship_id, status: ACTIVE, ... }

  // Request scope change
  requestScopeChange(relationship_id, new_scope_definition, requested_by_email)
    → { relationship_id, status: SCOPE_CHANGE_REQUESTED, ... }

  // Accept scope change
  acceptScopeChange(relationship_id, approved_by_email)
    → { relationship_id, status: ACTIVE, scope_definition: new_scope, ... }

  // Suspend relationship
  suspendBrokerMGARelationship(relationship_id, suspended_by_email, reason)
    → { relationship_id, status: SUSPENDED, ... }

  // Resume relationship
  resumeBrokerMGARelationship(relationship_id, resumed_by_email)
    → { relationship_id, status: ACTIVE, ... }

  // Terminate relationship
  terminateBrokerMGARelationship(relationship_id, terminated_by_email, reason)
    → { relationship_id, status: TERMINATED, visibility_active: false, ... }

  // List broker relationships
  listBrokerRelationships(broker_agency_id, filters = {})
    → [{ relationship_id, mga_id, status, scope, effective_date, ... }]

  // List MGA relationships
  listMGARelationships(master_general_agent_id, filters = {})
    → [{ relationship_id, broker_id, status, scope, effective_date, ... }]

  // Get relationship details
  getRelationship(relationship_id)
    → { relationship_id, broker_id, mga_id, status, scope_definition, ... }

  // Get relationship scope
  getRelationshipScope(relationship_id)
    → { operational_scope, scope_definition, ... }
}
```

### MGAVisibilityContract

```javascript
class MGAVisibilityContract {
  // Get MGA-affiliated records (scoped to relationship)
  getMGAAffiliatedRecords(mga_id, record_type, relationship_id, filters = {})
    → [records] (filtered by relationship scope)

  // Get MGA access log for specific record
  getMGAAccessLog(mga_id, record_id, relationship_id)
    → [{ user_email, action, timestamp, scope_used, ... }]

  // Validate MGA access to record
  validateMGAAccess(mga_id, operation, record_id, relationship_id)
    → { allowed: boolean, reason?: string }

  // Get MGA book of business (summary)
  getMGAAffiliatedBookSummary(mga_id)
    → { total_brokers, active_relationships, total_cases, total_quotes, ... }
}
```

### BrokerBookSeparationContract

```javascript
class BrokerBookSeparationContract {
  // Classify record (returns distribution_channel)
  classifyRecord(broker_id, record_type, record_data, relationship_id = null)
    → { distribution_channel: 'direct_broker_owned' | 'mga_affiliated', relationship_id }

  // List broker direct book records
  listBrokerDirectBook(broker_id, record_type, filters = {})
    → [records where distribution_channel = 'direct_broker_owned']

  // List broker MGA-affiliated records (all relationships)
  listBrokerMGAAffiliatedRecords(broker_id, mga_id = null, filters = {})
    → [records where distribution_channel = 'mga_affiliated']

  // Get direct book summary
  getDirectBookSummary(broker_id)
    → { total_cases, total_quotes, total_census, ... }

  // Get affiliated book summary (by MGA)
  getAffiliatedBookSummary(broker_id, mga_id = null)
    → { total_mgAs, total_cases, total_quotes, by_mga: {...} }
}
```

---

## Frontend UI / UX Design

### Broker Agency Workspace — MGA Relationships Surface

#### MGA Relationships Dashboard Card
- **Location:** Broker workspace main dashboard
- **Visibility:** If BROKER_MGA_RELATIONSHIP_UI_ENABLED = true
- **Elements:**
  - "Active Relationships" count badge
  - "Pending Proposals" count badge
  - "Suspended" count badge
  - Action: "View All" → Relationship list
  - Quick action: "Propose New Relationship" → Modal

#### MGA Relationships List View
- **Table Columns:**
  - MGA Name
  - Relationship Status (PROPOSED, ACTIVE, SUSPENDED, TERMINATED)
  - Operational Scope (Limited, Full, Custom)
  - Effective Date
  - Last Updated
  - Actions: View Details, Edit Scope, Suspend, Terminate

#### Relationship Detail Modal
- **For ACTIVE Relationships:**
  - Display: MGA name, scope, effective date, termination date (if set)
  - Audit trail: List of state changes
  - Actions: Request Scope Change, Suspend, Terminate
  - MGA Activity Log: Recent access events

- **For PROPOSED Relationships:**
  - Display: Proposer, proposed date, proposed scope
  - Actions: Accept, Reject, View Audit Trail

- **For SCOPE_CHANGE_REQUESTED:**
  - Display: Current scope, requested scope, requester, date
  - Actions: Accept, Reject

#### Scope Definition Editor (Custom Scope)
- **UI Pattern:** Permission matrix (operations × allowed/read-only/denied)
- **Operations Listed:**
  - create_case, read_case, update_case
  - upload_census, read_census
  - create_quote, read_quote, submit_quote
  - create_proposal, read_proposal
  - (etc., all operations)
- **Actions:** Submit scope change request → Awaits platform or MGA approval

#### Record Visibility Indicator
- **When creating/editing case/census/quote/proposal:**
  - Checkbox: "Include in MGA-affiliated book?"
  - If checked: Select MGA relationship (dropdown of ACTIVE relationships)
  - Display: "This record will be visible to [MGA Name]"
  - If unchecked: "This record will be in your direct book (MGA not visible)"

### MGA Command Center — Affiliated Book Dashboard

#### Affiliated Brokers List
- **Elements:**
  - List of brokers with ACTIVE relationships to this MGA
  - Columns: Broker Name, Status, Scope, Effective Date, Book Size (case count)
  - Actions: View Affiliate Book, View Scope, Audit Trail

#### Affiliated Book (per Broker)
- **Scoped Records:**
  - Cases (read-only if limited scope)
  - Census (read-only)
  - Quotes (read-only if limited scope)
  - Proposals (read-only if limited scope)
- **Filtering:** By relationship, record type, date range
- **Actions:** View record details (read-only per scope)

#### Relationship Activity Log
- **For Each Broker Relationship:**
  - User access events (who, when, what action, scope used)
  - Scope violation attempts (who, when, denied action, reason)
  - Relationship state changes (proposed, activated, suspended, terminated)

### Direct Book Indicator (All Record Types)
- **Visual:**
  - Badge: "Direct Book" (if distribution_channel = direct_broker_owned)
  - Badge: "MGA-Affiliated: [MGA Name]" (if mga_affiliated)
- **Purpose:** Broker and platform admins see immediately; MGA cannot see direct book records

---

## MGA Dashboard Visibility Rules

### MGA User Can See

✅ Own MGA relationships (status, scope, brokers, activity)  
✅ Affiliated broker cases (filtered by relationship scope)  
✅ Affiliated broker census (read-only)  
✅ Affiliated broker quotes (read-only if limited scope)  
✅ Affiliated broker proposals (read-only if limited scope)  
✅ Affiliate activity log (who, what, when, scope used)  
✅ Own user activity and audit trail  

### MGA User CANNOT See

❌ Broker direct book records  
❌ Broker internal users/roles  
❌ Broker financials, commissions, pricing  
❌ Other MGAs' relationships or books  
❌ Unaffiliated broker records  
❌ Records outside relationship scope  

---

## Broker Agency Workspace Visibility Rules

### Broker User Can See

✅ Own direct book (all channels)  
✅ Own MGA relationships (status, scope)  
✅ Own MGA-affiliated records (linked to active relationships)  
✅ Own direct book audit trail  
✅ Own relationship state change history  

### Broker User CANNOT See

❌ Other brokers' records  
❌ MGA internal users/activity (only own relationship activity)  
❌ Other MGAs' information  

### Workspace Workspace Behavior (Unchanged)

- Workspace remains fail-closed (BROKER_WORKSPACE_ENABLED = false until separately enabled)
- Workspace access control unchanged by relationships
- Relationships are organizational metadata, not workspace-blocking

---

## Analytics / Reporting Scoping Rules

### Analytics Queries (Design Only)

#### Direct Book Analytics (Broker Only)
- Query: Cases, quotes, proposals (distribution_channel = direct_broker_owned)
- MGA: Cannot see
- Broker: Full access to own direct book analytics

#### Affiliated Book Analytics (Broker + MGA, Scoped)
- Query: Cases, quotes (distribution_channel = mga_affiliated AND relationship.visibility_active = true)
- MGA: Can see only for active relationships
- Broker: Can see own affiliated books across all relationships
- Scoping: MGA cannot see beyond relationship scope

#### MGA Book Summary (MGA Reporting)
- Total affiliated brokers
- Total cases / quotes / proposals (by broker)
- Activity frequency (access rate, actions per period)
- Scope violation attempts (security metric)
- Relationship state changes (lifecycle metric)

### Feature Flags for Analytics
- `MGA_AFFILIATED_BOOK_ANALYTICS_ENABLED` (requires `MGA_AFFILIATED_RECORD_VISIBILITY_ENABLED`)
- Default: false

---

## Safe Payload Rules

### API Response Payloads

#### Record Returned to MGA User
```json
{
  "id": "...",
  "type": "case",
  "broker_agency_id": "broker1",
  "distribution_channel": "mga_affiliated",
  "relationship_id": "rel_uuid",
  "case_type": "new_business",
  "effective_date": "2026-06-01"
  // ❌ EXCLUDED: employer_ein, broker_contacts, broker_user_list, pricing, commissions
}
```

#### Direct Book Record Returned to Broker
```json
{
  "id": "...",
  "type": "case",
  "broker_agency_id": "broker1",
  "distribution_channel": "direct_broker_owned",
  "case_type": "new_business",
  "effective_date": "2026-06-01"
}
```

#### MGA User Attempts to Query Direct Book
```json
{
  "error": "SCOPE_BOUNDARY_VIOLATION",
  "status": 403,
  "message": "MGA cannot access direct broker book records",
  "required_access": "direct_book",
  "current_relationship": "mga_affiliated (limited_scope)",
  "correlation_id": "..."
}
```

### Prohibited Exposures (Enforced)

| Field | MGA Can See | Broker Can See | Platform Can See |
|-------|---|---|---|
| broker_internal_users | ❌ | ✓ | ✓ |
| broker_financials | ❌ | ✓ | ✓ |
| broker_commissions | ❌ | ✓ | ✓ |
| broker_ein_tax_id | ❌ | ✓ | ✓ |
| direct_book_records | ❌ | ✓ | ✓ |
| other_mga_relationships | ❌ | ❌ | ✓ |
| scope_violation_attempts | ❌ (own only) | ❌ | ✓ |

---

## Audit Event Model

### Relationship Lifecycle Audit Events

```javascript
{
  "event_type": "relationship_proposed",
  "entity_id": "rel_uuid",
  "entity_type": "BrokerMGARelationship",
  "actor_email": "broker_admin@broker1.com",
  "actor_role": "broker_admin",
  "action": "propose",
  "detail": "Broker proposed MGA relationship with scope=limited",
  "old_value": null,
  "new_value": { "status": "PROPOSED", "scope": "limited" },
  "outcome": "success",
  "correlation_id": "corr_uuid",
  "timestamp": "2026-05-13T10:00:00Z"
}
```

### MGA Access Audit Events

```javascript
{
  "event_type": "mga_record_accessed",
  "entity_id": "case_uuid",
  "entity_type": "BenefitCase",
  "actor_email": "mga_user@mga1.com",
  "actor_role": "mga_user",
  "action": "read",
  "detail": "MGA user accessed affiliated case",
  "relationship_id": "rel_uuid",
  "master_general_agent_id": "mga1",
  "broker_agency_id": "broker1",
  "scope_used": "limited",
  "outcome": "success",
  "correlation_id": "corr_uuid",
  "timestamp": "2026-05-13T10:05:00Z"
}
```

### Scope Violation Audit Events

```javascript
{
  "event_type": "scope_boundary_violation",
  "entity_id": "case_uuid",
  "entity_type": "BenefitCase",
  "actor_email": "mga_user@mga1.com",
  "actor_role": "mga_user",
  "action": "update",
  "detail": "MGA user attempted to update case (not allowed in limited scope)",
  "required_scope": "full",
  "current_scope": "limited",
  "relationship_id": "rel_uuid",
  "outcome": "blocked",
  "correlation_id": "corr_uuid",
  "timestamp": "2026-05-13T10:10:00Z"
}
```

### Audit Retention
- **Policy:** Permanent (platform standard)
- **Immutability:** Never deleted or modified
- **Compliance:** Available for regulatory audit

---

## Feature Flag Matrix (All Default False)

```javascript
const gate7a3FeatureFlags = {
  // Parent flag
  MGA_RELATIONSHIP_WORKFLOWS_ENABLED: {
    default: false,
    description: "Enable MGA/broker relationship lifecycle workflows",
    dependency: null,
    activation_order: 1
  },

  // Child: Proposal/Acceptance
  MGA_RELATIONSHIP_PROPOSAL_ENABLED: {
    default: false,
    description: "Allow proposal of MGA relationships",
    dependency: "MGA_RELATIONSHIP_WORKFLOWS_ENABLED",
    activation_order: 2
  },

  MGA_RELATIONSHIP_ACCEPTANCE_ENABLED: {
    default: false,
    description: "Allow acceptance of MGA relationship proposals",
    dependency: "MGA_RELATIONSHIP_WORKFLOWS_ENABLED",
    activation_order: 3
  },

  // Child: Scope Management
  MGA_RELATIONSHIP_SCOPE_MANAGEMENT_ENABLED: {
    default: false,
    description: "Allow scope modification of relationships",
    dependency: "MGA_RELATIONSHIP_WORKFLOWS_ENABLED",
    activation_order: 4
  },

  // Parent flag: Visibility
  MGA_AFFILIATED_RECORD_VISIBILITY_ENABLED: {
    default: false,
    description: "Enable MGA to see affiliated records",
    dependency: null,
    activation_order: 5
  },

  // Child: Enforcement
  SCOPE_BOUNDARY_ENFORCEMENT_ENABLED: {
    default: false,
    description: "Enforce relationship scope in queries/operations",
    dependency: "MGA_AFFILIATED_RECORD_VISIBILITY_ENABLED",
    activation_order: 6
  },

  // Child: Dashboard
  MGA_AFFILIATED_BOOK_DASHBOARD_ENABLED: {
    default: false,
    description: "Show MGA affiliated broker book dashboard",
    dependency: "MGA_AFFILIATED_RECORD_VISIBILITY_ENABLED",
    activation_order: 7
  },

  // Parent flag: UI
  BROKER_MGA_RELATIONSHIP_UI_ENABLED: {
    default: false,
    description: "Show relationship management UI in broker workspace",
    dependency: null,
    activation_order: 8
  },

  // Parent flag: Audit
  MGA_ACTIVITY_AUDIT_ENABLED: {
    default: false,
    description: "Log MGA access to affiliated records",
    dependency: "MGA_AFFILIATED_RECORD_VISIBILITY_ENABLED",
    activation_order: 9
  }
};
```

**Activation Constraints:**
- All flags default to false
- Cannot activate child without parent
- Activate one surface at a time
- Validate passing after each activation
- No simultaneous multi-flag activation

---

## Migration / Backfill Design (Deferred)

### Migration Scope
- **Current Phase:** Design only; no execution
- **Trigger:** Separate operator approval required
- **Execution:** Future phase (7A-3.X) or separate initiative

### Backfill Strategy (If Needed)

#### Scenario: Historical MGA Affiliations Discovered

**Dry-Run Phase:**
1. Query legacy system for historical broker ↔ MGA mappings
2. Classify mappings as:
   - Valid affiliation → Create BrokerMGARelationship record (status = ACTIVE)
   - Terminated affiliation → Create BrokerMGARelationship record (status = TERMINATED, visibility_active = false)
   - Ambiguous → Quarantine; requires manual review

3. Classify existing records:
   - If created while legacy affiliation active → distribution_channel = mga_affiliated, relationship_id = mapped_relationship
   - Otherwise → distribution_channel = direct_broker_owned

4. Generate reconciliation report
   - Record count before/after
   - Quarantine count and details
   - Audit events to be created

**Production Backfill Phase (Separate Approval):**
1. Validate dry-run results
2. Create BrokerMGARelationship records
3. Stamp records with relationship_id and distribution_channel
4. Create immutable audit events
5. Validation queries to verify completeness

**Risk Mitigation:**
- Non-destructive (no record deletions, only metadata stamps)
- Rollback plan: Reverse stamps, audit trail preserved
- Platform admin verification at each step

### Migration Not Authorized (This Phase)
- No backfill execution
- No legacy record classification
- No relationship record creation from historical data
- Design only; separate operator approval required for execution

---

## Security and Abuse-Case Controls

### Abuse Case 1: MGA Probing for Broker Direct Book
**Attack:** MGA user tries queries to enumerate direct book records.

**Control:**
- Query filter enforces `distribution_channel = mga_affiliated`
- Direct book records (`distribution_channel = direct_broker_owned`) always filtered out
- Scope violation attempts logged with full context
- Platform alerts on repeated violations (configurable)

### Abuse Case 2: MGA Scope Escalation
**Attack:** MGA user attempts operations beyond their relationship scope (e.g., delete when limited scope).

**Control:**
- Permission resolver checks scope_definition.denied_operations
- Operation denied → 403 SCOPE_BOUNDARY_VIOLATION
- Event logged with actor, action, scope context
- Scope changes require platform/broker approval

### Abuse Case 3: Relationship Manipulation
**Attack:** Broker user tries to unilaterally modify/terminate relationship to hide records.

**Control:**
- Relationship state transitions require both parties or platform override
- Termination sets visibility_active = false but does not delete records
- Immutable audit trail preserves historical relationship context
- Platform admin review available for disputes

### Abuse Case 4: Multi-MGA Visibility Collusion
**Attack:** Multiple MGAs attempt to coordinate visibility via single relationship.

**Control:**
- Each relationship isolates to specific relationship_id
- Record visibility requires both MGA_id match AND relationship_id match
- No global broker-wide visibility via single relationship
- Multi-MGA approval requires explicit per-relationship governance

### Abuse Case 5: Audit Trail Tampering
**Attack:** Admin tries to modify/delete audit events.

**Control:**
- Audit events immutable (permanent retention)
- No deletion or modification allowed
- Audit table separate from operational tables
- Platform infrastructure controls access

---

## Regression Guardrails

### Gate 7A-0 (Core Model) — Guardrails
- ✓ Scope resolver enhancements backward-compatible (standalone broker scope unchanged)
- ✓ Permission resolver enhancements backward-compatible (existing roles/actions preserved)
- ✓ Audit writer unchanged (new event types added, existing events preserved)
- ✓ Test coverage: Scope/permission resolution with and without relationships

### Gate 7A-1 (Broker Signup) — Guardrails
- ✓ Broker signup/compliance flow unchanged
- ✓ MGA relationships are post-signup (not signup-blocking)
- ✓ Test coverage: Broker signup flow unaffected by relationships

### Gate 7A-2 (Broker Workspace) — Guardrails
- ✓ Workspace access control unchanged by relationships
- ✓ Workspace remains fail-closed (feature flag controlled)
- ✓ Book of business data filtering with relationship scope
- ✓ Test coverage: Workspace data filtering with relationships (comprehensive)

### Gate 6K (MGA Analytics) — Guardrails
- ✓ MGA analytics scoped to affiliated relationships only
- ✓ Analytics queries filter by active relationships and scope
- ✓ No aggregate data leakage across unrelated brokers
- ✓ Test coverage: Analytics filtering by relationship scope

### Gate 6L-A (Broker Contacts) — Guardrails
- ✓ Broker internal users never visible to MGA
- ✓ Broker contacts remain broker-private
- ✓ MGA cannot access broker user management
- ✓ Test coverage: Broker contact visibility isolation

---

## Acceptance Test Matrix & Estimated Test Count

### Unit Tests (50-60 tests)
- BrokerMGARelationshipContract: propose, accept, modify, suspend, terminate, list (35 tests)
- MGAVisibilityContract: scoped queries, access validation (15 tests)
- BrokerBookSeparationContract: classification, filtering (10 tests)

### Integration Tests (70-80 tests)
- Relationship lifecycle: propose → active → suspend → terminate (20 tests)
- Scope modification workflow (10 tests)
- MGA visibility after activation (15 tests)
- Record classification and filtering (15 tests)
- Workspace data filtering with relationships (10 tests)
- MGA analytics scoped filtering (10 tests)

### Regression Tests (50-60 tests)
- Gate 7A-0: Scope/permission resolution unchanged (15 tests)
- Gate 7A-1: Broker signup unaffected (5 tests)
- Gate 7A-2: Workspace access control (15 tests)
- Gate 6K: MGA analytics scoped (10 tests)
- Gate 6L-A: Broker contacts isolated (10 tests)

### Safe Payload Tests (25-30 tests)
- MGA cannot see direct book (5 tests)
- MGA cannot see broker financials (5 tests)
- Scope violation responses (403, not 401) (5 tests)
- Audit trail does not leak data (5 tests)
- API response field filtering (5 tests)

### UI/E2E Tests (40-50 tests)
- Relationship proposal workflow (10 tests)
- Relationship acceptance workflow (10 tests)
- Scope modification workflow (8 tests)
- MGA affiliated book dashboard (8 tests)
- Broker workspace relationship management (8 tests)

### Feature Flag Tests (20-25 tests)
- Flag dependency enforcement (5 tests)
- Sequential activation validation (5 tests)
- Feature gates correctly block/allow operations (10 tests)

### Security & Abuse-Case Tests (20-25 tests)
- MGA direct book probing attempts (5 tests)
- Scope escalation attempts (5 tests)
- Relationship manipulation attempts (5 tests)
- Audit trail immutability (5 tests)
- Multi-MGA collusion scenarios (5 tests)

**Total Estimated Test Count: 275-330 tests**

---

## Rollback Strategy

### Rollback Phases (If Gate 7A-3 Implementation Fails)

**Phase 1: Feature Flag Deactivation (Fastest)**
- Set all MGA_* flags to false
- Reverts all relationship-scoped behavior
- Users regain normal access
- Time: <5 minutes
- Data: No changes, rollback instant

**Phase 2: Code Rollback (If Needed)**
- Revert contract implementations
- Revert scope/permission resolver enhancements
- Revert service layer changes
- Time: 15-30 minutes
- Data: No changes, queries adjust

**Phase 3: Data Cleanup (If Needed)**
- Remove relationship_id and distribution_channel stamps from operational records
- Preserve immutable audit trail (no deletion)
- Restore visibility to pre-relationship state
- Time: 1-4 hours depending on data volume

**Rollback Conditions (Any One Triggers):**
- Critical scope violation not caught
- Regression in Gate 7A-0, 7A-1, 7A-2, 6K, 6L-A
- Data corruption or unauthorized access
- Audit trail integrity failure
- >5% test failure rate

**Rollback Testing:**
- Unit test: Confirm flags toggle behavior
- Integration test: Confirm visibility reverts
- Regression test: Confirm pre-relationship behavior restored

---

## Implementation Recommendation

### Status: DESIGN COMPLETE, READY FOR IMPLEMENTATION PHASE

**Recommendation:** Proceed to Gate 7A-3 Implementation Work Order.

**Rationale:**
1. ✅ All 10 operator decisions locked and documented
2. ✅ Relationship model finalized with clear lifecycle
3. ✅ Scope resolver and permission resolver designs specified
4. ✅ Backend contracts fully defined
5. ✅ Frontend UI/UX surfaces identified
6. ✅ Safe payload requirements documented
7. ✅ Audit event model complete
8. ✅ Feature flags designed (all default false)
9. ✅ Regression guardrails specified
10. ✅ Test strategy clear (275-330 tests estimated)
11. ✅ Rollback strategy defined
12. ✅ No open design issues blocking implementation
13. ✅ Security abuse cases identified and mitigated

**Risk Level:** MEDIUM (scoped to MGA visibility; core broker model unchanged)

**Estimated Implementation Effort:** 6-8 weeks (5 sequential phases)

**Next Steps:** Submit to operator for implementation work order approval.

---

## Open Design Issues

### None

All design decisions locked. No blocking open issues discovered.

---

**Design Specification Complete — Ready for Operator Review and Implementation Work Order Approval.**