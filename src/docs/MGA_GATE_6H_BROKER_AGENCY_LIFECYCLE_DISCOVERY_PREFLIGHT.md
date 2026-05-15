# MGA Gate 6H — Broker / Agency Lifecycle Management
## Discovery & Preflight Report

**Document Type:** Discovery / Preflight Analysis  
**Date:** 2026-05-12  
**Version:** 1.0  
**Status:** DISCOVERY_COMPLETE — AWAITING_OPERATOR_REVIEW  
**Prepared By:** Base44 AI — Platform Engineering  
**Reference:** Gates 6A–6G CLOSED; Next Phase Recommendation (2026-05-12)  

---

## Executive Summary

Gate 6H enables MGA administrators to manage the complete lifecycle of Broker/Agency (internal entity: MasterGroup) organizations: view, edit, deactivate, reactivate, status tracking, and audit trails.

**Discovery Status:** ✅ COMPLETE  
**Recommended Action:** ✅ PROCEED with Gate Design  
**Risk Level:** 🟢 LOW  
**Complexity:** 🟡 MEDIUM  
**Estimated Timeline:** 2 weeks design + 2 weeks implementation + 1 week validation  

---

## Section 1 — Current Capability Baseline

### Existing MasterGroup Capabilities (Gates 6E)

| Feature | Capability | Status |
|---------|-----------|--------|
| **Create** | MGA admins can create Broker/Agency orgs | ✅ LIVE (Gate 6E) |
| **List** | MGA admins can list Broker/Agencies in scope | ✅ LIVE (Gate 6E) |
| **Read Detail** | MGA admins can view org details | ✅ LIVE (Gate 6E) |
| **Invite Sub-Scope** | MGA admins can assign org to new users | ✅ LIVE (Gate 6F) |
| **Edit** | Edit existing org details | ❌ NOT YET IMPLEMENTED |
| **Deactivate** | Soft-delete (mark as inactive) | ❌ NOT YET IMPLEMENTED |
| **Reactivate** | Re-enable deactivated org | ❌ NOT YET IMPLEMENTED |
| **Status Tracking** | View current status (active/inactive/suspended) | ⚠️ PARTIAL (status field exists but unused) |
| **Audit History** | Track who changed what, when | ✅ AVAILABLE (ActivityLog entity) |
| **Cascade Rules** | Deactivate org → deny user access | ❌ NOT YET IMPLEMENTED |

### Gap Analysis

**Functional Gaps:**
- No UI to edit org profile fields (name, address, contact, phone, email)
- No deactivation workflow (users still have access to deactivated orgs)
- No reactivation capability
- Status field exists in schema but not used in access control

**Scope Gap:**
- Current design assumes users stay assigned to orgs forever
- No lifecycle management for changing business relationships

**Security Gap:**
- No cascade denial: deactivating an org doesn't deny access to assigned users
- User access checks don't verify org status

---

## Section 2 — Existing MasterGroup / Broker-Agency Fields

### Current MasterGroup Entity Schema

```json
{
  "name": "MasterGroup",
  "properties": {
    "master_general_agent_id": "string (required, scope field)",
    "mga_assigned_at": "date-time",
    "mga_assigned_by": "string (email)",
    "ownership_status": "enum: unassigned|assigned|disputed|quarantined",
    "name": "string (required, display name)",
    "code": "string (unique business code)",
    "status": "enum: active|inactive|suspended (default: active)",
    "address": "string",
    "city": "string",
    "state": "string",
    "zip": "string",
    "phone": "string",
    "email": "string",
    "primary_contact_name": "string",
    "notes": "string",
    "mga_migration_batch_id": "string (legacy)",
    "mga_migration_status": "enum (legacy)",
    "mga_migration_anomaly_class": "enum (legacy)",
    "mga_migration_anomaly_detail": "string (legacy)",
    "mga_business_approval_status": "enum (legacy)",
    "mga_business_approver": "string (legacy)",
    "mga_business_approved_at": "date-time (legacy)"
  }
}
```

### Editable Profile Fields for Gate 6H

| Field | Type | Editable | Notes |
|-------|------|----------|-------|
| **name** | string | ✅ YES | Broker/Agency display name |
| **code** | string | ⚠️ MAYBE | Unique identifier; immutable after creation? |
| **address** | string | ✅ YES | Street address |
| **city** | string | ✅ YES | City |
| **state** | string | ✅ YES | State |
| **zip** | string | ✅ YES | ZIP code |
| **phone** | string | ✅ YES | Contact phone |
| **email** | string | ✅ YES | Contact email |
| **primary_contact_name** | string | ✅ YES | Primary contact person |
| **notes** | string | ✅ YES | Internal notes |
| **status** | enum | ✅ YES | Control lifecycle (active → inactive → suspended) |

### Status Field Usage

**Current state:** `status` field exists but is inert (access control doesn't check it).

**Gate 6H requirement:** Enforce `status` in access control:
- **active** → users assigned to org can access cases, quotes, census, etc.
- **inactive** → users assigned to org → access denied; fail-closed
- **suspended** → (future use; same as inactive for now)

---

## Section 3 — Existing masterGroupService CRUD Capabilities

### Service Layer Functions

| Function | Exists | Scope-Gated | Notes |
|----------|--------|-------------|-------|
| **createMasterGroup** | ✅ YES | ✅ YES | Gate 6E; validates scope |
| **listMasterGroups** | ✅ YES | ✅ YES | Gate 6E; filters by MGA |
| **getMasterGroupDetail** | ✅ YES | ✅ YES | Gate 6E; scoped read |
| **updateMasterGroup** | ✅ YES | ✅ YES | Gate 6E basic edit; READY FOR EXPANSION |
| **archiveMasterGroup** | ✅ YES | ✅ YES | Sets status → "archived" (LEGACY; rename to deactivate?) |
| **getMasterGroupSummary** | ✅ YES | ✅ YES | Summary + case count |
| **listMasterGroupActivity** | ✅ YES | ✅ YES | Audit trail (ActivityLog) |

### Implementation Notes

**Good news:** `updateMasterGroup` already exists and is scope-gated!

**Issue:** `archiveMasterGroup` function sets status to "archived" — but MasterGroup schema uses "active|inactive|suspended", not "archived".

**Recommendation:** 
- Extend `updateMasterGroup` to handle status transitions (active → inactive, inactive → active)
- Rename or deprecate `archiveMasterGroup` to align with schema
- Add permission check for `deactivate` action (only mga_admin)

---

## Section 4 — Current UI Gaps

### Existing UI Components

| Component | Location | Gate | Status |
|-----------|----------|------|--------|
| **MGAMasterGroupPanel** | `components/mga/` | 6E | ✅ Exists; lists orgs, create button |
| **MGACreateBrokerAgencyModal** | `components/mga/` | 6E | ✅ Exists; create form |
| **Broker/Agency dropdown** | `components/mga/MGAInviteUserModal.jsx` | 6F | ✅ Exists; sub-scope selector |

### Missing UI for Gate 6H

- **Edit modal** — click org → open edit form → modify fields → save
- **Deactivate button** — "Deactivate this Broker/Agency"
- **Reactivate button** — "Reactivate" (only for inactive orgs)
- **Status badge** — show active/inactive/suspended status
- **Confirmation dialog** — "Are you sure? This will deny access to N assigned users."
- **Audit panel** — show history of changes (already available via listMasterGroupActivity)

---

## Section 5 — Proposed Lifecycle States

### State Machine

```
    [Create]
       ↓
   [ACTIVE] ← ← ← ← ← ← ← ← [INACTIVE]
      ↓                          ↑
   [edit fields]           [deactivate]
      ↓                          ↑
   [save]──────→[INACTIVE]──[reactivate]
              
Optional future: [INACTIVE] → [SUSPENDED] (holds place; doesn't update users)
```

### State Definitions

| State | User Access | Editable | Transitions | Cascade Action |
|-------|-------------|----------|-------------|----------------|
| **ACTIVE** | ✅ Allowed | ✅ YES (edit org) | → INACTIVE | N/A |
| **INACTIVE** | ❌ DENIED | ❌ NO (except by reactivation) | → ACTIVE | Deny user access |
| **SUSPENDED** | ❌ DENIED | ❌ NO | → ACTIVE | Deny user access (future) |

### User Access Impact (Cascade Rule)

When `status` changes from active → inactive:
- All users currently assigned to this Broker/Agency → immediately lose access
- scopeGate check must verify both `master_general_agent_id` AND `master_group_id.status == 'active'`
- Failed check → return 401 NOT_FOUND_IN_SCOPE (fail-closed)

---

## Section 6 — Required Permissions

### Current Permission Matrix (mastergroup domain)

From `lib/mga/permissionResolver.js`:

```
mastergroup: {
  view:     [platform_super_admin, mga_admin, mga_manager, mga_user, mga_read_only]
  read:     [platform_super_admin, mga_admin, mga_manager, mga_user, mga_read_only]
  list:     [platform_super_admin, mga_admin, mga_manager, mga_user, mga_read_only]
  detail:   [platform_super_admin, mga_admin, mga_manager, mga_user, mga_read_only]
  create:   [platform_super_admin, mga_admin]
  edit:     [platform_super_admin, mga_admin, mga_manager]  ← ALREADY EXISTS
  delete:   [platform_super_admin, mga_admin]
  approve:  [platform_super_admin, mga_admin, mga_manager]
  export:   [platform_super_admin, mga_admin, mga_manager, mga_user]
  view_audit: [platform_super_admin, mga_admin, mga_manager]
}
```

### New Permissions Needed for Gate 6H

**Option A: Reuse existing `delete` action as `deactivate`**
- ✅ Minimal changes
- ❌ Semantics unclear (delete vs. deactivate are different)

**Option B: Add new `deactivate` action**
- ✅ Clear semantics
- ✅ Allows different permission levels for edit vs. deactivate (if needed)
- ❌ Requires adding row to permission matrix

**Recommendation:** Option B (add `deactivate` and `reactivate` actions)

### Proposed New Permission Matrix Entries

```javascript
// Add to mastergroup domain:
deactivate: {
  platform_super_admin: A,
  mga_admin: A,
  mga_manager: D,  // managers can edit, but not deactivate
  mga_user: D,
  mga_read_only: D,
  support_impersonation_read_only: D
}

reactivate: {
  platform_super_admin: A,
  mga_admin: A,
  mga_manager: D,  // same as deactivate
  mga_user: D,
  mga_read_only: D,
  support_impersonation_read_only: D
}
```

### Rationale

- `platform_super_admin` + `mga_admin` can deactivate (business admins only)
- `mga_manager` can edit org details but not deactivate (operational control)
- All other roles denied

---

## Section 7 — Required scopeGate Behavior

### Current scopeGate Implementation

`scopeGate.js` currently checks:
- User's `master_general_agent_id` matches target entity's `master_general_agent_id` ✅
- User's `master_group_id` (if assigned) matches target entity's `master_group_id` ✅
- Permission check via `permissionResolver.check(role, domain, action)` ✅

### New Requirement for Gate 6H

When accessing entities scoped to a Broker/Agency (master_group_id):
- **Before:** Check `master_group_id` matches user's assigned org
- **After:** Check `master_group_id` matches AND org.status == 'active'

### Implementation Detail

```javascript
// In scopeGate.js, during mastergroup scope validation:
if (userMasterGroupId === targetMasterGroupId) {
  // NEW: also check org status
  const masterGroupRecord = await base44.entities.MasterGroup.filter({
    id: targetMasterGroupId,
    master_general_agent_id: userMgaId
  });
  if (!masterGroupRecord?.length || masterGroupRecord[0].status !== 'active') {
    return { denied: true, reason: 'NOT_FOUND_IN_SCOPE', masked: true };
  }
  // continue...
}
```

### Affected Entity Access Patterns

When org becomes inactive, these users are denied:
- BenefitCase access (cases scoped to inactive org) → denied
- Census access (census versions scoped to inactive org) → denied
- Quotes access (quotes scoped to inactive org) → denied
- EnrollmentWindow access (enrollments scoped to inactive org) → denied
- EmployeeEnrollment access → denied

**Result:** Transparent fail-closed. Users see 401 / NOT_FOUND_IN_SCOPE.

---

## Section 8 — Required Audit Events

### ActivityLog Entry Template

```javascript
{
  case_id: null,  // org-level operation, not case-specific
  master_general_agent_id: "mga_123",
  master_group_id: "org_456",
  actor_email: "admin@example.com",
  actor_name: "Admin Name",
  actor_role: "mga_admin",
  action: "deactivate_broker_agency",  // or "edit_broker_agency"
  detail: "Deactivated Broker/Agency 'XYZ Corp' (status: active → inactive)",
  entity_type: "MasterGroup",
  entity_id: "org_456",
  old_value: '{"status":"active","name":"XYZ Corp","phone":"555-1234"}',
  new_value: '{"status":"inactive","name":"XYZ Corp","phone":"555-1234"}',
  outcome: "success",  // or "failed" if validation fails
  correlation_id: "corr_789"
}
```

### Audit Events to Log

| Event | Trigger | Fields Logged |
|-------|---------|---------------|
| **edit_broker_agency** | User edits org profile | actor, old values, new values, outcome |
| **deactivate_broker_agency** | User deactivates org | actor, old status, new status, user count affected |
| **reactivate_broker_agency** | User reactivates org | actor, old status, new status |

### User Impact Count

When deactivating, log: "N users assigned to this org will be denied access."

---

## Section 9 — Cross-MGA / Cross-Tenant Risk Assessment

### Threat Model

| Threat | Mitigation | Status |
|--------|-----------|--------|
| **User edits org in wrong MGA** | scopeGate enforces master_general_agent_id check | ✅ MITIGATED |
| **User deactivates org, denying themselves access** | Fail-closed; user can reactivate if still admin | ✅ ACCEPTABLE |
| **User edits org while other user is using it** | Stale-data check: expected_updated_date mismatch → deny | ✅ MITIGATED |
| **Cross-org cascade (deactivate affects wrong org's users)** | scopeGate filters mastergroup list by MGA; no cross-scope bleed | ✅ MITIGATED |
| **Cross-tenant access (MGA-A user accesses MGA-B org)** | scopeResolver only lists orgs in user's MGA | ✅ MITIGATED |

### Validation Points

- ✅ Scope check: `user.master_general_agent_id == target_org.master_general_agent_id`
- ✅ Permission check: `permissionResolver.check(role, 'mastergroup', 'deactivate')`
- ✅ Audit logging: all mutations logged with actor, old/new values
- ✅ Cascade validation: affected users identified and logged (informational)

---

## Section 10 — Files Likely Involved

### Core Entity File

- **`entities/MasterGroup.json`** — NO CHANGE (status field already exists; add timestamps if needed)

### Service Layer Files

- **`lib/mga/services/masterGroupService.js`** — Extend updateMasterGroup; add deactivateMasterGroup; add reactivateMasterGroup
- **`lib/mga/permissionResolver.js`** — Add `deactivate` and `reactivate` actions to mastergroup domain

### Scope Enforcement Files

- **`lib/mga/scopeGate.js`** — Add status check during mastergroup scope validation
- **`lib/mga/scopeResolver.js`** — No change (already filters by MGA)

### Audit Logging Files

- **`lib/mga/auditDecision.js`** — No change (already handles ActivityLog)
- **`lib/mga/services/auditService.js`** — Add helper for org-level audit events

### UI Component Files

- **`components/mga/MGAMasterGroupPanel.jsx`** — Add status badge, edit/deactivate buttons
- **`components/mga/MGAEditBrokerAgencyModal.jsx`** — NEW; edit form
- **`components/mga/MGADeactivateConfirmDialog.jsx`** — NEW; confirmation dialog with cascade warning

---

## Section 11 — Data / Schema Impact Assessment

### Entity Schema Changes

**MasterGroup Entity:**

| Field | Current | Proposed | Impact |
|-------|---------|----------|--------|
| **status** | enum: active/inactive/suspended | REUSE (no change) | ✅ NO CHANGE |
| **deactivated_at** | N/A | OPTIONAL: date-time | ⚠️ OPTIONAL ADD |
| **deactivated_by** | N/A | OPTIONAL: email | ⚠️ OPTIONAL ADD |
| **reactivated_at** | N/A | OPTIONAL: date-time | ⚠️ OPTIONAL ADD |

**Decision:** Status transitions logged via ActivityLog; optional timestamp fields for convenience but not required.

### Database Migration

**Migration Required?** ❌ NO

- Status field already exists
- New timestamps optional (can be added later if needed)
- No data loss or transformation required
- Existing records default to `status: active`

### Data Integrity

- ✅ No orphaned records (orgs stay in DB; access denied instead)
- ✅ No cascading deletes (soft-delete via status)
- ✅ Audit trail preserved (ActivityLog has full history)

---

## Section 12 — Proposed Feature Flag Strategy

### Feature Flags for Gate 6H

| Flag | Location | Default | Purpose |
|------|----------|---------|---------|
| `MGA_BROKER_AGENCY_EDIT_ENABLED` | `components/mga/MGAMasterGroupPanel.jsx` | `true` | Toggle edit button visibility |
| `MGA_BROKER_AGENCY_DEACTIVATION_ENABLED` | `components/mga/MGAMasterGroupPanel.jsx` | `true` | Toggle deactivate button visibility |

### Rollback Strategy

Set both flags to `false` → edit/deactivate UI hidden; backend fails-closed on permission check.

---

## Section 13 — Validation / Test Requirements

### Unit Tests

| Test | Scope |
|------|-------|
| **Permission checks** | mga_admin can deactivate; mga_manager cannot |
| **Scope validation** | Can't deactivate org in different MGA |
| **Status transitions** | active → inactive → active (revert) |
| **Stale-data handling** | Prevent race conditions during edit |

### Integration Tests

| Test | Scope |
|------|-------|
| **Cascade access denial** | Deactivate org → assigned user access denied on next request |
| **Cross-gate regression** | Gates 6A–6G unaffected; list/detail operations still work |
| **Audit logging** | All mutations logged to ActivityLog with correct scope fields |

### End-to-End Tests

| Test | Scope |
|------|-------|
| **Edit flow** | Open org → edit fields → save → changes persisted |
| **Deactivate flow** | Deactivate → confirmation → status changed → user denied access |
| **Reactivate flow** | Reactivate → confirmation → status changed → user access restored |

---

## Section 14 — Rollback Strategy

### Flag-Based Rollback

**Option 1: Quick (via feature flags)**
- Set `MGA_BROKER_AGENCY_EDIT_ENABLED = false` → UI hidden, backend permission check denies
- Set `MGA_BROKER_AGENCY_DEACTIVATION_ENABLED = false` → UI hidden, deactivate requests denied
- Takes effect immediately; no data loss

**Option 2: Code Revert**
- Revert changes to MGAMasterGroupPanel.jsx, masterGroupService.js, permissionResolver.js
- Orgs remain in current state (some may be inactive)
- Requires redeployment

### Rollback Impact

- ✅ No data loss (status field values preserved)
- ✅ No orphaned records (inactive orgs remain, just inaccessible until reactivated)
- ✅ Access restored to users when org reactivated or flag re-enabled

### Regression Prevention

- Run Gates 6A–6G smoke tests after rollback
- Verify list/detail/create operations still functional
- Confirm user access denied/allowed based on org status

---

## Section 15 — Discovery Findings & Recommendation

### Key Findings

| Finding | Status |
|---------|--------|
| **MasterGroup entity has status field** | ✅ YES; ready for use |
| **masterGroupService.updateMasterGroup exists** | ✅ YES; ready for extension |
| **scopeGate properly filters by MGA** | ✅ YES; can add status check |
| **permissionResolver flexible** | ✅ YES; can add deactivate/reactivate actions |
| **ActivityLog available for auditing** | ✅ YES; audit trail fully supported |
| **UI components for list/create exist** | ✅ YES; can extend with edit/deactivate |
| **No schema migration needed** | ✅ TRUE; status field already exists |
| **No cross-MGA risks identified** | ✅ TRUE; scopeGate prevents leakage |

### Complexity Assessment

**Estimated Effort:**
- **Design:** 2 weeks (clarify cascade rules, state machine, permission model)
- **Implementation:** 2 weeks (service layer, UI, audit logging)
- **Validation:** 1 week (unit + integration + E2E tests)
- **Total:** 5 weeks

**Risk Level:** 🟢 **LOW** (status field exists; service layer ready; no migration)

### Recommended Actions Before Design

1. ✅ Clarify cascade rule: When org deactivates, should assigned users see error message or silent denial?
2. ✅ Decide: Can mga_manager edit org, or only mga_admin?
3. ✅ Decide: Track deactivated_at / deactivated_by in schema, or rely on ActivityLog?

### Final Recommendation

**✅ PROCEED with Gate 6H Design**

- Low risk; high operational value
- All infrastructure in place
- No schema migration required
- Clear permission model available
- Scope enforcement already proven (Gates 6A–6G)

---

## Document Control

| Field | Value |
|-------|-------|
| Document ID | MGA_GATE_6H_BROKER_AGENCY_LIFECYCLE_DISCOVERY_PREFLIGHT |
| Version | 1.0 |
| Created | 2026-05-12 |
| Status | DISCOVERY_COMPLETE — AWAITING_OPERATOR_REVIEW |
| Author | Base44 AI — Platform Engineering |
| Distribution | Operator review; discovery archive; design input |
| Next Step | Design specification (upon operator approval) |

---

## Appendix A — Affected Entities (Scope Validation)

When a Broker/Agency is deactivated, these entity types are affected:

| Entity | Scope Field | Access Impact |
|--------|------------|----------------|
| **BenefitCase** | `master_group_id` | Users assigned to inactive org → access denied |
| **CensusVersion** | `master_group_id` | Users assigned to inactive org → access denied |
| **QuoteScenario** | `master_group_id` | Users assigned to inactive org → access denied |
| **Proposal** | `master_group_id` | Users assigned to inactive org → access denied |
| **EnrollmentWindow** | `master_group_id` | Users assigned to inactive org → access denied |
| **EmployeeEnrollment** | `master_group_id` | Users assigned to inactive org → access denied |
| **Document** | `master_group_id` | Users assigned to inactive org → access denied |
| **ActivityLog** | `master_group_id` | Users assigned to inactive org → can't view logs (denied at list) |

**Cascade Implementation:** Scope validation in `scopeGate.js` checks org.status; if inactive, all access denied.

---

## Appendix B — Permission Matrix Additions

### Current vs. Proposed

**BEFORE (current mastergroup domain):**
```javascript
deactivate: N/A  // doesn't exist
reactivate: N/A  // doesn't exist
```

**AFTER (proposed for Gate 6H):**
```javascript
mastergroup: {
  // ... existing actions ...
  deactivate: {
    platform_super_admin: A,
    mga_admin: A,
    mga_manager: D,
    mga_user: D,
    mga_read_only: D,
    support_impersonation_read_only: D
  },
  reactivate: {
    platform_super_admin: A,
    mga_admin: A,
    mga_manager: D,
    mga_user: D,
    mga_read_only: D,
    support_impersonation_read_only: D
  }
}
```

---

## Appendix C — scopeGate Status Check Pseudocode

```javascript
// In lib/mga/scopeGate.js, scopeValidation function:

async function validateBrokerAgencyScope(request, decision) {
  const { effective_mga_id, effective_master_group_id } = decision;
  
  // Fetch the MasterGroup record
  const masterGroups = await base44.entities.MasterGroup.filter({
    id: effective_master_group_id,
    master_general_agent_id: effective_mga_id
  });
  
  if (!masterGroups?.length) {
    return { valid: false, reason: 'NOT_FOUND_IN_SCOPE' };
  }
  
  const masterGroup = masterGroups[0];
  
  // NEW: Check status is active
  if (masterGroup.status !== 'active') {
    return { valid: false, reason: 'NOT_FOUND_IN_SCOPE', masked: true };
  }
  
  // Continue with existing validation...
  return { valid: true, decision };
}
``