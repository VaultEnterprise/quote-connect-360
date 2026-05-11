# MGA Gate 6C — Design Specification

**Gate ID:** `GATE-6C-PENDING`  
**Gate Name:** Report Exports / MGA Dashboard Reporting  
**Document Type:** Design Specification (Pre-Implementation Lock)  
**Date:** 2026-05-11  
**Status:** 🔴 NOT APPROVED — INACTIVE — DESIGN LOCKED, IMPLEMENTATION DEFERRED  
**Gate 6B Status:** 🟢 CLOSED — Unaffected

> **CRITICAL:** This is a design-phase document. It locks the technical contract for implementation but does NOT authorize runtime deployment. No code shall be written against this spec until formal operator approval is granted.

---

## Section 1 — Final Export Scope

### 1.1 Export Catalog

All export types listed below are **proposed** and contingent on Gate 6C approval.

#### 1.1.1 Case Summary Report

| Attribute | Value |
|---|---|
| **Export Name** | Case Summary Report |
| **Export Level** | MGA (filtered to MGA scope) |
| **Format** | CSV, XLSX, PDF |
| **Delivery Method** | Direct download (synchronous) |
| **Source Data** | BenefitCase (current user's MGA scope only) |
| **Required Scope** | `master_general_agent_id` (resolved server-side) |
| **Required Permission** | `mga.reports.export` + `mga.reports.export_csv` (for CSV) or `mga.reports.export_xlsx` (for XLSX) or `mga.reports.export_pdf` (for PDF) |
| **Included Fields** | `case_number`, `employer_name`, `stage`, `case_type`, `priority`, `effective_date`, `assigned_to`, `census_status`, `quote_status`, `enrollment_status`, `employee_count`, `last_activity_date`, `target_close_date` |
| **Excluded Fields** | All migration fields, internal IDs, token-related fields, signed URLs, unredacted PHI |
| **Audit Events** | `report_export_requested`, `report_export_authorization_passed`, `report_export_scope_passed`, `report_export_generation_succeeded`, `report_export_download_succeeded` (or `denied` / `failed` variants) |
| **Max Records Per Export** | 10,000 (async job if exceeded) |
| **Rollback Behavior** | Artifact deleted; button hidden; modal unmounted |

#### 1.1.2 Quote Scenario Report

| Attribute | Value |
|---|---|
| **Export Name** | Quote Scenario Report |
| **Export Level** | MGA + Case (filtered to resolved scope) |
| **Format** | CSV, XLSX, PDF |
| **Delivery Method** | Direct download (synchronous for <1,000 records); async job for larger datasets |
| **Source Data** | QuoteScenario + linked case context |
| **Required Scope** | `master_general_agent_id` + optional `case_id` |
| **Required Permission** | `mga.reports.export` + format-specific permission |
| **Included Fields** | `case_number`, `scenario_name`, `status`, `total_monthly_premium`, `employer_monthly_cost`, `employee_monthly_cost_avg`, `plan_count`, `confidence_level`, `is_recommended`, `approval_status`, `quoted_at`, `expires_at` |
| **Excluded Fields** | All migration fields, rate-lock context, internal approval notes, token/URL fields |
| **Audit Events** | `report_export_requested`, scope validation events, generation events, download events |
| **Max Records Per Export** | 10,000 (async job if exceeded) |
| **Rollback Behavior** | Artifact deleted; button hidden; modal unmounted |

#### 1.1.3 Census Member Report

| Attribute | Value |
|---|---|
| **Export Name** | Census Member Report |
| **Export Level** | MGA + Case + Census Version (filtered to resolved scope) |
| **Format** | CSV, XLSX (PDF deferred — see below) |
| **Delivery Method** | Async job (likely >1,000 records) with signed URL delivery |
| **Source Data** | CensusMember (from validated census versions only) |
| **Required Scope** | `master_general_agent_id` + `case_id` + `census_version_id` |
| **Required Permission** | `mga.reports.export` + `mga.reports.export_csv` or `mga.reports.export_xlsx` |
| **Included Fields** | `employee_id`, `first_name`, `last_name`, `hire_date`, `employment_status`, `employment_type`, `job_title`, `department`, `is_eligible`, `dependent_count`, `coverage_tier`, `validation_status` |
| **Excluded Fields** | `date_of_birth`, `ssn_last4`, `annual_salary`, `address`, `phone`, `email`, `gradient_ai_data`, all migration fields, validation_issues (full), signed URLs |
| **Masked Fields** | `phone` (last 4 only: `***-***-XXXX`), `email` (partial: `u***@domain.com`) |
| **Audit Events** | All standard export audit events + member count + validation status summary |
| **Max Records Per Export** | 50,000 (async job) |
| **PHI Compliance** | **NOTE:** Full PHI export (DOB, SSN, salary) deferred to separate Gate 6C.2 sub-approval |
| **Rollback Behavior** | Artifact deleted from storage; button hidden; modal unmounted |

#### 1.1.4 Audit Activity Report

| Attribute | Value |
|---|---|
| **Export Name** | Audit Activity Report |
| **Export Level** | MGA (filtered to MGA scope) |
| **Format** | CSV, XLSX |
| **Delivery Method** | Async job (likely 1,000+ records) with signed URL delivery |
| **Source Data** | ActivityLog (case/entity-scoped; may include multiple cases) |
| **Required Scope** | `master_general_agent_id` + optional `case_id` date range filter |
| **Required Permission** | `mga.reports.export` + `mga.reports.audit` |
| **Included Fields** | `action`, `actor_email`, `actor_role`, `entity_type`, `outcome`, `created_date`, `entity_id`, `case_number` (denormalized) |
| **Excluded Fields** | `detail` (full), `old_value`, `new_value`, all sensitive audit body content, internal error traces, raw authorization context |
| **Audit Events** | All standard export audit events + record count |
| **Max Records Per Export** | 100,000 (async job) |
| **Sensitivity** | High — must be restricted to `mga_admin` + platform admin only |
| **Rollback Behavior** | Artifact deleted from storage; button hidden; modal unmounted |

#### 1.1.5 MGA Summary Report

| Attribute | Value |
|---|---|
| **Export Name** | MGA Summary Report |
| **Export Level** | MGA (single MGA only) |
| **Format** | PDF (locked format; CSV/XLSX deferred) |
| **Delivery Method** | Async job → signed URL |
| **Source Data** | MasterGeneralAgent + aggregated case/quote/census counts + KPI metrics |
| **Required Scope** | `master_general_agent_id` (resolved server-side) |
| **Required Permission** | `mga.reports.export` + `mga.reports.export_pdf` |
| **Included Fields** | MGA name, legal entity name, code, status, primary contact, active case count, quote count, renewal count, KPI metrics (from KPI service) |
| **Excluded Fields** | `tax_id_ein`, `banking_setup_status`, `commission_structure_type` (detail), all internal management fields |
| **Audit Events** | All standard export audit events |
| **Max Report Size** | 1 page (PDF) |
| **Rollback Behavior** | Artifact deleted from storage; button hidden; modal unmounted |

### 1.2 Deferred Export Types (NOT IN GATE 6C)

The following export types are planned but **explicitly deferred** from Gate 6C and require separate sub-approval:

| Export Type | Reason for Deferral | Proposed Gate |
|---|---|---|
| Full PHI Census Export (DOB, SSN, salary) | Regulatory approval required; separate compliance review | Gate 6C.2 (future) |
| Census PDF Report with member detail | Complex PDF layout; deferred to maturity | Gate 6C.2 (future) |
| Quote Comparison Matrix (multi-scenario) | Design complexity; prioritize single-scenario export first | Gate 6C.2 (future) |
| Renewal Performance Analytics | Requires gradient AI integration; gate independence pending | Gate 6C.2 (future) |
| Proposal transmission history | Separate gate (not MGA report exports); no overlap | None — separate feature |
| Employee enrollment participation report | Portal-only; MGA visibility limited; deferred | Gate 6C.2 (future) |

---

## Section 2 — Feature Flag Contract

### 2.1 Flag Definition

**Name:** `MGA_REPORT_EXPORTS_ENABLED`  
**Type:** Boolean  
**Default:** `false` (must default to disabled)  
**Location:** `components/mga/MGACaseWorkflowPanel.jsx` (alongside `TXQUOTE_TRANSMIT_ENABLED` for consistency)  
**Scope:** Global (applies to all MGAs; no per-MGA flag variant)

### 2.2 Flag Behavior Contract

| State | Behavior |
|---|---|
| `undefined` | Treated as `false`; exports disabled |
| `missing` | Treated as `false`; exports disabled |
| `null` | Treated as `false`; exports disabled |
| `false` | Exports disabled; buttons hidden; modal unmounted |
| `malformed` (e.g., string "true", number 1) | Treated as `false`; exports disabled |
| `true` | Flag passed; still requires permission + scopeGate; feature enabled for authorized users only |

### 2.3 Mandatory Safeguards

```javascript
// Pseudo-code contract
const isExportEnabled = () => {
  const flagValue = MGA_REPORT_EXPORTS_ENABLED;
  
  // Fail-closed: missing or falsy = disabled
  if (!flagValue || flagValue !== true) {
    return false;
  }
  
  // Flag enabled, but permission + scope required
  return true; // caller must still verify permission + scopeGate
};
```

### 2.4 Rollback Procedure

1. Set `MGA_REPORT_EXPORTS_ENABLED = false` in code
2. Re-deploy
3. All export UI hidden
4. All export backend functions reject with `FEATURE_DISABLED`
5. Existing artifacts remain in storage but inaccessible (can be purged separately)
6. Gate 6B TXQuote Transmit unaffected

**No database migration or schema change required for rollback.**

---

## Section 3 — Authorization Design

### 3.1 Permission Key Catalog

All permission keys below are **proposed**. They do not exist today and must be created during implementation.

| Permission Key | Description | Authorized Roles | Backend Enforcement |
|---|---|---|---|
| `mga.reports.view` | Visibility of report export feature | `mga_admin`, `mga_manager`, `platform_super_admin`, `admin` | Check before mounting export modal |
| `mga.reports.export` | Generic export gate; must be paired with format-specific key | `mga_admin`, `mga_manager`, `platform_super_admin`, `admin` | Required for all exports |
| `mga.reports.export_csv` | CSV format specifically | `mga_admin`, `mga_manager`, `platform_super_admin`, `admin` | Check if format = CSV |
| `mga.reports.export_xlsx` | XLSX format specifically | `mga_admin`, `mga_manager`, `platform_super_admin`, `admin` | Check if format = XLSX |
| `mga.reports.export_pdf` | PDF format specifically | `mga_admin`, `mga_manager`, `platform_super_admin`, `admin` | Check if format = PDF |
| `mga.reports.audit` | Audit log export specifically | `mga_admin`, `platform_super_admin`, `admin` | Restricted to admin-level users only |

### 3.2 Authorization Contract

```
All export actions must pass in this exact order:

1. Feature flag check (MGA_REPORT_EXPORTS_ENABLED = true)
   ↓ FAIL → return FEATURE_DISABLED
   
2. User authentication (session exists, user is authenticated)
   ↓ FAIL → return UNAUTHENTICATED
   
3. Permission resolution (user has mga.reports.export + format-specific key)
   ↓ FAIL → return PERMISSION_DENIED
   
4. Scope gate (user's MGA scope matches requested MGA; master_group_id if applicable)
   ↓ FAIL → return SCOPE_DENIED
   
5. Data query and serialization
   ↓ FAIL → return GENERATION_FAILED
   
6. Storage write (if async) or direct return (if sync)
   ↓ FAIL → return STORAGE_FAILED
   
7. Audit log write
   ↓ FAIL → log internally, still return success to user
```

### 3.3 Required Rules

- **No frontend-only permission checks.** Frontend checks are UX convenience only.
- **No hardcoded role strings in component logic.** All role-based decisions must go through `permissionResolver.js`.
- **All exports must fail closed on denied permission.** Return 403 Forbidden; never return a partial/degraded export.
- **Audit export is the most restricted.** Only `mga_admin` / `platform_super_admin` / `admin` can export audit logs.

---

## Section 4 — Backend Contract Design

### 4.1 Backend Function: `mgaReportExport`

**Purpose:** Primary entry point for all MGA report export requests.

#### 4.1.1 Function Signature

```javascript
/**
 * @param {Object} payload
 * @param {string} payload.report_type - "case_summary" | "quote_scenario" | "census_member" | "audit_activity" | "mga_summary"
 * @param {string} payload.format - "csv" | "xlsx" | "pdf"
 * @param {string} [payload.mga_id] - MGA ID; if omitted, resolved from user scope
 * @param {string} [payload.case_id] - For case-scoped or quote-scoped exports
 * @param {string} [payload.census_version_id] - For census exports
 * @param {string} [payload.master_group_id] - Optional filter
 * @param {string} [payload.date_start] - ISO date; for audit exports
 * @param {string} [payload.date_end] - ISO date; for audit exports
 * @param {number} [payload.limit] - Max records; defaults to type-specific max
 * @returns {Promise<{
 *   success: boolean,
 *   download_url?: string,
 *   job_id?: string,
 *   message?: string,
 *   error?: string,
 *   reason_code?: string,
 *   record_count?: number
 * }>}
 */
```

#### 4.1.2 Actions / Sub-Endpoints

All actions are invoked by a single backend function with different `action` parameter values.

| Action | Purpose | Inputs | Permission Required | Return |
|---|---|---|---|---|
| `listAvailableExports` | List export types available to user | `mga_id` | `mga.reports.view` | Array of export types with metadata |
| `prepareExport` | Validate export request; check scope + permission | `report_type`, `format`, `mga_id`, optional filters | `mga.reports.export` + format key | `{ valid: true/false, reason: string, record_count?: number }` |
| `generateExport` | Execute export; return download URL (sync) or job ID (async) | `report_type`, `format`, `mga_id`, optional filters | `mga.reports.export` + format key | `{ success: true/false, download_url: string OR job_id: string, record_count?: number }` |
| `getExportStatus` | Poll async export job status | `job_id` | `mga.reports.export` | `{ status: "pending" \| "processing" \| "completed" \| "failed", progress?: number, download_url?: string, error?: string }` |
| `downloadExport` | Retrieve signed URL for async export artifact | `job_id` | `mga.reports.export` + format key | `{ signed_url: string, expires_at: ISO timestamp }` |
| `cancelExport` | Cancel a pending or processing export job | `job_id` | `mga.reports.export` | `{ cancelled: true/false }` |

#### 4.1.3 Validation Rules (Per Action)

**`prepareExport` validation:**
- Feature flag enabled
- User authenticated
- Permission keys exist and are granted
- Scope gate passes
- Report type is valid for user's MGA scope
- Format is supported for this report type
- All required filter IDs (case_id, census_version_id, etc.) exist and belong to user's scope
- Date range is valid (if provided)
- Record count estimate is reasonable

**`generateExport` validation:**
- All `prepareExport` validations pass
- No duplicate request in flight (idempotency check via `request_id` or `correlation_id`)
- Storage quota available
- Field policy applied before serialization

**`downloadExport` validation:**
- Job exists and belongs to requesting user
- Job status is "completed"
- Signed URL not expired
- Artifact still exists in storage

#### 4.1.4 Failure States

| Failure State | HTTP Status | Response Code | User-Facing Message |
|---|---|---|---|
| Feature flag disabled | 403 | `FEATURE_DISABLED` | "Report exports are not available at this time." |
| Not authenticated | 401 | `UNAUTHENTICATED` | "You must be logged in to export reports." |
| Permission denied | 403 | `PERMISSION_DENIED` | "You do not have permission to export this report type." |
| Scope denied | 403 | `SCOPE_DENIED` | "This report is outside your authorized scope." |
| Invalid report type | 400 | `INVALID_REPORT_TYPE` | "The requested report type is not recognized." |
| Unsupported format | 400 | `UNSUPPORTED_FORMAT` | "This report type does not support {format} format." |
| No data | 400 | `EMPTY_DATASET` | "No records match your filter criteria." |
| Record limit exceeded | 413 | `RECORD_LIMIT_EXCEEDED` | "Export contains {count} records; max {max} for sync. Use async job instead." |
| Duplicate request | 409 | `DUPLICATE_REQUEST` | "An identical export request is already in progress." |
| Generation failed | 500 | `GENERATION_FAILED` | "An error occurred while preparing your export. Please try again." |
| Storage failed | 500 | `STORAGE_FAILED` | "An error occurred while storing your export. Please contact support." |
| Download expired | 410 | `DOWNLOAD_EXPIRED` | "This export link has expired. Please request a new export." |

#### 4.1.5 Sensitive Fields Excluded from Response

The following fields must **never** be included in the function response body:
- Full exported content (data is in artifact, not response)
- Authentication tokens
- Signed URLs (URLs are in separate `download_url` field only)
- Private file URIs
- Raw authorization context
- User session IDs
- Backend error stack traces (log only; return generic error message to user)
- Unredacted PHI/PII

---

## Section 5 — Frontend Component Design

### 5.1 Component: `MGAReportExportModal.jsx`

**Purpose:** User-facing modal for export configuration and execution.

#### 5.1.1 Mount Behavior

```javascript
// Pseudo-code
const shouldMountModal = () => {
  return (
    MGA_REPORT_EXPORTS_ENABLED === true &&
    userHasPermission('mga.reports.view') &&
    userScope.mga_id !== undefined
  );
};

// If any condition fails, modal is not mounted; button is not rendered
```

#### 5.1.2 State Management

| State | Purpose | Triggers | Effect |
|---|---|---|---|
| `closed` | Modal not visible | Initial; user clicks cancel; export completes | Export buttons hidden |
| `selecting_report` | User chooses report type | User clicks export button | Form displayed; report options shown |
| `selecting_format` | User chooses file format | User selects report type | Format buttons shown (filtered by report type) |
| `preparing` | Validating export request | User clicks "Next" or "Export" | Loading spinner; backend validation |
| `ready` | Export ready to download or job created | `prepareExport` succeeds | Download button or job status display |
| `downloading` | Async job in progress | `generateExport` returns job_id | Polling status; progress bar |
| `error` | Export failed | Any step fails | Error message; retry button (max 3 retries) |
| `success` | Export completed; download available | Job completes or sync download ready | Download link; copy link button; close button |

#### 5.1.3 Visibility Rules

| Element | Show When | Hide When |
|---|---|---|
| Export button | Feature flag ON + permission granted + mounted to approved panel | Feature flag OFF; permission denied; scope missing |
| Report type selector | Modal open; state = selecting_report | Feature flag OFF; state != selecting_report |
| Format selector | Report type selected; state = selecting_format | Report type unselected; unsupported format for type |
| Date range filter | Report type = audit_activity | Report type != audit_activity |
| Record count preview | State = ready; record_count > 0 | State = preparing; error state |
| Download button | State = success; sync download | State = success; async job (show "View Status" instead) |
| Job status badge | State = downloading or success (async) | Sync export; state != downloading |
| Error message | State = error; error message defined | State != error; no error |
| Retry button | State = error; retry_count < 3 | retry_count >= 3; state != error |

#### 5.1.4 Duplicate Prevention

```javascript
// Pseudo-code
const handleExportClick = async () => {
  if (isProcessing) {
    return; // Ignore duplicate clicks
  }
  
  setIsProcessing(true);
  const requestId = generateUUID();
  
  try {
    const result = await generateExport({
      request_id: requestId,
      ...exportParams
    });
    // Handle result
  } finally {
    setIsProcessing(false);
  }
};
```

#### 5.1.5 Error Handling

- Never render the full error response body to user
- Map response codes to user-friendly messages (see Section 4.1.4)
- Log full error to console (dev) and to backend audit (production)
- Offer "Try Again" for retryable errors (max 3 retries)
- Show "Contact Support" for non-retryable errors (500+)

#### 5.1.6 Unauthorized Report Name Exposure Prevention

```javascript
// WRONG: leaks report names if user lacks permission
const reportOptions = [
  { value: 'audit_activity', label: 'Audit Activity Report' },
  { value: 'mga_summary', label: 'MGA Summary Report' }
];

// CORRECT: check permission before rendering option
const reportOptions = availableExports.filter(r => 
  user.permissions.includes(r.required_permission)
);
```

#### 5.1.7 Unmounting on Flag Disable

```javascript
// If flag is set to false at runtime, modal must unmount immediately
useEffect(() => {
  if (!MGA_REPORT_EXPORTS_ENABLED) {
    closeModal();
    setShowModal(false);
  }
}, [MGA_REPORT_EXPORTS_ENABLED]);
```

### 5.2 Entry Point Location

**Recommended panel:** `components/mga/MGACaseWorkflowPanel.jsx` (Quotes tab) and `components/mga/MGAAuditPanel.jsx`

**Recommended button placement:**
- Cases tab: "Export Cases" button in top-right of panel header
- Quotes tab: "Export Quotes" button in top-right of panel header
- Audit tab: "Export Audit Log" button in top-right of panel header

---

## Section 6 — Field Policy Design

### 6.1 Field Policy Contract

**Future file:** `lib/mga/reportExportFieldPolicy.js`

#### 6.1.1 Field Categories

```javascript
const EXPORT_FIELD_POLICY = {
  allowed: {
    BenefitCase: ['case_number', 'employer_name', 'stage', ...],
    QuoteScenario: ['name', 'status', 'total_monthly_premium', ...],
    // ...
  },
  conditionally_allowed: {
    ActivityLog: {
      detail: { role_required: ['mga_admin'], note: 'Exclude raw PHI' }
    },
    BenefitCase: {
      notes: { mask_tokens: true, exclude_urls: true }
    }
  },
  masked: {
    CensusMember: {
      phone: { mask_rule: 'last_4_only' },
      email: { mask_rule: 'partial' }
    }
  },
  restricted: {
    CensusMember: ['date_of_birth', 'ssn_last4', 'annual_salary', 'gradient_ai_data'],
    MasterGeneralAgent: ['tax_id_ein', 'banking_setup_status'],
    ActivityLog: ['detail', 'old_value', 'new_value']
  },
  never_export: {
    all: ['access_token', 'docusign_envelope_id', 'signed_url', 'private_file_uri', 'mga_migration_batch_id', 'mga_migration_status']
  },
  never_log: {
    all: ['auth_token', 'magic_link', 'session_id', 'raw_authorization_context', 'stack_trace', 'unredacted_pii']
  }
};
```

#### 6.1.2 Serialization Contract

```javascript
/**
 * Before exporting data, all records must pass field policy.
 * @param {Object} record - entity record
 * @param {string} entityType - "BenefitCase" | "QuoteScenario" | ...
 * @param {string} exportFormat - "csv" | "xlsx" | "pdf"
 * @param {string} userRole - requesting user's role
 * @returns {Object} record with policy-enforced fields
 */
const applyFieldPolicy = (record, entityType, exportFormat, userRole) => {
  const allowed = EXPORT_FIELD_POLICY.allowed[entityType] || [];
  const restricted = EXPORT_FIELD_POLICY.restricted[entityType] || [];
  const neverExport = EXPORT_FIELD_POLICY.never_export.all || [];
  
  const cleaned = {};
  
  for (const [key, value] of Object.entries(record)) {
    // Never export these fields
    if (neverExport.includes(key)) continue;
    
    // Field is restricted; skip unless user role permits
    if (restricted.includes(key)) {
      const permission = EXPORT_FIELD_POLICY.conditionally_allowed[entityType]?.[key];
      if (!permission?.role_required?.includes(userRole)) continue;
    }
    
    // Apply masking if defined
    if (EXPORT_FIELD_POLICY.masked[entityType]?.[key]) {
      cleaned[key] = applyMask(value, EXPORT_FIELD_POLICY.masked[entityType][key]);
      continue;
    }
    
    // Field is allowed; include as-is
    if (allowed.includes(key)) {
      cleaned[key] = value;
      continue;
    }
  }
  
  return cleaned;
};
```

---

## Section 7 — Audit Design

### 7.1 Audit Event Taxonomy

All export-related activity must be logged to `ActivityLog` with the schema below.

#### 7.1.1 Event Types

| Event | Triggering Condition | Required Fields |
|---|---|---|
| `report_export_visibility_checked` | Modal mount attempted | user_id, mga_id, check_result (allowed/denied), reason_code |
| `report_export_requested` | User initiates export request | user_id, mga_id, report_type, format, record_count_estimate |
| `report_export_authorization_passed` | Permission check succeeds | user_id, mga_id, role, permissions_granted |
| `report_export_authorization_denied` | Permission check fails | user_id, mga_id, role, required_permission, reason_code |
| `report_export_scope_passed` | scopeGate validation succeeds | user_id, mga_id, master_group_id (if applicable), case_id (if applicable) |
| `report_export_scope_denied` | scopeGate validation fails | user_id, mga_id, suspected_mga (if mismatch), reason_code |
| `report_export_generation_started` | Backend function begins data query | user_id, mga_id, job_id (if async), report_type, format |
| `report_export_generation_succeeded` | Data serialization completes | user_id, mga_id, job_id, record_count, artifact_size_bytes, duration_ms |
| `report_export_generation_failed` | Data query or serialization fails | user_id, mga_id, job_id, error_code, reason (generic) |
| `report_export_download_started` | User downloads artifact (sync) or requests signed URL (async) | user_id, mga_id, job_id (if async), artifact_id |
| `report_export_download_succeeded` | User successfully downloads artifact | user_id, mga_id, artifact_id, bytes_downloaded, duration_ms |
| `report_export_download_denied` | Download access denied (wrong user, expired) | user_id, artifact_id, reason_code |
| `report_export_cancelled` | User or system cancels export job | user_id, mga_id, job_id, reason |

#### 7.1.2 Audit Log Schema

```javascript
{
  entity_type: "ActivityLog",
  case_id: "optional; set if export is case-scoped",
  master_general_agent_id: "required; from scopeGate",
  master_group_id: "optional; set if applicable",
  
  actor_email: "user@example.com",
  actor_role: "mga_admin" | "mga_manager" | ...,
  
  action: "report_export_*",
  detail: "User-friendly description",
  
  // Audit-specific fields
  correlation_id: "UUID; links multi-step export flow",
  export_job_id: "UUID; unique per export request",
  report_type: "case_summary" | "quote_scenario" | ...,
  export_format: "csv" | "xlsx" | "pdf",
  record_count: "number; null if unknown",
  artifact_size_bytes: "number; null if not yet generated",
  duration_ms: "number; null if not applicable",
  
  outcome: "success" | "failed" | "blocked",
  reason_code: "PERMISSION_DENIED" | "SCOPE_DENIED" | "FEATURE_DISABLED" | ...,
  
  // Timestamps
  created_date: "ISO timestamp (auto)"
}
```

#### 7.1.3 Sensitive Fields Excluded from Audit Logs

| Field | Reason |
|---|---|
| Full exported content | Too large; defeats audit purpose |
| Tokens / magic links | Security credential |
| Signed URLs | Transient artifact credential |
| Private file URIs | Storage path leak risk |
| Raw authorization context | Internal security context |
| Session IDs | Session credential |
| Backend error stack traces | Internal detail; log separately if needed |
| Unredacted PHI/PII body | Regulatory risk |

#### 7.1.4 Audit Retention

- All audit logs retained for **7 years** (regulatory requirement)
- Artifacts themselves retained for **90 days** (configurable; auto-deleted after download or expiration)
- Logs accessible to `mga_admin` + `platform_super_admin` only

---

## Section 8 — Failure / Rollback Design

### 8.1 Fail-Closed Scenarios

| Failure Scenario | Required Behavior | HTTP Status | Response Code | User-Facing Message |
|---|---|---|---|---|
| Feature flag disabled | Return error; do not attempt export | 403 | `FEATURE_DISABLED` | "Report exports are not available." |
| Missing permission | Return error; do not attempt export | 403 | `PERMISSION_DENIED` | "You do not have permission to export reports." |
| Missing scope (MGA) | Return error; do not attempt export | 403 | `SCOPE_DENIED` | "This report is outside your scope." |
| Scope mismatch (requesting wrong MGA) | Return error; do not attempt export | 403 | `SCOPE_DENIED` | "You cannot access reports from other MGAs." |
| Invalid report type | Return error; do not expose available types | 400 | `INVALID_REPORT_TYPE` | "The requested report is not available." |
| Unsupported file format | Return error; suggest supported formats | 400 | `UNSUPPORTED_FORMAT` | "This report type does not support {format}. Try CSV or XLSX." |
| Empty dataset | Return error with record count = 0 | 400 | `EMPTY_DATASET` | "No records match your filter criteria." |
| Generation failure | Return error; log to backend; do not return partial data | 500 | `GENERATION_FAILED` | "An error occurred. Please try again." |
| Partial generation failure (multi-step) | Rollback intermediate data; return error; do not deliver artifact | 500 | `GENERATION_FAILED` | "Export could not be completed. Please try again." |
| Storage failure | Rollback any partial write; return error | 500 | `STORAGE_FAILED` | "An error occurred storing your export. Please try again." |
| Duplicate request (concurrent) | Return existing job ID; do not spawn second job | 409 | `DUPLICATE_REQUEST` | "An identical export is already in progress." |
| Download link expired | Return error; suggest re-requesting export | 410 | `DOWNLOAD_EXPIRED` | "This download link has expired. Request a new export." |
| Stale artifact request | Return error; do not serve artifact | 410 | `DOWNLOAD_EXPIRED` | "This artifact is no longer available." |

### 8.2 Rollback Procedure

#### 8.2.1 Immediate Rollback (Flag-Only)

```javascript
// Step 1: Disable feature flag in code
const MGA_REPORT_EXPORTS_ENABLED = false; // Change from true

// Step 2: Re-deploy application
// (No database changes required)

// Expected results:
// - All export buttons hidden from UI
// - All export modals unmounted
// - All backend export functions return FEATURE_DISABLED
// - Existing artifacts remain in storage but inaccessible to UI
```

#### 8.2.2 Post-Rollback Cleanup (Optional)

```javascript
// After flag is disabled, operator may optionally:
// 1. Purge artifacts older than N days from storage
// 2. Mark artifacts as "archived" in database
// 3. Disable download access at storage layer
```

#### 8.2.3 Rollback Impact Matrix

| Component | Impact on Rollback |
|---|---|
| Gate 6A (Invite User) | **None** — unaffected |
| Gate 6B (TXQuote Transmit) | **None** — unaffected |
| Existing export functions (`exportProposalPDF`, etc.) | **None** — unaffected |
| MGA UI panels | Export buttons hidden; modals unmounted |
| Backend functions | Return error for export requests |
| Database schema | **No changes** — no rollback migration required |
| Audit logs | Retained as-is; no deletion |
| Artifacts in storage | Remain but inaccessible (can be purged later) |

### 8.3 Failure Recovery

| Failure Type | Recovery Procedure |
|---|---|
| Transient generation failure (timeout) | User retries; backend generates new artifact |
| Storage quota exceeded | Operator increases quota; user retries |
| Job stuck in "processing" | Operator manually marks as failed; user retries |
| Artifact corrupted in storage | Operator removes; user retries export |
| Audit log write failed | Log internally; still return success to user (audit is best-effort) |
| Signed URL generation failed | Return error; user retries download |

---

## Section 9 — Implementation Readiness Checklist

Before any implementation of Gate 6C begins, the following items must be confirmed complete and approved:

### 9.1 Design Specification

- [x] Export scope finalized (5 export types; 3 deferred)
- [x] Feature flag contract finalized (`MGA_REPORT_EXPORTS_ENABLED = false` default)
- [x] Permission keys finalized (6 keys: `mga.reports.*`)
- [x] Scope boundaries finalized (MGA, master_group_id, case_id, census_version_id, date range)
- [x] Backend contract actions finalized (6 actions: list, prepare, generate, status, download, cancel)
- [x] Frontend component behavior finalized (modal states, duplicate prevention, error handling)
- [x] Field policy finalized (allowed, restricted, never-export categories)
- [x] Audit taxonomy finalized (13 event types; required field set)
- [x] Rollback design finalized (flag-only, no migration required)

### 9.2 Pre-Implementation Requirements

- [ ] Operator approval obtained: Design Specification accepted
- [ ] Security review completed: Field policy, auth contract, audit design approved
- [ ] Business requirements approved: Export scope, deferred types, authorization matrix
- [ ] Test matrix reviewed: 59 tests aligned to design
- [ ] Storage quota provisioned: Minimum 10 GB for artifacts (estimate)
- [ ] Signed URL service available: Integration with `CreateFileSignedUrl` verified

### 9.3 Implementation Gating

**Gate 6C implementation shall NOT begin until:**

1. This design specification is formally approved by platform engineering
2. Security review sign-off is obtained on auth, scope, audit, and field policy
3. Business requirements approval is documented
4. Operator confirms: "Proceed with implementation"

**Once approval is obtained:**

1. Create `functions/mgaReportExport.js` (backend function)
2. Create `lib/mga/services/reportExportService.js` (service layer)
3. Create `lib/mga/reportExportFieldPolicy.js` (field policy)
4. Create `lib/mga/reportExportAudit.js` (audit logging)
5. Create `lib/mga/reportExportPermissions.js` (permission logic)
6. Create `components/mga/MGAReportExportModal.jsx` (UI modal)
7. Update `components/mga/MGACaseWorkflowPanel.jsx` (add export button)
8. Update `components/mga/MGAAuditPanel.jsx` (add export button)
9. Implement test suite: `tests/mga/gate6c-report-export.test.js` (59 tests)
10. Enable feature flag: `MGA_REPORT_EXPORTS_ENABLED = true` (last step)

---

## Final Certification

| Criterion | Status |
|---|---|
| Design Specification complete | ✅ Yes |
| Export scope defined | ✅ Yes — 5 types in scope; 3 deferred |
| Feature flag contract locked | ✅ Yes — `MGA_REPORT_EXPORTS_ENABLED = false` |
| Authorization model defined | ✅ Yes — 6 permission keys; centralized enforcement |
| Backend contract specified | ✅ Yes — 6 actions; 13+ failure states |
| Frontend behavior designed | ✅ Yes — modal states, guard conditions, error handling |
| Field policy specified | ✅ Yes — allowed, restricted, never-export categories |
| Audit taxonomy defined | ✅ Yes — 13 event types; sensitive field exclusions |
| Rollback plan finalized | ✅ Yes — flag-only; no migration required |
| Test matrix alignment pending | ⏳ Deferred — will review after approval |
| Operator approval pending | ⏳ Awaiting sign-off on this specification |

**Status:** Design Specification locked and ready for approval.  
**Next Step:** Operator review and approval; security review.  
**Go-Live:** Authorization required before implementation begins.

---

*End of MGA Gate 6C Design Specification*  
*Commit reference: `docs(qc360): Gate 6C design specification — locked contract`*