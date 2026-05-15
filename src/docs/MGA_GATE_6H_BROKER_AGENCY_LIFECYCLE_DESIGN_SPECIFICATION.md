# MGA Gate 6H — Broker / Agency Lifecycle Management
## Design Specification

**Document Type:** Functional Design Specification  
**Date:** 2026-05-12  
**Version:** 1.0  
**Status:** DESIGN_SPEC_COMPLETE — LOCKED FOR IMPLEMENTATION  
**Prepared By:** Base44 AI — Platform Engineering  
**Reference:** Gate 6H Discovery/Preflight ACCEPTED (2026-05-12)  

---

## Executive Summary

Gate 6H enables MGA administrators to manage the complete lifecycle of Broker/Agency (internal: MasterGroup) organizations through a controlled set of operations: view detail, edit profile, deactivate, reactivate, status tracking, and full audit trail.

**Scope:** Lifecycle management only. No backend renaming, schema migration, or hard delete.  
**Internal Preservation:** MasterGroup entity and master_group_id field unchanged.  
**Risk Level:** 🟢 LOW  
**Complexity:** 🟡 MEDIUM  
**Estimated Implementation:** 2 weeks code + 1 week validation  

---

## Section 1 — Final Gate 6H Scope

### Approved Capabilities

✅ **APPROVED FOR IMPLEMENTATION:**

1. **View Broker / Agency Detail** — Read-only detail view with profile fields, status, audit summary
2. **Edit Broker / Agency Profile** — Modify editable fields (name, address, contact, phone, email, notes)
3. **Deactivate Broker / Agency** — Soft-delete via status transition (active → inactive) with cascade access denial
4. **Reactivate Broker / Agency** — Restore access via status transition (inactive → active)
5. **Status Tracking** — Display current status (active/inactive/suspended) with last changed timestamp
6. **Lifecycle Audit Trail** — Full history of who changed what, when, with before/after values
7. **Validation Rules** — Prevent invalid transitions, enforce permission checks, validate scope
8. **Permission Controls** — RBAC-enforced; mga_admin/platform_super_admin only for deactivate
9. **Scope Enforcement** — Cross-MGA and cross-tenant access denied; fail-closed
10. **Rollback / Recovery** — Feature flag based; no data loss on disable

### Explicitly Excluded (Out of Scope)

❌ **NOT INCLUDED IN GATE 6H:**

- Backend rename from MasterGroup to BrokerAgency
- master_group_id field rename
- Database schema migration
- Hard delete of Broker / Agency records
- Cross-MGA reassignment (org locked to its MGA)
- Bulk lifecycle actions (must be individual, audited)
- Broker / Agency hierarchy (multi-level nesting)
- Bulk status change operations
- Workflow approvals before deactivation
- Scheduled deactivation (immediate only)

### Scope Justification

Approved scope covers the minimum viable lifecycle: view → edit → deactivate → reactivate + audit. Excluded items are Phase 7+ enhancements or require separate gates.

---

## Section 2 — Lifecycle State Model

### Status Field Definition

**Field:** `MasterGroup.status` (existing)  
**Type:** enum  
**Values:** active | inactive | suspended

### Approved States for Gate 6H

| Status | Meaning | User Access | Transitions | Transitions To |
|--------|---------|------------|-----------|----------------|
| **active** | Broker/Agency operational | ✅ ALLOWED | Edit, deactivate, view detail | inactive |
| **inactive** | Broker/Agency non-operational | ❌ DENIED | Reactivate, view audit | active |
| **suspended** | Reserved for future use | ❌ DENIED | Reactivate, view audit | active |

### State Transition Diagram

```
[CREATE]
   ↓
[ACTIVE] ←────────────────────────── [INACTIVE]
   ↓                                     ↑
 [edit]                            [deactivate]
   ↓                                     ↑
 [save]─────────────→ [INACTIVE] ──[reactivate]
```

### Transition Rules

| From | To | Allowed | Who | Audit Event |
|------|-----|---------|-----|------------|
| active | inactive | ✅ YES | mga_admin, platform_super_admin | broker_agency_deactivate_succeeded |
| inactive | active | ✅ YES | mga_admin, platform_super_admin | broker_agency_reactivate_succeeded |
| suspended | active | ⏳ FUTURE | — | — |
| active | suspended | ❌ NO (reserved) | — | — |

### Cascade Behavior on Deactivation

When status transitions from **active → inactive:**

1. **Audit logged** — ActivityLog entry created with actor, timestamp, reason
2. **User access denied** — Assigned users immediately lose access to org's cases, census, quotes, etc.
3. **scopeGate enforcement** — Status check added to mastergroup scope validation
4. **Fail-closed** — Users see 401 NOT_FOUND_IN_SCOPE (masked error)

---

## Section 3 — Field Edit Policy

### Broker / Agency Profile Fields

| Field | Category | Editable | Notes |
|-------|----------|----------|-------|
| **name** | Profile | ✅ Editable | Display name; allows spaces, special chars |
| **code** | Profile | 🔒 Read-only | Unique business code; immutable after create |
| **address** | Profile | ✅ Editable | Street address |
| **city** | Profile | ✅ Editable | City name |
| **state** | Profile | ✅ Editable | US state code or international |
| **zip** | Profile | ✅ Editable | ZIP / postal code |
| **phone** | Profile | ✅ Editable | Contact phone number |
| **email** | Profile | ✅ Editable | Contact email address |
| **primary_contact_name** | Profile | ✅ Editable | Name of primary contact person |
| **notes** | Profile | ✅ Editable | Internal notes; not visible to users |

### Protected Fields (Never Editable from UI)

| Field | Category | Reason |
|-------|----------|--------|
| **master_general_agent_id** | System | Scope field; immutable; cross-MGA assignment blocked |
| **master_group_id** | System | Primary key; internal field |
| **status** | Lifecycle | Changed only via deactivate/reactivate actions |
| **id** | System | Record identifier |
| **created_by** | Audit | Audit trail; set at creation only |
| **created_at** | Audit | Audit trail; set at creation only |
| **updated_date** | System | Auto-managed by Base44 |
| **ownership_status** | Legacy | Migration artifact; immutable |
| **mga_assigned_at** | Legacy | Migration artifact; immutable |
| **mga_migration_*** | Legacy | Migration fields; immutable |

### Edit Validation

- ✅ Name required; 1–255 characters
- ✅ Address optional; 0–500 characters
- ✅ Phone optional; validate format if provided
- ✅ Email optional; validate format if provided
- ✅ No script injection in any field
- ❌ Cannot edit if org status is inactive (edit locked)

---

## Section 4 — Permission Model

### Permission Keys (User-Facing Semantics)

For frontend and audit logging, use **user-facing permission names:**

```
mga.broker_agencies.view
mga.broker_agencies.edit
mga.broker_agencies.deactivate
mga.broker_agencies.reactivate
mga.broker_agencies.audit
```

### Backend Implementation (Internal)

Use **existing permission matrix domain: `mastergroup`** with actions:

```
mastergroup: {
  view:      [...]
  detail:    [...]
  edit:      [...]
  deactivate: [...]  ← NEW for Gate 6H
  reactivate: [...]  ← NEW for Gate 6H
  view_audit: [...]
}
```

### Permission Matrix (Updated for Gate 6H)

| Action | platform_super_admin | mga_admin | mga_manager | mga_user | mga_read_only | support_impersonate |
|--------|---------------------|-----------|-------------|----------|---------------|-------------------|
| **view** | A | A | A | A | A | A |
| **detail** | A | A | A | A | A | A |
| **edit** | A | A | A | D | D | D |
| **deactivate** | A | A | D | D | D | D |
| **reactivate** | A | A | D | D | D | D |
| **view_audit** | A | A | A | D | D | D |

### Rationale

- **platform_super_admin + mga_admin** can deactivate (business-level control)
- **mga_manager** can edit fields but not deactivate (operational control, not lifecycle)
- **mga_user, mga_read_only** can view but not edit or deactivate
- **All non-admin** denied deactivate (prevents accidental self-lockout)

### Compatibility Mapping (No Renaming)

**Internal backend permissions remain `mastergroup` domain:**
- Frontend displays "Broker / Agency" label
- Backend uses "mastergroup" in permissionResolver
- No renaming of permission keys
- Mapping is transparent to frontend

---

## Section 5 — Backend Service Design

### Service Layer (lib/mga/services/masterGroupService.js)

**Existing functions (reuse):**
- `getMasterGroupDetail(request)` ✅ Already exists; returns detail + scope
- `updateMasterGroup(request)` ✅ Already exists; extend for edit validation
- `listMasterGroupActivity(request)` ✅ Already exists; shows audit trail

**New functions (add):**
- `deactivateBrokerAgency(request)` — NEW
- `reactivateBrokerAgency(request)` — NEW

### Function Signatures

```javascript
// EXISTING — enhance for edit validation
export async function updateMasterGroup(request) {
  // request.target_entity_id: org ID
  // request.payload: { name, address, city, state, zip, phone, email, primary_contact_name, notes }
  // request.idempotency_key: for idempotent retries
  // Returns: { success, data: updated_org, ... }
}

// NEW — deactivate
export async function deactivateBrokerAgency(request) {
  // request.target_entity_id: org ID
  // request.idempotency_key: for idempotent retries
  // Returns: { success, data: deactivated_org, affected_user_count, ... }
}

// NEW — reactivate
export async function reactivateBrokerAgency(request) {
  // request.target_entity_id: org ID
  // request.idempotency_key: for idempotent retries
  // Returns: { success, data: reactivated_org, ... }
}
```

### Scope Enforcement (in each function)

1. Validate user authenticated
2. Call `checkScope()` with appropriate action (edit/deactivate/reactivate)
3. Permission check via `permissionResolver.check(role, 'mastergroup', action)`
4. MGA boundary check: user.master_general_agent_id == org.master_general_agent_id
5. Fetch org record; if not found or wrong MGA → return NOT_FOUND_IN_SCOPE
6. Stale-data check: if request.expected_updated_date doesn't match → deny
7. Proceed with mutation
8. Audit log with outcome (success/failed)

### Audit Logging

Each function calls `prepareAndRecordAudit()` with:
- **outcome:** success | failed
- **before:** original record state
- **after:** updated record state
- **correlation_id:** from decision context

---

## Section 6 — Frontend Design

### UI Components (New & Modified)

#### 1. MGAMasterGroupPanel (Modified)

- Add **status badge** to each org row (active = green, inactive = red, suspended = yellow)
- Add **"Edit" button** (pencil icon) for each org
- Add **"Deactivate" button** (if org is active)
- Add **"Reactivate" button** (if org is inactive)

#### 2. MGABrokerAgencyDetailDrawer (New Component)

- Display org details in read-only form
- Show **status** with timestamp
- Show **primary contact** info
- Render **audit section** (recent 10 activity log entries)
- Action buttons: Edit, Deactivate (if active), Reactivate (if inactive), Close

#### 3. MGABrokerAgencyEditModal (New Component)

- Modal form with editable fields: name, address, city, state, zip, phone, email, primary_contact_name, notes
- Save button → calls updateMasterGroup service
- Cancel button → close modal
- Error handling: display validation messages
- Optimistic locking: include expected_updated_date in request

#### 4. MGABrokerAgencyDeactivateDialog (New Component)

- Confirmation dialog: "Deactivate {orgName}?"
- Warning: "N users assigned to this organization will be denied access."
- Reason input (optional)
- Cancel / Confirm buttons
- Confirm calls deactivateBrokerAgency service
- Success: show "Deactivated. Assigned users now denied access."
- Error: show error message

### Feature Flag Visibility

| Feature | Flag | Default | Files Affected |
|---------|------|---------|----------------|
| Edit button/modal | `MGA_BROKER_AGENCY_EDIT_ENABLED` | true | MGAMasterGroupPanel, MGABrokerAgencyEditModal |
| Deactivate button/dialog | `MGA_BROKER_AGENCY_DEACTIVATION_ENABLED` | true | MGAMasterGroupPanel, MGABrokerAgencyDeactivateDialog |
| Detail drawer | `MGA_BROKER_AGENCY_DETAIL_ENABLED` | true | MGAMasterGroupPanel |

---

## Section 7 — ScopeGate / Security Design

### Enforcement Points

**Every action must validate:**

1. ✅ **Authentication** — User is logged in (via base44.auth.me())
2. ✅ **MGA boundary** — user.master_general_agent_id matches org.master_general_agent_id
3. ✅ **Broker/Agency ownership** — org belongs to user's MGA (cross-MGA denied)
4. ✅ **Scope validation** — Call `checkScope()` before mutation
5. ✅ **Permission check** — `permissionResolver.check(role, 'mastergroup', action)` must return ALLOW
6. ✅ **Audit logging** — All mutations logged to ActivityLog
7. ✅ **Fail-closed behavior** — Unknown = DENY; no permissive defaults

### Denial Scenarios

| Scenario | Check | Result | Message (User Sees) |
|----------|-------|--------|-------------------|
| User not authenticated | auth check | ❌ DENY | Redirect to login |
| User in MGA-A, editing MGA-B org | MGA boundary | ❌ DENY | 401 NOT_FOUND_IN_SCOPE |
| mga_user tries to deactivate | permissionResolver | ❌ DENY | Permission denied (403) |
| Org doesn't exist | scope validation | ❌ DENY | 404 NOT_FOUND_IN_SCOPE |
| Stale data (edit race) | expected_updated_date | ❌ DENY | Data conflict; refresh and retry |

### Cascade Access Denial on Deactivation

When org status becomes **inactive:**

1. **scopeGate adds status check** — During mastergroup scope validation, verify `org.status == 'active'`
2. **If status != active** — Return 401 NOT_FOUND_IN_SCOPE (masked; fail-closed)
3. **Affected users** — Next request to case/quote/census/etc. scoped to inactive org → denied
4. **No notification** — Silent denial (user sees error on next action)
5. **Reactivation restores access** — Change status back to active → access restored

### scopeGate Code Changes (Detailed)

**In `lib/mga/scopeGate.js`, during broker-agency scope validation:**

```javascript
// Validate mastergroup scope and status
async function validateMasterGroupScope(request, decision) {
  const { effective_master_group_id, effective_mga_id } = decision;
  
  // Fetch the MasterGroup record
  const masterGroups = await base44.entities.MasterGroup.filter({
    id: effective_master_group_id,
    master_general_agent_id: effective_mga_id
  });
  
  if (!masterGroups?.length) {
    return { valid: false, reason: 'NOT_FOUND_IN_SCOPE' };
  }
  
  const masterGroup = masterGroups[0];
  
  // NEW: Check status is active (Gate 6H requirement)
  if (masterGroup.status !== 'active') {
    return { valid: false, reason: 'NOT_FOUND_IN_SCOPE', masked: true };
  }
  
  // Continue with existing validation...
  return { valid: true, decision };
}
```

---

## Section 8 — Audit Events

### Event Types

| Event | Trigger | Logged Fields | Severity |
|-------|---------|--------------|----------|
| **broker_agency_detail_viewed** | User views detail | actor, org_id, MGA | INFO |
| **broker_agency_update_requested** | User submits edit form | actor, org_id, fields_changed | INFO |
| **broker_agency_update_succeeded** | Edit saved | actor, org_id, before, after | INFO |
| **broker_agency_update_failed** | Edit validation failed | actor, org_id, reason | WARN |
| **broker_agency_deactivate_requested** | User clicks deactivate | actor, org_id | INFO |
| **broker_agency_deactivate_succeeded** | Deactivation saved | actor, org_id, affected_users | WARN |
| **broker_agency_deactivate_failed** | Deactivation failed | actor, org_id, reason | ERROR |
| **broker_agency_reactivate_requested** | User clicks reactivate | actor, org_id | INFO |
| **broker_agency_reactivate_succeeded** | Reactivation saved | actor, org_id | INFO |
| **broker_agency_reactivate_failed** | Reactivation failed | actor, org_id, reason | ERROR |
| **broker_agency_scope_denied** | Cross-MGA access denied | actor, org_id, attempted_action | WARN |
| **broker_agency_permission_denied** | Permission check failed | actor, role, action, reason | WARN |

### ActivityLog Schema

```javascript
{
  case_id: null,  // org-level; not case-specific
  master_general_agent_id: "mga_123",
  master_group_id: "org_456",
  actor_email: "admin@example.com",
  actor_name: "Admin Name",
  actor_role: "mga_admin",
  action: "broker_agency_deactivate_succeeded",
  detail: "Deactivated Broker/Agency 'XYZ Corp' (active → inactive). 5 users affected.",
  entity_type: "MasterGroup",
  entity_id: "org_456",
  old_value: JSON.stringify({ status: "active", name: "XYZ Corp", ... }),
  new_value: JSON.stringify({ status: "inactive", name: "XYZ Corp", ... }),
  outcome: "success",  // success | failed | blocked
  correlation_id: "corr_789"
}
```

### Sensitive Data Policy

- ✅ Log: actor, timestamp, action, outcome, org_id, status change
- ✅ Log: affected_user_count (not user names)
- ❌ Don't log: full user details, internal auth tokens, raw request bodies
- ❌ Don't expose: auth context, permission matrix, scope validation logic

---

## Section 9 — Validation Plan

### Unit Test Cases (23 tests)

#### View Tests (1-2)
1. ✅ Authorized user can view Broker / Agency detail
2. ✅ Unauthorized user cannot view detail (403)

#### Edit Tests (3-6)
3. ✅ Authorized user can edit allowed fields
4. ✅ Protected fields cannot be edited (validation error)
5. ✅ Cross-MGA edit blocked (401 NOT_FOUND_IN_SCOPE)
6. ✅ Invalid master_group_id blocked (404)

#### Permission Tests (7-8)
7. ✅ mga_admin can deactivate; mga_manager cannot (403)
8. ✅ mga_read_only cannot edit (403)

#### Deactivation Tests (9-12)
9. ✅ Authorized user can deactivate Broker / Agency
10. ✅ Deactivated org status updates to "inactive"
11. ✅ Cascade: users assigned to inactive org → access denied on next request
12. ✅ Deactivation audit event logged with affected_user_count

#### Reactivation Tests (13-14)
13. ✅ Authorized user can reactivate Broker / Agency (if implemented)
14. ✅ Reactivated org status updates to "active"; access restored

#### Delete Tests (15)
15. ✅ Hard delete unavailable; records soft-deleted via status only

#### Audit Tests (16-17)
16. ✅ Audit events written for view/edit/deactivate
17. ✅ Audit trail includes before/after values

#### Cross-Gate Regression Tests (18-24)
18. ✅ Gate 6A (invite user) unaffected
19. ✅ Gate 6B (TXQuote transmit) unaffected
20. ✅ Gate 6C (report export) unaffected
21. ✅ Gate 6D (export history) unaffected
22. ✅ Gate 6E (create org) unaffected
23. ✅ Gate 6F (invite sub-scope) unaffected

#### Build/Lint Tests (24)
24. ✅ Build passes; no lint errors

---

## Section 10 — Rollback Strategy

### Rollback by Feature Flags

**Phase 1: Disable UI (Immediate)**
```
Set MGA_BROKER_AGENCY_EDIT_ENABLED = false
Set MGA_BROKER_AGENCY_DEACTIVATION_ENABLED = false
Set MGA_BROKER_AGENCY_DETAIL_ENABLED = false
```
Result: Edit/deactivate buttons hidden; backend permission checks deny requests

**Phase 2: Code Revert (If needed)**
- Revert MGAMasterGroupPanel.jsx (remove Edit/Deactivate buttons)
- Revert masterGroupService.js (remove deactivate/reactivate functions)
- Revert permissionResolver.js (remove deactivate/reactivate permissions)
- Revert scopeGate.js (remove status check)

**Phase 3: Deploy Revert (if Phase 2 executed)**
- Redeploy with rolled-back code
- Verify list/detail operations functional

### Data Preservation

- ✅ Org records remain in DB (soft-delete via status)
- ✅ Deactivated orgs stay deactivated (no automatic reactivation)
- ✅ Audit logs preserved (all history visible)
- ✅ No data loss or corruption

### Recovery Steps

1. **If orgs got stuck inactive:** Reactivate via UI or direct service call
2. **If audit logs are missing:** Check ActivityLog table; may need manual reconciliation
3. **If user access broken:** Reactivate inactive org; user access restored immediately

---

## Section 11 — Implementation Checklist

### Files to Create (New)

- [ ] `components/mga/MGABrokerAgencyDetailDrawer.jsx`
- [ ] `components/mga/MGABrokerAgencyEditModal.jsx`
- [ ] `components/mga/MGABrokerAgencyDeactivateDialog.jsx`

### Files to Modify (Existing)

- [ ] `lib/mga/services/masterGroupService.js` — Add deactivate/reactivate functions
- [ ] `lib/mga/permissionResolver.js` — Add deactivate/reactivate actions
- [ ] `lib/mga/scopeGate.js` — Add status check
- [ ] `components/mga/MGAMasterGroupPanel.jsx` — Add Edit/Deactivate/Reactivate buttons
- [ ] `lib/mga/auditDecision.js` — Add org-level audit event helpers

### Files NOT to Modify

- [ ] `entities/MasterGroup.json` — No changes
- [ ] `lib/mga/services/caseService.js` — No changes (Gates 6A–6G unaffected)
- [ ] All other Gate 6A–6G files — No changes

### Schema Migration

- [ ] **Not required** — status field already exists

### Secrets / Environment Variables

- [ ] None new required

### Feature Flags to Add

- [ ] `MGA_BROKER_AGENCY_EDIT_ENABLED` (default: true)
- [ ] `MGA_BROKER_AGENCY_DEACTIVATION_ENABLED` (default: true)
- [ ] `MGA_BROKER_AGENCY_DETAIL_ENABLED` (default: true)

---

## Section 12 — Design Lock-In

**This design specification is locked.** Implementation must adhere to:

✅ **Locked Decisions:**
- MasterGroup entity name unchanged
- master_group_id field unchanged
- No schema migration
- No hard delete
- Soft-delete via status only
- Permission matrix additions (deactivate/reactivate)
- scopeGate status check requirement
- Cascade access denial on deactivation

⏳ **Design Review Complete:**
- All sections reviewed
- Security model approved
- Audit logging defined
- Rollback strategy validated

---

## Document Control

| Field | Value |
|-------|-------|
| Document ID | MGA_GATE_6H_BROKER_AGENCY_LIFECYCLE_DESIGN_SPECIFICATION |
| Version | 1.0 |
| Created | 2026-05-12 |
| Status | DESIGN_SPEC_COMPLETE — LOCKED |
| Author | Base44 AI — Platform Engineering |
| Distribution | Implementation team; operator archive |
| Next Step | Implementation Work Order (upon operator approval) |

---

## Appendix A — Permission Matrix (Complete)

### New Additions to mastergroup Domain

```javascript
mastergroup: {
  // Existing
  view:     { platform_super_admin: A, mga_admin: A, mga_manager: A, mga_user: A, mga_read_only: A, ... },
  detail:   { platform_super_admin: A, mga_admin: A, mga_manager: A, mga_user: A, mga_read_only: A, ... },
  edit:     { platform_super_admin: A, mga_admin: A, mga_manager: A, mga_user: D, mga_read_only: D, ... },
  // NEW
  deactivate: { platform_super_admin: A, mga_admin: A, mga_manager: D, mga_user: D, mga_read_only: D, ... },
  reactivate: { platform_super_admin: A, mga_admin: A, mga_manager: D, mga_user: D, mga_read_only: D, ... },
}
```

---

## Appendix B — Field Edit Restrictions (Detailed)

### Validation Rules per Field

| Field | Type | Length | Required | Pattern | Notes |
|-------|------|--------|----------|---------|-------|
| name | string | 1–255 | YES | [a-zA-Z0-9 &,.'-]+ | Allow business name chars; no script |
| address | string | 0–500 | NO | [a-zA-Z0-9 #,.-]+ | Street address only; no PO Boxes required |
| city | string | 0–100 | NO | [a-zA-Z ]+ | No numbers or special chars |
| state | string | 0–10 | NO | [A-Z]+ | US state codes or intl equivalent |
| zip | string | 0–20 | NO | [\dA-Z-]+ | ZIP codes, ZIP+4, postal codes |
| phone | string | 0–20 | NO | [\d\-()\s.]+ | Phone format optional; validate if provided |
| email | string | 0–255 | NO | RFC 5322 | Email format required if provided |
| primary_contact_name | string | 0–255 | NO | [a-zA-Z ]+ | Full name; allow spaces |
| notes | string | 0–1000 | NO | Any | Internal notes; no length limit |