# MGA Gate 6H — Broker / Agency Lifecycle Management
## Implementation Work Order

**Document Type:** Implementation Task Order  
**Date:** 2026-05-12  
**Version:** 1.0  
**Status:** IMPLEMENTATION_WORK_ORDER_COMPLETE — AWAITING_OPERATOR_APPROVAL  
**Prepared By:** Base44 AI — Platform Engineering  
**Reference:** Gate 6H Design Specification LOCKED (2026-05-12)  

---

## Executive Summary

This work order authorizes implementation of Gate 6H — Broker / Agency Lifecycle Management — with strict boundaries on scope, files, and preservation of internal structures. Implementation team must adhere to approved design specification without deviation.

**Approved Capability:** Edit, deactivate, reactivate Broker / Agency organizations with full lifecycle management and audit trail.  
**Implementation Timeline:** 2 weeks code + 1 week validation  
**Risk Level:** 🟢 LOW (scoped; no schema changes; no renaming)  
**Operator Approval Required:** ✅ YES (before code changes begin)  

---

## Section 1 — Implementation Objective

**Primary Objective:**

Implement Broker / Agency lifecycle management for MGA administrators, enabling:
- View Broker / Agency profile details with status and audit history
- Edit Broker / Agency profile fields (name, address, contact info, etc.)
- Deactivate Broker / Agency organizations (soft-delete via status transition)
- Reactivate deactivated organizations
- Full cascade access denial when organization is deactivated
- Complete audit trail of all lifecycle mutations

**Success Criteria:**

✅ All 23 validation tests pass  
✅ Gates 6A–6G regression tests pass  
✅ Build passes with no lint errors  
✅ Permission checks enforced (mga_admin/platform_super_admin only)  
✅ Scope validation enforced (cross-MGA access denied)  
✅ Audit events logged for all mutations  
✅ Feature flags working (toggle edit/deactivate UI)  
✅ Rollback procedure validated  

---

## Section 2 — Approved Scope

### Approved Implementation Tasks

| Task | Status | Responsible | Notes |
|------|--------|-------------|-------|
| Extend masterGroupService with deactivate/reactivate actions | ✅ APPROVED | Backend Engineer | Add 2 functions to existing service |
| Add deactivate/reactivate permissions to permissionResolver | ✅ APPROVED | Backend Engineer | Add 2 actions to mastergroup domain |
| Add status check to scopeGate for mastergroup scope validation | ✅ APPROVED | Security Engineer | Enforce active status during scope check |
| Create MGABrokerAgencyDetailDrawer component | ✅ APPROVED | Frontend Engineer | New component; read-only detail view |
| Create MGABrokerAgencyEditModal component | ✅ APPROVED | Frontend Engineer | New component; edit form |
| Create MGABrokerAgencyDeactivateDialog component | ✅ APPROVED | Frontend Engineer | New component; confirmation + cascade warning |
| Modify MGAMasterGroupPanel to add Edit/Deactivate/Reactivate buttons | ✅ APPROVED | Frontend Engineer | Extend existing panel with new actions |
| Add feature flags for edit/deactivate UI visibility | ✅ APPROVED | Frontend Engineer | 3 flags: edit, deactivate, detail enabled |
| Add audit event logging for lifecycle mutations | ✅ APPROVED | Backend Engineer | Log to ActivityLog entity |
| Create 23 validation tests | ✅ APPROVED | QA Engineer | Unit + integration + regression tests |
| Create implementation test report | ✅ APPROVED | QA Engineer | Validate all 23 tests pass |

### Out of Scope (Explicitly Excluded)

❌ Backend rename from MasterGroup to BrokerAgency  
❌ Rename master_group_id to broker_agency_id  
❌ Database schema migration  
❌ Hard delete functionality  
❌ Bulk lifecycle actions (must be individual, audited)  
❌ Cross-MGA organization reassignment  
❌ Workflow approval process for deactivation  
❌ Scheduled/delayed deactivation  

---

## Section 3 — Files Authorized for Future Change

### Authorized Create (New Files)

| File Path | Component | Purpose | Status |
|-----------|-----------|---------|--------|
| `components/mga/MGABrokerAgencyDetailDrawer.jsx` | Detail Drawer | Read-only org detail + audit history | ✅ CREATE |
| `components/mga/MGABrokerAgencyEditModal.jsx` | Edit Modal | Edit form for profile fields | ✅ CREATE |
| `components/mga/MGABrokerAgencyDeactivateDialog.jsx` | Deactivate Dialog | Confirmation with cascade warning | ✅ CREATE |
| `tests/mga/gate6h-broker-agency-lifecycle.test.js` | Test Suite | 23 validation tests | ✅ CREATE |

### Authorized Modify (Existing Files)

| File Path | Changes | Scope |
|-----------|---------|-------|
| `components/mga/MGAMasterGroupPanel.jsx` | Add Edit/Deactivate/Reactivate buttons; add status badge | Limited to UI additions |
| `lib/mga/services/masterGroupService.js` | Add deactivateBrokerAgency + reactivateBrokerAgency functions | Add 2 new functions only |
| `lib/mga/permissionResolver.js` | Add deactivate/reactivate actions to mastergroup domain | Add 2 rows to permission matrix |
| `lib/mga/scopeGate.js` | Add status check during mastergroup scope validation | Add 5–10 lines to validation logic |
| `lib/mga/auditDecision.js` | Add helper for org-level audit events (optional) | Non-breaking addition |

### Protected Files (NO CHANGES)

🔒 **DO NOT MODIFY:**

- `entities/MasterGroup.json` — entity schema (status field already exists)
- `lib/mga/services/caseService.js` — no changes
- `lib/mga/services/censusService.js` — no changes
- `lib/mga/services/quoteService.js` — no changes
- `lib/mga/services/enrollmentService.js` — no changes
- `lib/mga/scopeResolver.js` — no changes
- `App.jsx` — no route changes
- All Gate 6A–6G files — no changes
- All validation/test files for Gates 6A–6G — no changes
- `lib/mga/permissionResolver.js` OTHER domains — no changes
- Any authentication/authorization framework code — no changes

---

## Section 4 — Files Protected from Change

### Internal Structures (Immutable)

These internal names and structures are FROZEN and must not be renamed or restructured:

| Item | Reason | Status |
|------|--------|--------|
| **MasterGroup** | Entity name; used in queries, relationships, audit trail | 🔒 FROZEN |
| **master_group_id** | Field name; used in foreign keys, scope validation, audit logs | 🔒 FROZEN |
| **masterGroupService** | Service module; imported by multiple scopes | 🔒 FROZEN |
| **scopeGate** | Security gate; core authorization check | 🔒 FROZEN |
| **scopeResolver** | Scope resolution logic; boundary enforcement | 🔒 FROZEN |
| **permissionResolver** | RBAC matrix engine | 🔒 FROZEN |
| **ActivityLog** | Audit entity; cannot be renamed | 🔒 FROZEN |

---

## Section 5 — Feature Flag Strategy

### Flags to Implement

| Flag Name | Location | Type | Default | Purpose |
|-----------|----------|------|---------|---------|
| `MGA_BROKER_AGENCY_EDIT_ENABLED` | `components/mga/MGAMasterGroupPanel.jsx` | Boolean | `true` | Toggle edit button visibility + backend permission check |
| `MGA_BROKER_AGENCY_DEACTIVATION_ENABLED` | `components/mga/MGAMasterGroupPanel.jsx` | Boolean | `true` | Toggle deactivate button visibility + backend permission check |
| `MGA_BROKER_AGENCY_DETAIL_ENABLED` | `components/mga/MGAMasterGroupPanel.jsx` | Boolean | `true` | Toggle detail drawer visibility |

### Flag Enforcement Rules

- **Frontend:** Flags control UI visibility (buttons hidden if flag = false)
- **Backend:** Permission check in permissionResolver still enforced (defense in depth)
- **Rollback:** Set all flags to false → UI hidden; backend denies requests

### Implementation Verification

```javascript
// In component:
const canEdit = MGA_BROKER_AGENCY_EDIT_ENABLED && userHasPermission('mastergroup', 'edit');
if (canEdit) {
  // Show Edit button
}

// In service:
const permission = permissionResolver.check(role, 'mastergroup', 'edit');
if (permission !== 'ALLOW') {
  // Return 403 Forbidden
}
```

---

## Section 6 — Permission Model

### Permission Matrix (Implementation Detail)

**Domain:** `mastergroup` (existing)

**New Actions to Add:**

```javascript
deactivate: {
  platform_super_admin: 'ALLOW',
  mga_admin: 'ALLOW',
  mga_manager: 'DENY',
  mga_user: 'DENY',
  mga_read_only: 'DENY',
  support_impersonation_read_only: 'DENY'
}

reactivate: {
  platform_super_admin: 'ALLOW',
  mga_admin: 'ALLOW',
  mga_manager: 'DENY',
  mga_user: 'DENY',
  mga_read_only: 'DENY',
  support_impersonation_read_only: 'DENY'
}
```

### Enforcement Logic

**Every action must validate:**

```
1. permissionResolver.check(role, 'mastergroup', action)
   → If result is 'DENY', return 403 Forbidden
   
2. scopeGate.checkScope(request, { action, domain: 'mastergroup' })
   → If denied, return 401 NOT_FOUND_IN_SCOPE
   
3. For deactivate/reactivate:
   → Only mga_admin and platform_super_admin pass
   → All other roles denied (fail-closed)
```

---

## Section 7 — ScopeGate / Security Model

### Required Scope Checks

**For all actions:**

| Check | Logic | Failure Response |
|-------|-------|-----------------|
| **Authentication** | User logged in | 401 Unauthorized |
| **MGA Boundary** | user.master_general_agent_id == org.master_general_agent_id | 401 NOT_FOUND_IN_SCOPE |
| **Permission** | permissionResolver.check(role, 'mastergroup', action) = ALLOW | 403 Forbidden |
| **Org Status** | org.status == 'active' (for edit/deactivate) | 401 NOT_FOUND_IN_SCOPE |

### Cascade Access Denial Implementation

**When org status changes to inactive:**

```javascript
// In scopeGate.js, during mastergroup scope validation:
const masterGroup = await base44.entities.MasterGroup.filter({
  id: targetMasterGroupId,
  master_general_agent_id: userMgaId
});

if (!masterGroup?.length || masterGroup[0].status !== 'active') {
  return { 
    valid: false, 
    reason: 'NOT_FOUND_IN_SCOPE',
    masked: true  // Don't reveal why
  };
}
```

**Result:** Users assigned to inactive org see 401 NOT_FOUND_IN_SCOPE on next request. Silent denial (fail-closed).

### Audit Logging Requirement

Every lifecycle action logs to ActivityLog:

```javascript
await prepareAndRecordAudit(decision, {
  action: 'broker_agency_deactivate_succeeded',
  outcome: 'success',
  before: originalOrgData,
  after: updatedOrgData,
  correlation_id: decision.correlation_id
});
```

---

## Section 8 — Backend Service Actions

### Service Layer (lib/mga/services/masterGroupService.js)

**Existing functions to extend:**

1. `updateMasterGroup(request)` — Add field validation for editable profile fields

**New functions to add:**

2. `deactivateBrokerAgency(request)` — Transition status: active → inactive
3. `reactivateBrokerAgency(request)` — Transition status: inactive → active

### Function Implementation Details

#### updateMasterGroup (Extended)

```javascript
export async function updateMasterGroup(request) {
  // Existing validation + NEW field validation
  
  // Allowed fields:
  const allowedFields = ['name', 'address', 'city', 'state', 'zip', 'phone', 'email', 'primary_contact_name', 'notes'];
  
  // Reject if trying to edit status (deactivate/reactivate only via dedicated functions)
  if (request.payload.status) {
    return buildScopedResponse({ 
      success: false, 
      reason_code: 'INVALID_OPERATION',
      detail: 'Cannot edit status; use deactivate/reactivate' 
    });
  }
  
  // Validate field values
  // ... validation logic ...
  
  // Scope check
  const { decision, denied } = await checkScope({ 
    ...request, 
    domain: DOMAIN, 
    action: 'edit' 
  });
  if (denied) return response;
  
  // Perform update
  // Log to ActivityLog
  // Return success
}
```

#### deactivateBrokerAgency (New)

```javascript
export async function deactivateBrokerAgency(request) {
  // Scope check
  const { decision, denied } = await checkScope({ 
    ...request, 
    domain: DOMAIN, 
    action: 'deactivate' 
  });
  if (denied) return response;
  
  // Verify current status is active
  const records = await base44.entities.MasterGroup.filter({
    id: request.target_entity_id,
    master_general_agent_id: decision.effective_mga_id
  });
  if (records[0].status !== 'active') {
    return buildScopedResponse({ 
      success: false, 
      reason_code: 'INVALID_STATE',
      detail: 'Org is already inactive' 
    });
  }
  
  // Count assigned users (for audit)
  const assignedUsers = await countAssignedUsers(request.target_entity_id);
  
  // Update status
  const updated = await base44.entities.MasterGroup.update(
    request.target_entity_id, 
    { status: 'inactive' }
  );
  
  // Audit log
  await prepareAndRecordAudit(decision, {
    outcome: 'success',
    before: records[0],
    after: updated,
    detail: `Deactivated. ${assignedUsers} users affected.`
  });
  
  return buildScopedResponse({ 
    data: updated, 
    affected_user_count: assignedUsers 
  });
}
```

#### reactivateBrokerAgency (New)

Similar to deactivate but:
- Verify current status is inactive
- Transition to active
- Log reactivation event

---

## Section 9 — Frontend Components / Actions

### Component Implementations (Detailed)

#### 1. MGABrokerAgencyDetailDrawer (New)

**Purpose:** Read-only detail view with audit history  
**When shown:** User clicks org row or Edit button  
**Content:**
- Org name, code, address, city, state, zip
- Contact info: phone, email, primary_contact_name
- Status badge (active/inactive/suspended)
- Last modified timestamp
- Audit trail section (last 10 ActivityLog entries for this org)

**Actions:**
- Close button
- Edit button (opens MGABrokerAgencyEditModal)
- Deactivate button (if org is active; opens MGABrokerAgencyDeactivateDialog)
- Reactivate button (if org is inactive; calls reactivateBrokerAgency directly)

#### 2. MGABrokerAgencyEditModal (New)

**Purpose:** Edit org profile  
**Form fields:**
- name (required, 1–255 chars)
- address (optional, 0–500 chars)
- city (optional, 0–100 chars)
- state (optional, 0–10 chars)
- zip (optional, 0–20 chars)
- phone (optional, 0–20 chars, validate format)
- email (optional, 0–255 chars, validate format)
- primary_contact_name (optional, 0–255 chars)
- notes (optional, 0–1000 chars)

**Buttons:**
- Save → calls updateMasterGroup; close on success
- Cancel → close without saving

**Validation:**
- Required fields checked
- Format validation (email, phone)
- No script injection
- Show error messages inline

#### 3. MGABrokerAgencyDeactivateDialog (New)

**Purpose:** Confirmation + cascade warning  
**Content:**
- Title: "Deactivate {orgName}?"
- Warning: "This will deny access to N users assigned to this organization."
- Reason field (optional): textarea
- Buttons: Cancel, Deactivate

**On Deactivate:**
- Call deactivateBrokerAgency service
- Show success toast
- Close dialog
- Refresh org list

**Error handling:** Show error message; allow retry

#### 4. MGAMasterGroupPanel (Modified)

**Current state:** Lists all orgs with Create button

**Changes:**
- Add status badge to each row (color-coded: green=active, red=inactive, yellow=suspended)
- Add Edit button (pencil icon) — opens detail drawer
- Add Deactivate button (if active) — opens confirm dialog
- Add Reactivate button (if inactive) — calls reactivate directly (no dialog needed)
- Wrap new buttons with feature flag checks

---

## Section 10 — Audit Event Requirements

### Events to Log

| Event | Trigger | Fields | Severity |
|-------|---------|--------|----------|
| broker_agency_detail_viewed | User opens detail drawer | actor, org_id, MGA | INFO |
| broker_agency_update_succeeded | Edit saved | actor, org_id, before, after | INFO |
| broker_agency_update_failed | Edit validation failed | actor, org_id, reason | WARN |
| broker_agency_deactivate_succeeded | Deactivation saved | actor, org_id, affected_users | WARN |
| broker_agency_deactivate_failed | Deactivation failed | actor, org_id, reason | ERROR |
| broker_agency_reactivate_succeeded | Reactivation saved | actor, org_id | INFO |
| broker_agency_reactivate_failed | Reactivation failed | actor, org_id, reason | ERROR |
| broker_agency_permission_denied | Permission check failed | actor, role, action | WARN |
| broker_agency_scope_denied | Cross-MGA access denied | actor, org_id, attempted_action | WARN |

### ActivityLog Fields (for each event)

```javascript
{
  case_id: null,  // org-level; not case-specific
  master_general_agent_id: "mga_id",
  master_group_id: "org_id",
  actor_email: "user@example.com",
  actor_name: "User Name",
  actor_role: "mga_admin",
  action: "broker_agency_deactivate_succeeded",
  detail: "Deactivated 'XYZ Corp' (status: active → inactive). 5 users affected.",
  entity_type: "MasterGroup",
  entity_id: "org_id",
  old_value: JSON.stringify({ status: "active", ... }),
  new_value: JSON.stringify({ status: "inactive", ... }),
  outcome: "success",  // success | failed | blocked
  correlation_id: "corr_id"
}
```

---

## Section 11 — Validation / Test Mapping (23 Tests)

### Test Categories & Implementation Tasks

| # | Test | Category | Status |
|---|------|----------|--------|
| 1 | Authorized user can view Broker / Agency detail | View | 🟢 CREATE |
| 2 | Unauthorized user cannot view detail (403) | View | 🟢 CREATE |
| 3 | Authorized user can edit allowed fields | Edit | 🟢 CREATE |
| 4 | Protected fields cannot be edited | Edit | 🟢 CREATE |
| 5 | Cross-MGA edit blocked (401) | Edit | 🟢 CREATE |
| 6 | Invalid master_group_id blocked (404) | Edit | 🟢 CREATE |
| 7 | mga_admin can deactivate | Deactivate | 🟢 CREATE |
| 8 | mga_manager cannot deactivate (403) | Deactivate | 🟢 CREATE |
| 9 | Authorized user can deactivate org | Deactivate | 🟢 CREATE |
| 10 | Deactivated org status updates to "inactive" | Deactivate | 🟢 CREATE |
| 11 | Cascade: users assigned to inactive org denied access | Deactivate | 🟢 CREATE |
| 12 | Deactivation audit event logged with affected_user_count | Deactivate | 🟢 CREATE |
| 13 | Authorized user can reactivate org | Reactivate | 🟢 CREATE |
| 14 | Reactivated org status updates to "active"; access restored | Reactivate | 🟢 CREATE |
| 15 | Hard delete unavailable | Delete | 🟢 CREATE |
| 16 | Audit events written for view/edit/deactivate | Audit | 🟢 CREATE |
| 17 | Audit trail includes before/after values | Audit | 🟢 CREATE |
| 18 | Gate 6A (invite user) unaffected | Regression | 🟢 CREATE |
| 19 | Gate 6B (TXQuote transmit) unaffected | Regression | 🟢 CREATE |
| 20 | Gate 6C (report export) unaffected | Regression | 🟢 CREATE |
| 21 | Gate 6D (export history) unaffected | Regression | 🟢 CREATE |
| 22 | Gate 6E (create org) unaffected | Regression | 🟢 CREATE |
| 23 | Gate 6F (invite sub-scope) unaffected | Regression | 🟢 CREATE |

### Test Implementation File

**Path:** `tests/mga/gate6h-broker-agency-lifecycle.test.js`

**Structure:**
```javascript
describe('Gate 6H — Broker / Agency Lifecycle Management', () => {
  describe('View', () => {
    test('1: Authorized user can view detail', () => { ... });
    test('2: Unauthorized user cannot view (403)', () => { ... });
  });
  
  describe('Edit', () => {
    test('3: Can edit allowed fields', () => { ... });
    test('4: Protected fields cannot be edited', () => { ... });
    // ... more tests
  });
  
  describe('Deactivate', () => {
    // ... 6 tests
  });
  
  describe('Reactivate', () => {
    // ... 2 tests
  });
  
  describe('Delete', () => {
    test('15: Hard delete unavailable', () => { ... });
  });
  
  describe('Audit', () => {
    // ... 2 tests
  });
  
  describe('Cross-Gate Regression', () => {
    // ... 6 tests
  });
});
```

---

## Section 12 — Rollback Procedure

### Phase 1: Disable UI (Immediate)

```javascript
// In MGAMasterGroupPanel.jsx, set flags to false:
const MGA_BROKER_AGENCY_EDIT_ENABLED = false;
const MGA_BROKER_AGENCY_DEACTIVATION_ENABLED = false;
const MGA_BROKER_AGENCY_DETAIL_ENABLED = false;

// Result: All buttons hidden; backend permission checks still in effect
```

### Phase 2: Code Revert (If Phase 1 insufficient)

1. Remove MGABrokerAgencyDetailDrawer.jsx
2. Remove MGABrokerAgencyEditModal.jsx
3. Remove MGABrokerAgencyDeactivateDialog.jsx
4. Revert MGAMasterGroupPanel.jsx (remove buttons, restore list-only behavior)
5. Revert masterGroupService.js (remove deactivate/reactivate functions)
6. Revert permissionResolver.js (remove deactivate/reactivate actions)
7. Revert scopeGate.js (remove status check)

### Phase 3: Redeploy (If Phase 2 executed)

1. Rebuild application
2. Verify build passes
3. Deploy with reverted code
4. Run Gate 6A–6G regression tests
5. Verify list/detail operations functional

### Data Preservation

- ✅ Org records remain in DB (soft-delete via status only)
- ✅ Deactivated orgs stay deactivated (no automatic reactivation)
- ✅ Audit logs preserved (full history available)
- ✅ No data loss or corruption

### Recovery

If orgs get stuck inactive:
- Reactivate via UI (if Phase 1 rollback)
- Reactivate via direct service call (if Phase 2 rollback needed)
- User access restored immediately

---

## Section 13 — Registry / Ledger Update Requirements

### Update After Implementation Completion

**When implementation is COMPLETE and TESTED:**

Update `docs/QUOTE_CONNECT_360_GATE_REGISTRY.json`:

```json
{
  "gateId": "GATE-6H",
  "gateName": "Broker / Agency Lifecycle Management",
  "phase": 6,
  "status": "CLOSED",
  "closureType": "standard",
  "approved": true,
  "live": true,
  "validated": true,
  "closureDate": "2026-05-XX",  // Implementation completion date
  "activation": "ACTIVE",
  "implementation": "COMPLETE",
  "description": "Edit, deactivate, reactivate Broker / Agency organizations; full lifecycle management and audit trail",
  "authorizedRoles": ["mga_admin", "platform_super_admin"],
  "implementationFiles": [
    "components/mga/MGABrokerAgencyDetailDrawer.jsx",
    "components/mga/MGABrokerAgencyEditModal.jsx",
    "components/mga/MGABrokerAgencyDeactivateDialog.jsx",
    "lib/mga/services/masterGroupService.js"
  ],
  "featureFlags": [
    {"name": "MGA_BROKER_AGENCY_EDIT_ENABLED", "value": true},
    {"name": "MGA_BROKER_AGENCY_DEACTIVATION_ENABLED", "value": true},
    {"name": "MGA_BROKER_AGENCY_DETAIL_ENABLED", "value": true}
  ],
  "testCount": 23,
  "testsPassed": 23,
  "buildStatus": "PASS",
  "rollbackReady": true,
  "rollbackVerified": true,
  "internalEntity": "MasterGroup",
  "internalScopeField": "master_group_id",
  "noSchemaChanges": true,
  "designSpec": "docs/MGA_GATE_6H_BROKER_AGENCY_LIFECYCLE_DESIGN_SPECIFICATION.md",
  "closeoutReport": "docs/MGA_GATE_6H_IMPLEMENTATION_CLOSEOUT_REPORT.md",
  "notes": "Gate 6H CLOSED. Lifecycle management LIVE. No schema migration performed. MasterGroup/master_group_id preserved. Rollback ready via feature flags."
}
```

### Update Status Ledger

Add or update `docs/MGA_GATE_STATUS_LEDGER.md`:

```markdown
### Gate 6H — Broker / Agency Lifecycle Management

| Field | Value |
|-------|-------|
| **Status** | ✅ CLOSED |
| **Live** | ✅ YES |
| **Tests** | 23 / 23 PASS |
| **Rollback** | ✅ VERIFIED |
| **Capability** | Edit, deactivate, reactivate Broker / Agency; full lifecycle + audit |
| **Internal Entity** | MasterGroup (preserved) |
| **Internal Field** | master_group_id (preserved) |
| **Closure Date** | 2026-05-XX |
| **Operator Approval** | ✅ YES |
```

---

## Section 14 — Operator Approval Checkpoint

### Before Implementation Begins

**Implementation team MUST obtain:**

- ✅ **Operator approval** of this work order
- ✅ **Confirmation** that design specification is locked
- ✅ **Clearance** to modify authorized files
- ✅ **Confirmation** that protected files are untouched

### Approval Criteria

**Operator must verify:**

1. ✅ Work order scope matches design specification
2. ✅ File boundaries are correct (authorized for change, protected from change)
3. ✅ All 23 tests are specified
4. ✅ Rollback procedure is sound
5. ✅ Feature flag strategy is complete
6. ✅ No unauthorized changes to internal structures
7. ✅ No backend rename included
8. ✅ No schema migration included

### Sign-Off Required

```
Operator Approval:
  Name: _________________________
  Date: _________________________
  Approval: APPROVED / REJECTED
```

---

## Document Control

| Field | Value |
|-------|-------|
| Document ID | MGA_GATE_6H_BROKER_AGENCY_LIFECYCLE_IMPLEMENTATION_WORK_ORDER |
| Version | 1.0 |
| Created | 2026-05-12 |
| Status | IMPLEMENTATION_WORK_ORDER_COMPLETE — AWAITING_OPERATOR_APPROVAL |
| Author | Base44 AI — Platform Engineering |
| Distribution | Implementation team; operator review; project archive |
| Next Step | Operator approval; begin implementation (upon approval) |

---

## Appendix A — Quick Reference: Authorized Files

### CREATE (New)
```
✅ components/mga/MGABrokerAgencyDetailDrawer.jsx
✅ components/mga/MGABrokerAgencyEditModal.jsx
✅ components/mga/MGABrokerAgencyDeactivateDialog.jsx
✅ tests/mga/gate6h-broker-agency-lifecycle.test.js
```

### MODIFY (Existing)
```
✅ components/mga/MGAMasterGroupPanel.jsx
✅ lib/mga/services/masterGroupService.js
✅ lib/mga/permissionResolver.js
✅ lib/mga/scopeGate.js
✅ lib/mga/auditDecision.js (optional)
```

### PROTECTED (NO CHANGES)
```
🔒 entities/MasterGroup.json
🔒 lib/mga/scopeResolver.js
🔒 lib/mga/permissionResolver.js (OTHER domains)
🔒 All Gate 6A–6G files
🔒 App.jsx
🔒 All auth/security framework code
``