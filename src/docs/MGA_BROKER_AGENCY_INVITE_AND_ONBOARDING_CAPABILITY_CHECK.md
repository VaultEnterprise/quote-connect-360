# MGA — Broker / Agency Invite & Onboarding Capability Check

**Document Type:** Capability Verification Report  
**Classification:** Internal — Platform Engineering / Program Management  
**Date:** 2026-05-12  
**Prepared By:** Platform Engineering — Static Code Analysis  
**Status:** VERIFICATION COMPLETE — NO RUNTIME CHANGES MADE

---

## Purpose

Verify whether the current MGA build supports the two distinct workflows:

- **Workflow A:** Invite a broker / agency user into the MGA environment (person access)
- **Workflow B:** Add / create a Broker / Agency organization under the MGA (entity record)

These are explicitly distinct operations. This report confirms what is implemented, what is not, and what the recommended next action is.

---

## Section 1 — Workflow A: Invite Broker / Agency User

### Verdict: IMPLEMENTED — ACTIVE (Gate 6A, 2026-05-05)

### Service Path

```
MGAUsersPanel (UI)
  → MGAInviteUserModal (UI)
    → userAdminService.inviteMGAUser (service)
      → serviceContract.checkScope (scope enforcement)
        → scopeGate → permissionResolver.check('mga_admin', 'users', 'create')
          → base44.entities.MasterGeneralAgentUser.create (entity write)
            → prepareAndRecordAudit (audit log)
```

### What the invite flow does

| Step | Implementation | File |
|------|---------------|------|
| UI trigger | `MGAUsersPanel` renders "Invite User" button for `mga_admin` only | `components/mga/MGAUsersPanel` |
| Modal | `MGAInviteUserModal` — email + role selection form | `components/mga/MGAInviteUserModal` |
| Allowed roles | `mga_admin`, `mga_manager`, `mga_user`, `mga_read_only` only — no platform roles grantable | `components/mga/MGAInviteUserModal` line 15 |
| Idempotency | `idempotency_key = invite-{mgaId}-{email}-{timestamp}` — duplicate invite detected | `userAdminService.inviteMGAUser` |
| Scope enforcement | `checkScope({ domain: 'users', action: 'create' })` via `serviceContract.js` | `lib/mga/services/userAdminService.js` |
| Entity written | `MasterGeneralAgentUser` with `{ user_email, role, master_general_agent_id, status: 'invited' }` | `userAdminService.inviteMGAUser` |
| MGA association | `master_general_agent_id` stamped from `decision.effective_mga_id` — actor cannot supply arbitrary MGA ID | `userAdminService.inviteMGAUser` line 17 |
| Audit | `prepareAndRecordAudit` called on success | `userAdminService.inviteMGAUser` line 18 |
| Duplicate guard | Checks existing `MasterGeneralAgentUser` by `user_email + master_general_agent_id` before creating | `userAdminService.inviteMGAUser` line 15–16 |

### Permission Matrix (Workflow A)

| Role | Can see user list | Can invite user | Can edit role | Can deactivate |
|------|------------------|-----------------|---------------|----------------|
| `platform_super_admin` | ✅ | ✅ | ✅ | ✅ |
| `mga_admin` | ✅ | ✅ | ✅ | ✅ |
| `mga_manager` | ✅ | ❌ | ❌ | ❌ |
| `mga_user` | ❌ | ❌ | ❌ | ❌ |
| `mga_read_only` | ❌ | ❌ | ❌ | ❌ |

Source: `permissionResolver.js` → `users` domain; `MGAUsersPanel` → `isMGAAdmin` gate.

### Scope and Audit Controls (Workflow A)

| Control | Status | Implementation |
|---------|--------|---------------|
| `scopeGate` enforced | ✅ YES | `checkScope` called in `inviteMGAUser` |
| `permissionResolver` enforced | ✅ YES | `users.create` checked — only `mga_admin` and `platform_super_admin` ALLOW |
| Cross-MGA invite blocked | ✅ YES | `master_general_agent_id` resolved server-side from authenticated session — not actor-supplied |
| Audit trail | ✅ YES | `prepareAndRecordAudit` writes to `MasterGeneralAgentActivityLog` |
| Idempotency | ✅ YES | Duplicate invite by same email + MGA returns `already_processed` |

### Gap: Broker / Agency Scope Association on User Invite

| Item | Status |
|------|--------|
| Does invite associate user to a specific Broker / Agency (`master_group_id`)? | ❌ **NO** |
| The `MasterGeneralAgentUser` entity stamped with `master_general_agent_id` | ✅ YES |
| The `MasterGeneralAgentUser` entity stamped with `master_group_id` | ❌ NOT in current implementation |

**Finding A-1:** The invite flow associates a user to the MGA (`master_general_agent_id`) but does **not** associate them to a specific Broker / Agency (`master_group_id`). If the operator needs broker/agency-specific user scoping (e.g., a user who belongs to Broker Agency X under MGA Y), that sub-scope is not currently captured in the invite flow.

---

## Section 2 — Workflow B: Add / Create Broker / Agency Organization

### Verdict: SERVICE IMPLEMENTED — UI CREATE ACTION INACTIVE

### Internal Entity Model

| User-facing label | Internal entity | Internal field |
|-------------------|----------------|----------------|
| Broker / Agency | `MasterGroup` | `master_group_id` |

The terminology rename is UI-layer only. `MasterGroup`, `master_group_id`, and `masterGroupService` are unchanged internally.

### Service Layer: masterGroupService.js

All CRUD operations are **fully implemented** at the service layer:

| Operation | Function | Status |
|-----------|----------|--------|
| List Broker / Agencies | `listMasterGroups` | ✅ IMPLEMENTED — active |
| Get detail | `getMasterGroupDetail` | ✅ IMPLEMENTED |
| Get summary + case count | `getMasterGroupSummary` | ✅ IMPLEMENTED |
| **Create Broker / Agency** | `createMasterGroup` | ✅ IMPLEMENTED — service-layer only |
| Update Broker / Agency | `updateMasterGroup` | ✅ IMPLEMENTED — service-layer only |
| Archive Broker / Agency | `archiveMasterGroup` | ✅ IMPLEMENTED — service-layer only |
| List activity log | `listMasterGroupActivity` | ✅ IMPLEMENTED |

All operations pass through `checkScope → permissionResolver → scopeGate` before any entity access.

### UI Layer: MGAMasterGroupPanel

| UI Feature | Status | Evidence |
|------------|--------|---------|
| List Broker / Agencies | ✅ ACTIVE | Panel renders scoped list via `listMasterGroups` |
| View status / ownership badges | ✅ ACTIVE | Status and ownership_status displayed |
| **Create Broker / Agency button** | ❌ **INACTIVE** | Comment on line 60: `{/* Create MasterGroup: INACTIVE — Phase 5 sub-feature activation pending */}` |
| Edit / update Broker / Agency | ❌ NOT WIRED | No edit action in panel |
| Archive / delete Broker / Agency | ❌ NOT WIRED | No delete action in panel |

**Finding B-1:** The `MGAMasterGroupPanel` is explicitly marked with `INACTIVE — Phase 5 sub-feature activation pending` at the create action location. The service exists and is fully implemented, but no UI surfaces the create, edit, or archive operations.

### Permission Matrix (Workflow B — mastergroup domain)

| Role | List / View | Create | Edit | Archive / Delete | View Audit |
|------|------------|--------|------|-----------------|------------|
| `platform_super_admin` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `mga_admin` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `mga_manager` | ✅ | ❌ | ✅ | ❌ | ✅ |
| `mga_user` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `mga_read_only` | ✅ | ❌ | ❌ | ❌ | ❌ |

Source: `permissionResolver.js` → `mastergroup` domain, lines 47–68.

### Scope and Audit Controls (Workflow B)

| Control | Status | Implementation |
|---------|--------|---------------|
| `scopeGate` enforced | ✅ YES | `checkScope` called in all masterGroupService functions |
| `permissionResolver` enforced | ✅ YES | `mastergroup.create / edit / delete` checked per role |
| Cross-MGA access blocked | ✅ YES | All filters include `master_general_agent_id: decision.effective_mga_id` |
| Cross-tenant access blocked | ✅ YES | `effective_mga_id` resolved from actor session — not supplied by caller |
| Masked not-found | ✅ YES | Out-of-scope records return `NOT_FOUND_IN_SCOPE` — no information leakage |
| Optimistic lock | ✅ YES | `expected_updated_date` check on update — prevents stale writes |
| Idempotency | ✅ YES | `createMasterGroup` checks `idempotency_key` before creating |
| Audit trail | ✅ YES | `prepareAndRecordAudit` called on create, update, archive |

---

## Section 3 — Gap Analysis

| Gap | Workflow | Severity | Notes |
|-----|----------|----------|-------|
| Broker / Agency create UI not active | B | MEDIUM | Service exists; UI placeholder marked `INACTIVE — Phase 5 sub-feature` |
| Broker / Agency edit UI not wired | B | LOW | Service exists; no UI surface |
| Broker / Agency archive UI not wired | B | LOW | Service exists; no UI surface |
| User invite does not capture `master_group_id` scope | A | LOW | User is scoped to MGA but not to specific Broker / Agency sub-scope |
| No Broker / Agency onboarding workflow | B | MEDIUM | No multi-step guided create flow — only a service-layer point record create |

---

## Section 4 — Recommended Next Action

### For Workflow A (User Invite): READY — NO CHANGES NEEDED

The invite flow is fully operational under Gate 6A. No code changes are required to invite a broker/agency user into the MGA environment.

If sub-scope association to a specific Broker / Agency (`master_group_id`) is required on invite, that is a controlled enhancement — requires operator decision and a new gate. Do not add it without authorization.

### For Workflow B (Broker / Agency Create): REQUIRES CONTROLLED GATE

The service layer is complete and tested. The UI create action is intentionally inactive. To activate:

1. Operator must authorize activation as a new sub-gate (e.g., Gate 6E or Phase 5 sub-feature)
2. Implement create form / modal in `MGAMasterGroupPanel` wired to `masterGroupService.createMasterGroup`
3. Define and document test matrix
4. Run smoke validation
5. Obtain operator sign-off

**Do not activate without a formal gate — the create service requires idempotency key management and proper scoped payload construction.**

---

## Section 5 — Files and Services Involved

| File | Role | Workflow |
|------|------|----------|
| `components/mga/MGAUsersPanel` | UI — user list + invite button | A |
| `components/mga/MGAInviteUserModal` | UI — invite form | A |
| `lib/mga/services/userAdminService.js` | Service — `inviteMGAUser`, `listMGAUsers`, `updateMGAUserRole`, `deactivateMGAUser` | A |
| `components/mga/MGAMasterGroupPanel` | UI — list only; create INACTIVE | B |
| `lib/mga/services/masterGroupService.js` | Service — full CRUD implemented | B |
| `lib/mga/permissionResolver.js` | RBAC matrix — `users` domain (A), `mastergroup` domain (B) | A + B |
| `lib/mga/services/serviceContract.js` | `checkScope`, `prepareAndRecordAudit` — shared by all services | A + B |
| `entities/MasterGeneralAgentUser.json` | Entity — invited/active users under an MGA | A |
| `entities/MasterGroup.json` | Entity — Broker / Agency organization records | B |

---

## Section 6 — Permissions Summary

### Workflow A — User Invite (`users` domain)

| Action | Authorized Roles |
|--------|-----------------|
| `users.list` | `platform_super_admin`, `mga_admin`, `mga_manager` |
| `users.create` (invite) | `platform_super_admin`, `mga_admin` |
| `users.edit` (role change) | `platform_super_admin`, `mga_admin` |
| `users.delete` (deactivate) | `platform_super_admin`, `mga_admin` |

### Workflow B — Broker / Agency Org (`mastergroup` domain)

| Action | Authorized Roles |
|--------|-----------------|
| `mastergroup.list` / `view` | All roles |
| `mastergroup.create` | `platform_super_admin`, `mga_admin` |
| `mastergroup.edit` | `platform_super_admin`, `mga_admin`, `mga_manager` |
| `mastergroup.delete` | `platform_super_admin`, `mga_admin` |
| `mastergroup.view_audit` | `platform_super_admin`, `mga_admin`, `mga_manager` |

---

## Section 7 — Scope and Audit Controls Summary

| Control | Workflow A | Workflow B |
|---------|-----------|-----------|
| `scopeGate` enforced | ✅ YES | ✅ YES |
| `permissionResolver` enforced | ✅ YES | ✅ YES |
| MGA scope stamped on write | ✅ YES (`master_general_agent_id`) | ✅ YES (`master_general_agent_id`) |
| Cross-MGA blocked | ✅ YES | ✅ YES |
| Cross-tenant blocked | ✅ YES | ✅ YES |
| Masked not-found | ✅ YES | ✅ YES |
| Idempotency | ✅ YES | ✅ YES |
| Audit log written | ✅ YES | ✅ YES |
| Optimistic lock on update | N/A | ✅ YES |

---

## Section 8 — No-Runtime-Change Certification

This document was produced by static code analysis only.

| Certification item | Status |
|-------------------|--------|
| No source code files modified | ✅ CONFIRMED |
| No entity records created or modified | ✅ CONFIRMED |
| No feature flags changed | ✅ CONFIRMED |
| Gate 6C activation state unchanged | ✅ CONFIRMED — `MGA_REPORT_EXPORTS_ENABLED = true` unchanged |
| Gate 6D activation state unchanged | ✅ CONFIRMED — `MGA_EXPORT_HISTORY_ENABLED = false` unchanged |
| No `MasterGroup` or `master_group_id` renamed | ✅ CONFIRMED — internal model preserved |
| No permissions broadened | ✅ CONFIRMED |
| No scopeGate weakened | ✅ CONFIRMED |

---

## Document Control

| Field | Value |
|-------|-------|
| Document ID | MGA_BROKER_AGENCY_INVITE_AND_ONBOARDING_CAPABILITY_CHECK |
| Version | 1.0 |
| Date | 2026-05-12 |
| Author | Platform Engineering — Static Analysis |
| Registry | `docs/QUOTE_CONNECT_360_GATE_REGISTRY.json` |
| Next update trigger | Operator authorization of Broker / Agency create gate, or invite flow enhancement |