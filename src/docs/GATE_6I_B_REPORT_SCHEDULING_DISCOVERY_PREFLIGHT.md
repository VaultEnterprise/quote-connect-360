# Gate 6I-B Report Scheduling — Discovery & Preflight Analysis

**Date:** 2026-05-13  
**Gate:** 6I-B (Report Scheduling)  
**Phase:** Discovery / Preflight  
**Status:** Operator-Authorized Controlled Implementation Path  
**Next Gates:** 6J-B (Email Delivery), 6J-C (Webhook Delivery) [Deferred]

---

## Executive Summary

Gate 6I-B introduces recurring scheduled report generation infrastructure, building on Gate 6I-A saved report templates. This gate defines the scheduling model, execution lifecycle, permission enforcement, and audit logging for MGA-scoped report jobs. Gate 6I-B is an upstream dependency for Gates 6J-B and 6J-C (delivery mechanisms), and precedes both.

**Scope:** Scheduling infrastructure only. No email/webhook delivery. No route/navigation exposure. All feature flags default false. No runtime activation.

---

## Current Report Template / Schedule Baseline

### Existing Gate 6I-A Status
**Gate 6I-A: Saved Report Templates** — Already implemented and closed

**Relevant Entities:**
- **MGAReportTemplate** (src/entities/MGAReportTemplate.json)
  - template_name, description, report_type, export_format
  - filters_json (safe payload from Gate 6C)
  - is_public (visibility), status (active/inactive/archived)
  - created_by, owner_user_id (audit trail)
  - MGA scope + optional Broker/Agency scope + optional tenant scope

- **MGAReportSchedule** (src/entities/MGAReportSchedule.json)
  - schedule_type: enum ["one_time"] (Gate 6I-A only)
  - frequency: null for one_time, reserved for recurring
  - timezone, scheduled_date_time, next_run_at, last_run_at
  - status: draft/active/paused/cancelled
  - created_by, owner_user_id (audit trail)
  - MGA scope + optional Broker/Agency scope + optional tenant scope

**Gate 6I-A Limitations (by design):**
- ✅ One-time scheduling only (schedule_type = "one_time")
- ✅ No recurrence patterns
- ✅ frequency field reserved for 6I-B
- ✅ recurrence_end_date reserved for 6I-B
- ❌ No background job execution
- ❌ No audit event logging for executions
- ❌ No retry/failure handling

---

## Existing Gate 6I-A Export/Report Infrastructure

### Existing Backend Functions (Reusable)
- **mgaReportExport** — Exports report data in PDF/CSV/XLSX format
- **mgaExportHistoryContract** — Tracks export history and metadata

### Existing Services (Reusable)
- **reportExportService** (lib/mga/services/reportExportService.js)
  - Handles data fetching, filtering, formatting
  - Enforces safe payload validation
  - Permission-based field masking

- **reportExportPermissions** (lib/mga/reportExportPermissions.js)
  - Role-based field visibility (who can see what)
  - Scope-enforced data filtering

- **reportExportFieldPolicy** (lib/mga/reportExportFieldPolicy.js)
  - Safe field selection (no internal/sensitive fields)
  - Export format mapping

### Existing UI Components (Reusable)
- **MGAReportTemplateModal** — Create/edit templates
- **MGAReportScheduleModal** — Create/edit schedules (one_time only in 6I-A)
- **MGAReportTemplatesPanel** — List/manage templates
- **MGAReportSchedulePanel** — List/manage schedules (one_time only in 6I-A)

---

## Proposed Scheduled Report Model (Gate 6I-B)

### New Scheduling Capability
**Recurring Report Generation with Controlled Execution**

**What 6I-B Adds:**
1. Recurring schedule definition (daily, weekly, monthly, custom cron)
2. Background job scheduling (Base44 scheduled automations)
3. Report execution lifecycle (pending → running → completed/failed)
4. Retry/failure handling with audit logging
5. Permission-based execution enforcement
6. Safe payload delivery (no raw data exposure)

**What 6I-B Does NOT Add (Deferred):**
- ❌ Email delivery (Gate 6J-B)
- ❌ Webhook delivery (Gate 6J-C)
- ❌ Report distribution (automatic sending)
- ❌ Subscriber management

---

## Schedule Definition Fields (New)

### MGAReportSchedule Extensions for 6I-B

```json
{
  // Existing 6I-A fields (unchanged)
  "master_general_agent_id": "mga1",
  "template_id": "tmpl1",
  "schedule_name": "Weekly Cases Report",
  "scheduled_date_time": "2026-05-20T09:00:00Z",
  "timezone": "America/Los_Angeles",
  "status": "active",
  
  // New 6I-B fields
  "schedule_type": "recurring",  // Changed from "one_time"
  "frequency": "weekly",         // New: daily, weekly, monthly, custom
  "frequency_interval": 1,       // New: every N days/weeks/months
  "frequency_days_of_week": [1, 3, 5],  // New: for weekly (0=Sun, 6=Sat)
  "frequency_day_of_month": 1,   // New: for monthly (1-31)
  "frequency_cron": null,        // New: for custom cron patterns
  "recurrence_end_date": "2026-12-31T23:59:59Z",  // New: when to stop recurring
  "next_run_at": "2026-05-20T09:00:00Z",  // Calculated by scheduler
  "last_run_at": null,           // Set after execution
  
  // New execution tracking fields
  "execution_count": 0,          // Total successful executions
  "failure_count": 0,            // Total failed executions
  "last_execution_status": null, // "success" | "failed" | "skipped"
  "last_execution_error": null,  // Error message if failed
  
  // New retention/cleanup
  "auto_delete_on_end": false,   // Delete schedule when recurrence_end_date reached
  "keep_last_n_reports": 12,     // Retention policy (keep last N generated reports)
}
```

---

## Report Execution Lifecycle States

### State Machine (New)

```
[Draft] → [Active] → [Running] → [Completed/Failed] → [Paused/Cancelled]
   ↓                      ↓
[Cancelled]            [Retry Queue]
```

### State Definitions

| State | Meaning | Operator Action | Auto-Transition |
|-------|---------|-----------------|-----------------|
| draft | Schedule created but not activated | Publish or delete | No |
| active | Schedule active, waiting for next run | Pause/cancel | Yes → Running (at scheduled time) |
| running | Report generation in progress | Pause (abort if < 1 min elapsed) | Yes → Completed/Failed |
| completed | Report generated successfully | View/download/delete | No (waiting for next recurrence) |
| failed | Report generation failed | Retry/pause/cancel | Yes → Active (retry queue if configured) |
| paused | Schedule temporarily paused | Resume or cancel | No (manual resume required) |
| cancelled | Schedule cancelled permanently | No further action | No |

---

## Permission / RBAC Requirements

### Who Can Create Schedules?
- ✅ MGA Admin (master_general_agent_id owner)
- ✅ Broker Admin (if master_group_id owner and schedule scoped to broker)
- ❌ MGA Read-Only (denied)
- ❌ Regular Users (denied)

### Who Can Edit Schedules?
- ✅ Creator (owner_user_id match)
- ✅ MGA Admin (parent MGA)
- ❌ Other users (denied)

### Who Can Execute Schedules?
- ✅ System scheduler (Base44 automation engine)
- ✅ Explicit "Run Now" trigger (only creator or MGA admin)
- ❌ Regular users (cannot manually trigger)

### Who Can View Schedules?
- ✅ Creator (owner_user_id match)
- ✅ MGA Admin (parent MGA)
- ✅ Other users in same MGA (if is_public = true)
- ❌ Other MGA users (denied, scope-enforced)

---

## Scope Enforcement Requirements

### Three-Layer Scope Model (inherited from Gate 7A-3)

1. **MGA Scope (top level)**
   - master_general_agent_id required
   - Only MGA admin can see schedules for their MGA

2. **Broker/Agency Scope (optional mid-level)**
   - master_group_id optional (null = MGA-level)
   - Broker admin can see schedules for their broker
   - Other brokers in same MGA cannot see

3. **Tenant Scope (optional for multi-tenant)**
   - tenant_id optional (null = single tenant)
   - Isolates data across tenants

### Scope Validation
- ✅ Schedule must be owned by same MGA as creator
- ✅ If master_group_id set, creator must belong to that group
- ✅ Execution respects scope (cannot read/write across MGA boundaries)
- ✅ Service layer enforces scope (not frontend)

---

## Safe Payload Requirements

### What Gets Exported
- ✅ Report metadata (name, created date, format)
- ✅ Schedule metadata (frequency, next run, status)
- ✅ Filtered data (respecting Gate 6C export permissions)
- ✅ Audit trail (who created, last execution time)

### What Never Gets Exported
- ❌ Raw database IDs (except context IDs like case_id)
- ❌ Internal file URIs or storage paths
- ❌ Unfiltered sensitive fields (PII, SSN, financial data)
- ❌ User passwords or API keys
- ❌ System internal metadata

### Safe Payload Enforcement
- ✅ reportExportFieldPolicy applied (from Gate 6I-A)
- ✅ reportExportPermissions applied (role-based masking)
- ✅ No raw entity reads (use service layer only)
- ✅ Backend-only export function (mgaReportExport)

---

## Audit Event Requirements

### Events to Log (New)

| Event | Trigger | Data Logged |
|-------|---------|-------------|
| schedule_created | User creates schedule | schedule_id, name, frequency, creator, timestamp |
| schedule_updated | User edits schedule | schedule_id, changes, updater, timestamp |
| schedule_activated | User publishes schedule (draft → active) | schedule_id, activator, timestamp |
| schedule_paused | User pauses schedule | schedule_id, pauser, reason, timestamp |
| schedule_cancelled | User cancels schedule | schedule_id, canceller, reason, timestamp |
| report_execution_started | Scheduler triggers report | schedule_id, execution_id, timestamp |
| report_execution_completed | Report generated successfully | schedule_id, execution_id, file_size, format, timestamp |
| report_execution_failed | Report generation failed | schedule_id, execution_id, error_code, error_message, timestamp |
| report_execution_retried | Retry triggered after failure | schedule_id, execution_id, retry_count, timestamp |
| report_downloaded | User downloads generated report | schedule_id, execution_id, downloader, timestamp |
| report_deleted | User deletes old report | schedule_id, execution_id, deleter, timestamp |

### Audit Table Required
- **ReportExecutionAuditLog** (new entity)
  - schedule_id, execution_id, event_type, actor_email, actor_role
  - detail, outcome (success/failed), timestamp

---

## Scheduler Execution Model

### Technology Choice
**Base44 Scheduled Automations** (preferred over raw cron)

**Rationale:**
- Consistent with existing automation infrastructure
- Built-in audit logging
- Retry/failure handling
- No separate scheduler process
- Feature-flag controlled

### Execution Flow

1. **Schedule Activation** (User publishes schedule)
   - Schedule status → "active"
   - Create Base44 automation for this schedule
   - Automation triggers backend report generation function

2. **Scheduled Time Arrives**
   - Base44 automation triggers (per schedule frequency)
   - Call reportGenerationExecutor backend function
   - Function validates permissions + generates report
   - Write execution result to database + audit log

3. **Report Generated**
   - Store report file (private storage via UploadPrivateFile)
   - Create ReportExecutionLog record
   - Update schedule.last_run_at, execution_count
   - Notify (if delivery configured, deferred to 6J-B/6J-C)

4. **Failure Handling**
   - Log failure + error message
   - Increment failure_count
   - If retry_on_failure enabled: add to retry queue (delay 1 hour, max 3 retries)
   - Audit log the failure

---

## Retry / Failure Handling Model

### Retry Configuration (New Fields)

```json
{
  "retry_on_failure": true,      // Enable automatic retry
  "max_retries": 3,              // Max retry attempts
  "retry_delay_minutes": 60,     // Wait time between retries
  "on_failure_notify": false,    // Deferred: notify on failure (6J-B/6J-C)
}
```

### Retry Logic
- On first failure: Mark as failed, add to retry queue
- Retry queue: Check every 60 minutes
- After 3 retries: Give up, mark as permanently failed
- Each retry attempt: Log in audit trail
- Success on retry: Update status to "completed", stop retrying

### No Cascading Failures
- ✅ Report generation failure does NOT trigger email/webhook delivery
- ✅ Delivery failure (6J-B/6J-C) is independent of generation success
- ✅ Failed report not delivered until explicitly retried/rerun

---

## Feature Flags Required (All Default False)

| Flag | Default | Purpose |
|------|---------|---------|
| REPORT_SCHEDULING_ENABLED | false | Master gate activation flag |
| RECURRING_SCHEDULE_ENABLED | false | Enable recurring schedule creation/editing |
| SCHEDULE_AUTOMATION_ENABLED | false | Enable Base44 automation scheduler |
| REPORT_AUTO_EXECUTION_ENABLED | false | Allow schedules to run automatically |
| REPORT_RETENTION_CLEANUP_ENABLED | false | Enable auto-delete old reports |
| SCHEDULE_RETRY_ENABLED | false | Enable retry on failure |

**Implementation:** All flags in a single featureFlags.js module, false by default. Parent components check flags before rendering UI.

---

## Relationship to Gate 6J-B (Email Delivery)

### Gate 6J-B Dependency
- **Depends On:** Gate 6I-B generates reports successfully
- **Not Depends On:** Reports exist and are accessible
- **Input:** Report execution results + email recipient list
- **Output:** Emails sent to recipients

### Data Contract
```
ReportExecution {
  execution_id,
  schedule_id,
  report_file_uri,  // Private storage URI
  report_format,    // pdf/csv/xlsx
  generated_at,
  success: true
} → [6J-B processes] → Email sent
```

### 6J-B Does NOT Run If
- ❌ Report generation failed (6I-B)
- ❌ Schedule not configured for delivery
- ❌ Email delivery disabled (feature flag)

---

## Relationship to Gate 6J-C (Webhook Delivery)

### Gate 6J-C Dependency
- **Depends On:** Gate 6I-B generates reports successfully
- **Not Depends On:** Reports exist and are accessible
- **Input:** Report execution results + webhook URLs
- **Output:** Webhooks delivered to subscribers

### Data Contract
```
ReportExecution {
  execution_id,
  schedule_id,
  report_file_uri,  // Private storage URI
  report_format,
  generated_at,
  success: true
} → [6J-C processes] → Webhooks delivered
```

### 6J-C Does NOT Run If
- ❌ Report generation failed (6I-B)
- ❌ Schedule not configured for delivery
- ❌ Webhook delivery disabled (feature flag)

---

## Migration / Backfill Implications

### Data Migration
- **Gate 6I-A Schedules:** Can be migrated to 6I-B (change schedule_type from "one_time" to "recurring")
- **Backfill Logic:** One-time schedules remain one_time (no change needed)
- **New Recurring:** Create new schedules for recurring use cases (backward compat maintained)

### No Breaking Changes
- ✅ Existing one_time schedules work as-is
- ✅ New frequency/recurrence_end_date fields optional (null for one_time)
- ✅ schedule_type enum expanded (not restricted)

### Migration Phase
- Deferred pending Gate 6I-B implementation completion
- No operator decision required (automatic)

---

## Risks and Abuse Cases

### Risk: Scheduler Runaway (Uncontrolled Job Spawn)
**Mitigation:**
- ✅ Only Base44 automations can trigger execution (no direct calls)
- ✅ Feature flag gates the entire scheduler (SCHEDULE_AUTOMATION_ENABLED)
- ✅ Max recurrence frequency checked (minimum 5 minutes, maximum 1 year)
- ✅ Execution timeout (max 30 min per report generation)

### Risk: Resource Exhaustion (Too Many Reports)
**Mitigation:**
- ✅ keep_last_n_reports limit (configurable, default 12)
- ✅ auto_delete_on_end flag (delete after recurrence ends)
- ✅ File size limits inherited from Gate 6I-A
- ✅ Storage quota per MGA (tracked separately)

### Risk: Scope Breach (MGA Accessing Other MGA's Schedules)
**Mitigation:**
- ✅ Service layer scope enforcement (mandatory)
- ✅ Query filter by master_general_agent_id (user's MGA)
- ✅ No bypass paths (frontend only calls service layer)
- ✅ Audit log all access attempts

### Risk: Privilege Escalation (Non-Admin Creating Schedules)
**Mitigation:**
- ✅ Role check before schedule creation (MGA admin only)
- ✅ Backend validates creator_role matches
- ✅ Non-admin cannot update status or edit schedule
- ✅ Audit log all permission violations

### Risk: Silent Failures (Failed Report Not Noticed)
**Mitigation:**
- ✅ Audit log all failures
- ✅ status = "failed" visible in UI
- ✅ Manual retry button available
- ✅ Optional failure notification (6J-B/6J-C, not in 6I-B scope)

---

## Minimum Acceptance Test Categories

### Unit Tests (Backend Logic)
- **Schedule creation:** Valid/invalid inputs, permission checks
- **Schedule execution:** Lifecycle states, recurrence calculation
- **Report generation:** Format support, field masking
- **Retry logic:** Retry count, delay, exponential backoff
- **Scope enforcement:** MGA boundary checks, broker scope checks
- **Audit logging:** All events captured
- **Feature flags:** All flags respected

### Integration Tests
- **End-to-end:** Create schedule → Trigger execution → Verify report
- **Recurrence:** Schedule fires at correct times
- **Failure handling:** Failure → Retry → Success
- **Scope isolation:** MGA A cannot see MGA B schedules
- **Permission enforcement:** Non-admin cannot create/edit
- **Safe payload:** No sensitive fields in report

### Security Tests
- **SQL injection:** Inputs sanitized
- **XSS:** Output escaped (if any frontend rendering)
- **Privilege escalation:** Non-admin cannot escalate
- **Scope breach:** Cross-MGA access denied
- **Audit bypass:** All actions logged

### Performance Tests
- **Scheduler latency:** Automation triggers within 5 minutes
- **Report generation:** Completes within 30 minutes (default)
- **Concurrent executions:** Multiple MGAs can schedule simultaneously
- **Database:** Queries use indexes, no full table scans

---

## Recommended Implementation Phases

### Phase 6I-B.1: Backend Infrastructure
**Deliverables:**
- ReportExecutionAuditLog entity
- reportGenerationExecutor backend function
- Report schedule service (create/update/delete/execute)
- Scope enforcement + permission checks
- Safe payload validation
- 60+ unit tests

**Duration:** 2-3 weeks

### Phase 6I-B.2: Scheduler Integration
**Deliverables:**
- Base44 automation creation for schedules
- Cron expression builder (frequency → cron)
- Scheduler trigger handler
- Retry queue + processing
- 50+ integration tests

**Duration:** 1-2 weeks

### Phase 6I-B.3: Frontend UI (Deferred)
**Deliverables:**
- Schedule creation/edit modal (recurring patterns)
- Schedule list with status
- Manual execution button
- Execution history view
- Feature-flag gated components
- 56+ frontend tests

**Duration:** 2-3 weeks

---

## Operator Decisions Required Before Implementation

### Decision 1: Schedule Frequency Bounds
**Question:** What are acceptable min/max frequencies?
- **Option A:** 5 min (min) → 1 year (max)
- **Option B:** 1 hour (min) → 1 year (max)
- **Option C:** 1 day (min) → 1 year (max)

**Recommendation:** Option A (5 min min) — most flexible, still prevents runaway

### Decision 2: Report Retention
**Question:** Default keep_last_n_reports?
- **Option A:** 12 (1 year of monthly reports)
- **Option B:** 52 (1 year of weekly reports)
- **Option C:** Configurable per schedule (default 12)

**Recommendation:** Option C (per-schedule config, default 12)

### Decision 3: Retry Strategy
**Question:** Auto-retry on failure?
- **Option A:** Enabled by default (3 retries, 1 hour delay)
- **Option B:** Disabled by default (opt-in per schedule)
- **Option C:** No retry (manual retry only)

**Recommendation:** Option B (opt-in, more conservative)

### Decision 4: Execution Timeout
**Question:** Max report generation time?
- **Option A:** 15 minutes
- **Option B:** 30 minutes
- **Option C:** 60 minutes

**Recommendation:** Option B (30 min, reasonable for large reports)

### Decision 5: Concurrent Executions
**Question:** Allow multiple reports from same schedule?
- **Option A:** Yes (queue up if overlapping)
- **Option B:** No (skip if still running)
- **Option C:** Configurable per schedule

**Recommendation:** Option B (skip, simpler + safer)

---

## Mandatory Guardrails (Not Implemented)

### Runtime Code
- ❌ No backend functions written yet
- ❌ No scheduler initialization code
- ❌ No database migrations

### Schedule Activation
- ❌ No schedules can execute
- ❌ No Base44 automations created
- ❌ Feature flags all false

### Route/Navigation Exposure
- ❌ No routes added to App.jsx
- ❌ No sidebar/nav entries visible
- ❌ No UI components rendered

### Feature Flag Activation
- ❌ All 6 flags remain false
- ❌ No parent component enables UI
- ❌ User cannot create schedules yet

### Report Delivery
- ❌ No email delivery (6J-B deferred)
- ❌ No webhook delivery (6J-C deferred)
- ❌ Generated reports stored but not sent

### Background Jobs
- ❌ No unaudited tasks running
- ❌ All execution requires audit trail
- ❌ Scheduler cannot run without operator approval

### Previous Gates
- ❌ Gate 6L-B locked (no changes)
- ❌ Gate 7A-3 locked (no changes)
- ❌ Gate 6I-A unchanged (backward compatible)

---

## Summary of Findings

### Existing Infrastructure (Reusable)
✅ MGAReportTemplate entity (complete)  
✅ MGAReportSchedule entity (reservations for 6I-B)  
✅ mgaReportExport backend function (ready)  
✅ reportExportService + permissions + field policy (ready)  
✅ MGAReportTemplateModal + MGAReportScheduleModal (ready)  

### Required for 6I-B (New)
🔄 ReportExecutionAuditLog entity (new)  
🔄 Frequency/recurrence fields in MGAReportSchedule (schema extension)  
🔄 reportGenerationExecutor backend function (new)  
🔄 Report schedule service layer (new)  
🔄 Base44 automation integration (new)  
🔄 Retry queue + processing logic (new)  
🔄 6 feature flags (all false by default)  

### Risks Identified
⚠️ Scheduler runaway (mitigation: feature flag + timeout)  
⚠️ Resource exhaustion (mitigation: retention limits)  
⚠️ Scope breach (mitigation: service layer enforcement)  
⚠️ Silent failures (mitigation: audit logging + UI status)  

### Operator Decisions Needed
🔴 Schedule frequency bounds (min/max)  
🔴 Report retention strategy  
🔴 Retry on failure (enabled/disabled by default)  
🔴 Execution timeout  
🔴 Concurrent execution handling  

---

**Gate 6I-B Discovery & Preflight: COMPLETE**

This analysis provides the foundational design for controlled Gate 6I-B implementation. Proceed to Phase 6I-B.1 (Backend Infrastructure) upon operator approval of operator decisions.