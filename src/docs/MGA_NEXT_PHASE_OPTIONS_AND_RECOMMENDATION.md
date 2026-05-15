# MGA Next Phase Options and Recommendation

**Document Type:** Strategic Planning & Gate Evaluation  
**Date:** 2026-05-12  
**Version:** 1.0  
**Status:** PLANNING — AWAITING_OPERATOR_SELECTION  
**Prepared By:** Base44 AI — Platform Engineering  
**Reference:** Gates 6A–6G Final Closeout Accepted (2026-05-12)  

---

## Executive Summary

Gates 6A–6G are complete and production-ready. This document evaluates six candidate next gates (6H–6M) to identify the highest-value, lowest-risk path forward for MGA platform expansion.

### Recommendation

**Proceed in this order:**

1. **Gate 6H** — Broker / Agency Profile, Edit, Deactivation, and Lifecycle Management (PRIORITY 1)
2. **Gate 6L** — Broker / Agency Contact, Document, and Settings Management (PRIORITY 2)
3. **Gate 6I** — Report Scheduling and Saved Report Templates (PRIORITY 3)
4. **Gate 6J** — Export Delivery Enhancements (PRIORITY 4)
5. **Gate 6K** — MGA Analytics Dashboard Expansion (PRIORITY 5)
6. **Gate 6M** — BrokerAgency Backend Rename Feasibility Study (STUDY_ONLY, low priority)

**Rationale:** Broker/Agency creation and invite sub-scope (Gates 6E–6F) are now active; the next logical gap is lifecycle management (edit, deactivate, profile). Reporting enhancements follow once core administration is complete. Backend rename remains high-risk and should be studied, not implemented.

---

## Section 1 — Candidate Gate Analysis

---

### GATE 6H — Broker / Agency Profile, Edit, Deactivation, and Lifecycle Management

**Priority Rank:** 🔴 **PRIORITY 1** (Recommended First)

#### Capability

Enable MGA administrators to manage the full lifecycle of Broker/Agency (MasterGroup) organizations:
- View and edit organizational profile (name, contact info, address, phone, email, primary contact)
- Deactivate/suspend Broker/Agency (soft delete; user access denial)
- Reactivate deactivated organizations
- Track status and audit history
- Enforce cascade rules (deactivate org → deny access to assigned users)

#### Business Value

**HIGH.** Broker/Agency creation is live; without edit/deactivation, operators cannot correct errors or manage inactive organizations. Currently no way to:
- Fix incorrect names/contact info (must recreate org)
- Deactivate underperforming brokers (stuck in "active" state)
- Suspend/remove brokers who don't meet compliance

#### User Impact

**POSITIVE.** MGA admins gain operational control. Assigned users see immediate access denial on deactivation (fail-closed security).

#### Security/Scope Risk

**LOW.** Status field already exists on MasterGroup. Deactivation logic is simple state transition + permission check. `scopeGate` already validates `master_group_id`; deactivation status can be checked inline.

#### Data/Schema Impact

**MINIMAL.** Add optional fields to MasterGroup entity:
- `status` enum: active, suspended, inactive (already exists in most entities)
- `deactivated_at` timestamp (optional)
- `deactivation_reason` string (optional)

**No migration required.** Existing records default to "active."

#### Dependencies

- Gate 6E (Broker/Agency creation) — ✅ LIVE
- Gate 6F (Sub-scope assignment) — ✅ LIVE
- Permission resolver (update with `deactivate` action) — ✅ READY

#### Files Likely Involved

- `entities/MasterGroup.json` — add status fields
- `components/mga/MGAMasterGroupPanel.jsx` — edit/deactivate UI
- `lib/mga/services/masterGroupService.js` — update/deactivate operations
- `lib/mga/permissionResolver.js` — add `deactivate` permission
- `lib/mga/scopeGate.js` — check deactivation status on access

#### Feature Flags Likely Needed

- `MGA_BROKER_AGENCY_EDIT_ENABLED` (optional; default true after approval)
- `MGA_BROKER_AGENCY_DEACTIVATION_ENABLED` (optional; default true after approval)

#### Permissions Likely Needed

- `mastergroup.edit` — edit profile (mga_admin, platform_super_admin)
- `mastergroup.deactivate` — deactivate/reactivate (mga_admin only)
- `mastergroup.view_audit` — view deactivation history (mga_admin, mga_manager)

#### Estimated Complexity

**MEDIUM.** Status field logic is straightforward; permission checks are standard RBAC. Cascade (deny access to assigned users) requires coordination with user service layer.

#### Recommended Priority

**PRIORITY 1.** Unblocks core Broker/Agency administration. Low risk; high operational value.

#### Recommended Next Action

1. Discovery/preflight — confirm cascade requirements with business
2. Design specification — detail state transitions and user access denial rules
3. Implementation work order — code edit/deactivate features
4. Validation — test state transitions, audit logging, cross-gate regression
5. Closeout — standard gate closeout process

---

### GATE 6I — Report Scheduling and Saved Report Templates

**Priority Rank:** 🟡 **PRIORITY 3** (After Broker/Agency Admin Complete)

#### Capability

Enable users to:
- Schedule recurring report exports (daily, weekly, monthly, custom cron)
- Save report configurations as reusable templates
- Auto-generate reports on schedule (PDF/CSV/XLSX)
- Email/deliver scheduled reports to recipients
- Manage scheduled report list (edit, delete, pause/resume, view history)

#### Business Value

**MEDIUM-HIGH.** Removes manual export burden; stakeholders get consistent data on schedule. Improves visibility into case pipeline, enrollment rates, renewal timelines.

#### User Impact

**POSITIVE.** Users save time on repetitive exports. Stakeholders (employer, broker) get scheduled data without asking.

#### Security/Scope Risk

**MEDIUM.** Must ensure:
- Scheduled reports respect user's scope (MGA + MasterGroup)
- Email delivery targets authorized recipients only
- Report templates can't be shared across MGAs
- Scheduled job execution uses service role (not user impersonation)

#### Data/Schema Impact

**MODERATE.** Create new entities:
- `ScheduledReport` — schedule config, template reference, delivery targets, status, history
- `ReportTemplate` — saved report config (fields, filters, format)

**Migration:** None; fresh tables. Existing reports unaffected.

#### Dependencies

- Gate 6C (Report Exports) — ✅ LIVE (core export engine)
- Gate 6D (Export History) — ✅ LIVE (provides audit trail model)
- Scheduled job infrastructure — ✅ AVAILABLE (Base44 automation)

#### Files Likely Involved

- `entities/ScheduledReport.json` — new entity
- `entities/ReportTemplate.json` — new entity
- `components/mga/MGAScheduledReportsPanel.jsx` — new UI
- `components/mga/MGAReportTemplateModal.jsx` — template builder
- `lib/mga/services/reportSchedulingService.js` — new service
- `functions/executeScheduledReport.js` — backend job handler
- Automations: scheduled job trigger (5-min interval or cron)

#### Feature Flags Likely Needed

- `MGA_REPORT_SCHEDULING_ENABLED` (default false until approved)
- `MGA_REPORT_TEMPLATES_ENABLED` (default false until approved)

#### Permissions Likely Needed

- `reports.schedule` — create/edit scheduled reports (mga_admin, mga_manager)
- `reports.view_templates` — list/view saved templates (mga_admin, mga_manager, mga_user)
- `reports.manage_schedule` — pause/resume/delete schedules (mga_admin)
- `reports.view_schedule_history` — audit scheduled report execution (mga_admin)

#### Estimated Complexity

**HIGH.** Requires new entities, scheduling infrastructure, email delivery coordination, and careful scope validation in async job execution.

#### Recommended Priority

**PRIORITY 3.** High value; moderate complexity. Recommend after Broker/Agency admin is stable (Gates 6H + 6L).

#### Recommended Next Action

1. Discovery/preflight — define schedule types, recipient rules, email provider integration
2. Design specification — entity schemas, job execution model, scope validation in async context
3. Implementation work order — ScheduledReport entity, UI, scheduling service, job handler
4. Validation — test scope enforcement, email delivery, recurring execution, history tracking
5. Closeout — standard gate closeout

---

### GATE 6J — Export Delivery Enhancements: Email, Webhook, and Retry Expansion

**Priority Rank:** 🟡 **PRIORITY 4** (After Core Reports Stable)

#### Capability

Expand export delivery beyond manual download:
- Email export as attachment (direct to recipient inbox)
- Webhook delivery (POST export JSON to external URL)
- Retry/cancel expansion (pause, resume, cancel in-flight exports)
- Delivery history tracking (who received, when, success/failure)
- Recipient allowlist/blocklist (prevent unauthorized forwarding)

#### Business Value

**MEDIUM.** Reduces friction for stakeholders who don't use the platform. Email delivery especially valuable for employer portals (one-click reports to email inbox).

#### User Impact

**POSITIVE.** More distribution channels; less manual work. Allows integration with external systems via webhook.

#### Security/Scope Risk

**MEDIUM-HIGH.** Must ensure:
- Email recipients are authorized (allowlist enforcement)
- Webhook URLs are validated (no arbitrary domains)
- Export content scope enforced before sending (no cross-MGA data leakage)
- Email headers/metadata don't expose sensitive structure

#### Data/Schema Impact

**MODERATE.** Extend ExportHistory entity:
- `delivery_method` enum: manual_download, email, webhook
- `delivery_recipients` array (emails or webhook URLs)
- `delivery_status` enum: pending, success, failed, cancelled
- `delivery_attempts` counter (for retry logic)

**Migration:** None; additive fields.

#### Dependencies

- Gate 6C (Report Exports) — ✅ LIVE
- Gate 6D (Export History) — ✅ LIVE
- Email provider (SMTP or external service) — ✅ AVAILABLE
- Webhook delivery infrastructure — ✅ BASE44_STANDARD

#### Files Likely Involved

- `entities/ExportHistory.json` — extend with delivery fields
- `components/mga/MGAReportExportModal.jsx` — add email/webhook delivery UI
- `lib/mga/services/reportExportService.js` — extend with delivery logic
- `lib/mga/reportExportRecipientValidation.js` — new allowlist/blocklist
- `functions/deliverExportEmail.js` — email delivery backend
- `functions/deliverExportWebhook.js` — webhook delivery backend
- `functions/retryFailedDelivery.js` — retry handler

#### Feature Flags Likely Needed

- `MGA_EXPORT_EMAIL_DELIVERY_ENABLED` (default false)
- `MGA_EXPORT_WEBHOOK_DELIVERY_ENABLED` (default false)
- `MGA_EXPORT_RETRY_ENABLED` (default false)

#### Permissions Likely Needed

- `reports.email_delivery` — send reports via email (mga_admin, mga_manager)
- `reports.webhook_delivery` — configure webhook targets (mga_admin only)
- `reports.manage_delivery` — view/retry delivery (mga_admin, mga_manager)
- `reports.manage_recipients` — edit allowlist (mga_admin)

#### Estimated Complexity

**VERY HIGH.** Requires email integration, webhook retry logic, recipient validation policy, async delivery infrastructure, and careful failure handling.

#### Recommended Priority

**PRIORITY 4.** High value; very high complexity. Recommend after core scheduling (Gate 6I) is proven stable. Break into sub-gates if needed (email first, webhook later).

#### Recommended Next Action

1. Discovery/preflight — determine email provider, recipient validation rules, webhook schema
2. Design specification — delivery entity extensions, retry policy, failure handling
3. Implementation work order — split into email delivery sub-gate and webhook sub-gate
4. Validation — test email formatting, webhook retry, scope enforcement in async context
5. Closeout — sub-gate closeouts + consolidated closeout

---

### GATE 6K — MGA Analytics Dashboard Expansion

**Priority Rank:** 🟠 **PRIORITY 5** (After Core Features Stable)

#### Capability

Expand MGA analytics dashboard to include:
- Export activity metrics (exports per day/week, most-exported entities, export trends)
- Transmit activity metrics (quotes transmitted, success rate, average time-to-transmit)
- User activity heatmap (login trends, peak usage times, user engagement)
- Enrollment conversion funnel (opened → invited → enrolled → completed)
- Renewal pipeline forecast (renewals due, conversion projected, rate impact)
- Cost modeling impact (scenarios run, most-selected plans, cost trends)

#### Business Value

**MEDIUM.** Provides operational visibility into MGA health, usage patterns, and performance. Useful for executive reporting and capacity planning.

#### User Impact

**POSITIVE.** Dashboard becomes more actionable. Operators can identify bottlenecks and optimize workflows.

#### Security/Scope Risk

**LOW.** Metrics are aggregated; no sensitive record-level data exposed. Scope filtering applied at query time (MGA-scoped metrics only).

#### Data/Schema Impact

**MINIMAL.** Analytics are derived from existing ActivityLog and entity tables. No new entities required.

**Optional:** Create read-only `MGA_Analytics_Cache` table for pre-computed metrics (performance optimization).

#### Dependencies

- All previous gates (data already exists; metrics derived from existing logs)
- Business intelligence / analytics library (existing: Recharts, etc.)

#### Files Likely Involved

- `components/mga/MGAAnalyticsPanel.jsx` — new analytics components
- `lib/mga/services/analyticsService.js` — new analytics queries
- `functions/generateAnalyticsReport.js` — backend analytics aggregation
- `pages/MasterGeneralAgentCommand.jsx` — update dashboard to include analytics tab

#### Feature Flags Likely Needed

- `MGA_ANALYTICS_DASHBOARD_ENABLED` (optional; default true)
- `MGA_ADVANCED_ANALYTICS_ENABLED` (optional; advanced features)

#### Permissions Likely Needed

- `analytics.view` — view analytics (mga_admin, mga_manager)
- `analytics.export_report` — export analytics as PDF/CSV (mga_admin)

#### Estimated Complexity

**MEDIUM.** Queries are straightforward aggregations; visualization is standard charting. No complex state management or real-time updates required.

#### Recommended Priority

**PRIORITY 5.** Lower urgency than core Broker/Agency and export features. Nice-to-have after operational features are mature.

#### Recommended Next Action

1. Discovery/preflight — define dashboard KPIs and visualization requirements
2. Design specification — analytics queries, cache strategy, refresh frequency
3. Implementation work order — analytics service, dashboard components, backend aggregation
4. Validation — test query performance, scope filtering, metric accuracy
5. Closeout — standard gate closeout

---

### GATE 6L — Broker / Agency Contact, Document, and Settings Management

**Priority Rank:** 🔴 **PRIORITY 2** (Recommended Second)

#### Capability

Enable MGA admins to manage Broker/Agency operational details:
- **Contacts:** Primary contact, alternate contact, support contact (name, email, phone, role)
- **Documents:** Upload/attach Broker/Agency agreements, certifications, licenses, policies
- **Settings:** Commission structure, banking info (ACH account), API keys, integrations, notification preferences

#### Business Value

**HIGH.** Operationally critical. Without contact management, no way to reach brokers for escalations or updates. Without document storage, compliance/audit trail is incomplete. Settings enable broker-specific configurations.

#### User Impact

**POSITIVE.** Operators gain centralized broker operational hub. Brokers (via self-service portal in future gate) can update their own contact info and settings.

#### Security/Scope Risk

**MEDIUM.** Must ensure:
- Contacts scoped to MGA (cross-MGA contact view denied)
- Documents stored securely (no public access; signed URLs for authorized users only)
- Banking/sensitive settings access limited to mga_admin + financial_audit role
- API keys generated/rotated securely (encryption at rest)

#### Data/Schema Impact

**MODERATE.** Extend MasterGroup entity and create new entity:
- `MasterGroupContact` — new entity for contacts (allow multiple per org)
- `MasterGroupDocument` — new entity for attached documents
- `MasterGroupSetting` — new entity for org-specific config

**Migration:** None; additive tables.

#### Dependencies

- Gate 6E (Broker/Agency creation) — ✅ LIVE
- Gate 6H (Edit/Deactivation) — ⏳ RECOMMENDED PREREQUISITE (coordinate during discovery)
- File upload/storage infrastructure — ✅ BASE44_STANDARD (UploadFile integration)

#### Files Likely Involved

- `entities/MasterGroupContact.json` — new entity
- `entities/MasterGroupDocument.json` — new entity
- `entities/MasterGroupSetting.json` — new entity
- `components/mga/MGABrokerContactPanel.jsx` — new UI
- `components/mga/MGABrokerDocumentPanel.jsx` — new UI
- `components/mga/MGABrokerSettingsPanel.jsx` — new UI
- `lib/mga/services/brokerAdminService.js` — new service layer
- `lib/mga/brokerSecretManagement.js` — API key encryption/rotation

#### Feature Flags Likely Needed

- `MGA_BROKER_CONTACT_MANAGEMENT_ENABLED` (default false)
- `MGA_BROKER_DOCUMENT_MANAGEMENT_ENABLED` (default false)
- `MGA_BROKER_SETTINGS_MANAGEMENT_ENABLED` (default false)

#### Permissions Likely Needed

- `mastergroup.manage_contacts` — create/edit contacts (mga_admin, mga_manager)
- `mastergroup.manage_documents` — upload/delete documents (mga_admin, mga_manager)
- `mastergroup.view_documents` — access documents (mga_admin, mga_manager, support_read_only)
- `mastergroup.manage_settings` — edit org settings (mga_admin only)
- `mastergroup.manage_banking` — edit banking info (mga_admin + financial_role)
- `mastergroup.manage_api_keys` — generate/rotate keys (mga_admin only)

#### Estimated Complexity

**MEDIUM-HIGH.** Three sub-features (contacts, documents, settings); each has different complexity. Documents require file handling + signed URLs. Banking requires PCI/sensitive data handling.

#### Recommended Priority

**PRIORITY 2.** Recommended immediately after Gate 6H. Together, Gates 6H + 6L complete the Broker/Agency admin suite. Can be implemented in parallel with 6H or sequentially.

#### Recommended Next Action

1. Discovery/preflight — define contact/document/setting requirements; identify financial compliance needs
2. Design specification — entity schemas, security model for banking info, document retention policy
3. Implementation work order — may split into sub-gates (contacts first, documents + settings later)
4. Validation — test scope enforcement, document access control, API key security, cross-gate regression
5. Closeout — standard gate closeout (or sub-gate closeouts if split)

---

### GATE 6M — BrokerAgency Backend Rename Feasibility Study (STUDY_ONLY)

**Priority Rank:** 🟣 **STUDY_ONLY** (Not Recommended for Implementation Yet)

#### Capability

**STUDY ONLY — NO IMPLEMENTATION.** Evaluate whether renaming `MasterGroup` entity and `master_group_id` field to `BrokerAgency` and `broker_agency_id` is feasible.

**NOTE:** Terminological rename only. User-facing label is already "Broker / Agency" (Gates 6E–6F). This gate would rename the **internal** entity and field names to match the user-facing terminology.

#### Business Value

**LOW (LONG-TERM).** Internal consistency (code maintainability) is nice-to-have, but current mapping works. Rename risk > benefit at this stage.

#### User Impact

**ZERO.** User-facing labels already say "Broker / Agency." No user-visible change.

#### Security/Scope Risk

**VERY HIGH.** Massive schema migration:
- Rename entity: `MasterGroup` → `BrokerAgency`
- Rename field: `master_group_id` → `broker_agency_id` (in 15+ entities)
- Update all foreign key constraints
- Update all service layer queries
- Update all permission resolver domain names
- Update all scope validation logic
- Potential data loss if migration errors occur

**This is a production emergency waiting to happen.**

#### Data/Schema Impact

**SEVERE BREAKING CHANGE.** Complete database schema rewrite. All existing queries, relationships, and integrations would need rewriting.

#### Dependencies

- Requires database migration framework capable of renaming 15+ tables + constraints
- Requires coordinator with all dependent services (requires full platform freeze)
- Risk: Any missed foreign key reference breaks the app

#### Files Likely Involved

- 50+ files across entities, services, permissions, scope logic
- Database migration scripts (complex, error-prone)
- All existing deployments would need revert capability

#### Feature Flags Likely Needed

**N/A** — schema migrations can't be feature-flagged; they're all-or-nothing.

#### Permissions Likely Needed

**N/A** — permissions framework would need rewrite anyway.

#### Estimated Complexity

**VERY VERY HIGH.** This is a **Phase 7–8 enterprise refactoring**, not a quick gate. Estimated 3–4 weeks design, 2–3 weeks implementation, 2 weeks testing, 1 week rollback preparation. **DO NOT ATTEMPT until platform is stable for 6+ months and business case is iron-clad.**

#### Recommended Priority

**STUDY_ONLY, LOW PRIORITY.** 

**Recommendation:** Do NOT implement now. Current terminology mapping (internal `MasterGroup`, user-facing "Broker / Agency") works fine. 

**If studying becomes necessary:**
- Plan for 6-month delay after Gates 6H–6L are stable
- Conduct full impact analysis (all 50+ files, all dependent systems)
- Build comprehensive rollback plan
- Require full platform freeze window (4–8 hours downtime)
- Only proceed if business case is compelling (e.g., regulatory requirement, massive code clarity gain)

#### Recommended Next Action

**DEFER.** Do not open this gate now. Revisit in 6 months if internal consistency becomes a pain point. Current terminology mapping is acceptable.

---

## Section 2 — Consolidated Priority Recommendation

### Recommended Sequence

| Priority | Gate | Name | Complexity | Business Value | Risk Level | Target Timeline |
|----------|------|------|-----------|-----------------|-----------|-----------------|
| **1** | **6H** | Broker/Agency Profile & Lifecycle | MEDIUM | HIGH | LOW | 2 weeks design + 2 weeks impl + 1 week validation |
| **2** | **6L** | Broker/Agency Contact/Document/Settings | MEDIUM-HIGH | HIGH | MEDIUM | 2 weeks design + 3 weeks impl + 1 week validation (or parallel with 6H) |
| **3** | **6I** | Report Scheduling & Templates | HIGH | MEDIUM-HIGH | MEDIUM | 2 weeks design + 3 weeks impl + 2 weeks validation |
| **4** | **6J** | Export Delivery Enhancements | VERY HIGH | MEDIUM | MEDIUM-HIGH | 2 weeks design + 4 weeks impl (split into email + webhook sub-gates) + 2 weeks validation |
| **5** | **6K** | MGA Analytics Dashboard | MEDIUM | MEDIUM | LOW | 1 week design + 1.5 weeks impl + 1 week validation |
| **DEFER** | **6M** | Backend Rename Study | N/A | LOW | VERY HIGH | Revisit in 6+ months |

### Rationale

1. **Gates 6H + 6L (Broker/Agency Admin)** come first because:
   - Gates 6E–6F (creation + invite sub-scope) are now live
   - Closing the "full lifecycle" gap unblocks broker operational workflows
   - Can be implemented in parallel or sequentially
   - Low-to-medium complexity; high operational value
   - Dependencies already satisfied

2. **Gate 6I (Report Scheduling)** comes third because:
   - Builds on stable Gate 6C (report exports)
   - Enables recurring automation; high stakeholder value
   - Medium complexity; moderate risk
   - Should wait for 6H + 6L stability to avoid overloading

3. **Gate 6J (Export Delivery)** comes fourth because:
   - Very high complexity; worth doing after 6I proves reliable
   - Email delivery has lower risk; webhook can be sub-gate 2
   - Expand incrementally to avoid scope creep

4. **Gate 6K (Analytics)** comes fifth because:
   - Nice-to-have; lower business urgency
   - No new entities required; metrics derived from existing data
   - Can implement whenever capacity permits

5. **Gate 6M (Backend Rename)** — DEFER
   - High risk + low immediate business value
   - Revisit only if regulatory/compliance requirement emerges
   - Not suitable for near-term implementation

---

## Section 3 — Risk Assessment

### Per-Gate Risk Scorecard

| Gate | Security Risk | Scope Risk | Data Risk | Complexity Risk | Overall |
|------|---------------|-----------|----------|-----------------|---------|
| 6H | 🟢 LOW | 🟢 LOW | 🟢 LOW | 🟡 MEDIUM | 🟢 **LOW-MEDIUM** |
| 6L | 🟡 MEDIUM | 🟡 MEDIUM | 🟡 MEDIUM | 🟡 MEDIUM | 🟡 **MEDIUM** |
| 6I | 🟡 MEDIUM | 🟡 MEDIUM | 🟢 LOW | 🟠 HIGH | 🟠 **MEDIUM-HIGH** |
| 6J | 🟠 MEDIUM-HIGH | 🟡 MEDIUM | 🟡 MEDIUM | 🔴 VERY HIGH | 🔴 **HIGH** |
| 6K | 🟢 LOW | 🟢 LOW | 🟢 LOW | 🟡 MEDIUM | 🟢 **LOW** |
| 6M | 🔴 VERY HIGH | 🔴 VERY HIGH | 🔴 SEVERE | 🔴 VERY HIGH | 🔴 **EXTREME** |

**Mitigation Strategies:**

- **6H, 6K:** Low risk; proceed with standard process
- **6L:** Medium risk; require detailed security review of document storage + banking data handling
- **6I:** Medium-high risk; require load testing on scheduled job infrastructure
- **6J:** High risk; split into email (lower) + webhook (higher) sub-gates; email first
- **6M:** EXTREME risk; DEFER; study only if absolutely necessary (6+ months out)

---

## Section 4 — Implementation Sequencing Options

### Option A: Sequential (Recommended for Stability)

```
Month 1:  Gate 6H (Broker/Agency Admin — Edit/Deactivation)
Month 2:  Gate 6L (Broker/Agency Contact/Document/Settings)
Month 3:  Gate 6I (Report Scheduling & Templates)
Month 4:  Gate 6J-Email (Email Delivery Sub-Gate)
Month 5:  Gate 6J-Webhook (Webhook Delivery Sub-Gate)
Month 6:  Gate 6K (MGA Analytics Dashboard)
Month 7+: Defer 6M until business case emerges
```

**Pros:** Low risk; each gate fully validated before next starts; stakeholders see incremental value  
**Cons:** Takes 6 months; slower time-to-market

### Option B: Parallel (Recommended if Capacity Allows)

```
Start Month 1:
  - Gate 6H team (2 engineers) — Broker/Agency Admin
  - Gate 6L team (2 engineers) — Broker/Agency Contact/Document/Settings
  - Gate 6I team (1 engineer, lower priority) — Report Scheduling (starts after 6H milestone)

Month 2–3:
  - 6H + 6L closeout
  - 6J-Email design starts (medium team)

Month 3–4:
  - 6I implementation
  - 6J-Email implementation

Month 4–5:
  - 6I + 6J-Email closeout
  - 6J-Webhook design starts

Month 5:
  - 6J-Webhook implementation

Month 6:
  - 6K analytics starts (1 engineer; low priority)

Month 6+:
  - Defer 6M
```

**Pros:** Faster overall time-to-market; multiple teams working in parallel  
**Cons:** Higher coordination overhead; more risk if a gate fails (blocking downstream)

---

## Section 5 — Guardrails for Next Gates

The following guardrails remain in force for all future gates:

✅ **Do not reopen Gates 6A–6G** without explicit operator directive  
✅ **Do not modify production-ready gate behavior** without approved change request  
✅ **Do not rename MasterGroup** (internal entity) or `master_group_id` (field) unless major refactoring phase is approved  
✅ **Do not create database migrations** without full impact analysis and rollback plan  
✅ **Do not broaden permissions** beyond RBAC matrix without security review  
✅ **Do not weaken scopeGate, scopeResolver, or permissionResolver** without documented business case  
✅ **Do not expose signed URLs, private file URIs, exported content, or restricted payloads** in any new gate  
✅ **Do not create runtime behavior** outside the controlled gate framework  

---

## Section 6 — Next Steps

### If Operator Selects Gate 6H First:

1. **Discovery/Preflight:** Document cascade rules (deactivate broker → deny access to assigned users)
2. **Design Specification:** Status state machine, permission model, audit logging
3. **Implementation Work Order:** Code Gate 6H features
4. **Controlled Activation:** Follow full gate process (18-step checklist, regression testing, etc.)
5. **Closeout:** Standard gate closeout packet

### If Operator Selects Different Priority Order:

Follow the same discovery → design → implementation → activation → closeout sequence, with candidate gates reordered per operator direction.

### If Operator Defers All Next Gates:

Maintain current production-ready state (Gates 6A–6G active) and hold for future operator directive.

---

## Document Control

| Field | Value |
|-------|-------|
| Document ID | MGA_NEXT_PHASE_OPTIONS_AND_RECOMMENDATION |
| Version | 1.0 |
| Created | 2026-05-12 |
| Status | PLANNING — AWAITING_OPERATOR_SELECTION |
| Author | Base44 AI — Platform Engineering |
| Distribution | Operator review; strategic planning archive |
| Next Action | Operator selects next gate(s); discovery/preflight begins |

---

## Appendix — Quick Reference

**Recommended Next Gate:** Gate 6H (Broker/Agency Profile, Edit, Deactivation)  
**Recommended Second Gate:** Gate 6L (Broker/Agency Contact, Document, Settings)  
**Recommended Timeline:** 6H in Month 1, 6L in Month 2 (parallel or sequential)  
**Deferred:** Gate 6M (Backend Rename) — STUDY_ONLY, revisit in 6+ months  

**Questions for Operator:**

1. Which gate should be opened first? (Recommendation: 6H)
2. Should subsequent gates proceed sequentially or in parallel?
3. Are there other candidate gates not listed that should be evaluated?
4. Any external factors (compliance, customer demand, technical debt) driving priority?

**Ready for operator selection.**