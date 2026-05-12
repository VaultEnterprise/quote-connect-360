# Gate 6L Design Specification
## Broker / Agency Contacts, Documents, and Settings Management

**Document Type:** Design Specification (Split-Safe)  
**Classification:** Internal — Platform Engineering / Program Management  
**Date:** 2026-05-12  
**Version:** 1.0  
**Status:** DESIGN_SPEC_COMPLETE — READY FOR WORK ORDER  
**Prepared By:** Platform Engineering — MGA Program Management  

---

## Overview

Gate 6L enables comprehensive Broker / Agency management through contacts, settings, and (deferred) documents. This design follows a **split-safe approach**:

- **Gate 6L-A:** Contacts + Settings (IN SCOPE — ready for implementation)
- **Gate 6L-B:** Documents (DEFERRED — design-only until separately approved)

**Key Constraint:** Documents deferred due to private file handling security complexity. Gate 6L-A alone provides substantial operational value.

---

## 1. Final Gate 6L-A Scope

### Scope Classification

| Area | Classification | Status | Rationale |
|------|-----------------|--------|-----------|
| **Broker / Agency Contacts** | IN SCOPE / 6L-A | **APPROVED FOR IMPLEMENTATION** | Primary, billing, operations, compliance contacts; core operational requirement |
| **Broker / Agency Settings** | IN SCOPE / 6L-A | **APPROVED FOR IMPLEMENTATION** | Notification preferences, invite defaults, internal notes; admin-level configuration |
| **Internal Notes** | IN SCOPE / 6L-A | **APPROVED FOR IMPLEMENTATION** | Safe payload; permissioned to admin only; extends existing MasterGroup.notes field |
| **Document Upload/Download** | DEFERRED / 6L-B | **NOT IN SCOPE** | Deferred to Gate 6L-B; requires separate security design; private file handling complexity |
| **Document Metadata** | DEFERRED / 6L-B | **NOT IN SCOPE** | Deferred; requires document entity design; no runtime behavior in 6L-A |

### Detailed 6L-A Scope

**Contacts Management:**
- ✅ Create new contact (primary, billing, operations, compliance, technical)
- ✅ View contact details
- ✅ Update contact information
- ✅ Deactivate/remove contact
- ✅ Mark as primary contact
- ✅ Display all contacts for a Broker / Agency

**Settings Management:**
- ✅ View notification preferences (email frequency, channels)
- ✅ Update notification preferences
- ✅ Set default invite role for new users
- ✅ Set default Broker / Agency scope assignment behavior
- ✅ View/edit internal admin notes
- ✅ Display settings summary

**Audit & Compliance:**
- ✅ Log all contact create/update/delete events
- ✅ Log settings changes
- ✅ Log unauthorized access attempts
- ✅ Display activity feed

---

## 2. Data Model Design

### Design Decision: Hybrid Model (RECOMMENDED)

**MasterGroup Extensions (existing entity):**
```json
{
  "properties": {
    "primary_contact_email": { "type": "string" },
    "primary_contact_phone": { "type": "string" },
    "primary_contact_title": { "type": "string" },
    "notification_email_frequency": { 
      "type": "string", 
      "enum": ["never", "daily", "weekly", "monthly"] 
    },
    "notification_channels": { 
      "type": "array", 
      "items": { "type": "string" }, 
      "example": ["email", "sms"] 
    },
    "default_invite_role": { 
      "type": "string", 
      "enum": ["mga_user", "mga_read_only"], 
      "default": "mga_user" 
    },
    "internal_notes": { 
      "type": "string", 
      "maxLength": 5000,
      "description": "Admin-only notes; permissioned viewing" 
    }
  }
}
```

**New Entity: BrokerAgencyContact**
```json
{
  "name": "BrokerAgencyContact",
  "type": "object",
  "properties": {
    "master_group_id": {
      "type": "string",
      "description": "Parent Broker / Agency"
    },
    "master_general_agent_id": {
      "type": "string",
      "description": "MGA scope"
    },
    "contact_type": {
      "type": "string",
      "enum": ["primary", "billing", "operations", "compliance", "technical", "other"],
      "default": "other"
    },
    "full_name": {
      "type": "string",
      "description": "Contact full name"
    },
    "title": {
      "type": "string",
      "description": "Contact job title"
    },
    "email": {
      "type": "string",
      "description": "Contact email address"
    },
    "phone": {
      "type": "string",
      "description": "Contact phone number"
    },
    "status": {
      "type": "string",
      "enum": ["active", "inactive"],
      "default": "active"
    },
    "is_primary": {
      "type": "boolean",
      "default": false,
      "description": "Whether this is the primary contact for the Broker / Agency"
    },
    "notes": {
      "type": "string",
      "description": "Internal notes about this contact"
    }
  },
  "required": ["master_group_id", "contact_type", "full_name", "email"]
}
```

### Preservation Guardrails

✅ MasterGroup entity name PRESERVED  
✅ master_group_id field PRESERVED  
✅ masterGroupService used (extended, not replaced)  
✅ No internal structure renamed  
✅ No schema migration to existing records  

---

## 3. Contact Model (BrokerAgencyContact)

### Fields

| Field | Type | Required | Max Length | Enum Values | Description |
|-------|------|----------|-----------|------------|-------------|
| `id` | string | ✅ (auto) | — | — | Unique contact identifier |
| `master_group_id` | string | ✅ | — | — | Parent Broker / Agency ID |
| `master_general_agent_id` | string | ✅ | — | — | MGA scope for access control |
| `contact_type` | string | ✅ | — | primary, billing, operations, compliance, technical, other | Role/classification |
| `full_name` | string | ✅ | 255 | — | Contact full name |
| `title` | string | ❌ | 255 | — | Job title (optional) |
| `email` | string | ✅ | 255 | — | Email address (validated) |
| `phone` | string | ❌ | 20 | — | Phone number (optional) |
| `status` | string | ✅ | — | active, inactive | Contact status |
| `is_primary` | boolean | ✅ | — | — | Whether primary contact for Broker / Agency |
| `notes` | string | ❌ | 1000 | — | Internal contact notes |
| `created_at` | date-time | ✅ (auto) | — | — | Creation timestamp |
| `updated_at` | date-time | ✅ (auto) | — | — | Last update timestamp |
| `created_by` | string | ✅ (auto) | — | — | User email of creator |

### Contact Types

- **primary** — Main contact for general inquiries
- **billing** — Billing/invoice contact
- **operations** — Operations point-of-contact
- **compliance** — Compliance/legal contact
- **technical** — Technical contact for integration/API
- **other** — Miscellaneous contact

### Rules

- Each Broker / Agency must have at least one primary contact
- Only one contact can be marked `is_primary = true` per Broker / Agency (enforced via validation)
- Email must be unique per contact (no duplicate emails for same contact_type within same Broker / Agency)
- Status: active/inactive; inactive contacts hidden from default lists but preserved in audit trail

---

## 4. Settings Model

### Broker / Agency Settings (Embedded in MasterGroup)

| Setting | Type | Default | Allowed Values | Description |
|---------|------|---------|-----------------|-------------|
| `notification_email_frequency` | string | "weekly" | never, daily, weekly, monthly | Email notification frequency |
| `notification_channels` | array | ["email"] | email, sms, webhook | Notification delivery channels |
| `default_invite_role` | string | "mga_user" | mga_user, mga_read_only | Default role for invited users |
| `internal_notes` | string | "" | (any text, max 5000 chars) | Admin-only internal notes |

### Settings Management

**View Settings:**
- Admin users (mga_admin, platform_super_admin) can view all settings
- Settings displayed in detail panel

**Update Settings:**
- Only mga_admin, platform_super_admin can update
- All changes logged to ActivityLog
- Updated_at timestamp auto-updated

**Safe Payload:**
- No sensitive data exported in bulk exports
- Internal notes viewable only by admin
- Settings visible in detail view, not in list view

---

## 5. Document Model — Gate 6L-B (Deferred)

### Design-Only (Not Implemented in 6L-A)

Document upload, download, and file handling is **DEFERRED to Gate 6L-B** due to private file security complexity.

**Design-Only Entity (Specification, not implemented):**

```json
{
  "name": "BrokerAgencyDocument",
  "status": "DESIGN_ONLY_6L_B_DEFERRED",
  "properties": {
    "master_group_id": "string",
    "master_general_agent_id": "string",
    "document_type": "enum: [license, agreement, tax_form, insurance, other]",
    "document_name": "string",
    "file_uri": "string (private file URI — NOT exposed to frontend)",
    "uploaded_by": "string",
    "uploaded_at": "date-time",
    "expiration_date": "date (optional)",
    "notes": "string"
  }
}
```

### Deferred Scope

❌ Document upload NOT in 6L-A  
❌ Document download NOT in 6L-A  
❌ Private file URI handling NOT in 6L-A  
❌ Signed URL generation NOT in 6L-A  
❌ Document delete NOT in 6L-A  

**When documents are approved for Gate 6L-B:**
- Separate design specification for document security model
- Private file handling via approved API
- Signed URL generation (short-lived, 5-minute expiry)
- Audit logging for all document access
- Separate implementation work order

---

## 6. Permission Model (6L-A)

### New Permissions to Add

| Permission | Action | Type | Allowed Roles | Denied Roles | Rationale |
|-----------|--------|------|----------------|--------------|-----------|
| `mastergroup.contacts.view` | View contact list/details | READ | platform_super_admin, mga_admin, mga_manager | mga_user, mga_read_only | Operational visibility |
| `mastergroup.contacts.manage` | Create/update/delete contacts | WRITE | platform_super_admin, mga_admin | mga_manager, mga_user, mga_read_only | Admin-only; prevents accidental removal |
| `mastergroup.settings.view` | View settings | READ | platform_super_admin, mga_admin, mga_manager | mga_user, mga_read_only | Transparency |
| `mastergroup.settings.manage` | Update settings | WRITE | platform_super_admin, mga_admin | mga_manager, mga_user, mga_read_only | Admin-only |
| `mastergroup.notes.view` | View internal notes | READ | platform_super_admin, mga_admin | mga_manager, mga_user, mga_read_only | Protect sensitive admin notes |
| `mastergroup.notes.manage` | Edit internal notes | WRITE | platform_super_admin, mga_admin | mga_manager, mga_user, mga_read_only | Admin-only |

### Deferred (Gate 6L-B)

The following remain **NOT GRANTED** until Gate 6L-B is separately approved:

```
mastergroup.documents.view
mastergroup.documents.upload
mastergroup.documents.download
mastergroup.documents.delete
```

### permissionResolver Updates (6L-A)

```javascript
mastergroup: {
  // ... existing permissions ...
  contacts: {
    view:   { platform_super_admin: A, mga_admin: A, mga_manager: A, mga_user: D, mga_read_only: D },
    manage: { platform_super_admin: A, mga_admin: A, mga_manager: D, mga_user: D, mga_read_only: D }
  },
  settings: {
    view:   { platform_super_admin: A, mga_admin: A, mga_manager: A, mga_user: D, mga_read_only: D },
    manage: { platform_super_admin: A, mga_admin: A, mga_manager: D, mga_user: D, mga_read_only: D }
  },
  notes: {
    view:   { platform_super_admin: A, mga_admin: A, mga_manager: D, mga_user: D, mga_read_only: D },
    manage: { platform_super_admin: A, mga_admin: A, mga_manager: D, mga_user: D, mga_read_only: D }
  }
}
```

---

## 7. Backend Service Design (6L-A)

### Service Layer: masterGroupService (Extended)

**Existing Methods (Preserved):**
- `listMasterGroups(mga_id)`
- `getMasterGroup(id)`
- `createMasterGroup(data)`
- `updateMasterGroup(id, data)`
- `deactivateMasterGroup(id)`
- `reactivateMasterGroup(id)`

**New Methods (6L-A):**

#### Contacts Management

```javascript
// List all contacts for a Broker / Agency
listBrokerAgencyContacts(master_group_id, filters = {})
  → Returns: [{ id, contact_type, name, email, phone, status, is_primary }, ...]
  → Enforces: permission check (contacts.view), scopeGate, audit logging

// Get specific contact
getBrokerAgencyContact(master_group_id, contact_id)
  → Returns: { id, contact_type, name, email, phone, status, is_primary, notes, created_at, updated_at }
  → Enforces: permission check, scope, audit logging

// Create new contact
createBrokerAgencyContact(master_group_id, contactData)
  → Input: { contact_type, full_name, email, phone?, title?, notes? }
  → Returns: { id, master_group_id, ... }
  → Enforces: permission check (contacts.manage), scope, validation, audit logging, idempotency

// Update contact
updateBrokerAgencyContact(master_group_id, contact_id, updates)
  → Input: { full_name?, email?, phone?, title?, status?, is_primary?, notes? }
  → Returns: updated contact
  → Enforces: permission check (contacts.manage), scope, one-primary validation, audit logging

// Deactivate contact
deactivateBrokerAgencyContact(master_group_id, contact_id)
  → Sets status to inactive; preserves record for audit
  → Enforces: permission check (contacts.manage), scope, audit logging
```

#### Settings Management

```javascript
// Get Broker / Agency settings
getBrokerAgencySettings(master_group_id)
  → Returns: { notification_email_frequency, notification_channels, default_invite_role, internal_notes }
  → Enforces: permission check (settings.view), scope, audit logging

// Update settings
updateBrokerAgencySettings(master_group_id, settingsData)
  → Input: { notification_email_frequency?, notification_channels?, default_invite_role?, internal_notes? }
  → Returns: updated settings
  → Enforces: permission check (settings.manage), scope, audit logging

// Get internal notes (admin-only)
getBrokerAgencyNotes(master_group_id)
  → Returns: { notes, updated_at, updated_by }
  → Enforces: permission check (notes.view), scope, admin-only
```

### Service Constraints (All Methods)

✅ **permissionResolver:** Check role × domain × action before executing  
✅ **scopeGate:** Verify `master_general_agent_id` matches authenticated user's scope  
✅ **MGA Boundary:** No cross-MGA data access  
✅ **master_group_id Boundary:** Operations scoped to single Broker / Agency  
✅ **Safe Payload:** No sensitive data in responses; sanitize output  
✅ **Audit Logging:** Every action logged to ActivityLog entity  
✅ **Idempotency:** Repeat calls safe; no duplicate records  
✅ **Fail-Closed:** Default DENY; explicit ALLOW only  

---

## 8. Frontend Design (6L-A)

### UI Components

#### MGABrokerAgencyContactsPanel.jsx
**Location:** Inside Broker / Agency detail drawer (Gate 6H)  
**Purpose:** View/manage contacts for a Broker / Agency  
**Visibility:** Conditional on `mastergroup.contacts.view` permission  

**Features:**
- ✅ List all active contacts (table with name, email, phone, type, is_primary badge)
- ✅ Search/filter contacts by type
- ✅ Add new contact button (conditional on `contacts.manage` permission)
- ✅ Edit contact button per row (conditional on `contacts.manage`)
- ✅ Deactivate contact button (soft-delete, preserves for audit)
- ✅ Mark as primary contact (conditional on `contacts.manage`)
- ✅ Loading state; empty state when no contacts

#### MGABrokerAgencyContactModal.jsx
**Purpose:** Add/edit contact in modal  
**Visibility:** Conditional on `mastergroup.contacts.manage`  

**Fields:**
- Contact Type (dropdown: primary, billing, operations, compliance, technical, other)
- Full Name (required, text input)
- Title (optional, text input)
- Email (required, email input with validation)
- Phone (optional, tel input)
- Notes (optional, textarea)

**Actions:**
- Save (creates/updates contact; validates required fields; logs audit event)
- Cancel (closes modal without saving)

#### MGABrokerAgencySettingsPanel.jsx
**Location:** Settings tab in Broker / Agency detail drawer  
**Purpose:** View/manage Broker / Agency settings  
**Visibility:** Conditional on `mastergroup.settings.view`  

**Features:**
- ✅ Notification Preferences (email frequency toggle; channels checkboxes)
- ✅ Default Invite Role (dropdown: mga_user, mga_read_only)
- ✅ Internal Notes (textarea; admin-only; conditional on `notes.manage`)
- ✅ Save button (conditional on `settings.manage`)
- ✅ Last Updated timestamp (display only)

#### MGABrokerAgencyNotesPanel.jsx (Optional)
**Purpose:** Standalone internal notes viewing/editing  
**Visibility:** Conditional on `mastergroup.notes.view`  
**Edit:** Conditional on `mastergroup.notes.manage` (admin-only)  

**Features:**
- ✅ Display current notes
- ✅ Edit button (opens notes editor if permitted)
- ✅ Updated by / timestamp
- ✅ Character count (max 5000)

### Integration Points

**Mount Location:** Extend existing `MGABrokerAgencyDetailDrawer.jsx` from Gate 6H with new tabs:
- Existing tabs: Details, Activity
- New tabs: Contacts, Settings, Notes

**No Changes to:** MGAMasterGroupPanel, MGABrokerAgencyEditModal, MGABrokerAgencyDeactivateDialog

---

## 9. Audit Events (6L-A)

### Event Types

| Event | Trigger | Data Logged | Permission Check |
|-------|---------|------------|------------------|
| `broker_agency_contact_created` | New contact added | contact_id, type, email, created_by | contacts.manage |
| `broker_agency_contact_updated` | Contact modified | contact_id, changed fields, updated_by | contacts.manage |
| `broker_agency_contact_deactivated` | Contact status→inactive | contact_id, deactivated_by | contacts.manage |
| `broker_agency_settings_updated` | Settings changed | changed settings, updated_by | settings.manage |
| `broker_agency_notes_updated` | Notes edited | updated_by (NOT content) | notes.manage |
| `broker_agency_contact_view_denied` | Unauthorized access attempt | user_email, master_group_id, reason | contacts.view |
| `broker_agency_settings_view_denied` | Unauthorized access attempt | user_email, master_group_id, reason | settings.view |

### Audit Logging Implementation

**Service Layer:**
- All CRUD operations call `auditService.log(event, data)`
- Include: timestamp, actor_email, actor_role, master_group_id, master_general_agent_id, action, outcome

**Sensitive Data:**
- ❌ Do NOT log full internal notes content
- ✅ Log "notes updated" event + update timestamp
- ✅ Log contact email/phone (necessary for audit)
- ✅ Log who changed what, not detailed content changes

---

## 10. Validation Plan (6L-A)

### Unit Tests (Contacts)

- ✅ Create contact with all required fields
- ✅ Create contact with minimal fields (name, email only)
- ✅ Reject contact creation without name
- ✅ Reject contact creation without email
- ✅ Reject invalid email format
- ✅ Update contact email; validate uniqueness within contact_type
- ✅ Deactivate contact; status changes to inactive
- ✅ Reactivate contact; status changes to active
- ✅ Mark contact as primary; unmarks previous primary
- ✅ List contacts filtered by Broker / Agency ID
- ✅ List excludes inactive contacts by default

### Unit Tests (Settings)

- ✅ Get settings for Broker / Agency
- ✅ Update notification frequency (daily/weekly/monthly/never)
- ✅ Update notification channels (email, sms, webhook)
- ✅ Update default invite role (mga_user, mga_read_only)
- ✅ Update internal notes (text, max 5000 chars)
- ✅ Reject notes exceeding max length
- ✅ Settings update increments updated_at timestamp

### Integration Tests (Permissions)

- ✅ platform_super_admin can view/manage contacts
- ✅ mga_admin can view/manage contacts
- ✅ mga_manager can view contacts but NOT manage
- ✅ mga_user cannot view contacts
- ✅ mga_read_only cannot view contacts
- ✅ Unauthorized user gets 403 Forbidden + audit event
- ✅ Same permission checks apply to settings

### Integration Tests (Scope)

- ✅ User can only access contacts within their scoped MGA
- ✅ User cannot access contacts from different MGA (scopeGate blocks)
- ✅ Contact list filtered by master_general_agent_id
- ✅ Cross-MGA contact access attempt triggers audit event + denial

### Regression Tests (Gates 6A–6H)

- ✅ Gate 6A — Invite user workflow unaffected
- ✅ Gate 6B — TXQuote transmit unaffected
- ✅ Gate 6C — Report exports unaffected
- ✅ Gate 6D — Export history unaffected
- ✅ Gate 6E — Broker / Agency creation unaffected
- ✅ Gate 6F — Invite sub-scope assignment unaffected
- ✅ Gate 6G — Report export UI unaffected
- ✅ Gate 6H — Broker / Agency lifecycle (edit, deactivate) unaffected

### Build & Lint Tests

- ✅ Build: no errors; all modules compile
- ✅ Lint: no warnings; passes static scan
- ✅ Registry JSON: valid; no contradictions
- ✅ Ledger: updated; sections consistent

---

## 11. Rollback Strategy (6L-A)

### Rollback Trigger

If Gate 6L-A deployment encounters critical issues:

**Quick Disable (Feature Flag):**
```javascript
// components/mga/MGABrokerAgencyDetailDrawer.jsx
const GATE_6L_A_CONTACTS_SETTINGS_ENABLED = false; // Rollback: set to false
```

When false:
- Contacts tab hidden
- Settings tab hidden
- Notes panel hidden
- All 6L-A endpoints return 503 Service Unavailable (fail-closed)

**Rollback Scope:**
- Hide UI components (MGABrokerAgencyContactsPanel, MGABrokerAgencySettingsPanel)
- Disable backend endpoints
- Preserve existing contact/settings records (no data deletion)
- Preserve Broker / Agency lifecycle (Gates 6A–6H unchanged)

**Data Preservation:**
- BrokerAgencyContact records not deleted
- MasterGroup fields (notification_email_frequency, etc.) not rolled back
- ActivityLog events preserved for audit trail
- No data loss; purely UI/endpoint disable

**Rollback Time:** < 5 minutes (code change + redeploy)

---

## 12. Recommendation

### Gate 6L-A Design Status

**Status:** ✅ **DESIGN_SPEC_COMPLETE — READY FOR WORK ORDER**

**Approved Scope:**
- ✅ Broker / Agency Contacts (create, view, update, deactivate)
- ✅ Broker / Agency Settings (notifications, invite defaults, notes)
- ✅ Audit logging for all operations
- ✅ Permission model (mastergroup.contacts, mastergroup.settings, mastergroup.notes)
- ✅ Frontend panels (contacts, settings, notes)
- ✅ Backend service extensions (masterGroupService)

### Gate 6L-B Documents Status

**Status:** ❌ **DESIGN_ONLY — DEFERRED (Awaiting Separate Approval)**

**Deferred Scope:**
- ❌ Document upload/download
- ❌ Private file URI handling
- ❌ Signed URL generation
- ❌ Document delete/expiration
- ❌ BrokerAgencyDocument entity (design exists, not implemented)

**Deferral Rationale:**
- Private file security complexity
- Signed URL exposure risk
- Separate security design needed
- Can be implemented in Gate 6L-B after 6L-A validation

### Next Steps

1. ✅ Update registry to DESIGN_SPEC_COMPLETE
2. ✅ Proceed to Gate 6L-A Implementation Work Order
3. ⏳ Wait for separate approval before Gate 6L-B discovery
4. ❌ Do not implement Gate 6L-B until explicitly authorized

### Implementation Timeline

- **Gate 6L-A Work Order:** Ready now
- **Gate 6L-A Implementation:** Estimated 5–7 days (contacts + settings CRUD, validation, regression tests)
- **Gate 6L-B:** Separate discovery/approval cycle required

---

## Document Control

| Field | Value |
|-------|-------|
| Document ID | MGA_GATE_6L_DESIGN_SPECIFICATION |
| Version | 1.0 |
| Created | 2026-05-12 |
| Status | DESIGN_SPEC_COMPLETE |
| Next Document | MGA_GATE_6L_A_IMPLEMENTATION_WORK_ORDER |
| Author | Platform Engineering — MGA Program Management |