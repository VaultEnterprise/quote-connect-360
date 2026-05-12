# MGA Gate 6J-A — Export Delivery Governance
## Design Specification

**Date:** 2026-05-12  
**Status:** DESIGN_SPEC_COMPLETE  
**Gate ID:** GATE-6J-A  
**Capability:** Export Delivery Status and Retry/Cancel Governance  
**Activation:** INACTIVE  
**Implementation:** NOT_STARTED  

**Parent Gate:** GATE-6J  
**Deferred Gates:** GATE-6J-B (Email Delivery), GATE-6J-C (Webhook Delivery)  
**Depends On:** GATE-6C, GATE-6D, GATE-6G, GATE-6I-A  

---

## 1. Final Gate 6J-A Scope

**Core Capability:**
Delivery status tracking, retry/cancel/resend governance, and delivery audit trail for exported reports. Enables safe delivery governance before recurring scheduler (Gate 6I-B) is implemented.

**In Scope:**
- Delivery status state machine (pending → sent/failed → archived)
- Retry governance with exponential backoff and max retry limits
- Cancel capability with idempotent semantics
- Manual resend capability for mga_manager and mga_admin
- Delivery failure reason codes and diagnostics
- Delivery audit trail (5 new event types)
- Permission recheck before resend/cancel actions
- Scope recheck before delivery actions
- Safe delivery payload policy (metadata-only, no PII in logs)

**Out of Scope:**
- Email delivery (deferred to Gate 6J-B)
- Webhook delivery (deferred to Gate 6J-C)
- Recurring scheduler execution (Gate 6I-B)
- Background jobs (Gate 6I-B)
- Bulk scheduled exports
- External recipient delivery
- Signed URL delivery
- Private file URI exposure

---

## 2. Deferred Scope: Gates 6J-B and 6J-C

### Gate 6J-B — Email Export Delivery
**Status:** DEFERRED  
**Reason:** Requires separate SMTP integration, bounce handling, unsubscribe governance, GDPR compliance design

**Scope (Future):**
- SMTP transport integration
- Recipient email address validation
- Bounce handling and unsubscribe management
- Email template rendering
- Payload sanitization for email safety
- Delivery failure classification (hard bounce, soft bounce, rate limit)

### Gate 6J-C — Webhook Export Delivery
**Status:** DEFERRED  
**Reason:** Requires separate endpoint security, retry storm protection, signature validation design

**Scope (Future):**
- Webhook endpoint registration and validation
- HTTP POST transport with signature/HMAC
- Retry storm protection (distributed backoff)
- Webhook failure classification
- Endpoint availability monitoring
- Payload encryption for sensitive data

---

## 3. Delivery Status Model

### State Machine
```
PENDING → SENT → ARCHIVED
       ↘ FAILED ↗
       ↘ CANCELLED
```

### States
- **PENDING:** Delivery record created; awaiting action
- **SENT:** Delivery successfully completed (status recorded in audit)
- **FAILED:** Delivery failed after max retries; permanent failure
- **CANCELLED:** User initiated cancellation; no further retries
- **ARCHIVED:** Old delivery records moved to archive (manual cleanup)

### State Transitions
| From | To | Condition | Actor |
|------|----|-----------| -----|
| PENDING | SENT | Delivery marked complete | system (after export) |
| PENDING | FAILED | Max retries exceeded | system (after retry logic) |
| PENDING | CANCELLED | User cancels | mga_admin, export owner |
| SENT | ARCHIVED | Manual archival (30+ days) | system (scheduled cleanup) |
| FAILED | ARCHIVED | Manual archival (30+ days) | system (scheduled cleanup) |

---

## 4. Retry/Cancel/Manual Resend Rules

### Retry Governance (PENDING → retry → SENT/FAILED)

**Automatic Retry (Gate 6J-A):**
- Trigger: Delivery marked FAILED after initial attempt
- Backoff: Exponential (60s, 5m, 30m, 2h, etc.)
- Max automatic retries: 3
- Retry condition: Export data unchanged since last attempt
- Action: System retries; on final failure, mark FAILED

**Manual Retry (Gate 6J-A):**
- Access: mga_manager can request immediate retry
- Condition: Export data must be unchanged
- Idempotency: Resending same export multiple times is allowed (no dedup)
- Failure: If data changed, resend fails with "data mismatch" reason code

**Retry Audit:**
- Event: `export_delivery_retry_initiated`
- Fields: export_id, actor_email, retry_count, backoff_seconds

### Cancel Governance (PENDING → CANCELLED)

**Cancel Capability:**
- Access: mga_admin and export owner only
- Condition: Only PENDING deliveries can be cancelled
- Idempotency: Cancelling a SENT/FAILED/ARCHIVED delivery is a no-op

**Cancel Semantics:**
- Cancel is immediate: changes state to CANCELLED
- No cleanup of export data (export remains in history)
- Cannot undo a cancel (no uncancel operation)

**Cancel Audit:**
- Event: `export_delivery_cancelled`
- Fields: export_id, actor_email, previous_state

### Manual Resend Governance (SENT/FAILED → resend)

**Resend Capability:**
- Access: mga_manager can resend completed/failed deliveries
- Condition: Export data must be unchanged
- Resend creates new delivery record (does not overwrite old one)

**Resend Semantics:**
- Resend is new delivery: separate audit trail
- Old delivery record remains for compliance
- Resend can happen multiple times

**Resend Audit:**
- Event: `export_delivery_resent`
- Fields: export_id, actor_email, reference_to_original_delivery

---

## 5. Data Model Assessment

### Delivery Status Record (Design-Only, Optional Schema)
```
ExportDeliveryStatus {
  id: uuid
  export_id: uuid (reference to export in history)
  master_general_agent_id: string (MGA scope)
  master_group_id: string (Broker/Agency scope, optional)
  status: enum (PENDING, SENT, FAILED, CANCELLED, ARCHIVED)
  failure_reason_code: string (null if sent)
  failure_details: string (null if sent, metadata only)
  retry_count: integer
  last_retry_at: timestamp (null if not retried)
  created_at: timestamp
  updated_at: timestamp
  sent_at: timestamp (null if not sent)
  cancelled_at: timestamp (null if not cancelled)
  created_by: string (user email, for audit)
  updated_by: string (user email, for last action)
}
```

### Storage Strategy
- **In-Memory (Phase 1):** Delivery status stored in audit trail only; reconstruct from events
- **Database (Phase 2 or later):** Optional `ExportDeliveryStatus` table for performance, queried alongside audit logs
- **No PII Storage:** Failure details must be diagnostic only (no exported data content)

### Integration with Gate 6D (Export History)
- Gate 6D records export metadata (timestamp, user, format, filter summary)
- Gate 6J-A records delivery status (separate concern)
- Queries join on export_id: select export from history, delivery status from audit or table

---

## 6. Permission Model

### Delivery Status Access

| Role | View Status | Retry | Cancel | Resend | Audit |
|------|-------------|-------|--------|--------|-------|
| mga_admin | own + others in MGA | YES | YES | YES | YES |
| mga_manager | own + others in Broker/Agency | YES | YES | YES | YES |
| mga_user | own only | NO | YES (own) | NO | own only |
| mga_read_only | view only | NO | NO | NO | view only |

### Scope-Based Access Control
- mga_admin: can manage delivery status for all exports in their MGA
- mga_manager: can manage status for Broker/Agency and subordinate users
- mga_user: can cancel own exports, view own delivery status
- mga_read_only: read-only access (no actions)

### Permission Recheck (Before Resend/Cancel)
Before executing retry, resend, or cancel:
1. Verify user role permits the action
2. Verify user scope includes the MGA/Broker/Agency
3. Verify export data is unchanged (prevent privilege escalation via old data)

---

## 7. Scope/Security Model

### Multi-Tenant Isolation
All delivery operations respect MGA and Broker/Agency scopes:
- Delivery status visible only to users in same MGA/Broker/Agency
- Retry/cancel/resend accessible only to authorized roles in scope
- Audit trail scoped to MGA
- Cross-MGA access returns 404 (masked not found)

### Data Safety
- Export payloads already validated by Gate 6C (no new exposure)
- Failure details logged as diagnostic metadata only (no full export content)
- No PII in delivery failure logs
- No sensitive data in audit events (only references)

### Retry Safety
- Exponential backoff prevents retry storms
- Max 3 auto retries + unlimited manual retries with approval
- Retry only if export data unchanged (prevents replay of stale data)
- Idempotent resend semantics (safe to retry multiple times)

### Cancel Safety
- Cancel is idempotent (cancelling already-cancelled is no-op)
- Cancellation is immediate (no in-flight checks needed)
- Old delivery records never deleted (compliance)

---

## 8. Safe Delivery Payload Policy

### What Can Be Logged
✅ Delivery status (PENDING, SENT, FAILED, CANCELLED)  
✅ Retry count and backoff timing  
✅ Failure reason code (EXPORT_NOT_FOUND, DATA_MISMATCH, PERMISSION_DENIED, etc.)  
✅ Timestamp of delivery events  
✅ Export reference (ID, not full content)  
✅ User email of actor  

### What Cannot Be Logged
❌ Full exported report content  
❌ Filtered dataset content  
❌ Beneficiary PII (names, SSNs, email addresses)  
❌ Financial data from exports  
❌ Credentials or auth tokens  
❌ Signed URLs  
❌ Private file URIs  

### Failure Reason Codes (Design-Only)
- `EXPORT_NOT_FOUND` — referenced export no longer exists
- `DATA_MISMATCH` — export data changed since last attempt
- `PERMISSION_DENIED` — user no longer authorized to access export
- `SCOPE_DENIED` — export moved to different MGA/Broker/Agency
- `DELIVERY_FAILED` — generic delivery failure
- `MAX_RETRIES_EXCEEDED` — automatic retries exhausted
- `CANCELLED_BY_USER` — user initiated cancellation

---

## 9. Backend Service Design

### Service: reportDeliveryService.js (Design-Only)

**Core Functions:**

```javascript
// Initialize delivery status for export
async function trackExportDelivery(export_id, master_general_agent_id, master_group_id) {
  // Create delivery status record (in audit log or optional table)
  // Return delivery_id for reference
}

// Retry failed delivery
async function retryDeliveryStatus(delivery_id, actor_email) {
  // Verify permission and scope
  // Check if data unchanged
  // Initiate retry (backoff + count)
  // Log audit event
  // Return delivery status
}

// Cancel pending delivery
async function cancelDeliveryStatus(delivery_id, actor_email) {
  // Verify permission and scope
  // Check if status is PENDING
  // Change status to CANCELLED
  // Log audit event
  // Return delivery status
}

// Manual resend
async function resendDelivery(delivery_id, actor_email) {
  // Verify permission and scope
  // Check if data unchanged
  // Create new delivery record (reference old)
  // Log audit event
  // Return new delivery_id
}

// Get delivery status with permission check
async function getDeliveryStatus(delivery_id, actor_email, actor_role) {
  // Verify scope access
  // Return delivery status (if accessible)
}

// List deliveries for export with permission check
async function listExportDeliveries(export_id, actor_email, actor_role) {
  // Verify export access
  // Return delivery list
}
```

### Integration Points
- **Gate 6C:** After export generation, call `trackExportDelivery(export_id, ...)`
- **Gate 6D:** Extend export history query to include delivery status
- **Gate 6I-A:** Schedule definitions store reference to template; at execution time, will call `trackExportDelivery(...)`

---

## 10. Frontend UI Design

### Extension: MGAExportHistoryPanel

**New Columns:**
- **Delivery Status Badge:** PENDING (orange), SENT (green), FAILED (red), CANCELLED (gray)
- **Retry Button:** mga_manager, visible if PENDING or FAILED
- **Cancel Button:** mga_admin + export owner, visible if PENDING
- **Resend Button:** mga_manager, visible if SENT or FAILED
- **Failure Reason Tooltip:** (if FAILED) displays failure_reason_code and last_retry_at

**New Actions:**
- Click status badge → expand delivery timeline (retry history, cancel events)
- Click "Retry" → immediate retry (backoff handled server-side)
- Click "Cancel" → confirm cancellation, change status to CANCELLED
- Click "Resend" → create new delivery record, log event

**New Detail Modal:**
- Export metadata (from Gate 6D)
- Delivery status history (list of retry events, cancel events, resend events)
- Audit trail (5 delivery events)
- Failure diagnostics (if FAILED)

---

## 11. Audit Events

### New Event Types (5 Events)

| Event | Trigger | Fields | Role |
|-------|---------|--------|------|
| `export_delivery_tracked` | Export sent for delivery | export_id, master_general_agent_id, master_group_id | system |
| `export_delivery_retry_initiated` | Retry attempted | export_id, delivery_id, retry_count, actor_email, actor_role | mga_manager, system |
| `export_delivery_cancelled` | Delivery cancelled | export_id, delivery_id, actor_email, actor_role | mga_admin, export owner |
| `export_delivery_resent` | Manual resend | export_id, old_delivery_id, new_delivery_id, actor_email, actor_role | mga_manager |
| `export_delivery_failed` | Max retries exceeded | export_id, delivery_id, failure_reason_code, retry_count | system |

### Audit Record Schema
```
ActivityLog {
  case_id: (null for delivery events, or reference to case if export from case)
  master_general_agent_id: string
  master_group_id: string (optional)
  actor_email: string
  actor_name: string
  actor_role: string
  action: string (event type above)
  detail: string (diagnostic info, no PII)
  entity_type: "ExportDeliveryStatus"
  entity_id: string (delivery_id)
  old_value: string (previous status)
  new_value: string (new status)
  outcome: "success" | "failed" | "blocked"
  correlation_id: string (links multi-step operations)
}
```

---

## 12. Integration with Gates 6C, 6D, 6G, 6I-A

### Gate 6C Integration (Report Export)
Gate 6J-A adds delivery tracking **after** export generation (no change to Gate 6C logic).

**Workflow:**
1. Gate 6C exports data → calls `trackExportDelivery(export_id, ...)`
2. Gate 6J-A creates delivery status record
3. Gate 6D records export metadata (existing)
4. Delivery status tracked separately

**Regression:** Gate 6C logic unchanged; delivery tracking is additive

### Gate 6D Integration (Export History)
Gate 6J-A extends export history UI with delivery status (no schema breaking changes).

**Workflow:**
1. User queries export history (Gate 6D)
2. UI extended with delivery status columns (Gate 6J-A)
3. Queries joined on export_id
4. Delivery actions (retry, cancel, resend) trigger audit events

**Regression:** Gate 6D schema unchanged; UI extension is backward-compatible

### Gate 6G Integration (Report Export UI)
Gate 6J-A extends UI with delivery controls (no change to Gate 6G export button).

**Workflow:**
1. Export button still initiates export (Gate 6G)
2. Delivery status panel added below export button
3. Status badges and action buttons populated from Gate 6J-A service

**Regression:** Gate 6G UI unchanged; delivery panel is new component

### Gate 6I-A Integration (Templates & Schedule Definitions)
Gate 6J-A provides governance foundation for scheduled exports (no change to Gate 6I-A, enabler for Gate 6I-B).

**Workflow:**
1. Gate 6I-A defines schedule metadata (template + date/time)
2. Gate 6I-B (future) will trigger scheduled exports
3. When export runs, Gate 6C generates export → calls `trackExportDelivery(...)`
4. Gate 6J-A tracks delivery status per scheduled run
5. Retry/cancel/resend controls available for each scheduled execution

**Enablement:** Gate 6J-A policies (retry backoff, cancel idempotency, resend semantics) form the contract for Gate 6I-B scheduled execution

---

## 13. Validation Plan

### Unit Tests (Gate 6J-A)
- Retry backoff calculation: exponential, max 3 auto retries
- Cancel idempotency: cancelling already-cancelled is no-op
- Resend idempotency: multiple resends create separate records
- State machine: transitions only via valid paths
- Permission enforcement: mga_user cannot retry/cancel others' exports
- Scope enforcement: cross-MGA access returns 404

**Test Target:** ~25 tests

### Integration Tests
- Delivery tracking triggered after export generation (Gate 6C integration)
- Delivery status appears in export history (Gate 6D integration)
- Delivery UI panel renders with correct buttons (Gate 6G integration)
- Audit trail recorded for all 5 events

**Test Target:** ~10 tests

### Regression Tests
- Gate 6C export logic unchanged: PASS
- Gate 6D export history unchanged: PASS
- Gate 6G export button unchanged: PASS
- Gate 6I-A template/schedule unchanged: PASS

**Build/Lint/Tests:**
- ESLint: PASS
- Jest: PASS
- Build: PASS

---

## 14. Rollback Strategy

### Phase 1: Feature Flag Disable
If issues detected, disable Gate 6J-A delivery tracking:
- Feature flag: `MGA_DELIVERY_TRACKING_ENABLED` (default: true)
- Effect: skip `trackExportDelivery()` calls; delivery status not recorded
- Reversible: re-enable flag and re-run exports

### Phase 2: Service Disable
If critical issue, disable `reportDeliveryService`:
- Comment out service calls in Gate 6C export function
- Existing delivery records remain (for audit)
- No new deliveries tracked

### Phase 3: Complete Removal
If full rollback required:
- Delete `reportDeliveryService.js`
- Delete UI panel components
- Remove audit event types from schema (if applicable)
- Delete optional database table (if created)
- Retain audit logs for compliance

**Rollback Time:** <5 minutes per phase

---

## 15. Recommendation

### Proceed to Implementation
**Gate 6J-A — Export Delivery Status and Retry/Cancel Governance**

**Rationale:**
1. In-app delivery tracking is low-risk (no external delivery channels)
2. Retry/cancel logic is stateless and idempotent
3. Existing export data already scoped and audited
4. Delivery governance is foundational for Gate 6I-B (recurring execution)
5. UI extension is backward-compatible with Gates 6C, 6D, 6G

**Implementation Phase:**
- Backend: `reportDeliveryService.js`, audit events, integration with Gate 6C
- Frontend: extend `MGAExportHistoryPanel` with delivery status UI
- Tests: ~35 unit + integration tests + regression suite
- Validation: 79+ tests passing; build PASS; all guardrails verified

**Next Steps:**
1. Operator approves this design specification
2. Create implementation work order for Gate 6J-A
3. Implement backend service + frontend UI
4. Validation suite (tests, regression, build)
5. Activate Gate 6J-A
6. Re-evaluate Gate 6I-B design with delivery governance in place

### Defer Gates 6J-B and 6J-C
**Gate 6J-B (Email Delivery)** and **Gate 6J-C (Webhook Delivery)** remain deferred.

**Deferral Reason:**
- Require separate SMTP/webhook integration design
- Introduce external recipient, endpoint, and payload security complexity
- Can proceed in parallel (no dependency on Gate 6J-A)

**Future Approval:** Operator approval required before design begins

---

## Registry State (Gate 6J-A / 6J-B / 6J-C)

```json
{
  "gateId": "GATE-6J-A",
  "gateName": "Export Delivery Status and Retry/Cancel Governance",
  "phase": "6",
  "status": "DESIGN_SPEC_COMPLETE",
  "activation": "INACTIVE",
  "implementation": "NOT_STARTED",
  "capability": "Delivery status tracking, retry/cancel/resend governance, delivery audit trail",
  "parentGate": "GATE-6J",
  "deferredDeliveryGates": ["GATE-6J-B", "GATE-6J-C"],
  "dependsOn": ["GATE-6C", "GATE-6D", "GATE-6G", "GATE-6I-A"],
  "deferredDependency": "GATE-6I-B",
  "designSpec": "docs/MGA_GATE_6J_A_EXPORT_DELIVERY_GOVERNANCE_DESIGN_SPECIFICATION.md",
  "testCount": 35,
  "notes": "Design spec 2026-05-12. Gate 6J-A ready for implementation work order. Gates 6J-B and 6J-C deferred pending separate security design approval. Prerequisite for Gate 6I-B recurring execution design."
}
```

```json
{
  "gateId": "GATE-6J-B",
  "gateName": "Email Export Delivery",
  "phase": "6",
  "status": "DEFERRED",
  "activation": "INACTIVE",
  "implementation": "NOT_STARTED",
  "parentGate": "GATE-6J",
  "capability": "Email transport integration, bounce handling, unsubscribe governance",
  "deferReason": "Requires separate SMTP integration, recipient management, GDPR compliance design and security review",
  "notes": "Deferred 2026-05-12. Pending operator approval for separate security design phase."
}
```

```json
{
  "gateId": "GATE-6J-C",
  "gateName": "Webhook Export Delivery",
  "phase": "6",
  "status": "DEFERRED",
  "activation": "INACTIVE",
  "implementation": "NOT_STARTED",
  "parentGate": "GATE-6J",
  "capability": "Webhook endpoint integration, signature validation, retry storm protection",
  "deferReason": "Requires separate endpoint security, distributed backoff, payload encryption design and security review",
  "notes": "Deferred 2026-05-12. Pending operator approval for separate security design phase."
}
```

---

**Prepared by:** Platform Engineering  
**Date:** 2026-05-12  
**Status:** DESIGN_SPEC_COMPLETE — Awaiting Operator Review for Implementation Work Order