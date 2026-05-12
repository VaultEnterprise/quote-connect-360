# MGA Gate 6I-A Implementation Work Order
## Saved Report Templates and Schedule Definitions

**Document Version:** 1.0  
**Date Created:** 2026-05-12  
**Status:** IMPLEMENTATION_WORK_ORDER_COMPLETE  
**Phase:** Work Planning (Pre-Implementation)  
**Implementation Status:** NOT_STARTED  
**Runtime Changes:** NONE  
**Parent Gate:** Gate 6I  
**Design Specification Reference:** docs/MGA_GATE_6I_A_SAVED_REPORT_TEMPLATES_SCHEDULE_DEFINITIONS_DESIGN_SPECIFICATION.md  

---

## 1. Implementation Objective

Enable MGA administrators and Broker/Agency managers to:
1. Create and manage reusable report templates (saved filter sets with format defaults)
2. Define one-time or recurring schedule metadata for report generation
3. Manually trigger ("Run Now") saved reports immediately
4. View schedule execution history linked to Gate 6D export history
5. Maintain audit trail for all template and schedule operations
6. Enforce MGA and Broker/Agency scope boundaries
7. Restrict template/schedule access via permission matrix

**Out of Scope (Gate 6I-B):**
- Automated recurring job execution
- Scheduled delivery (email, webhook)
- Background scheduler runtime
- Retry/failure recovery at scheduler level

---

## 2. Approved Gate 6I-A Scope

### Approved Capabilities

✅ **Saved Report Templates**
- Create templates with: name, description, report_type, export_format, filters, is_public flag
- Edit template fields
- Archive templates (soft delete)
- View template list (filtered by MGA/Broker/Agency scope)
- Clone template
- Audit all template operations

✅ **Schedule Definitions**
- Create one-time schedule with: name, template_id, scheduled_date_time, timezone
- Define schedule status: draft → active → paused / cancelled
- Pause/resume/cancel schedules
- Manual execution via "Run Now" button (calls Gate 6C export service)
- View schedule list (filtered by MGA/Broker/Agency scope)
- Audit all schedule operations

✅ **Filter Safety**
- Validate filters against whitelist (allowed filter types)
- Reject blacklisted filters (tokens, signed URLs, PII)
- Store filters as JSON on template

✅ **Integration with Existing Gates**
- Call Gate 6C export service for manual report generation
- Log runs to Gate 6D export history
- Add "Save as Template" option to Gate 6G export dialog
- Enforce Gate 6C export permissions (user must have permission for underlying report type)

✅ **Scope Enforcement**
- MGA boundary: user can only access templates/schedules within their MGA scope
- Broker/Agency boundary: if schedule/template scoped to Broker/Agency, only that Broker/Agency can access
- Tenant boundary (if applicable): enforce per-tenant isolation
- Fail-closed: deny on scope mismatch, return 404 (not "access denied")

✅ **Permissions**
- mga.reports.templates.view (mga_admin, mga_manager)
- mga.reports.templates.manage (mga_admin only)
- mga.reports.schedules.view (mga_admin, mga_manager)
- mga.reports.schedules.manage (mga_admin only)
- mga.reports.schedules.execute_manual (mga_admin only)
- mga.reports.schedules.audit (mga_admin, mga_manager)

✅ **Audit Trail**
- Log template create/update/archive events
- Log schedule create/update/activate/pause/cancel/execute events
- Log permission denied and scope denied events
- Include: actor email, actor role, timestamp, outcome, detail

---

## 3. Deferred Gate 6I-B Scheduler Execution Scope

### Explicitly Deferred to Gate 6I-B

⏸️ **Recurring Scheduler Execution**
- Cron-style schedule patterns (daily, weekly, monthly, custom cron)
- Automated job triggering at scheduled time
- Background job queue management
- Job status: pending → running → completed / failed / retrying
- Retry logic and failure recovery

⏸️ **Automated Delivery Mechanisms**
- Email delivery integration
- Webhook/HTTP delivery integration
- FTP/SFTP delivery integration
- Bulk scheduled exports

⏸️ **Scheduler Runtime Safety**
- Permission recheck at execution time (to prevent execution if user loses permission)
- Scope recheck at execution time (to prevent execution if scope becomes invalid)
- Idempotency key management per scheduled run
- Run state tracking (MGAReportScheduleRun entity implementation)

⏸️ **Scheduler Execution Failure Handling**
- Retry policy (exponential backoff, max retries)
- Dead letter queue for failed runs
- Failure notifications to schedule owner
- Operator dashboard for failed executions

**Reason for Deferral:**  
Scheduler execution requires message queue infrastructure, safety mechanisms (permission/scope recheck at run time), and delivery system design that are beyond the scope of template definition. These topics warrant separate security review and operator approval.

---

## 4. Files Authorized for Future Change

### Will Be Created (New Files)

| File Path | Purpose | Type |
|-----------|---------|------|
| `src/entities/MGAReportTemplate.json` | Template entity schema | Entity definition |
| `src/entities/MGAReportSchedule.json` | Schedule entity schema | Entity definition |
| `lib/mga/services/reportTemplateService.js` | Template/schedule CRUD service | Backend service |
| `components/mga/MGAReportTemplatesPanel.jsx` | Template list UI container | React component |
| `components/mga/MGAReportTemplateModal.jsx` | Create/edit template modal | React component |
| `components/mga/MGAReportSchedulePanel.jsx` | Schedule list UI container | React component |
| `components/mga/MGAReportScheduleModal.jsx` | Create/edit schedule modal | React component |
| `components/mga/MGAReportScheduleStatusBadge.jsx` | Status indicator component | React component |
| `tests/mga/gate6i-a-saved-report-templates-schedule-definitions.test.js` | Unit + integration tests | Test suite |

### Will Be Modified (Existing Files)

| File Path | Changes | Rationale |
|-----------|---------|-----------|
| `lib/mga/permissionResolver.js` | Add `reports` domain with 7 granular permissions | Permission matrix integration |
| `components/mga/MGABrokerAgencyDetailDrawer.jsx` | Add new tab "Report Templates & Schedules" with panel mounts | UI surface integration |
| `components/mga/MGACaseWorkflowPanel.jsx` | Add "Save as Template" button to export options | Gate 6G integration point |
| `docs/QUOTE_CONNECT_360_GATE_REGISTRY.json` | Update Gate 6I-A and 6I-B entries | Registry tracking |
| `docs/MGA_GATE_STATUS_LEDGER.md` | Add Gate 6I-A activation notes and test results | Ledger tracking |

---

## 5. Files Protected from Change

### Will NOT Be Modified (Off-Limits)

❌ **Gates 6A–6H** (production-ready, closed gates)
- No changes to user management (Gate 6A)
- No changes to TXQuote transmit (Gate 6B)
- No changes to report export service (Gate 6C)
- No changes to export history (Gate 6D)
- No changes to Broker/Agency creation (Gate 6E)
- No changes to Broker/Agency invite subscope (Gate 6F)
- No changes to report export UI surface (Gate 6G)
- No changes to Broker/Agency lifecycle (Gate 6H)

❌ **Gate 6L-A** (active, validation passing)
- No changes to Broker/Agency contacts
- No changes to Broker/Agency settings
- No changes to internal notes

❌ **Core Schema** (architectural integrity)
- No rename of MasterGroup entity
- No rename of master_group_id field
- No changes to tenant/MGA boundary enforcement

❌ **Security Layers** (fail-closed enforcement)
- No weakening of scopeGate enforcement
- No weakening of scopeResolver
- No weakening of permissionResolver
- No permission broadening beyond approved roles

---

## 6. Data Model / Storage Approach

### MGAReportTemplate Entity

**Location:** `src/entities/MGAReportTemplate.json`

**Fields (14 total):**
1. `master_general_agent_id` (string, required, scope field)
2. `master_group_id` (string, optional, scope field)
3. `tenant_id` (string, optional, scope field)
4. `template_name` (string, required, max 255 chars)
5. `description` (string, optional, max 1000 chars)
6. `report_type` (string, enum: cases/quotes/census/enrollment/renewals/proposals, required)
7. `export_format` (string, enum: pdf/csv/xlsx, required, default pdf)
8. `filters_json` (object, optional, must pass filter safety validation)
9. `is_public` (boolean, required, default false)
10. `status` (string, enum: active/inactive/archived, required, default active)
11. `created_by` (string, required, audit field)
12. `owner_user_id` (string, optional, audit field)
13. `mga_migration_batch_id` (string, optional, migration tracking)
14. `mga_migration_status` (string, enum: not_migrated/migrated/validated/anomaly/quarantined, default not_migrated)

**Built-in Auto-Generated Fields:**
- id (auto)
- created_date (auto)
- updated_date (auto)

**Storage Approach:**
- Store as JSON schema entity (Base44 native storage)
- filters_json stored as embedded object (no separate table)
- Indexing: master_general_agent_id, master_group_id, report_type, status (for filtering performance)
- No sharding; templates are metadata-only (small documents)

---

### MGAReportSchedule Entity

**Location:** `src/entities/MGAReportSchedule.json`

**Fields (17 total):**
1. `master_general_agent_id` (string, required, scope field)
2. `master_group_id` (string, optional, scope field)
3. `tenant_id` (string, optional, scope field)
4. `template_id` (string, required, FK to MGAReportTemplate)
5. `schedule_name` (string, required, max 255 chars)
6. `schedule_type` (string, enum: one_time [only for 6I-A], required)
7. `frequency` (string, optional, reserved for 6I-B; null for 6I-A)
8. `timezone` (string, optional, IANA timezone, default UTC)
9. `scheduled_date_time` (date-time, required)
10. `recurrence_end_date` (date-time, optional, reserved for 6I-B; null for 6I-A)
11. `next_run_at` (date-time, calculated, same as scheduled_date_time for one_time)
12. `last_run_at` (date-time, optional, null until first execution)
13. `status` (string, enum: draft/active/paused/cancelled, required, default draft)
14. `created_by` (string, required, audit field)
15. `owner_user_id` (string, optional, audit field)
16. `mga_migration_batch_id` (string, optional, migration tracking)
17. `mga_migration_status` (string, enum: not_migrated/migrated/validated/anomaly/quarantined, default not_migrated)

**Built-in Auto-Generated Fields:**
- id (auto)
- created_date (auto)
- updated_date (auto)

**Storage Approach:**
- Store as JSON schema entity (Base44 native storage)
- Indexing: master_general_agent_id, master_group_id, template_id, status, scheduled_date_time (for filtering + run lookups)
- No sharding; schedules are metadata-only
- Soft delete: status = cancelled (no hard delete)

**Design Notes:**
- schedule_type = one_time for Gate 6I-A; frequency/recurrence_end_date reserved for 6I-B (leave null in 6I-A)
- next_run_at = scheduled_date_time for one_time (calculated, not user-settable)
- Status transitions: draft → active → paused/cancelled (no forward transitions)

---

## 7. Permission Model

### Granular Permissions (7 total)

**Domain:** `reports`

| Permission | Allowed Roles | Operation | Enforced By |
|-----------|---------------|-----------|------------|
| `mga.reports.templates.view` | platform_super_admin, mga_admin, mga_manager | List/read templates | permissionResolver + scopeGate |
| `mga.reports.templates.manage` | platform_super_admin, mga_admin | Create/edit/archive templates | permissionResolver + scopeGate |
| `mga.reports.schedules.view` | platform_super_admin, mga_admin, mga_manager | List/read schedules | permissionResolver + scopeGate |
| `mga.reports.schedules.manage` | platform_super_admin, mga_admin | Create/edit/pause/cancel schedules | permissionResolver + scopeGate |
| `mga.reports.schedules.execute_manual` | platform_super_admin, mga_admin | Run schedule immediately (Run Now) | permissionResolver + scopeGate |
| `mga.reports.schedules.audit` | platform_super_admin, mga_admin, mga_manager | View schedule audit trail | permissionResolver + scopeGate |

### Permission Matrix Update

**File to Modify:** `lib/mga/permissionResolver.js`

**Addition:**
```javascript
reports: {
  templates: {
    view:    { platform_super_admin: A, mga_admin: A, mga_manager: A, mga_user: D, mga_read_only: D, ... },
    manage:  { platform_super_admin: A, mga_admin: A, mga_manager: D, mga_user: D, mga_read_only: D, ... },
  },
  schedules: {
    view:            { platform_super_admin: A, mga_admin: A, mga_manager: A, mga_user: D, mga_read_only: D, ... },
    manage:          { platform_super_admin: A, mga_admin: A, mga_manager: D, mga_user: D, mga_read_only: D, ... },
    execute_manual:  { platform_super_admin: A, mga_admin: A, mga_manager: D, mga_user: D, mga_read_only: D, ... },
    audit:           { platform_super_admin: A, mga_admin: A, mga_manager: A, mga_user: D, mga_read_only: D, ... },
  }
}
```

### Design Principle: Restrictive by Default

- No template/schedule creation by mga_manager or mga_user
- View only: mga_admin + mga_manager (supervisors)
- Manual execution: mga_admin only (prevents accidental report triggers)
- Audit view: mga_admin + mga_manager (supervisors need visibility)

---

## 8. ScopeGate / Security Model

### Scope Enforcement Points

**Every API call to reportTemplateService enforces:**

1. **MGA Boundary Check**
   - `scopeGate.checkScope(user, 'reports', 'templates.view', MGAReportTemplate, template_id)`
   - Verifies `user.master_general_agent_id === template.master_general_agent_id`
   - If mismatch: return 404 (masked as not found, not "access denied")

2. **Broker/Agency Boundary Check (if applicable)**
   - If `template.master_group_id` is set, verify:
     - `user.master_group_id === template.master_group_id` OR
     - `user.role === 'mga_admin'` (admin sees all in MGA)
   - If mismatch: return 404

3. **Tenant Boundary Check (if applicable)**
   - If `template.tenant_id` is set, verify user has access to that tenant
   - If mismatch: return 404

4. **Permission Check**
   - `permissionResolver.check(user.role, 'reports', 'templates.view')`
   - If DENY: return 403 Forbidden

5. **Report Type Permission Compatibility**
   - User must have Gate 6C export permission for underlying `report_type`
   - Checked at template creation + at Run Now time
   - If missing: return 403 Forbidden

### Fail-Closed Behavior

- Undefined permission = DENY (not ALLOW)
- Scope mismatch = 404 (information hiding)
- Missing permission = 403 Forbidden
- Invalid filters = 400 Bad Request (validation error)
- Execution without permission = denied with error message (audit logged)

### Stale Scope Handling (Gate 6H Integration)

- If Broker/Agency becomes inactive (status = inactive), cascade update schedules scoped to it:
  - `UPDATE MGAReportSchedule SET status = 'cancelled' WHERE master_group_id = deactivated_broker_agency_id`
  - Prevents execution after deactivation

---

## 9. Filter Safety Policy

### Filter Validation (At Create / Update Time)

**Whitelist Approach:**
- Filters must match Gate 6C filter schema (status, date range, ownership, entity reference, numeric, enum, search filters)
- Validate against whitelist; reject if not in whitelist

**Blacklist Enforcement:**
- Reject any filter containing:
  - `signed_url`, `private_file_uri`, `download_token` (file/URL)
  - `user_auth_token`, `session_id`, `api_key`, `oauth_token`, `refresh_token` (auth)
  - `ssn`, `credit_card`, `tax_id_ein`, `bank_account`, `unredacted_address`, `unredacted_phone` (PII)
  - `internal_system_flag`, `database_migration_state`, `feature_flag_override`, `config_override` (backend-only)
  - `error_stack_trace`, `debug_log`, `internal_error_message` (debugging)

**Validation Logic (Pseudocode):**
```javascript
function validateFilters(filters_json) {
  const BLACKLIST = ['signed_url', 'private_file_uri', 'user_auth_token', ...];
  for (let key in filters_json) {
    if (BLACKLIST.includes(key)) throw new Error(`Restricted filter: ${key}`);
    if (!isAllowedType(filters_json[key])) throw new Error(`Invalid type for ${key}`);
  }
  return true;
}

function isAllowedType(value) {
  return typeof value === 'string' || typeof value === 'number' || 
         typeof value === 'boolean' || value instanceof Date ||
         (Array.isArray(value) && value.every(v => isAllowedType(v)));
}
```

**Error Handling:**
- If filter validation fails: return 400 Bad Request with detailed error message
- Include blacklist rule that was violated
- Do not allow template creation with invalid filters

---

## 10. Backend Service Actions

### Service File: `lib/mga/services/reportTemplateService.js`

**8 Core Methods (CRUD + Execute):**

#### 1. `listReportTemplates(request)`
- Query: `MGAReportTemplate.filter({ master_general_agent_id: user.mga_scope })`
- Enforces: permissionResolver + scopeGate
- Returns: array of templates
- Audit: optional (reduces noise; skip for list operations)

#### 2. `createReportTemplate(request)`
- Validates: template_name, report_type required
- Validates: filters_json against safety policy
- Creates: new MGAReportTemplate with status = active
- Enforces: permission (mga.reports.templates.manage)
- Returns: created template
- Audit: `report_template_created` event

#### 3. `getReportTemplateDetail(request)`
- Query: `MGAReportTemplate.get(template_id)`
- Enforces: permissionResolver + scopeGate
- Returns: template record
- Audit: optional

#### 4. `updateReportTemplate(request)`
- Validates: filters_json if provided
- Updates: template fields (name, description, filters, format, is_public, status)
- Enforces: permission (mga.reports.templates.manage)
- Returns: updated template
- Audit: `report_template_updated` event

#### 5. `archiveReportTemplate(request)`
- Enforces: permission (mga.reports.templates.manage)
- Sets: status = archived
- Returns: updated template
- Audit: `report_template_archived` event
- Effect: Template hidden from list, cannot create new schedules

#### 6. `listReportSchedules(request)`
- Query: `MGAReportSchedule.filter({ master_general_agent_id: user.mga_scope })`
- Enforces: permissionResolver + scopeGate
- Returns: array of schedules
- Audit: optional

#### 7. `createReportScheduleDefinition(request)`
- Validates: template_id, schedule_name, scheduled_date_time required
- Validates: template_id exists and is accessible
- Validates: scheduled_date_time is future
- Creates: new MGAReportSchedule with status = draft
- Enforces: permission (mga.reports.schedules.manage)
- Returns: created schedule
- Audit: `report_schedule_created` event

#### 8. `executeScheduleManual(request)`
- Enforces: permission (mga.reports.schedules.execute_manual)
- Enforces: schedule status = active (not paused/cancelled)
- Calls: `base44.entities.BenefitCase.export()` via Gate 6C (or equivalent export method)
- Passes: template.filters_json + template.export_format to export service
- Logs: run to audit trail + Gate 6D export history
- Returns: export result (file URL or status)
- Audit: `report_schedule_executed` event

**Additional Methods (Status Management):**

#### 9. `activateReportSchedule(request)`
- Sets: status = active (from draft)
- Calculates: next_run_at = scheduled_date_time
- Enforces: permission (mga.reports.schedules.manage)
- Returns: updated schedule
- Audit: `report_schedule_activated` event

#### 10. `pauseReportSchedule(request)`
- Sets: status = paused (from active)
- Enforces: permission (mga.reports.schedules.manage)
- Returns: updated schedule
- Audit: `report_schedule_paused` event

#### 11. `cancelReportSchedule(request)`
- Sets: status = cancelled (terminal)
- Enforces: permission (mga.reports.schedules.manage)
- Returns: updated schedule
- Audit: `report_schedule_cancelled` event

#### 12. `getReportScheduleAuditTrail(request)`
- Query: activity log filtered by schedule_id
- Enforces: permission (mga.reports.schedules.audit)
- Returns: array of audit events
- Audit: optional

---

## 11. Frontend Components / Actions

### Component Mount Location

**Primary:** Broker/Agency Detail Drawer (MGABrokerAgencyDetailDrawer.jsx)
- Add new tab: "Report Templates & Schedules"
- Mount: `<MGAReportTemplatesPanel masterGroupId={masterGroupId} masterGeneralAgentId={masterGeneralAgentId} />`
- Mount: `<MGAReportSchedulePanel masterGroupId={masterGroupId} masterGeneralAgentId={masterGeneralAgentId} />`

### Components (5 total)

#### 1. `MGAReportTemplatesPanel.jsx` (Container)
- Props: masterGroupId, masterGeneralAgentId
- State: templates[], loading, error, showCreateModal, editingTemplate
- Actions:
  - Load templates on mount (call listReportTemplates)
  - Render template list (name, report_type, format, created_by, status)
  - Buttons: Create, Edit (if manage permission), Archive, Use (opens schedule modal)
  - Show "No templates" if empty
- Permissions: mga.reports.templates.view (list), mga.reports.templates.manage (create/edit/archive)

#### 2. `MGAReportTemplateModal.jsx` (Modal)
- Props: isOpen, mode (create/edit), template, masterGroupId, masterGeneralAgentId, onClose, onSave
- Fields:
  1. Template name (text, required)
  2. Description (textarea, optional)
  3. Report type (dropdown: cases/quotes/census/enrollment/renewals/proposals)
  4. Export format (radio: pdf/csv/xlsx, default pdf)
  5. Filters (button "Edit Filters" → opens Gate 6C filter UI)
  6. Public checkbox (if true, visible to team)
  7. Save button (disabled until name + report_type filled)
  8. Cancel button
- Actions:
  - On open: populate fields if editing
  - On save: validate + call createReportTemplate or updateReportTemplate
  - Show error if save fails
  - Close on success
- Permissions: mga.reports.templates.manage

#### 3. `MGAReportSchedulePanel.jsx` (Container)
- Props: masterGroupId, masterGeneralAgentId
- State: schedules[], loading, error, showCreateModal, editingSchedule
- Actions:
  - Load schedules on mount (call listReportSchedules)
  - Render schedule list (name, template name, type, status, next_run_at, actions)
  - Status badge: color-coded (draft/active/paused/cancelled)
  - Buttons: Create, Edit (if manage permission), Pause/Resume, Cancel, Run Now (if active)
  - Show "No schedules" if empty
  - "Run Now" calls executeScheduleManual; show success/error
- Permissions: mga.reports.schedules.view (list), mga.reports.schedules.manage (create/edit/pause/cancel), mga.reports.schedules.execute_manual (run now)

#### 4. `MGAReportScheduleModal.jsx` (Modal)
- Props: isOpen, mode (create/edit), schedule, masterGroupId, masterGeneralAgentId, onClose, onSave
- Fields (Gate 6I-A only):
  1. Template (dropdown: select saved template, required)
  2. Schedule name (text, required)
  3. Schedule type (radio: one_time only in 6I-A)
  4. Scheduled date & time (date picker + time picker, required)
  5. Timezone (dropdown: IANA timezones, optional, default UTC)
  6. Save button
  7. Cancel button
- Actions:
  - On open: populate fields if editing
  - On save: validate + call createReportScheduleDefinition or updateReportScheduleDefinition
  - Sets status = draft for new schedules
  - Show error if save fails
  - Close on success
- Permissions: mga.reports.schedules.manage

#### 5. `MGAReportScheduleStatusBadge.jsx` (Component)
- Props: status (draft/active/paused/cancelled)
- Renders: colored badge with status text
- Colors: draft (gray), active (green), paused (orange), cancelled (red)

### Integration Point: Gate 6G Export Dialog

**Modification:** Add "Save as Template" button to export dialog
- File: `components/mga/MGACaseWorkflowPanel.jsx` (or equivalent export modal)
- Action: Opens template creation modal pre-filled with current export filters/format
- Calls: createReportTemplate with current export configuration

---

## 12. Audit Event Requirements

### 12 Audit Event Types

#### Template Events

| Event | Trigger | Logged Fields |
|-------|---------|---|
| `report_template_created` | Template created | template_id, template_name, report_type, format, created_by, outcome, timestamp |
| `report_template_updated` | Template fields changed | template_id, template_name, changed_fields, updated_by, outcome, timestamp |
| `report_template_archived` | Template archived | template_id, template_name, archived_by, outcome, timestamp |
| `report_template_permission_denied` | Unauthorized access | template_id, actor_email, reason (e.g., "missing templates.view permission"), outcome=blocked, timestamp |
| `report_template_scope_denied` | Scope boundary violation | template_id, actor_email, reason (e.g., "cross-MGA access attempted"), outcome=blocked, timestamp |

#### Schedule Events

| Event | Trigger | Logged Fields |
|-------|---------|---|
| `report_schedule_created` | Schedule defined | schedule_id, schedule_name, template_id, scheduled_date_time, created_by, outcome, timestamp |
| `report_schedule_updated` | Schedule fields changed | schedule_id, schedule_name, changed_fields, updated_by, outcome, timestamp |
| `report_schedule_activated` | Schedule activated (draft → active) | schedule_id, schedule_name, activated_by, outcome, timestamp |
| `report_schedule_paused` | Schedule paused (active → paused) | schedule_id, schedule_name, paused_by, outcome, timestamp |
| `report_schedule_cancelled` | Schedule cancelled | schedule_id, schedule_name, cancelled_by, outcome, timestamp |
| `report_schedule_executed` | Schedule executed manually (Run Now) | schedule_id, schedule_name, template_id, executed_by, export_result (success/failure), outcome, timestamp |
| `report_schedule_permission_denied` | Unauthorized execution | schedule_id, actor_email, reason (e.g., "missing execute_manual permission"), outcome=blocked, timestamp |
| `report_schedule_scope_denied` | Scope boundary violation | schedule_id, actor_email, reason (e.g., "cross-MGA access attempted"), outcome=blocked, timestamp |

### Audit Storage

- Log to existing `ActivityLog` entity or create `MGAReportAuditLog` if separate audit trail preferred
- Fields: event_type, actor_email, actor_role, master_general_agent_id, master_group_id, target_entity_id, outcome, detail, created_at

---

## 13. Validation / Test Mapping

### Test Count Estimate: ~79 Tests

#### Authorization Tests (~15 tests)
- ✅ Admin can create/view/manage templates
- ✅ Manager can view templates but not create/manage
- ✅ User cannot create/view templates
- ✅ Read-only cannot create/view templates
- ✅ Similar tests for schedules (view, create, manage, execute_manual, audit)

#### Scope Tests (~10 tests)
- ✅ Template master_general_agent_id matches user MGA scope
- ✅ Cross-MGA template access returns 404
- ✅ Broker/Agency-scoped template access enforced
- ✅ Cross-Broker/Agency schedule access returns 404
- ✅ Tenant isolation (if applicable)

#### Data Model Tests (~12 tests)
- ✅ Create template with required fields
- ✅ Reject template without template_name
- ✅ Create schedule with required fields
- ✅ Reject schedule without template_id
- ✅ Schedule_type = one_time
- ✅ Status defaults and transitions

#### Manual Execution Tests (~8 tests)
- ✅ Run Now calls Gate 6C export service
- ✅ Run Now logs audit event
- ✅ Run Now fails if user lacks execute_manual permission
- ✅ Run Now fails if schedule paused/cancelled
- ✅ Idempotency prevents duplicate executions

#### Filter Safety Tests (~8 tests)
- ✅ Allow whitelisted filters
- ✅ Reject signed_url in filters
- ✅ Reject private_file_uri in filters
- ✅ Reject auth tokens in filters
- ✅ Reject stack traces in filters

#### Audit Tests (~8 tests)
- ✅ Template create logs event
- ✅ Schedule execute logs event
- ✅ Permission denied logs blocked event
- ✅ Scope denied logs blocked event
- ✅ Audit trail queryable by admin

#### Regression Tests (~12 tests)
- ✅ Gate 6C export still functional
- ✅ Gate 6D export history unaffected
- ✅ Gate 6G export UI unaffected
- ✅ Gate 6L-A contacts + settings unaffected
- ✅ Gates 6A–6H user management unaffected

#### Build / Quality Tests (~6 tests)
- ✅ npm run build passes
- ✅ eslint passes
- ✅ jest passes
- ✅ Registry JSON valid
- ✅ No console warnings/errors

**Test File:** `tests/mga/gate6i-a-saved-report-templates-schedule-definitions.test.js`

---

## 14. Rollback Procedure

### Phase 1: UI Surface Rollback (< 1 minute)

**Step 1:** Set feature flag to false
```
MGA_REPORT_TEMPLATES_ENABLED = false
```

**Step 2:** Hide UI components
- Hide "Report Templates & Schedules" tab in Broker/Agency drawer
- Hide "Save as Template" button in export dialog

**Step 3:** Deploy changes
- Frontend-only change; no backend deploy needed

**Impact:**
- Templates/schedules UI hidden
- All existing reports/exports unaffected
- Data preserved in database

**Verification:**
- [ ] Tab not visible in Broker/Agency drawer
- [ ] "Save as Template" button not visible
- [ ] Export functionality still works
- [ ] No console errors

---

### Phase 2: Backend API Disable (5 minutes)

**Step 1:** Disable API endpoints
- `/api/report-templates/*` → return 503 Service Unavailable
- `/api/report-schedules/*` → return 503 Service Unavailable

**Step 2:** Deploy backend changes

**Impact:**
- API calls fail gracefully (503)
- UI disabled (Phase 1)
- Data preserved in database

**Verification:**
- [ ] API endpoints return 503
- [ ] Gate 6C export still works
- [ ] Gate 6D export history still works
- [ ] No cascading errors

---

### Phase 3: Data Rollback (10–30 minutes, Data Loss)

**Step 1:** Remove new entities
```sql
DROP TABLE MGAReportTemplate;
DROP TABLE MGAReportSchedule;
```

**Step 2:** Rollback database migrations

**Impact:**
- All templates and schedules deleted (IRREVERSIBLE)
- Use only if critical security issue discovered

**Verification:**
- [ ] Tables removed
- [ ] No data leakage
- [ ] System stable

---

## 15. Registry / Ledger Update Requirements

### Update 1: QUOTE_CONNECT_360_GATE_REGISTRY.json

**After Implementation Work Order is complete, update:**

```json
{
  "gateId": "GATE-6I-A",
  "gateName": "Saved Report Templates and Schedule Definitions",
  "phase": "6",
  "status": "IMPLEMENTATION_WORK_ORDER_COMPLETE",
  "activation": "INACTIVE",
  "implementation": "NOT_STARTED",
  "capability": "Saved report templates and one-time schedule definitions with manual execution",
  "parentGate": "GATE-6I",
  "internalEntities": ["MGAReportTemplate", "MGAReportSchedule"],
  "dependsOn": ["GATE-6C", "GATE-6D", "GATE-6G"],
  "designSpec": "docs/MGA_GATE_6I_A_SAVED_REPORT_TEMPLATES_SCHEDULE_DEFINITIONS_DESIGN_SPECIFICATION.md",
  "implementationWorkOrder": "docs/MGA_GATE_6I_A_SAVED_REPORT_TEMPLATES_SCHEDULE_DEFINITIONS_IMPLEMENTATION_WORK_ORDER.md",
  "testCount": 0,
  "testsPassed": 0,
  "buildStatus": "NOT_APPLICABLE",
  "notes": "Work order complete. 12 core methods specified. 5 frontend components specified. ~79 unit + regression tests planned. Filter safety policy documented. Rollback strategy (3 phases) documented. Ready for implementation phase. Activation awaiting operator approval. No runtime changes yet."
}
```

Keep Gate 6I-B as:
```json
{
  "gateId": "GATE-6I-B",
  "gateName": "Recurring Scheduler Execution",
  "phase": "6",
  "status": "DEFERRED",
  "activation": "INACTIVE",
  "implementation": "NOT_STARTED",
  "parentGate": "GATE-6I",
  "deferReason": "Scheduler execution, permission/scope recheck, failure recovery require separate design"
}
```

### Update 2: MGA_GATE_STATUS_LEDGER.md

**Add Entry:**
```
Gate 6I-A: IMPLEMENTATION_WORK_ORDER_COMPLETE
  - Implementation work order: docs/MMA_GATE_6I_A_SAVED_REPORT_TEMPLATES_SCHEDULE_DEFINITIONS_IMPLEMENTATION_WORK_ORDER.md
  - Approved for implementation
  - Activation awaiting operator approval
  - No runtime changes yet
  - Test count: ~79
  - Expected implementation: 3–4 weeks
```

---

## 16. Operator Approval Checkpoint

### Pre-Implementation Approval Gate

**This work order is COMPLETE and READY FOR OPERATOR REVIEW.**

### Operator Must Approve:

- [ ] Gate 6I-A scope (templates + schedule definitions only)
- [ ] Gate 6I-B deferral (no recurring execution in 6I-A)
- [ ] File list (entities, services, components, tests)
- [ ] Permission model (restrictive by default)
- [ ] Scope/security boundaries (MGA/Broker/Agency enforcement)
- [ ] Filter safety policy (whitelist/blacklist)
- [ ] Backend service design (12 methods)
- [ ] Frontend design (5 components)
- [ ] Audit trail (12 event types)
- [ ] Test plan (~79 tests)
- [ ] Rollback procedure (3 phases)

### Required Approval Statement:

**Operator must provide explicit written approval before:**
1. Implementation phase begins
2. Any code files created
3. Any feature flags set
4. Any runtime changes deployed

### Next Step After Approval:

Upon operator approval, create:
1. `docs/MGA_GATE_6I_A_IMPLEMENTATION_APPROVAL_PACKET.md` (operator sign-off)
2. Begin implementation phase (create entity files, services, components)
3. Update registry to `IMPLEMENTATION_IN_PROGRESS`

---

## Summary

**Gate 6I-A Implementation Work Order: COMPLETE**

**Key Deliverables:**
- ✅ 16-section implementation plan
- ✅ 2 entities (MGAReportTemplate, MGAReportSchedule)
- ✅ 12 backend service methods
- ✅ 5 frontend components
- ✅ 12 audit event types
- ✅ ~79 unit + regression tests
- ✅ Filter safety policy (whitelist/blacklist)
- ✅ Scope enforcement (MGA/Broker/Agency/tenant)
- ✅ Permission model (7 granular permissions)
- ✅ Rollback strategy (3 phases, reversible)

**Guardrails:**
- ✅ No recurring execution (Gate 6I-B deferred)
- ✅ No background jobs
- ✅ No email/webhook delivery
- ✅ No document management
- ✅ No permission broadening beyond mga_admin
- ✅ No gate rewrites (6A–6H, 6L-A protected)
- ✅ No schema renames (MasterGroup, master_group_id)

**Status:**
- Implementation: NOT_STARTED
- Runtime Changes: NONE
- Activation: INACTIVE (awaiting operator approval)

**Next Action:**
Operator approval of this work order before implementation phase begins.

---

*Implementation Work Order completed 2026-05-12*  
*Awaiting explicit operator approval before implementation phase begins.*