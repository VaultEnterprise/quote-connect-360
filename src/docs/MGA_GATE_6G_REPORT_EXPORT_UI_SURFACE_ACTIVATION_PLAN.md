# Gate 6G — Report Export UI Surface Activation Plan

**Document Type:** Gate Implementation Plan  
**Gate ID:** GATE-6G  
**Classification:** Internal — Platform Engineering / Program Management  
**Date:** 2026-05-12  
**Prepared By:** Platform Engineering — MGA Program Management  
**Status:** IMPLEMENTATION_IN_PROGRESS  

---

## Section 1 — Objective

Gate 6G activates the Report Export UI surface for authorized MGA users, surfacing the previously-hidden report export action in the MGA workflow panel. This is a **UI-surface activation only** — no backend export security model changes.

**Key scope:**
- Set `MGA_REPORT_EXPORTS_ENABLED = true` in `MGACaseWorkflowPanel`
- Add Report Export button to workflow tabs
- Render `MGAReportExportModal` when authorized
- Preserve all backend Gate 6C controls
- Keep Gate 6D inactive
- No MasterGroup or master_group_id changes

---

## Section 2 — Current Hidden UI State

**Before Gate 6G:**
- `MGA_REPORT_EXPORTS_ENABLED = false` in `MGACaseWorkflowPanel`
- Report Export button absent from UI
- `MGAReportExportModal` component exists but never rendered
- Backend export functions fully operational but unreachable from UI

**After Gate 6G:**
- `MGA_REPORT_EXPORTS_ENABLED = true`
- Report Export button visible for authorized scoped users only
- `MGAReportExportModal` rendered when button clicked
- Backend export functions accessible via modal

---

## Section 3 — Operator Approval Reference

**Approval Date:** 2026-05-12  
**Approval Context:**
1. Surface Report Export UI now? **YES** ✓
2. Handle as controlled Gate 6G with smoke validation & rollback? **YES** ✓
3. Gate 6C Report Export UI intentionally hidden? **YES** (confirmed before surfacing)

---

## Section 4 — Files Reviewed

| File | Purpose |
|------|---------|
| `components/mga/MGACaseWorkflowPanel.jsx` | Workflow UI; feature flag location |
| `components/mga/MGAReportExportModal.jsx` | Report export modal (pre-existing) |
| `functions/mgaReportExport.js` | Backend export handler (pre-existing) |
| `lib/mga/reportExportPermissions.js` | Permission catalog (pre-existing) |
| `lib/mga/reportExportFieldPolicy.js` | Field inclusion/masking rules (pre-existing) |
| `lib/mga/reportExportAudit.js` | Audit logging (pre-existing) |
| `lib/mga/services/reportExportService.js` | Export orchestration (pre-existing) |
| `docs/QUOTE_CONNECT_360_GATE_REGISTRY.json` | Gate registry (to update) |
| `docs/MGA_GATE_STATUS_LEDGER.md` | Status ledger (to update) |

---

## Section 5 — Files Changed

| File | Change | Gate |
|------|--------|------|
| `components/mga/MGACaseWorkflowPanel.jsx` | (1) Import `MGAReportExportModal` and `Download` icon; (2) Import `hasPermission` + `EXPORT_PERMISSIONS`; (3) Set `MGA_REPORT_EXPORTS_ENABLED = true`; (4) Add `canExport` state gate; (5) Add export button to TabsList; (6) Add `MGAReportExportModal` render; (7) Add `exportOpen` state | 6G |

**Files NOT changed:**
- `components/mga/MGAReportExportModal.jsx` — no changes; component reused as-is
- `functions/mgaReportExport.js` — no changes; backend intact
- `lib/mga/reportExportPermissions.js` — no changes; permission catalog intact
- `lib/mga/reportExportFieldPolicy.js` — no changes; field policy intact
- `lib/mga/reportExportAudit.js` — no changes; audit logging intact
- `lib/mga/services/reportExportService.js` — no changes; service layer intact

---

## Section 6 — Feature Flag / UI Gate Behavior

### MGA_REPORT_EXPORTS_ENABLED

**Location:** `components/mga/MGACaseWorkflowPanel.jsx` line 26  
**Value:** `true` (Gate 6G)  
**Rollback:** Set to `false` to hide export button and modal instantly  
**No code removal required**

### Permission Gate: canExport

**Logic:** `MGA_REPORT_EXPORTS_ENABLED && hasPermission(userRole, EXPORT_PERMISSIONS.VIEW)`  
**Authorized roles:** `mga_admin`, `mga_manager`, `platform_super_admin`, `admin`  
**Unauthorized roles:** `mga_user`, `mga_read_only`  
**Scope enforcement:** `scopeRequest` passed to modal; backend validates scoped access

---

## Section 7 — Permission Enforcement

### Frontend Gate

Export button visible only when:
- `MGA_REPORT_EXPORTS_ENABLED === true`
- User role has `EXPORT_PERMISSIONS.VIEW`
- MGAId and scopeRequest valid

### Backend Gate (Gate 6C Controls)

All export requests validated by `mgaReportExport` function:
- Scope validation (`scopeGate`)
- Field policy enforcement (`reportExportFieldPolicy`)
- Safe serialization
- Audit logging (`reportExportAudit`)

---

## Section 8 — ScopeGate Enforcement

No changes to scope validation. Backend `mgaReportExport` enforces:
- MGA-scoped data fetch only
- Cross-MGA records excluded
- Cross-tenant records excluded
- Fail-closed on scope mismatch

---

## Section 9 — Field Policy & Audit Controls

No changes to field policy or audit logging:
- `reportExportFieldPolicy` enforces allowed/excluded/masked fields
- Sensitive fields never exported
- `reportExportAudit` logs all export requests/results
- Audit trail immutable

---

## Section 10 — Rollback Plan

**Steps to hide Report Export UI:**
1. Set `MGA_REPORT_EXPORTS_ENABLED = false` in `components/mga/MGACaseWorkflowPanel.jsx`
2. Deploy
3. Export button and modal instantly hidden

**Data impact:** None. Previous exports remain unaffected.

---

## Section 11 — Smoke Test Checklist

- [ ] Build passes
- [ ] Lint / static scan passes
- [ ] Report export UI appears for authorized scoped MGA users
- [ ] Report export UI remains hidden for unauthorized users
- [ ] Report export UI remains hidden for read-only users
- [ ] Export modal opens successfully when button clicked
- [ ] Export modal displays available export types (Case Summary, Quote Scenario, Census Member, MGA Summary, Audit Activity)
- [ ] Export modal loads on button click without errors
- [ ] Authorized scoped export succeeds (prepare + generate)
- [ ] Export history tab remains hidden (Gate 6D inactive)
- [ ] TXQuote transmit unaffected (Gate 6B active)
- [ ] Gate 6A invite unaffected
- [ ] Gate 6E Broker / Agency creation unaffected
- [ ] Gate 6F invite sub-scope unaffected
- [ ] Rollback hides export button instantly

---

## Section 12 — No-Impact Certification

**Gate 6A — Invite User / MGA User Management**
- No changes to user invitation flow
- No changes to permission assignment
- No changes to role validation

**Gate 6B — TXQuote Transmit**
- No changes to transmit button visibility
- No changes to transmit modal
- No changes to transmit authorization
- `TXQUOTE_TRANSMIT_ENABLED = true` unchanged

**Gate 6D — Export Delivery History & Tracking**
- No changes to feature flag
- `MGA_EXPORT_HISTORY_ENABLED = false` unchanged
- Export history tab remains hidden

**Gate 6E — Broker / Agency Organization Creation**
- No changes to Broker / Agency creation
- No changes to MasterGroup entity
- No changes to master_group_id field

**Gate 6F — Broker / Agency User Invite Sub-Scope Assignment**
- No changes to invite sub-scope assignment
- No changes to master_group_id persistence
- No changes to permission resolver

---

## Document Control

| Field | Value |
|-------|-------|
| Document ID | MGA_GATE_6G_REPORT_EXPORT_UI_SURFACE_ACTIVATION_PLAN |
| Version | 1.0 |
| Created | 2026-05-12 |
| Status | IMPLEMENTATION_IN_PROGRESS |
| Author | Platform Engineering — MGA Program Management |