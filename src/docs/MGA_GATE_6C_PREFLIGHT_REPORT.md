# MGA Gate 6C — Report Exports Preflight Report

**Gate ID:** `GATE-6C-PENDING`  
**Gate Name:** Report Exports / MGA Dashboard Reporting  
**Preflight Date:** 2026-05-11  
**Preflight Type:** Readiness Assessment (Pre-Approval)  
**Status:** 🔴 NOT APPROVED — INACTIVE  
**Authored By:** Platform Engineering — MGA Program Management  
**Gate 6B Status (Reference):** 🟢 CLOSED — Unaffected by this preflight

> **IMPORTANT:** This document is a preflight/readiness assessment only. Gate 6C is not approved and report exports are not activated. No runtime changes were made during this preflight. Gate 6B (`TXQUOTE_TRANSMIT_ENABLED = true`) remains fully live and unaffected.

---

## Section 1 — Current Report Export Inventory

### 1.1 Components

| Component | Path | Purpose | Active? |
|---|---|---|---|
| `ExportProposalPDF` | `functions/exportProposalPDF` | Proposal-level PDF export (backend function) | ✅ Active (proposals only — **not** MGA report exports) |
| `FullDocumentationExport` | `functions/fullDocumentationExport` | Help/documentation export | ✅ Active (help system only) |
| No MGA export modal | — | MGA-scoped export dialog | ❌ Not created |
| No MGA export panel | — | MGA dashboard export panel | ❌ Not created |

> **Note:** Existing export functions (`exportProposalPDF`, `fullDocumentationExport`) are **not** MGA report exports. They are scoped to proposals and the help system respectively and are not covered by Gate 6C. Gate 6C refers exclusively to MGA-scoped case/activity/performance reporting exports.

### 1.2 API Routes / Backend Functions

| Function | Scope | MGA Report Export? |
|---|---|---|
| `exportProposalPDF` | Proposal | ❌ No |
| `fullDocumentationExport` | Help system | ❌ No |
| MGA case export function | — | ❌ NOT CREATED |
| MGA activity log export | — | ❌ NOT CREATED |
| MGA performance report export | — | ❌ NOT CREATED |

**Finding:** No MGA-scoped report export backend functions exist. Gate 6C has zero implementation footprint.

### 1.3 Feature Flags

| Flag | Location | Value | Purpose |
|---|---|---|---|
| `TXQUOTE_TRANSMIT_ENABLED` | `components/mga/MGACaseWorkflowPanel.jsx:13` | `true` | Gate 6B — TXQuote transmit (unaffected) |
| `MGA_REPORT_EXPORTS_ENABLED` | — | **NOT DEFINED** | Gate 6C — does not yet exist |

**Finding:** No Gate 6C feature flag is defined. Implementation must define `MGA_REPORT_EXPORTS_ENABLED = false` as its first step, before any UI or service code is written.

### 1.4 UI Entry Points / Buttons

| Entry Point | Location | Visible to Users? |
|---|---|---|
| MGA export button | — | ❌ NOT CREATED |
| Export panel trigger | — | ❌ NOT CREATED |
| Download link | — | ❌ NOT CREATED |
| Report modal | — | ❌ NOT CREATED |

**Finding:** No export UI exists. Users cannot see or invoke any MGA report export from any page.

### 1.5 Modal / Export Workflow Files

| File | Status |
|---|---|
| `components/mga/MGAReportExportModal` | ❌ NOT CREATED |
| `components/mga/MGAReportExportPanel` | ❌ NOT CREATED |
| `lib/mga/services/reportingService.js` | ✅ EXISTS (stub — no active export logic) |

> `reportingService.js` exists as a stub in the service layer but contains no active export dispatch logic and is not wired to any UI or backend function.

### 1.6 Storage / Output Paths

| Output Type | Status | Notes |
|---|---|---|
| PDF generation (MGA) | ❌ Not implemented | Would require jsPDF or similar |
| CSV generation (MGA) | ❌ Not implemented | No serializer defined |
| XLSX generation (MGA) | ❌ Not implemented | No library wired for MGA scope |
| Email delivery of reports | ❌ Not implemented | Would route through `SendEmail` integration |
| Download link / signed URL | ❌ Not implemented | Would use `UploadFile` + `CreateFileSignedUrl` pattern |

---

## Section 2 — Current Activation State

### 2.1 Export Remain Inactive
✅ **CONFIRMED** — No MGA report export functions, modals, panels, download links, or storage paths exist or are active.

### 2.2 No Export Button Visible to Users
✅ **CONFIRMED** — No export button or trigger is rendered in any MGA page, panel, or tab. A visual audit of `MasterGeneralAgentCommand`, `MGACaseWorkflowPanel`, `MGADocumentsPanel`, `MGAAuditPanel`, and `MGAMasterGroupPanel` confirms zero export affordances.

### 2.3 No Export Route Callable Without Authorization
✅ **CONFIRMED** — No export-specific backend function exists. The existing `exportProposalPDF` and `fullDocumentationExport` functions are unrelated to MGA reporting and are independently access-controlled.

### 2.4 Gate 6B TXQuote Transmit Unaffected
✅ **CONFIRMED** — `TXQUOTE_TRANSMIT_ENABLED = true` in `MGACaseWorkflowPanel.jsx`. The transmit button, modal, and service remain fully live. This preflight made no changes to Gate 6B.

---

## Section 3 — Proposed Gate 6C Approval Criteria

Gate 6C may only be approved and activated once **all** of the following criteria are met:

### 3.1 Required Tests
- [ ] RBAC enforcement: only `mga_admin`, `mga_manager`, `platform_super_admin`, `admin` can invoke exports
- [ ] Scope isolation: exported data is strictly scoped to the requesting user's MGA; no cross-MGA records
- [ ] Empty-set handling: graceful report generation when no data exists in scope
- [ ] Idempotency: same export request within a time window returns cached result, not duplicate run
- [ ] Audit logging: every export invocation logged with actor email, timestamp, export type, MGA scope, outcome
- [ ] Partial failure handling: report generation fails cleanly with no partial file delivered to user
- [ ] Download link expiry: signed URLs must expire within a defined window (recommended: 300s)
- [ ] Rate limiting: burst export requests must be rejected with 429 before queuing

### 3.2 Required Build Validation
- [ ] No build errors across all modified or added files
- [ ] Feature flag `MGA_REPORT_EXPORTS_ENABLED` defined and defaults to `false`
- [ ] All import paths resolve correctly (no ENOENT errors)
- [ ] No new ESLint or TypeScript type errors introduced

### 3.3 Required Rollback Behavior
- [ ] Setting `MGA_REPORT_EXPORTS_ENABLED = false` must: hide all export UI, prevent service calls, return `FEATURE_DISABLED` on direct invocation
- [ ] Rollback must be achievable without code changes (flag-only)
- [ ] Rollback must not affect Gate 6A (Invite User) or Gate 6B (TXQuote Transmit)

### 3.4 Required Fail-Closed Behavior
- [ ] Any unauthenticated export request → 401 Unauthorized
- [ ] Any unauthorized role export request → 403 Forbidden
- [ ] Any out-of-scope export request (wrong MGA) → 403 Forbidden + audit log entry
- [ ] Any malformed export request (missing required params) → 400 Bad Request

### 3.5 Required Audit/Logging Expectations
- [ ] Export initiated: actor, MGA ID, export type, timestamp
- [ ] Export completed: file size, record count, delivery method
- [ ] Export failed: error class, stack summary, no partial artifact delivered
- [ ] Export rate-limited or rejected: actor, reason, timestamp

### 3.6 Export Idempotency Expectations
- [ ] Each export request must carry or generate a unique idempotency key
- [ ] Duplicate requests within a configurable window (e.g. 60s) must return the existing artifact URL, not trigger a second generation
- [ ] Idempotency keys must be stored in `ActivityLog` or a dedicated export log entity

---

## Section 4 — Risk Review

### 4.1 Data Leakage Risk
**Severity: HIGH**  
Export functions operate on aggregated datasets. If MGA scope filtering is not applied before data serialization, records from other MGAs could be included in the export artifact.  
**Mitigation Required:** All export queries must apply `master_general_agent_id` filter at the service layer before data is passed to the serializer. Scope validation must run via `scopeGate.js` before any query executes.

### 4.2 Unauthorized Export Risk
**Severity: HIGH**  
If the backend function does not enforce RBAC, any authenticated user could invoke the export endpoint directly (bypassing UI controls).  
**Mitigation Required:** Backend function must call `base44.auth.me()`, verify role against `TRANSMIT_AUTHORIZED_ROLES` equivalent, and return 403 on failure. UI-only guards are insufficient.

### 4.3 Duplicate Export Risk
**Severity: MEDIUM**  
Rapid repeated export requests (user double-click, retry logic) could result in multiple large files being generated and stored simultaneously.  
**Mitigation Required:** Idempotency key enforcement per 3.6 above. Rate limiting at function level.

### 4.4 Partial / Failed Export Risk
**Severity: MEDIUM**  
If the export function times out or errors mid-generation, a partial file could be stored and a broken download link could be delivered to the user.  
**Mitigation Required:** Atomic artifact generation — file must only be uploaded and URL generated after 100% successful serialization. On failure, no URL is returned and error is surfaced cleanly.

### 4.5 Incorrect Case / Report Binding Risk
**Severity: MEDIUM**  
Export report may bind to the wrong case or date range if filter parameters are not validated server-side.  
**Mitigation Required:** All export scope parameters (case IDs, date ranges, MGA ID) must be validated and re-resolved from the authenticated user's scope, not trusted from the client payload.

---

## Section 5 — Recommended Implementation Plan

> This is a forward-looking recommendation only. No implementation should begin until Gate 6C is explicitly approved.

### 5.1 Files Likely to Change / Create

| File | Action | Notes |
|---|---|---|
| `components/mga/MGAReportExportModal.jsx` | CREATE | User-facing export configuration UI |
| `components/mga/MGAAuditPanel.jsx` | MODIFY | Add export trigger (when approved) |
| `lib/mga/services/reportingService.js` | EXPAND | Add actual export dispatch logic |
| `functions/exportMGAReport.js` | CREATE | Backend function — scoped report generation |
| `docs/MGA_GATE_6C_CLOSEOUT_REPORT.md` | CREATE | Post-approval closeout report |

### 5.2 Tests to Add / Update

- `lib/mga/gate6c.tests.js` — new test file covering all criteria in Section 3.1
- Update `docs/QUOTE_CONNECT_360_GATE_REGISTRY.json` upon approval

### 5.3 Feature Flag Strategy
1. Define `MGA_REPORT_EXPORTS_ENABLED = false` in export modal and backend function **before** any other code
2. All export UI and service code must be gated behind this flag
3. Flag defaults to `false`; must be explicitly changed to `true` only after formal Gate 6C approval
4. Flag location: export modal component (UI gate) + backend function (service gate)

### 5.4 Rollback Strategy
- Set `MGA_REPORT_EXPORTS_ENABLED = false` → full deactivation, no deploy required
- Rollback must not affect `TXQUOTE_TRANSMIT_ENABLED` (Gate 6B)
- Backend function must independently check flag and return `FEATURE_DISABLED` if false

---

## Section 6 — Final Recommendation

### 6.1 Gate 6C Status
🔴 **KEEP AS: NOT APPROVED / INACTIVE**

Gate 6C does not meet approval criteria because:
1. No implementation exists to validate
2. No tests have been written or run
3. No feature flag is defined
4. No security review has been conducted
5. No business requirements document has been approved
6. Data leakage and unauthorized access risks have not been formally mitigated

### 6.2 Gate 6B Status (Unchanged)
🟢 **GATE 6B REMAINS: CLOSED** — `TXQUOTE_TRANSMIT_ENABLED = true` — Unaffected

### 6.3 Directive
- ❌ Do NOT mark Gate 6C closed
- ❌ Do NOT activate report exports
- ❌ Do NOT expose export/download UI
- ❌ Do NOT make export routes callable in production
- ✅ DO treat this preflight report as the official entry point for future Gate 6C work
- ✅ DO require a formal approval request before any Gate 6C implementation begins

---

## Preflight Outcome Summary

| Check | Result |
|---|---|
| Export inventory complete | ✅ PASS |
| Zero active export footprint confirmed | ✅ PASS |
| Gate 6B unaffected | ✅ PASS |
| Approval criteria defined | ✅ PASS |
| Risk review complete | ✅ PASS |
| Implementation plan documented | ✅ PASS |
| Gate 6C status: NOT APPROVED | ✅ CONFIRMED |

**Preflight Result: 🟡 READY FOR FUTURE APPROVAL PROCESS — NOT YET APPROVED**

---

*End of Gate 6C Preflight Report*  
*Commit reference: `docs(qc360): add Gate 6C report exports preflight`*