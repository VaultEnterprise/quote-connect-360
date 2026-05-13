# Gate 7A-0: First-Class Broker Core Model Implementation Work Order

**Date:** 2026-05-13  
**Status:** WORK_ORDER_READY (Awaiting Operator Approval)  
**Authorization:** APPROVED (Design Freeze Gate 7A-P approved 2026-05-13)  
**Scope:** Entity schemas, service contracts, scope/permission resolvers, audit logging, feature flags, migration planning  
**Implementation Authority:** BLOCKED until operator approves this work order  

---

## 1. Executive Summary

Gate 7A-0 implements the first-class broker agency core model:

- Create `BrokerAgencyProfile` (already exists from Phase 1; no changes needed)
- Create `BrokerPlatformRelationship` (new entity)
- Create `BrokerMGARelationship` (new entity, optional)
- Create `BrokerScopeAccessGrant` (new entity, optional)
- Update `BenefitCase`, `CensusVersion`, `QuoteScenario`, `Proposal`, `EmployeeEnrollment`, `Task` to include optional `broker_agency_id` and `distribution_channel_context_id` fields
- Create service contracts for scope resolution, permission checking, audit logging
- Update scope resolver to enforce broker/MGA/channel-based access
- Update permission resolver to enforce broker role permissions
- Create feature flags (default false) to gate new behavior
- Plan dry-run migration and backfill
- Create comprehensive test plan
- Create rollback plan

**No runtime code is implemented in this work order. Only planning and task definition.**

---

## 2. Entity Schema Changes (Proposed, Not Applied)

### 2.1 New Entity: BrokerPlatformRelationship

**File to create:** `src/entities/BrokerPlatformRelationship.json`

```json
{
  "name": "BrokerPlatformRelationship",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "UUID primary key"
    },
    "tenant_id": {
      "type": "string",
      "description": "Tenant scope"
    },
    "broker_agency_id": {
      "type": "string",
      "description": "FK to BrokerAgencyProfile (unique per broker)"
    },
    "status": {
      "type": "string",
      "enum": ["pending_approval", "approved", "suspended", "inactive"],
      "default": "pending_approval"
    },
    "approval_status": {
      "type": "string",
      "enum": ["none", "pending", "approved", "rejected"],
      "default": "none"
    },
    "approval_requested_by_user_email": {
      "type": "string"
    },
    "approval_requested_at": {
      "type": "string",
      "format": "date-time"
    },
    "approved_by_user_email": {
      "type": "string"
    },
    "approved_at": {
      "type": "string",
      "format": "date-time"
    },
    "compliance_status": {
      "type": "string",
      "enum": ["pending_review", "compliant", "issues_found", "suspended"],
      "default": "pending_review"
    },
    "created_at": {
      "type": "string",
      "format": "date-time"
    },
    "updated_at": {
      "type": "string",
      "format": "date-time"
    }
  },
  "required": ["tenant_id", "broker_agency_id"]
}
```

---

### 2.2 New Entity: BrokerMGARelationship

**File to create:** `src/entities/BrokerMGARelationship.json`

```json
{
  "name": "BrokerMGARelationship",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "UUID primary key"
    },
    "tenant_id": {
      "type": "string"
    },
    "broker_agency_id": {
      "type": "string",
      "description": "FK to BrokerAgencyProfile"
    },
    "master_general_agent_id": {
      "type": "string",
      "description": "FK to MasterGeneralAgent"
    },
    "relationship_type": {
      "type": "string",
      "enum": ["affiliated", "delegated", "hybrid"],
      "default": "affiliated"
    },
    "status": {
      "type": "string",
      "enum": ["draft", "active", "suspended", "terminated"],
      "default": "draft"
    },
    "established_at": {
      "type": "string",
      "format": "date-time"
    },
    "established_by_user_email": {
      "type": "string"
    },
    "created_at": {
      "type": "string",
      "format": "date-time"
    },
    "updated_at": {
      "type": "string",
      "format": "date-time"
    }
  },
  "required": ["tenant_id", "broker_agency_id", "master_general_agent_id"]
}
```

---

### 2.3 New Entity: BrokerScopeAccessGrant

**File to create:** `src/entities/BrokerScopeAccessGrant.json`

```json
{
  "name": "BrokerScopeAccessGrant",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "UUID primary key"
    },
    "tenant_id": {
      "type": "string"
    },
    "broker_agency_id": {
      "type": "string",
      "description": "FK to BrokerAgencyProfile (grantee)"
    },
    "target_entity_type": {
      "type": "string",
      "enum": ["MGA", "Employer", "Case", "Document"],
      "description": "Type of resource being granted"
    },
    "target_entity_id": {
      "type": "string",
      "description": "FK to target entity"
    },
    "granted_by_user_id": {
      "type": "string"
    },
    "granted_at": {
      "type": "string",
      "format": "date-time"
    },
    "expires_at": {
      "type": "string",
      "format": "date-time",
      "nullable": true,
      "description": "Optional expiration; null = permanent"
    },
    "created_at": {
      "type": "string",
      "format": "date-time"
    },
    "updated_at": {
      "type": "string",
      "format": "date-time"
    }
  },
  "required": ["tenant_id", "broker_agency_id", "target_entity_type", "target_entity_id"]
}
```

---

### 2.4 Modified Entities (Shadow Stamp Fields Added)

**Files to modify:**
- `src/entities/BenefitCase.json`
- `src/entities/CensusVersion.json`
- `src/entities/QuoteScenario.json`
- `src/entities/Proposal.json`
- `src/entities/EmployeeEnrollment.json`
- `src/entities/Task.json`

**Changes (for each entity):** Add two nullable fields:

```json
{
  "broker_agency_id": {
    "type": "string",
    "nullable": true,
    "description": "Broker agency scope (nullable during backfill)"
  },
  "distribution_channel_context_id": {
    "type": "string",
    "nullable": true,
    "description": "Channel context (future; nullable, shadow-stamped during backfill)"
  }
}
```

**No other changes to existing fields. Schema expansion only (additive).**

---

## 3. Exact Files to Create (New)

| File | Type | Purpose |
|------|------|---------|
| `src/entities/BrokerPlatformRelationship.json` | Entity Schema | Broker ↔ Platform contract |
| `src/entities/BrokerMGARelationship.json` | Entity Schema | Broker ↔ MGA optional affiliation |
| `src/entities/BrokerScopeAccessGrant.json` | Entity Schema | Explicit scope grants |
| `lib/broker/brokerScopeResolver.ts` | Backend Contract | Scope checking (broker/MGA/channel) |
| `lib/broker/brokerPermissionResolver.ts` | Backend Contract | Permission checking (broker roles) |
| `lib/broker/brokerAuditWriter.ts` | Backend Contract | Centralized audit logging |
| `lib/featureFlags.ts` | Feature Flag Registry | Centralized feature flags |
| `lib/migrationBackfill.ts` | Migration Utilities | Dry-run, backfill, validation |
| `tests/gate-7a-0/scopeResolver.test.ts` | Test Suite | Scope resolver matrix tests |
| `tests/gate-7a-0/permissions.test.ts` | Test Suite | Permission resolver tests |
| `tests/gate-7a-0/audit.test.ts` | Test Suite | Audit immutability tests |
| `tests/gate-7a-0/migration.test.ts` | Test Suite | Migration/backfill tests |
| `tests/gate-7a-0/regression.test.ts` | Test Suite | Gate 6K/6L-A regression tests |

---

## 4. Exact Files to Modify (Schema Expansion)

| File | Changes |
|------|---------|
| `src/entities/BenefitCase.json` | Add `broker_agency_id` (nullable), `distribution_channel_context_id` (nullable) |
| `src/entities/CensusVersion.json` | Add `broker_agency_id` (nullable), `distribution_channel_context_id` (nullable) |
| `src/entities/QuoteScenario.json` | Add `broker_agency_id` (nullable), `distribution_channel_context_id` (nullable) |
| `src/entities/Proposal.json` | Add `broker_agency_id` (nullable), `distribution_channel_context_id` (nullable) |
| `src/entities/EmployeeEnrollment.json` | Add `broker_agency_id` (nullable), `distribution_channel_context_id` (nullable) |
| `src/entities/Task.json` | Add `broker_agency_id` (nullable), `distribution_channel_context_id` (nullable) |
| `lib/scopeGate.ts` | Add broker scope validation (no breaking changes; additive only) |
| `lib/permissionResolver.ts` | Add broker_agency.* and broker_direct.* namespaces (no breaking changes) |

---

## 5. Service Contracts to Implement

### 5.1 brokerScopeResolver Contract

**File:** `lib/broker/brokerScopeResolver.ts`

**Methods:**
- `resolveScope(userId, entityType, entityId, action)` → `{allowed: boolean, reason?: string}`
- `canUserAccessBroker(userId, brokerId)` → `boolean`
- `canUserAccessMga(userId, mgaId)` → `boolean`
- `enforceScope(userId, brokerId)` → throws if denied (404 masked)

**Rules enforced:**
- Tenant scoping (403 if different tenant)
- Broker agency scoping (404 masked if cross-broker)
- MGA scoping (404 masked if cross-MGA)
- Channel context checks (if enabled)
- BrokerScopeAccessGrant checks (if grant required)

---

### 5.2 brokerPermissionResolver Contract

**File:** `lib/broker/brokerPermissionResolver.ts`

**Methods:**
- `hasPermission(userId, permission, context?)` → `boolean`
- `requirePermission(userId, permission, context?)` → throws 403 if denied

**Permissions enforced:**
- `broker_agency.view` (all roles)
- `broker_agency.manage_users` (owner only)
- `broker_direct.case.create` (owner, producer, benefits_admin)
- `broker_direct.case.update` (owner, producer)
- `broker_direct.census.upload` (owner, producer, benefits_admin)
- `broker_direct.quote.create` (owner, producer)
- `broker_direct.proposal.send` (owner, producer)
- `broker_direct.enrollment.manage` (owner, producer, benefits_admin)
- (All broker_mga.*, quote_delegation.*, benefits_admin.* permissions as per design spec)

---

### 5.3 brokerAuditWriter Contract

**File:** `lib/broker/brokerAuditWriter.ts`

**Methods:**
- `logAuditEvent(event)` → `{auditEventId: string}`

**Events logged:**
- SCOPE_CHECKED (scope_result: allowed/denied, reason)
- PERMISSION_CHECKED (permission, result: allowed/denied)
- BROKER_SCOPE_ACCESS_GRANTED
- BROKER_SCOPE_ACCESS_REVOKED
- BROKER_MGA_RELATIONSHIP_CREATED
- BROKER_MGA_RELATIONSHIP_TERMINATED

---

## 6. Scope Resolver Implementation

**Location:** `lib/broker/brokerScopeResolver.ts`

**Core logic:**
```
resolveScope(userId, entityType, entityId, action):
  1. Check tenant: user.tenant_id == entity.tenant_id?
     - NO → return {allowed: false, reason: 'cross-tenant'}
  2. Check channel context (if DISTRIBUTION_CHANNEL_CONTEXT_ENABLED):
     - Get channel context for entity
     - Check user can access channel
     - NO → return {allowed: false, reason: 'channel-access-denied'}
  3. Check broker scope:
     - If entity.broker_agency_id:
       - user.broker_agency_id == entity.broker_agency_id?
       - NO → check BrokerScopeAccessGrant
       - If no grant → return {allowed: false, reason: 'cross-broker-access'}
  4. Check MGA scope:
     - If entity.master_general_agent_id:
       - user.mga_id == entity.master_general_agent_id?
       - NO → check BrokerMGARelationship or BrokerScopeAccessGrant
       - If no relationship/grant → return {allowed: false, reason: 'cross-mga-access'}
  5. Return {allowed: true}
```

**Masking rule:** All 404 scope failures must return HTTP 404 (masked), not 403.

---

## 7. Permission Resolver Implementation

**Location:** `lib/broker/brokerPermissionResolver.ts`

**Core logic:**
```
hasPermission(userId, permission, context?):
  1. Get user role (broker_owner, broker_producer, broker_benefits_admin, broker_readonly, mga_admin, mga_user, platform_admin)
  2. Load permission matrix for user role
  3. Check if permission in matrix
     - NO → return false
  4. If context.scope provided:
     - Check user.restricted_scope == context.scope
     - NO → return false
  5. Return true
```

**Permission matrix by role:**
- `broker_owner` → All broker_agency.*, broker_direct.*, broker_mga.*, quote_delegation.*, benefits_admin.* (except benefits_admin.case_shell.create unless bridge enabled)
- `broker_producer` → broker_direct.case.*, broker_direct.census.upload, broker_direct.quote.*, broker_direct.proposal.send, broker_direct.enrollment.manage, quote_delegation.accept
- `broker_benefits_admin` → broker_direct.census.upload, broker_direct.enrollment.manage, broker_direct.quote.view, benefits_admin.enrollment.manage, benefits_admin.docusign.send, benefits_admin.bridge.switch
- `broker_readonly` → broker_direct.case.view, broker_direct.quote.view, broker_agency.view
- `mga_admin` → mga.*, platform_broker.* (if scoped to own MGA)
- `platform_admin` → All permissions

---

## 8. Audit Event Changes

**Location:** `lib/broker/brokerAuditWriter.ts`

**New audit events to log:**
- `BROKER_PLATFORM_RELATIONSHIP_CREATED` (approval chain)
- `BROKER_PLATFORM_RELATIONSHIP_APPROVED`
- `BROKER_MGA_RELATIONSHIP_ESTABLISHED`
- `BROKER_MGA_RELATIONSHIP_TERMINATED`
- `BROKER_SCOPE_ACCESS_GRANTED`
- `BROKER_SCOPE_ACCESS_REVOKED`
- `SCOPE_CHECK_FAILED` (masked 404)
- `PERMISSION_CHECK_FAILED` (explicit 403)
- `DISTRIBUTION_CHANNEL_CONTEXT_STAMPED` (backfill, not user action)

**Immutability enforcement:** AuditEvent table has no UPDATE or DELETE permissions after creation.

---

## 9. Feature Flags (New Registry)

**File:** `lib/featureFlags.ts`

**Flags (all default false):**

```typescript
export const featureFlags = {
  FIRST_CLASS_BROKER_MODEL_ENABLED: false,
  DISTRIBUTION_CHANNEL_CONTEXT_ENABLED: false,
  BROKER_SIGNUP_ENABLED: false,
  BROKER_ONBOARDING_ENABLED: false,
  BROKER_WORKSPACE_ENABLED: false,
  BROKER_PLATFORM_RELATIONSHIP_ENABLED: false,
  BROKER_MGA_RELATIONSHIP_ENABLED: false,
  BROKER_SCOPE_ACCESS_GRANT_ENABLED: false,
  QUOTE_CHANNEL_WRAPPER_ENABLED: false,
  QUOTE_DELEGATION_ENABLED: false,
  BENEFITS_ADMIN_CHANNEL_BRIDGE_ENABLED: false,
  BENEFITS_ADMIN_CASE_SHELL_ENABLED: false,
};
```

**Dependency chain enforced at startup:**
- If flag is false → all dependent features fail closed (masked 404 or permission denied)
- If flag true but dependency false → error logged, feature degraded

---

## 10. Migration and Backfill Dry-Run Plan

### 10.1 Shadow Stamp Backfill (Not Executed)

**Process (dry-run mode):**

1. **Identify all existing brokers** (from Phase 1 BrokerAgencyProfile):
   - Standalone brokers: `master_general_agent_id = NULL`
   - MGA-affiliated brokers: `master_general_agent_id = <mga_id>`

2. **For each broker, create BrokerPlatformRelationship:**
   - `broker_agency_id` → broker.id
   - `status` → "approved" (since Phase 1 approved them)
   - `approval_status` → "approved"
   - `approved_at` → broker.approved_at
   - `approved_by_user_email` → broker.approved_by_user_email

3. **For each MGA-affiliated broker, create BrokerMGARelationship:**
   - `broker_agency_id` → broker.id
   - `master_general_agent_id` → broker.master_general_agent_id
   - `status` → "active"
   - `relationship_type` → "affiliated" (default, can be refined later)

4. **Shadow stamp all existing business records:**
   - For each BenefitCase: stamp `broker_agency_id` from case creator or inferred context
   - For each CensusVersion: stamp `broker_agency_id` from parent case
   - For each QuoteScenario: stamp `broker_agency_id` from parent case
   - For each Proposal: stamp `broker_agency_id` from parent case
   - For each EmployeeEnrollment: stamp `broker_agency_id` from parent case
   - For each Task: stamp `broker_agency_id` from parent case
   - Do NOT update `updated_at`; log as separate stamp event

5. **Generate reports:**
   - `duplicate_broker_candidates.json` (brokers with same email/name/state/zip)
   - `orphan_broker_report.json` (brokers with no cases, users, or relationships)
   - `orphan_mga_report.json` (MGAs with no brokers)
   - `unknown_channel_classification.json` (cases that can't be auto-classified)
   - `shadow_stamp_summary.json` (counts: brokers processed, relationships created, records stamped)

6. **Validation queries (post-dry-run):**
   - Count of BrokerPlatformRelationship created == Count of brokers
   - Count of BrokerMGARelationship created == Count of MGA-affiliated brokers
   - All business records with broker_agency_id reference valid broker
   - No cross-tenant records stamped
   - No data deleted or modified (only added)

---

### 10.2 Dry-Run Execution (Not Live)

**Process:**
1. Run backfill in read-only mode on staging/test environment
2. Generate reports (see above)
3. Operator reviews reports
4. If OK → approve for production execution
5. If issues → request adjustments and re-run dry-run

**Dry-run code:** `lib/migrationBackfill.ts::dryRunBackfill()`

---

### 10.3 Production Backfill Execution (After Approval)

**Blocked until operator explicitly approves backfill execution.**

---

## 11. Test Plan (Comprehensive)

### 11.1 Unit Tests

**File:** `tests/gate-7a-0/scopeResolver.test.ts`

- Broker scope isolation (broker A cannot see broker B records)
- MGA scope isolation (MGA A cannot see MGA B records)
- Tenant isolation (tenant A cannot see tenant B records)
- Channel context checks (if enabled)
- BrokerScopeAccessGrant checks
- Masked 404 for scope failures

**File:** `tests/gate-7a-0/permissions.test.ts`

- Owner has all permissions
- Producer can create cases/quotes but not manage users
- Benefits admin can manage enrollment but not create quotes
- Read-only has view-only permissions
- MGA admin isolated from broker operations (unless relationship exists)

**File:** `tests/gate-7a-0/audit.test.ts`

- Audit events logged for all scope/permission checks
- Audit events immutable (no updates/deletes)
- Audit event timestamps server-set, not user-provided

---

### 11.2 Integration Tests

**File:** `tests/gate-7a-0/migration.test.ts`

- Shadow stamp idempotency (run twice, same result)
- Backfill does not update `updated_at`
- Orphan detection works correctly
- Duplicate detection identifies high-confidence matches

**File:** `tests/gate-7a-0/regression.test.ts`

- Gate 6K MGA analytics still functional
- Gate 6L-A broker contacts still functional
- Gates 6I-B, 6J-B, 6J-C, 6L-B remain untouched (feature flags false)
- Phase 1 broker signup workflow unaffected
- Phase 2 broker user invitations unaffected (if Phase 1 certified)

---

### 11.3 Contract Tests

- brokerScopeResolver.resolveScope() enforces all scopes correctly
- brokerPermissionResolver.hasPermission() checks all permissions correctly
- brokerAuditWriter.logAuditEvent() creates immutable records

---

## 12. Rollback Plan

### 12.1 Immediate Rollback Actions

- Disable feature flags (set all to false):
  - `FIRST_CLASS_BROKER_MODEL_ENABLED = false`
  - `BROKER_WORKSPACE_ENABLED = false`
  - `QUOTE_CHANNEL_WRAPPER_ENABLED = false`
  - `BENEFITS_ADMIN_CHANNEL_BRIDGE_ENABLED = false`

- Revert read paths to legacy compatibility mode:
  - `compatibilityMode = true`
  - Scope resolver uses legacy MGA → Broker → Case hierarchy
  - Ignore new channel context logic

### 12.2 Data Preservation During Rollback

- New entities (BrokerPlatformRelationship, BrokerMGARelationship, BrokerScopeAccessGrant) remain in database
- Shadow-stamped fields remain in database (unused, but preserved)
- Audit events remain (immutable)
- **No destructive rollback without operator approval**

### 12.3 Re-enablement Path

- All shadow-stamped records preserved for re-enablement
- Feature flags can be re-enabled after root cause fix
- No data migration needed (already backfilled)

---

## 13. Registry Update Plan

**File:** `docs/GATE_STATUS_LEDGER.json`

**Update entry:**

```json
{
  "gate": "7A-0",
  "name": "First-Class Broker Core Model",
  "status": "IMPLEMENTATION_IN_PROGRESS",
  "workOrderStatus": "APPROVED",
  "phase": "Implementation Phase 1: Core Model",
  "runtimeStatus": "INACTIVE",
  "implementationStatus": "WORK_ORDER_APPROVED",
  "blockedOn": "OPERATOR_IMPLEMENTATION_APPROVAL",
  "estimatedEffort": "120 hours (2 FTE, 4 weeks)",
  "dependencies": ["Gate 7A-P (approved)", "Phase 1 (certified)"],
  "blockingDependencies": ["Gate 6K (must not regress)", "Gate 6L-A (must not regress)"],
  "deferredGates": ["6I-B", "6J-B", "6J-C", "6L-B"],
  "features": [
    "BrokerPlatformRelationship entity",
    "BrokerMGARelationship entity",
    "BrokerScopeAccessGrant entity",
    "Broker scope resolver contract",
    "Broker permission resolver contract",
    "Broker audit writer contract",
    "Feature flag registry (12 flags, all default false)",
    "Shadow stamp backfill plan (dry-run mode)",
    "Comprehensive test plan (5 test suites)",
    "Rollback plan (feature flag gates, no data loss)"
  ]
}
```

---

## 14. Stop Condition (CRITICAL)

**STATUS: WORK_ORDER_COMPLETE, AWAITING OPERATOR IMPLEMENTATION APPROVAL**

### No Implementation Until Operator Approval

This work order defines what will be done but does NOT implement anything.

**Authorization block:**
- [x] Gate 7A-P design freeze approved
- [ ] Gate 7A-0 work order approved (THIS DECISION PENDING)
- [ ] Runtime implementation authorized
- [ ] Backfill execution authorized

**Operator must confirm:**

- [ ] **APPROVE WORK ORDER** — Proceed with Gate 7A-0 implementation immediately

- [ ] **REQUEST REVISIONS** — Work order needs adjustments before implementation approval

- [ ] **HOLD IMPLEMENTATION** — Pause Gate 7A-0 pending further review

### Do Not Proceed Without Explicit Approval

- Do not create any files listed in §3 until work order approved
- Do not create any new backend contracts until work order approved
- Do not execute migration/backfill until separately authorized
- Do not deploy feature flags until separately authorized
- Do not run any tests until work order approved

---

## Final Checklist

- [x] All entity schemas proposed (not created)
- [x] All file modifications identified (not applied)
- [x] All service contracts designed (not implemented)
- [x] Scope resolver rules defined (not implemented)
- [x] Permission resolver rules defined (not implemented)
- [x] Audit logging rules defined (not implemented)
- [x] Feature flags designed (not created)
- [x] Migration/backfill planned (not executed)
- [x] Test plan comprehensive (not implemented)
- [x] Rollback plan complete (feature flag based, no data loss)
- [x] Registry update defined (not applied)
- [x] Stop condition established (WORK_ORDER_COMPLETE, AWAITING_APPROVAL)

---

**Work Order Status:** COMPLETE  
**Date Completed:** 2026-05-13  
**Awaiting:** Operator implementation approval decision  
**Next Step:** Operator approves/revises/holds; then Base44 proceeds (or stops) accordingly