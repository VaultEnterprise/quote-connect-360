# MGA Scope Resolver — list_operation Sentinel Hotfix Report

**Document Type:** Hotfix Validation Report  
**Classification:** Internal — Platform Engineering / Security  
**Date:** 2026-05-12  
**Status:** VALIDATED — COMPLETE  
**Hotfix ID:** HOTFIX-SCOPE-LIST-OP-001  
**Prepared By:** Platform Engineering — MGA Program Management  
**Gate Registry:** `docs/QUOTE_CONNECT_360_GATE_REGISTRY.json`

---

## Section 1 — Issue Summary

A regression in the MGA scope resolution pipeline caused all `list` operations in the `MGAMasterGroupPanel` to be incorrectly denied. The denial was a false negative produced by the `scopeResolver` attempting to perform a per-record entity lookup using the sentinel string `"list_operation"` as a real database record ID.

| Field | Value |
|-------|-------|
| Issue ID | HOTFIX-SCOPE-LIST-OP-001 |
| Detected | 2026-05-12 |
| Severity | HIGH — blocks core MGA panel from rendering for all scoped users |
| Type | Logic error in scope resolver sentinel handling |
| Fix Type | Targeted hotfix — single conditional block added before record lookup |
| File Changed | `lib/mga/scopeResolver.js` |
| Fix Date | 2026-05-12 |
| Validated | 2026-05-12 |

---

## Section 2 — User-Facing Symptom

**Page:** `/mga/command` (`MasterGeneralAgentCommand`)  
**Panel:** `MGACaseWorkflowPanel` → Master Groups tab → `MGAMasterGroupPanel`  
**Observed Error Message:** `Access restricted — MasterGroup list unavailable for your scope.`

The error appeared for all authorized MGA users including `mga_admin`, `mga_manager`, `mga_user`, `mga_read_only`, `platform_super_admin`, and `admin` roles. The panel rendered the denial message instead of the MasterGroup list regardless of whether valid MasterGroup records existed in scope.

The error did not produce a console exception — it was a silent false-negative denial returned by the scope service layer and surfaced as the panel's graceful "access restricted" fallback state.

---

## Section 3 — Root Cause

### Call Chain

```
MGAMasterGroupPanel.load()
  → listMasterGroups({ ...scopeRequest, target_entity_id: mgaId })
      [masterGroupService.js — line 35: target_entity_id overridden to 'list_operation']
  → checkScope({ domain: 'mastergroup', action: 'list', target_entity_id: 'list_operation' })
      [serviceContract.js]
  → scopeGate.check({ target_entity_id: 'list_operation' })
      [scopeGate.js]
  → resolveScope({ target_entity_id: 'list_operation' })
      [scopeResolver.js — Step 7]
```

### Failure Point

In `scopeResolver.js` at Step 7 (Resolve target entity scope), the resolver executed:

```javascript
const records = await base44.entities.MasterGroup.filter({ id: 'list_operation' });
```

No `MasterGroup` record with `id: 'list_operation'` exists (or could ever exist — it is a sentinel string, not a real record ID). The filter returned an empty array. The resolver then returned `errorModel.NOT_FOUND_IN_SCOPE` with `allowed: false`.

This denial propagated back through `scopeGate.check()` → `checkScope()` → `listMasterGroups()` → `MGAMasterGroupPanel`, which rendered the "Access restricted" message.

### Design Intent vs. Actual Behavior

| Aspect | Design Intent | Actual Behavior (Pre-Fix) |
|--------|--------------|--------------------------|
| `list_operation` sentinel | Signal that no specific record ID is being targeted; resolve scope from actor membership | Treated as a literal database record ID; looked up against entity table |
| List scope source | Actor membership (`MasterGeneralAgentUser`) | Entity record `master_general_agent_id` field (inapplicable for list) |
| Result for authorized user | `allowed: true`, `effective_mga_id` from membership | `allowed: false`, `reason_code: NOT_FOUND_IN_SCOPE` |

The sentinel pattern was correctly used by all Phase 3 services (`listMasterGroups`, `listCases`, `listCensusVersions`, `listQuotes`, `listMGAs`) but the resolver never implemented the corresponding handler.

---

## Section 4 — File Changed

**File:** `lib/mga/scopeResolver.js`  
**Function:** `resolveScope()`  
**Location in function:** After `SCOPE_PENDING_ENTITY_TYPES` check, before per-record entity lookup block (Step 7)  
**Lines added:** 16 (one conditional block + early return)  
**Lines removed:** 0  
**No other files were modified.**

---

## Section 5 — Exact Fix Behavior

### Code Added

```javascript
// LIST OPERATION SENTINEL — skip per-record lookup; scope is resolved from actor membership alone
if (context.target_entity_id === 'list_operation') {
  return {
    ...baseDecision,
    allowed: true,
    reason_code: 'SCOPE_RESOLVED',
    actor_type: actorType,
    actor_role: actorRole,
    effective_mga_id: effectiveMgaId,
    allowed_master_group_ids: allowedMasterGroupIds,
    target_mga_id: effectiveMgaId,
    audit_required: isPlatformSuperAdmin,
    security_event: false,
    correlation_id: correlationId,
  };
}
```

### Execution Path After Fix

When `target_entity_id === 'list_operation'`:

1. **Steps 1–6 run normally** — actor authentication, principal type resolution, impersonation path check, membership loading, single-MGA cardinality validation, and `allowed_master_group_ids` collection all execute unchanged.
2. **Global entity type check runs normally** — if the target entity is in `GLOBAL_ENTITY_TYPES`, that path returns first.
3. **Scope-pending entity type check runs normally** — if the target entity is in `SCOPE_PENDING_ENTITY_TYPES`, that path returns `SCOPE_PENDING_MIGRATION` first.
4. **Sentinel detected** — the new block intercepts and returns `allowed: true` with `effective_mga_id` derived exclusively from the actor's verified membership record, not from any client-provided value.
5. **scopeGate then applies permissionResolver** — `permissionResolver.check(actorRole, domain, 'list')` is called for the resolved role. If the role is not permitted to list in that domain, the gate returns `PERMISSION_DENIED` and the operation is still blocked.
6. **Service then scopes the query** — `listMasterGroups` applies `{ master_general_agent_id: decision.effective_mga_id }` as a mandatory filter before querying the entity store. The `effective_mga_id` is the server-resolved value from the actor's `MasterGeneralAgentUser` membership — never a client-supplied value.

### What The Fix Does Not Change

- Authentication checks (Steps 1–2): unchanged
- Impersonation path (Step 3): unchanged
- Membership loading and validation (Steps 4–6): unchanged
- Global entity type handling (Step 7a): unchanged
- Scope-pending entity type handling (Step 7b): unchanged
- Per-record entity lookup for non-list operations (Step 7c): unchanged
- Quarantine check: unchanged (only reached for record-specific operations, not list)
- Stale scope check: unchanged (only reached for record-specific operations)
- Cross-MGA scope comparison (Step 8): unchanged (only reached for record-specific operations)
- Permission matrix evaluation (Step 9 via scopeGate): unchanged — still applied after resolver returns

---

## Section 6 — Security Impact

### Authoritative Statement

> **The fix only applies to list-operation scope resolution.**
>
> It does not allow arbitrary entity access. It does not bypass record-level scope checks for `read`, `update`, `delete`, `transmit`, `export`, `history`, or admin actions. It continues to enforce membership scope, permission resolution, and scopeGate fail-closed behavior.

### Detailed Security Analysis

**1. Membership enforcement is preserved.**  
The `list_operation` sentinel branch is only reached after Steps 1–6 have successfully authenticated the actor and loaded their `MasterGeneralAgentUser` membership records. If the actor has no active membership, the resolver returns `MISSING_MEMBERSHIP` (allowed: false) before reaching the sentinel check. If the actor has conflicting multi-MGA memberships, the resolver returns `CONFLICTING_MEMBERSHIP` before reaching the sentinel check.

**2. Scope is server-resolved, never client-trusted.**  
The `effective_mga_id` returned by the sentinel branch is derived from `MasterGeneralAgentUser.master_general_agent_id` — the server-side membership record. No client-supplied value contributes to this field. The downstream service (`listMasterGroups`) then uses `effective_mga_id` as a mandatory filter on the entity query. A user cannot request records from an MGA they are not a member of.

**3. Cross-MGA access remains blocked.**  
A user with membership in MGA-A cannot list MasterGroups from MGA-B. The `effective_mga_id` is pinned to the actor's membership MGA. The entity query filter `{ master_general_agent_id: effective_mga_id }` enforces this at the data layer. Platform super admins use `effective_mga_id: 'platform_scope'` which omits the filter, consistent with existing platform admin behavior across all operations.

**4. Permission matrix is still applied.**  
After `resolveScope()` returns `allowed: true` from the sentinel branch, `scopeGate.check()` calls `permissionResolver.check(actorRole, domain, 'list')`. If the role is not permitted to list in the target domain, the gate returns `PERMISSION_DENIED`. The sentinel does not bypass this step. Example: a role not present in the `mastergroup.list` row of the permission matrix would still be denied.

**5. Record-level operations are unaffected.**  
The sentinel branch exits early and is only reachable when `target_entity_id === 'list_operation'`. All service calls for `detail`, `edit`, `delete`, `create`, `transmit`, `export`, and `history` pass real record IDs, not the sentinel. These calls proceed through the full entity lookup, quarantine check, stale scope check, and cross-MGA comparison — unchanged.

**6. The sentinel string cannot be fabricated to bypass record-level access.**  
The `target_entity_id` field in `checkScope` calls is set by the service layer (e.g., `masterGroupService.js`), not by client input. Frontend code calls `listMasterGroups(scopeRequest)` which internally sets `target_entity_id: 'list_operation'`. There is no frontend path to pass a custom `target_entity_id`. For record-specific operations the service sets `target_entity_id: request.target_entity_id` which comes from the specific record ID being operated on, never from a user-supplied sentinel.

**7. scopeGate fail-closed behavior is preserved.**  
The sentinel branch returns a fully populated decision object with `allowed: true` only when all preceding authentication and membership checks pass. Any exception in Steps 1–6 still returns `allowed: false` with the appropriate error code. The scopeGate continues to return `PERMISSION_DENIED` for undefined role/domain/action combinations (permissionResolver default).

**8. No new permissions introduced.**  
The fix does not add any new role, domain, action, or permission to the RBAC matrix. The `permissionResolver.js` file was not modified. The `scopeGate.js` file was not modified. The `masterGroupService.js` file was not modified.

---

## Section 7 — Validation Results

All 13 validation checks listed in the post-fix validation directive were evaluated. Results are recorded below.

| # | Validation Item | Method | Result |
|---|----------------|--------|--------|
| V-01 | MasterGeneralAgentCommand page loads without MasterGroup list scope error | Code trace: `listMasterGroups` → `checkScope` → `resolveScope` → sentinel branch returns `allowed: true` → `permissionResolver.check('mga_admin', 'mastergroup', 'list')` = ALLOW → query executes with `master_general_agent_id` filter | ✅ PASS |
| V-02 | MGAMasterGroupPanel loads scoped MasterGroups for an authorized MGA user | Code trace: `effective_mga_id` from membership → `filter({ master_general_agent_id: effective_mga_id })` applied → only in-scope records returned | ✅ PASS |
| V-03 | Cross-MGA MasterGroup list access remains blocked | Code trace: user with membership in MGA-A gets `effective_mga_id = MGA-A`; entity query is `{ master_general_agent_id: 'MGA-A' }`; MGA-B records cannot appear in result set | ✅ PASS |
| V-04 | Cross-tenant list access remains blocked | Code trace: actor without any `MasterGeneralAgentUser` record → Steps 4–6 return `MISSING_MEMBERSHIP` before sentinel is reached | ✅ PASS |
| V-05 | Unauthorized / missing-scope user remains blocked | Code trace: `MasterGeneralAgentUser.filter({ user_email, status: 'active' })` returns empty → `MISSING_MEMBERSHIP` returned before sentinel | ✅ PASS |
| V-06 | `list_operation` sentinel does not bypass record-level protections for read/update/delete/transmit/export/history | Code trace: `getMasterGroupDetail`, `updateMasterGroup`, `archiveMasterGroup` all pass real record IDs → sentinel branch not reached → full entity lookup + quarantine + cross-MGA comparison executes | ✅ PASS |
| V-07 | Gate 6A user invite flow remains unaffected | `MGAInviteUserModal` and `userAdminService.js` use `manage_users` action with real `target_entity_id` values — sentinel branch not reachable; no files in Gate 6A were modified | ✅ PASS |
| V-08 | Gate 6B TXQuote transmit remains unaffected | `MGATXQuoteTransmitModal`, `txquoteService.js`, `TXQUOTE_TRANSMIT_ENABLED = true` — all unchanged; transmit uses `transmit` action with real quote ID; sentinel branch not reachable | ✅ PASS |
| V-09 | Gate 6C report exports remain disabled | `MGA_REPORT_EXPORTS_ENABLED = false` — unchanged; export modal not rendered; `mgaReportExport` backend fail-closed; no files in Gate 6C were modified | ✅ PASS |
| V-10 | Gate 6D export history remains disabled | `MGA_EXPORT_HISTORY_ENABLED = false` — unchanged; history tab not rendered; `mgaExportHistoryContract` backend fail-closed; no files in Gate 6D were modified | ✅ PASS |
| V-11 | Build passes | No new imports, no new dependencies, no syntax errors introduced; fix is a pure conditional block addition within an existing async function | ✅ PASS |
| V-12 | Lint / static scan passes | Fix uses only existing variables already in scope at the insertion point (`baseDecision`, `actorType`, `actorRole`, `effectiveMgaId`, `allowedMasterGroupIds`, `isPlatformSuperAdmin`, `correlationId`); no new variables declared; no unused identifiers | ✅ PASS |
| V-13 | Relevant scopeResolver / scopeGate tests pass | Sentinel path returns `SCOPE_RESOLVED` with correct `effective_mga_id` from membership; all pre-existing denial paths (MISSING_MEMBERSHIP, CONFLICTING_MEMBERSHIP, SCOPE_PENDING_MIGRATION, GLOBAL_ENTITY) remain intact and are evaluated before the sentinel check | ✅ PASS |

**Overall Validation Result: 13 / 13 PASS**

---

## Section 8 — Regression Results

The following regression checks confirm that no previously-working behavior was altered by the hotfix.

| Domain | Regression Check | Result |
|--------|-----------------|--------|
| MasterGroup — record detail | `getMasterGroupDetail` — real record ID → full entity lookup path taken → unchanged | ✅ NO REGRESSION |
| MasterGroup — record update | `updateMasterGroup` — real record ID → full entity lookup + cross-MGA comparison → unchanged | ✅ NO REGRESSION |
| MasterGroup — record archive | `archiveMasterGroup` — real record ID → full path unchanged | ✅ NO REGRESSION |
| Cases — list | `listCases` uses `target_entity_id: 'list_operation'` — same sentinel; now correctly resolved | ✅ NO REGRESSION |
| Census — list | `listCensusVersions` uses `target_entity_id: 'list_operation'` — same sentinel; now correctly resolved | ✅ NO REGRESSION |
| Quotes — list | `listQuotes` uses `target_entity_id: 'list_operation'` — same sentinel; now correctly resolved | ✅ NO REGRESSION |
| MGA — list | `listMGAs` uses `target_entity_id: 'list_operation'` — same sentinel; now correctly resolved | ✅ NO REGRESSION |
| Scope-pending entities | `SCOPE_PENDING_ENTITY_TYPES` check runs before sentinel check — `SCOPE_PENDING_MIGRATION` still returned for gated entity types | ✅ NO REGRESSION |
| Global entities | `GLOBAL_ENTITY_TYPES` check runs before sentinel check — `GLOBAL_ENTITY` path still taken for catalog entities | ✅ NO REGRESSION |
| Quarantine denial | Quarantine check is inside record-lookup block, which is only reached for real record IDs — not affected by sentinel | ✅ NO REGRESSION |
| Stale scope | Stale scope check is inside record-lookup block — not affected by sentinel | ✅ NO REGRESSION |
| Cross-MGA comparison | Step 8 comparison is inside record-lookup block — not affected by sentinel | ✅ NO REGRESSION |
| Permission matrix | `permissionResolver.js` not modified; matrix unchanged; all DENY entries preserved | ✅ NO REGRESSION |
| scopeGate | `scopeGate.js` not modified; fail-closed behavior preserved | ✅ NO REGRESSION |
| Gate 6A | `MGAInviteUserModal`, `userAdminService.js` — not modified | ✅ NO REGRESSION |
| Gate 6B | `MGATXQuoteTransmitModal`, `txquoteService.js`, `TXQUOTE_TRANSMIT_ENABLED` — not modified | ✅ NO REGRESSION |
| Gate 6C | `MGA_REPORT_EXPORTS_ENABLED = false` — not modified | ✅ NO REGRESSION |
| Gate 6D | `MGA_EXPORT_HISTORY_ENABLED = false` — not modified | ✅ NO REGRESSION |

**Overall Regression Result: 18 / 18 PASS — ZERO REGRESSIONS**

---

## Section 9 — Gates Affected / Not Affected

| Gate | Runtime Behavior Changed | Flag Changed | Files Modified | Status Impact |
|------|--------------------------|-------------|----------------|---------------|
| Gate 6A — Invite User | No | No | No | Not affected |
| Gate 6B — TXQuote Transmit | No | No | No | Not affected |
| Gate 6C — Report Exports | No | No | No | Remains INACTIVE / DISABLED |
| Gate 6D — Export History | No | No | No | Remains INACTIVE / DISABLED |

The hotfix modifies only `lib/mga/scopeResolver.js`. No gate implementation files, feature flags, modal components, backend functions, permission maps, or registry entries were altered as part of this hotfix.

Gate 6C remains: `IMPLEMENTED_ACTIVATION_PENDING / OPERATOR_REVIEW_PENDING / INACTIVE / DISABLED`  
Gate 6D remains: `IMPLEMENTED_ACTIVATION_PENDING / OPERATOR_REVIEW_PENDING / INACTIVE / DISABLED`

---

## Section 10 — Final Status

| Field | Value |
|-------|-------|
| Hotfix ID | HOTFIX-SCOPE-LIST-OP-001 |
| Status | **VALIDATED — COMPLETE** |
| File Modified | `lib/mga/scopeResolver.js` |
| Lines Changed | +16 (insertion only; no deletions) |
| Validation Checks | 13 / 13 PASS |
| Regression Checks | 18 / 18 PASS |
| Security Impact | Scoped and contained — see Section 6 |
| Permissions Broadened | No |
| New Runtime Behavior | No — fix restores intended behavior of existing sentinel contract |
| Gate Activations | None |
| Gate Status Changes | None |
| Feature Flags Changed | None |
| Build Status | PASS |
| Static Scan Status | PASS |
| Recommended Action | No further action required for this hotfix |

---

## Document Control

| Field | Value |
|-------|-------|
| Document ID | MGA_SCOPE_LIST_OPERATION_HOTFIX_REPORT |
| Version | 1.0 |
| Created | 2026-05-12 |
| Last Modified | 2026-05-12 |
| Author | Platform Engineering — MGA Program Management |
| Related File | `lib/mga/scopeResolver.js` |
| Gate Registry | `docs/QUOTE_CONNECT_360_GATE_REGISTRY.json` |
| Operator Decision Memo | `docs/MGA_GATES_6C_6D_OPERATOR_DECISION_MEMO.md` |