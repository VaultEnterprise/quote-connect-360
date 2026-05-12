# MGA Gate 6J — Export Delivery Enhancements
## Discovery / Preflight Report

**Date:** 2026-05-12  
**Status:** DISCOVERY_PREFLIGHT  
**Gate ID:** GATE-6J  
**Capability:** Export Delivery Enhancements  
**Depends On:** GATE-6C, GATE-6D, GATE-6G, GATE-6I-A  
**Deferred Gates:** GATE-6I-B  

---

## 1. Current Export/Reporting Baseline

**Gate 6C — Report Export** provides core export functionality:
- Export data to PDF, CSV, Excel formats
- Filtered result sets scoped to MGA and Broker/Agency
- Permission-based access (mga_admin, mga_manager, mga_user)
- Audit logging of export events
- No delivery mechanism (manual download only)

**Gate 6D — Export History** tracks past exports:
- Export metadata (timestamp, user, format, filter summary)
- One-time export records
- No automated re-export or scheduling
- Audit trail for compliance

**Gate 6I-A — Saved Report Templates & Schedule Definitions** enables reusable configurations:
- Report template definitions (filter sets, format defaults)
- One-time schedule metadata (date/time, template reference)
- Manual execution via "Run Now" button
- No recurring execution, no background jobs, no delivery

---

## 2. Gate 6J Proposed Capability Scope

**Objective:** Evaluate safe delivery governance for exported reports before any automated scheduler (Gate 6I-B) is enabled.

**Core Scope:**
- Export delivery status tracking
- Retry/cancel controls for failed deliveries
- Manual resend capability
- Delivery failure handling and audit
- Delivery-safe payload policy
- Permission/scope recheck before delivery

**Out of Scope (This Gate):**
- Recurring scheduler execution (Gate 6I-B)
- Email delivery (deferred to Gate 6J-B)
- Webhook delivery (deferred to Gate 6J-C)

---

## 3. Explicit Deferrals

**Gate 6I-B — Recurring Scheduler Execution**  
Remains deferred. Requires separate security design for:
- Permission recheck at execution time
- Scope recheck at execution time
- Idempotent execution guarantees
- Failure recovery and rollback
- Background job lifecycle management

**Gate 6J-B — Email Delivery**  
Deferred pending:
- SMTP/email service integration design
- Recipient/unsubscribe governance
- Payload sanitization for email safety
- Delivery bounce handling
- Email audit and compliance requirements

**Gate 6J-C — Webhook Delivery**  
Deferred pending:
- Webhook endpoint security design
- Retry storm protection
- Webhook signature/HMAC validation
- Payload encryption for sensitive data
- Webhook audit and failure handling

---

## 4. Existing Files/Entities/Services Inventory

### Entities
- `MGAReportTemplate` (Gate 6I-A)
- `MGAReportSchedule` (Gate 6I-A)

### Services
- `reportTemplateService.js` (Gate 6I-A) — template/schedule CRUD, no delivery
- `reportExportService.js` (Gate 6C) — core export logic
- `reportExportHistoryService.js` (Gate 6D) — history tracking

### Components
- `MGAReportTemplatesPanel` (Gate 6I-A)
- `MGAReportSchedulePanel` (Gate 6I-A)
- `MGAReportExportModal` (Gate 6C)
- `MGAExportHistoryPanel` (Gate 6D)

### Backend Functions
- `mgaReportExport` (Gate 6C) — export generation
- `mgaExportHistoryContract` (Gate 6D) — history recording

---

## 5. Data Model Assessment

### Current Design (Gates 6C, 6D, 6I-A)
Gates 6C, 6D, 6I-A use standard scope fields:
- `master_general_agent_id` (MGA scope)
- `master_group_id` (Broker/Agency scope, optional)
- `created_by` (audit)
- Timestamp fields for audit trail

### Proposed Gate 6J Scope
Gate 6J-A will add delivery tracking to the export workflow:
- Export delivery status (pending, sent, failed, cancelled)
- Retry count / last retry timestamp
- Delivery failure reason code
- Delivery audit events
- No new PII fields
- No private file URIs
- No signed URLs stored

### Design-Only Entities (Gate 6J-B/C)
For future email/webhook gates:
- `ExportDeliveryRecipient` (design-only)
- `ExportDeliveryWebhookEndpoint` (design-only)

---

## 6. Permission Model Assessment

### Current Permissions (Gates 6C, 6D, 6I-A)
Existing roles and actions:
- `mga_admin`: all export/history/template operations
- `mga_manager`: view/create/edit templates, view history
- `mga_user`: view/create exports
- `mga_read_only`: view only

### Gate 6J-A Proposed Permissions
Delivery status and retry/cancel controls:
- `mga_admin`: manage retry, cancel, resend
- `mga_manager`: view status, request resend
- `mga_user`: view own export delivery status
- `mga_read_only`: view only

### Gate 6J-B/C Deferred
Email and webhook permissions will be evaluated in separate gates.

---

## 7. Scope/Security Assessment

### Multi-Tenant Isolation
All delivery operations must respect MGA and Broker/Agency scopes:
- Delivery status visible only to users in the same MGA/Broker/Agency
- Retry/cancel accessible only to mga_admin and mga_manager
- Audit trail scoped to MGA

### Filter Safety
Exported payloads already validated by Gate 6C — no new exposure risk.

### Delivery Governance Risks
- **Retry storms:** Unbounded retries could overload export engine; must implement backoff strategy
- **Cancel safety:** Cancelling a delivery in-progress must be idempotent
- **Payload leakage:** Exported data must never be logged in full; only metadata
- **Permission recheck:** Before resend, verify user still has access to same data

---

## 8. Delivery Method Assessment

### Gate 6J-A: Delivery Status Tracking (IN SCOPE)
Capability: Track export delivery state without external delivery channels

**Candidate Methods:**
- In-app notification / export history UI (low-risk)
- Audit log entry (compliant)

**Recommendation:** IN SCOPE — implement in-app status and audit trail

### Gate 6J-B: Email Delivery (DEFERRED)
Candidate method: SMTP integration with bounce handling

**Risks:**
- Unsubscribe governance
- SPAM filtering
- Bounce handling
- Payload sanitization
- GDPR/privacy compliance

**Recommendation:** DEFERRED — requires separate security design and email governance policy

### Gate 6J-C: Webhook Delivery (DEFERRED)
Candidate method: HTTP POST to registered endpoints

**Risks:**
- Endpoint security and validation
- Retry storm protection
- Signature/HMAC validation
- Payload encryption
- Endpoint availability tracking

**Recommendation:** DEFERRED — requires separate security design and webhook governance policy

---

## 9. Retry/Cancel Governance

### Retry Strategy (Gate 6J-A)
For in-app delivery status:
- Automatic retry: exponential backoff (initial 60s, max 24h)
- Manual retry: mga_manager can force immediate resend if data unchanged
- Retry count: max 3 automatic retries; unlimited manual resends with approval
- Retry condition: only if original export data is unchanged

### Cancel Strategy (Gate 6J-A)
- Cancel capability: accessible to mga_admin and export owner
- Cancel idempotency: cancelling an already-sent export has no effect
- Cancel audit: logged as "export_delivery_cancelled"
- No partial cancellation (all-or-nothing)

---

## 10. Audit Event Requirements

### New Audit Events (Gate 6J-A)
- `export_delivery_status_tracked` — initial delivery record created
- `export_delivery_retry_initiated` — manual or automatic retry
- `export_delivery_cancelled` — user cancelled delivery
- `export_delivery_failed` — permanent failure after max retries
- `export_delivery_resent` — manual resend initiated

### Audit Field Requirements
- `master_general_agent_id` — MGA scope
- `master_group_id` — Broker/Agency scope (if applicable)
- `actor_email` — user initiating action
- `export_id` — reference to original export
- `delivery_status` — new status
- `failure_reason` (if applicable)
- `timestamp` — audit timestamp

---

## 11. UI/UX Assessment

### Gate 6J-A UI Requirements (IN SCOPE)
- Export delivery status in `MGAExportHistoryPanel` (extend existing)
  - Status badge: pending, sent, failed, cancelled
  - Retry button (mga_manager only)
  - Cancel button (mga_admin + export owner)
  - Failure reason tooltip (if failed)
- Export detail modal with delivery timeline

### Gate 6J-B/C UI Deferred
- Email recipient management UI
- Webhook endpoint registration UI

---

## 12. Integration with Gates 6C, 6D, 6G, 6I-A, 6I-B

### Gate 6C Integration (Report Export)
Gate 6J-A adds delivery status tracking **after** export generation.
- No change to Gate 6C export logic
- Delivery status is supplementary metadata
- Gate 6C regression: PASS

### Gate 6D Integration (Export History)
Gate 6J-A extends export history with delivery status.
- No breaking changes to history schema
- Delivery status queries optional (backward compatible)
- Gate 6D regression: PASS

### Gate 6G Integration (Report Export UI)
Gate 6J-A extends UI with delivery status controls.
- No change to export button
- Delivery panel is new, non-breaking
- Gate 6G regression: PASS

### Gate 6I-A Integration (Templates & Schedules)
Gate 6J-A provides governance foundation for scheduled exports.
- Schedule definitions remain metadata-only
- Gate 6I-A unchanged
- Gate 6I-B will depend on Gate 6J-A governance

### Gate 6I-B Deferral (Recurring Execution)
Gate 6J-A **enables** future Gate 6I-B by providing:
- Delivery governance framework
- Retry/cancel policies
- Idempotent delivery contracts
- Audit trail for scheduled runs

**Dependency:** Gate 6I-B design will reference Gate 6J-A policies

---

## 13. Validation Requirements

### Gate 6J-A Validation (Delivery Status & Retry/Cancel)
- Unit tests: retry strategy, cancel idempotency, audit events
- Integration tests: permission enforcement, scope isolation
- Regression tests: Gates 6C, 6D, 6G, 6I-A unchanged
- Audit trail validation: all 5 new event types logged
- UI validation: status badges, retry/cancel buttons

**Test Target:** ~25 tests (delivery logic + permissions + scope)

### Build & Lint
- ESLint: PASS
- Jest: PASS
- Build: PASS

---

## 14. Risk Assessment

### Low Risk (Gate 6J-A)
- In-app status tracking only (no external delivery)
- Existing export data already validated
- Permission/scope gates already enforced
- Audit trail uses existing event infrastructure

### Medium Risk (Gate 6J-B/C)
- Email delivery: unsubscribe governance, SPAM filtering, bounce handling
- Webhook delivery: endpoint security, retry storms, payload encryption

**Mitigation:** Defer to separate gates with dedicated security design

### Residual Risk
- Retry storm if max retries unbounded — mitigated by exponential backoff + max 3 auto retries
- Cancel race condition if resend in-flight — mitigated by idempotent design and atomic state checks

---

## 15. Recommendation

### Proceed with Gate 6J-A
**Gate 6J-A — Delivery Status, Retry/Cancel Governance, Manual Resend Controls**

**Rationale:**
1. Delivery governance is foundational for Gate 6I-B (recurring execution)
2. In-app delivery tracking is low-risk (no external delivery channels)
3. Existing export data already scoped and audited
4. Retry/cancel logic is stateless and idempotent
5. Enables safe design of Gate 6I-B before implementation

**Deliverables:**
- `ExportDeliveryStatus` schema (design-only, optional database table for future)
- Service: `reportDeliveryService.js` — delivery status, retry/cancel logic
- Tests: ~25 tests covering retry, cancel, permissions, scope, audit
- UI: extend `MGAExportHistoryPanel` with status badges and controls
- Audit: 5 new event types
- Registry: GATE-6J-A DISCOVERY_COMPLETE

### Defer Gate 6J-B and Gate 6J-C
**Gate 6J-B — Email Delivery** and **Gate 6J-C — Webhook Delivery**

**Deferral Reason:**
- External delivery introduces recipient, payload, unsubscribe, endpoint security, and retry storm complexities
- Separate security design required per method
- No dependency on Gates 6C–6I-A (can be designed in parallel)
- Operator review needed before design begins

**Future Scope (if approved):**
- Email: SMTP integration, bounce handling, unsubscribe policy, GDPR compliance
- Webhook: endpoint validation, signature/HMAC, retry storm protection, encryption, audit

---

## Registry State (Gate 6J)

```json
{
  "gateId": "GATE-6J",
  "gateName": "Export Delivery Enhancements",
  "phase": "6",
  "status": "DISCOVERY_PREFLIGHT",
  "activation": "INACTIVE",
  "implementation": "NOT_STARTED",
  "capability": "Delivery status tracking, retry/cancel governance, manual resend controls",
  "proposedSplit": "6J-A Delivery Status + Retry/Cancel (IN SCOPE); 6J-B Email Delivery (DEFERRED); 6J-C Webhook Delivery (DEFERRED)",
  "dependsOn": ["GATE-6C", "GATE-6D", "GATE-6G", "GATE-6I-A"],
  "deferredDependency": "GATE-6I-B",
  "notes": "Discovery/preflight complete 2026-05-12. Gate 6J-A recommended for design and implementation; Deferred Gates 6J-B and 6J-C pending separate security design and operator approval."
}
```

---

## Next Steps

1. **Operator Review:** Review this discovery/preflight report
2. **Gate 6J-A Design Approval:** Proceed to design/implementation specification for Gate 6J-A
3. **Gates 6J-B/C Deferral:** Hold for separate security design and operator approval
4. **Gate 6I-B Readiness:** Once Gate 6J-A is active, Gate 6I-B design can reference delivery governance policies

---

**Prepared by:** Platform Engineering  
**Date:** 2026-05-12  
**Status:** DISCOVERY_PREFLIGHT — Awaiting Operator Review