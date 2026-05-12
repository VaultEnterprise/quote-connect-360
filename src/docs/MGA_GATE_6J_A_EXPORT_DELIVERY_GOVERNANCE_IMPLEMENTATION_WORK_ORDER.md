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
**Design Reference:** docs/MGA_GATE_6J_A_EXPORT_DELIVERY_GOVERNANCE_DESIGN_SPECIFICATION.md  

---

## 1. Implementation Objective

Implement export delivery status tracking, retry/cancel/resend governance, and delivery audit trail for MGA-scoped report exports. Enable safe delivery governance before recurring scheduler (Gate 6I-B) is implemented.

**Phase Deliverables:**
- Backend service: `reportDeliveryService.js` with CRUD, retry, cancel, resend operations
- Frontend UI: extend `MGAExportHistoryPanel` with delivery status, action buttons, timeline
- Audit events: 5 new delivery event types
- Tests: ~35 unit + integration tests; all regression tests PASS
- Validation: build PASS, lint PASS, tests PASS
- Rollback: feature flag + service disable + component unmount

---

## 2. Approved Gate 6J-A Scope

**Core Capability: IN SCOPE**
- ✅ Delivery status state machine (PENDING → SENT/FAILED/CANCELLED)
- ✅ Retry governance (exponential backoff, max 3 auto retries, unlimited manual)
- ✅ Cancel governance (idempotent, PENDING-only, user-initiated)
- ✅ Manual resend capability (new delivery record, audit trail)
- ✅ Delivery failure reason codes (diagnostic metadata)
- ✅ Delivery audit trail (5 event types)
- ✅ Permission recheck before retry/cancel/resend
- ✅ Scope recheck before any delivery action
- ✅ Safe delivery payload policy (metadata-only, no PII in logs)
- ✅ Integration with Gate 6D export history (extend query, UI join)
- ✅ Integration with Gate 6I-A schedule definitions (foundation for Gate 6I-B)

**Explicitly Out of Scope: DEFERRED**
- ❌ Email delivery (Gate 6J-B)
- ❌ Webhook delivery (Gate 6J-C)
- ❌ Recurring scheduler execution (Gate 6I-B)
- ❌ Background jobs
- ❌ Bulk scheduled exports
- ❌ External recipient delivery
- ❌ Signed URL delivery
- ❌ Private file URI delivery
- ❌ Exported content delivery

---

## 3. Deferred Scope: Gates 6J-B and 6J-C

**Gate 6J-B — Email Export Delivery** (DEFERRED)  
Status: DEFERRED | Implementation: NOT_STARTED  
Scope: SMTP integration, bounce handling, unsubscribe governance, GDPR compliance  
Reason: Requires separate SMTP design, recipient management, email-specific audit  
Approval: Pending operator approval for separate security design

**Gate 6J-C — Webhook Export Delivery** (DEFERRED)  
Status: DEFERRED | Implementation: NOT_STARTED  
Scope: Webhook endpoints, HTTP POST, signature/HMAC validation, retry storm protection  
Reason: Requires separate endpoint security design, distributed backoff, encryption  
Approval: Pending operator approval for separate security design

---

## 4. Files Authorized for Future Change

**New Files (Create During Implementation):**
- `src/entities/MGAExportDelivery.json` — entity schema (optional, design-only or database table)
- `lib/mga/services/exportDeliveryService.js` — core service logic
- `components/mga/MGAExportDeliveryStatusPanel.jsx` — delivery status display
- `components/mga/MGAExportDeliveryActionMenu.jsx` — retry/cancel/resend actions
- `components/mga/MGAExportDeliveryRetryDialog.jsx` — retry confirmation UI
- `components/mga/MGAExportDeliveryCancelDialog.jsx` — cancel confirmation UI
- `tests/mga/gate6j-a-export-delivery-governance.test.js` — test suite

**Existing Files (Safe to Modify):**
- `components/mga/MGAExportHistoryPanel.jsx` — extend with delivery status columns/buttons
- `lib/mga/permissionResolver.js` — add 5 new delivery permissions
- `docs/QUOTE_CONNECT_360_GATE_REGISTRY.json` — update Gate 6J-A status
- `docs/MGA_GATE_STATUS_LEDGER.md` — add Gate 6J-A ledger entry (if file exists)

**Protected Files (DO NOT MODIFY):**
- `components/mga/MGAReportExportModal.jsx` — Gate 6C (no changes)
- `lib/mga/reportExportService.js` — Gate 6C (no changes)
- `components/mga/MGAExportHistoryPanel.jsx` — extend only, no breaking changes
- `lib/mga/reportExportHistoryService.js` — Gate 6D (no changes)
- `lib/mga/scopeGate.js` — Phase 3 (protected)
- `lib/mga/scopeResolver.js` — Phase 3 (protected)
- `lib/mga/permissionResolver.js` — extend, do not weaken existing rules
- `entities/MasterGeneralAgent.json` — MGA entity (protected)
- `entities/MasterGroup.json` — Broker/Agency entity (protected, no rename)
- `entities/BenefitCase.json` — Case entity (protected)

---

## 5. Data Model / Storage Approach

### Delivery Status Record (Design-Only)
```
MGAExportDelivery {
  id: uuid
  export_id: uuid (reference to export in history)
  master_general_agent_id: string (MGA scope)
  master_group_id: string (Broker/Agency scope, optional)
  status: enum (PENDING, SENT, FAILED, CANCELLED, ARCHIVED)
  failure_reason_code: string (null if sent)
  failure_details: string (diagnostic only, no PII)
  retry_count: integer
  last_retry_at: timestamp
  created_at: timestamp
  updated_at: timestamp
  sent_at: timestamp
  cancelled_at: timestamp
  created_by: string (user email)
  updated_by: string (user email)
}
```

### Storage Strategy
**Phase 1 (Implementation):**
- Delivery status stored in `ActivityLog` events only (no new table)
- Reconstruct from audit events: `export_delivery_tracked`, `export_delivery_retry_initiated`, etc.
- Queries join export history with delivery audit trail

**Phase 2+ (Optional Optimization):**
- Optional `MGAExportDelivery` table for performance (denormalize from audit)
- Populate on-demand via scheduled cleanup job (not in Gate 6J-A)

### No PII Storage
- Failure details logged as diagnostic code + message only
- No exported data content in logs
- No beneficiary PII (names, SSNs, emails)
- No credentials or auth tokens

---

## 6. Permission Model

### New Permissions (5 Granular Permissions)

| Permission | Description | Default Roles |
|------------|-------------|----------------|
| `mga.reports.delivery.view` | View delivery status | platform_super_admin, mga_admin, mga_manager |
| `mga.reports.delivery.retry` | Retry failed delivery | platform_super_admin, mga_admin, mga_manager |
| `mga.reports.delivery.cancel` | Cancel pending delivery | platform_super_admin, mga_admin, export_owner |
| `mga.reports.delivery.resend` | Resend completed delivery | platform_super_admin, mga_admin, mga_manager |
| `mga.reports.delivery.audit` | View delivery audit trail | platform_super_admin, mga_admin, mga_manager |

### RBAC Matrix (Updated permissionResolver.js)

| Role | View | Retry | Cancel | Resend | Audit |
|------|------|-------|--------|--------|-------|
| platform_super_admin | YES | YES | YES | YES | YES |
| mga_admin | YES | YES | YES (own) | YES | YES |
| mga_manager | YES | YES | NO | YES | YES |
| mga_user | own | NO | own | NO | own |
| mga_read_only | YES | NO | NO | NO | YES |

### Permission Recheck Before Action
Before executing retry, cancel, or resend:
1. Verify user role permits the action (RBAC)
2. Verify user scope includes MGA/Broker/Agency (scopeGate)
3. Verify export data unchanged (prevent privilege escalation)
4. Return 403 if access denied; 404 if not found (masked)

---

## 7. ScopeGate / Security Model

### Multi-Tenant Isolation
- All delivery operations respect MGA and Broker/Agency scopes
- Delivery status visible only to users in same MGA/Broker/Agency
- Cross-MGA access returns 404 (masked not found)
- scopeGate and scopeResolver unchanged; no weakening

### Data Safety
- Export payloads already validated by Gate 6C
- Failure diagnostics logged as metadata (no content)
- No PII in delivery logs
- No sensitive data in audit events
- Retry only if export data unchanged

### Retry Safety
- Exponential backoff prevents retry storms (60s, 5m, 30m, 2h)
- Max 3 automatic retries + unlimited manual (with approval)
- Idempotent retry/resend semantics (safe to retry multiple times)

### Cancel Safety
- Cancel is idempotent (cancelling already-cancelled is no-op)
- Cancellation is immediate (atomic state change)
- Old delivery records never deleted (audit compliance)

---

## 8. Safe Delivery Payload Policy

### What CAN Be Logged
✅ Delivery status (PENDING, SENT, FAILED, CANCELLED)  
✅ Retry count and backoff timing  
✅ Failure reason code (EXPORT_NOT_FOUND, DATA_MISMATCH, PERMISSION_DENIED, etc.)  
✅ Timestamp of delivery events  
✅ Export reference (ID only, not content)  
✅ User email of actor  
✅ MGA and Broker/Agency scope IDs  

### What CANNOT Be Logged
❌ Full exported report content  
❌ Filtered dataset content  
❌ Beneficiary PII (names, SSNs, email addresses)  
❌ Financial data from exports  
❌ Credentials or auth tokens  
❌ Signed URLs  
❌ Private file URIs  

### Failure Reason Codes (Design-Only Reference)
- `EXPORT_NOT_FOUND` — export record no longer exists
- `DATA_MISMATCH` — export data changed since last attempt
- `PERMISSION_DENIED` — user no longer authorized
- `SCOPE_DENIED` — export moved to different scope
- `DELIVERY_FAILED` — generic failure
- `MAX_RETRIES_EXCEEDED` — automatic retries exhausted
- `CANCELLED_BY_USER` — user-initiated cancel

---

## 9. Backend Service Actions

### reportDeliveryService.js (Core Service)

**Function: trackExportDelivery(export_id, master_general_agent_id, master_group_id)**
- Creates delivery status record (audit log entry or optional table)
- Returns delivery_id for reference
- Audit: `export_delivery_tracked`

**Function: retryDeliveryStatus(delivery_id, actor_email)**
- Verifies permission and scope
- Checks if data unchanged
- Initiates retry with backoff
- Logs audit event `export_delivery_retry_initiated`
- Returns updated delivery status

**Function: cancelDeliveryStatus(delivery_id, actor_email)**
- Verifies permission and scope
- Checks if status is PENDING
- Changes status to CANCELLED
- Logs audit event `export_delivery_cancelled`
- Returns updated delivery status

**Function: resendDelivery(delivery_id, actor_email)**
- Verifies permission and scope
- Checks if data unchanged
- Creates new delivery record (references old)
- Logs audit event `export_delivery_resent`
- Returns new delivery_id

**Function: getDeliveryStatus(delivery_id, actor_email, actor_role)**
- Verifies scope access
- Returns delivery status (if accessible)
- Returns 404 if not found or access denied

**Function: listExportDeliveries(export_id, actor_email, actor_role)**
- Verifies export access
- Returns delivery list for export

### Integration Points
**Gate 6C (Report Export):**
- After export generation, call `trackExportDelivery(export_id, ...)`
- No changes to export logic

**Gate 6D (Export History):**
- Query: join export history with delivery status
- No breaking changes to history schema

**Gate 6I-A (Schedule Definitions):**
- Schedule metadata unchanged
- Gate 6I-B will call `trackExportDelivery(...)` at execution time

---

## 10. Frontend Components / Actions

### Extend MGAExportHistoryPanel
**New Columns:**
- `Delivery Status` — badge (PENDING: orange, SENT: green, FAILED: red, CANCELLED: gray)
- `Retry` — button (mga_manager+, visible if PENDING/FAILED)
- `Cancel` — button (mga_admin+export_owner, visible if PENDING)
- `Resend` — button (mga_manager+, visible if SENT/FAILED)

**New Interactions:**
- Click status badge → expand delivery timeline (retry history, events)
- Click "Retry" → immediate retry (backoff server-side)
- Click "Cancel" → confirmation dialog, change status to CANCELLED
- Click "Resend" → create new delivery record, log event

**New Detail Modal:**
- Export metadata (from Gate 6D)
- Delivery status history (timeline)
- Audit trail (5 delivery events)
- Failure diagnostics (if FAILED)

### New Components
- `MGAExportDeliveryStatusPanel.jsx` — status display badge + timeline
- `MGAExportDeliveryActionMenu.jsx` — retry/cancel/resend action buttons
- `MGAExportDeliveryRetryDialog.jsx` — retry confirmation dialog
- `MGAExportDeliveryCancelDialog.jsx` — cancel confirmation dialog

---

## 11. Audit Event Requirements

### 5 New Delivery Events

| Event | Trigger | Fields | Role |
|-------|---------|--------|------|
| `export_delivery_tracked` | Export sent for delivery | export_id, master_general_agent_id, master_group_id, created_by | system |
| `export_delivery_retry_initiated` | Retry attempted | export_id, delivery_id, retry_count, actor_email, actor_role | mga_manager, system |
| `export_delivery_cancelled` | Delivery cancelled | export_id, delivery_id, actor_email, actor_role | mga_admin, export owner |
| `export_delivery_resent` | Manual resend | export_id, old_delivery_id, new_delivery_id, actor_email, actor_role | mga_manager |
| `export_delivery_failed` | Max retries exceeded | export_id, delivery_id, failure_reason_code, retry_count | system |

### ActivityLog Schema (Extend Existing)
```
ActivityLog {
  ...existing fields...
  action: string (5 new event types above)
  entity_type: "ExportDeliveryStatus"
  entity_id: string (delivery_id)
  old_value: string (previous status)
  new_value: string (new status)
  detail: string (diagnostic, no PII)
  outcome: "success" | "failed" | "blocked"
}
```

---

## 12. Integration Requirements: Gates 6D and 6I-A

### Gate 6D Integration (Export History)
**No Breaking Changes:**
- Export history schema unchanged
- Delivery status is supplementary metadata
- Queries joined on export_id
- UI extension backward-compatible

**Workflow:**
1. User queries export history (Gate 6D)
2. UI displays export metadata (existing)
3. UI displays delivery status (new, Gate 6J-A)
4. User clicks retry/cancel/resend (triggers Gate 6J-A service)

**Regression:** Gate 6D logic unchanged; UI extension only

### Gate 6I-A Integration (Schedule Definitions)
**No Changes to Templates/Schedules:**
- Schedule metadata unchanged (template + date/time)
- Schedule execution deferred to Gate 6I-B

**Workflow (Future):**
1. Gate 6I-A stores schedule metadata
2. Gate 6I-B (future) triggers scheduled export at execution time
3. Gate 6C generates export → calls `trackExportDelivery(...)`
4. Gate 6J-A tracks delivery status per scheduled run
5. Retry/cancel/resend controls available for each execution

**Prerequisite:** Gate 6J-A policies (retry backoff, cancel idempotency, resend semantics) form contract for Gate 6I-B

---

## 13. Validation / Test Mapping

### Unit Tests (~15 Tests)
- Retry backoff calculation (exponential, max 3 auto)
- Cancel idempotency (cancelling already-cancelled is no-op)
- Resend idempotency (multiple resends create separate records)
- State machine transitions (valid paths only)
- Permission enforcement per role
- Scope enforcement (cross-MGA returns 404)

### Integration Tests (~15 Tests)
- Delivery tracking triggered after export generation (Gate 6C)
- Delivery status appears in export history (Gate 6D)
- Delivery UI panel renders with correct buttons
- Audit trail recorded for all 5 events
- Permission recheck blocks unauthorized actions
- Scope recheck prevents cross-MGA access

### Regression Tests (~10 Tests)
- Gate 6C export logic unchanged: PASS
- Gate 6D export history unchanged: PASS
- Gate 6G export button unchanged: PASS
- Gate 6I-A template/schedule unchanged: PASS
- scopeGate and scopeResolver unchanged: PASS
- permissionResolver rules not weakened: PASS

### Build / Lint / Static Analysis
- ESLint: PASS (no violations)
- Jest: PASS (~35 tests)
- Build: PASS (no errors)
- Static scan: PASS (no security issues)

**Test Target:** 35+ tests; 100% pass rate; all regression PASS

---

## 14. Rollback Procedure

### Phase 1: Feature Flag Disable (5 minutes)
- Feature flag: `MGA_DELIVERY_TRACKING_ENABLED` (default: true)
- Effect: skip delivery tracking calls; exports work normally
- Data: no data loss; existing delivery records remain

### Phase 2: Service Disable (5 minutes)
- Comment out `reportDeliveryService` calls in Gate 6C
- Remove delivery UI components from `MGAExportHistoryPanel`
- Effect: no new deliveries tracked; existing records remain

### Phase 3: Complete Removal (10 minutes)
- Delete `reportDeliveryService.js`
- Delete UI component files
- Delete test file
- Delete optional database table (if created)
- Retain audit logs for compliance

**Rollback Time:** <15 minutes total; all phases reversible; no data loss

---

## 15. Critical Runtime Boundary (Non-Negotiable)

**Gate 6J-A DOES:**
✅ Track delivery status (PENDING → SENT/FAILED/CANCELLED)  
✅ Govern retry/cancel/resend actions  
✅ Record delivery audit trail (5 events)  
✅ Enforce permission and scope checks  
✅ Validate data consistency before retry  

**Gate 6J-A DOES NOT:**
❌ Send email messages  
❌ Send webhook payloads  
❌ Create background jobs  
❌ Execute recurring schedules (Gate 6I-B deferred)  
❌ Expose signed URLs  
❌ Expose private file URIs  
❌ Expose exported content  
❌ Rename MasterGroup or master_group_id  
❌ Weaken scopeGate, scopeResolver, or permissionResolver  
❌ Broaden RBAC permissions  

**Enforcement:**
- Code review will verify no external delivery calls
- Build/lint will catch forbidden imports
- Tests will verify no data exposure
- Security scan will verify no new vulnerabilities

---

## 16. Registry / Ledger Update Requirements

### Update QUOTE_CONNECT_360_GATE_REGISTRY.json
After work order completion, update Gate 6J-A entry:

```json
{
  "gateId": "GATE-6J-A",
  "gateName": "Export Delivery Status and Retry/Cancel Governance",
  "phase": "6",
  "status": "IMPLEMENTATION_WORK_ORDER_COMPLETE",
  "activation": "INACTIVE",
  "implementation": "NOT_STARTED",
  "capability": "Delivery status tracking, retry/cancel/resend governance, delivery audit trail",
  "parentGate": "GATE-6J",
  "deferredDeliveryGates": ["GATE-6J-B", "GATE-6J-C"],
  "dependsOn": ["GATE-6C", "GATE-6D", "GATE-6G", "GATE-6I-A"],
  "deferredDependency": "GATE-6I-B",
  "designSpec": "docs/MGA_GATE_6J_A_EXPORT_DELIVERY_GOVERNANCE_DESIGN_SPECIFICATION.md",
  "implementationWorkOrder": "docs/MGA_GATE_6J_A_EXPORT_DELIVERY_GOVERNANCE_IMPLEMENTATION_WORK_ORDER.md",
  "testCount": 35,
  "notes": "Work order 2026-05-12. Ready for implementation phase. Gates 6J-B and 6J-C remain deferred. Prerequisite for Gate 6I-B recurring execution design."
}
```

### Keep Deferred Gates
Do NOT change status of Gate 6J-B and Gate 6J-C:

```json
{
  "gateId": "GATE-6J-B",
  "status": "DEFERRED",
  "activation": "INACTIVE",
  "implementation": "NOT_STARTED",
  "notes": "Deferred 2026-05-12. Pending operator approval for separate security design phase."
}
```

```json
{
  "gateId": "GATE-6J-C",
  "status": "DEFERRED",
  "activation": "INACTIVE",
  "implementation": "NOT_STARTED",
  "notes": "Deferred 2026-05-12. Pending operator approval for separate security design phase."
}
```

---

## 17. Operator Approval Checkpoint

**Status:** IMPLEMENTATION_WORK_ORDER_COMPLETE  
**Next Step:** Operator approval before implementation begins

**Approval Decision Points:**
1. **Approve as-is:** Begin implementation immediately per this work order
2. **Request changes:** Clarify scope, permissions, or rollback strategy before implementation
3. **Split or defer:** Request separate work order for subset of features

**Implementation Sequence (After Approval):**
1. Create backend service (`reportDeliveryService.js`)
2. Add 5 new audit event types
3. Extend `permissionResolver.js` with 5 new permissions
4. Create frontend components (4 new components)
5. Extend `MGAExportHistoryPanel` with delivery UI
6. Write and validate test suite (~35 tests)
7. Execute regression tests (all gates)
8. Build, lint, static scan: all PASS
9. Prepare activation checklist
10. Submit for activation review

---

**Prepared by:** Platform Engineering  
**Date:** 2026-05-12  
**Status:** IMPLEMENTATION_WORK_ORDER_COMPLETE — Awaiting Operator Approval for Implementation Phase