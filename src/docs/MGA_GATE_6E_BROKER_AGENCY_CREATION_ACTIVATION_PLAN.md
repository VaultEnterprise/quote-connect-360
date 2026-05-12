# MGA Gate 6E — Broker / Agency Organization Creation: Activation Plan

**Document Type:** Gate Activation Plan  
**Classification:** Internal — Platform Engineering / Program Management  
**Gate ID:** GATE-6E  
**Gate Name:** Broker / Agency Organization Creation  
**Date:** 2026-05-12  
**Prepared By:** Platform Engineering  
**Status:** ACTIVATION PLAN — APPROVED FOR IMPLEMENTATION

---

## Section 1 — Current Capability Status

| Layer | Status | Detail |
|-------|--------|--------|
| Internal entity | `MasterGroup` | Unchanged — no rename |
| Internal scope field | `master_group_id` | Unchanged — no rename |
| Service layer | ✅ COMPLETE | `masterGroupService.createMasterGroup` fully implemented, scoped, audited, idempotency-protected |
| Permission matrix | ✅ COMPLETE | `mastergroup.create` defined in `permissionResolver.js` — `mga_admin` + `platform_super_admin` ALLOW |
| UI create action | ❌ INACTIVE | `MGAMasterGroupPanel` line 60 — comment: `{/* Create MasterGroup: INACTIVE — Phase 5 sub-feature activation pending */}` |
| User-facing label | Broker / Agency | Terminology rename already applied in panel header |

**Summary:** The only gap between current state and full capability is the inactive UI create path. No service, permission, scope, or audit work is needed — only the UI activation.

---

## Section 2 — Files and Services Involved

### Files to be Modified

| File | Change |
|------|--------|
| `components/mga/MGAMasterGroupPanel` | Replace inactive comment placeholder with active create button + inline create form/modal |

### Files to be Created

| File | Purpose |
|------|---------|
| `components/mga/MGACreateBrokerAgencyModal` | Focused create form modal — wired to `masterGroupService.createMasterGroup` |
| `docs/MGA_GATE_6E_BROKER_AGENCY_CREATION_CLOSEOUT_REPORT.md` | Post-implementation closeout |

### Files Unchanged (Confirmed)

| File | Role | Gate 6E Impact |
|------|------|---------------|
| `lib/mga/services/masterGroupService.js` | Service — `createMasterGroup` | None — already complete |
| `lib/mga/permissionResolver.js` | RBAC matrix — `mastergroup.create` | None — already defined |
| `lib/mga/scopeGate.js` | Scope enforcement | None |
| `lib/mga/services/serviceContract.js` | `checkScope`, `prepareAndRecordAudit` | None |
| `entities/MasterGroup.json` | Entity schema | None — no migration |
| All Gate 6A files | Invite flow | None |
| All Gate 6B files | TXQuote transmit | None |
| All Gate 6C files | Report exports | None |
| All Gate 6D files | Export history | None — remains inactive |

---

## Section 3 — Existing Create Service Verification

`masterGroupService.createMasterGroup` (confirmed from source):

```
createMasterGroup(request)
  1. validateServiceRequest(request, { requireIdempotency: true })          ← malformed guard
  2. checkScope({ domain: 'mastergroup', action: 'create', ... })           ← scopeGate + permissionResolver
  3. MasterGroup.filter({ idempotency_key, master_general_agent_id })       ← duplicate guard
  4. MasterGroup.create({ ...payload, master_general_agent_id: decision.effective_mga_id }) ← MGA boundary enforced
  5. prepareAndRecordAudit(decision, { outcome, after: created })           ← audit trail
  6. return buildScopedResponse(...)                                        ← standard response
```

All six controls are implemented and verified via static analysis. No changes required.

**Permission matrix entry (confirmed from `permissionResolver.js` — `mastergroup` domain):**

| Role | `mastergroup.create` |
|------|---------------------|
| `platform_super_admin` | ALLOW |
| `mga_admin` | ALLOW |
| `mga_manager` | DENY |
| `mga_user` | DENY |
| `mga_read_only` | DENY |

---

## Section 4 — UI Activation Requirement

### What to build

A `MGACreateBrokerAgencyModal` component containing:

| Field | Internal mapping | Required |
|-------|-----------------|---------|
| Broker / Agency Name | `MasterGroup.name` | ✅ YES |
| Code | `MasterGroup.code` | ✅ YES |
| Status | `MasterGroup.status` (default: `active`) | Optional — default active |
| Notes | `MasterGroup.notes` | Optional |

### Terminology rules

| User-facing text | Internal field / value |
|-----------------|----------------------|
| "Broker / Agency" | `MasterGroup` |
| "Broker / Agency Name" | `name` |
| "Add Broker / Agency" / "Create Broker / Agency" | `createMasterGroup` |
| No "Master Group" label in UI | Internal only |

### Wiring

```
MGAMasterGroupPanel (header → "+ Add Broker / Agency" button)
  → MGACreateBrokerAgencyModal (form)
    → masterGroupService.createMasterGroup(request)
      → scopeGate / permissionResolver / audit (all existing)
    → on success: refresh list, close modal
```

### Visibility gate

The create button must only render for `mga_admin` and `platform_super_admin`. Check via `userRole` prop (same pattern as `MGAUsersPanel` uses `isMGAAdmin`).

---

## Section 5 — Required Permissions

| Permission key | Domain | Action | Authorized roles |
|---------------|--------|--------|-----------------|
| `mastergroup.create` | `mastergroup` | `create` | `platform_super_admin`, `mga_admin` |

No new permission keys are required. The existing `mastergroup.create` entry in `permissionResolver.js` covers Gate 6E fully.

Optional alias for documentation: `mga.broker_agencies.create` may be noted in documentation as a user-facing alias but must **not** replace or duplicate the existing `mastergroup.create` check.

---

## Section 6 — ScopeGate Enforcement

All scope enforcement is handled by the existing service layer. The UI layer must **not** implement its own authorization checks. The service call itself enforces:

| Control | Mechanism |
|---------|-----------|
| Actor authentication | `validateServiceRequest` — `actor_email` + `actor_session_token` required |
| Permission check | `checkScope → permissionResolver.check('mga_admin', 'mastergroup', 'create')` |
| MGA boundary | `master_general_agent_id` stamped from `decision.effective_mga_id` — not actor-supplied |
| Cross-MGA blocked | Scope resolution is server-side only |
| Fail-closed | Undefined role × action = DENY |

The UI create button visibility check (`userRole === 'mga_admin'`) is a UX convenience only — not a security boundary.

---

## Section 7 — Audit Requirements

`masterGroupService.createMasterGroup` already calls `prepareAndRecordAudit` on success. This writes to `MasterGeneralAgentActivityLog` with:

| Audit field | Value |
|-------------|-------|
| Actor email | `decision.actor_email` |
| Action | `mastergroup.create` |
| Entity type | `MasterGroup` |
| Entity ID | Created record ID |
| Before | null (new record) |
| After | Created record snapshot |
| Outcome | `success` |
| Correlation ID | Auto-generated |

No additional audit instrumentation is required for Gate 6E.

---

## Section 8 — Idempotency Requirements

`masterGroupService.createMasterGroup` enforces idempotency via:

1. `validateServiceRequest` requires `idempotency_key`
2. Pre-create check: `MasterGroup.filter({ idempotency_key, master_general_agent_id })` — returns `already_processed` if found

The UI modal must generate a stable idempotency key before submitting:

```js
const idempotencyKey = `create-broker-agency-${mgaId}-${name}-${Date.now()}`;
```

This prevents duplicate records from double-submit or network retry.

---

## Section 9 — Validation Checklist

| # | Item | Expected |
|---|------|----------|
| 1 | `mga_admin` sees "+ Add Broker / Agency" button | ✅ visible |
| 2 | `mga_user` does not see "+ Add Broker / Agency" button | ❌ not rendered |
| 3 | `mga_read_only` does not see button | ❌ not rendered |
| 4 | `mga_admin` can submit create form | ✅ service call succeeds |
| 5 | Created Broker / Agency appears in list after creation | ✅ list refreshed |
| 6 | Cross-MGA creation blocked | `SCOPE_DENIED` from service |
| 7 | Cross-tenant creation blocked | `SCOPE_DENIED` from service |
| 8 | `mga_manager` submit returns `PERMISSION_DENIED` | Service-enforced |
| 9 | Missing scope returns `SCOPE_DENIED` | Service-enforced |
| 10 | Duplicate submit returns `already_processed` | Idempotency key match |
| 11 | Audit event written on create attempt | `MasterGeneralAgentActivityLog` entry |
| 12 | Audit event written on create success | `outcome: 'success'` in audit |
| 13 | UI label says "Broker / Agency" not "Master Group" | UI text verification |
| 14 | Internal entity is `MasterGroup` | Code inspection |
| 15 | Gate 6A invite flow unaffected | `MGAUsersPanel` renders correctly |
| 16 | Gate 6B TXQuote transmit unaffected | `TXQUOTE_TRANSMIT_ENABLED = true` unchanged |
| 17 | Gate 6C report exports unchanged | `MGA_REPORT_EXPORTS_ENABLED` unchanged |
| 18 | Gate 6D export history inactive | `MGA_EXPORT_HISTORY_ENABLED = false` unchanged |
| 19 | Build passes | No import errors |

---

## Section 10 — Rollback Plan

Gate 6E rollback requires removing or disabling the create button in `MGAMasterGroupPanel`.

**Rollback trigger:** Any of — permission regression, data integrity issue, cross-MGA boundary breach, audit failure.

**Rollback steps:**
1. In `MGAMasterGroupPanel`, remove or comment out the `canCreate` button and modal import
2. In `MGACaseWorkflowPanel`, no change needed (Gate 6E does not touch that file)
3. No database migration required — `MasterGroup` entity schema is unchanged
4. No service rollback needed — `masterGroupService.createMasterGroup` is inert without UI invocation
5. No audit cleanup — existing audit records are evidence, not liabilities

**Rollback impact:** Zero impact on Gates 6A, 6B, 6C, or 6D.

---

## Section 11 — No-Impact Certification for Gates 6A, 6B, 6C, 6D

| Gate | Capability | Gate 6E Impact | Certification |
|------|-----------|---------------|---------------|
| 6A — User Invite | `userAdminService.inviteMGAUser` | None — different service, different entity, different panel | ✅ NO IMPACT |
| 6B — TXQuote Transmit | `MGATXQuoteTransmitModal`, `txquoteService` | None — different feature, different panel tab | ✅ NO IMPACT |
| 6C — Report Exports | `mgaReportExport`, `MGAReportExportModal` | None — different capability, different flag | ✅ NO IMPACT |
| 6D — Export History | `MGAExportHistoryPanel`, `mgaExportHistoryContract` | None — `MGA_EXPORT_HISTORY_ENABLED = false` unchanged | ✅ NO IMPACT |

---

## Document Control

| Field | Value |
|-------|-------|
| Document ID | MGA_GATE_6E_BROKER_AGENCY_CREATION_ACTIVATION_PLAN |
| Version | 1.0 |
| Date | 2026-05-12 |
| Author | Platform Engineering |
| Registry | `docs/QUOTE_CONNECT_360_GATE_REGISTRY.json` — GATE-6E |
| Next step | Implement `MGACreateBrokerAgencyModal` + activate panel button |