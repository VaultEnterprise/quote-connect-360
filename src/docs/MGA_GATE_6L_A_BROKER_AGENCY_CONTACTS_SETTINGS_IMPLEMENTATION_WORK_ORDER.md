# Gate 6L-A Implementation Work Order
## Broker / Agency Contacts and Settings Management

**Document Type:** Implementation Work Order  
**Classification:** Internal — Platform Engineering / Program Management  
**Date:** 2026-05-12  
**Version:** 1.0  
**Status:** IMPLEMENTATION_WORK_ORDER_COMPLETE — AWAITING OPERATOR APPROVAL  
**Prepared By:** Platform Engineering — MGA Program Management  

---

## 1. Implementation Objective

Enable MGA administrators to manage comprehensive contact and settings information for Broker / Agency organizations, including primary/billing/operations/compliance/technical contacts, notification preferences, invite defaults, and internal admin notes.

**Deliverables:**
- ✅ BrokerAgencyContact entity (new)
- ✅ MasterGroup extensions (notification_email_frequency, notification_channels, default_invite_role, internal_notes fields)
- ✅ Backend service layer actions (list, create, update, deactivate contacts; get/update settings)
- ✅ Frontend panels (contacts, settings, notes tabs in detail drawer)
- ✅ Permission model (contacts.view, contacts.manage, settings.view, settings.manage, notes.view, notes.manage)
- ✅ Audit logging (contact CRUD events, settings changes, access denials)
- ✅ Validation & regression tests
- ✅ Rollback procedure

**Success Criteria:**
- All tests pass (validation + regression)
- Build passes with no lint errors
- Permission enforcement verified
- Scope enforcement verified
- Audit trail complete
- Gates 6A–6H unaffected

---

## 2. Approved Gate 6L-A Scope

### In Scope (Implementation)

| Area | Scope | Status |
|------|-------|--------|
| **Broker / Agency Contacts** | Create, view, update, deactivate primary/billing/operations/compliance/technical/other contacts | ✅ APPROVED |
| **Contact Fields** | name, title, email, phone, contact_type, status, is_primary, notes | ✅ APPROVED |
| **Broker / Agency Settings** | Notification email frequency (daily/weekly/monthly/never); notification channels (email/sms/webhook); default invite role (mga_user/mga_read_only) | ✅ APPROVED |
| **Internal Notes** | Admin-only notes field; permissioned to admin; safe payload policy enforced | ✅ APPROVED |
| **Audit Logging** | Contact create/update/deactivate events; settings change events; permission/scope denial events | ✅ APPROVED |
| **Permission Model** | contacts.view, contacts.manage, settings.view, settings.manage, notes.view, notes.manage (admin-only: platform_super_admin, mga_admin) | ✅ APPROVED |
| **Frontend UI** | Contacts panel, settings panel, notes panel in Broker / Agency detail drawer | ✅ APPROVED |

### Explicitly Out of Scope (Deferred to 6L-B)

| Area | Reason |
|------|--------|
| **Document Upload/Download** | DEFERRED / 6L-B; private file security complexity |
| **Document Metadata** | DEFERRED / 6L-B; requires separate security design |
| **Signed URL Generation** | DEFERRED / 6L-B; private file handling |
| **Private File URI Handling** | DEFERRED / 6L-B; security risk; separate approval needed |
| **Document Delete/Expiration** | DEFERRED / 6L-B |
| **BrokerAgencyDocument Entity (Runtime)** | DESIGN_ONLY; no implementation in 6L-A |

---

## 3. Deferred Gate 6L-B Scope

Document management is deferred to Gate 6L-B due to private file security complexity.

**Gate 6L-B Status:** DEFERRED (awaiting separate operator approval)

**Future Scope (Not in 6L-A):**
- ❌ Document upload endpoint
- ❌ Document download endpoint
- ❌ Signed URL generation
- ❌ Private file URI exposure
- ❌ Document delete/expiration
- ❌ BrokerAgencyDocument entity (runtime implementation)

**When 6L-B is approved:**
- Separate discovery & design for document security model
- Separate implementation work order
- Private file handling via base44 API
- Signed URL generation (5-minute expiry, server-side only)
- Audit logging for all document access

---

## 4. Authorized Files for Change

The following files are **AUTHORIZED for change** during 6L-A implementation:

### New Files (Creation Authorized)

| File | Purpose | Type |
|------|---------|------|
| `components/mga/MGABrokerAgencyContactsPanel.jsx` | Contacts list/management UI | NEW COMPONENT |
| `components/mga/MGABrokerAgencyContactModal.jsx` | Contact add/edit modal | NEW COMPONENT |
| `components/mga/MGABrokerAgencySettingsPanel.jsx` | Settings management UI | NEW COMPONENT |
| `components/mga/MGABrokerAgencyNotesPanel.jsx` | Internal notes view/edit | NEW COMPONENT |
| `tests/mga/gate6l-a-broker-agency-contacts-settings.test.js` | Validation test suite | NEW TEST |

### Modified Files (Extension Authorized)

| File | Change | Scope |
|------|--------|-------|
| `entities/MasterGroup.json` | Add notification_email_frequency, notification_channels, default_invite_role, internal_notes fields | EXTEND SCHEMA (no rename) |
| `lib/mga/services/masterGroupService.js` | Add 8 new service actions (listBrokerAgencyContacts, createBrokerAgencyContact, etc.) | EXTEND SERVICE (no rename) |
| `lib/mga/permissionResolver.js` | Add 6 new permission types (contacts.view, contacts.manage, settings.view, settings.manage, notes.view, notes.manage) | EXTEND PERMISSIONS (no broadening) |
| `components/mga/MGABrokerAgencyDetailDrawer.jsx` | Add Contacts, Settings, Notes tabs | EXTEND DRAWER (no removal of existing tabs) |
| `docs/QUOTE_CONNECT_360_GATE_REGISTRY.json` | Update Gate 6L-A entry; add 6L-B deferred entry | UPDATE REGISTRY |
| `docs/MGA_GATE_STATUS_LEDGER.md` | Update Gate 6L-A and 6L-B status | UPDATE LEDGER |

---

## 5. Protected Files (No Change)

The following files are **PROTECTED from change** during 6L-A implementation:

| File | Protection |
|------|-----------|
| `components/mga/MGAMasterGroupPanel.jsx` | No changes (Gate 6E protected) |
| `components/mga/MGABrokerAgencyEditModal.jsx` | No changes (Gate 6H protected) |
| `components/mga/MGABrokerAgencyDeactivateDialog.jsx` | No changes (Gate 6H protected) |
| `lib/mga/scopeGate.js` | No changes (core security; no bypass) |
| `lib/mga/scopeResolver.js` | No changes (core security; hotfix only) |
| `components/mga/MGAInviteUserModal.jsx` | No changes (Gate 6A protected) |
| `components/mga/MGATXQuoteTransmitModal.jsx` | No changes (Gate 6B protected) |
| `components/mga/MGAReportExportModal.jsx` | No changes (Gate 6C protected) |
| `components/mga/MGAExportHistoryPanel.jsx` | No changes (Gate 6D protected) |
| `components/mga/MGACreateBrokerAgencyModal.jsx` | No changes (Gate 6E protected) |
| `App.jsx` | No changes (routing protected) |
| `entities/EmployerGroup.json` | No changes (separate entity; no schema modification) |
| `entities/BenefitCase.json` | No changes (separate entity; no schema modification) |

---

## 6. Data Model / Storage Approach

### New Entity: BrokerAgencyContact

**Definition:**
```json
{
  "name": "BrokerAgencyContact",
  "type": "object",
  "properties": {
    "master_group_id": { "type": "string", "description": "Parent Broker / Agency" },
    "master_general_agent_id": { "type": "string", "description": "MGA scope" },
    "contact_type": { "type": "string", "enum": ["primary", "billing", "operations", "compliance", "technical", "other"] },
    "full_name": { "type": "string", "maxLength": 255 },
    "title": { "type": "string", "maxLength": 255 },
    "email": { "type": "string", "maxLength": 255 },
    "phone": { "type": "string", "maxLength": 20 },
    "status": { "type": "string", "enum": ["active", "inactive"], "default": "active" },
    "is_primary": { "type": "boolean", "default": false },
    "notes": { "type": "string", "maxLength": 1000 }
  },
  "required": ["master_group_id", "master_general_agent_id", "contact_type", "full_name", "email"]
}
```

**Scope Fields:**
- `master_group_id` — Parent Broker / Agency (used for filtering/access)
- `master_general_agent_id` — MGA scope (used for permission enforcement)

**Storage:** Base44 entity system (not custom database)

### MasterGroup Extensions

**New Fields:**
```json
{
  "notification_email_frequency": { "type": "string", "enum": ["never", "daily", "weekly", "monthly"], "default": "weekly" },
  "notification_channels": { "type": "array", "items": { "type": "string" }, "default": ["email"] },
  "default_invite_role": { "type": "string", "enum": ["mga_user", "mga_read_only"], "default": "mga_user" },
  "internal_notes": { "type": "string", "maxLength": 5000 }
}
```

**Compatibility:**
- ✅ MasterGroup entity name preserved (no rename)
- ✅ master_group_id field preserved (no rename)
- ✅ Existing fields untouched
- ✅ No schema migration (additive only)
- ✅ No data loss or transformation

---

## 7. Permission Model

### New Permissions (6 Total)

| Permission | Description | Allowed Roles | Denied Roles |
|-----------|-------------|-----------------|--------------|
| `mastergroup.contacts.view` | View contacts list/details | platform_super_admin, mga_admin, mga_manager | mga_user, mga_read_only |
| `mastergroup.contacts.manage` | Create/update/delete contacts | platform_super_admin, mga_admin | mga_manager, mga_user, mga_read_only |
| `mastergroup.settings.view` | View settings (notifications, defaults, notes) | platform_super_admin, mga_admin, mga_manager | mga_user, mga_read_only |
| `mastergroup.settings.manage` | Update settings | platform_super_admin, mga_admin | mga_manager, mga_user, mga_read_only |
| `mastergroup.notes.view` | View internal notes (admin-only) | platform_super_admin, mga_admin | mga_manager, mga_user, mga_read_only |
| `mastergroup.notes.manage` | Edit internal notes (admin-only) | platform_super_admin, mga_admin | mga_manager, mga_user, mga_read_only |

### Enforcement Logic (All Actions)

Every action enforces in sequence:
1. ✅ **Authentication:** `base44.auth.me()` required
2. ✅ **Permission Check:** `permissionResolver.check(role, 'mastergroup', action)`
3. ✅ **Scope Check:** `scopeGate.checkScope(request, { domain: 'mastergroup', action })`
4. ✅ **MGA Boundary:** Verify `user.master_general_agent_id == entity.master_general_agent_id`
5. ✅ **Broker / Agency Boundary:** Verify `entity.master_group_id` matches user scope
6. ✅ **Audit Logging:** Log action outcome (success/denied)
7. ✅ **Fail-Closed:** Default DENY; explicit ALLOW only

### Fail-Closed Responses

| Scenario | Response | Status |
|----------|----------|--------|
| Unauthenticated user | 401 Unauthorized | 401 |
| Insufficient role permission | 403 Forbidden | 403 |
| Cross-MGA access | 401 NOT_FOUND_IN_SCOPE (masked) | 401 |
| Cross-Broker/Agency access | 401 NOT_FOUND_IN_SCOPE (masked) | 401 |

---

## 8. ScopeGate / Security Model

### Scope Enforcement Points

**Contact List/View:**
```
1. Verify authenticated user
2. Check: mastergroup.contacts.view permission
3. Check: user.master_general_agent_id == contact.master_general_agent_id
4. Filter contacts by authenticated user's MGA scope only
5. Return filtered list (no cross-MGA leakage)
```

**Contact Create:**
```
1. Verify authenticated user
2. Check: mastergroup.contacts.manage permission
3. Check: requested master_group_id within user's MGA scope
4. Validate contact data (required fields, format)
5. Create contact with master_general_agent_id = user's MGA
6. Log audit event
```

**Contact Update:**
```
1. Verify authenticated user
2. Check: mastergroup.contacts.manage permission
3. Check: contact's master_general_agent_id == user's MGA scope
4. Validate update data; apply one-primary constraint if is_primary=true
5. Update contact record
6. Log audit event (before/after values)
```

**Settings Get:**
```
1. Verify authenticated user
2. Check: mastergroup.settings.view permission
3. Check: master_group_id within user's MGA scope
4. Fetch settings from MasterGroup
5. Return settings (no sensitive data exposure)
```

**Settings Update:**
```
1. Verify authenticated user
2. Check: mastergroup.settings.manage permission
3. Check: master_group_id within user's MGA scope
4. Validate settings data (enum values, constraints)
5. Update MasterGroup fields
6. Log audit event
```

**Notes View:**
```
1. Verify authenticated user
2. Check: mastergroup.notes.view permission (admin-only)
3. Check: master_group_id within user's MGA scope
4. Fetch internal_notes from MasterGroup
5. Return notes with updated_by + timestamp (not log content)
```

### Safe Payload Policy

- ✅ **What to expose:** Contact name, email, phone, type, status, is_primary
- ❌ **What to hide:** mastergroup_id (in response), master_general_agent_id (in response)
- ❌ **What never to expose:** Internal notes full content (log event only), private file URIs, signed URLs
- ✅ **What to include:** Audit trail, last updated timestamp, created_by, updated_by

---

## 9. Backend Service Actions (masterGroupService)

### Contacts Management

**listBrokerAgencyContacts(master_group_id, filters = {})**
- Input: master_group_id, optional filters (contact_type, status)
- Returns: [{ id, contact_type, name, email, phone, status, is_primary }, ...]
- Enforces: permission check, scope validation, MGA boundary
- Excludes inactive contacts by default (filter can override)

**getBrokerAgencyContact(master_group_id, contact_id)**
- Input: master_group_id, contact_id
- Returns: { id, contact_type, name, title, email, phone, status, is_primary, notes, created_at, updated_at, created_by }
- Enforces: permission check, scope validation

**createBrokerAgencyContact(master_group_id, contactData)**
- Input: master_group_id, { contact_type, full_name, email, phone?, title?, notes? }
- Validates: required fields, email format, contact_type enum
- Returns: created contact object
- Enforces: contacts.manage permission, scope, idempotency
- Logs: contact_created audit event

**updateBrokerAgencyContact(master_group_id, contact_id, updates)**
- Input: master_group_id, contact_id, { full_name?, email?, phone?, title?, status?, is_primary?, notes? }
- Validates: enum values, one-primary constraint
- Returns: updated contact
- Enforces: contacts.manage permission, scope
- Logs: contact_updated audit event (before/after)

**deactivateBrokerAgencyContact(master_group_id, contact_id)**
- Input: master_group_id, contact_id
- Action: Sets status to inactive (soft-delete)
- Returns: updated contact (status: inactive)
- Enforces: contacts.manage permission, scope
- Logs: contact_deactivated audit event

### Settings Management

**getBrokerAgencySettings(master_group_id)**
- Input: master_group_id
- Returns: { notification_email_frequency, notification_channels, default_invite_role, internal_notes, updated_at, updated_by }
- Enforces: settings.view permission, scope

**updateBrokerAgencySettings(master_group_id, updates)**
- Input: master_group_id, { notification_email_frequency?, notification_channels?, default_invite_role?, internal_notes? }
- Validates: enum values, max length constraints
- Returns: updated settings
- Enforces: settings.manage permission, scope
- Logs: settings_updated audit event

**getBrokerAgencyNotes(master_group_id)**
- Input: master_group_id
- Returns: { internal_notes, updated_at, updated_by }
- Enforces: notes.view permission (admin-only), scope
- Note: Does NOT return full audit trail (just current notes + metadata)

---

## 10. Frontend Components / Actions

### Component Structure

**Mount Location:** `MGABrokerAgencyDetailDrawer.jsx` (existing Gate 6H component)

**New Tabs in Detail Drawer:**
1. Existing: Details (Gate 6H)
2. Existing: Activity (Gate 6H)
3. **New: Contacts** (6L-A)
4. **New: Settings** (6L-A)
5. **New: Notes** (6L-A, admin-only)

### MGABrokerAgencyContactsPanel.jsx

**Features:**
- Contacts table (name, email, phone, type, status, is_primary badge)
- Search/filter by contact type
- Add Contact button (conditional on contacts.manage permission)
- Edit button per row (conditional on contacts.manage)
- Deactivate button (soft-delete; preserves for audit)
- Mark as Primary (conditional on contacts.manage)
- Empty state when no contacts

**Actions:**
- Click Add → open MGABrokerAgencyContactModal
- Click Edit → open MGABrokerAgencyContactModal (pre-filled)
- Click Deactivate → confirm, set status to inactive
- Click Primary → unmark previous, mark new as primary

### MGABrokerAgencyContactModal.jsx

**Form Fields:**
- Contact Type (dropdown: primary, billing, operations, compliance, technical, other)
- Full Name (text input, required)
- Title (text input, optional)
- Email (email input, required, validate format)
- Phone (tel input, optional)
- Notes (textarea, optional, max 1000 chars)

**Actions:**
- Save (validates required fields, calls createBrokerAgencyContact or updateBrokerAgencyContact)
- Cancel (closes modal)
- Loading state during save

### MGABrokerAgencySettingsPanel.jsx

**Display Sections:**

**Notification Preferences:**
- Email Frequency toggle (never/daily/weekly/monthly)
- Channels checkboxes (email, sms, webhook)

**Invite Defaults:**
- Default Invite Role dropdown (mga_user, mga_read_only)

**Admin Settings:**
- Internal Notes textarea (conditional on notes.view; editable if notes.manage)
- Last Updated timestamp (display only)
- Save button (conditional on settings.manage)

**Actions:**
- Update notification settings
- Update default invite role
- Edit/save internal notes

### MGABrokerAgencyNotesPanel.jsx (Optional)

**Features:**
- Display current internal notes
- Edit button (conditional on notes.manage)
- Expanded view in modal
- Character count (max 5000)
- Last updated by / timestamp

---

## 11. Audit Event Requirements

### Events to Log

| Event | Trigger | Data Logged |
|-------|---------|------------|
| `broker_agency_contact_created` | New contact created | contact_id, contact_type, email, full_name, created_by, timestamp |
| `broker_agency_contact_updated` | Contact details modified | contact_id, changed_fields (not full before/after), updated_by, timestamp |
| `broker_agency_contact_deactivated` | Contact status → inactive | contact_id, deactivated_by, timestamp |
| `broker_agency_settings_updated` | Settings changed | changed_setting (not values), updated_by, timestamp |
| `broker_agency_notes_updated` | Internal notes edited | updated_by, timestamp (NOT content) |
| `broker_agency_contact_view_denied` | Unauthorized contact access | user_email, reason (permission/scope), timestamp |
| `broker_agency_settings_view_denied` | Unauthorized settings access | user_email, reason (permission/scope), timestamp |

### Audit Logging Constraints

- ✅ Log: contact email, phone, type (operational information)
- ✅ Log: who changed what (actor + action)
- ❌ Do NOT log: full internal notes content
- ❌ Do NOT log: all before/after values (use changed_fields list)
- ✅ Always include: timestamp, actor_email, actor_role, master_group_id, master_general_agent_id, outcome

### Entity

All events written to existing `ActivityLog` entity:
- `entity_type` = "BrokerAgencyContact" (contacts) or "MasterGroup" (settings)
- `entity_id` = contact_id or master_group_id
- `action` = event name
- `outcome` = "success" | "failed" | "blocked"
- `correlation_id` = idempotency key (for transaction tracking)

---

## 12. Safe Payload Requirements

### Response Payloads (What to Return)

**Contact List Response:**
```json
{
  "contacts": [
    {
      "id": "contact_id",
      "contact_type": "billing",
      "full_name": "Jane Doe",
      "email": "jane@example.com",
      "phone": "+1-555-0100",
      "status": "active",
      "is_primary": false
    }
  ]
}
```

**Settings Response:**
```json
{
  "notification_email_frequency": "weekly",
  "notification_channels": ["email", "sms"],
  "default_invite_role": "mga_user",
  "updated_at": "2026-05-12T10:00:00Z",
  "updated_by": "admin@example.com"
}
```

### Hidden from Response (Safe Payload Policy)

- ❌ `master_group_id` (not exposed in list responses)
- ❌ `master_general_agent_id` (internal scope field)
- ❌ Full `internal_notes` content in settings list (returned only in detail view)
- ❌ Contact full `notes` field (not exposed in list; only in detail)

### Sensitive Data Logging

- ✅ Log contact email (needed for audit trail)
- ❌ Do NOT expose email in list without need
- ❌ Do NOT log password/sensitive fields (none in contacts model, so not applicable)
- ✅ Log "notes updated" event but NOT content

---

## 13. Validation / Test Mapping

### Unit Tests (Contact CRUD)

**Test Count: 20 tests**

- ✅ Create contact with all fields
- ✅ Create contact with required fields only
- ✅ Reject create without full_name
- ✅ Reject create without email
- ✅ Reject invalid email format
- ✅ Validate email uniqueness per contact_type within Broker / Agency
- ✅ Update contact email; preserve other fields
- ✅ Deactivate contact; status → inactive
- ✅ Reactivate contact; status → active
- ✅ Mark contact as primary; unmark previous primary
- ✅ Reject two primary contacts in same Broker / Agency
- ✅ List contacts filtered by master_group_id
- ✅ List excludes inactive by default
- ✅ Get specific contact by ID
- ✅ Reject get for non-existent contact
- ✅ Contact phone optional
- ✅ Contact title optional
- ✅ Contact notes max 1000 chars (reject exceed)
- ✅ Contact type enum validation
- ✅ Contact status enum validation

### Unit Tests (Settings)

**Test Count: 8 tests**

- ✅ Get settings for Broker / Agency
- ✅ Update notification_email_frequency (enum validation)
- ✅ Update notification_channels (array validation)
- ✅ Update default_invite_role (enum validation)
- ✅ Update internal_notes (text, max 5000 chars)
- ✅ Reject notes exceeding max length
- ✅ Settings update increments updated_at
- ✅ Get internal notes (admin-only)

### Integration Tests (Permissions)

**Test Count: 12 tests**

- ✅ platform_super_admin can view/manage contacts
- ✅ mga_admin can view/manage contacts
- ✅ mga_manager can view contacts but NOT manage
- ✅ mga_user cannot view contacts
- ✅ mga_read_only cannot view contacts
- ✅ Unauthorized contact.manage returns 403
- ✅ Unauthorized contacts.view returns 403
- ✅ Unauthorized settings.manage returns 403
- ✅ Unauthorized notes.view returns 403 (admin-only)
- ✅ Unauthorized notes.manage returns 403 (admin-only)
- ✅ Permission denial logged to ActivityLog
- ✅ Denied user sees fail-closed error (NOT_FOUND_IN_SCOPE masked)

### Integration Tests (Scope)

**Test Count: 8 tests**

- ✅ User can only access contacts within their scoped MGA
- ✅ User cannot access contacts from different MGA
- ✅ Contact list filtered by master_general_agent_id
- ✅ Contact get fails for different MGA
- ✅ Contact create fails for different MGA
- ✅ Contact update fails for different MGA
- ✅ Cross-MGA access returns 401 NOT_FOUND_IN_SCOPE
- ✅ Cross-MGA denial logged to ActivityLog

### Regression Tests (Gates 6A–6H)

**Test Count: 8 tests**

- ✅ Gate 6A — Invite user workflow unaffected
- ✅ Gate 6B — TXQuote transmit unaffected
- ✅ Gate 6C — Report exports unaffected
- ✅ Gate 6D — Export history unaffected
- ✅ Gate 6E — Broker / Agency creation unaffected
- ✅ Gate 6F — Invite sub-scope assignment unaffected
- ✅ Gate 6G — Report export UI unaffected
- ✅ Gate 6H — Broker / Agency lifecycle unaffected

### Build & Lint Tests

**Test Count: 4 tests**

- ✅ Build: no errors; all modules compile
- ✅ Lint: no warnings; passes static scan
- ✅ Registry JSON: valid; no contradictions
- ✅ Ledger: updated; sections consistent

### Total Test Count: 60+ tests

---

## 14. Rollback Procedure

### Phase 1: Feature Flag Disable (Immediate, <1 minute)

If deployment encounters critical issues, disable UI immediately:

```javascript
// components/mga/MGABrokerAgencyDetailDrawer.jsx
const GATE_6L_A_CONTACTS_SETTINGS_ENABLED = false; // Rollback
```

**Effect:**
- Contacts tab hidden
- Settings tab hidden
- Notes panel hidden
- 6L-A backend endpoints return 503 Service Unavailable (fail-closed)

### Phase 2: Code Revert (If Phase 1 insufficient, ~5 minutes)

1. Delete new component files:
   - components/mga/MGABrokerAgencyContactsPanel.jsx
   - components/mga/MGABrokerAgencyContactModal.jsx
   - components/mga/MGABrokerAgencySettingsPanel.jsx
   - components/mga/MGABrokerAgencyNotesPanel.jsx

2. Revert modified files:
   - entities/MasterGroup.json (remove 4 new fields)
   - lib/mga/services/masterGroupService.js (remove 8 new methods)
   - lib/mga/permissionResolver.js (remove 6 new permissions)
   - components/mga/MGABrokerAgencyDetailDrawer.jsx (remove 6L-A tabs)

3. Delete test file:
   - tests/mga/gate6l-a-broker-agency-contacts-settings.test.js

### Phase 3: Redeploy (~2 minutes)

1. Rebuild application
2. Verify build passes
3. Deploy reverted code
4. Run Gates 6A–6H regression tests
5. Verify no cross-gate breakage

### Data Preservation

✅ BrokerAgencyContact records NOT deleted (preserved in database)  
✅ MasterGroup extended fields NOT rolled back (settings retained)  
✅ ActivityLog events preserved (full audit trail intact)  
✅ No data loss or corruption  

### Recovery (If Needed)

If contacts/settings get hidden:
- Reactivate via Phase 1 flag flip
- Access restored immediately; no data re-entry needed
- Users regain visibility to existing contacts/settings

**Rollback Time Total:** < 10 minutes

---

## 15. Registry / Ledger Update Requirements

### Registry Update (After Implementation Complete)

**File:** `docs/QUOTE_CONNECT_360_GATE_REGISTRY.json`

**Current Gate 6L Entry → Update to:**

```json
{
  "gateId": "GATE-6L-A",
  "gateName": "Broker / Agency Contacts and Settings Management",
  "phase": "6",
  "status": "IMPLEMENTATION_WORK_ORDER_COMPLETE",
  "activation": "INACTIVE",
  "implementation": "NOT_STARTED",
  "parentGate": "GATE-6L",
  "implementationScope": "Contacts + Settings only",
  "documentsScope": "DEFERRED_TO_6L-B",
  "internalEntity": "MasterGroup",
  "internalScopeField": "master_group_id",
  "capability": "Manage Broker / Agency contacts (primary, billing, operations, compliance, technical) and settings (notification preferences, invite defaults, internal notes)",
  "approved": true,
  "live": false,
  "validated": false,
  "activationDate": null,
  "authorizedRoles": ["platform_super_admin", "mga_admin"],
  "implementationFiles": [
    "components/mga/MGABrokerAgencyContactsPanel.jsx",
    "components/mga/MGABrokerAgencyContactModal.jsx",
    "components/mga/MGABrokerAgencySettingsPanel.jsx",
    "components/mga/MGABrokerAgencyNotesPanel.jsx",
    "lib/mga/services/masterGroupService.js",
    "lib/mga/permissionResolver.js",
    "tests/mga/gate6l-a-broker-agency-contacts-settings.test.js"
  ],
  "modifiedFiles": [
    "entities/MasterGroup.json",
    "components/mga/MGABrokerAgencyDetailDrawer.jsx",
    "docs/QUOTE_CONNECT_360_GATE_REGISTRY.json",
    "docs/MGA_GATE_STATUS_LEDGER.md"
  ],
  "testCount": 60,
  "testsPassed": 0,
  "buildStatus": "NOT_STARTED",
  "rollbackReady": true,
  "rollbackVerified": false,
  "designSpec": "docs/MMA_GATE_6L_BROKER_AGENCY_CONTACTS_DOCUMENTS_SETTINGS_DESIGN_SPECIFICATION.md",
  "implementationWorkOrder": "docs/MGA_GATE_6L_A_BROKER_AGENCY_CONTACTS_SETTINGS_IMPLEMENTATION_WORK_ORDER.md",
  "notes": "Gate 6L-A IMPLEMENTATION_WORK_ORDER_COMPLETE 2026-05-12. Work order created; awaiting operator approval to proceed with implementation. Contacts + settings scope approved. Documents deferred to Gate 6L-B. MasterGroup/master_group_id preserved. No runtime changes yet."
}
```

**Add Gate 6L-B Deferred Entry:**

```json
{
  "gateId": "GATE-6L-B",
  "gateName": "Broker / Agency Documents Management",
  "phase": "6",
  "status": "DEFERRED",
  "activation": "INACTIVE",
  "implementation": "NOT_STARTED",
  "parentGate": "GATE-6L",
  "implementationScope": "Document upload/download/metadata/expiration",
  "deferReason": "Private file security complexity requires separate security design and operator approval",
  "internalEntity": "BrokerAgencyDocument (design-only)",
  "internalScopeField": "master_general_agent_id, master_group_id",
  "capability": "Manage Broker / Agency documents (license, agreements, tax forms, insurance) with secure file handling and access control",
  "approved": false,
  "live": false,
  "validated": false,
  "deferralDocument": "docs/MMA_GATE_6L_BROKER_AGENCY_CONTACTS_DOCUMENTS_SETTINGS_DESIGN_SPECIFICATION.md (section 5)",
  "notes": "Gate 6L-B DEFERRED 2026-05-12. Document upload/download and private file handling deferred pending separate security design approval. No implementation until explicitly authorized."
}
```

### Ledger Update (After Implementation Complete)

**File:** `docs/MGA_GATE_STATUS_LEDGER.md`

**Add Section for Gate 6L-A:**

```markdown
### Gate 6L-A — Broker / Agency Contacts and Settings Management

| Field | Value |
|-------|-------|
| Gate ID | GATE-6L-A |
| Status | IMPLEMENTATION_WORK_ORDER_COMPLETE |
| Activation | INACTIVE |
| Implementation | NOT_STARTED |
| Approved Scope | Contacts (primary, billing, operations, compliance, technical) + Settings (notifications, defaults, notes) |
| Deferred Scope | Documents (Gate 6L-B) |
| MasterGroup | Preserved (no rename) |
| master_group_id | Preserved (no rename) |
| Work Order | docs/MGA_GATE_6L_A_BROKER_AGENCY_CONTACTS_SETTINGS_IMPLEMENTATION_WORK_ORDER.md |
| Next Action | Operator approval for implementation |
| Test Count | 60+ tests planned |
| Rollback | Ready via feature flag |
| Notes | Contacts + settings management design approved. Documents deferred due to security complexity. MasterGroup/master_group_id preserved. No runtime changes yet. |
```

**Add Section for Gate 6L-B:**

```markdown
### Gate 6L-B — Broker / Agency Documents Management

| Field | Value |
|-------|-------|
| Gate ID | GATE-6L-B |
| Status | DEFERRED |
| Activation | INACTIVE |
| Implementation | NOT_STARTED |
| Reason | Private file security complexity; awaiting separate approval |
| Scope | Document upload, download, metadata, expiration (design-only) |
| Next Action | Separate operator approval required before design phase |
| Notes | Document handling design exists but deferred pending security review. No implementation in 6L-A or 6L-B until approved. |
```

---

## 16. Operator Approval Checkpoint

### Pre-Implementation Approval Gate

**Before 6L-A implementation begins, the following must be approved by operator:**

### Approval Checklist

- [ ] Gate 6L-A Design Specification reviewed and accepted
- [ ] Gate 6L-A Implementation Work Order reviewed and accepted
- [ ] Scope classification (Contacts + Settings IN SCOPE; Documents DEFERRED) approved
- [ ] MasterGroup preservation strategy approved
- [ ] master_group_id preservation strategy approved
- [ ] Permission model (contacts.view/manage, settings.view/manage, notes.view/manage) approved
- [ ] Backend service actions (8 contact methods + 3 settings methods) approved
- [ ] Frontend components structure (tabs in detail drawer) approved
- [ ] Audit logging approach approved
- [ ] Safe payload policy approved
- [ ] Validation test plan (60+ tests) approved
- [ ] Rollback procedure verified
- [ ] Registry/ledger update plan approved
- [ ] Gate 6L-B deferral (documents) accepted

### Approval Decision Options

**Option 1: Proceed with 6L-A Implementation**
- Operator approves this work order
- Implementation begins immediately
- Estimated 5–7 days to completion

**Option 2: Request Modifications to 6L-A Scope**
- Operator requests changes to design/scope
- Modifications made to this work order
- Revised work order submitted for re-approval

**Option 3: Defer Gate 6L-A Entirely**
- Operator defers both 6L-A and 6L-B pending business decision
- All 6L gates remain INACTIVE
- Gates 6A–6H remain ACTIVE

---

## Document Control

| Field | Value |
|-------|-------|
| Document ID | MGA_GATE_6L_A_IMPLEMENTATION_WORK_ORDER |
| Version | 1.0 |
| Created | 2026-05-12 |
| Status | IMPLEMENTATION_WORK_ORDER_COMPLETE — AWAITING OPERATOR APPROVAL |
| Next Step | Operator approval decision (proceed/defer/modify) |
| Author | Platform Engineering — MGA Program Management |
| Distribution | Operator review; implementation team archive |
| Review By | Operator — Pre-implementation approval gate |