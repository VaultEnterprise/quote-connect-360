# MGA Gate 6D — Static Inventory

**Gate ID:** `GATE-6D`  
**Gate Name:** Export Delivery History & Tracking  
**Document Type:** Static Inventory (No Implementation)  
**Date:** 2026-05-12  
**Status:** 🔵 DESIGN_SPEC_COMPLETE  
**Implementation Status:** ❌ NOT_STARTED  
**Runtime Changes:** NONE

---

## Section 1 — Current File / Component Review

### 1.1 components/mga/*

| File | Relevant | Expected Change | Risk | Reason |
|---|---|---|---|---|
| `MGACaseWorkflowPanel.jsx` | YES | MODIFY | LOW | Feature flag constant added here for Gate 6C; Gate 6D flag (`MGA_EXPORT_HISTORY_ENABLED`) will be added here |
| `MGAReportExportModal.jsx` | POSSIBLE | READ ONLY | LOW | Gate 6C export modal; Gate 6D may reference its report type constants |
| `MGATXQuoteTransmitModal.jsx` | NO | NONE | NONE | Gate 6B file; protected; no interaction |
| `MGAInviteUserModal.jsx` | NO | NONE | NONE | Gate 6A file; protected; no interaction |
| `MGAUsersPanel.jsx` | NO | NONE | NONE | Gate 6A file; protected; no interaction |
| `MGAAuditPanel.jsx` | POSSIBLE | READ ONLY | LOW | Existing audit panel; Gate 6D history may reference audit display patterns |
| `MGADocumentsPanel.jsx` | NO | NONE | NONE | Unrelated to export history |
| `MGAHeader.jsx` | NO | NONE | NONE | Layout only; no history functionality |
| `MGAKPIBar.jsx` | NO | NONE | NONE | KPI metrics; not affected |
| `MGAMasterGroupPanel.jsx` | NO | NONE | NONE | Master group management; not affected |
| `MGAScopeErrorBoundary.jsx` | POSSIBLE | READ ONLY | LOW | Used for error boundary pattern; Gate 6D should follow same pattern |
| **NEW** `MGAExportHistoryPanel.jsx` | YES | NEW | LOW | Primary Gate 6D UI component (future) |
| **NEW** `ExportHistoryTable.jsx` | YES | NEW | LOW | History list table (future) |
| **NEW** `ExportArtifactDownloadModal.jsx` | YES | NEW | LOW | Re-download dialog (future) |

---

### 1.2 functions/*

| File | Relevant | Expected Change | Risk | Reason |
|---|---|---|---|---|
| `mgaReportExport.js` | YES | READ ONLY | LOW | Gate 6C backend; defines audit event patterns Gate 6D will follow |
| `sendTxQuote.js` | NO | NONE | NONE | Gate 6B file; protected |
| `exportProposalPDF.js` | NO | NONE | NONE | Unrelated proposal export |
| `calculateQuoteRates.js` | NO | NONE | NONE | Unrelated |
| `helpAIAnswer.js` | NO | NONE | NONE | Unrelated |
| *(all other functions)* | NO | NONE | NONE | Unrelated to export history |
| **NEW** `mgaExportHistory.js` | YES | NEW | LOW | Gate 6D backend function (future) |

---

### 1.3 lib/mga/*

| File | Relevant | Expected Change | Risk | Reason |
|---|---|---|---|---|
| `reportExportPermissions.js` | YES | MODIFY | LOW | Existing Gate 6C permission keys; Gate 6D history keys will be added here |
| `reportExportFieldPolicy.js` | YES | READ ONLY | LOW | Field exclusion rules referenced by Gate 6D safe payload design |
| `reportExportAudit.js` | YES | READ ONLY | LOW | Audit logging patterns; Gate 6D will extend with history-specific events |
| `scopeGate.js` | YES | READ ONLY | LOW | Core scope enforcement; used as-is for Gate 6D history reads |
| `scopeResolver.js` | YES | READ ONLY | LOW | Scope resolution logic; used as-is |
| `permissionResolver.js` | YES | MODIFY | LOW | Will need new history permission keys registered |
| `errorModel.js` | POSSIBLE | READ ONLY | LOW | Error taxonomy; Gate 6D should use existing error codes |
| `auditDecision.js` | POSSIBLE | READ ONLY | LOW | Audit decision helpers; Gate 6D follows same pattern |
| `asyncScopeRules.js` | POSSIBLE | READ ONLY | LOW | Async scope rules; may inform Gate 6D query scoping |
| `impersonationControl.js` | NO | NONE | NONE | Admin impersonation; not affected |
| `phase2.tests.js` | NO | NONE | NONE | Legacy test scaffolding; not affected |
| `phase3.tests.js` | NO | NONE | NONE | Legacy test scaffolding; not affected |
| **NEW** `reportExportHistoryPermissions.js` | YES | NEW | LOW | Gate 6D history permission key definitions (future) |

---

### 1.4 lib/mga/services/*

| File | Relevant | Expected Change | Risk | Reason |
|---|---|---|---|---|
| `reportExportService.js` | YES | READ ONLY | LOW | Gate 6C export service; history service will mirror its scope/auth pattern |
| `auditService.js` | YES | READ ONLY | LOW | Core audit service; Gate 6D queries ActivityLog via this service |
| `caseService.js` | POSSIBLE | READ ONLY | LOW | May be referenced for case-scoped history queries |
| `quoteService.js` | POSSIBLE | READ ONLY | LOW | May be referenced for quote-scoped history queries |
| `mgaService.js` | YES | READ ONLY | LOW | MGA scope resolution; required for history queries |
| `masterGroupService.js` | POSSIBLE | READ ONLY | LOW | Master group scope; used for history filtering |
| `censusService.js` | NO | NONE | NONE | Census data; not related to export history |
| `enrollmentService.js` | NO | NONE | NONE | Enrollment; not affected |
| `notificationService.js` | NO | NONE | NONE | Notifications; not affected by Gate 6D |
| `reportingService.js` | POSSIBLE | READ ONLY | LOW | Existing reporting service; may overlap with history queries |
| `searchService.js` | POSSIBLE | READ ONLY | LOW | May be used for history search/filter |
| `txquoteService.js` | NO | NONE | NONE | Gate 6B file; protected |
| `userAdminService.js` | NO | NONE | NONE | Gate 6A file; protected |
| `webhookService.js` | NO | NONE | NONE | Webhook delivery; not in Gate 6D scope |
| **NEW** `exportHistoryService.js` | YES | NEW | LOW | Gate 6D history query service (future) |

---

### 1.5 tests/mga/*

| File | Relevant | Expected Change | Risk | Reason |
|---|---|---|---|---|
| `gate6c-report-export.test.js` | YES | READ ONLY | LOW | Gate 6C test suite; regression baseline for Gate 6D |
| **NEW** `gate6d-export-history.test.js` | YES | NEW | LOW | Gate 6D 40–50 test suite (future) |

---

### 1.6 docs/*

| File | Relevant | Expected Change | Risk | Reason |
|---|---|---|---|---|
| `MGA_GATE_6D_DISCOVERY_PREFLIGHT.md` | YES | READ ONLY | NONE | Gate 6D discovery; source for inventory |
| `MGA_GATE_6D_PLANNING_PACKET.md` | YES | READ ONLY | NONE | Gate 6D planning; source for design spec |
| `MGA_GATE_6C_IMPLEMENTATION_CLOSEOUT_REPORT.md` | YES | READ ONLY | NONE | Gate 6C closeout; referenced for regression baseline |
| `MGA_GATE_6C_DESIGN_SPECIFICATION.md` | YES | READ ONLY | NONE | Gate 6C design; pattern reference for Gate 6D |
| `QUOTE_CONNECT_360_GATE_REGISTRY.json` | YES | MODIFY | NONE | Registry update required |
| `MGA_GATE_6B_AMENDED_CLOSEOUT_REPORT.md` | NO | NONE | NONE | Gate 6B closeout; protected reference only |
| `MGA_GATE_6A_CLOSEOUT_REPORT.md` | NO | NONE | NONE | Gate 6A closeout; protected reference only |
| **NEW** `MGA_GATE_6D_STATIC_INVENTORY.md` | YES | NEW | NONE | This document |
| **NEW** `MGA_GATE_6D_DESIGN_SPECIFICATION.md` | YES | NEW | NONE | Design spec (parallel document) |

---

## Section 2 — Gate 6D Relevance Classification Summary

### Files Requiring Modification (When Implemented)

| File | Change Type | Justification |
|---|---|---|
| `components/mga/MGACaseWorkflowPanel.jsx` | MODIFY | Add `MGA_EXPORT_HISTORY_ENABLED = false` flag constant |
| `lib/mga/reportExportPermissions.js` | MODIFY | Add history permission key constants |
| `lib/mga/permissionResolver.js` | MODIFY | Register history permission → role mappings |
| `docs/QUOTE_CONNECT_360_GATE_REGISTRY.json` | MODIFY | Registry status updates |

### New Files to Create (When Implemented)

| File | Type | Purpose |
|---|---|---|
| `components/mga/MGAExportHistoryPanel.jsx` | Frontend Component | History dashboard UI |
| `components/mga/ExportHistoryTable.jsx` | Frontend Component | Paginated history list |
| `components/mga/ExportArtifactDownloadModal.jsx` | Frontend Component | Re-download confirmation |
| `lib/mga/reportExportHistoryPermissions.js` | Library | History permission key definitions |
| `lib/mga/services/exportHistoryService.js` | Service | History query + scope validation |
| `functions/mgaExportHistory.js` | Backend Function | Fail-closed history handler |
| `tests/mga/gate6d-export-history.test.js` | Test Suite | 40–50 history tests |
| `docs/MGA_GATE_6D_IMPLEMENTATION_PLAN.md` | Documentation | Implementation work order |
| `docs/MGA_GATE_6D_TEST_MATRIX.md` | Documentation | Test matrix |
| `docs/MGA_GATE_6D_IMPLEMENTATION_CLOSEOUT_REPORT.md` | Documentation | Post-implementation closeout |

---

## Section 3 — Existing Audit / Event Sources

### Gate 6C Audit Events (Potential History Source)

Gate 6C's `reportExportAudit.js` logs the following events to the `ActivityLog` entity:

| Audit Event | Logged By | Useful for Gate 6D? |
|---|---|---|
| `export_ui_viewed` | Frontend | ✅ YES — shows who viewed export UI |
| `export_requested` | Backend | ✅ YES — primary history source |
| `export_auth_check` | Backend | ✅ YES — authorization outcome |
| `export_scope_validated` | Backend | ✅ YES — scope enforcement record |
| `export_generation_started` | Backend | ✅ YES — processing start timestamp |
| `export_generation_completed` | Backend | ✅ YES — success + record count |
| `export_generation_failed` | Backend | ✅ YES — failure reason code |
| `export_download_started` | Backend | ✅ YES — download tracking |
| `export_download_completed` | Backend | ✅ YES — downloaded_at timestamp |
| `export_scope_denied` | Backend | ✅ YES — blocked access record |
| `export_permission_denied` | Backend | ✅ YES — unauthorized access record |
| `export_feature_disabled` | Backend | ✅ YES — flag-blocked access record |
| `export_audit_log_failed` | Backend | POSSIBLE — error condition logging |

### Gap Analysis

| Data Point | Available in ActivityLog? | Gap? |
|---|---|---|
| export_request_id (correlation) | ✅ YES (correlation_id field) | No gap |
| report_type | ✅ YES (stored in detail field) | Minor — may need structured parsing |
| format (csv/xlsx/pdf) | ✅ YES (stored in detail field) | Minor — may need structured parsing |
| requested_by_user_id | ✅ YES (actor_email field) | No gap |
| requested_by_role | ✅ YES (actor_role field) | No gap |
| requested_at | ✅ YES (created_date field) | No gap |
| generated_at | PARTIAL (stored in separate event) | Minor — requires event join |
| downloaded_at | PARTIAL (stored in separate event) | Minor — requires event join |
| expires_at | ❌ NOT STORED in ActivityLog | **Gap** — requires lightweight service layer |
| artifact_available | ❌ NOT STORED in ActivityLog | **Gap** — requires lightweight service layer |
| failure_reason_code | PARTIAL (stored in detail text) | Minor — requires structured parsing |
| record_count | PARTIAL (stored in detail field) | Minor — requires structured parsing |
| cancelled_at | ❌ NOT STORED if cancellation occurs | **Gap** — requires explicit cancel event |

### Recommendation

**Primary source:** ActivityLog entity (Gate 6C audit events)  
**Supplementary layer:** Lightweight `exportHistoryService.js` to:
1. Parse structured fields from audit detail text
2. Compute `expires_at` from `generated_at` + configured TTL
3. Compute `artifact_available` boolean from expiry check
4. Join multi-event records into unified history view

**Decision:** ActivityLog as source of truth + thin service layer. **No new entity required.**

---

## Section 4 — Existing Permissions Review

### Gate 6C Permission Keys (Currently Defined)

| Key | Defined In | Status |
|---|---|---|
| `mga.reports.view` | `lib/mga/reportExportPermissions.js` | ✅ EXISTS (Gate 6C) |
| `mga.reports.export` | `lib/mga/reportExportPermissions.js` | ✅ EXISTS (Gate 6C) |
| `mga.reports.export_csv` | `lib/mga/reportExportPermissions.js` | ✅ EXISTS (Gate 6C) |
| `mga.reports.export_xlsx` | `lib/mga/reportExportPermissions.js` | ✅ EXISTS (Gate 6C) |
| `mga.reports.export_pdf` | `lib/mga/reportExportPermissions.js` | ✅ EXISTS (Gate 6C) |
| `mga.reports.audit` | `lib/mga/reportExportPermissions.js` | ✅ EXISTS (Gate 6C) |

### Gate 6D Permission Keys (Proposed — Not Yet Defined)

| Key | Status | Defined Where (Future) |
|---|---|---|
| `mga.reports.history.view` | ⏳ PROPOSED | `lib/mga/reportExportPermissions.js` (extend) |
| `mga.reports.history.audit` | ⏳ PROPOSED | `lib/mga/reportExportPermissions.js` (extend) |
| `mga.reports.history.retry` | ⏳ PROPOSED | `lib/mga/reportExportPermissions.js` (extend) |
| `mga.reports.history.cancel` | ⏳ PROPOSED | `lib/mga/reportExportPermissions.js` (extend) |

**Status:** All four Gate 6D history permission keys are **PROPOSED ONLY** — not yet defined in any source file.

---

## Section 5 — Existing UI Entry Points

### MGA Command Page (`pages/MasterGeneralAgentCommand.jsx`)

| Element | Current State | Gate 6D Relevance |
|---|---|---|
| Tab navigation | Cases, Census, Quotes tabs | Gate 6D will add "Export History" tab |
| KPI Bar | MGA performance metrics | Not directly affected |
| Panel composition | Uses `MGACaseWorkflowPanel` | History panel wired here (future) |
| Role gate | Checks user role for access | History tab uses same role gate |

### Report / Export Modal (`components/mga/MGAReportExportModal.jsx`)

| Element | Current State | Gate 6D Relevance |
|---|---|---|
| Export trigger | Opens from workflow panel | Gate 6D "View History" link may appear here |
| Export success state | Shows download link | May link to history entry (future) |
| Modal state machine | Multi-step export flow | Not modified; referenced only |

### Case Workflow Panel (`components/mga/MGACaseWorkflowPanel.jsx`)

| Element | Current State | Gate 6D Relevance |
|---|---|---|
| Feature flag constants | `TXQUOTE_TRANSMIT_ENABLED`, `MGA_REPORT_EXPORTS_ENABLED` | `MGA_EXPORT_HISTORY_ENABLED = false` added here |
| Tab list | Cases / Census / Quotes | Export History tab added (future) |
| Quotes panel | Shows transmit button | Not affected |
| Report export integration | Hidden when flag false | History tab hidden when its flag false |

### Planned Gate 6D Entry Point

| Location | Component | Gate 6D Usage |
|---|---|---|
| `MGACaseWorkflowPanel` — new tab | `MGAExportHistoryPanel` | Primary history surface |
| `MGAExportHistoryPanel` — row expand | `ExportArtifactDownloadModal` | Re-download dialog (if artifact valid) |
| `MGAReportExportModal` — success state | Navigation link | "View in history" link (optional future) |

---

## Section 6 — Protected Files

### Gate 6A Protected Files (Must NOT Touch)

| File | Protection Reason |
|---|---|
| `components/mga/MGAInviteUserModal.jsx` | Gate 6A implementation |
| `components/mga/MGAUsersPanel.jsx` | Gate 6A implementation |
| `lib/mga/services/userAdminService.js` | Gate 6A service layer |

### Gate 6B Protected Files (Must NOT Touch)

| File | Protection Reason |
|---|---|
| `components/mga/MGATXQuoteTransmitModal.jsx` | Gate 6B implementation |
| `lib/mga/services/txquoteService.js` | Gate 6B service layer |
| `functions/sendTxQuote.js` | Gate 6B backend function |

### Gate 6C Protected Files (Read-Only Reference Only)

| File | Protection Reason |
|---|---|
| `components/mga/MGAReportExportModal.jsx` | Gate 6C UI; no modification |
| `lib/mga/reportExportFieldPolicy.js` | Gate 6C policy; read-only reference |
| `lib/mga/reportExportAudit.js` | Gate 6C audit; read-only reference |
| `lib/mga/services/reportExportService.js` | Gate 6C service; read-only reference |
| `functions/mgaReportExport.js` | Gate 6C backend; no modification |
| `tests/mga/gate6c-report-export.test.js` | Gate 6C tests; regression baseline only |

### Unrelated Protected Files (Must NOT Touch)

| Category | Files |
|---|---|
| Auth & routing | `lib/AuthContext.jsx`, `App.jsx` routing |
| Tenant | `entities/Tenant.json` |
| Messaging | `lib/mga/services/notificationService.js`, `sendEnrollmentInvite.js` |
| DocuSign | `functions/docuSignWebhook.js`, `functions/sendDocuSignEnvelope.js` |
| Help system | All `functions/seed*`, `functions/help*`, `functions/generate*` |
| Census import | `functions/processCensusImportJob.js` and related |
| All portal files | `pages/EmployeePortal*`, `pages/EmployerPortal*` |

---

## Section 7 — Zero-Implementation Certification

```
Runtime code changed:               ✅ NONE
New feature flags enabled:          ✅ NONE
New feature flags created:          ✅ NONE
Export History UI exposed:          ✅ NOT EXPOSED
Backend history actions callable:   ✅ NOT CALLABLE
Gate 6C flag modified:              ✅ NOT MODIFIED — MGA_REPORT_EXPORTS_ENABLED = false
Gate 6C activated:                  ✅ NOT ACTIVATED
Gate 6C runtime behavior modified:  ✅ NOT MODIFIED
Gate 6B modified:                   ✅ NOT MODIFIED
Gate 6A modified:                   ✅ NOT MODIFIED
```

---

*End of MGA Gate 6D Static Inventory*  
*Document Date: 2026-05-12*  
*Status: COMPLETE — No runtime changes*