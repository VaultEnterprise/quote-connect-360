# MGA Gate 6I-A Design Specification
## Saved Report Templates and Schedule Definitions

**Document Version:** 1.0  
**Date Created:** 2026-05-12  
**Status:** DESIGN_SPEC_COMPLETE  
**Phase:** Design (Pre-Implementation)  
**Implementation Status:** NOT_STARTED  
**Runtime Changes:** NONE  
**Parent Gate:** Gate 6I  
**Deferred Execution Gate:** Gate 6I-B  

---

## 1. Final Gate 6I-A Scope Classification

### IN SCOPE — Gate 6I-A Implementation

| Feature | Status | Rationale |
|---------|--------|-----------|
| Saved report templates | ✅ IN SCOPE | Core feature; simple CRUD |
| Template filters (saved filter sets) | ✅ IN SCOPE | Reuse existing Gate 6C filter model |
| Report format defaults (pdf/csv/xlsx) | ✅ IN SCOPE | Template-level configuration |
| Template ownership and scope | ✅ IN SCOPE | MGA and Broker/Agency scoping |
| Manual schedule definitions | ✅ IN SCOPE | One-time schedule metadata storage |
| Schedule status management | ✅ IN SCOPE | Active/paused/cancelled states |
| Schedule metadata (name, owner, created_by) | ✅ IN SCOPE | Schedule tracking |
| Schedule run definition model | ✅ IN SCOPE | Metadata for manual "run now" |
| Audit trail (template + schedule events) | ✅ IN SCOPE | Event logging for compliance |
| Permission model (view/manage/audit) | ✅ IN SCOPE | Role-based access control |
| Scope enforcement (MGA/Broker/Agency/tenant) | ✅ IN SCOPE | Boundary enforcement |

### DEFERRED — Gate 6I-B (Scheduler Execution)

| Feature | Status | Rationale |
|---------|--------|-----------|
| Recurring scheduler execution | ⏸️ DEFERRED | Requires separate scheduler safety design |
| Automated background job triggering | ⏸️ DEFERRED | Out of scope for 6I-A; Gate 6I-B only |
| Cron-style recurring schedule patterns | ⏸️ DEFERRED | Gate 6I-B design phase |
| Email delivery integration | ⏸️ DEFERRED | Separate gate for delivery mechanisms |
| Webhook delivery integration | ⏸️ DEFERRED | Separate gate for delivery mechanisms |
| Bulk scheduled export operations | ⏸️ DEFERRED | Beyond scope; separate capability |
| Automatic report dispatch | ⏸️ DEFERRED | Gate 6I-B + delivery mechanisms |
| Job retry and failure recovery | ⏸️ DEFERRED | Gate 6I-B scheduler design |
| Recurring permission/scope recheck at execution | ⏸️ DEFERRED | Gate 6I-B scheduler design |

### NOT INCLUDED

| Feature | Status | Rationale |
|---------|--------|-----------|
| Document/file storage | ❌ NOT INCLUDED | Gate 6L-B deferred |
| Private file download handling | ❌ NOT INCLUDED | Gate 6L-B deferred |
| Signed URL generation | ❌ NOT INCLUDED | Gate 6L-B deferred |
| External file delivery | ❌ NOT INCLUDED | Delivery mechanisms deferred |
| Attachment streaming | ❌ NOT INCLUDED | Delivery mechanisms deferred |

---

## 2. Data Model Design

### Entity: MGAReportTemplate

**Purpose:**  
Store user-created saved report configurations (filters, format, report type) for template reuse and team sharing.

**Inheritance Model:**  
Follows Phase 2 MGA scope pattern from Gates 6A–6H.

**Schema Definition:**

| Field | Type | Required | Scope | Description |
|-------|------|----------|-------|-------------|
| id | string (uuid) | ✅ | N/A | Auto-generated primary key |
| master_general_agent_id | string | ✅ | MGA | Parent MGA scope; required for all templates |
| master_group_id | string | ❌ | Broker/Agency | Optional; null for MGA-level, set for Broker/Agency-level template |
| tenant_id | string | ❌ | Tenant | Optional; included for future multi-tenant isolation if needed |
| template_name | string | ✅ | N/A | User-friendly template name (max 255 chars) |
| description | string | ❌ | N/A | Optional template purpose/notes (max 1000 chars) |
| report_type | string | ✅ | N/A | Enum: `cases`, `quotes`, `census`, `enrollment`, `renewals`, `proposals` |
| export_format | string | ✅ | N/A | Enum: `pdf`, `csv`, `xlsx`; default `pdf` |
| filters_json | object | ❌ | N/A | Saved filter payload from Gate 6C (JSON object, must pass safe payload policy) |
| is_public | boolean | ✅ | N/A | If true, visible to all users in same MGA/Broker/Agency; default false |
| status | string | ✅ | N/A | Enum: `active`, `inactive`, `archived`; default `active` |
| created_by | string | ✅ | N/A | Email of template creator (audit trail) |
| owner_user_id | string | ❌ | N/A | Optional user ID of owner; null = template created by system or shared by MGA admin |
| created_date | date-time | ✅ | N/A | Auto-generated timestamp |
| updated_date | date-time | ✅ | N/A | Auto-updated timestamp |
| mga_migration_batch_id | string | ❌ | N/A | Phase 4 migration tracking (for future) |
| mga_migration_status | string | ❌ | N/A | Phase 4 migration status (enum: not_migrated, migrated, validated, anomaly, quarantined) |

**Required Fields (JSON Schema):**  
- master_general_agent_id
- template_name
- report_type
- export_format

**Scope Validation:**
- `master_general_agent_id` must match authenticated user's MGA scope
- If `master_group_id` is set, it must belong to `master_general_agent_id`
- If `tenant_id` is set, user must have access to that tenant

**Safe Payload Rules (filters_json):**
- No raw auth context, tokens, or session data
- No signed URLs or private file URIs
- No unredacted PHI/PII (unless explicitly approved by security review)
- No backend-only fields or stack traces
- Filters must match allowed filter schema from Gate 6C

---

### Entity: MGAReportSchedule

**Purpose:**  
Define when and how a report should be generated (one-time schedule definitions; execution deferred to Gate 6I-B).

**Inheritance Model:**  
Follows Phase 2 MGA scope pattern from Gates 6A–6H.

**Schema Definition:**

| Field | Type | Required | Scope | Description |
|-------|------|----------|-------|-------------|
| id | string (uuid) | ✅ | N/A | Auto-generated primary key |
| master_general_agent_id | string | ✅ | MGA | Parent MGA scope; required for all schedules |
| master_group_id | string | ❌ | Broker/Agency | Optional; null for MGA-level, set for Broker/Agency-level schedule |
| tenant_id | string | ❌ | Tenant | Optional; included for future multi-tenant isolation |
| template_id | string | ✅ | N/A | Foreign key to MGAReportTemplate |
| schedule_name | string | ✅ | N/A | User-friendly schedule name (max 255 chars) |
| schedule_type | string | ✅ | N/A | Enum: `one_time` (Gate 6I-A); `recurring` deferred to 6I-B |
| frequency | string | ❌ | N/A | For Gate 6I-A: null. For Gate 6I-B: enum: `daily`, `weekly`, `monthly`, `custom_cron` |
| timezone | string | ❌ | N/A | Optional IANA timezone (e.g., `America/Los_Angeles`); default user's timezone or UTC |
| scheduled_date_time | date-time | ✅ | N/A | When the report should run (for one_time) or first run (for recurring) |
| recurrence_end_date | date-time | ❌ | N/A | For recurring schedules; null = no end date. Null for one_time. |
| next_run_at | date-time | ❌ | N/A | Calculated next run timestamp (updated by scheduler, not user-settable) |
| last_run_at | date-time | ❌ | N/A | Timestamp of last execution (null until first run) |
| status | string | ✅ | N/A | Enum: `draft`, `active`, `paused`, `cancelled`; default `draft` |
| created_by | string | ✅ | N/A | Email of schedule creator (audit trail) |
| owner_user_id | string | ❌ | N/A | Optional user ID of owner; null = shared by MGA admin |
| created_date | date-time | ✅ | N/A | Auto-generated timestamp |
| updated_date | date-time | ✅ | N/A | Auto-updated timestamp |
| mga_migration_batch_id | string | ❌ | N/A | Phase 4 migration tracking |
| mga_migration_status | string | ❌ | N/A | Phase 4 migration status |

**Required Fields (JSON Schema):**
- master_general_agent_id
- template_id
- schedule_name
- schedule_type
- scheduled_date_time
- status

**Scope Validation:**
- `master_general_agent_id` must match authenticated user's MGA scope
- If `master_group_id` is set, it must belong to `master_general_agent_id`
- `template_id` must exist and be accessible by user (scope check)

**Status Transitions:**
```
draft → active (on save with active status)
active → paused (user pauses)
paused → active (user resumes)
active/paused/draft → cancelled (user cancels; irreversible)
active → completed (executed once, no further execution; for one_time only)
```

---

### Entity: MGAReportScheduleRun (Design-Only, Implementation in Gate 6I-B)

**Purpose:**  
Track each execution of a scheduled or manually-run report.

**Status for 6I-A:** DESIGN-ONLY (not created in 6I-A implementation; created in 6I-B when scheduler executes)

**Future Schema (Reference):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string (uuid) | ✅ | Auto-generated |
| schedule_id | string | ✅ | FK to MGAReportSchedule |
| template_id | string | ✅ | FK to MGAReportTemplate |
| master_general_agent_id | string | ✅ | MGA scope |
| master_group_id | string | ❌ | Broker/Agency scope (if schedule is scoped) |
| run_type | string | ✅ | Enum: `manual`, `scheduled` |
| run_status | string | ✅ | Enum: `pending`, `running`, `completed`, `failed`, `cancelled` |
| run_start_at | date-time | ✅ | When execution started |
| run_end_at | date-time | ❌ | When execution completed |
| export_generated_id | string | ❌ | FK to Gate 6C export record (links run to generated export) |
| error_message | string | ❌ | Error description if run failed |
| retry_count | integer | ✅ | Number of retry attempts (default 0) |
| idempotency_key | string | ✅ | Unique key for deduplication |
| created_date | date-time | ✅ | Auto-generated |

---

### Entity: MGAReportTemplateFilter (Optional, Design-Only)

**Purpose:**  
If needed, separately store filter definitions as reusable components (allows template to reference filters by ID instead of storing full JSON).

**Design Decision for 6I-A:** Store filters inline in `filters_json` on MGAReportTemplate. If filtering becomes complex (5+ shared filters), extract to separate entity in future gate.

**Status:** NOT RECOMMENDED FOR 6I-A (keep inline; simplifies initial design)

---

## 3. Template Model (Detailed)

### Template Creation & Defaults

**Default Values:**
```javascript
{
  master_general_agent_id: user.mga_scope,        // Required; from auth context
  master_group_id: null,                           // Optional; user must specify if creating Broker/Agency template
  template_name: "",                               // User input
  description: "",                                 // Optional
  report_type: null,                               // Required; user selects
  export_format: "pdf",                            // Default pdf
  filters_json: {},                                // User-defined filters from Gate 6C
  is_public: false,                                // Default private
  status: "active",                                // Default active
  created_by: user.email,                          // Auto-populated
  owner_user_id: user.id,                          // Auto-populated
  created_date: now(),                             // Auto-generated
  updated_date: now()                              // Auto-generated
}
```

### Allowed Template Statuses

| Status | Meaning | Allowed Transitions | UI Visibility |
|--------|---------|-------------------|---|
| `active` | Template is usable | → paused, → archived | ✅ Shown in list |
| `inactive` | Template disabled | → active, → archived | ⚠️ Shown (grayed out) |
| `archived` | Template hidden | None (terminal state) | ❌ Hidden (archive view) |

### Template Lifecycle

```
Create template (status = active)
  ↓
Use template (creates schedule, runs report)
  ↓
Pause template (status = inactive) — schedules not created, but existing schedules unaffected
  ↓
Reactivate (status = active)
  ↓
Archive (status = archived) — template hidden, schedules remain but stopped
```

---

## 4. Schedule Definition Model (Detailed)

### Schedule Creation & Defaults

**Default Values (One-Time Schedule):**
```javascript
{
  master_general_agent_id: user.mga_scope,        // Required; from auth context
  master_group_id: null,                           // Optional; from user
  template_id: selected_template.id,               // Required; user selects
  schedule_name: "",                               // User input
  schedule_type: "one_time",                       // Gate 6I-A only
  frequency: null,                                 // Null for one_time
  timezone: user.timezone || "UTC",                // Optional; user selects
  scheduled_date_time: null,                       // Required; user picks date/time
  recurrence_end_date: null,                       // Null for one_time
  next_run_at: scheduled_date_time,                // Calculated (same as scheduled_date_time for one_time)
  last_run_at: null,                               // Until first execution
  status: "draft",                                 // Start in draft; user activates
  created_by: user.email,                          // Auto-populated
  owner_user_id: user.id,                          // Auto-populated
  created_date: now(),                             // Auto-generated
  updated_date: now()                              // Auto-generated
}
```

### Allowed Schedule Statuses (6I-A)

| Status | Meaning | Allowed Transitions | Manual Run Allowed |
|--------|---------|-------------------|---|
| `draft` | Schedule not active | → active, → cancelled | ❌ No |
| `active` | Schedule ready | → paused, → cancelled | ✅ Yes |
| `paused` | Schedule suspended | → active, → cancelled | ❌ No |
| `cancelled` | Schedule deleted (soft delete) | None (terminal state) | ❌ No |

### Schedule Lifecycle

```
Create schedule (status = draft)
  ↓
Activate (status = active)
  ↓
Manual run allowed (click "Run Now" button)
  ↓
Pause (status = paused) — no more runs
  ↓
Reactivate (status = active) — resumes
  ↓
Cancel (status = cancelled) — terminal
```

### Manual "Run Now" Flow (6I-A)

When user clicks "Run Now" on an active schedule:
1. Load schedule + template
2. Check user has permission (via `mga.reports.schedules.execute_manual`)
3. Check user's scope matches schedule's scope
4. Call Gate 6C export service with template's filters + format
5. Log run to audit trail
6. Optionally create MGAReportScheduleRun record (design-only in 6I-A; implement in 6I-B)

---

## 5. Permission Model

### New Granular Permissions (Gate 6I-A)

**Permission Domain:** `mga.reports`

#### Granular Actions

| Permission | Domain | Action | Description | Default Roles |
|-----------|--------|--------|-------------|---|
| `mga.reports.templates.view` | reports | templates / view | View own and team templates | platform_super_admin, mga_admin, mga_manager |
| `mga.reports.templates.create` | reports | templates / create | Create new templates | platform_super_admin, mga_admin |
| `mga.reports.templates.manage` | reports | templates / manage | Edit and archive templates | platform_super_admin, mga_admin |
| `mga.reports.schedules.view` | reports | schedules / view | View own and team schedules | platform_super_admin, mga_admin, mga_manager |
| `mga.reports.schedules.create` | reports | schedules / create | Create new schedule definitions | platform_super_admin, mga_admin |
| `mga.reports.schedules.manage` | reports | schedules / manage | Edit, pause, cancel schedules | platform_super_admin, mga_admin |
| `mga.reports.schedules.execute_manual` | reports | schedules / execute_manual | Run schedule immediately (manual override) | platform_super_admin, mga_admin |
| `mga.reports.schedules.audit` | reports | schedules / audit | View schedule execution history | platform_super_admin, mga_admin, mga_manager |

### Permission Matrix Integration

**Location:** `lib/mga/permissionResolver.js`

**Additions:**
```javascript
reports: {
  templates: {
    view:    { platform_super_admin: A, mga_admin: A, mga_manager: A, mga_user: D, mga_read_only: D, ... },
    create:  { platform_super_admin: A, mga_admin: A, mga_manager: D, mga_user: D, mga_read_only: D, ... },
    manage:  { platform_super_admin: A, mga_admin: A, mga_manager: D, mga_user: D, mga_read_only: D, ... },
  },
  schedules: {
    view:             { platform_super_admin: A, mga_admin: A, mga_manager: A, mga_user: D, mga_read_only: D, ... },
    create:           { platform_super_admin: A, mga_admin: A, mga_manager: D, mga_user: D, mga_read_only: D, ... },
    manage:           { platform_super_admin: A, mga_admin: A, mga_manager: D, mga_user: D, mga_read_only: D, ... },
    execute_manual:   { platform_super_admin: A, mga_admin: A, mga_manager: D, mga_user: D, mga_read_only: D, ... },
    audit:            { platform_super_admin: A, mga_admin: A, mga_manager: A, mga_user: D, mga_read_only: D, ... },
  }
}
```

### Design Principle: Restrictive by Default

- Template creation → mga_admin only (prevents proliferation)
- Schedule creation → mga_admin only (scheduled executions are critical)
- Template/schedule view → mga_admin + mga_manager (supervisors)
- No public/broad access; users request templates from admins

### Permission Recheck at Execution (Gate 6I-A)

When user clicks "Run Now":
1. Recheck user has `mga.reports.schedules.execute_manual` permission
2. Recheck user's scope matches schedule's scope
3. Recheck underlying report type permission (via Gate 6C export permission)
4. If any check fails: deny with 403 Forbidden

---

## 6. Scope / Security Model

### Scope Boundaries (Enforced in All Actions)

#### 1. MGA Boundary
- User must have `master_general_agent_id` matching their authenticated scope
- All template/schedule list queries filtered by user's `master_general_agent_id`
- Cross-MGA template access → 404 (masked as not found)

#### 2. Broker / Agency Boundary (If master_group_id Is Set)
- Broker/Agency-level templates only visible to users with that `master_group_id` scope
- If user's scope is MGA-wide, they see all templates (including Broker/Agency-level ones in their MGA)
- If user's scope is limited to Broker/Agency, they see only that Broker/Agency's templates
- Cross-Broker/Agency access → 404 (masked as not found)

#### 3. Tenant Boundary (If Applicable)
- If `tenant_id` is populated, enforce tenant isolation
- Templates/schedules from one tenant not visible to other tenants
- Cross-tenant access → 404 (masked as not found)

#### 4. Report Type Permission Compatibility
- User must have Gate 6C export permission for the underlying `report_type`
- If user loses permission (role change, MGA reassignment), template still exists but execution fails at run time
- At "Run Now" time, recheck permission; if denied, show error

### Enforcement Points

**scopeGate Integration:**

Every template/schedule action calls `scopeGate`:
```
scopeGate({
  user,
  action: "templates.view" | "templates.manage" | "schedules.create" | etc.,
  domain: "reports",
  target_entity_type: "MGAReportTemplate" | "MGAReportSchedule",
  target_entity_id: template.id | schedule.id,
  payload: { master_general_agent_id, master_group_id, tenant_id }
})
```

**permissionResolver Integration:**

Every action checks permission matrix:
```
permissionResolver.check(user.role, "reports", "templates.view")
// Returns "ALLOW" or "DENY"
```

### Security Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Cross-MGA template visibility | **HIGH** | scopeGate enforces MGA check; 404 if mismatch |
| Cross-tenant template reuse | **HIGH** | tenant_id field; fail-closed if null mismatch |
| Unauthorized template execution | **HIGH** | Permission recheck at "Run Now" time |
| Template exposing restricted filters | **MEDIUM** | Safe payload policy enforced on filters_json |
| Schedule running after permission revoked | **MEDIUM** | Permission recheck at manual run time; execution permission cache invalidated hourly |
| Stale schedule after Broker/Agency deactivation | **MEDIUM** | Schedule status → cancelled if Broker/Agency becomes inactive (Gate 6H integration) |
| Duplicate scheduled runs | **MEDIUM** | Unique constraint on (schedule_id, scheduled_date_time); idempotency key per run |
| Template name injection / XSS | **LOW** | Template name stored as plain text; sanitized in UI (React escaping) |
| Filter JSON injection | **LOW** | Strict schema validation on filters_json; no raw code execution |

### Fail-Closed Behavior

- Undefined permission = DENY
- Scope mismatch = 404 (not "access denied" to prevent information leakage)
- Missing template = 404
- Missing schedule = 404
- Invalid report type = validation error (400 Bad Request)
- Inactive template = cannot create schedule (validation error)
- Invalid filters = rejected at create time with detailed error

---

## 7. Filter Safety Policy

### Allowed Filters (Whitelist)

Filters must originate from Gate 6C report export service. Allowed filter categories:

- **Report Status Filters:** `case_status`, `quote_status`, `enrollment_status`, etc.
- **Date Range Filters:** `created_date_from`, `created_date_to`, `updated_date_from`, `updated_date_to`
- **Ownership Filters:** `assigned_to`, `created_by`, `owner_id`
- **Entity Reference Filters:** `employer_id`, `broker_id`, `case_id`, `proposal_id`
- **Numeric Filters:** `priority`, `risk_score`, `renewal_percent`
- **Enum Filters:** `case_type`, `quote_status`, `proposal_stage`
- **Search Filters:** `full_text_search`, `name_contains`

### Restricted Filters (Blacklist)

The following must **NEVER** appear in `filters_json`:

❌ **Authentication & Authorization:**
- `user_auth_token`
- `session_id`
- `api_key`
- `oauth_token`
- `refresh_token`
- `user_role` (runtime; not storable)
- `user_permissions` (runtime; not storable)

❌ **File & URL Handling:**
- `signed_url`
- `private_file_uri`
- `download_token`
- `file_path`
- `s3_key`
- `presigned_url`

❌ **Sensitive Data:**
- `ssn`
- `credit_card`
- `tax_id_ein`
- `unredacted_address` (if PII policy restricts)
- `unredacted_phone` (if PII policy restricts)
- `bank_account`
- `routing_number`

❌ **Backend-Only Fields:**
- `internal_system_flag`
- `database_migration_state`
- `feature_flag_override`
- `config_override`

❌ **Stack Traces & Debugging:**
- `error_stack_trace`
- `debug_log`
- `internal_error_message`

### Safe Payload Validation (At Create / Update Time)

When `filters_json` is provided:
1. Parse JSON; fail if invalid
2. Iterate all filter keys
3. For each key, check against whitelist
4. If key is in blacklist, reject with 400 Bad Request
5. For each value, check type (string, number, date, boolean, array of above)
6. No raw code execution; arrays of primitives only
7. If validation passes, store; if not, return detailed error message

**Validation Pseudocode:**
```javascript
function validateFilterPayload(filters_json) {
  const BLACKLIST = [
    'signed_url', 'private_file_uri', 'user_auth_token', 'ssn',
    'credit_card', 'tax_id_ein', 'bank_account', 'error_stack_trace',
    // ... complete blacklist
  ];
  
  for (let key in filters_json) {
    if (BLACKLIST.includes(key)) {
      throw new Error(`Restricted filter: ${key}`);
    }
    const value = filters_json[key];
    if (!isAllowedType(value)) {
      throw new Error(`Invalid filter value type for ${key}`);
    }
  }
  
  return true;
}

function isAllowedType(value) {
  return typeof value === 'string' || typeof value === 'number' || 
         typeof value === 'boolean' || value instanceof Date ||
         (Array.isArray(value) && value.every(v => isAllowedType(v)));
}
```

---

## 8. Backend Service Design

### Service File: `lib/mga/services/reportTemplateService.js`

**Purpose:**  
Encapsulate all template and schedule CRUD logic with permission and scope enforcement.

**Service Methods:**

#### Template Management

```javascript
// Retrieve all templates in user's MGA scope
async function listReportTemplates(request) {
  // Enforces: permissionResolver, scopeGate, MGA boundary
  // Returns: array of MGAReportTemplate records
}

// Create new template
async function createReportTemplate(request) {
  // Enforces: permission (mga.reports.templates.create), scope, filter validation
  // Returns: created MGAReportTemplate
  // Audit: report_template_created event
}

// Get template detail
async function getReportTemplateDetail(request) {
  // Enforces: permission, scope, exists check
  // Returns: MGAReportTemplate record with audit trail
  // Audit: report_template_viewed event (if not already cached)
}

// Update template
async function updateReportTemplate(request) {
  // Enforces: permission (mga.reports.templates.manage), scope, filter validation
  // Returns: updated MGAReportTemplate
  // Audit: report_template_updated event
}

// Archive (soft delete) template
async function archiveReportTemplate(request) {
  // Enforces: permission, scope
  // Sets status = "archived"
  // Returns: updated MGAReportTemplate
  // Audit: report_template_archived event
}
```

#### Schedule Management

```javascript
// Retrieve all schedules in user's MGA scope
async function listReportSchedules(request) {
  // Enforces: permissionResolver, scopeGate, MGA boundary
  // Returns: array of MGAReportSchedule records
}

// Create schedule definition (one-time or recurring metadata)
async function createReportScheduleDefinition(request) {
  // Enforces: permission (mga.reports.schedules.create), scope, template exists, valid date
  // Returns: created MGAReportSchedule with status = "draft"
  // Audit: report_schedule_created event
  // Note: No actual job scheduled; metadata only in 6I-A
}

// Get schedule detail
async function getReportScheduleDetail(request) {
  // Enforces: permission, scope, exists check
  // Returns: MGAReportSchedule record
}

// Update schedule definition
async function updateReportScheduleDefinition(request) {
  // Enforces: permission (mga.reports.schedules.manage), scope
  // Returns: updated MGAReportSchedule
  // Audit: report_schedule_updated event
}

// Activate schedule (draft → active)
async function activateReportSchedule(request) {
  // Enforces: permission, scope, schedule status is draft
  // Sets status = "active"
  // Calculates next_run_at
  // Returns: updated schedule
  // Audit: report_schedule_activated event
}

// Pause schedule (active → paused)
async function pauseReportSchedule(request) {
  // Enforces: permission (mga.reports.schedules.manage), scope, status = active
  // Sets status = "paused"
  // Returns: updated schedule
  // Audit: report_schedule_paused event
}

// Cancel schedule (any → cancelled)
async function cancelReportSchedule(request) {
  // Enforces: permission, scope
  // Sets status = "cancelled" (terminal state)
  // Returns: updated schedule
  // Audit: report_schedule_cancelled event
}

// Execute schedule manually ("Run Now" button)
async function executeScheduleManual(request) {
  // Enforces: permission (mga.reports.schedules.execute_manual), scope, schedule is active
  // Calls Gate 6C export service
  // Logs run to audit trail
  // Returns: export result from Gate 6C
  // Audit: report_schedule_executed event
}

// Retrieve schedule audit trail
async function getReportScheduleAuditTrail(request) {
  // Enforces: permission (mga.reports.schedules.audit), scope
  // Returns: array of audit events for schedule
}
```

### Integration Points

**Gate 6C (Report Export):**
- `listReportTemplates` does not call Gate 6C (just lists metadata)
- `executeScheduleManual` calls Gate 6C export service with template's filters + format

**Gate 6D (Export History):**
- Manual runs logged to Gate 6D history via export service

**Gate 6G (Export UI Surface):**
- "Save as Template" button in Gate 6G export dialog calls `createReportTemplate`

**Gate 6H (Broker/Agency Lifecycle):**
- When Broker/Agency deactivates, update schedules scoped to that Broker/Agency: set status → cancelled (prevent future runs)
- Implement via automation: entity trigger on MasterGroup status change → cascade to schedules

### Service Contract (Via serviceContract.js)

Every method follows Phase 3 pattern:
```javascript
async function method(request) {
  // Validate request shape
  const v = validateServiceRequest(request);
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  
  // Check scope + permission
  const { decision, denied, response } = await checkScope({
    ...request,
    domain: 'reports',
    action: 'templates.create' | 'schedules.manage' | etc.,
    target_entity_type: 'MGAReportTemplate' | 'MGAReportSchedule'
  });
  if (denied) return response;
  
  // Perform operation (CRUD)
  // ...
  
  // Audit
  await prepareAndRecordAudit(decision, { outcome: 'success', ... });
  
  // Return
  return buildScopedResponse({ data: result, correlation_id: decision.correlation_id });
}
```

---

## 9. Frontend Design

### Component File Structure

```
components/mga/
├── MGAReportTemplatesPanel.jsx          (Container; list templates)
├── MGAReportTemplateModal.jsx           (Create/edit template modal)
├── MGAReportTemplateCard.jsx            (Template card in list)
├── MGAReportSchedulePanel.jsx           (Container; list schedules)
├── MGAReportScheduleModal.jsx           (Create/edit schedule modal)
├── MGAReportScheduleCard.jsx            (Schedule card in list)
└── MGAReportScheduleStatusBadge.jsx     (Status indicator)
```

### Mount Location

**Primary Mount:** Broker/Agency Detail Drawer (MGABrokerAgencyDetailDrawer.jsx)
- Add new tab: "Report Templates & Schedules"
- Container: MGAReportTemplatesPanel (shows templates for this Broker/Agency)
- Container: MGAReportSchedulePanel (shows schedules for this Broker/Agency)

**Alternative Mount (Future):** Dedicated "Reports" page in MGA command center
- Centralized templates/schedules management
- Not required for Gate 6I-A; add in future if needed

### Component Specifications

#### MGAReportTemplatesPanel.jsx

**Props:**
```javascript
{
  masterGroupId,           // Broker/Agency ID (or null for MGA-level)
  masterGeneralAgentId,    // MGA ID (required)
}
```

**State:**
- templates: array of MGAReportTemplate
- loading: boolean
- error: string or null
- showCreateModal: boolean
- editingTemplate: MGAReportTemplate or null

**Behavior:**
- Load templates on mount (filter by master_group_id)
- Display list with: name, report_type, format, created_by, status
- Buttons: Create, Edit (if user has manage permission), Archive, Use (opens schedule modal)
- Show "No templates" message if empty

**Permissions:**
- View: mga.reports.templates.view
- Create button: mga.reports.templates.create
- Edit/Archive: mga.reports.templates.manage

#### MGAReportTemplateModal.jsx

**Props:**
```javascript
{
  isOpen: boolean,
  mode: "create" | "edit",
  template: MGAReportTemplate or null,
  masterGroupId,
  masterGeneralAgentId,
  onClose: () => void,
  onSave: (template) => void,
}
```

**Fields:**
1. Template name (text input, required, max 255 chars)
2. Description (textarea, optional, max 1000 chars)
3. Report type (dropdown: cases, quotes, census, enrollment, renewals, proposals)
4. Export format (radio: pdf, csv, xlsx; default pdf)
5. Filters (button: "Edit Filters" → opens Gate 6C filter UI)
6. Public checkbox (if true, visible to team)
7. Save button (disabled until name + report_type filled)
8. Cancel button

**Behavior:**
- On open: populate fields if editing
- On save: validate required fields, call createReportTemplate or updateReportTemplate
- Show error if save fails
- Close modal on success

#### MGAReportSchedulePanel.jsx

**Props:**
```javascript
{
  masterGroupId,
  masterGeneralAgentId,
}
```

**State:**
- schedules: array of MGAReportSchedule
- loading: boolean
- error: string or null
- showCreateModal: boolean
- editingSchedule: MGAReportSchedule or null

**Behavior:**
- Load schedules on mount
- Display list with: name, template name, type (one_time/recurring), status, next_run_at, actions
- Status badge: draft/active/paused/cancelled (color-coded)
- Buttons: Create, Edit (if manage permission), Pause/Resume, Cancel, Run Now (if active)
- Show "No schedules" message if empty
- "Run Now" button calls executeScheduleManual; show success/error

**Permissions:**
- View: mga.reports.schedules.view
- Create: mga.reports.schedules.create
- Edit/Pause/Cancel: mga.reports.schedules.manage
- Run Now: mga.reports.schedules.execute_manual

#### MGAReportScheduleModal.jsx

**Props:**
```javascript
{
  isOpen: boolean,
  mode: "create" | "edit",
  schedule: MGAReportSchedule or null,
  masterGroupId,
  masterGeneralAgentId,
  onClose: () => void,
  onSave: (schedule) => void,
}
```

**Fields (6I-A):**
1. Template (dropdown: select saved template, required)
2. Schedule name (text input, required)
3. Schedule type (radio: one_time only in 6I-A)
4. Scheduled date & time (date picker + time picker, required)
5. Timezone (dropdown: list of IANA timezones, optional, default UTC)
6. Save button
7. Cancel button

**Behavior:**
- On open: populate fields if editing
- On save: validate required fields, call createReportScheduleDefinition or updateReportScheduleDefinition
- Sets status = "draft" for new schedules; user must activate separately
- Show error if save fails
- Close modal on success

**Future Fields (6I-B, not in 6I-A):**
- Recurrence (daily/weekly/monthly/custom cron)
- Recurrence end date
- Delivery method (email/webhook/ftp)
- Recipients / delivery config

---

## 10. Audit Events

### Audit Trail Design

Every action is logged to `ActivityLog` or dedicated `MGAReportAuditLog` entity.

**Audit Fields (Standard):**
- event_type: string (see events below)
- actor_email: string (who made the action)
- actor_role: string (user's role at time of action)
- master_general_agent_id: string (MGA scope)
- master_group_id: string (Broker/Agency scope, if applicable)
- target_entity_type: string (MGAReportTemplate, MGAReportSchedule)
- target_entity_id: string (template ID or schedule ID)
- outcome: string (success, failed, blocked)
- detail: string (human-readable description)
- created_at: date-time (timestamp)

### Audit Events

#### Template Events

| Event Type | Trigger | Detail Example |
|-----------|---------|---|
| `report_template_created` | Template created | `Created template "Weekly Summary" (pdf, cases)` |
| `report_template_updated` | Template fields changed | `Updated "Weekly Summary": added filter status=active` |
| `report_template_archived` | Template archived | `Archived template "Weekly Summary"` |
| `report_template_viewed` | Template detail loaded | `Viewed template "Weekly Summary"` (optional, reduce noise) |
| `report_template_permission_denied` | Unauthorized access attempt | `Attempted to view template (unauthorized; cross-MGA)` |
| `report_template_scope_denied` | Scope boundary violation | `Attempted to access template (scope mismatch; cross-Broker/Agency)` |

#### Schedule Events

| Event Type | Trigger | Detail Example |
|-----------|---------|---|
| `report_schedule_created` | Schedule defined | `Created schedule "Weekly Export" (template: Weekly Summary, one_time, 2026-05-19 09:00)` |
| `report_schedule_updated` | Schedule changed | `Updated schedule "Weekly Export": changed scheduled_date_time to 2026-05-20` |
| `report_schedule_activated` | Schedule activated | `Activated schedule "Weekly Export" (status: draft → active)` |
| `report_schedule_paused` | Schedule paused | `Paused schedule "Weekly Export" (status: active → paused)` |
| `report_schedule_cancelled` | Schedule cancelled | `Cancelled schedule "Weekly Export"` |
| `report_schedule_executed` | Schedule executed manually | `Executed schedule "Weekly Export" manually; export generated` |
| `report_schedule_permission_denied` | Unauthorized execution | `Attempted to execute schedule (unauthorized; missing execute_manual permission)` |
| `report_schedule_scope_denied` | Scope boundary violation | `Attempted to execute schedule (scope mismatch; cross-MGA)` |
| `report_schedule_audit_viewed` | Audit trail accessed | `Viewed audit trail for schedule "Weekly Export"` |

### Audit Trail Queries

Admin users can view:
- All template/schedule events for their MGA
- All events for templates/schedules in their Broker/Agency scope
- Event filtering by date, actor, entity, outcome

---

## 11. Validation Plan

### Unit Test Matrix (Jest)

#### Authorization & Permission Tests

```javascript
describe('MGAReportTemplate Permissions', () => {
  test('admin can create template', async () => { ... });
  test('manager cannot create template', async () => { ... });
  test('user cannot create template', async () => { ... });
  test('read-only cannot create template', async () => { ... });
  
  test('admin can view team templates', async () => { ... });
  test('manager can view team templates', async () => { ... });
  test('user cannot view templates', async () => { ... });
  
  test('admin can manage (edit/archive) own template', async () => { ... });
  test('admin cannot manage other MGA's template', async () => { ... });
});

describe('MGAReportSchedule Permissions', () => {
  test('admin can create schedule', async () => { ... });
  test('admin can pause schedule', async () => { ... });
  test('manager cannot pause schedule', async () => { ... });
  test('admin can execute manual (Run Now)', async () => { ... });
  test('manager cannot execute manual', async () => { ... });
});
```

#### Scope & Data Isolation Tests

```javascript
describe('MGAReportTemplate Scope', () => {
  test('template master_general_agent_id matches user MGA scope', async () => { ... });
  test('cross-MGA template list is filtered correctly', async () => { ... });
  test('cross-MGA template access returns 404', async () => { ... });
  
  test('Broker/Agency template master_group_id set correctly', async () => { ... });
  test('cross-Broker/Agency template access returns 404', async () => { ... });
});

describe('MGAReportSchedule Scope', () => {
  test('schedule master_general_agent_id matches user MGA scope', async () => { ... });
  test('schedule template_id exists and is accessible', async () => { ... });
  test('cross-MGA schedule access returns 404', async () => { ... });
});
```

#### Data Model Tests

```javascript
describe('MGAReportTemplate Entity', () => {
  test('create template with required fields', async () => { ... });
  test('reject template without template_name', async () => { ... });
  test('reject template without report_type', async () => { ... });
  test('filters_json is stored as JSON object', async () => { ... });
  test('export_format defaults to pdf', async () => { ... });
});

describe('MGAReportSchedule Entity', () => {
  test('create schedule with required fields', async () => { ... });
  test('reject schedule without template_id', async () => { ... });
  test('schedule_type = one_time for Gate 6I-A', async () => { ... });
  test('status defaults to draft', async () => { ... });
  test('scheduled_date_time is stored correctly', async () => { ... });
  test('next_run_at calculated for one_time', async () => { ... });
});
```

#### Manual Execution Tests

```javascript
describe('Manual Schedule Execution', () => {
  test('Run Now calls Gate 6C export service', async () => { ... });
  test('Run Now logs event to audit trail', async () => { ... });
  test('Run Now returns export result (pdf/csv/xlsx)', async () => { ... });
  test('Run Now fails if user lacks execute_manual permission', async () => { ... });
  test('Run Now fails if schedule is paused', async () => { ... });
  test('Run Now fails if schedule is cancelled', async () => { ... });
  test('Run Now idempotency prevents duplicates', async () => { ... });
});
```

#### Filter Safety Tests

```javascript
describe('Filter Safety Validation', () => {
  test('allow whitelisted filters (case_status, date_range, etc.)', async () => { ... });
  test('reject signed_url in filters', async () => { ... });
  test('reject private_file_uri in filters', async () => { ... });
  test('reject user_auth_token in filters', async () => { ... });
  test('reject error_stack_trace in filters', async () => { ... });
  test('reject raw code in filters', async () => { ... });
  test('allow arrays of primitive types in filters', async () => { ... });
});
```

#### Audit & Compliance Tests

```javascript
describe('Audit Trail', () => {
  test('template create logs audit event', async () => { ... });
  test('template update logs audit event', async () => { ... });
  test('schedule create logs audit event', async () => { ... });
  test('schedule execute manual logs audit event', async () => { ... });
  test('permission denied logs blocked event', async () => { ... });
  test('scope denied logs blocked event', async () => { ... });
  test('audit trail queryable by admin', async () => { ... });
});
```

#### Regression Tests (Gates 6A–6H, 6L-A)

```javascript
describe('Regression: Gate 6C Export', () => {
  test('export service still generates reports', async () => { ... });
  test('export service uses template filters correctly', async () => { ... });
});

describe('Regression: Gate 6D Export History', () => {
  test('manual runs logged to export history', async () => { ... });
  test('export history shows run status', async () => { ... });
});

describe('Regression: Gate 6G Export UI', () => {
  test('report export button still visible', async () => { ... });
  test('export modal still functional', async () => { ... });
});

describe('Regression: Gate 6L-A Contacts + Settings', () => {
  test('Broker/Agency contacts unaffected', async () => { ... });
  test('Broker/Agency settings unaffected', async () => { ... });
});
```

#### Build & Quality Tests

```javascript
describe('Build & Lint', () => {
  test('npm run build passes', async () => { ... });
  test('eslint passes', async () => { ... });
  test('jest tests pass', async () => { ... });
});

describe('Registry & Ledger', () => {
  test('QUOTE_CONNECT_360_GATE_REGISTRY.json is valid JSON', async () => { ... });
  test('Gate 6I-A entry has correct status', async () => { ... });
  test('Gate 6I-B marked as DEFERRED', async () => { ... });
});
```

### Test Count Estimate (6I-A Implementation)

- Permission tests: 15
- Scope tests: 10
- Data model tests: 12
- Manual execution tests: 8
- Filter safety tests: 8
- Audit tests: 8
- Regression tests: 12
- Build/quality tests: 6

**Total: ~79 tests**

---

## 12. Rollback Strategy

### Feature Flag (Optional, but Recommended)

**Flag Name:** `MGA_REPORT_TEMPLATES_ENABLED`  
**Location:** `components/mga/MGABrokerAgencyDetailDrawer.jsx` or central feature flag service  
**Default:** `false` (until implementation complete)  
**Value at Gate 6I-A Launch:** `true`  
**Behavior:**
- If false: hide template/schedule tabs and UI
- If true: show tabs and render components

### Rollback Phases

#### Phase 1: UI Surface Rollback (Fastest)
1. Set `MGA_REPORT_TEMPLATES_ENABLED = false`
2. Templates/schedules UI hidden
3. Existing reports/exports unaffected
4. Backend data preserved
5. **Rollback time:** <1 minute

#### Phase 2: Feature Disable (Backend)
1. Disable API endpoints: `/api/report-templates/*`, `/api/report-schedules/*`
2. Return 503 Service Unavailable if called
3. UI disabled (Phase 1)
4. **Rollback time:** 5 minutes (deploy backend)

#### Phase 3: Data Rollback (If Critical)
1. Rollback database schema (remove MGAReportTemplate, MGAReportSchedule tables)
2. Re-run migrations to remove new entities
3. **Rollback time:** 10–30 minutes (depends on database size)
4. **Data loss:** All templates and schedules deleted (irreversible)
5. **Use only if:** Critical security issue discovered requiring immediate removal

### Rollback Checklist

- [ ] Feature flag set to false
- [ ] Backend API endpoints disabled (return 503)
- [ ] UI components hidden in all locations
- [ ] Verify Gate 6C export still works
- [ ] Verify Gate 6D export history still works
- [ ] Verify Gate 6G export button still works
- [ ] Verify Gate 6L-A contacts + settings still work
- [ ] Verify Gates 6A–6H user management still works
- [ ] Monitor logs for errors
- [ ] Notify operators of rollback status

### Non-Rollback Failures

**Scenario:** Schedule defined but never activated (status = draft)
- **Action:** Schedule remains in database, marked draft
- **Cleanup:** Admin can view and delete via UI or backend
- **Impact:** No impact on other systems; safe to ignore

**Scenario:** Template created with invalid filters
- **Action:** Template created but execution fails when Run Now clicked
- **Cleanup:** User re-edits template, corrects filters
- **Impact:** No impact on other systems; user can retry

**Scenario:** Broker/Agency deactivated while schedules active
- **Action:** Schedules set to cancelled (via automation on Gate 6H)
- **Cleanup:** Automatic via Gate 6H cascade rule
- **Impact:** Schedules stop; no further runs

---

## 13. Recommendation

### Design Status

**Gate 6I-A Design Specification:** ✅ COMPLETE

All 13 required sections documented:
1. ✅ Scope classification (IN SCOPE vs DEFERRED vs NOT INCLUDED)
2. ✅ Data model design (MGAReportTemplate, MGAReportSchedule, future MGAReportScheduleRun)
3. ✅ Template model (statuses, lifecycle, defaults)
4. ✅ Schedule definition model (one-time only, statuses, lifecycle)
5. ✅ Permission model (granular permissions, restrictive by default)
6. ✅ Scope/security model (MGA/Broker/Agency/tenant boundaries, fail-closed)
7. ✅ Filter safety policy (whitelist/blacklist, validation)
8. ✅ Backend service design (CRUD methods, integration points)
9. ✅ Frontend design (component structure, mount location, specifications)
10. ✅ Audit events (event types, trail queries)
11. ✅ Validation plan (unit tests, regression tests, ~79 tests)
12. ✅ Rollback strategy (feature flag, 3 phases)
13. ✅ Recommendation (split 6I-A + defer 6I-B)

### Recommendation: **PROCEED WITH IMPLEMENTATION WORK ORDER**

**Gate 6I-A Implementation Path:**
1. ✅ Create MGAReportTemplate entity
2. ✅ Create MGAReportSchedule entity
3. ✅ Add template/schedule permissions to permissionResolver
4. ✅ Build reportTemplateService.js with CRUD + scope enforcement
5. ✅ Build UI components (MGAReportTemplatesPanel, MGAReportTemplateModal, MGAReportSchedulePanel, MGAReportScheduleModal)
6. ✅ Integrate with Broker/Agency detail drawer (new tab)
7. ✅ Implement "Run Now" manual execution (calls Gate 6C)
8. ✅ Add audit logging
9. ✅ Write unit + regression tests (~79 tests)
10. ✅ Validate against template closure criteria
11. ✅ Update registry to ACTIVATED_VALIDATION_PASSING

**Timeline Estimate:**
- Implementation + testing: 3–4 weeks
- Validation: 1 week
- **Total: 4–5 weeks to Gate 6I-A ACTIVATED_VALIDATION_PASSING**

### Gate 6I-B: Recurring Scheduler Execution (Deferred)

**Status:** DEFERRED pending separate scheduler safety design

**Design Topics for 6I-B (Future):**
- Message queue architecture (Deno KV, external job queue, or scheduling platform)
- Permission/scope recheck at execution time
- Failure recovery and retry logic
- Email/webhook delivery integration
- Operator approval required before 6I-B implementation

---

## Appendix A: Glossary

| Term | Definition |
|------|-----------|
| **Gate 6I-A** | Saved Report Templates + Schedule Definitions (current scope) |
| **Gate 6I-B** | Recurring Scheduler Execution (deferred) |
| **Template** | Saved report configuration (filters, format, report type); reusable across users |
| **Schedule** | Metadata defining when a report should run (one-time or recurring) |
| **Manual Run** | User clicks "Run Now" to execute report immediately (not scheduler-triggered) |
| **Scope** | Organizational boundary (MGA, Broker/Agency, tenant) |
| **Permission** | Role-based access control rule (e.g., mga.reports.templates.create) |
| **Audit Trail** | Log of all create/update/delete events with actor, outcome, timestamp |
| **Safe Payload** | Filters that don't contain tokens, signed URLs, or restricted data |
| **Whitelist** | List of allowed filters |
| **Blacklist** | List of forbidden filters (tokens, auth, file URIs, etc.) |

---

## Summary

**Gate 6I-A Design Specification: COMPLETE**

**Key Deliverables:**
- ✅ Scope clearly split (6I-A + deferred 6I-B)
- ✅ Data model finalized (MGAReportTemplate, MGAReportSchedule)
- ✅ Permission model defined (restrictive by default)
- ✅ Scope/security boundaries enforced
- ✅ Filter safety policy documented
- ✅ Backend service design specified (8 CRUD methods)
- ✅ Frontend component design specified (5 components, mount location)
- ✅ Audit events classified (10 event types)
- ✅ Validation plan complete (~79 tests)
- ✅ Rollback strategy documented (3 phases)

**Recommendation:** Proceed to Gate 6I-A Implementation Work Order

**Next Document:** Gate 6I-A Implementation Work Order (detailed task breakdown for dev team)

**Guardrails:** All maintained
- ✅ No recurring execution in 6I-A
- ✅ No background jobs
- ✅ No email/webhook delivery
- ✅ No document management
- ✅ No schema renames (MasterGroup, master_group_id)
- ✅ No permission broadening
- ✅ No gate rewrites (6A–6H, 6L-A untouched)

---

*Design Specification completed 2026-05-12*  
*Awaiting operator approval to begin Gate 6I-A implementation work order.*