# Phase 7A-0.5 Method Mapping Clarification

**Date:** 2026-05-13  
**Phase:** 7A-0.5 — Scope Resolver Implementation  
**Status:** Clarification Document for Operator Approval  

---

## Approved vs Implemented Method Mapping

### Approved Method Names (Operator Specification)

1. `resolveActorTenantScope` — Resolve user's tenant scope
2. `resolveActorBrokerScope` — Resolve user's broker agency scope
3. `resolveActorMGAScope` — Resolve user's MGA scope
4. `resolveDistributionChannelScope` — Resolve user's accessible channels
5. `assertRecordVisibleToActor` — Enforce record visibility
6. `assertRecordActionPermitted` — Enforce permission within scope
7. `maskScopeFailure` — Return masked 404

### Implemented Method Names (Phase 7A-0.5 Actual)

1. `resolveScopeProfile` — Centralized scope resolution
2. `assertRecordVisible` — Record visibility enforcement
3. `assertRecordActionPermitted` — Permission enforcement
4. `determineRecordChannel` — Channel type classification
5. `isBrokerMGARelationshipActive` — Relationship status check
6. `maskScopeFailure` — Masked 404 response
7. `filterSafePayload` — Safe payload filtering

---

## Clarifications Confirmed ✅

### 1. `resolveScopeProfile` Covers All Scope Resolution

✅ **CONFIRMED**

`resolveScopeProfile` internally resolves:
- **Tenant Scope:** `profile.tenant_id` (mandatory, from user session)
- **Broker Scope:** `profile.broker_agency_id` (from BrokerAgencyUser lookup)
- **MGA Scope:** `profile.mga_id` (from MGA user mapping)
- **Distribution Channel Scope:** `profile.channel_ids` (from DistributionChannelContext filter)
- **Permission Level:** `profile.permission_level` (derived from user role)
- **Accessible Grants:** `profile.accessible_grants` (from BrokerScopeAccessGrant filter)

**Mapping:**
```javascript
// Approved: resolveActorTenantScope
// Implemented as: resolveScopeProfile.tenant_id

// Approved: resolveActorBrokerScope
// Implemented as: resolveScopeProfile.broker_agency_id

// Approved: resolveActorMGAScope
// Implemented as: resolveScopeProfile.mga_id

// Approved: resolveDistributionChannelScope
// Implemented as: resolveScopeProfile.channel_ids
```

---

### 2. `assertRecordVisible` is Equivalent to `assertRecordVisibleToActor`

✅ **CONFIRMED**

`assertRecordVisible` implements the complete visibility logic:
- Enforces tenant scope (mandatory check)
- Enforces broker scope (standalone_broker, hybrid channels)
- Enforces MGA scope (mga_direct, mga_affiliated_broker)
- Enforces channel scope (7 channel types)
- Enforces relationship gates (active BrokerMGARelationship required)
- Enforces explicit grants (BrokerScopeAccessGrant with expiration)
- Returns masked 404 on scope failure

**Mapping:**
```javascript
// Approved: assertRecordVisibleToActor
// Implemented as: assertRecordVisible(record, scopeProfile)
```

---

### 3. `determineRecordChannel` Enforces All Channel Invariants

✅ **CONFIRMED**

`determineRecordChannel` classifies records into 7 channel types:
1. ✅ `platform_direct` — Platform-owned (no broker/MGA)
2. ✅ `standalone_broker` — Broker direct (no MGA)
3. ✅ `mga_direct` — MGA-owned (no broker)
4. ✅ `mga_affiliated_broker` — Broker + MGA with active relationship
5. ✅ `hybrid_broker_direct` — Broker direct book (not shared with MGA)
6. ✅ `hybrid_broker_mga` — Broker + MGA shared records
7. ✅ `employer_direct` — Employer-owned

**Enforcement Logic:**
- Channel classification determines visibility rules
- Used by `assertRecordVisible` to enforce scoping
- Each channel type enforces specific invariants (broker/MGA/grant separation)

---

### 4. `filterSafePayload` is Safe-Payload Enforcement Only

✅ **CONFIRMED**

`filterSafePayload` removes sensitive fields from responses:
- Removes: `created_by_user_id`, `created_by_role`, `audit_trace_id`, `visibility_scope`
- Does NOT replace permission or scope validation
- Applied AFTER scope and permission checks pass
- Ensures no metadata leakage in API responses

**Does NOT:**
- Validate scope (done by `assertRecordVisible`)
- Validate permissions (done by `assertRecordActionPermitted`)
- Check feature flags (done by contracts)
- Check relationships (done by `isBrokerMGARelationshipActive`)

---

### 5. No Approved Resolver Behavior Was Omitted

✅ **CONFIRMED**

All approved behaviors are implemented:

| Approved Behavior | Implemented By | Status |
|---|---|---|
| Resolve tenant scope | `resolveScopeProfile.tenant_id` | ✅ |
| Resolve broker scope | `resolveScopeProfile.broker_agency_id` | ✅ |
| Resolve MGA scope | `resolveScopeProfile.mga_id` | ✅ |
| Resolve channel scope | `resolveScopeProfile.channel_ids` | ✅ |
| Assert record visible | `assertRecordVisible` | ✅ |
| Assert record action | `assertRecordActionPermitted` | ✅ |
| Mask scope failure | `maskScopeFailure` | ✅ |
| Check relationships | `isBrokerMGARelationshipActive` | ✅ |
| Check grant expiration | `isGrantExpired` | ✅ |
| Filter safe payload | `filterSafePayload` | ✅ |
| Derive permission level | `derivePermissionLevel` | ✅ |
| Classify channel type | `determineRecordChannel` | ✅ |

---

## Summary

**Phase 7A-0.5 Scope Resolver Method Mapping: CONFIRMED AND DOCUMENTED**

**Approved vs Implemented:**
- 4 single-scope resolution methods → 1 centralized `resolveScopeProfile` with 4 scope attributes
- 1 visibility assertion → `assertRecordVisible` (complete implementation with channel invariants)
- 1 permission assertion → `assertRecordActionPermitted` (complete implementation)
- 1 masking function → `maskScopeFailure` (unchanged)
- 2 helper methods → `isBrokerMGARelationshipActive`, `isGrantExpired` (support visible/permission logic)
- 1 payload filter → `filterSafePayload` (post-validation cleanup)
- 1 permission helper → `derivePermissionLevel` (supports permission resolver in Phase 7A-0.6)
- 1 channel classifier → `determineRecordChannel` (enforces channel invariants)

**All approved resolver behavior implemented. No omissions.**

**Status: READY FOR PHASE 7A-0.6 IMPLEMENTATION**