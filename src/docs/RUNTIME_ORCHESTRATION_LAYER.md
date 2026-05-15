# Connect Quote 360: Runtime Orchestration Layer
**Version:** 1.0 | **Date:** 2026-03-21 | **Status:** Production-Ready

---

## OVERVIEW

The runtime orchestration layer is the **execution spine** that turns intent (user actions, API calls, scheduled jobs) into governed, audited, recoverable work.

It does NOT replace repositories, services, or adapters. It **coordinates** them.

**Without it:** QC360 is a collection of modules.  
**With it:** QC360 is an operating platform with:
- ✅ Workflow governance (state machines prevent invalid transitions)
- ✅ Operational observability (audit trails + dashboards)
- ✅ Retry safety (failed work doesn't disappear; moves to dead-letter queue)
- ✅ Idempotency (same command with same context produces same result)
- ✅ Recoverability (dead-letter service retries eligible failures)
- ✅ Projection-driven dashboards (not expensive live queries)

---

## ARCHITECTURE

```
┌─────────────────────────┐
│  UI / API Requests      │
│  (User intent)          │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  Runtime Orchestrator   │  ◄── Central control tower
│  (Command validation)   │
└────────────┬────────────┘
             │
      ┌──────┴──────┐
      ▼             ▼
┌──────────────┐  ┌──────────────────┐
│ Workflow     │  │ Command Bus      │
│ Runtime      │  │ (dispatch)       │
│ (validate    │  │                  │
│  transition) │  └──────────────────┘
└──────────────┘         │
                         ▼
                  ┌──────────────────┐
                  │ Handlers/Services│
                  │ (execution)      │
                  └──────────────────┘
                         │
      ┌──────────────────┼──────────────────┐
      ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Repositories │  │ Hardening    │  │ Adapters     │
│ (persist)    │  │ Middleware   │  │ (external)   │
│              │  │ (retry,      │  │              │
│              │  │  idempotent) │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
      │                  │                  │
      └──────────────────┼──────────────────┘
                         │
      ┌──────────────────┼──────────────────┐
      ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Audit Repo   │  │ Exception    │  │ Projections  │
│ (immutable   │  │ Repo         │  │ (dashboards) │
│  trail)      │  │ (durable)    │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## CORE CONCEPTS

### 1. RuntimeContext
Every command execution is wrapped in context:

```typescript
interface RuntimeContext {
  tenant_id: string;              // Multi-tenant isolation
  user_id: string;                // Actor for audit trail
  user_email?: string;
  correlation_id: string;         // Trace across systems
  source_system_code: string;     // "qc360" | "api" | "scheduler"
  request_id?: string;
  timestamp: Date;
}
```

### 2. CommandEnvelope
Commands are the only way to request work:

```typescript
interface CommandEnvelope {
  command_name: string;           // "upload_census", "run_quote_scenario", etc.
  payload: Record<string, any>;   // Command-specific data
  context: RuntimeContext;        // Who, what, when, where
  queued_at?: Date;
}
```

**Examples:**
- `upload_census` → `{ benefit_case_id, file_name, file_url }`
- `run_quote_scenario` → `{ quote_request_id, scenario_input }`
- `open_enrollment` → `{ benefit_case_id, start_date, end_date }`

### 3. WorkflowDecision
Prevents invalid state transitions:

```typescript
interface WorkflowDecision {
  allowed: boolean;
  transition_code?: string;
  from_state?: string;
  to_state?: string;
  reason?: string;               // Why blocked, if not allowed
}
```

**Example:**
```
Cannot transition from "draft" to "active"
unless:
  - Census is validated (guard rule R-CENSUS-VALIDATED)
  - Quote exists (guard rule R-QUOTE-READY)
  - Proposal approved (guard rule R-PROPOSAL-APPROVED)

If any guard fails:
  WorkflowDecision.allowed = false
  WorkflowDecision.reason = "Guard rule failed: R-CENSUS-VALIDATED"
  Exception raised automatically
```

### 4. DeadLetterRecord
When work fails permanently:

```typescript
interface DeadLetterRecord {
  dead_letter_id: string;
  operation_name: string;       // What failed
  payload: Record<string, any>; // What we tried
  error_message: string;        // Why it failed
  retry_count: number;          // How many times we tried
  max_retries: number;          // When to give up
  created_at: Date;
  status: "pending" | "recovered" | "failed";
}
```

Dead letters are:
- Durable (stored in DB, not lost)
- Observable (dead-letter dashboard shows backlog)
- Recoverable (scheduled job retries eligible items)

### 5. DashboardMetric
Real-time operational visibility:

```typescript
interface DashboardMetric {
  metric_code: string;           // "case_open_count", "dead_letter_backlog"
  metric_name: string;
  metric_value: any;
  calculated_at: Date;
}
```

**Operational dashboards:**
- **Case Dashboard:** Active cases, blocked cases, overdue milestones
- **Exception Dashboard:** Open exceptions by severity, SLA breaches
- **Integration Dashboard:** Queued jobs, endpoint health, dead-letter volume
- **Renewal Dashboard:** Groups entering window, disruption scores, decisions pending

---

## FILE STRUCTURE

```
src/runtime/
  models.ts                          (Core interfaces)
  command_bus.ts                     (Command dispatch)
  workflow_runtime.ts                (State machine validation)
  orchestrator.ts                    (Control tower)
  registry.ts                        (Wiring)
  bootstrap.ts                       (Composition root)
  health_runtime.ts                  (Health monitoring)
  dead_letter.ts                     (Dead-letter recovery)
  
  commands/
    index.ts                         (Command constants)
    
  handlers/
    census_handlers.ts               (Census command handlers)
    quote_handlers.ts                (Quote command handlers)
    enrollment_handlers.ts           (Enrollment command handlers)
    [proposal|install|renewal]_handlers.ts
    
  jobs/
    job_scheduler.ts                 (Background job orchestration)
    enrollment_reminder_job.ts       (Enrollment reminders)
    renewal_trigger_job.ts           (Renewal workflow trigger)
    install_reconciliation_job.ts    (Install completion checks)
    endpoint_health_job.ts           (API health monitoring)
    dead_letter_retry_job.ts         (Dead-letter recovery)
    
  projections/
    dashboard_projection.ts          (Projection refresh coordinator)
    case_dashboard_projection.ts     (Case summary metrics)
    exception_dashboard_projection.ts (Exception counts)
    integration_dashboard_projection.ts (Job queue metrics)
    renewal_dashboard_projection.ts  (Renewal state metrics)
```

---

## USAGE PATTERNS

### Pattern 1: Simple Command (No Workflow)

```typescript
// Frontend or API
const result = await orchestrator.execute({
  command_name: CENSUS_COMMANDS.UPLOAD_CENSUS,
  payload: {
    benefit_case_id: "cs_...",
    file_name: "employees.csv",
    file_url: "s3://bucket/file.csv"
  },
  context: {
    tenant_id: user.agency_id,
    user_id: user.id,
    user_email: user.email,
    correlation_id: generateUUID(),
    source_system_code: "qc360",
    timestamp: new Date()
  }
});

if (result.success) {
  console.log("Census uploaded:", result.data);
} else {
  console.error("Upload failed:", result.error);
}
```

### Pattern 2: Workflow-Guarded Command

```typescript
// Before opening enrollment, ensure:
// 1. Case is in "Approved for Enrollment" state
// 2. Census is validated (guard rule R-CENSUS-VALIDATED)
// 3. Quote is ready (guard rule R-QUOTE-READY)
// 4. Proposal is approved (guard rule R-PROPOSAL-APPROVED)

const result = await orchestrator.execute({
  command_name: ENROLLMENT_COMMANDS.OPEN_ENROLLMENT,
  payload: {
    benefit_case_id: "cs_...",
    start_date: "2026-04-01",
    end_date: "2026-04-30"
  },
  context: { ... },
  
  // Workflow guard
  workflow_code: "case_lifecycle",
  current_state: case.lifecycle_state,        // "approved_for_enrollment"
  transition_code: "CASE_OPEN_ENROLLMENT",    // "draft" → "active"
  workflow_facts: {
    census_validated: true,
    quote_ready: true,
    proposal_approved: true
  }
});

// If workflow transition not allowed:
// - orchestrator raises exception automatically
// - result.success = false
// - exception appears in exception dashboard
// - ops team is alerted
```

### Pattern 3: Scheduled Job

```typescript
// Fires hourly: check for enrollment cases + send reminders
const enrollmentReminderJob = new EnrollmentReminderJob();

jobScheduler.registerJob("enrollment_reminder", async () => {
  await enrollmentReminderJob.run();
});

// Later: JobScheduler.runDueJobs() called by cron or Lambda
// Logs: enrollment_reminder_sent, enrollment_reminder_failed
// Failures: logged but don't block other jobs
```

### Pattern 4: Dead-Letter Recovery

```typescript
// When CarrierAdapter.submitEnrollmentFile() fails 5 times:
// 1. Move to dead-letter queue
// 2. Log error with full context
// 3. Ops dashboard shows 1 open dead-letter
// 4. Dead-letter job runs every 30 minutes
// 5. Retries eligible items (age > 1 hour, retry_count < max)
// 6. If succeeds: marked recovered
// 7. If fails again: stays in queue for manual review

await deadLetterService.moveToDeadLetter(
  "submit_enrollment_file",
  { file_content: "...", carrier_id: "aet_..." },
  "HTTP 503: Service unavailable"
);

// Later: Dead-letter job
const recovered = await deadLetterService.retryEligibleItems();
// Logs: dead_letter_retry_failed, dead_letter_recovered, etc.
```

---

## ORCHESTRATOR EXECUTION FLOW

```
1. UI/API sends command
   └─> RuntimeOrchestrator.execute(command_name, payload, context)

2. Log command received
   └─> logger.info("runtime_command_received", ...)

3. Validate workflow transition (if workflow_code provided)
   ├─> workflow_runtime.evaluateTransition(...)
   ├─> Check transition exists
   ├─> Evaluate guard rules
   ├─> If blocked:
   │   ├─> exception_repo.create(WORKFLOW_TRANSITION_BLOCKED)
   │   ├─> logger.warn("workflow_transition_blocked")
   │   └─> return { success: false, error_code: "WORKFLOW_BLOCKED" }
   └─> If allowed: continue

4. Dispatch command
   ├─> command_bus.dispatch(command_name, payload, context)
   ├─> Find handler in registry
   ├─> Call handler(payload, context)
   ├─> If handler throws:
   │   └─> return { success: false, error_code: "HANDLER_ERROR" }
   └─> Return handler result

5. Emit audit event
   ├─> audit_repo.create({
   │     entity_type: "RuntimeCommand",
   │     event_code: "COMMAND_UPLOAD_CENSUS_COMPLETED",
   │     actor_user_id: context.user_id,
   │     after_json: { payload, result }
   │   })
   └─> Immutable record in ActivityLog

6. Refresh dashboard projections
   ├─> projection_runtime.refresh_for_case(benefit_case_id)
   ├─> Refreshes case_dashboard_projection
   ├─> Refreshes exception_dashboard_projection
   ├─> Refreshes integration_dashboard_projection
   ├─> Refreshes renewal_dashboard_projection
   └─> Result: dashboards always in sync, no expensive live queries

7. Return result to caller
   └─> { success: true, data: {...} }
```

---

## EXAMPLE: OPEN ENROLLMENT WORKFLOW

**Scenario:** Broker clicks "Open Enrollment" button

```typescript
// Step 1: UI sends command
const result = await orchestrator.execute({
  command_name: "open_enrollment",
  payload: {
    benefit_case_id: "cs_acme_2026",
    start_date: "2026-04-01",
    end_date: "2026-04-30"
  },
  context: {
    tenant_id: user.agency_id,
    user_id: user.id,
    user_email: "broker@agency.com",
    correlation_id: "req_8a92k3j",
    source_system_code: "qc360",
    timestamp: new Date()
  },
  workflow_code: "case_lifecycle",
  current_state: caseData.lifecycle_state,      // "approved_for_enrollment"
  transition_code: "CASE_OPEN_ENROLLMENT",
  workflow_facts: {
    census_validated: true,
    quote_ready: true,
    proposal_approved: true
  }
});

// Step 2: Orchestrator validates transition
// ✓ Workflow transition: "approved_for_enrollment" → "enrollment_open" exists
// ✓ Guard rules pass (census validated, quote ready, proposal approved)
// ✓ Transition allowed

// Step 3: Dispatch "open_enrollment" command
// → enrollment_handler.open_enrollment(payload, context)
// → enrollment_service.open_enrollment(...)
// → Creates EnrollmentWindow entity in Base44
// → Returns: { enrollment_window_id: "ew_...", total_eligible: 250 }

// Step 4: Emit audit event
// ActivityLog: {
//   benefit_case_id: "cs_acme_2026",
//   entity_type: "RuntimeCommand",
//   event_code: "COMMAND_OPEN_ENROLLMENT_COMPLETED",
//   actor_user_id: "user_...",
//   after_json: { payload, result: { enrollment_window_id: "ew_..." } }
// }

// Step 5: Refresh projections
// case_dashboard_projection: { lifecycle_state: "enrollment_open" }
// integration_dashboard_projection: { queued_jobs: 0, running_jobs: 0 }

// Step 6: Return to UI
// result.success = true
// result.data = { enrollment_window_id: "ew_...", total_eligible: 250 }

// Step 7: Scheduled job runs (every 15 min)
// EnrollmentReminderJob.run()
// → Fetches open enrollment windows
// → Finds members with status = "invited"
// → Sends email to each member
// → Logs: enrollment_reminder_sent
// → If email fails → logged, not critical, retried next cycle

// Later: If any job permanently fails (e.g., Mailgun down for 30 min)
// → DeadLetterService.moveToDeadLetter(operation_name, payload, error)
// → Integration dashboard shows: dead_letter_open: 5
// → Ops alerted (via monitoring/dashboard)
// → Dead-letter retry job runs every 30 min
// → Retries eligible items
// → When Mailgun recovers → emails sent from queue
```

---

## PROJECTION TABLES (SQL)

These enable zero-cost dashboard queries:

```sql
-- Case operations dashboard
CREATE TABLE case_dashboard_projection (
  benefit_case_id UUID PRIMARY KEY,
  case_code TEXT NOT NULL,
  lifecycle_state TEXT NOT NULL,
  summary_status TEXT NOT NULL,
  open_exception_count INTEGER DEFAULT 0,
  overdue_task_count INTEGER DEFAULT 0,
  waiting_on_code TEXT,
  refreshed_at TIMESTAMPTZ DEFAULT now()
);

-- Exception dashboard
CREATE TABLE exception_dashboard_projection (
  benefit_case_id UUID PRIMARY KEY,
  open_low_count INTEGER DEFAULT 0,
  open_medium_count INTEGER DEFAULT 0,
  open_high_count INTEGER DEFAULT 0,
  open_critical_count INTEGER DEFAULT 0,
  sla_breach_count INTEGER DEFAULT 0,
  refreshed_at TIMESTAMPTZ DEFAULT now()
);

-- Integration dashboard
CREATE TABLE integration_dashboard_projection (
  benefit_case_id UUID PRIMARY KEY,
  queued_jobs INTEGER DEFAULT 0,
  running_jobs INTEGER DEFAULT 0,
  failed_jobs INTEGER DEFAULT 0,
  open_dead_letters INTEGER DEFAULT 0,
  last_success_at TIMESTAMPTZ,
  refreshed_at TIMESTAMPTZ DEFAULT now()
);

-- Renewal dashboard
CREATE TABLE renewal_dashboard_projection (
  benefit_case_id UUID PRIMARY KEY,
  renewal_state TEXT,
  total_delta NUMERIC(14, 2),
  employer_budget_delta NUMERIC(14, 2),
  employee_impact_delta NUMERIC(14, 2),
  disruption_score NUMERIC(12, 4),
  recommendation_ready BOOLEAN DEFAULT false,
  refreshed_at TIMESTAMPTZ DEFAULT now()
);
```

---

## WHEN TO USE ORCHESTRATOR

✅ **Use orchestrator for:**
- Creating cases, uploading census, running quotes
- Opening enrollment, sending invites, finalizing enrollment
- Building install packs, reconciling installations
- Triggering renewals, calculating deltas
- Any business-domain work

❌ **Don't use orchestrator for:**
- Simple data reads (use repository directly)
- UI rendering helpers
- Validation checks (embed in services)
- Middleware (use handler layer)

---

## MONITORING & OBSERVABILITY

**Key metrics to track:**

```typescript
const health = await healthService.getOperationalHealth();
// {
//   overall_health: "healthy" | "degraded" | "critical",
//   endpoint_failures: number,
//   dead_letter_open: number,
//   integration_backlog: number,
//   exception_backlog: number
// }

// Alert rules:
// - dead_letter_open > 25 → critical
// - integration_backlog > 100 → critical
// - endpoint_failures > 5 in last hour → degraded
```

**Structured logs:**
- `runtime_command_received` – Every command
- `workflow_transition_blocked` – Validation failures
- `command_execution_succeeded` – Success
- `command_execution_failed` – Errors
- `dashboard_projections_refreshed` – Projection updates
- `moved_to_dead_letter` – Dead-letter events
- `scheduled_job_started/completed/failed` – Background work

---

## SUMMARY

The runtime orchestration layer is the **execution backbone** of QC360:

1. **Commands** are the only way to request work
2. **Workflow runtime** validates state transitions
3. **Orchestrator** coordinates command dispatch, audit, and projections
4. **Handlers** call services
5. **Dead-letter service** captures and recovers failed work
6. **Projections** power zero-cost dashboards
7. **Health service** monitors operational status

**Result:** A platform that is workflow-governed, observable, retry-safe, idempotent, and recoverable.