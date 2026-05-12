# MGA Gate 6D — Design Specification

**Gate ID:** `GATE-6D`  
**Gate Name:** Export Delivery History & Tracking  
**Document Type:** Design Specification (Locked — No Implementation)  
**Date:** 2026-05-12  
**Status:** 🔵 DESIGN_SPEC_COMPLETE  
**Implementation Status:** ❌ NOT_STARTED  
**Activation Status:** 🔴 INACTIVE  
**Gate 6C Dependency:** 🟡 ACTIVE APPROVAL REQUIRED BEFORE GATE 6D ACTIVATION

---

## Section 1 — Final Capability Definition

**Gate 6D = Export Delivery History & Tracking**

Gate 6D provides authorized MGA users with a read-only, scoped, auditable view of all report export operations executed within their MGA boundary. Users can inspect the lifecycle of every export request — from initiation through generation, download, expiration, and failure — without accessing the exported content itself.

### Capability Boundaries

**In scope:**
- View paginated export history list (metadata only)
- View export request detail (actor, timestamps, outcome, failure reason)
- View audit trail for a specific export request
- Retry failed exports (subject to separate approval)
- Cancel in-progress exports (subject to separate approval)

**Out of scope (deferred):**
- Report scheduling / automated recurring exports
- Saved report templates
- Advanced analytics dashboard expansion
- Automated email or webhook delivery of exports
- Bulk scheduled exports

---

## Section 2 — Feature Flag Contract

### Flag Definition

```javascript
// File: components/mga/MGACaseWorkflowPanel.jsx
// Gate 6D rollback switch — set false to disable export history without code removal
const MGA_EXPORT_HISTORY_ENABLED = false;
```

### Required Flag Behavior

| Flag State | Export History UI | Backend Actions | History Queries |
|---|---|---|---|
| `false` (DEFAULT) | ❌ Hidden | ❌ Rejected — `FEATURE_DISABLED` | ❌ Blocked |
| `undefined` | ❌ Hidden (treated as false) | ❌ Rejected | ❌ Blocked |
| missing | ❌ Hidden (treated as false) | ❌ Rejected | ❌ Blocked |
| malformed | ❌ Hidden (fail-closed) | ❌ Rejected | ❌ Blocked |
| `true` | ✅ Visible (if permission met) | ✅ Processed (if scope + permission met) | ✅ Allowed (if scoped) |

### Enforcement Rules

- Flag check is **Step 1** in backend authorization chain — before any auth, permission, or scope validation
- Flag `true` does NOT bypass permission or scope checks — both must still pass
- Flag is evaluated **server-side** in the backend function
- Flag is evaluated **client-side** only for UI rendering (never for security decisions)
- Rollback = set flag to `false` + redeploy; no schema migrations, no data loss

### Dependency on Gate 6C

```
MGA_EXPORT_HISTORY_ENABLED = true
  → STILL REQUIRES →
MGA_REPORT_EXPORTS_ENABLED = true (Gate 6C active)
```

Gate 6D history surface has no meaningful data until Gate 6C export operations are live. Gate 6D MUST NOT be activated before Gate 6C operator approval is obtained.

---

## Section 3 — Data Source Design

### Primary Source of Truth: ActivityLog Entity (Gate 6C Audit Events)

Gate 6D uses the existing `ActivityLog` entity as its source of truth. Gate 6C already writes structured audit events for every export lifecycle event. Gate 6D queries and surfaces these events.

### Lightweight Service Layer

A thin `exportHistoryService.js` will:
1. Query `ActivityLog` records filtered by export-related action types and MGA scope
2. Parse structured fields from audit detail text (report_type, format, record_count)
3. Compute `expires_at` from `generated_at` + configured artifact TTL
4. Compute `artifact_available` boolean from expiry check
5. Join multi-event records into a unified history view per `correlation_id`

### Hard Constraints

| Constraint | Rule |
|---|---|
| Exported content | ❌ NEVER stored in history records |
| Signed URLs | ❌ NEVER stored or returned |
| Private file URIs | ❌ NEVER stored or returned |
| Raw PHI/PII | ❌ NEVER included in history payload |
| Export payload body | ❌ NEVER duplicated or surfaced |
| Internal auth tokens | ❌ NEVER logged or returned |

---

## Section 4 — Backend Contract Design

### Backend Function: `mgaExportHistory`

**File (future):** `functions/mgaExportHistory.js`  
**Pattern:** Single entry point; action-routed; fail-closed; mirrors Gate 6C `mgaReportExport` structure.

### Authorization Chain (All Actions)

```
Step 1: Feature Flag Check
  → MGA_EXPORT_HISTORY_ENABLED = false → FEATURE_DISABLED (503)

Step 2: Authentication
  → base44.auth.me() → null → UNAUTHORIZED (401)

Step 3: Correlation ID Generation
  → Unique audit correlation ID assigned

Step 4: MGA Scope Resolution
  → scopeGate validation → failure → FORBIDDEN (403)

Step 5: Permission Check
  → permissionResolver → failure → FORBIDDEN (403)

Step 6: Action Dispatch
  → Validated, scoped, authorized handler

Step 7: Audit Logging
  → Non-blocking; failure does not abort response
```

---

### Action: `listExportHistory`

| Property | Specification |
|---|---|
| Required scope | Valid MGA ID, resolved + validated via scopeGate |
| Required permission | `mga.reports.history.view` |
| Allowed roles | admin, platform_super_admin, mga_admin, mga_manager |
| Input | mga_id (required), date_range (optional), report_type (optional), status (optional), page/limit (optional) |
| Failure states | 401 Unauthorized, 403 Forbidden, 400 Bad Request (invalid filter), 503 Feature Disabled |
| Audit event | `history_list_requested` |
| Safe return payload | See Section 8 |
| Never returned | Signed URLs, file URIs, exported content, PHI, tokens |

---

### Action: `getExportHistoryDetail`

| Property | Specification |
|---|---|
| Required scope | Valid MGA ID + record must belong to requesting MGA |
| Required permission | `mga.reports.history.view` |
| Allowed roles | admin, platform_super_admin, mga_admin, mga_manager |
| Input | export_request_id (required) |
| Failure states | 401, 403, 404 (not found in scope — no enumeration), 503 |
| Audit event | `history_detail_requested` |
| Safe return payload | Full metadata record; audit timeline summary; no URLs |
| Never returned | Signed URLs, file URIs, exported content, stack traces |

---

### Action: `getExportAuditTrail`

| Property | Specification |
|---|---|
| Required scope | Valid MGA ID + record must belong to requesting MGA |
| Required permission | `mga.reports.history.audit` |
| Allowed roles | admin, platform_super_admin, mga_admin |
| Input | export_request_id (required) |
| Failure states | 401, 403, 404, 503 |
| Audit event | `history_audit_trail_requested` |
| Safe return payload | Audit event list (action, actor, timestamp, outcome); no raw payloads |
| Redaction | Sensitive keywords redacted per Gate 6C audit policy |

---

### Action: `retryExport`

| Property | Specification |
|---|---|
| Required scope | Valid MGA ID + record must belong to requesting MGA |
| Required permission | `mga.reports.history.retry` |
| Allowed roles | admin, platform_super_admin, mga_admin |
| Input | export_request_id (required); record status must be `failed` |
| Failure states | 401, 403, 404, 409 Conflict (not failed), 503 |
| Audit event | `history_retry_requested` |
| Safe return payload | Updated record metadata |
| **Gate:** | ❌ DEFERRED — UI and backend handler disabled until separately approved |

---

### Action: `cancelExport`

| Property | Specification |
|---|---|
| Required scope | Valid MGA ID + record must belong to requesting MGA |
| Required permission | `mga.reports.history.cancel` |
| Allowed roles | admin, platform_super_admin, mga_admin |
| Input | export_request_id (required); record status must be `processing` or `pending` |
| Failure states | 401, 403, 404, 409 Conflict (completed/failed), 503 |
| Audit event | `history_cancel_requested` |
| Safe return payload | Updated record metadata |
| **Gate:** | ❌ DEFERRED — UI and backend handler disabled until separately approved |

---

## Section 5 — Frontend Design

### Primary Component: `MGAExportHistoryPanel.jsx`

**File (future):** `components/mga/MGAExportHistoryPanel.jsx`  
**Location:** New tab in `MGACaseWorkflowPanel` alongside Cases / Census / Quotes

### Required Rendering Behavior

| Condition | Behavior |
|---|---|
| `MGA_EXPORT_HISTORY_ENABLED = false` | Tab hidden; component not mounted |
| `MGA_EXPORT_HISTORY_ENABLED = true` + no permission | Tab hidden; component not mounted |
| `MGA_EXPORT_HISTORY_ENABLED = true` + `history.view` permission | Tab visible; history list rendered |
| `artifact_available = false` | Download affordance hidden |
| `expires_at` passed | Download affordance hidden |
| Artifact valid + scoped + unexpired + permissioned | Download affordance shown |
| `history.retry` not granted | Retry control hidden |
| `history.cancel` not granted | Cancel control hidden |

### Planned UI Structure

```
MGAExportHistoryPanel
├── Filter bar
│   ├── Report type dropdown
│   ├── Status dropdown
│   ├── Requester filter (authorized users only)
│   └── Date range picker
├── ExportHistoryTable
│   ├── Row: export_request_id, report_type, format, status badge, requester, requested_at
│   ├── Row expand: generated_at, downloaded_at, expires_at, record_count, failure_reason
│   ├── Download button (conditional: artifact_available + scoped + unexpired + permissioned)
│   ├── Retry button (conditional: failed + history.retry granted + separately approved)
│   └── Cancel button (conditional: processing + history.cancel granted + separately approved)
└── ExportArtifactDownloadModal (conditional)
    ├── Confirmation prompt
    ├── Scope validation (re-validated server-side on confirm)
    └── Secure download initiation
```

### Status Badges

| Status | Color |
|---|---|
| processing | Blue |
| completed | Green |
| failed | Red |
| expired | Gray |
| cancelled | Orange |
| pending | Yellow |

---

## Section 6 — Permission Model

### Permission Key Definitions (Proposed — Not Yet Implemented)

```javascript
// lib/mga/reportExportPermissions.js (future extension)
export const HISTORY_PERMISSIONS = {
  VIEW:   'mga.reports.history.view',
  AUDIT:  'mga.reports.history.audit',
  RETRY:  'mga.reports.history.retry',
  CANCEL: 'mga.reports.history.cancel',
};
```

### Role → Permission Matrix

| Role | `history.view` | `history.audit` | `history.retry` | `history.cancel` |
|---|---|---|---|---|
| `admin` | ✅ | ✅ | ✅ | ✅ |
| `platform_super_admin` | ✅ | ✅ | ✅ | ✅ |
| `mga_admin` | ✅ | ✅ | ✅ | ✅ |
| `mga_manager` | ✅ | ❌ | ❌ | ❌ |
| `mga_user` | ❌ | ❌ | ❌ | ❌ |
| `mga_read_only` | ❌ | ❌ | ❌ | ❌ |

### Enforcement Rules

- ❌ No frontend-only authorization — all permission checks enforced server-side
- ✅ All history reads pass centralized `permissionResolver`
- ✅ All history reads pass `scopeGate` before data retrieval
- ✅ Permission denial returns 403 Forbidden (no data leak)
- ✅ Missing permission for retry/cancel → UI controls hidden + backend rejects

---

## Section 7 — ScopeGate Model

### Required Scope Fields (Every History Read)

```javascript
const scopeRequest = {
  mga_id:            required,   // Must match authenticated user's MGA
  master_group_id:   optional,   // Filter scope to specific master group
  tenant_id:         optional,   // Cross-tenant boundary enforcement
  case_id:           optional,   // Filter scope to specific case
  quote_id:          optional,   // Filter scope to specific quote scenario
  requesting_user:   required,   // Authenticated user email
  requesting_role:   required,   // Authenticated role at time of request
};
```

### Scope Enforcement Chain

```
1. Resolve MGA ID from authenticated user session
2. Validate MGA ID against scopeGate (user belongs to this MGA)
3. Validate master_group_id (if provided) belongs to resolved MGA
4. Validate case_id (if provided) belongs to resolved MGA + master_group_id
5. Validate quote_id (if provided) belongs to resolved case
6. Apply scope filters to ActivityLog query (WHERE mga_id = resolved_mga_id)
7. Re-validate each returned record belongs to resolved scope
```

### Scope Failure Behavior

| Failure Mode | Response |
|---|---|
| MGA ID mismatch | 403 Forbidden |
| Master group outside MGA | 403 Forbidden |
| Case outside MGA | 403 Forbidden |
| Cross-tenant access | 403 Forbidden |
| Record not in scope | 404 (prevents enumeration) |
| Missing MGA ID | 400 Bad Request |

---

## Section 8 — Safe Return Payload

### Allowed Fields (listExportHistory / getExportHistoryDetail)

```javascript
{
  export_request_id:        string,   // Correlation ID
  report_type:              string,   // case_summary | quote_scenario | census_member | audit_activity | mga_summary
  format:                   string,   // csv | xlsx | pdf
  status:                   string,   // processing | completed | failed | expired | cancelled | pending
  requested_by_user_id:     string,   // User email (masked if not audit-permissioned)
  requested_by_role:        string,   // Role at time of request
  requested_at:             datetime,
  generated_at:             datetime | null,
  downloaded_at:            datetime | null,
  expires_at:               datetime | null,
  record_count:             number | null,
  failure_reason_code:      string | null,   // Structured code only — no stack traces
  artifact_available:       boolean,
}
```

### Never Return (Strictly Prohibited)

| Field Type | Examples |
|---|---|
| Signed URLs | `download_url`, `signed_url`, `presigned_url` |
| Private file URIs | `file_uri`, `storage_path`, `private_url` |
| Exported content | Any cell data, member records, financial data |
| Raw PHI/PII body | SSN, DOB, full address, health data |
| Auth tokens | `access_token`, `session_token`, `jwt` |
| Internal auth context | `base44_token`, `service_role_key` |
| Stack traces | Error stack, internal error messages |
| Export generation payloads | Raw query results, intermediate data |

---

## Section 9 — Audit Requirements

### Gate 6D Audit Events

| Event | Trigger | Logged Fields |
|---|---|---|
| `history_list_requested` | User requests history list | actor, mga_id, filters, record_count_returned, outcome |
| `history_detail_requested` | User views single export detail | actor, mga_id, export_request_id, outcome |
| `history_audit_trail_requested` | User views audit trail | actor, mga_id, export_request_id, outcome |
| `history_scope_denied` | Scope validation fails | actor, mga_id, attempted_scope, failure_reason |
| `history_permission_denied` | Permission check fails | actor, mga_id, required_permission, actor_role |
| `history_retry_requested` | Retry triggered | actor, mga_id, export_request_id, outcome |
| `history_cancel_requested` | Cancel triggered | actor, mga_id, export_request_id, outcome |

### Audit Logging Rules

- All events logged to `ActivityLog` entity
- Logging is **non-blocking** — failure to log does not abort history response
- Sensitive keywords redacted per Gate 6C audit sanitization policy
- Audit entries include `correlation_id` linking to originating export request
- Audit entries include `mga_id` for scope-filtered audit queries

---

## Section 10 — Failure and Rollback Design

### Rollback Trigger

```javascript
// Change to disable Gate 6D:
const MGA_EXPORT_HISTORY_ENABLED = false; // was true
// Redeploy. No migrations. No data changes.
```

### Failure Mode Catalog

| Failure Condition | System Behavior |
|---|---|
| `MGA_EXPORT_HISTORY_ENABLED = false` | History tab hidden; backend returns `FEATURE_DISABLED` |
| `MGA_REPORT_EXPORTS_ENABLED = false` (Gate 6C inactive) | History tab hidden (no meaningful data exists) |
| Missing permission | 403 Forbidden; history tab hidden |
| Cross-MGA access attempt | 403 Forbidden; no data returned |
| Cross-tenant access attempt | 403 Forbidden; no data returned |
| Expired artifact | `artifact_available = false`; download link hidden |
| Out-of-scope record | 404 (prevents enumeration) |
| Backend service error | 500; non-sensitive error message; no stack trace |
| Audit log failure | Log failure silently; history response proceeds |

### Gate 6C Rollback Interaction

If Gate 6C is rolled back (`MGA_REPORT_EXPORTS_ENABLED = false`):
- Export History tab is hidden (no exports to show)
- No export records created going forward
- Historical records in ActivityLog remain (not deleted)
- Gate 6D feature flag state unchanged

### Gate 6A / 6B Unaffected Guarantee

| Gate | Guarantee |
|---|---|
| Gate 6A Invite User | Zero code interaction; zero flag interaction |
| Gate 6B TXQuote Transmit | Zero code interaction; `TXQUOTE_TRANSMIT_ENABLED` untouched |

---

## Section 11 — Implementation Readiness Checklist

All items below must be confirmed before Gate 6D implementation may begin:

| Requirement | Status |
|---|---|
| Capability scope finalized | ✅ CONFIRMED (this document) |
| Feature flag contract finalized | ✅ CONFIRMED — `MGA_EXPORT_HISTORY_ENABLED = false` |
| Permission keys finalized | ✅ CONFIRMED — 4 keys defined |
| Backend contract finalized | ✅ CONFIRMED — 5 actions specified |
| UI behavior finalized | ✅ CONFIRMED — component structure and guards defined |
| Safe payload finalized | ✅ CONFIRMED — allowed and prohibited fields enumerated |
| Test plan aligned | ✅ CONFIRMED — 40–50 tests defined in Planning Packet |
| Rollback strategy defined | ✅ CONFIRMED — single flag change, < 5 minutes |
| Static inventory complete | ✅ CONFIRMED — `MGA_GATE_6D_STATIC_INVENTORY.md` |
| Gate 6C operator approval | ❌ PENDING — required before implementation |
| Gate 6D implementation authorization | ❌ PENDING — separate operator decision required |

### Current Gate Status

```
Scope:                     ✅ FINALIZED
Flag:                      ✅ DEFINED (false — not yet created in code)
Permissions:               ✅ DEFINED (not yet registered in code)
Backend Contract:          ✅ SPECIFIED (not yet implemented)
UI Design:                 ✅ SPECIFIED (not yet built)
Safe Payload:              ✅ SPECIFIED
Tests:                     ✅ PLANNED (not yet written)
Rollback:                  ✅ DEFINED
Gate 6C Dependency:        ❌ UNMET — operator approval required
Gate 6D Authorization:     ❌ UNMET — separate operator decision required

Gate 6D Planning Status:   🔵 DESIGN_SPEC_COMPLETE
Implementation:            ❌ NOT_STARTED
Activation:                🔴 INACTIVE
```

---

*End of MGA Gate 6D Design Specification*  
*Document Date: 2026-05-12*  
*Status: DESIGN_SPEC_COMPLETE — No runtime changes*  
*Next Step: Operator decision on Gate 6C activation AND Gate 6D implementation authorization*