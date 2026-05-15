# Gate 6I-B Report Scheduling — Backend Infrastructure Work Order

**Date:** 2026-05-13  
**Gate:** 6I-B (Report Scheduling)  
**Phase:** 6I-B.1 (Backend Infrastructure)  
**Status:** Operator-Authorized Implementation Work Order  
**Duration Estimate:** 2-3 weeks  

---

## Executive Summary

Phase 6I-B.1 implements the backend infrastructure for recurring scheduled report generation. This work order defines entity extensions, backend contracts, lifecycle models, audit logging, and scheduler controls. All work is feature-flag gated (default false) with no runtime activation or route exposure.

**Key Operator Decision (Locked):**
- Minimum recurring schedule interval: **1 hour** (not 5 minutes)
- Maximum recurring schedule interval: 1 year

---

## Work Order Scope

### 1. ReportExecutionAuditLog Entity Design

**Purpose:** Immutable audit trail for all report execution events

**Entity Name:** ReportExecutionAuditLog  
**Storage:** Standard database table (audit-sensitive, no deletion)

**Schema:**
```json
{
  "name": "ReportExecutionAuditLog",
  "type": "object",
  "properties": {
    "master_general_agent_id": {
      "type": "string",
      "description": "MGA scope — required for all audit events"
    },
    "schedule_id": {
      "type": "string",
      "description": "Foreign key to MGAReportSchedule"
    },
    "execution_id": {
      "type": "string",
      "description": "Unique execution identifier (uuid)"
    },
    "event_type": {
      "type": "string",
      "enum": [
        "schedule_created",
        "schedule_updated",
        "schedule_activated",
        "schedule_paused",
        "schedule_cancelled",
        "execution_started",
        "execution_completed",
        "execution_failed",
        "execution_retried",
        "report_downloaded",
        "report_deleted"
      ],
      "description": "Type of audit event"
    },
    "actor_email": {
      "type": "string",
      "description": "User email (null for system-triggered events)"
    },
    "actor_role": {
      "type": "string",
      "description": "User role at time of event (MGA_ADMIN, BROKER_ADMIN, etc.)"
    },
    "outcome": {
      "type": "string",
      "enum": ["success", "failed", "skipped"],
      "description": "Result of the event"
    },
    "detail": {
      "type": "string",
      "description": "Human-readable description of the event"
    },
    "error_code": {
      "type": "string",
      "description": "Error code if outcome=failed (null otherwise)"
    },
    "error_message": {
      "type": "string",
      "description": "Error message if outcome=failed (null otherwise)"
    },
    "metadata": {
      "type": "object",
      "description": "Event-specific metadata (retry_count, file_size, format, etc.)"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "When the event occurred (UTC)"
    }
  },
  "required": [
    "master_general_agent_id",
    "schedule_id",
    "execution_id",
    "event_type",
    "outcome",
    "timestamp"
  ]
}
```

**Constraints:**
- ✅ Immutable (no updates or deletes after creation)
- ✅ Indexed on: master_general_agent_id, schedule_id, event_type, timestamp
- ✅ Retention: keep for audit trail (no auto-delete)

---

### 2. MGAReportSchedule Field Extensions

**Current Status:** Entity exists (src/entities/MGAReportSchedule.json)  
**Changes Required:** Add recurrence, execution, and retry fields

**New Fields to Add:**

```json
{
  "schedule_type": {
    "type": "string",
    "enum": ["one_time", "recurring"],
    "description": "Changed from fixed 'one_time' to support recurring"
  },
  
  "frequency": {
    "type": "string",
    "enum": ["hourly", "daily", "weekly", "monthly", "custom"],
    "description": "Recurrence frequency (null for one_time)"
  },
  
  "frequency_interval": {
    "type": "integer",
    "description": "Repeat every N intervals (e.g., every 2 hours = 2)"
  },
  
  "frequency_days_of_week": {
    "type": "array",
    "items": {"type": "integer"},
    "description": "Days 0-6 (Sun-Sat) for weekly schedules"
  },
  
  "frequency_day_of_month": {
    "type": "integer",
    "description": "Day 1-31 for monthly schedules"
  },
  
  "frequency_cron": {
    "type": "string",
    "description": "Custom cron expression for 'custom' frequency"
  },
  
  "recurrence_end_date": {
    "type": "string",
    "format": "date-time",
    "description": "When recurring schedule should stop (null = no end)"
  },
  
  "next_run_at": {
    "type": "string",
    "format": "date-time",
    "description": "Calculated next execution time (updated after each run)"
  },
  
  "last_run_at": {
    "type": "string",
    "format": "date-time",
    "description": "Timestamp of last execution (null until first run)"
  },
  
  "execution_count": {
    "type": "integer",
    "default": 0,
    "description": "Total successful executions"
  },
  
  "failure_count": {
    "type": "integer",
    "default": 0,
    "description": "Total failed executions"
  },
  
  "last_execution_status": {
    "type": "string",
    "enum": ["success", "failed", "skipped"],
    "description": "Status of last execution (null if never run)"
  },
  
  "last_execution_error": {
    "type": "string",
    "description": "Error message from last failure (null if last was success)"
  },
  
  "retry_on_failure": {
    "type": "boolean",
    "default": false,
    "description": "Enable automatic retry on failure"
  },
  
  "max_retries": {
    "type": "integer",
    "default": 3,
    "description": "Maximum retry attempts (if retry_on_failure=true)"
  },
  
  "retry_delay_minutes": {
    "type": "integer",
    "default": 60,
    "description": "Minutes to wait between retry attempts"
  },
  
  "current_retry_count": {
    "type": "integer",
    "default": 0,
    "description": "Current retry attempt (0 = first execution)"
  },
  
  "auto_delete_on_end": {
    "type": "boolean",
    "default": false,
    "description": "Delete schedule when recurrence_end_date reached"
  },
  
  "keep_last_n_reports": {
    "type": "integer",
    "default": 12,
    "description": "Retention limit (older reports auto-deleted)"
  }
}
```

**Backward Compatibility:**
- ✅ Existing one_time schedules unaffected (new fields null/default)
- ✅ schedule_type enum expanded (not restricted)
- ✅ No breaking changes to existing queries

---

### 3. reportGenerationExecutor Backend Contract

**Purpose:** Execute a scheduled report generation with scope/permission/audit

**Function Name:** reportGenerationExecutor  
**Trigger:** Base44 scheduled automation (cron-based)  
**Auth Required:** System service role (runs as scheduler, not user)

**Input Payload:**
```javascript
{
  schedule_id: "sched123",           // Required
  execution_id: "exec-uuid-456",     // Required (generated by scheduler)
  triggered_by: "automation" | "user_manual",  // Required
  manual_trigger_user_email: "user@test.com"  // Optional (if user_manual)
}
```

**Output Contract:**
```javascript
// Success response (status 200)
{
  status: 200,
  data: {
    execution_id: "exec-uuid-456",
    schedule_id: "sched123",
    status: "completed",
    file_uri: "private://...",
    report_format: "pdf",
    file_size: 1024000,
    generated_at: "2026-05-20T09:15:30Z",
    success: true
  }
}

// Failure response (status 400/500)
{
  status: 500,
  data: {
    error: "Report generation failed",
    error_code: "GENERATION_TIMEOUT",
    detail: "Report exceeded 30-minute timeout"
  }
}
```

**Execution Flow:**
1. Fetch schedule + validate schedule exists + is active
2. Fetch template + validate template exists + is active
3. Validate scope (schedule.master_general_agent_id)
4. Validate permission (system scheduler allowed)
5. Load filters (safe payload from Gate 6C)
6. Call mgaReportExport (existing backend function)
7. Store report (UploadPrivateFile → private storage)
8. Create execution record (ReportExecutionLog entity)
9. Update schedule.last_run_at, execution_count
10. Audit log execution_completed event
11. Return execution result

**Error Handling:**
- ❌ Permission denied → 403 Forbidden, audit log access_denied
- ❌ Schedule not found → 404 Not Found, audit log schedule_not_found
- ❌ Template not found → 404 Not Found, audit log template_not_found
- ❌ Generation timeout (30 min) → 500, audit log execution_timeout
- ❌ File upload failed → 500, audit log upload_failed

**Timeout Enforcement:**
- Max execution time: 30 minutes (hardcoded, not configurable)
- Monitor execution time; abort if exceeds 30 min
- Log timeout as failure + add to retry queue (if enabled)

**Concurrent Execution:**
- If last execution still running: skip this run, log skipped event
- Never queue multiple executions from same schedule
- Update next_run_at to next valid time

---

### 4. reportRetryQueueProcessor Backend Contract

**Purpose:** Process failed reports in retry queue with exponential backoff

**Function Name:** reportRetryQueueProcessor  
**Trigger:** Base44 scheduled automation (runs every 15 minutes)  
**Auth Required:** System service role

**Input Payload:**
```javascript
{
  batch_size: 50  // Optional (default 50)
}
```

**Output Contract:**
```javascript
{
  status: 200,
  data: {
    processed_count: 5,
    retried_count: 3,
    success_count: 1,
    failed_again_count: 2,
    skipped_count: 2  // (still waiting for retry delay)
  }
}
```

**Processing Logic:**
1. Find all schedules with status=failed + retry_on_failure=true
2. Check if retry_delay_minutes has passed since last execution
3. If not passed: skip (will retry next check)
4. If passed AND current_retry_count < max_retries:
   - Call reportGenerationExecutor (above)
   - Increment current_retry_count
   - Audit log execution_retried event
5. If passed AND current_retry_count >= max_retries:
   - Mark schedule as permanently failed
   - Audit log max_retries_exceeded event
6. Return batch result

**Audit Events:**
- ✅ execution_retried (each retry attempt)
- ✅ execution_completed (if retry succeeds)
- ✅ execution_failed (if retry fails)
- ✅ max_retries_exceeded (if out of retries)

---

## 5. Schedule Lifecycle Model

**States:** draft → active → running → completed/failed → [paused/cancelled]

| State | Created By | Can Transition To | Audit Event |
|-------|-----------|------------------|------------|
| draft | User creates schedule | active, cancelled | schedule_created |
| active | User activates (publish) | running, paused, cancelled | schedule_activated |
| running | Scheduler executes | completed, failed | execution_started |
| completed | Execution success | active (next recurrence), paused, cancelled | execution_completed |
| failed | Execution failure | active (retry), paused, cancelled | execution_failed |
| paused | User pauses | active, cancelled | schedule_paused |
| cancelled | User cancels | [terminal] | schedule_cancelled |

**State Rules:**
- ✅ Only active schedules can execute
- ✅ Completed schedules return to active (if recurring)
- ✅ Failed schedules stay failed (until retry or manual rerun)
- ✅ Paused/cancelled are terminal (require manual action to resume)

---

## 6. Execution Lifecycle Model

**States:** pending → running → completed/failed/skipped

| State | Duration | Auto-Transition | Audit Event |
|-------|----------|-----------------|------------|
| pending | Scheduled time minus offset | Yes → running | execution_started |
| running | 0 to 30 minutes | Yes → completed/failed | execution_completed/failed |
| completed | Terminal | No | [none, event already logged] |
| failed | Terminal | No → retry queue | [none, event already logged] |
| skipped | Terminal (concurrent detected) | No | execution_skipped |

**Timeout:**
- ⏱️ Max 30 minutes per execution (hardcoded)
- ❌ If still running after 30 min: abort + log timeout failure

---

## 7. Retry Lifecycle Model

**States:** initial_failure → retry_pending → retry_running → [success/final_failure]

| State | Condition | Delay | Max Attempts | Action |
|-------|-----------|-------|-------------|--------|
| initial_failure | reportGenerationExecutor fails | — | N/A | Set current_retry_count=0, add to queue |
| retry_pending | Waiting for retry_delay_minutes | 60 min (default) | 3 (default) | Check every 15 min |
| retry_running | reportRetryQueueProcessor triggers | 0 to 30 min | N/A | Call reportGenerationExecutor |
| success | Retry succeeds | — | N/A | Reset current_retry_count, set status=active |
| final_failure | current_retry_count >= max_retries | — | Reached | Terminal, mark permanently failed |

**Opt-In Model:**
- Default: retry_on_failure = false (no automatic retry)
- User must explicitly enable retry when creating schedule
- If disabled: failed schedule stays failed until manual intervention

---

## 8. Scope and Permission Enforcement

### Three-Layer Scope (Inherited from Gate 7A-3)

1. **MGA Scope (Required)**
   - schedule.master_general_agent_id must match user.master_general_agent_id
   - System scheduler has no MGA restriction (runs as service role)
   - Query filter: WHERE master_general_agent_id = ?

2. **Broker/Agency Scope (Optional)**
   - If schedule.master_group_id set: user must belong to that group
   - If null: MGA-level schedule (accessible to all users in MGA)

3. **User Ownership (Optional)**
   - If schedule.owner_user_id set: only owner or MGA admin can edit
   - If null: shared by MGA admin

### Permission Rules

| Action | MGA Admin | Broker Admin | Regular User |
|--------|-----------|------------|-------------|
| Create schedule | ✅ Yes | ✅ (own broker) | ❌ No |
| View schedule (own) | ✅ Yes | ✅ Yes | ✅ Yes |
| View schedule (shared) | ✅ Yes | ✅ (own broker) | ✅ (if is_public) |
| Edit schedule | ✅ Yes | ✅ (own broker) | ❌ No |
| Activate schedule | ✅ Yes | ✅ (own broker) | ❌ No |
| Manual trigger | ✅ Yes | ✅ (own broker) | ❌ No |
| Pause schedule | ✅ Yes | ✅ (own broker) | ❌ No |
| Cancel schedule | ✅ Yes | ✅ (own broker) | ❌ No |

### Scope Validation (Backend)
- ✅ All schedule operations validate master_general_agent_id
- ✅ Service layer enforces scope (not frontend)
- ✅ Audit log all scope violations
- ✅ Return 403 Forbidden if scope mismatch

---

## 9. Safe Payload Rules

### What Gets Exported in Report
- ✅ Schedule metadata (name, frequency, next_run_at)
- ✅ Filtered data (respecting Gate 6C permissions)
- ✅ Audit trail (who created, last execution)

### What Never Gets Exported
- ❌ Raw database IDs (except context IDs like case_id)
- ❌ file_uri or storage paths
- ❌ Unfiltered sensitive fields
- ❌ User API keys or credentials

### Safe Payload Enforcement
- ✅ Use reportExportFieldPolicy (from Gate 6I-A)
- ✅ Use reportExportPermissions (role-based masking)
- ✅ Call mgaReportExport (verified safe from 6I-A)
- ✅ No raw entity reads (service layer only)

---

## 10. Audit Event Model

**Event Types (11 total):**

| Event | Trigger | Required Fields | Optional Fields |
|-------|---------|-----------------|-----------------|
| schedule_created | User creates schedule | schedule_id, actor_email | template_id, frequency |
| schedule_updated | User edits schedule | schedule_id, actor_email, detail | change_log (JSON) |
| schedule_activated | User publishes (draft→active) | schedule_id, actor_email | — |
| schedule_paused | User pauses schedule | schedule_id, actor_email | reason |
| schedule_cancelled | User cancels schedule | schedule_id, actor_email | reason |
| execution_started | Scheduler triggers report | schedule_id, execution_id | triggered_by |
| execution_completed | Report generated successfully | schedule_id, execution_id, outcome=success | file_size, format |
| execution_failed | Report generation failed | schedule_id, execution_id, outcome=failed | error_code, error_message |
| execution_retried | Retry triggered after failure | schedule_id, execution_id | retry_count |
| report_downloaded | User downloads report | schedule_id, execution_id, actor_email | — |
| report_deleted | User deletes old report | schedule_id, execution_id, actor_email | reason |

**Audit Table:**
- Entity: ReportExecutionAuditLog (see Section 1)
- Immutable (no deletes)
- Indexed on: master_general_agent_id, schedule_id, event_type, timestamp

---

## 11. Feature Flag Matrix (All Default False)

| Flag | Default | Purpose | Scope |
|------|---------|---------|-------|
| REPORT_SCHEDULING_ENABLED | false | Master gate flag | Feature gate entire 6I-B |
| RECURRING_SCHEDULE_ENABLED | false | Enable recurring patterns | Allow frequency field in UI |
| SCHEDULE_AUTOMATION_ENABLED | false | Enable Base44 automations | Allow scheduler to trigger jobs |
| REPORT_AUTO_EXECUTION_ENABLED | false | Allow automatic execution | Scheduler can run reports |
| REPORT_RETENTION_CLEANUP_ENABLED | false | Enable auto-delete old reports | Cleanup job can delete |
| SCHEDULE_RETRY_ENABLED | false | Enable retry on failure | Retry queue processor can run |

**Implementation:**
- ✅ All flags in single featureFlags.js module
- ✅ Default false (no activation)
- ✅ Parent components check flags before rendering
- ✅ Backend checks flags before executing

**Enforcement:**
- reportGenerationExecutor checks REPORT_AUTO_EXECUTION_ENABLED (or returns 403)
- reportRetryQueueProcessor checks SCHEDULE_RETRY_ENABLED (or returns 403)
- Frontend components check flags before rendering UI

---

## 12. Scheduler / Automation Non-Activation Controls

### No Runtime Activation
- ❌ No Base44 automations created automatically
- ❌ No background jobs running without flag
- ❌ No schedules can execute until feature flag enabled

### Automation Creation Model
- When user activates schedule (draft → active) + SCHEDULE_AUTOMATION_ENABLED=true:
  - Create Base44 scheduled automation for this schedule
  - Cron expression: derived from frequency (daily → "0 9 * * *", etc.)
  - Automation calls reportGenerationExecutor backend function
  - Automation audited (created_by, created_at in automation metadata)

### Automation Deletion Model
- When user cancels schedule:
  - Mark schedule as cancelled
  - Delete corresponding Base44 automation
  - Audit log schedule_cancelled event

### Manual Trigger (Not Automated)
- User can click "Run Now" button (UI, deferred to 6I-B.3)
- Calls reportGenerationExecutor directly
- Audit log tracks manual trigger (triggered_by="user_manual")

---

## 13. Operator Decision Enforcement: 1-Hour Minimum Interval

**Locked Operator Decision:**
- Minimum recurring interval: **1 hour**
- Maximum recurring interval: 1 year
- (NOT 5 minutes minimum)

**Enforcement Points:**

1. **Schedule Creation Validation**
   - If frequency="hourly" + frequency_interval < 1: reject (400 Bad Request)
   - If frequency="daily" + frequency_interval < 1: reject
   - Message: "Minimum recurring interval is 1 hour"
   - Audit log: validation_failed event

2. **Backend Validation (reportGenerationExecutor)**
   - Recalculate next_run_at using frequency rules
   - If next_run_at < now + 1 hour: skip (log skipped event)
   - Never schedule execution sooner than 1 hour from now

3. **Cron Expression Validation (if frequency="custom")**
   - Parse cron expression
   - Validate minimum interval >= 1 hour
   - Reject if sub-hourly (e.g., "*/15 * * * *" = every 15 min)

---

## 14. Execution Timeout (30 minutes)

**Hardcoded (Not Configurable):**
- Max report generation time: 30 minutes
- Monitor execution time from start
- If still running after 30 min: abort + fail
- Audit log: execution_timeout event

**Implementation:**
- reportGenerationExecutor sets timer at start
- Calls mgaReportExport with timeout=1800 seconds
- If timeout reached: catch + log failure + add to retry queue

---

## 15. Concurrent Execution Behavior

**If Schedule Already Running:**
- Do NOT queue another execution
- Skip this scheduled run
- Audit log: execution_skipped event
- Recalculate next_run_at for next valid time

**Rationale:** Prevent overload from slow reports

---

## 16. Retention Default (keep_last_n_reports = 12)

**Default Behavior:**
- New schedules created with keep_last_n_reports = 12
- Oldest 13+ reports auto-deleted when new report generated
- User can configure per schedule (1 to 100, default 12)

**Auto-Cleanup Logic:**
- After execution_completed event:
  - Query ReportExecution WHERE schedule_id = ? ORDER BY generated_at DESC
  - Keep last N records (N = keep_last_n_reports)
  - Delete older records
  - Delete associated files from private storage
  - Audit log: report_deleted events

---

## 17. Retry Policy (Opt-In, Max 3, 60-Min Delay)

**Opt-In Model (Default False):**
- New schedules: retry_on_failure = false
- User must explicitly enable retry
- Only applies to failed executions

**Retry Configuration (Defaults):**
- max_retries: 3 (user can configure 0-10)
- retry_delay_minutes: 60 (user can configure 15-1440)

**Retry Logic:**
1. Execution fails → set status=failed, current_retry_count=0
2. Add to retry queue (if retry_on_failure=true)
3. reportRetryQueueProcessor checks queue every 15 minutes
4. If retry_delay_minutes elapsed:
   - Call reportGenerationExecutor again
   - Increment current_retry_count
   - Audit log execution_retried event
5. If succeeds: status=active, reset current_retry_count
6. If fails AND current_retry_count < max_retries: back to queue
7. If fails AND current_retry_count >= max_retries: terminal failure

---

## 18. Test Plan and Estimated Test Count

### Unit Tests (60+ tests)
**Schedule Lifecycle:**
- Create schedule (valid/invalid inputs) — 5 tests
- Activate schedule (draft→active) — 3 tests
- Pause schedule (active→paused) — 3 tests
- Cancel schedule (any→cancelled) — 3 tests
- Resume schedule (paused→active) — 3 tests

**Frequency Validation:**
- Hourly (minimum 1 hour) — 3 tests
- Daily (valid/invalid) — 3 tests
- Weekly (day selection) — 3 tests
- Monthly (day of month) — 3 tests
- Custom cron (valid/invalid) — 3 tests
- Cron sub-hourly rejection (1-hour minimum) — 2 tests

**Execution:**
- Generate report (success) — 3 tests
- Generate report (timeout after 30 min) — 2 tests
- Generate report (concurrent skip) — 2 tests
- Calculate next_run_at (hourly/daily/weekly/monthly/custom) — 5 tests

**Retry Logic:**
- Retry on failure (enabled) — 3 tests
- Retry on failure (disabled) — 3 tests
- Max retries exceeded — 2 tests
- Retry delay calculation — 2 tests

**Scope & Permission:**
- MGA scope enforcement — 4 tests
- Broker scope enforcement — 3 tests
- Permission checks (create/edit/execute) — 4 tests
- Owner vs. shared schedule — 3 tests

**Audit Events:**
- All 11 event types logged — 11 tests
- Scope violation audited — 2 tests

**Safe Payload:**
- Export field policy applied — 3 tests
- No raw entity reads — 2 tests

**Subtotal: 90+ unit tests**

### Integration Tests (50+ tests)
**End-to-End:**
- Create → Activate → Execute → Complete — 2 tests
- Create → Activate → Execute → Fail → Retry → Success — 2 tests
- Create → Activate → Manual trigger — 2 tests
- Create → Edit → Re-activate — 2 tests

**Scheduler Integration:**
- Base44 automation created on activation — 2 tests
- Automation deleted on cancellation — 2 tests
- Automation triggers reportGenerationExecutor — 2 tests
- Cron expression derived from frequency — 4 tests

**Retention Cleanup:**
- Auto-delete old reports (keep_last_n=12) — 2 tests
- File cleanup from private storage — 2 tests

**Concurrent Execution:**
- Skip if already running — 2 tests
- Audit log skipped event — 1 test

**Retry Queue:**
- reportRetryQueueProcessor finds failed schedules — 2 tests
- Processes retries in batch — 2 tests
- Respects retry_delay_minutes — 2 tests

**Cross-Scope:**
- MGA A cannot see MGA B schedules — 2 tests
- Broker A cannot see Broker B schedules (same MGA) — 2 tests

**Subtotal: 35+ integration tests**

### Security Tests (25+ tests)
**Access Control:**
- Non-admin cannot create schedule — 2 tests
- Non-owner cannot edit schedule — 2 tests
- Non-admin cannot manually trigger — 2 tests
- Permission denied on scope mismatch — 3 tests

**Audit:**
- All events immutable (no delete/update) — 2 tests
- Scope violations logged — 2 tests

**Safe Payload:**
- No file_uri in export — 2 tests
- No storage path in export — 2 tests
- No sensitive fields in export — 2 tests

**Retry Safety:**
- Retry respects max_retries (no infinite loop) — 1 test
- Timeout prevents hang (30 min max) — 1 test

**Subtotal: 21+ security tests**

### Total Estimated Tests: 146+ tests
- Unit: 90+
- Integration: 35+
- Security: 21+

---

## 19. Rollback Plan

### Scenario: 6I-B.1 Fails (Major Bug Introduced)

**Immediate Actions:**
1. Disable all feature flags (set to false)
2. Stop all Base44 automations (pause via automation manager)
3. Prevent new schedule creation (API returns 503)

**Data Recovery:**
- ✅ ReportExecutionAuditLog: immutable (no rollback needed)
- ✅ MGAReportSchedule: revert to 6I-A schema (one_time only)
  - Drop new columns: frequency, recurrence_end_date, execution_count, etc.
  - Revert schedule_type enum to ["one_time"]
- ✅ Existing one_time schedules: unaffected (backward compatible)

**Testing Before Re-Deploy:**
- Re-run all 146+ tests
- Manual smoke test (create → activate → execute)
- Scope/permission validation
- Audit event capture

**Approval Required:**
- Operator sign-off before re-enabling feature flags

---

## 20. Operator Approval Block

```
OPERATOR APPROVAL REQUIRED

Before Phase 6I-B.1 Backend Infrastructure Implementation begins, confirm:

[ ] Locked operator decision: 1-hour minimum recurring interval (confirmed)
[ ] Locked operator decision: 30-minute execution timeout (confirmed)
[ ] Locked operator decision: Retry policy opt-in, max 3, 60-min delay (confirmed)
[ ] Locked operator decision: Retention default keep_last_n_reports = 12 (confirmed)
[ ] Locked operator decision: Concurrent execution skip-and-audit (confirmed)

[ ] Feature flags understood (all default false, no activation)
[ ] Entity/schema changes acceptable (backward compatible)
[ ] Backend contracts clear (reportGenerationExecutor, reportRetryQueueProcessor)
[ ] Audit requirements understood (11 event types, immutable log)
[ ] Scope enforcement inherited from Gate 7A-3 (confirmed)
[ ] Safe payload rules inherited from Gate 6I-A (confirmed)

[ ] Test plan acceptable (146+ tests)
[ ] Rollback plan acceptable (feature flag disable, schema revert)
[ ] Deferred gates acknowledged (6J-B, 6J-C remain deferred)
[ ] Locked gates confirmed (6L-B, 7A-3 remain locked)

[ ] Ready to proceed with Phase 6I-B.1 implementation

APPROVAL: _______________
DATE: _______________
```

---

**Gate 6I-B Backend Infrastructure Work Order: READY FOR IMPLEMENTATION**