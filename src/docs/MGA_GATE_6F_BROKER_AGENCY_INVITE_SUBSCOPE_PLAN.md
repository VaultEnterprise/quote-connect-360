# Gate 6F — Broker / Agency User Invite Sub-Scope Assignment
## Implementation Plan

**Document Type:** Gate Implementation Plan  
**Gate ID:** GATE-6F  
**Classification:** Internal — Platform Engineering / Program Management  
**Date:** 2026-05-12  
**Prepared By:** Platform Engineering — MGA Program Management  
**Phase:** Post-Phase-5 Controlled Activation  
**Registry:** `docs/QUOTE_CONNECT_360_GATE_REGISTRY.json`  
**Ledger:** `docs/MGA_GATE_STATUS_LEDGER.md`

---

## 1 — Objective

Gate 6F closes the known Gap in Gate 6A: invited users can now be assigned to a specific **Broker / Agency** organization at invite time.

Before Gate 6F, all invited users were scoped only at the MGA level. Sub-organization (Broker / Agency) scope assignment was not captured during invite.

After Gate 6F, authorized MGA admins may select a Broker / Agency (internally: `MasterGroup` / `master_group_id`) when inviting a user, persisting the sub-scope on the created `MasterGeneralAgentUser` record.

---

## 2 — Capability

| Field | Value |
|-------|-------|
| **Gate ID** | GATE-6F |
| **User-Facing Capability** | Broker / Agency sub-scope assignment during MGA user invite |
| **Internal Entity** | `MasterGroup` (preserved — not renamed) |
| **Internal Field** | `master_group_id` (preserved — not renamed) |
| **Existing Invite Service** | `userAdminService.inviteMGAUser` (extended — not replaced) |
| **Authorized Actors** | `mga_admin`, `platform_super_admin` |
| **Activation Type** | Controlled — UI and service layer update; no feature flag required |

---

## 3 — Scope Rules

| Invited Role | Broker / Agency Required? | Rationale |
|-------------|--------------------------|-----------|
| `mga_admin` | Optional | MGA-wide administrative role; sub-scope optional |
| `mga_manager` | **Required** | Operational role; must be scoped to a specific Broker / Agency |
| `mga_user` | **Required** | Standard user role; must be scoped to a specific Broker / Agency |
| `mga_read_only` | **Required** | Read-only role; must be scoped to a specific Broker / Agency |

---

## 4 — Files Changed

| File | Change Type | Change Description |
|------|------------|-------------------|
| `components/mga/MGAInviteUserModal` | **MODIFIED** | Added Broker / Agency selector; sub-scope validation; role-based required/optional logic; confirmation message |
| `lib/mga/services/userAdminService.js` | **MODIFIED** | `inviteMGAUser`: added `master_group_id` cross-MGA validation; persistence of sub-scope on created record; audit detail updated |
| `lib/mga/permissionResolver.js` | **MODIFIED** | Added `invite_sub_scope` action to `users` domain — `ALLOW` for `mga_admin` and `platform_super_admin` only |
| `tests/mga/gate6f-broker-agency-invite-subscope.test.js` | **CREATED** | 19-test suite covering all Gate 6F validation requirements |
| `docs/MGA_GATE_6F_BROKER_AGENCY_INVITE_SUBSCOPE_PLAN.md` | **CREATED** | This document |
| `docs/MGA_GATE_6F_BROKER_AGENCY_INVITE_SUBSCOPE_CLOSEOUT_REPORT.md` | **CREATED** | Gate 6F closeout report |
| `docs/QUOTE_CONNECT_360_GATE_REGISTRY.json` | **UPDATED** | Gate 6F entry added |
| `docs/MGA_GATE_STATUS_LEDGER.md` | **UPDATED** | Gate 6F section added |

---

## 5 — Security Model

### 5.1 — Cross-MGA Assignment Prevention

The `inviteMGAUser` service validates the supplied `master_group_id` by querying:

```js
MasterGroup.filter({ id: masterGroupId, master_general_agent_id: decision.effective_mga_id })
```

`decision.effective_mga_id` is **server-resolved** via `scopeGate` — it cannot be spoofed by the actor. If the `MasterGroup` record does not exist under the same MGA, the service returns `CROSS_MGA_SCOPE_VIOLATION` and creates no record.

### 5.2 — Cross-Tenant Prevention

`effective_mga_id` is always resolved from the actor's authenticated token scope, never from the request payload. Cross-tenant assignment is architecturally impossible given this constraint.

### 5.3 — RBAC Gate

The new `invite_sub_scope` action in `permissionResolver.users` is `ALLOW` for `mga_admin` and `platform_super_admin` only. All other roles are `DENY`.

The UI visibility gate in `MGAUsersPanel` already restricts the invite button to `mga_admin` — this remains unchanged.

### 5.4 — scopeGate

No changes to `scopeGate.js`. The existing `users.create` scope check remains in place and is sufficient.

### 5.5 — Fail-Closed Behavior Preserved

If `master_group_id` validation fails for any reason, `CROSS_MGA_SCOPE_VIOLATION` is returned and no record is created. The service does not fall back to MGA-wide scope silently.

---

## 6 — Internal Compatibility

| Item | Status |
|------|--------|
| `MasterGroup` entity name | **PRESERVED — not renamed** |
| `master_group_id` field | **PRESERVED — not renamed** |
| `masterGroupService` | **PRESERVED — not renamed** |
| `MGAMasterGroupPanel` | **PRESERVED — not renamed** |
| `scopeGate` domain keys | **NOT MODIFIED** |
| `permissionResolver` existing matrix | **NOT BROADENED** — only `invite_sub_scope` action added |
| Gate 6A existing invite path | **FULLY PRESERVED** — `master_group_id` is optional in payload; service handles absent value gracefully |

---

## 7 — Rollback Plan

Gate 6F has no feature flag (low risk; UI + service change only). To rollback:

1. In `MGAInviteUserModal`: remove the Broker / Agency selector block and `masterGroupId` state; restore original `handleSubmit` payload (email + role only)
2. In `userAdminService.js`: remove the `master_group_id` validation block and sub-scope persistence from `inviteMGAUser`
3. In `permissionResolver.js`: remove the `invite_sub_scope` line from `users` domain
4. Deploy

Rollback impact: invited users after rollback will no longer have `master_group_id` set. Previously invited users retain their `master_group_id` value (no data loss; field simply stops being populated going forward).

---

## 8 — Validation Requirements

19 tests defined in `tests/mga/gate6f-broker-agency-invite-subscope.test.js`:

| # | Test | Status |
|---|------|--------|
| 6F-01 | Authorized mga_admin can invite a user | ✅ PASS |
| 6F-02 | Selector shows only MGA-scoped Broker / Agencies | ✅ PASS |
| 6F-03 | Selected Broker / Agency maps to master_group_id | ✅ PASS |
| 6F-04 | Invited user associated with correct MGA | ✅ PASS |
| 6F-05 | Invited user associated with correct Broker / Agency sub-scope | ✅ PASS |
| 6F-06 | Cross-MGA assignment blocked | ✅ PASS |
| 6F-07 | Cross-tenant assignment blocked | ✅ PASS |
| 6F-08 | Missing Broker / Agency blocked for mga_user | ✅ PASS |
| 6F-09 | Missing Broker / Agency blocked for mga_manager | ✅ PASS |
| 6F-10 | Missing Broker / Agency blocked for mga_read_only | ✅ PASS |
| 6F-11 | mga_admin invite works without Broker / Agency | ✅ PASS |
| 6F-12 | mga_admin invite works with optional Broker / Agency | ✅ PASS |
| 6F-13 | Duplicate invite is idempotency-protected | ✅ PASS |
| 6F-14 | Audit includes Broker / Agency binding when set | ✅ PASS |
| 6F-15 | Audit records MGA-wide scope when none selected | ✅ PASS |
| 6F-16 | Gate 6A regression — existing invite unaffected | ✅ PASS |
| 6F-17 | Gate 6B regression — TXQuote unaffected | ✅ PASS |
| 6F-18 | Gate 6D remains inactive | ✅ PASS |
| 6F-19 | Gate 6E Broker / Agency creation unaffected | ✅ PASS |

**Total: 19 / 19 PASS**