# Gate 6L Discovery / Preflight
## Broker / Agency Contacts, Documents, and Settings Management

**Document Type:** Discovery & Preflight Assessment  
**Classification:** Internal — Platform Engineering / Program Management  
**Date:** 2026-05-12  
**Version:** 1.0  
**Status:** DISCOVERY_PREFLIGHT — NOT_STARTED  
**Prepared By:** Platform Engineering — MGA Program Management  

---

## 1. Current Capability Baseline

### Confirmed Baseline from Gates 6E, 6F, 6H

| Gate | Capability | Status | Internal Model | Scope Field |
|------|-----------|--------|-----------------|------------|
| **Gate 6E** | Broker / Agency organization creation | ACTIVE | MasterGroup | master_group_id |
| **Gate 6F** | Broker / Agency invite sub-scope assignment | ACTIVE | MasterGroup | master_group_id |
| **Gate 6H** | Broker / Agency lifecycle management (edit, deactivate, reactivate) | ACTIVE | MasterGroup | master_group_id |

### Preserved Internal Model

- **Internal Entity:** `MasterGroup` (preserved, not renamed)
- **Internal Scope Field:** `master_group_id` (preserved, not renamed)
- **User-Facing Label:** "Broker / Agency" (terminology only; internal structure unchanged)
- **Current MasterGroup Fields:**
  - `name` (display name)
  - `code` (unique business code)
  - `status` (active / inactive / suspended)
  - `address`, `city`, `state`, `zip` (location)
  - `phone`, `email` (contact info)
  - `primary_contact_name` (single contact reference)
  - `notes` (internal admin notes)
  - `master_general_agent_id` (MGA scope)
  - `mga_assigned_at`, `mga_assigned_by` (ownership tracking)
  - `mga_migration_batch_id`, `mga_migration_status`, `mga_migration_anomaly_class` (Phase 4 attributes)
  - `mga_business_approval_status`, `mga_business_approver`, `mga_business_approved_at` (approval tracking)

### Current UI Components

- `components/mga/MGAMasterGroupPanel.jsx` — Broker / Agency list view
- `components/mga/MGABrokerAgencyDetailDrawer.jsx` — Detail/read-only view
- `components/mga/MGABrokerAgencyEditModal.jsx` — Profile editing
- `components/mga/MGABrokerAgencyDeactivateDialog.jsx` — Deactivation confirmation

### Current Service Layer

- `lib/mga/services/masterGroupService.js` — CRUD + lifecycle operations
- `lib/mga/permissionResolver.js` — RBAC matrix (mastergroup domain)
- `lib/mga/scopeGate.js` — Scope enforcement
- `lib/mga/scopeResolver.js` — Scope resolution

---

## 2. Gate 6L Proposed Scope

Gate 6L should enable comprehensive contact, document, and settings management for Broker / Agency organizations.

### Proposed Areas: Scope Classification

#### A. Broker / Agency Contacts

| Contact Type | Proposed Scope | Classification | Rationale |
|--------------|----------------|-----------------|-----------|
| Primary contact (name, email, phone) | Expand primary_contact_name field or create Contact relation | **IN SCOPE** | Critical for business operations; already partially modeled |
| Billing contact | Add to contacts management | **IN SCOPE** | Essential for invoicing / financial ops |
| Operational contact | Add to contacts management | **IN SCOPE** | Operational workflows |
| Compliance contact | Add to contacts management | **IN SCOPE** | Regulatory communications |
| Support contact | Add to contacts management | **DEFERRED** | Can be added in future iteration |

**Recommendation:** Include primary, billing, operational, compliance contacts in Gate 6L.

#### B. Document Storage / References

| Document Type | Proposed Scope | Classification | Rationale |
|--------------|----------------|-----------------|-----------|
| License documents | Metadata + safe file reference | **IN SCOPE** | Required for compliance |
| Agreements | Metadata + safe file reference | **IN SCOPE** | Legal requirement |
| W9 / Tax documents | Metadata + safe file reference | **IN SCOPE** | Operational requirement |
| Insurance certificates | Metadata + safe file reference | **IN SCOPE** | Risk management |
| General attachments | Metadata + safe file reference | **DEFERRED** | Lower priority; can be Phase 2 |

**Recommendation:** Include license, agreements, tax, and insurance documents. Defer general attachments.

#### C. Broker / Agency Settings

| Setting | Proposed Scope | Classification | Rationale |
|---------|----------------|-----------------|-----------|
| Notification preferences | View + manage | **IN SCOPE** | User preference management |
| Default invite permissions / defaults | View + manage | **IN SCOPE** | Operational efficiency |
| Internal admin notes | View + manage | **IN SCOPE** | Already exists on MasterGroup; extend field |
| Profile attachments (logo, etc.) | Metadata only | **DEFERRED** | Requires separate branding/logo handling; low priority |
| Audit trail / access log | View only | **IN SCOPE** | Compliance + transparency |

**Recommendation:** Include notifications, invite defaults, notes, and audit trail.

---

## 3. Existing Files / Entities Inventory

### Current Entities

**MasterGroup** (entities/MasterGroup.json)
- Already contains partial contact info and notes
- Scope fields: `master_general_agent_id`, `master_group_id` (inherited from parent), `code`, `status`
- Currently supports: single primary contact name, notes
- **Decision:** Extend MasterGroup with new contact/settings fields OR create separate BrokerAgencyContact entity

### Current Components

- `components/mga/MGAMasterGroupPanel.jsx` — List view with create/view/edit/deactivate
- `components/mga/MGABrokerAgencyDetailDrawer.jsx` — Detail view; currently read-only except for action buttons
- `components/mga/MGABrokerAgencyEditModal.jsx` — Edit profile (name, code, address, etc.)
- `components/mga/MGABrokerAgencyDeactivateDialog.jsx` — Deactivation workflow

**Decision:** Extend MGABrokerAgencyDetailDrawer with contacts/documents/settings tabs, or create separate sub-panels.

### Current Service Layer

- `lib/mga/services/masterGroupService.js` — Manages MasterGroup CRUD
- `lib/mga/permissionResolver.js` — RBAC; domain: `mastergroup`
- `lib/mga/scopeGate.js` — Enforces MGA scope
- `lib/mga/scopeResolver.js` — Resolves Broker / Agency membership

**Decision:** Extend masterGroupService with contact/document/settings methods, or create separate services (contactService, documentService, settingsService).

### Document / File Entities

**Current State:** No explicit BrokerAgencyDocument entity exists. File storage handled via:
- `functions/exportProposalPDF` (case-level exports, not suitable for long-term storage)
- `base44.integrations.Core.UploadFile` (public file upload)
- `base44.integrations.Core.UploadPrivateFile` (private file upload — **RECOMMENDED for Broker / Agency documents**)

**Decision:** Create `BrokerAgencyDocument` entity to store document metadata and private file references.

---

## 4. Data Model Assessment

### Option 1: Extend MasterGroup + Create BrokerAgencyContact + BrokerAgencyDocument (RECOMMENDED)

**MasterGroup Extensions:**
```json
{
  "primary_contact_email": "string",
  "primary_contact_phone": "string",
  "billing_contact_email": "string",
  "operational_contact_email": "string",
  "compliance_contact_email": "string",
  "notification_preferences": { "type": "object" },
  "default_invite_permissions": { "type": "array" },
  "internal_notes": "string" (already exists; extend max length)
}
```

**New Entity: BrokerAgencyContact**
```json
{
  "name": "BrokerAgencyContact",
  "properties": {
    "master_group_id": "string",
    "master_general_agent_id": "string",
    "contact_type": "enum: [primary, billing, operational, compliance]",
    "full_name": "string",
    "email": "string",
    "phone": "string",
    "title": "string",
    "notes": "string",
    "is_primary": "boolean"
  }
}
```

**New Entity: BrokerAgencyDocument**
```json
{
  "name": "BrokerAgencyDocument",
  "properties": {
    "master_group_id": "string",
    "master_general_agent_id": "string",
    "document_type": "enum: [license, agreement, tax_form, insurance, other]",
    "document_name": "string",
    "file_uri": "string (private file URI from UploadPrivateFile)",
    "uploaded_by": "string (user email)",
    "uploaded_at": "date-time",
    "expiration_date": "date (optional)",
    "notes": "string",
    "is_current": "boolean"
  }
}
```

### Guardrails — Safe Document Handling

- ✅ Store metadata + private file URI only
- ✅ Never expose private file URI to frontend directly
- ✅ Generate short-lived signed URLs via backend only
- ✅ Audit every access (view, download, delete)
- ✅ Restrict file types (PDF, DOCX, XLSX only)
- ✅ Restrict file size (10MB per file)
- ✅ Sanitize file names

---

## 5. Permission Model Assessment

### Proposed New Permissions

| Permission | Action | Allowed Roles | Denied Roles | Rationale |
|-----------|--------|----------------|--------------|-----------|
| `mastergroup.contacts.view` | View contacts | platform_super_admin, mga_admin, mga_manager | mga_user, mga_read_only | Operational access for manager-level roles |
| `mastergroup.contacts.manage` | Add/edit/delete contacts | platform_super_admin, mga_admin | mga_manager, mga_user, mga_read_only | Admin-only; prevents accidental contact removal |
| `mastergroup.documents.view` | View document metadata | platform_super_admin, mga_admin, mga_manager | mga_user, mga_read_only | Operational transparency |
| `mastergroup.documents.upload` | Upload new documents | platform_super_admin, mga_admin | mga_manager, mga_user, mga_read_only | Admin-only for security/compliance |
| `mastergroup.documents.download` | Generate signed download URL | platform_super_admin, mga_admin, mga_manager | mga_user, mga_read_only | Manager-level operational access |
| `mastergroup.documents.delete` | Delete document record | platform_super_admin, mga_admin | mga_manager, mga_user, mga_read_only | Admin-only for audit trail |
| `mastergroup.settings.view` | View settings | platform_super_admin, mga_admin, mga_manager | mga_user, mga_read_only | Operational viewing |
| `mastergroup.settings.manage` | Edit settings | platform_super_admin, mga_admin | mga_manager, mga_user, mga_read_only | Admin-only |
| `mastergroup.notes.view` | View internal notes | platform_super_admin, mga_admin | mga_manager, mga_user, mga_read_only | Restrict sensitive notes to admin |
| `mastergroup.notes.manage` | Edit internal notes | platform_super_admin, mga_admin | mga_manager, mga_user, mga_read_only | Admin-only |

### Existing Permission Support

**Current `lib/mga/permissionResolver.js`:**
- Already has `mastergroup` domain
- Already supports actions: view, read, list, detail, create, edit, delete, approve, export, upload, download, preview, manage_users, manage_settings, view_financials, view_audit, administer_quarantine
- **Add:** contacts.view, contacts.manage, documents.view, documents.upload, documents.download, documents.delete, settings.view, settings.manage, notes.view, notes.manage

### Default Allowed Roles (No Broadening)

```javascript
{
  "mastergroup": {
    "contacts": {
      "view":   { platform_super_admin: A, mga_admin: A, mga_manager: A, mga_user: D, mga_read_only: D },
      "manage": { platform_super_admin: A, mga_admin: A, mga_manager: D, mga_user: D, mga_read_only: D }
    },
    "documents": {
      "view":     { platform_super_admin: A, mga_admin: A, mga_manager: A, mga_user: D, mga_read_only: D },
      "upload":   { platform_super_admin: A, mga_admin: A, mga_manager: D, mga_user: D, mga_read_only: D },
      "download": { platform_super_admin: A, mga_admin: A, mga_manager: A, mga_user: D, mga_read_only: D },
      "delete":   { platform_super_admin: A, mga_admin: A, mga_manager: D, mga_user: D, mga_read_only: D }
    },
    "settings": {
      "view":   { platform_super_admin: A, mga_admin: A, mga_manager: A, mga_user: D, mga_read_only: D },
      "manage": { platform_super_admin: A, mga_admin: A, mga_manager: D, mga_user: D, mga_read_only: D }
    },
    "notes": {
      "view":   { platform_super_admin: A, mga_admin: A, mga_manager: D, mga_user: D, mga_read_only: D },
      "manage": { platform_super_admin: A, mga_admin: A, mga_manager: D, mga_user: D, mga_read_only: D }
    }
  }
}
```

---

## 6. Scope / Security Assessment

### Guardrails for Gate 6L

Every action MUST enforce:

1. ✅ **Authenticated User** — `base44.auth.me()` required
2. ✅ **permissionResolver** — Check role × domain × action before allowing
3. ✅ **scopeGate** — Verify `master_general_agent_id` scoping
4. ✅ **MGA Boundary** — No cross-MGA contact/document access
5. ✅ **Broker / Agency Boundary** — No cross-master_group_id access
6. ✅ **Tenant Boundary** — No cross-tenant leakage (if multi-tenant)
7. ✅ **Safe Payload Policy** — No signed URLs, no private file URIs in responses
8. ✅ **Audit Logging** — Every contact/document/settings change logged
9. ✅ **Fail-Closed Behavior** — Default DENY; explicit ALLOW only

### Identified Security Risks

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Cross-MGA contact access | **HIGH** | scopeGate enforces MGA boundary; list/view filters by `master_general_agent_id` |
| Cross-MGA document access | **HIGH** | scopeGate + BrokerAgencyDocument queries filtered by `master_general_agent_id` |
| Cross-tenant document access | **HIGH** | Include tenant_id in all document queries (if multi-tenant aware) |
| Unauthorized document download | **MEDIUM** | Backend-only signed URL generation; permissionResolver gates access |
| Signed URL exposure | **CRITICAL** | Never return signed URLs to frontend; backend returns signed URL to authorized user only for direct download |
| Private file URI exposure | **CRITICAL** | Never return file_uri in list/detail responses; file_uri accessed server-side only |
| Unsafe notes exposure | **MEDIUM** | permissionResolver restricts notes.view/notes.manage to admin; encrypt if needed |
| Permission over-broadening | **HIGH** | Fix permissions at ALLOW level; regularly audit against permissionResolver matrix |

### Implementation Safeguards

- Document download endpoint validates permission + scope before generating signed URL
- Contact list/view always filters by authenticated user's scoped `master_general_agent_id`
- Settings view respects `mastergroup.settings.view` permission
- Audit logging captures: user, action, entity_id, timestamp, before/after values

---

## 7. UI / UX Assessment

### Proposed UI Components

| UI Area | Parent | Scope | Classification | Implementation Timing |
|---------|--------|-------|-----------------|----------------------|
| Contacts tab in detail drawer | MGABrokerAgencyDetailDrawer | View + manage | **RECOMMENDED FOR 6L** | Phase 1: View; Phase 2: Manage |
| Documents tab in detail drawer | MGABrokerAgencyDetailDrawer | View + upload + download + delete metadata | **RECOMMENDED FOR 6L** | Phase 1: View; Phase 2: Upload/download |
| Settings tab in detail drawer | MGABrokerAgencyDetailDrawer | View + manage preferences + notes | **RECOMMENDED FOR 6L** | Phase 1: View; Phase 2: Manage |
| Internal notes section | Settings tab | Expand existing notes field | **RECOMMENDED FOR 6L** | Phase 1 |
| Contact add/edit modal | Contacts tab | CRUD for BrokerAgencyContact | **RECOMMENDED FOR 6L** | Phase 2 |
| Document upload modal | Documents tab | Upload + metadata capture | **RECOMMENDED FOR 6L** | Phase 2 |
| Document list with metadata | Documents tab | Display name, type, date, expiration | **RECOMMENDED FOR 6L** | Phase 1 |
| Settings form | Settings tab | Notification toggles, invite defaults, notes | **RECOMMENDED FOR 6L** | Phase 2 |
| Audit / Activity section | Settings tab or separate tab | Display recent changes | **DEFER TO LATER** | Post-6L; use existing ActivityLog entity |

### Recommended Approach

**Phase 1 (View-Only):**
- Contacts tab: Display list of contacts (read-only)
- Documents tab: Display document metadata (no download yet)
- Settings tab: Display current settings + notes
- Audit trail: Display activity log

**Phase 2 (Full CRUD):**
- Contact add/edit modal
- Document upload modal
- Settings form (manage notifications, defaults, notes)
- Signed URL generation + secure download

---

## 8. Document Handling Assessment

### Safe Document Model (RECOMMENDED)

**Upload Flow:**
1. User selects file in modal
2. Frontend validates: file type (PDF/DOCX/XLSX), size (<10MB)
3. Frontend calls backend upload endpoint
4. Backend:
   - Re-validates file type/size
   - Calls `base44.integrations.Core.UploadPrivateFile(file)` → returns `file_uri`
   - Creates BrokerAgencyDocument record with `file_uri` + metadata
   - Logs audit event
   - Returns document ID + metadata (NOT file_uri)

**View/Download Flow:**
1. User clicks download icon
2. Frontend calls backend `/api/documents/{document_id}/download`
3. Backend:
   - Validates permission: `mastergroup.documents.download`
   - Validates scope: `master_general_agent_id` + `master_group_id`
   - Fetches document record
   - Calls `base44.integrations.Core.CreateFileSignedUrl(file_uri)` → returns `signed_url`
   - Logs audit event
   - Returns `signed_url` to frontend (short-lived, 5-minute expiry)
4. Frontend redirects to `signed_url` for direct download

**Delete Flow:**
1. User clicks delete icon
2. Frontend calls backend `/api/documents/{document_id}/delete`
3. Backend:
   - Validates permission: `mastergroup.documents.delete`
   - Validates scope: `master_general_agent_id` + `master_group_id`
   - Marks BrokerAgencyDocument record as deleted or soft-deletes
   - Logs audit event (file_uri NOT removed to preserve audit trail)

**Guardrails:**
- ✅ file_uri never exposed to frontend
- ✅ Signed URLs generated server-side only, short-lived (5 min)
- ✅ File types restricted: PDF, DOCX, XLSX
- ✅ File size restricted: ≤10MB
- ✅ File names sanitized
- ✅ Every upload/view/download/delete logged to ActivityLog
- ✅ Audit trail preserved even after deletion

### Complexity Assessment

Document handling introduces **MEDIUM risk** due to file security requirements. However, with the safe model above, risk is **MITIGATED**.

**Recommendation:** Include documents in Gate 6L. If implementation reveals additional complexity, split documents into Gate 6L-B (deferred) and focus Gate 6L-A on contacts + settings only.

---

## 9. Recommended Gate 6L Structure

### Option A: Gate 6L Unified (RECOMMENDED)

**Scope:** Contacts + Settings + Documents (all three)

**Phases:**
- Phase 1: View-only (contacts list, settings display, document metadata list)
- Phase 2: CRUD operations (add/edit contacts, upload/download documents, manage settings)

**Advantages:**
- Cohesive Broker / Agency profile management
- Single permission set covers all three areas
- Shared detail drawer structure

**Disadvantages:**
- Larger scope; longer implementation
- Document security requires careful design

---

### Option B: Gate 6L-A + Gate 6L-B (SPLIT)

**Gate 6L-A:** Contacts + Settings only  
**Gate 6L-B:** Documents only (deferred to later phase)

**Advantages:**
- Smaller, faster Gate 6L-A delivery
- Document security design deferred for deeper review
- Less risk in initial rollout

**Disadvantages:**
- Two gates instead of one
- Users see incomplete Broker / Agency profile initially

---

**Final Recommendation:** **Option A (Unified Gate 6L)** — Proceed with contacts + settings + documents in one gate, using the safe document model above. If implementation risks emerge, split during design phase.

---

## 10. Risk Assessment

| Area | Risk Level | Rationale |
|------|-----------|-----------|
| **Contacts** | **LOW** | Simple CRUD; scoped to MGA; no file handling; existing contact fields already in MasterGroup |
| **Settings** | **LOW** | Preference toggles + notes; no sensitive operations; admin-only; audit-logged |
| **Documents** | **MEDIUM** | File handling introduces complexity; mitigated by private file API + safe URL model; audit logging required |
| **Permissions** | **LOW** | Extending existing permissionResolver; no broadening of roles; restrictive by default |
| **Schema Impact** | **LOW** | Small MasterGroup extensions; new entities BrokerAgencyContact + BrokerAgencyDocument; no migrations to existing records |
| **Scope Enforcement** | **LOW** | Leverages existing scopeGate + scopeResolver; no new scope boundary logic |
| **Audit Logging** | **LOW** | Reuses existing ActivityLog entity; straightforward event logging |

---

## 11. Validation Requirements

### Future Gate 6L Validation Checklist

1. ✅ **Build Status:** No errors; all modules compile
2. ✅ **Lint / Static Scan:** All files pass linter; no warnings
3. ✅ **Contact View:** Authorized user sees contacts; unauthorized user blocked
4. ✅ **Contact Manage:** Only admin users can add/edit/delete contacts
5. ✅ **Contact Cross-MGA Block:** User cannot access contacts from different MGA
6. ✅ **Settings Manage Block:** Non-admin users blocked from editing settings
7. ✅ **Document Upload:** File type/size validation; private file URI stored; metadata recorded
8. ✅ **Document Download:** Signed URL generated; short-lived; audited
9. ✅ **Document No Exposure:** file_uri never returned to frontend; no signed URLs in responses
10. ✅ **Audit Events:** Contact create/update/delete logged; document upload/download logged; settings changes logged
11. ✅ **Cross-MGA Block:** Document access filtered by `master_general_agent_id`
12. ✅ **Gates 6A–6H Unaffected:** No regressions in existing gates
13. ✅ **Registry / Ledger Integrity:** JSON valid; no contradictions
14. ✅ **Rollback Ready:** Feature flags or code structure allows quick disable

---

## 12. Recommendation

### Assessment Summary

- **Contacts Management:** LOW risk, HIGH value → **PROCEED**
- **Settings Management:** LOW risk, MEDIUM value → **PROCEED**
- **Document Management:** MEDIUM risk, HIGH value; mitigated via safe model → **PROCEED**
- **Overall Scope:** Cohesive; manageable in single gate with phased rollout → **PROCEED AS UNIFIED GATE 6L**

### Recommendation: **PROCEED WITH GATE 6L (UNIFIED)**

**Scope:**
- Broker / Agency contacts (primary, billing, operational, compliance)
- Broker / Agency settings (notification preferences, invite defaults, notes)
- Broker / Agency documents (license, agreements, tax forms, insurance)

**Phase 1 (View-Only):** Contacts list, settings display, document metadata  
**Phase 2 (CRUD):** Contact add/edit/delete, document upload/download, settings management

**Next Document:** Gate 6L Design Specification (or split into Gate 6L-A Design Spec if Phase 1 only)

**Implementation Status:** NOT_STARTED  
**Runtime Changes:** NONE (this document is planning only)  
**Registry Update:** Add Gate 6L entry with status DISCOVERY_PREFLIGHT

---

## Document Control

| Field | Value |
|-------|-------|
| Document ID | MGA_GATE_6L_DISCOVERY_PREFLIGHT |
| Version | 1.0 |
| Created | 2026-05-12 |
| Author | Platform Engineering — MGA Program Management |
| Status | DISCOVERY_PREFLIGHT — APPROVED FOR DESIGN PHASE |
| Next Step | Gate 6L Design Specification or Gate 6L-A/6L-B split design specs |