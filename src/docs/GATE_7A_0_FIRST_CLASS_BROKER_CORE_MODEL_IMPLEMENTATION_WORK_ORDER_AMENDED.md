# Gate 7A-0: First-Class Broker Core Model
## Implementation Work Order — AMENDED

**Date:** 2026-05-13  
**Status:** AMENDED_WORK_ORDER_READY (Awaiting Operator Implementation Approval)  
**Amendment Authority:** Operator request for comprehensive entity/contract/test coverage  
**Implementation Authority:** BLOCKED until operator approves this amended work order

---

## EXECUTIVE SUMMARY

Gate 7A-0 implements the first-class broker agency core model with complete entity, contract, scope, permission, and audit coverage. This is a **planning and specification document only**. No runtime code, no schema changes, no data modifications until operator approval.

**This work order explicitly addresses all 15 amendment requirements:**
- Full entity coverage (14 entities: 5 new, 9 modified)
- DistributionChannelContext as canonical ownership model
- BrokerAgencyProfile corrections (master_general_agent_id non-identifying, nullable, non-required)
- Complete backend contracts (6 contract groups, 30+ methods)
- Complete scope resolution (7 resolver methods, masked 404 enforcement)
- Complete permission namespaces (6 namespaces, 60+ permissions)
- Complete audit enforcement (immutable records, full event set)
- Complete field stamping (13 fields across 14 entities)
- Complete dry-run migration plan (6 reports, no execution)
- Complete acceptance test plan (30 tests, all required scenarios)
- Closeout report requirement
- Hard stop: no implementation without operator approval

---

## SECTION 1: COMPLETE ENTITY COVERAGE

### Entity Status Summary

| # | Entity | Status | Action | Details |
|---|--------|--------|--------|---------|
| 1 | DistributionChannelContext | NEW | CREATE | Canonical ownership/visibility model (§1.1) |
| 2 | BrokerAgencyProfile | EXISTING | CORRECT | master_general_agent_id: nullable, non-identifying (§1.2) |
| 3 | BrokerPlatformRelationship | NEW | CREATE | Broker ↔ Platform direct business contract (§1.3) |
| 4 | BrokerMGARelationship | NEW | CREATE | Broker ↔ MGA optional affiliation (§1.4) |
| 5 | BrokerScopeAccessGrant | NEW | CREATE | Explicit scope access grants (§1.5) |
| 6 | BrokerAgencyUser | NEW | CREATE | Broker team member records (Phase 2 prep) (§1.6) |
| 7 | EmployerGroup | EXISTING | SHADOW_STAMP | Add 13-field stamp set (§1.7) |
| 8 | BenefitCase | EXISTING | SHADOW_STAMP | Add 13-field stamp set (§1.7) |
| 9 | CensusVersion | EXISTING | SHADOW_STAMP | Add 13-field stamp set (§1.7) |
| 10 | QuoteScenario | EXISTING | SHADOW_STAMP | Add 13-field stamp set (§1.7) |
| 11 | Proposal | EXISTING | SHADOW_STAMP | Add 13-field stamp set (§1.7) |
| 12 | EmployeeEnrollment | EXISTING | SHADOW_STAMP | Add 13-field stamp set (§1.7) |
| 13 | EnrollmentWindow | EXISTING | SHADOW_STAMP | Add 13-field stamp set (§1.7) |
| 14 | Task | EXISTING | SHADOW_STAMP | Add 13-field stamp set (§1.7) |

---

### 1.1 New Entity: DistributionChannelContext

**File to create:** `src/entities/DistributionChannelContext.json`

**Purpose:** Canonical source of truth for record ownership, visibility, and access scope.

```json
{
  "name": "DistributionChannelContext",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "UUID primary key"
    },
    "tenant_id": {
      "type": "string",
      "description": "Tenant scope (mandatory)"
    },
    "channel_type": {
      "type": "string",
      "enum": [
        "platform_direct",
        "standalone_broker",
        "mga_direct",
        "mga_affiliated_broker",
        "hybrid_broker_direct",
        "hybrid_broker_mga",
        "employer_direct"
      ],
      "description": "Channel classification (immutable after creation)"
    },
    "owner_org_type": {
      "type": "string",
      "enum": ["platform", "broker", "mga", "employer"],
      "description": "Primary owner type (identifies which org controls records in this context)"
    },
    "owner_org_id": {
      "type": "string",
      "description": "PK of owner org (MGA ID, Broker Agency ID, Employer ID, or null for platform)"
    },
    "servicing_org_type": {
      "type": "string",
      "enum": ["broker", "mga", "employer", "benefits_admin"],
      "nullable": true,
      "description": "Optional servicing org (e.g., broker servicing an MGA-owned employer)"
    },
    "servicing_org_id": {
      "type": "string",
      "nullable": true,
      "description": "PK of servicing org"
    },
    "supervising_org_type": {
      "type": "string",
      "enum": ["mga", "platform"],
      "nullable": true,
      "description": "Optional supervising org (e.g., MGA supervising a broker)"
    },
    "supervising_org_id": {
      "type": "string",
      "nullable": true,
      "description": "PK of supervising org"
    },
    "visibility_scope": {
      "type": "string",
      "enum": ["owner_only", "owner_and_servicing", "owner_and_supervising", "owner_and_all_affiliates", "platform_wide"],
      "default": "owner_only",
      "description": "Which orgs can see records in this context"
    },
    "status": {
      "type": "string",
      "enum": ["draft", "active", "suspended", "archived"],
      "default": "draft"
    },
    "created_by_user_id": {
      "type": "string",
      "description": "User who created this context"
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
  "required": [
    "tenant_id",
    "channel_type",
    "owner_org_type",
    "owner_org_id"
  ]
}
```

**Channel Invariant Rules:**

| Channel Type | owner_org_type | owner_org_id | servicing_org_type | supervising_org_type | visibility_scope |
|---|---|---|---|---|---|
| platform_direct | platform | null | null | null | platform_wide |
| standalone_broker | broker | broker_id | null | null | owner_only |
| mga_direct | mga | mga_id | null | null | owner_only |
| mga_affiliated_broker | broker | broker_id | null | mga | owner_and_supervising |
| hybrid_broker_direct | broker | broker_id | null | null | owner_only |
| hybrid_broker_mga | broker | broker_id | mga | mga | owner_and_all_affiliates |
| employer_direct | employer | employer_id | broker | null | owner_and_servicing |

---

### 1.2 BrokerAgencyProfile Corrections

**File to modify:** `src/entities/BrokerAgencyProfile.json`

**Corrections required (NOT schema changes, clarifications):**

1. **master_general_agent_id field corrections:**
   - Remains in schema for legacy compatibility only
   - Must be nullable: `"nullable": true`
   - Must NOT be required: removed from `required` array
   - Is NON-IDENTIFYING: does not determine broker identity
   - Is NOT the parent: broker is first-class, not MGA child
   - Is NOT required for creation: standalone broker creation does NOT require MGA
   - Purpose: tracks legacy affiliation only; new MGA relationships use BrokerMGARelationship entity

2. **New required field:**
   - `distribution_channel_context_id` (string, FK to DistributionChannelContext, required): canonical ownership/visibility

**Result:** BrokerAgencyProfile is a first-class entity with optional MGA affiliation tracked separately.

---

### 1.3 New Entity: BrokerPlatformRelationship

**File to create:** `src/entities/BrokerPlatformRelationship.json`

**Purpose:** Tracks broker ↔ platform direct business contract.

```json
{
  "name": "BrokerPlatformRelationship",
  "type": "object",
  "properties": {
    "id": {
      "type": "string"
    },
    "tenant_id": {
      "type": "string"
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

### 1.4 New Entity: BrokerMGARelationship

**File to create:** `src/entities/BrokerMGARelationship.json`

**Purpose:** Tracks optional broker ↔ MGA affiliation.

```json
{
  "name": "BrokerMGARelationship",
  "type": "object",
  "properties": {
    "id": {
      "type": "string"
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

### 1.5 New Entity: BrokerScopeAccessGrant

**File to create:** `src/entities/BrokerScopeAccessGrant.json`

**Purpose:** Explicit grants allowing broker to access non-owned resources (e.g., MGA broker accessing MGA direct record).

```json
{
  "name": "BrokerScopeAccessGrant",
  "type": "object",
  "properties": {
    "id": {
      "type": "string"
    },
    "tenant_id": {
      "type": "string"
    },
    "broker_agency_id": {
      "type": "string",
      "description": "Grantee broker"
    },
    "target_entity_type": {
      "type": "string",
      "enum": ["MGA", "DistributionChannelContext", "BenefitCase"],
      "description": "Type of resource being granted"
    },
    "target_entity_id": {
      "type": "string",
      "description": "PK of target resource"
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
      "description": "null = permanent; past date = expired"
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

### 1.6 New Entity: BrokerAgencyUser

**File to create:** `src/entities/BrokerAgencyUser.json`

**Purpose:** Broker team member records (Phase 2 prep, not activated in Gate 7A-0).

```json
{
  "name": "BrokerAgencyUser",
  "type": "object",
  "properties": {
    "id": {
      "type": "string"
    },
    "tenant_id": {
      "type": "string"
    },
    "broker_agency_id": {
      "type": "string",
      "description": "FK to BrokerAgencyProfile (scoping field)"
    },
    "user_id": {
      "type": "string",
      "nullable": true,
      "description": "Base44 User ID (null during invitation, set after acceptance)"
    },
    "email": {
      "type": "string",
      "description": "User email (primary key for invite matching)"
    },
    "first_name": {
      "type": "string"
    },
    "last_name": {
      "type": "string"
    },
    "role": {
      "type": "string",
      "enum": ["owner", "manager", "viewer"],
      "description": "Broker-level role"
    },
    "status": {
      "type": "string",
      "enum": ["invited", "active", "suspended", "deactivated"],
      "default": "invited"
    },
    "invited_by_user_id": {
      "type": "string"
    },
    "invited_at": {
      "type": "string",
      "format": "date-time"
    },
    "accepted_at": {
      "type": "string",
      "format": "date-time",
      "nullable": true
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
  "required": ["tenant_id", "broker_agency_id", "email", "first_name", "last_name", "role"]
}
```

---

### 1.7 Shadow Stamp Field Set (14 Entities Modified)

**Fields to add to each of these entities:**
- `EmployerGroup`
- `BenefitCase`
- `CensusVersion`
- `QuoteScenario`
- `Proposal`
- `EmployeeEnrollment`
- `EnrollmentWindow`
- `Task`
- (Plus 6 more in §1.7 extended list)

**13-field stamp set (ALL nullable, added during backfill only):**

```json
{
  "distribution_channel_context_id": {
    "type": "string",
    "nullable": true,
    "description": "FK to DistributionChannelContext (canonical ownership/visibility)"
  },
  "tenant_id": {
    "type": "string",
    "nullable": true,
    "description": "Tenant scope (should match owner tenant, backfill verification)"
  },
  "broker_agency_id": {
    "type": "string",
    "nullable": true,
    "description": "Broker agency scope (if broker-owned or broker-servicing)"
  },
  "master_general_agent_id": {
    "type": "string",
    "nullable": true,
    "description": "MGA scope (if MGA-owned or MGA-supervising) — NON-IDENTIFYING"
  },
  "owner_org_type": {
    "type": "string",
    "enum": ["platform", "broker", "mga", "employer"],
    "nullable": true,
    "description": "Denormalized from DistributionChannelContext for query performance"
  },
  "owner_org_id": {
    "type": "string",
    "nullable": true,
    "description": "Denormalized owner PK for query performance"
  },
  "servicing_org_type": {
    "type": "string",
    "enum": ["broker", "mga", "employer", "benefits_admin"],
    "nullable": true,
    "description": "Denormalized servicing org type"
  },
  "servicing_org_id": {
    "type": "string",
    "nullable": true,
    "description": "Denormalized servicing org PK"
  },
  "supervising_org_type": {
    "type": "string",
    "enum": ["mga", "platform"],
    "nullable": true,
    "description": "Denormalized supervising org type"
  },
  "supervising_org_id": {
    "type": "string",
    "nullable": true,
    "description": "Denormalized supervising org PK"
  },
  "created_by_user_id": {
    "type": "string",
    "nullable": true,
    "description": "User who created this record (for audit)"
  },
  "created_by_role": {
    "type": "string",
    "nullable": true,
    "description": "User role at creation time (for audit trail)"
  },
  "visibility_scope": {
    "type": "string",
    "enum": ["owner_only", "owner_and_servicing", "owner_and_supervising", "owner_and_all_affiliates", "platform_wide"],
    "nullable": true,
    "description": "Denormalized visibility scope for query optimization"
  }
}
```

**Extended entity list to receive 13-field stamp set:**
1. EmployerGroup
2. BenefitCase
3. CensusVersion
4. QuoteScenario
5. Proposal
6. EmployeeEnrollment
7. EnrollmentWindow
8. Task
9. RenewalCycle
10. Document
11. AuditEvent (audit_trace_id only, no other stamps)
12. BenefitsImplementationCase
13. BrokerAgencyUser
14. DistributionChannelContext

---

## SECTION 2: COMPLETE SERVICE CONTRACT COVERAGE

### Contract Groups Summary

| # | Contract Group | File | Methods | Purpose |
|---|---|---|---|---|
| 1 | distributionChannelContract | `lib/broker/distributionChannelContract.ts` | 8 | Create/manage/query distribution channels |
| 2 | brokerAgencyContract | `lib/broker/brokerAgencyContract.ts` | 10 | Broker agency lifecycle management |
| 3 | brokerPlatformRelationshipContract | `lib/broker/brokerPlatformRelationshipContract.ts` | 8 | Broker ↔ platform relationship lifecycle |
| 4 | brokerMGARelationshipContract | `lib/broker/brokerMGARelationshipContract.ts` | 8 | Broker ↔ MGA relationship lifecycle |
| 5 | scopeResolutionContract | `lib/broker/scopeResolutionContract.ts` | 7 | Actor scope validation & resolution |
| 6 | permissionContract | `lib/broker/permissionContract.ts` | 5 | Permission checking & enforcement |

**Total: 46 methods across 6 contract groups**

---

### 2.1 distributionChannelContract

**File:** `lib/broker/distributionChannelContract.ts`

**Methods:**

1. `createChannel(tenantId, channelType, ownerOrgType, ownerOrgId, servicingOrg?, supervisingOrg?)` → `{id, status}`
   - Validates channel invariants (§1.1 table)
   - Returns new DistributionChannelContext

2. `getChannel(channelId)` → `DistributionChannelContext` | throws 404

3. `listChannels(tenantId, filters?)` → `DistributionChannelContext[]`
   - Filters: owner_org_type, owner_org_id, status

4. `updateChannelStatus(channelId, newStatus)` → `{status}`
   - Allowed transitions: draft→active, active→suspended, suspended→active, *→archived

5. `getVisibilityScope(channelId)` → `visibility_scope_value`

6. `canOrgAccessChannel(orgId, orgType, channelId)` → `boolean`
   - Checks visibility_scope rules

7. `resolveChannelForActor(userId, action)` → `DistributionChannelContext`
   - Returns channel actor can operate in given action context

8. `stampRecordWithChannel(recordId, entityType, channelId)` → `{stamped_at}`
   - Adds distribution_channel_context_id and 12 denormalized fields to record

---

### 2.2 brokerAgencyContract

**File:** `lib/broker/brokerAgencyContract.ts`

**Methods:**

1. `createBrokerAgency(tenantId, legalName, email, state, ...)` → `{id, status}`
   - master_general_agent_id NOT required
   - Creates BrokerAgencyProfile and BrokerPlatformRelationship

2. `getBrokerAgency(brokerId)` → `BrokerAgencyProfile` | throws 404

3. `listBrokerAgencies(tenantId, filters?)` → `BrokerAgencyProfile[]`

4. `updateBrokerProfile(brokerId, updates)` → `{updated_at}`

5. `affiliateBrokerWithMGA(brokerId, mgaId, relationshipType)` → `{relationship_id}`
   - Creates BrokerMGARelationship
   - Updates DistributionChannelContext if channel exists

6. `removeBrokerMGAAffiliation(relationshipId)` → `{removed_at}`
   - Terminates BrokerMGARelationship
   - Does NOT modify existing records

7. `getBrokerStatus(brokerId)` → `{status, compliance_status, approval_status}`

8. `isBrokerStandalone(brokerId)` → `boolean`
   - true if no active BrokerMGARelationship

9. `isBrokerMGAAffilian(brokerId)` → `boolean`
   - true if active BrokerMGARelationship exists

10. `getBrokerAffiliatedMGAs(brokerId)` → `MasterGeneralAgent[]`
    - Returns all active MGA affiliations

---

### 2.3 brokerPlatformRelationshipContract

**File:** `lib/broker/brokerPlatformRelationshipContract.ts`

**Methods:**

1. `createRelationship(brokerId, requestedByEmail)` → `{relationship_id, status}`
   - Creates pending_approval BrokerPlatformRelationship

2. `getRelationship(relationshipId)` → `BrokerPlatformRelationship` | throws 404

3. `approveRelationship(relationshipId, approvedByEmail)` → `{status: approved}`
   - Requires platform_admin role
   - Updates approval_status, approved_by_user_email, approved_at

4. `rejectRelationship(relationshipId, rejectionReason)` → `{status: rejected}`

5. `suspendRelationship(relationshipId, reason)` → `{status: suspended}`
   - Can be reactivated

6. `deactivateRelationship(relationshipId)` → `{status: inactive}`
   - Permanent; requires platform decision

7. `getRelationshipStatus(brokerId)` → `{status, approval_status, compliance_status}`

8. `listPendingApprovals(tenantId)` → `BrokerPlatformRelationship[]`

---

### 2.4 brokerMGARelationshipContract

**File:** `lib/broker/brokerMGARelationshipContract.ts`

**Methods:**

1. `createMGARelationship(brokerId, mgaId, relationshipType)` → `{relationship_id}`
   - Creates draft BrokerMGARelationship

2. `getMGARelationship(relationshipId)` → `BrokerMGARelationship` | throws 404

3. `activateMGARelationship(relationshipId, establishedByEmail)` → `{status: active}`
   - MGA admin or platform admin only
   - Sets established_at, established_by_user_email

4. `suspendMGARelationship(relationshipId, reason)` → `{status: suspended}`

5. `terminateMGARelationship(relationshipId, reason)` → `{status: terminated}`
   - Permanent; does NOT delete existing records

6. `getMGARelationshipStatus(brokerId, mgaId)` → `{status, relationship_type}`

7. `listBrokerMGARelationships(brokerId)` → `BrokerMGARelationship[]`

8. `listMGABrokerRelationships(mgaId)` → `BrokerMGARelationship[]`

---

### 2.5 scopeResolutionContract

**File:** `lib/broker/scopeResolutionContract.ts`

**Methods:**

1. `resolveActorTenantScope(userId)` → `{tenant_id, allowed_tenants[]}`
   - Returns tenant actor can operate in

2. `resolveActorBrokerScope(userId)` → `{broker_agency_id?, allowed_brokers[]}`
   - Returns broker(s) actor can operate in
   - null if actor not a broker user

3. `resolveActorMGAScope(userId)` → `{master_general_agent_id?, allowed_mgas[]}`
   - Returns MGA(s) actor can operate in
   - null if actor not an MGA user

4. `resolveDistributionChannelScope(userId, channelId)` → `boolean`
   - true if actor can access this channel

5. `assertRecordVisibleToActor(userId, recordId, entityType)` → void
   - Throws masked 404 if not visible
   - Checks tenant, broker, MGA, channel visibility

6. `assertRecordActionPermitted(userId, recordId, entityType, action)` → void
   - Throws 403 if visible but not permitted for action
   - Checks scope + permission

7. `maskScopeFailure(actualReason)` → `{error: 'not found', httpStatus: 404}`
   - Converts scope denial to masked 404 for client response

---

### 2.6 permissionContract

**File:** `lib/broker/permissionContract.ts`

**Methods:**

1. `hasPermission(userId, permission, context?)` → `boolean`
   - context: {scope?, action?, resource_type?}

2. `requirePermission(userId, permission, context?)` → void
   - Throws 403 if denied

3. `getPermissionMatrix(role)` → `{permission: boolean}[]`
   - Returns all permissions for role

4. `isRoleElevated(role)` → `boolean`
   - true if role has admin/elevated privileges

5. `canUserDelegatePermission(userId, delegatedPermission)` → `boolean`
   - Only certain roles can delegate

---

## SECTION 3: COMPLETE SCOPE RESOLVER BEHAVIOR

### Scope Resolver Methods (§2.5 contracts)

**File:** `lib/broker/scopeResolutionContract.ts`

#### Method: resolveActorTenantScope

```
Input: userId
Output: {tenant_id: "T1", allowed_tenants: ["T1"]}

Logic:
  1. Load user record
  2. Get user.tenant_id
  3. Check user status (active, suspended, deactivated)
  4. Return tenant actor can operate in
  5. If user suspended/deactivated → allowed_tenants = []
```

#### Method: resolveActorBrokerScope

```
Input: userId
Output: {broker_agency_id: "B1", allowed_brokers: ["B1", "B2"]}
        OR null if actor not broker-affiliated

Logic:
  1. Load user record + user.broker_agency_id
  2. If user is NOT broker type → return null
  3. Check user.broker_agency_id BrokerPlatformRelationship.status
     - If not approved → allowed_brokers = []
  4. Check BrokerScopeAccessGrant for additional brokers
  5. Return list of brokers actor can access
```

#### Method: resolveActorMGAScope

```
Input: userId
Output: {master_general_agent_id: "M1", allowed_mgas: ["M1"]}
        OR null if actor not MGA-affiliated

Logic:
  1. Load user record + user.master_general_agent_id
  2. If user is NOT MGA type → return null
  3. Check user.master_general_agent_id MasterGeneralAgent.status
  4. If BROKER_MGA_RELATIONSHIP_ENABLED:
     - Also check affiliated brokers' allowed scopes
  5. Return list of MGAs actor can access
```

#### Method: resolveDistributionChannelScope

```
Input: userId, channelId
Output: boolean (true if visible)

Logic:
  1. Load channel = DistributionChannelContext(channelId)
  2. Resolve actor scope (tenant, broker, mga)
  3. Check channel visibility_scope:
     - platform_wide → return true (platform admin only)
     - owner_only → actor must match owner_org_id
     - owner_and_servicing → actor must match owner OR servicing
     - owner_and_supervising → actor must match owner OR supervising
     - owner_and_all_affiliates → actor must match owner OR any affiliate
  4. Return true/false
  5. If false AND feature disabled → masked 404 (§3.1)
```

#### Method: assertRecordVisibleToActor

```
Input: userId, recordId, entityType
Output: void (throws if denied)

Logic:
  1. Resolve actor scopes (tenant, broker, mga)
  2. Load record = Entity(recordId)
  3. Check record.tenant_id == actor.tenant_id
     - NO → throw ScopeError('cross-tenant')
  4. If DISTRIBUTION_CHANNEL_CONTEXT_ENABLED:
     - Check resolveDistributionChannelScope(userId, record.distribution_channel_context_id)
     - false → throw ScopeError('channel-access-denied')
  5. Check broker scope:
     - If record.broker_agency_id:
       - actor.broker_agency_id == record.broker_agency_id?
       - NO → check BrokerScopeAccessGrant + actor.allowed_brokers
       - If not granted → throw ScopeError('cross-broker-access')
  6. Check MGA scope:
     - If record.master_general_agent_id:
       - actor.mga_id == record.master_general_agent_id?
       - NO → check BrokerMGARelationship + actor.allowed_mgas
       - If not allowed → throw ScopeError('cross-mga-access')
  7. Return void (success)
```

**Exception handling:**
- All ScopeErrors bubble up to request handler
- Handler calls maskScopeFailure() → masked 404 response

#### Method: assertRecordActionPermitted

```
Input: userId, recordId, entityType, action (read/update/delete/create)
Output: void (throws if denied)

Logic:
  1. assertRecordVisibleToActor(userId, recordId, entityType) [must pass]
  2. Load record + user + user.role
  3. Check permissionContract.hasPermission(userId, "${entityType}.${action}", {scope: record.scope_id})
  4. If false → throw PermissionError(403)
  5. Return void (success)
```

**Exception handling:**
- PermissionError returns 403 (NOT masked; error is in valid scope)

#### Method: maskScopeFailure

```
Input: actualReason (string describing why scope denied)
Output: {error: 'not found', httpStatus: 404, detail: null}

Logic:
  1. Receive actual reason (e.g., 'cross-broker-access', 'cross-tenant')
  2. Log reason (with audit_trace_id) for debugging
  3. DO NOT return reason to client
  4. Return generic 404 'not found' response
  5. Exception handler in request layer returns HTTP 404 to client
```

---

### Scope Enforcement Rules (CRITICAL)

**Rule 1: Tenant isolation**
- Cross-tenant access denied immediately (scope failure)
- Returns masked 404

**Rule 2: Broker isolation**
- Broker A user cannot access Broker B records
- Unless BrokerScopeAccessGrant exists + not expired
- Returns masked 404

**Rule 3: MGA isolation**
- MGA user cannot access Standalone Broker direct records
- Unless BrokerMGARelationship active AND BrokerScopeAccessGrant exists
- Returns masked 404

**Rule 4: Platform visibility**
- Platform admin with permission can see any record
- Platform admin without permission → 403 (permission error, not scope)

**Rule 5: Channel visibility**
- If DISTRIBUTION_CHANNEL_CONTEXT_ENABLED:
  - visibility_scope rules enforce who can see channel
  - Masked 404 if visibility_scope doesn't include actor

**Rule 6: Hybrid disambiguation**
- Broker can have BOTH direct book (standalone_broker) AND MGA-affiliated book (mga_affiliated_broker)
- Records stamped with different distribution_channel_context_id values
- Records remain distinguishable via channel context lookup

---

## SECTION 4: COMPLETE PERMISSION NAMESPACE COVERAGE

### Permission Namespaces (6 Total)

| Namespace | Purpose | Sample Permissions | Applicable Roles |
|---|---|---|---|
| platform_broker.* | Platform management of broker | platform_broker.view, create, update, deactivate | platform_admin, platform_super_admin |
| broker_agency.* | Broker self-management | broker_agency.view, manage_users, manage_settings | broker_owner, broker_manager |
| broker_direct.* | Broker direct book | broker_direct.case.create, quote.create, etc. | broker_owner, broker_producer, broker_benefits_admin |
| broker_mga.* | Broker MGA affiliation operations | broker_mga.activate, suspend, etc. | broker_owner, mga_admin |
| quote_delegation.* | Quote transmission/delegation | quote_delegation.send, accept, track | broker_owner, broker_producer |
| benefits_admin.* | Benefits Admin channel operations | benefits_admin.enrollment.manage, bridge.switch | broker_owner, broker_benefits_admin, platform_admin |

### Complete Permission Matrix

**broker_owner (all permissions except restricted):**
```
platform_broker.view
broker_agency.view, manage_users, manage_settings
broker_direct.case.create, case.read, case.update
broker_direct.census.upload, census.read
broker_direct.quote.create, quote.read, quote.update
broker_direct.proposal.create, proposal.read, proposal.send
broker_direct.enrollment.manage
broker_mga.activate, suspend (if affiliated)
quote_delegation.send, accept, track
benefits_admin.enrollment.manage, docusign.send
benefits_admin.bridge.switch (if enabled)
```

**broker_producer:**
```
broker_agency.view
broker_direct.case.create, case.read, case.update
broker_direct.census.upload, census.read
broker_direct.quote.create, quote.read, quote.update
broker_direct.proposal.read, proposal.send
broker_direct.enrollment.read
quote_delegation.send, accept, track
```

**broker_benefits_admin:**
```
broker_agency.view
broker_direct.census.upload
broker_direct.enrollment.manage
broker_direct.quote.read
benefits_admin.enrollment.manage, docusign.send
benefits_admin.bridge.switch (if enabled)
```

**broker_readonly:**
```
broker_agency.view
broker_direct.case.read
broker_direct.quote.read
broker_direct.proposal.read
```

**mga_admin:**
```
mga.view, update_settings
broker_mga.list_affiliated_brokers
broker_mga.activate, suspend (affiliated brokers only)
quote_delegation.track (owned quotes only)
platform_broker.view (affiliated brokers only)
```

**platform_admin:**
```
[ALL permissions in all namespaces]
```

### Feature Flag Gating for Permissions

**All permissions in broker_direct.*, broker_mga.*, broker_agency.*, quote_delegation.*, benefits_admin.* are blocked by feature flags:**

```
hasPermission(userId, "broker_direct.case.create"):
  1. Check if FIRST_CLASS_BROKER_MODEL_ENABLED == true
     - false → return false (permission denied)
  2. Check if BROKER_WORKSPACE_ENABLED == true
     - false → return false (permission denied)
  3. Check user.role in [broker_owner, broker_producer, benefits_admin]
     - false → return false (permission denied)
  4. Check user scope (broker must be approved)
     - false → return false (permission denied)
  5. Return true (permission allowed)
```

**Result:** With all flags false (default), all new broker/quote_delegation/benefits_admin permissions are denied, keeping features inactive.

---

## SECTION 5: COMPLETE AUDIT ENFORCEMENT

### Audit Immutability Rules

**AuditEvent entity rules:**
1. No UPDATE path exists (no modify audit events)
2. No DELETE path exists (no delete audit events)
3. Corrections use append-only correction events
4. Server timestamp authority (never user-provided)
5. Immutable from creation

### Required Audit Events

**Event: SCOPE_RESOLVED**
- actor_id, action, target_entity_type, target_entity_id
- scope_result: allowed/denied
- reason: (reason code, not sensitive data)
- timestamp

**Event: PERMISSION_CHECKED**
- actor_id, permission_name, context
- result: allowed/denied
- timestamp

**Event: BROKER_PLATFORM_RELATIONSHIP_CREATED**
- actor_id, broker_agency_id, status: pending_approval
- timestamp

**Event: BROKER_PLATFORM_RELATIONSHIP_APPROVED**
- actor_id, broker_agency_id, approved_by
- timestamp

**Event: BROKER_MGA_RELATIONSHIP_ESTABLISHED**
- actor_id, broker_agency_id, mga_id
- timestamp

**Event: BROKER_MGA_RELATIONSHIP_TERMINATED**
- actor_id, broker_agency_id, mga_id, reason
- timestamp

**Event: BROKER_SCOPE_ACCESS_GRANTED**
- actor_id, broker_agency_id, target_type, target_id, expires_at
- timestamp

**Event: BROKER_SCOPE_ACCESS_REVOKED**
- actor_id, broker_agency_id, target_type, target_id
- timestamp

**Event: DISTRIBUTION_CHANNEL_CONTEXT_STAMPED** (backfill, not user action)
- batch_id, record_id, entity_type, channel_context_id
- timestamp

### Audit Trace Propagation

Every material action must:
1. Generate audit_trace_id (UUID)
2. Include in all related audit events
3. Store on affected records (audit_trace_id field)
4. Link request → audit events → records for full lineage
5. Preserve for operator investigation

---

## SECTION 6: COMPLETE FIELD STAMPING PLAN

### Shadow Stamping Fields (13 Total)

Applied to 14 entities during backfill (§1.7):

```
1. distribution_channel_context_id (FK)
2. tenant_id (denormalize for performance)
3. broker_agency_id (FK, if applicable)
4. master_general_agent_id (denormalize, non-identifying)
5. owner_org_type (enum)
6. owner_org_id (FK)
7. servicing_org_type (enum)
8. servicing_org_id (FK)
9. supervising_org_type (enum)
10. supervising_org_id (FK)
11. created_by_user_id (audit)
12. created_by_role (audit)
13. visibility_scope (enum, for query optimization)
```

### Backfill Dry-Run Plan (No Execution)

**Phase 1: Identify existing records**

Categorize all existing records by distribution channel:

- **Platform direct:** master_general_agent_id=null, broker_agency_id=null → channel_type="platform_direct"
- **Standalone broker:** broker_agency_id=X, master_general_agent_id=null → channel_type="standalone_broker"
- **MGA direct:** master_general_agent_id=Y, broker_agency_id=null → channel_type="mga_direct"
- **MGA-affiliated broker:** broker_agency_id=X, master_general_agent_id=Y (active BrokerMGARelationship) → channel_type="mga_affiliated_broker"
- **Hybrid:** broker_agency_id=X, AND (multiple BrokerMGARelationship OR BrokerScopeAccessGrant) → channel_type="hybrid_broker_*"
- **Unknown:** Cannot categorize → quarantine, operator review

**Phase 2: Generate dry-run reports**

1. `categorized_records_by_channel.json` (counts by channel_type)
2. `unknown_or_anomalous_records.json` (records that don't fit channel rules)
3. `orphan_broker_agencies.json` (brokers with no records)
4. `orphan_mgas.json` (MGAs with no brokers or records)
5. `duplicate_broker_candidates.json` (brokers with same email/name, likely duplicates)
6. `backfill_field_mapping.json` (sample records showing how 13 fields will be stamped)

**Phase 3: Validation queries (post-dry-run)**

- Count of records by channel_type (matches existing classification)
- All records have distribution_channel_context_id (after creation in Phase 1)
- No cross-tenant stamps
- No updated_at changed
- All broker_agency_id values reference valid brokers
- All master_general_agent_id values reference valid MGAs
- Audit events created for every stamp operation

**Phase 4: Operator review gate**

- Operator reviews 6 reports
- If OK → approve for production execution
- If issues → request dry-run adjustments, re-run

**Phase 5: Production execution (separate authorization)**

- Blocked until operator explicitly approves execution
- Run in controlled batch with rollback plan

---

## SECTION 7: COMPLETE FEATURE FLAGS & FAIL-CLOSED BEHAVIOR

### Feature Flag Registry

**File:** `lib/featureFlags.ts`

```typescript
export const featureFlags = {
  // Core Gate 7A-0 features
  FIRST_CLASS_BROKER_MODEL_ENABLED: false,
  DISTRIBUTION_CHANNEL_CONTEXT_ENABLED: false,
  BROKER_PLATFORM_RELATIONSHIP_ENABLED: false,
  BROKER_MGA_RELATIONSHIP_ENABLED: false,
  BROKER_SCOPE_ACCESS_GRANT_ENABLED: false,

  // Downstream features (depend on above)
  BROKER_WORKSPACE_ENABLED: false,        // Requires FIRST_CLASS_BROKER_MODEL_ENABLED
  QUOTE_CHANNEL_WRAPPER_ENABLED: false,   // Requires DISTRIBUTION_CHANNEL_CONTEXT_ENABLED
  BENEFITS_ADMIN_CHANNEL_BRIDGE_ENABLED: false, // Requires DISTRIBUTION_CHANNEL_CONTEXT_ENABLED
  BENEFITS_ADMIN_CASE_SHELL_ENABLED: false,  // Requires BENEFITS_ADMIN_CHANNEL_BRIDGE_ENABLED

  // Phase 1/2 feature (reference, no changes)
  BROKER_SIGNUP_ENABLED: false,           // Phase 1 already active (Phase 1 certified)
  BROKER_ONBOARDING_ENABLED: false,       // Phase 2 (deferred)
};
```

### Fail-Closed Behavior

**When FIRST_CLASS_BROKER_MODEL_ENABLED = false (default):**

1. All broker_agency.* permissions → DENIED (403)
2. All broker_direct.* permissions → DENIED (403)
3. All broker_mga.* permissions → DENIED (403)
4. All scope resolver methods → return legacy behavior (no broker/channel scoping)
5. All new routes (/broker/*, /channel/*, etc.) → return 404
6. BrokerPlatformRelationship creation → DENIED or queued
7. BrokerMGARelationship creation → DENIED or queued
8. DistributionChannelContext stamping → skipped (records created without stamps)

**When DISTRIBUTION_CHANNEL_CONTEXT_ENABLED = false:**

1. scope resolver ignores channel visibility rules
2. visibility_scope field ignored in access checks
3. QUOTE_CHANNEL_WRAPPER_ENABLED feature stays inactive (cascading)
4. BENEFITS_ADMIN_CHANNEL_BRIDGE_ENABLED feature stays inactive (cascading)

**When BROKER_WORKSPACE_ENABLED = false:**

1. No /broker/workspace routes exposed
2. No /broker/settings routes exposed
3. No /broker/users routes exposed
4. Broker users see 404 on workspace access attempts

**Dependency chain enforcement at startup:**

```
if (FIRST_CLASS_BROKER_MODEL_ENABLED) {
  if (!BROKER_PLATFORM_RELATIONSHIP_ENABLED) {
    logger.error("BROKER_PLATFORM_RELATIONSHIP_ENABLED required but false");
    FIRST_CLASS_BROKER_MODEL_ENABLED = false; // Force cascade failure
  }
}

if (QUOTE_CHANNEL_WRAPPER_ENABLED && !DISTRIBUTION_CHANNEL_CONTEXT_ENABLED) {
  logger.error("DISTRIBUTION_CHANNEL_CONTEXT_ENABLED required but false");
  QUOTE_CHANNEL_WRAPPER_ENABLED = false; // Cascade off
}
```

---

## SECTION 8: COMPLETE ACCEPTANCE TEST PLAN (30 Tests)

### Test Suite 1: Entity Creation Tests (5 tests)

**Test 1.1:** BrokerAgencyProfile created with master_general_agent_id = null
```
Input: brokerSignup({legal_name, email, ..., master_general_agent_id: null})
Expected: BrokerAgencyProfile.id created, master_general_agent_id = null
Result: PASS/FAIL
```

**Test 1.2:** Standalone broker DistributionChannelContext created
```
Input: brokerAgency.createChannel(tenant_id, "standalone_broker", "broker", broker_id)
Expected: DistributionChannelContext.id created, channel_type="standalone_broker"
Result: PASS/FAIL
```

**Test 1.3:** MGA-affiliated broker DistributionChannelContext created
```
Input: brokerAgency.createChannel(tenant_id, "mga_affiliated_broker", "broker", broker_id, mga_id)
Expected: DistributionChannelContext.id created, channel_type="mga_affiliated_broker"
Result: PASS/FAIL
```

**Test 1.4:** MGA direct DistributionChannelContext created
```
Input: mgaService.createChannel(tenant_id, "mga_direct", "mga", mga_id)
Expected: DistributionChannelContext.id created, channel_type="mga_direct"
Result: PASS/FAIL
```

**Test 1.5:** Platform direct DistributionChannelContext created
```
Input: platformService.createChannel(tenant_id, "platform_direct", "platform", null)
Expected: DistributionChannelContext.id created, channel_type="platform_direct"
Result: PASS/FAIL
```

---

### Test Suite 2: Broker Scope Tests (6 tests)

**Test 2.1:** Standalone broker can see own direct book
```
Setup: Create standalone broker + DistributionChannelContext + BenefitCase stamped with broker's channel
User: broker_owner role
Action: assertRecordVisibleToActor(broker_owner_user_id, benefit_case_id, "BenefitCase")
Expected: No error (access allowed)
Result: PASS/FAIL
```

**Test 2.2:** Standalone broker cannot see another broker's book
```
Setup: Create 2 standalone brokers + separate BenefitCases
User: broker_owner from broker_1
Action: assertRecordVisibleToActor(broker1_user_id, broker2_case_id, "BenefitCase")
Expected: ScopeError('cross-broker-access') → masked 404 to client
Result: PASS/FAIL
```

**Test 2.3:** MGA cannot see standalone broker direct records
```
Setup: Standalone broker case (no BrokerMGARelationship)
User: mga_admin from different MGA
Action: assertRecordVisibleToActor(mga_admin_user_id, broker_case_id, "BenefitCase")
Expected: ScopeError('cross-broker-access') → masked 404 to client
Result: PASS/FAIL
```

**Test 2.4:** MGA can see MGA direct records
```
Setup: MGA direct case stamped with MGA's DistributionChannelContext
User: mga_admin from same MGA
Action: assertRecordVisibleToActor(mga_admin_user_id, mga_case_id, "BenefitCase")
Expected: No error (access allowed)
Result: PASS/FAIL
```

**Test 2.5:** MGA can see broker records tied to active BrokerMGARelationship
```
Setup: Broker case + active BrokerMGARelationship + DistributionChannelContext type="mga_affiliated_broker"
User: mga_admin
Action: assertRecordVisibleToActor(mga_admin_user_id, affiliated_broker_case_id, "BenefitCase")
Expected: No error (access allowed via relationship)
Result: PASS/FAIL
```

**Test 2.6:** MGA cannot see broker records not tied to active relationship
```
Setup: Broker case + NO BrokerMGARelationship
User: mga_admin from different MGA
Action: assertRecordVisibleToActor(mga_admin_user_id, broker_case_id, "BenefitCase")
Expected: ScopeError('cross-broker-access') → masked 404 to client
Result: PASS/FAIL
```

---

### Test Suite 3: Hybrid Broker Tests (2 tests)

**Test 3.1:** Hybrid broker direct records remain distinguishable from MGA-affiliated records
```
Setup: Broker with 2 DistributionChannelContexts:
       - channel_1: type="hybrid_broker_direct", owner_org_id=broker_id
       - channel_2: type="hybrid_broker_mga", owner_org_id=broker_id, supervising_org_id=mga_id
       - case_1 stamped with channel_1
       - case_2 stamped with channel_2
User: mga_admin (supervising)
Action: assertRecordVisibleToActor(mga_admin_user_id, case_1_id, "BenefitCase")
Expected: ScopeError (case_1 is broker-direct, not MGA-affiliated)
Result: PASS/FAIL
```

**Test 3.2:** Hybrid broker can see both direct and MGA-affiliated records
```
Setup: Same as 3.1
User: broker_owner (hybrid broker)
Action: 
  - assertRecordVisibleToActor(broker_owner_user_id, case_1_id)
  - assertRecordVisibleToActor(broker_owner_user_id, case_2_id)
Expected: Both succeed (access allowed)
Result: PASS/FAIL
```

---

### Test Suite 4: Permission Tests (5 tests)

**Test 4.1:** Platform admin without permission receives 403
```
Setup: platform_admin role without broker_direct.case.create permission
User: platform_admin
Action: assertRecordActionPermitted(admin_user_id, "BenefitCase", "create")
Expected: PermissionError(403) — permission denied, not scope error
Result: PASS/FAIL
```

**Test 4.2:** Broker producer cannot manage users (broker_agency.manage_users denied)
```
Setup: broker_producer role
User: broker_producer
Action: requirePermission(producer_user_id, "broker_agency.manage_users")
Expected: PermissionError(403)
Result: PASS/FAIL
```

**Test 4.3:** Broker owner has all broker_direct.* permissions
```
Setup: broker_owner role
User: broker_owner
Action: 
  - hasPermission(owner_user_id, "broker_direct.case.create") → true
  - hasPermission(owner_user_id, "broker_direct.quote.create") → true
  - hasPermission(owner_user_id, "broker_direct.enrollment.manage") → true
Expected: All true
Result: PASS/FAIL
```

**Test 4.4:** Broker readonly has only view permissions
```
Setup: broker_readonly role
User: broker_readonly
Action:
  - hasPermission(readonly_user_id, "broker_direct.case.create") → false
  - hasPermission(readonly_user_id, "broker_direct.case.read") → true
Expected: Matches expected permissions
Result: PASS/FAIL
```

**Test 4.5:** Permissions gated by feature flags (FIRST_CLASS_BROKER_MODEL_ENABLED=false)
```
Setup: FIRST_CLASS_BROKER_MODEL_ENABLED = false
User: broker_owner
Action: requirePermission(owner_user_id, "broker_direct.case.create")
Expected: PermissionError(403) — feature disabled
Result: PASS/FAIL
```

---

### Test Suite 5: BrokerScopeAccessGrant Tests (3 tests)

**Test 5.1:** BrokerScopeAccessGrant allows temporary access
```
Setup: 
  - broker_1 + broker_2
  - BrokerScopeAccessGrant(grantee=broker_1, target_entity=broker_2_case, expires_at=future)
User: broker_owner from broker_1
Action: assertRecordVisibleToActor(broker1_owner_id, broker2_case_id)
Expected: No error (access allowed via grant)
Result: PASS/FAIL
```

**Test 5.2:** Expired BrokerScopeAccessGrant denies access
```
Setup: Same as 5.1, but expires_at = past date
User: broker_owner from broker_1
Action: assertRecordVisibleToActor(broker1_owner_id, broker2_case_id)
Expected: ScopeError('expired-grant') → masked 404
Result: PASS/FAIL
```

**Test 5.3:** Revoked BrokerScopeAccessGrant denies access
```
Setup: BrokerScopeAccessGrant, then revoked
User: broker_owner from grantee broker
Action: assertRecordVisibleToActor(grantee_owner_id, target_case_id)
Expected: ScopeError('grant-revoked') → masked 404
Result: PASS/FAIL
```

---

### Test Suite 6: Audit Tests (3 tests)

**Test 6.1:** All scope/permission checks create audit events
```
Setup: Enable audit logging
User: broker_owner (attempting cross-broker access)
Action: assertRecordVisibleToActor(broker_owner_id, other_broker_case_id)
Expected: 
  - AuditEvent.SCOPE_RESOLVED created
  - AuditEvent.result = denied
  - AuditEvent.reason = 'cross-broker-access'
Result: PASS/FAIL
```

**Test 6.2:** Audit events are immutable
```
Setup: Create AuditEvent
User: admin
Action: Try to UPDATE or DELETE AuditEvent
Expected: No update/delete path exists (403 or endpoint not found)
Result: PASS/FAIL
```

**Test 6.3:** All material actions include audit_trace_id propagation
```
Setup: Create BenefitCase with audit_trace_id
User: broker_owner
Action: 
  1. Create case
  2. Verify case.audit_trace_id == request.audit_trace_id
  3. Verify all related AuditEvents have same audit_trace_id
Expected: Full lineage preserved (request → case → events)
Result: PASS/FAIL
```

---

### Test Suite 7: Backfill & Migration Tests (2 tests)

**Test 7.1:** Dry-run backfill validates existing records without modification
```
Setup: 100 existing records (mix of broker/mga/platform direct)
Action: dryRunBackfill()
Expected:
  - 6 reports generated (§6.2)
  - No records modified
  - No updated_at changed
  - Categorization counts correct
  - Operator can review reports
Result: PASS/FAIL
```

**Test 7.2:** Backfill dry-run creates idempotent results
```
Setup: Run dryRunBackfill() twice
Action: Compare reports from run 1 and run 2
Expected: Identical output (categorizations, counts, field mappings)
Result: PASS/FAIL
```

---

### Test Suite 8: Regression Tests (4 tests)

**Test 8.1:** Gate 6K MGA analytics unaffected
```
Setup: Gate 6K enabled, accessing MGA analytics
User: mga_admin
Action: Retrieve gate6k.getAnalyticsReport(mga_id)
Expected: Report returns without error (legacy behavior preserved)
Result: PASS/FAIL
```

**Test 8.2:** Gate 6L-A broker contacts unaffected
```
Setup: Gate 6L-A enabled, accessing broker agency contacts
User: broker_owner
Action: Retrieve gate6la.getBrokerContacts(broker_id)
Expected: Contacts return without error (legacy behavior preserved)
Result: PASS/FAIL
```

**Test 8.3:** Deferred Gates 6I-B, 6J-B, 6J-C, 6L-B remain untouched
```
Setup: Verify feature flags for deferred gates
Action: Check each flag status
Expected: All false, no code changes, no routes exposed
Result: PASS/FAIL
```

**Test 8.4:** Phase 1 broker signup workflow unaffected
```
Setup: Phase 1 broker signup enabled
User: new broker signup
Action: Complete broker signup flow
Expected: Broker created with Phase 1 approval workflow (unchanged)
Result: PASS/FAIL
```

---

## SECTION 9: COMPLETE NO-UI-ACTIVATION REQUIREMENT

### UI Activation Explicit Statement

**Gate 7A-0 implementation MUST ensure:**

1. **No broker signup route visible** — /broker-signup remains hidden (Phase 1 already active behind flag, separate)
2. **No broker workspace visible** — /broker/workspace, /broker/settings, /broker/users NOT exposed
3. **No channel-aware quote wrapper exposed** — Quote Connect 360 quote flow unchanged
4. **No Benefits Admin setup action visible** — Benefits Admin channel bridge NOT exposed
5. **No Quote Connect 360 behavior changed** — Legacy quote logic preserved
6. **No Benefits Admin bridge behavior changed** — Legacy admin flow preserved

### Activation Gating

All UI activation gated by feature flags:

```
if (BROKER_WORKSPACE_ENABLED) {
  <Route path="/broker/workspace" element={<BrokerWorkspace />} />
} else {
  // Route does not exist; /broker/workspace returns 404
}
```

**All flags default false; all routes hidden.**

---

## SECTION 10: COMPLETE REGISTRY STATUS

### Registry Update (No Completion Marking)

**File:** `docs/GATE_STATUS_LEDGER.json`

**Update entry for Gate 7A-0:**

```json
{
  "gate": "7A-0",
  "name": "First-Class Broker Core Model",
  "status": "IMPLEMENTATION_READY",
  "workOrderStatus": "AMENDED_AND_APPROVED",
  "runtimeStatus": "INACTIVE",
  "implementationStatus": "WORK_ORDER_APPROVED",
  "estimatedEffort": "150 hours (2 FTE, 5-6 weeks)",
  "dependencies": [
    "Gate 7A-P (design freeze approved)",
    "Phase 1 (certified with 14/14 PASS)",
    "Gate 6K (must not regress)",
    "Gate 6L-A (must not regress)"
  ],
  "deferredGates": ["6I-B", "6J-B", "6J-C", "6L-B"],
  "featureFlags": {
    "FIRST_CLASS_BROKER_MODEL_ENABLED": false,
    "DISTRIBUTION_CHANNEL_CONTEXT_ENABLED": false,
    "BROKER_PLATFORM_RELATIONSHIP_ENABLED": false,
    "BROKER_MGA_RELATIONSHIP_ENABLED": false,
    "BROKER_SCOPE_ACCESS_GRANT_ENABLED": false,
    "BROKER_WORKSPACE_ENABLED": false,
    "QUOTE_CHANNEL_WRAPPER_ENABLED": false,
    "BENEFITS_ADMIN_CHANNEL_BRIDGE_ENABLED": false
  },
  "artifacts": {
    "entities_new": ["DistributionChannelContext", "BrokerPlatformRelationship", "BrokerMGARelationship", "BrokerScopeAccessGrant", "BrokerAgencyUser"],
    "entities_modified": ["BrokerAgencyProfile", "EmployerGroup", "BenefitCase", "CensusVersion", "QuoteScenario", "Proposal", "EmployeeEnrollment", "EnrollmentWindow", "Task", "RenewalCycle", "Document", "AuditEvent"],
    "contracts": 6,
    "contract_methods": 46,
    "permission_namespaces": 6,
    "permissions": 60,
    "test_suites": 8,
    "acceptance_tests": 30
  }
}
```

**Note:** Gate 7A-0 status does NOT move to "COMPLETE" or "VALIDATED" until implementation and closeout report approved.

---

## SECTION 11: CLOSEOUT REPORT REQUIREMENT

### Mandatory Deliverable

**File:** `docs/GATE_7A_0_FIRST_CLASS_BROKER_CORE_MODEL_CLOSEOUT_REPORT.md`

**Must be created AFTER implementation completion. Sections required:**

1. **Implementation Summary**
   - Start date, end date, actual effort
   - Files created (with line counts)
   - Files modified (with change summaries)
   - Entities created/modified (with field counts)

2. **Contract Summary**
   - 6 contract groups listed
   - 46 methods created/modified
   - Method signatures documented

3. **Scope Resolver Summary**
   - 7 resolver methods
   - Scope enforcement rules validated
   - Masked 404 behavior confirmed

4. **Permission Model Summary**
   - 6 permission namespaces
   - 60+ permissions
   - Feature flag gating confirmed

5. **Feature Flags Deployed**
   - All 8 flags set to false
   - Fail-closed behavior confirmed
   - Dependency chain enforced

6. **Migration/Backfill Results**
   - Dry-run reports reviewed
   - Production execution approved (if executed)
   - Data validation queries passed

7. **Test Results**
   - 30 acceptance tests: X PASS, Y FAIL
   - 5 regression tests: all PASS
   - Performance benchmarks met

8. **Audit Event Summary**
   - Immutability enforced (no update/delete paths)
   - All material actions logged
   - Audit_trace_id propagation confirmed

9. **Registry Status**
   - Gate 7A-0 status updated
   - Evidence artifacts recorded
   - Deferred gates status confirmed

10. **Known Risks**
    - List any identified risks
    - Mitigation plans documented

11. **Advisory Notes**
    - Operator decisions recorded
    - Feature flag status at deployment
    - Rollback readiness confirmed

12. **Rollback Readiness**
    - Feature flag disablement tested
    - Data preservation validated
    - No destructive rollback performed

---

## SECTION 12: HARD STOP CONDITION

### CRITICAL BLOCKING LANGUAGE

**This work order is PLANNING AND SPECIFICATION ONLY.**

**NO IMPLEMENTATION WITHOUT OPERATOR APPROVAL.**

### Authorization Blocks

- [ ] Gate 7A-P design freeze approved → APPROVED (2026-05-13)
- [ ] Gate 7A-0 amended work order approved → PENDING (THIS DECISION)
- [ ] Runtime implementation authorized → BLOCKED
- [ ] Schema modifications authorized → BLOCKED
- [ ] Entity creation authorized → BLOCKED
- [ ] Contract implementation authorized → BLOCKED
- [ ] Feature flag deployment authorized → BLOCKED
- [ ] Backfill execution authorized → BLOCKED
- [ ] Test execution authorized → BLOCKED

### Hard Stop Actions

**Do not proceed without explicit operator implementation approval:**

1. Do NOT create `src/entities/DistributionChannelContext.json`
2. Do NOT create `src/entities/BrokerPlatformRelationship.json`
3. Do NOT create `src/entities/BrokerMGARelationship.json`
4. Do NOT create `src/entities/BrokerScopeAccessGrant.json`
5. Do NOT create `src/entities/BrokerAgencyUser.json`
6. Do NOT modify BrokerAgencyProfile.json
7. Do NOT create any service contracts (6 contract files)
8. Do NOT create feature flag registry
9. Do NOT create migration/backfill utilities
10. Do NOT create any test suites
11. Do NOT expose any new routes
12. Do NOT modify Quote Connect 360 behavior
13. Do NOT modify Benefits Admin bridge behavior
14. Do NOT touch deferred Gates 6I-B, 6J-B, 6J-C, 6L-B
15. Do NOT regress Gate 6K or Gate 6L-A

---

## FINAL OPERATOR DECISION BLOCK

**Amended Gate 7A-0 work order is COMPLETE.**

**Choose one:**

- [ ] **APPROVE WORK ORDER** — Authorize implementation immediately

- [ ] **REQUEST FURTHER AMENDMENTS** — Specify amendments, return for revision

- [ ] **HOLD IMPLEMENTATION** — Pause pending further review

---

**Work Order Status:** AMENDED_AND_READY_FOR_APPROVAL  
**Date Completed:** 2026-05-13  
**Awaiting:** Operator implementation approval decision  

**Next Step:** Operator approves/amends/holds; Base44 proceeds (or stops) accordingly.