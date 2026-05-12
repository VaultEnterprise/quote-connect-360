# MGA Gate 6I Discovery / Preflight
## Report Scheduling and Saved Report Templates

**Document Version:** 1.0  
**Date Created:** 2026-05-12  
**Status:** DISCOVERY_PREFLIGHT  
**Phase:** Pre-Design Review  
**Implementation Status:** NOT_STARTED  
**Runtime Changes:** NONE  

---

## 1. Current Reporting Baseline

### Active Capabilities

**Gate 6C — Report Exports** (CLOSED, production-ready)
- Backend export service fully operational
- Permission matrix enforces role-based export access
- Safe payload controls active
- Audit logging for all export operations
- Status: PRODUCTION

**Gate 6D — Export Delivery History & Tracking** (ACTIVATED_VALIDATION_PASSING)
- Export history view functional
- Run tracking across all scopes
- Delivery status visible to authorized users
- No signed URLs or private file URIs exposed
- Status: PRODUCTION

**Gate 6G — Report Export UI Surface Activation** (ACTIVATED_VALIDATION_PASSING)
- Report export button visible for authorized roles
- Modal surfaces for export options
- Backend Gate 6C controls remain primary authorization layer
- Status: PRODUCTION

**Gate 6L-A — Broker / Agency Contacts + Settings** (ACTIVATED_VALIDATION_PASSING)
- Settings management active (notification preferences, invite defaults)
- Internal notes scoped to MGA admin only
- No document management active
- Status: PRODUCTION

### Current State Summary

✅ Exports are active  
✅ Export history is active  
✅ Report export UI is surfaced  
✅ No scheduling currently active  
✅ No saved templates currently active  
✅ No recurring jobs currently running  

---

## 2. Proposed Gate 6I Scope

### Scope Classification Matrix

#### IN SCOPE — Recommended for Gate 6I-A
- [x] Saved report templates (user-level, MGA-level)
- [x] Template field definitions (report type, filters, export format)
- [x] Manual "run now" from template
- [x] Schedule definitions (one-time, metadata only, not recurring)
- [x] Schedule ownership and visibility
- [x] Template and schedule audit trail
- [x] Permission model for template/schedule management
- [x] Scope enforcement (MGA, Broker/Agency boundaries)

#### DEFERRED — Gate 6I-B (Future Scheduler Execution)
- [ ] Recurring scheduled report execution (daily/weekly/monthly)
- [ ] Automated job trigger mechanism
- [ ] Scheduler runtime state management
- [ ] Cron-style schedule definitions
- [ ] Automatic email/delivery dispatch
- [ ] Job queue management
- [ ] Retry and failure handling at scheduler level

#### REQUIRES SEPARATE GATE
- [ ] External webhook delivery destinations
- [ ] Bulk scheduled export operations
- [ ] Complex distribution lists / team scheduling
- [ ] Document/file storage and retrieval
- [ ] Private file download handling
- [ ] Report attachment delivery via email
- [ ] Broker/Agency document management (Gate 6L-B)

#### NOT RECOMMENDED
- [ ] Backend rename from MasterGroup to BrokerAgency
- [ ] Schema migration for historical reports
- [ ] Direct email sending from Gate 6I (use sendProposalEmail or new email service)
- [ ] Exponential permission expansion

---

## 3. Explicit Deferrals

### Gate 6I-B: Recurring Scheduler Execution (Deferred)
Recurring scheduled report execution requires:
- Separate scheduler runtime safety design
- Job queue infrastructure assessment
- Failure recovery design
- Permission/scope recheck mechanisms at execution time
- Operator approval before implementation

**Why Deferred:**  
Scheduling execution involves long-lived state, background job execution, and retry logic outside the scope of template definition and manual scheduling. This complexity warrants separate gate and security review.

### Gate 6L-B: Document Management (Deferred)
Document storage, private file handling, and signed URL generation remain explicitly deferred per Gate 6L-A closure.

### External Delivery Mechanisms (Separate Gate)
Email delivery, webhook distribution, and file attachment dispatch should be evaluated as a separate gate after schedule definitions are stabilized.

### Backend Rename (Not Recommended)
Renaming MasterGroup → BrokerAgency is explicitly not recommended during active gated development. This belongs in post-project infrastructure consolidation or a dedicated rename gate with comprehensive migration planning.

---

## 4. Data Model Assessment

### Proposed Entities for Gate 6I-A

#### Entity: MGAReportTemplate

**Purpose:**  
Store saved report configuration (filters, format, export type) for reuse by users.

**Required Fields:**

| Field | Type | Scope | Description |
|-------|------|-------|-------------|
| id | string | N/A | Auto-generated ID |
| master_general_agent_id | string | MGA | Required; parent MGA scope |
| master_group_id | string | Broker/Agency | Optional; null = MGA-level template, set = Broker/Agency-level template |
| created_by | string | N/A | Email of creator |
| template_name | string | N/A | User-friendly name (e.g., "Weekly Q1 Summary") |
| description | string | N/A | Template purpose and notes |
| report_type | string | N/A | Enum: cases, quotes, census, enrollment, renewals, proposals, etc. |
| export_format | string | N/A | Enum: pdf, csv, xlsx (default: pdf) |
| filters | object | N/A | Saved filter JSON (status, date range, priority, etc.) |
| is_public | boolean | N/A | If true, visible to all users in same MGA/Broker/Agency |
| status | string | N/A | Enum: active, archived |
| created_date | date-time | N/A | Auto-generated |
| updated_date | date-time | N/A | Auto-updated |

**Audit Fields:**  
- created_by, created_date (auto)
- updated_date (auto)
- No explicit "updated_by" in initial design; can add if needed

**Security Considerations:**
- Filters must not expose restricted columns (e.g., financial data beyond user's permission)
- Scope enforcement: users can only create templates for their own MGA/Broker/Agency
- Permission check at template execution time (don't execute template if user loses permission to filter type)

#### Entity: MGAReportSchedule

**Purpose:**  
Define when and how a report should be generated (one-time or recurring definition; execution is Gate 6I-B).

**Required Fields:**

| Field | Type | Scope | Description |
|-------|------|-------|-------------|
| id | string | N/A | Auto-generated ID |
| master_general_agent_id | string | MGA | Required; parent MGA scope |
| master_group_id | string | Broker/Agency | Optional; null = MGA-level schedule, set = Broker/Agency-level |
| template_id | string | N/A | FK to MGAReportTemplate |
| created_by | string | N/A | Email of schedule owner |
| schedule_name | string | N/A | User-friendly name (e.g., "Weekly Export - Friday 9am") |
| schedule_type | string | N/A | Enum: one_time, recurring (for 6I-A: one_time only) |
| scheduled_date_time | date-time | N/A | For one_time: when to run. For recurring: first run time. |
| recurrence_pattern | string | N/A | For future 6I-B: daily, weekly, monthly, cron expression. Null for one_time. |
| recurrence_end_date | date-time | N/A | For recurring: when schedule ends (optional, null = no end) |
| status | string | N/A | Enum: pending, active, paused, cancelled, completed |
| delivery_method | string | N/A | For future: email, webhook, ftp. For 6I-A: null or "manual_download_only" |
| delivery_recipients | array | N/A | For future use; null for 6I-A |
| created_date | date-time | N/A | Auto-generated |
| updated_date | date-time | N/A | Auto-updated |

**Audit Fields:**  
- created_by, created_date (auto)
- updated_date (auto)

**Security Considerations:**
- Only MGA admin or Broker/Agency manager can create schedules
- Schedule ownership limits who can edit/cancel
- Permission recheck before execution (Gate 6I-B)
- Scope enforcement prevents cross-MGA schedule visibility

#### Entity: MGAReportScheduleRun (Optional for 6I-A, Required for 6I-B)

**Purpose:**  
Track each execution of a scheduled or manual report.

**Status for 6I-A:** DEFERRED  
Reason: No execution in 6I-A. Add when Gate 6I-B scheduler execution is designed.

**Future Design Note (for 6I-B):**
- run_id, schedule_id, template_id
- run_status (pending, running, completed, failed)
- run_start_time, run_end_time, duration
- export_generated_id (FK to gate 6C export record)
- error_message (if failed)

### Data Model Recommendation

**Gate 6I-A Implementation:**
- ✅ Create MGAReportTemplate entity
- ✅ Create MGAReportSchedule entity
- ⏸️ Defer MGAReportScheduleRun until 6I-B scheduler execution design

---

## 5. Permission Model Assessment

### Proposed Permissions

#### New Granular Permissions (Gate 6I)

| Permission | Domain | Action | Default Allowed Roles | Notes |
|-----------|--------|--------|----------------------|-------|
| `mga.reports.templates.view` | reports | templates / view | platform_super_admin, mga_admin, mga_manager | View own + team templates |
| `mga.reports.templates.create` | reports | templates / create | platform_super_admin, mga_admin | Create templates for own MGA |
| `mga.reports.templates.manage` | reports | templates / manage | platform_super_admin, mga_admin | Edit, archive own templates |
| `mga.reports.schedules.view` | reports | schedules / view | platform_super_admin, mga_admin, mga_manager | View own + team schedules |
| `mga.reports.schedules.create` | reports | schedules / create | platform_super_admin, mga_admin | Create one-time or recurring schedules |
| `mga.reports.schedules.manage` | reports | schedules / manage | platform_super_admin, mga_admin | Edit, pause, cancel schedules |
| `mga.reports.schedules.execute_manual` | reports | schedules / execute_manual | platform_super_admin, mga_admin | Run template now (manual override) |
| `mga.reports.schedules.audit` | reports | schedules / audit | platform_super_admin, mga_admin, mga_manager | View schedule execution history |

#### Permission Matrix Integration

Add to `lib/mga/permissionResolver.js`:

```javascript
reports: {
  templates: {
    view:     { platform_super_admin: A, mga_admin: A, mga_manager: A, mga_user: D, ... },
    create:   { platform_super_admin: A, mga_admin: A, mga_manager: D, mga_user: D, ... },
    manage:   { platform_super_admin: A, mga_admin: A, mga_manager: D, mga_user: D, ... },
  },
  schedules: {
    view:            { platform_super_admin: A, mga_admin: A, mga_manager: A, mga_user: D, ... },
    create:          { platform_super_admin: A, mga_admin: A, mga_manager: D, mga_user: D, ... },
    manage:          { platform_super_admin: A, mga_admin: A, mga_manager: D, mga_user: D, ... },
    execute_manual:  { platform_super_admin: A, mga_admin: A, mga_manager: D, mga_user: D, ... },
    audit:           { platform_super_admin: A, mga_admin: A, mga_manager: A, mga_user: D, ... },
  }
}
```

### Restrictive by Default

- Template creation restricted to mga_admin only (MGA-level admins create shared templates)
- Schedule creation restricted to mga_admin only
- Template/schedule view: mga_admin + mga_manager (supervisors)
- Permission enforcement at design time and execution time

---

## 6. Scope / Security Assessment

### Scope Boundaries to Enforce

1. **MGA Boundary**
   - User can only view/create/manage templates for their assigned MGA
   - Templates from other MGAs are not visible
   - scopeGate enforces MGA check

2. **Broker / Agency Boundary** (if using master_group_id)
   - Templates scoped to Broker/Agency are only visible to that Broker/Agency
   - Cross-Broker/Agency access is blocked
   - Master_group_id must match user's assigned scope

3. **Tenant Boundary**
   - If tenant_id is used elsewhere in the system, enforce per-tenant isolation
   - Templates do not leak across tenants

4. **Report Export Permission Compatibility**
   - User must have permission for underlying report type (cases, quotes, census, etc.)
   - Template cannot be executed if user loses permission to filtered entity type
   - Recheck permissions at execution time (Gate 6I-B)

### Key Security Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Cross-MGA template visibility | HIGH | scopeGate check on create/view; master_general_agent_id enforcement |
| Cross-tenant template reuse | HIGH | tenant_id in template; fail-closed if null mismatch |
| Unauthorized template execution | HIGH | Permission recheck at execution time (6I-B) |
| Template exposing restricted filters | MEDIUM | Safe payload policy: audit filter contents; block sensitive columns |
| Schedule running after permission revoked | MEDIUM | Scope recheck + permission recheck at run time (6I-B) |
| Stale schedule after Broker/Agency deactivation | MEDIUM | Schedule status = cancelled if Broker/Agency becomes inactive |
| Duplicate scheduled runs | MEDIUM | Idempotency key per run; unique constraint on (schedule_id, scheduled_date_time) |
| Template name injection / XSS | LOW | Sanitize template_name in UI; store as plain text in DB |

### Fail-Closed Behavior

- Undefined permission = DENY
- Scope mismatch = NOT_FOUND (masked as not found, not "access denied")
- Missing template = 404
- Missing schedule = 404
- Invalid recurrence pattern = validation error, not silent fail

---

## 7. Scheduler / Job Design Assessment

### Gate 6I-A: Template + Schedule Definition (Manual Execution)

**Design Decision: No Recurring Execution in 6I-A**

Gate 6I-A focuses on *defining* schedules, not executing them. Manual "run now" is supported for one-time runs.

**One-Time Schedule Flow (6I-A):**

```
User creates MGAReportSchedule:
  - schedule_type = "one_time"
  - scheduled_date_time = future timestamp
  - status = "pending"
  - recurrence_pattern = null

UI allows:
  - "Run Now" button (manual execution, override scheduled time)
  - "View Schedule Status" (pending, completed, or last run if already executed)

Actual execution triggered by:
  - Manual "Run Now" click → immediate backend call to Gate 6C export service
  - [Future 6I-B] Scheduled job execution at scheduled_date_time
```

**Idempotency & Run Tracking (6I-A Basis; 6I-B Implementation):**

For manual runs:
- Generate idempotency_key = `schedule_id:timestamp:user_email`
- Call Gate 6C export service with this key
- Log result to audit trail

For future scheduled runs (6I-B):
- Create MGAReportScheduleRun record before execution
- Set run_status = "pending"
- Execute Gate 6C export with idempotency key
- Update run_status = "completed" or "failed"
- Link to export record (FK)

### Recommended Scheduler Architecture (for 6I-B, not 6I-A)

**Execution Model:** Message-queue-based (not in-process cron)
- Benefits: fail-safe, observable, retryable, auditable
- Examples: Deno KV with poll, external job queue, or scheduled automation platform

**Permission Recheck at Execution:**
```
At scheduled run time:
  1. Load schedule record
  2. Verify schedule status = "active" (not "paused" or "cancelled")
  3. Load template record
  4. Verify template status = "active"
  5. Recheck user (created_by) still has permission to create export (via Gate 6C)
  6. Recheck user's MGA/Broker/Agency scope still valid
  7. If any check fails: mark run as "failed", log reason, send alert
  8. If all pass: call Gate 6C export service
```

### Risk: Duplicate Runs

**Prevention:**
- Unique constraint: `(schedule_id, scheduled_date_time)` — one run per schedule per time slot
- Idempotency key: `schedule_id:timestamp:user_email:attempt_id`
- If retry: use same idempotency key, Gate 6C deduplicates

**Status Tracking:**
- Status = "pending" → "running" → "completed" | "failed" | "retrying"

---

## 8. UI / UX Assessment

### Proposed UI Components (Gate 6I-A & Future)

#### 1. Saved Templates Tab (Broker/Agency Detail Drawer or Reports Page)

**Scope:** In Broker/Agency detail view, add tab for "Report Templates"

**Components:**
- Template list: name, report_type, created_by, last_used
- Create template button → modal
- Edit template → modal
- Archive template → confirmation
- Use template → runs report with saved filters

**Gate 6I-A Status:** RECOMMENDED

#### 2. Create / Edit Template Modal

**Fields:**
- Template name (required)
- Description (optional)
- Report type (enum: cases, quotes, census, etc.)
- Export format (enum: pdf, csv, xlsx)
- Filters (reuse existing Gate 6C filter UI)
- Is public checkbox
- Save button, Cancel button

**Gate 6I-A Status:** RECOMMENDED

#### 3. Schedule Report Modal

**Fields (6I-A):**
- Select template (dropdown)
- Schedule type: One-time (only option in 6I-A)
- Scheduled date & time
- Schedule name (optional)
- Save button

**Fields (6I-B future):**
- Recurrence: daily / weekly / monthly / custom cron
- Recurrence end date (optional)
- Delivery method: email / webhook / etc.
- Recipients: email list, user list, etc.

**Gate 6I-A Status:** RECOMMENDED (basic version, defer delivery)

#### 4. Schedule List Panel

**Display:**
- Schedule name
- Template name
- Schedule type (one-time / recurring)
- Status (pending / active / completed / paused / cancelled)
- Next run / Last run (if applicable)
- Edit, pause, cancel buttons
- View run history link

**Gate 6I-A Status:** RECOMMENDED

#### 5. Run History Link

**Integrates with Gate 6D — Export Delivery History & Tracking**

- Click "View History" on schedule → link to Gate 6D export history filtered by schedule_id
- Shows past runs, status, download links (if available)

**Gate 6I-A Status:** RECOMMENDED

---

## 9. Integration With Existing Gates

### Dependency Analysis

| Gate | Integration Point | 6I-A Impact | Notes |
|------|-------------------|-------------|-------|
| Gate 6C | Export generation service | HIGH | Gate 6I calls Gate 6C export service to generate reports. No change to 6C. |
| Gate 6D | Export history tracking | HIGH | Manual and scheduled runs logged to Gate 6D history. No change to 6D. |
| Gate 6G | Report export UI surface | MEDIUM | 6I adds "Save as Template" option to export dialog. UI surface remains active. |
| Gate 6L-A | Broker/Agency settings | LOW | 6L-A settings (notification prefs, defaults) may influence future 6I-B delivery. No block in 6I-A. |
| Gate 6H | Broker/Agency lifecycle | MEDIUM | If Broker/Agency becomes inactive, its schedules should be paused. Status check at run time. |
| Gate 6L-B | Document management | NONE | 6I does not create, store, or manage documents. Explicit deferral. |

### No Changes to Existing Gates

✅ Gate 6C — Report export service unchanged  
✅ Gate 6D — Export history tracking unchanged  
✅ Gate 6G — Report export UI surface unchanged  
✅ Gate 6L-A — Broker/Agency contacts + settings unchanged  
✅ Gate 6H — Broker/Agency lifecycle unchanged  
✅ Gates 6A–6B — User mgmt unchanged  

---

## 10. Validation Requirements

### Test Matrix for Gate 6I-A (Template + Schedule Definition)

#### Authorization & Permission Tests
- [ ] User can create template for own MGA ✅
- [ ] User cannot create template for other MGA ❌
- [ ] User cannot view template from other MGA ❌
- [ ] MGA admin can view all MGA templates ✅
- [ ] MGA manager can view MGA templates ✅
- [ ] MGA user cannot create/edit templates ❌
- [ ] MGA read-only cannot create/edit templates ❌

#### Scope & Data Isolation Tests
- [ ] Template master_general_agent_id set correctly ✅
- [ ] Template master_group_id set correctly (if Broker/Agency-level) ✅
- [ ] Schedule master_general_agent_id set correctly ✅
- [ ] Cross-MGA template list filtered correctly ✅
- [ ] Cross-Broker/Agency template list filtered correctly ✅

#### Data Model Tests
- [ ] MGAReportTemplate entity created successfully ✅
- [ ] MGAReportTemplate required fields validated ✅
- [ ] MGAReportTemplate filters stored as JSON ✅
- [ ] MGAReportSchedule entity created successfully ✅
- [ ] MGAReportSchedule one-time schedule stored ✅
- [ ] MGAReportSchedule status transitions correct ✅

#### Manual Execution Tests
- [ ] "Run Now" from template generates export ✅
- [ ] "Run Now" calls Gate 6C export service ✅
- [ ] Export result logged to Gate 6D history ✅
- [ ] Idempotency prevents duplicate exports ✅
- [ ] Run failure logged with error message ✅

#### Audit & Compliance Tests
- [ ] Template create event logged ✅
- [ ] Template edit event logged ✅
- [ ] Template archive event logged ✅
- [ ] Schedule create event logged ✅
- [ ] Schedule run event logged ✅
- [ ] Audit trail includes creator email, timestamp ✅

#### Regression Tests
- [ ] Gate 6C export still functions ✅
- [ ] Gate 6D history still tracks exports ✅
- [ ] Gate 6G export button still visible ✅
- [ ] Gate 6L-A contacts + settings still functional ✅
- [ ] Gate 6H Broker/Agency lifecycle unaffected ✅
- [ ] Gates 6A–6B user management unaffected ✅

#### Build & Quality Tests
- [ ] Build passes (npm run build) ✅
- [ ] Lint passes (eslint) ✅
- [ ] Tests pass (Jest) ✅
- [ ] Registry JSON valid and parseable ✅
- [ ] No console warnings/errors ✅

---

## 11. Risk Assessment

### Risk Scoring

| Component | Risk Level | Rationale | Mitigation |
|-----------|-----------|-----------|-----------|
| **Saved Templates** | LOW | Simple CRUD; no execution. Permissions enforced. | scopeGate, permissionResolver |
| **Manual Scheduled Run** | LOW | One-time, user-initiated. No background job. | Manual trigger only; call Gate 6C directly |
| **One-Time Schedule Definition** | LOW | Definition only; no execution in 6I-A. | Defer execution to 6I-B |
| **Recurring Schedule Definition** | MEDIUM | Complex recurrence logic. Deferred to 6I-B. | Separate design phase; operator approval required |
| **Scheduler Execution (6I-B)** | HIGH | Background jobs, permission recheck, failure handling. | Gate 6I-B design phase required |
| **Permission Model** | LOW | Restrictive by default; no permission broadening. | Fail-closed; deny undefined |
| **Scope Enforcement** | LOW | MGA and Broker/Agency boundaries. Proven pattern from Gates 6A–6H. | scopeGate integration; test cross-MGA access |
| **Schema Impact** | LOW | New entities (template, schedule); no migration of existing data. | Backward-compatible; no schema change to existing entities |
| **UI Complexity** | LOW | Reuse existing filter UI from Gate 6C. | Component-based; incremental testing |

### Risk Summary

**Overall Risk Profile: LOW → MEDIUM**

- **6I-A (Template + Definition):** LOW risk — straightforward CRUD, no execution
- **6I-B (Recurring Execution):** MEDIUM risk — requires scheduler safety design

---

## 12. Recommendation

### Recommendation: **PROCEED WITH SPLIT**

**Path Forward:**

1. **Gate 6I-A: Saved Report Templates + Manual Scheduled Run**
   - ✅ Create MGAReportTemplate entity
   - ✅ Create MGAReportSchedule entity (one-time only)
   - ✅ Add template/schedule management permissions
   - ✅ Build template creation/edit UI
   - ✅ Implement "Run Now" manual execution
   - ✅ Log runs to Gate 6D history
   - ✅ Add schedule list + management UI
   - Timeline: 2–3 weeks design + implementation

2. **Gate 6I-B: Recurring Scheduler Execution (Deferred)**
   - ⏸️ Defer until separate scheduler safety design
   - Requires: message queue architecture, permission recheck at run time, failure recovery
   - Operator approval required before starting 6I-B
   - Timeline: Post-6I-A, requires scheduler design phase

### Next Document

**Recommended:** Gate 6I-A Design Specification (detailed UI mockups, entity schema, permission matrix, test plan)

### Implementation Timeline (Estimate)

- Gate 6I-A Design: 1–2 weeks
- Gate 6I-A Implementation: 2–3 weeks
- Gate 6I-A Validation: 1 week
- Gate 6I-B Design (separate phase): 1–2 weeks

### Guardrails (Final)

🔒 Do not implement Gate 6I-B recurring execution in Gate 6I-A  
🔒 Do not expose external delivery mechanisms (email, webhook)  
🔒 Do not expose signed URLs or private file URIs  
🔒 Do not create document-management functionality  
🔒 Do not rename MasterGroup or master_group_id  
🔒 Do not broaden permissions beyond mga_admin + platform_super_admin  
🔒 Do not weaken scopeGate, scopeResolver, or permissionResolver  
🔒 Do not modify Gates 6A–6H or Gate 6L-A  
🔒 Do not open Gate 6L-B documents  

---

## Appendix: Entity Schema Draft (Reference Only)

### MGAReportTemplate (JSON Schema)

```json
{
  "name": "MGAReportTemplate",
  "type": "object",
  "properties": {
    "master_general_agent_id": {
      "type": "string",
      "description": "Parent MGA scope"
    },
    "master_group_id": {
      "type": "string",
      "description": "Optional Broker/Agency scope; null for MGA-level template"
    },
    "created_by": {
      "type": "string",
      "description": "Email of template creator"
    },
    "template_name": {
      "type": "string",
      "description": "User-friendly template name"
    },
    "description": {
      "type": "string",
      "description": "Template purpose and notes"
    },
    "report_type": {
      "type": "string",
      "enum": ["cases", "quotes", "census", "enrollment", "renewals", "proposals"]
    },
    "export_format": {
      "type": "string",
      "enum": ["pdf", "csv", "xlsx"],
      "default": "pdf"
    },
    "filters": {
      "type": "object",
      "description": "Saved filter JSON from Gate 6C"
    },
    "is_public": {
      "type": "boolean",
      "default": false,
      "description": "If true, visible to all in same MGA/Broker/Agency"
    },
    "status": {
      "type": "string",
      "enum": ["active", "archived"],
      "default": "active"
    },
    "mga_migration_batch_id": {
      "type": "string",
      "description": "Phase 4 migration batch tracking"
    },
    "mga_migration_status": {
      "type": "string",
      "enum": ["not_migrated", "migrated", "validated", "anomaly", "quarantined"],
      "default": "not_migrated"
    }
  },
  "required": ["master_general_agent_id", "created_by", "template_name", "report_type"]
}
```

### MGAReportSchedule (JSON Schema)

```json
{
  "name": "MGAReportSchedule",
  "type": "object",
  "properties": {
    "master_general_agent_id": {
      "type": "string",
      "description": "Parent MGA scope"
    },
    "master_group_id": {
      "type": "string",
      "description": "Optional Broker/Agency scope; null for MGA-level schedule"
    },
    "template_id": {
      "type": "string",
      "description": "FK to MGAReportTemplate"
    },
    "created_by": {
      "type": "string",
      "description": "Email of schedule owner"
    },
    "schedule_name": {
      "type": "string",
      "description": "User-friendly schedule name"
    },
    "schedule_type": {
      "type": "string",
      "enum": ["one_time"],
      "description": "For 6I-A: one_time only. For 6I-B: add 'recurring'"
    },
    "scheduled_date_time": {
      "type": "string",
      "format": "date-time",
      "description": "When to run the report"
    },
    "recurrence_pattern": {
      "type": "string",
      "description": "For future 6I-B use; null for one_time"
    },
    "recurrence_end_date": {
      "type": "string",
      "format": "date-time",
      "description": "For future 6I-B use; when recurring schedule ends"
    },
    "status": {
      "type": "string",
      "enum": ["pending", "active", "paused", "cancelled", "completed"],
      "default": "pending"
    },
    "delivery_method": {
      "type": "string",
      "description": "For future 6I-B use; null for 6I-A (manual download only)"
    },
    "mga_migration_batch_id": {
      "type": "string"
    },
    "mga_migration_status": {
      "type": "string",
      "enum": ["not_migrated", "migrated", "validated", "anomaly", "quarantined"],
      "default": "not_migrated"
    }
  },
  "required": ["master_general_agent_id", "template_id", "created_by", "schedule_name", "schedule_type", "scheduled_date_time"]
}
```

---

## Summary

**Gate 6I Status:** DISCOVERY_PREFLIGHT  
**Recommendation:** PROCEED WITH SPLIT (Gate 6I-A + defer 6I-B)  
**Next Step:** Gate 6I-A Design Specification document  
**Guardrails:** All maintained; no runtime changes yet  
**Operator Approval:** Required before Gate 6I-A implementation begins  

---

*Discovery Preflight completed 2026-05-12*  
*Awaiting operator approval and design phase authorization.*