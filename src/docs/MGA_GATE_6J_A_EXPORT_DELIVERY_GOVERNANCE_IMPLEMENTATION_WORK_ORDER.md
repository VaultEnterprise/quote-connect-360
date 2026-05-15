# MGA Gate 6J-A — Export Delivery Governance
## Implementation Work Order

**Date:** 2026-05-12  
**Status:** IMPLEMENTATION_WORK_ORDER_COMPLETE  
**Gate ID:** GATE-6J-A  
**Capability:** Export Delivery Status and Retry/Cancel Governance  
**Activation:** INACTIVE  
**Implementation:** NOT_STARTED  

**Parent Gate:** GATE-6J  
**Deferred Gates:** GATE-6J-B (Email Delivery), GATE-6J-C (Webhook Delivery)  
**Depends On:** GATE-6C, GATE-6D, GATE-6G, GATE-6I-A  

---

## 1. Implementation Objective

Enable MGA administrators and managers to track export delivery status, retry failed deliveries, cancel pending deliveries, and manually resend completed exports. Establish delivery governance framework before recurring scheduler (Gate 6I-B) is implemented.

**In-App Workflow:**
1. User initiates export via Gate 6C
2. Export generated and delivery status tracked
3. Delivery status visible in Gate 6D export history UI
4. Authorized roles can retry, cancel, or resend exports
5. All delivery actions audited and logged

**Outcome:** Safe, auditable delivery governance enabling future Gate 6I-B (recurring execution) design.

---

## 2. Approved Gate 6J-A Scope

**Core Capabilities (IN SCOPE):**
- ✅ Delivery status tracking (PENDING → SENT/FAILED/CANCELLED)
- ✅ Delivery failure reason codes (EXPORT_NOT_FOUND, DATA_MISMATCH, PERMISSION_DENIED, etc.)
- ✅ Retry governance (exponential backoff, max 3 auto retries, manual retry)
- ✅ Cancel governance (idempotent, status CANCELLED)
- ✅ Manual resend (new delivery record for completed/failed exports)
- ✅ Delivery audit trail (5 new event types)
- ✅ Safe delivery payload policy (metadata-only, no PII in logs)
- ✅ Permission recheck before delivery action (retry, cancel, resend)
- ✅ Scope recheck before delivery action (MGA/Broker-Agency isolation)
- ✅ Integration with Gate 6D (extend export history UI)
- ✅ Integration with Gate 6I-A (delivery status scoped to schedule definitions)

---

## 3. Deferred Scope: Gates 6J-B and 6J-C

**Gate 6J-B — Email Export Delivery (DEFERRED)**
- ❌ SMTP integration
- ❌ Recipient email validation
- ❌ Bounce handling
- ❌ Unsubscribe governance
- ❌ Email template rendering

**Gate 6J-C — Webhook Export Delivery (DEFERRED)**
- ❌ Webhook endpoint registration
- ❌ HTTP POST transport
- ❌ Signature/HMAC validation
- ❌ Retry storm protection
- ❌ Endpoint availability monitoring

**Other Explicitly Deferred:**
- ❌ Recurring scheduler execution (Gate 6I-B)
- ❌ Background jobs
- ❌ Bulk scheduled exports
- ❌ External recipient delivery
- ❌ Signed URL delivery
- ❌ Private file URI delivery
- ❌ Exported content delivery

---

## 4. Files Authorized for Future Change

**New Files (Create During Implementation):**
- `entities/MGAExportDelivery.json` — delivery status schema (design-only or optional table)
- `lib/mga/services/exportDeliveryService.js` — service layer for delivery status, retry, cancel, resend
- `components/mga/MGAExportDeliveryStatusPanel.jsx` — delivery status UI panel
- `components/mga/MGAExportDeliveryActionMenu.jsx` — retry, cancel, resend action buttons
- `components/mga/MGAExportDeliveryRetryDialog.jsx` — retry confirmation dialog
- `components/mga/MGAExportDeliveryCancelDialog.jsx` — cancel confirmation dialog
- `components/mga/MGAExportDeliveryTimeline.jsx` — delivery history timeline
- `tests/mga/gate6j-a-export-delivery-governance.test.js` — unit and integration tests

**Modified Files (Extend Existing):**
- `lib/mga/permissionResolver.js` — add 5 new permissions (reports.delivery.view/retry/cancel/resend/audit)
- `components/mga/MGAExportHistoryPanel.jsx` — extend with delivery status columns and action buttons
- `lib/mga/services/reportExportService.js` — call `trackExportDelivery()` after export generation (optional)
- `lib/mga/services/serviceContract.js` — add delivery audit event types if needed
- `docs/QUOTE_CONNECT_360_GATE_REGISTRY.json` — update Gate 6J-A status
- `docs/MGA_GATE_STATUS_LEDGER.md` — record implementation start

---

## 5. Files Protected from Change

**Do NOT modify:**
- `lib/mga/scopeGate.js` — authorization and scope resolution (no changes)
- `lib/mga/scopeResolver.js` — scope recheck logic (no changes)
- `lib/mga/permissionResolver.js` base matrix — only add new permissions, do not weaken existing
- `entities/MasterGroup.json` — no schema changes
- `entities/MGAReportTemplate.json` (Gate 6I-A) — no changes
- `entities/MGAReportSchedule.json` (Gate 6I-A) — no changes
- `lib/mga/services/masterGroupService.js` — no changes
- `components/mga/MGAMasterGroupPanel.jsx` — no changes
- `functions/mgaReportExport.js` (Gate 6C) — no changes
- `functions/mgaExportHistoryContract.js` (Gate 6D) — no changes

---

## 6. Data Model / Storage Approach

### Option A: Audit Log Only (Recommended for Phase 1)
**Storage:** Delivery status reconstructed from `ActivityLog` events  
**Benefits:** No new table, leverages existing audit infrastructure, lightweight  
**Trade-off:** Slightly slower to query delivery timeline (reconstruct from events)  
**Implementation:** Design-only `MGAExportDelivery` schema; use `ActivityLog` for persistence

### Option B: Optional Database Table (Future Enhancement)
**Storage:** Optional `MGAExportDelivery` table with denormalized status  
**Benefits:** Fast delivery status queries, audit trail still in `ActivityLog`  
**Trade-off:** Extra table, duplication with audit log  
**Implementation:** Create `entities/MGAExportDelivery.json` but do not enable until approved

### Recommended Path:
Phase 1: Audit log only (Option A)  
Phase 2 (if performance needed): Add optional table (Option B)

### Design-Only Schema (if future table is approved)
```
MGAExportDelivery {
  id: uuid (primary key)
  export_id: uuid (reference to export in history)
  master_general_agent_id: string (MGA scope)
  master_group_id: string (Broker/Agency scope, optional)
  status: enum (PENDING, SENT, FAILED, CANCELLED, ARCHIVED)
  failure_reason_code: string (null if sent)
  failure_details: string (diagnostic metadata only, no PII)
  retry_count: integer (auto retries)
  last_retry_at: timestamp (null if not retried)
  created_at: timestamp
  updated_at: timestamp
  sent_at: timestamp (null if not sent)
  cancelled_at: timestamp (null if not cancelled)
  created_by: string (user email)
  updated_by: string (user email)
}
```

---

## 7. Permission Model

### New Permissions (Add to permissionResolver.js)

| Permission | Description | mga_admin | mga_manager | mga_user | mga_read_only |
|---|---|---|---|---|---|
| reports.delivery.view | View delivery status | ✅ | ✅ | own | ✅ |
| reports.delivery.retry | Retry delivery | ✅ | ✅ | — | — |
| reports.delivery.cancel | Cancel delivery | ✅ | own | own | — |
| reports.delivery.resend | Resend completed export | ✅ | ✅ | — | — |
| reports.delivery.audit | View delivery audit trail | ✅ | ✅ | — | ✅ |

### Implementation Detail:
- `mga_admin`: manage all exports in MGA
- `mga_manager`: manage Broker/Agency scope + subordinate users
- `mga_user`: cancel/view own exports only
- `mga_read_only`: view-only access

### Scope-Based Enforcement:
- Verify user role permits action
- Verify user scope includes MGA/Broker-Agency
- Verify export data unchanged (prevent privilege escalation)

---

## 8. ScopeGate / Security Model

### Multi-Tenant Isolation
**All delivery operations must respect existing scope boundaries:**
- Delivery status visible only to users in same MGA/Broker-Agency
- Retry/cancel/resend accessible only to authorized roles in scope
- Audit trail scoped to MGA
- Cross-MGA access returns 404 (masked not found)

### Scope Recheck Before Delivery Action
**Before executing retry, cancel, or resend:**
1. Verify user still has access to export's MGA/Broker-Agency
2. Verify export data unchanged (prevent replay of stale data)
3. Verify user role permits the action
4. Return 403 Forbidden if check fails

### No New Privilege Escalation Vectors
- Retry/cancel/resend do NOT bypass export permissions
- Export filter whitelist (Gate 6C) still enforced
- PII protection (no sensitive data in logs) maintained

---

## 9. Safe Delivery Payload Policy

### What CAN Be Logged
✅ Delivery status (PENDING, SENT, FAILED, CANCELLED)  
✅ Retry count and backoff timing  
✅ Failure reason code (EXPORT_NOT_FOUND, DATA_MISMATCH, PERMISSION_DENIED, etc.)  
✅ Timestamp of delivery events  
✅ Export reference (ID, not full content)  
✅ User email of actor  
✅ MGA/Broker-Agency reference  

### What CANNOT Be Logged
❌ Full exported report content  
❌ Filtered dataset content  
❌ Beneficiary PII (names, SSNs, email addresses)  
❌ Financial data from exports  
❌ Credentials or auth tokens  
❌ Signed URLs  
❌ Private file URIs  

### Audit Event Policy
- Use `ActivityLog` for all delivery events
- No PII or sensitive data in `detail` field
- Only metadata (status, reason code, timestamp, user email)

---

## 10. Backend Service Actions

### Service: exportDeliveryService.js

**Function: trackExportDelivery(export_id, master_general_agent_id, master_group_id)**
- Create delivery status record (audit log entry + optional table row)
- Set status to PENDING
- Log event: `export_delivery_tracked`
- Return delivery_id for reference

**Function: retryDeliveryStatus(delivery_id, actor_email, actor_role)**
- Verify permission: mga_admin or mga_manager
- Verify scope: actor scope includes export's MGA/Broker-Agency
- Verify data unchanged (fetch latest export, compare hash)
- If unchanged: increment retry_count, reset last_retry_at, continue delivery process
- If changed: return error `DATA_MISMATCH`
- Log event: `export_delivery_retry_initiated`
- Return updated delivery status

**Function: cancelDeliveryStatus(delivery_id, actor_email, actor_role)**
- Verify permission: mga_admin or export owner (mga_user)
- Verify scope: actor scope includes export's MGA/Broker-Agency
- Check if status is PENDING (only pending can be cancelled)
- Change status to CANCELLED
- Log event: `export_delivery_cancelled`
- Return updated delivery status (idempotent if already cancelled)

**Function: resendDelivery(delivery_id, actor_email, actor_role)**
- Verify permission: mga_admin or mga_manager
- Verify scope: actor scope includes export's MGA/Broker-Agency
- Verify data unchanged (prevent replay of stale data)
- Create new delivery record (reference old delivery_id)
- Log event: `export_delivery_resent`
- Return new delivery_id

**Function: getDeliveryStatus(delivery_id, actor_email, actor_role)**
- Verify permission: mga_admin or mga_manager or mga_read_only
- Verify scope: actor scope includes delivery's MGA
- Return delivery status (if accessible)

**Function: listExportDeliveries(export_id, actor_email, actor_role)**
- Verify permission: user can view export
- Verify scope: actor scope includes export's MGA
- Return list of delivery records for export (sorted by created_at desc)

### Integration Points
- **Gate 6C:** After export generation, call `trackExportDelivery(export_id, mga_id, ...)`
- **Gate 6D:** Extend query to include delivery status via join on export_id
- **Gate 6I-A:** At schedule execution time (future, Gate 6I-B), will call `trackExportDelivery(...)` per scheduled run

---

## 11. Frontend Components / Actions

### Extension: MGAExportHistoryPanel

**New Columns:**
- **Delivery Status Badge:** visual indicator (PENDING=orange, SENT=green, FAILED=red, CANCELLED=gray)
- **Retry Button:** mga_manager, visible if PENDING or FAILED
- **Cancel Button:** mga_admin + export owner, visible if PENDING
- **Resend Button:** mga_manager, visible if SENT or FAILED
- **Failure Reason Tooltip:** if FAILED, show failure_reason_code + last_retry_at

**New Actions:**
- Click status badge → expand delivery timeline (retry history, cancel events, resend events)
- Click "Retry" → `retryDeliveryStatus()` (immediate retry, backoff handled server-side)
- Click "Cancel" → confirm cancellation, call `cancelDeliveryStatus()`
- Click "Resend" → create new delivery, call `resendDelivery()`

**New Components:**
- `MGAExportDeliveryStatusPanel.jsx` — status UI container
- `MGAExportDeliveryActionMenu.jsx` — dropdown menu (retry, cancel, resend)
- `MGAExportDeliveryRetryDialog.jsx` — retry confirmation + backoff info
- `MGAExportDeliveryCancelDialog.jsx` — cancel confirmation
- `MGAExportDeliveryTimeline.jsx` — delivery event history timeline

### Dialog Behavior
- **Retry Dialog:** Show current retry count, estimated next retry time, "Retry Now" button
- **Cancel Dialog:** Confirm cancellation ("This cannot be undone"), reason prompt (optional)
- Both dialogs disable submit button while saving (show "Saving...")

---

## 12. Audit Event Requirements

### New Event Types (5 Events)

| Event | Trigger | Fields | Example Actor |
|-------|---------|--------|---|
| `export_delivery_tracked` | Export sent for delivery | export_id, master_general_agent_id, master_group_id, created_by | system |
| `export_delivery_retry_initiated` | Retry attempted | export_id, delivery_id, retry_count, actor_email, actor_role | mga_manager |
| `export_delivery_cancelled` | Delivery cancelled | export_id, delivery_id, actor_email, actor_role | mga_admin |
| `export_delivery_resent` | Manual resend | export_id, old_delivery_id, new_delivery_id, actor_email, actor_role | mga_manager |
| `export_delivery_failed` | Max retries exceeded | export_id, delivery_id, failure_reason_code, retry_count | system |

### Audit Record Schema (Extend ActivityLog)
```
{
  case_id: null (delivery is export-scoped, not case-scoped)
  master_general_agent_id: string
  master_group_id: string (optional)
  actor_email: string
  actor_name: string
  actor_role: string
  action: string (event type above)
  detail: string (diagnostic info only, no PII)
  entity_type: "ExportDeliveryStatus"
  entity_id: string (delivery_id)
  old_value: string (previous status)
  new_value: string (new status)
  outcome: "success" | "failed" | "blocked"
  correlation_id: string (links multi-step operations)
}
```

### Implementation:
- Reuse `prepareAndRecordAudit()` from serviceContract.js
- No PII or export content in audit details
- Scope-aware (MGA isolation enforced)

---

## 13. Integration Requirements

### Gate 6C Integration (Report Export)
**Current:** Gate 6C exports data → audit trail created  
**Integration:** After export generation, call `trackExportDelivery(export_id, mga_id, ...)`  
**Impact:** Minimal; additive only (one function call)  
**Regression:** Zero — Gate 6C logic unchanged

### Gate 6D Integration (Export History)
**Current:** Gate 6D lists exports with metadata  
**Integration:** UI extended with delivery status columns; queries joined on export_id  
**Impact:** UI layer only (no schema breaking changes)  
**Regression:** Zero — backward compatible

### Gate 6G Integration (Report Export UI)
**Current:** Gate 6G activates export button  
**Integration:** New delivery panel added below export button (separate component)  
**Impact:** UI layer only  
**Regression:** Zero — Gate 6G button unchanged

### Gate 6I-A Integration (Templates & Schedules)
**Current:** Gate 6I-A stores schedule metadata, no execution  
**Integration:** When Gate 6I-B future executes schedule, each run will call `trackExportDelivery(...)`  
**Impact:** None yet; Gate 6I-B will use Gate 6J-A delivery governance  
**Future Dependency:** Gate 6I-B design depends on Gate 6J-A policies (retry backoff, cancel semantics, resend idempotency)

---

## 14. Validation / Test Mapping

### Unit Tests (~15 tests)
- Retry backoff calculation: exponential (1s, 2s, 4s, etc.), max 3 auto retries
- Cancel idempotency: cancelling already-cancelled is no-op
- Resend idempotency: multiple resends create separate records
- Permission enforcement: mga_user cannot retry/cancel others' exports
- Scope enforcement: cross-MGA access returns 404

### Integration Tests (~10 tests)
- Delivery tracked after export generation
- Delivery status appears in history UI
- Delivery action buttons render correctly (based on status + role)
- Audit trail recorded for all 5 events
- Scope isolation: MGA1 users cannot access MGA2 deliveries

### Regression Tests (~7 tests)
- Gate 6C export logic unchanged: PASS
- Gate 6D export history unchanged: PASS
- Gate 6G export button unchanged: PASS
- Gate 6I-A template/schedule unchanged: PASS
- permissionResolver.js: new permissions do not weaken existing: PASS
- scopeGate.js: no changes, all existing checks pass: PASS

### Build / Lint / Quality
- ESLint: PASS
- Jest: PASS
- Build: PASS
- Test Coverage: >80%

**Total Test Count:** ~32 tests

---

## 15. Rollback Procedure

### Phase 1: Feature Flag Disable (Immediate)
**Command:** Set `MGA_DELIVERY_TRACKING_ENABLED = false`  
**Effect:** Skip `trackExportDelivery()` calls; delivery status not recorded  
**Reversible:** Yes, re-enable flag  
**Time to Execute:** <1 minute  
**Data Loss:** None (existing records retained)

### Phase 2: Service Disable (30 minutes)
**Command:** Comment out service calls in `exportDeliveryService.js`  
**Effect:** Delivery functions return error; UI still renders but buttons disabled  
**Reversible:** Yes, uncomment service calls  
**Time to Execute:** <5 minutes  
**Data Loss:** None (existing records retained)

### Phase 3: Component Removal (1 hour)
**Command:** Delete UI components from `MGAExportHistoryPanel`  
**Effect:** No delivery status UI; export history panel reverts to Gate 6D state  
**Reversible:** Yes, re-add components  
**Time to Execute:** <5 minutes  
**Data Loss:** None (audit logs retained)

### Phase 4: Complete Removal (if critical issue)
**Command:** Delete all Gate 6J-A files and references  
**Effect:** Full rollback to pre-implementation state  
**Reversible:** No (requires code restore from backup)  
**Time to Execute:** <10 minutes  
**Data Loss:** Optional database table (if created) can be dropped; audit logs retained

---

## 16. Registry / Ledger Update Requirements

### After Implementation Complete:
1. Update `docs/QUOTE_CONNECT_360_GATE_REGISTRY.json`:
   - Set Gate 6J-A `status` = `ACTIVATED_VALIDATION_PASSING`
   - Set Gate 6J-A `activation` = `ACTIVE`
   - Set Gate 6J-A `implementation` = `COMPLETE`
   - Set Gate 6J-A `testCount` = 32
   - Set Gate 6J-A `testsPassed` = 32
   - Set Gate 6J-A `buildStatus` = `PASS`
   - Set Gate 6J-A `rollbackReady` = `true`
   - Add `activationDate` = implementation completion date
   - Add `activatedBy` = "Platform Engineering — operator approval received"

2. Update `docs/MGA_GATE_STATUS_LEDGER.md`:
   - Record: Gate 6J-A implementation started [date]
   - Record: Gate 6J-A implementation completed [date]
   - Record: Gate 6J-A validation [date]: 32/32 tests PASS
   - Record: Gate 6J-A activated [date]

3. Verify gates 6A–6I-A regression tests: PASS

---

## 17. Operator Approval Checkpoint

**Required Before Implementation:**
- ✅ Operator approves this implementation work order
- ✅ Confirms Gate 6J-A scope (in-app delivery tracking only)
- ✅ Confirms deferrals: 6J-B, 6J-C remain deferred
- ✅ Confirms guardrails: no email, webhooks, background jobs, signed URLs, private URIs
- ✅ Confirms deliverables: 8 new files, 3 modified files, 32 tests

**Approval Format:**
```
Base44 — Gate 6J-A Implementation Approved

Status: APPROVED_FOR_IMPLEMENTATION
Scope: Confirmed (in-scope: delivery status, retry/cancel/resend; deferred: email, webhooks)
Guardrails: Confirmed (no external delivery, no background jobs, no signed URLs)
Next Action: Begin implementation
```

---

## Summary

Gate 6J-A Implementation Work Order is complete and ready for implementation upon operator approval.

**Deliverables:**
- 8 new files (service, components, tests, entity schema)
- 3 modified files (extend existing, add permissions)
- 32 tests (unit, integration, regression)
- 5 new audit events
- 5 new permissions (delivery.view/retry/cancel/resend/audit)
- Full rollback strategy (4 phases)

**Deferred:**
- Gates 6J-B (Email), 6J-C (Webhook)
- Gate 6I-B (Recurring Scheduler)
- All external delivery mechanisms

**Timeline:**
- Implementation: ~2–3 weeks (development + testing)
- Validation: ~1 week (regression suite, build verification)
- Activation: ~1 day (feature flag flip, registry update)

---

**Prepared by:** Platform Engineering  
**Date:** 2026-05-12  
**Status:** IMPLEMENTATION_WORK_ORDER_COMPLETE — Awaiting Operator Approval