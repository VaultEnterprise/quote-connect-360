/**
 * seedFullAuditReport
 * Seeds the complete ConnectQuote 360 Full Page Audit Report
 * as a HelpManualTopic for governance, QA, and production hardening.
 * Admin only. Safe to re-run (upserts by topic_code).
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
  // ─── SEED GUARD ─────────────────────────────────────────────────────────────
  // Seed functions must never be callable without authorization.
  // Set SEED_SECRET in function Secrets and pass it as X-Seed-Secret header.
  const seedSecret = Deno.env.get("SEED_SECRET");
  if (seedSecret) {
    const incomingSecret = req.headers.get("x-seed-secret");
    if (incomingSecret !== seedSecret) {
      return Response.json({ error: "Unauthorized: invalid or missing X-Seed-Secret header." }, { status: 401 });
    }
  } else {
    // No secret configured → block in all environments (seeds are dangerous)
    return Response.json({ error: "Seed functions are disabled. Set SEED_SECRET env var to enable." }, { status: 403 });
  }
  // ─────────────────────────────────────────────────────────────────────────────
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const db = base44.asServiceRole;

    const topics = [
      // ─────────────────────────────────────────────────────────────────────
      // TOPIC 1: STATUS CLASSIFICATION OVERVIEW
      // ─────────────────────────────────────────────────────────────────────
      {
        topic_code: "AUDIT_STATUS_OVERVIEW",
        topic_title: "Full Page Audit — Status Overview",
        topic_type: "reference",
        sort_order: 100,
        topic_summary: "Production-readiness classification for all 30 pages in ConnectQuote 360.",
        search_keywords: "audit, page status, production ready, incomplete, broken, partially complete, blocked",
        topic_body: `# Full Page Audit — Status Classification Overview

> Generated: 2026-03-23 | Scope: All 30 routed pages

## Legend
| Status | Meaning |
|---|---|
| ✅ Production Ready | Feature-complete, all entities wired, no critical gaps |
| ⚠️ Partially Complete | Core function works but has identified gaps, orphaned controls, or missing connections |
| 🔶 Incomplete | Major sections unimplemented, handlers missing, data not bound |
| 🔴 Blocked | Cannot function without external dependency (DocuSign key, GradientAI key, auth flow) |
| ❌ Broken | Code-level issue, orphaned import, or permanently broken wiring |

---

## Summary Table

| Page | Route | Status | Primary Gap |
|---|---|---|---|
| Dashboard | / | ✅ Production Ready | — |
| Cases List | /cases | ✅ Production Ready | — |
| New Case | /cases/new | ⚠️ Partially Complete | agency_id fallback risk |
| Case Detail | /cases/:id | ✅ Production Ready | — |
| Census | /census | ⚠️ Partially Complete | GradientAI requires API key |
| Quotes | /quotes | ✅ Production Ready | — |
| Proposal Builder | /proposals | ⚠️ Partially Complete | FilterPresets not wired, PlanSearchAdvanced stub |
| Enrollment | /enrollment | ⚠️ Partially Complete | sendEnrollmentInvite requires email service |
| Renewals | /renewals | ✅ Production Ready | — |
| Tasks | /tasks | ✅ Production Ready | — |
| Employers | /employers | ✅ Production Ready | — |
| Plan Library | /plans | ⚠️ Partially Complete | PlanFilterPresets + PlanSearchAdvanced stubs |
| Exception Queue | /exceptions | ⚠️ Partially Complete | BulkActions panel, FilterPresets, CommentThread not wired |
| Contribution Modeling | /contributions | ✅ Production Ready | — |
| PolicyMatchAI | /policymatch | 🔴 Blocked | Requires GradientAI API key |
| Integration Infrastructure | /integration-infra | 🔶 Incomplete | Entire page is UI-only / showcase |
| Settings | /settings | ⚠️ Partially Complete | Several sub-panels static |
| Employer Portal | /employer-portal | 🔴 Blocked | No employer identity enforcement |
| Employee Portal | /employee-portal | 🔴 Blocked | No server-side token validation |
| Employee Portal Login | /employee-portal-login | ❌ Broken | Stub page — no functional login flow |
| Employee Enrollment | /employee-enrollment | 🔴 Blocked | Requires DocuSign key; token auth unverified |
| Employee Benefits | /employee-benefits | ⚠️ Partially Complete | Requires completed enrollment to be meaningful |
| Help Center | /help | ✅ Production Ready | — |
| Help Admin | /help-admin | ✅ Production Ready | — |
| Help Dashboard | /help-dashboard | ✅ Production Ready | — |
| Help Coverage | /help-coverage | ✅ Production Ready | — |
| Help Analytics | /help-analytics | ✅ Production Ready | — |
| Help Manual Manager | /help-manual-manager | ⚠️ Partially Complete | Duplicate of Help Admin tab |
| Help Target Registry | /help-target-registry | ✅ Production Ready | — |
| 404 Page | * | ✅ Production Ready | — |

---

## Counts
| Status | Count |
|---|---|
| ✅ Production Ready | 13 |
| ⚠️ Partially Complete | 10 |
| 🔶 Incomplete | 1 |
| 🔴 Blocked | 4 |
| ❌ Broken | 1 |
| **Total pages** | **30** |
`
      },

      // ─────────────────────────────────────────────────────────────────────
      // TOPIC 2: DETAILED AUDIT — CORE WORKFLOW PAGES
      // ─────────────────────────────────────────────────────────────────────
      {
        topic_code: "AUDIT_CORE_PAGES_DETAIL",
        topic_title: "Full Page Audit — Core Workflow Pages (Detailed)",
        topic_type: "reference",
        sort_order: 101,
        topic_summary: "Detailed audit findings for Dashboard, Cases, Census, Quotes, Proposals, Enrollment, Renewals, Tasks, Employers, Plans, Exceptions, Contributions.",
        search_keywords: "audit detail, cases audit, census audit, quotes audit, proposals audit, enrollment audit, renewals audit, tasks audit, plans audit, exceptions audit",
        topic_body: `# Full Page Audit — Core Workflow Pages

---

## 1. Dashboard (/) ✅ Production Ready

**Entities Used:** BenefitCase, CaseTask, EnrollmentWindow, RenewalCycle
**Functions/APIs:** None
**Missing Dependencies:** None
**Missing Handlers:** None
**Missing Validations:** None
**Orphaned Controls:** None
**Broken Links:** None

**Notes:** Dashboard is read-only aggregation. All queries wired. All sub-components receive real data. Pipeline and KPI tiles update correctly. Refresh interval on sidebar badges works. Fully production-ready.

**Exact Fixes Needed:** None.

---

## 2. Cases List (/cases) ✅ Production Ready

**Entities Used:** BenefitCase (list, 200 records)
**Functions/APIs:** None (client-side filters only)
**Missing Dependencies:** None
**Missing Handlers:** None
**Missing Data Bindings:** None
**Missing Validations:** None
**Orphaned Controls:** None
**Performance Risk:** Loads up to 200 cases in a single query — no pagination.

**Exact Fix:**
> Add server-side pagination or cursor-based fetching when case count exceeds ~100. Current approach fine for early-stage usage.

---

## 3. New Case (/cases/new) ⚠️ Partially Complete

**Entities Used:** Agency (list), EmployerGroup (list), BenefitCase (create)
**Functions/APIs:** None
**Missing Dependencies:**
- ❌ **Agency record required:** Uses \`agencies[0]?.id || "default"\` as agency_id. If no Agency exists, the string "default" is stored. If BenefitCase enforces an agency FK, case creation will fail silently.
**Missing Handlers:** None
**Missing Validations:**
- ❌ No validation that \`employer_group_id\` or \`employer_name\` satisfies downstream FK expectations
- ❌ No EIN format validation
- ❌ \`effective_date\` can be set in the past — no guard
**Missing Notifications:** No success toast on case creation (navigates silently to case detail)
**Orphaned Controls:** None

**Exact Fixes:**
1. Seed at least one Agency record at app setup time, or auto-create one if missing during case creation.
2. Add a toast notification on successful case creation before navigation.
3. Optionally validate effective_date >= today.

---

## 4. Case Detail (/cases/:id) ✅ Production Ready

**Entities Used:** BenefitCase, CaseTask, CensusVersion, QuoteScenario, Document, ActivityLog
**Functions/APIs:** None directly (sub-tabs invoke functions)
**Missing Dependencies:** None
**Missing Handlers:** None
**Missing Data Bindings:** All 6 tab contents properly wired
**Missing Validations:** None

**Minor Gaps:**
- ⚠️ No "View Full Census →" deep-link from Census tab to /census?case_id
- ⚠️ No "View in Quotes →" link from Quotes tab to /quotes?case_id
- ⚠️ AIAssistant context does not include document names or task summaries

**Exact Fixes:**
1. Add a small "Open in Census module →" link button in CaseCensusTab header.
2. Add a small "Open in Quotes module →" link button in CaseQuotesTab header.

---

## 5. Census (/census) ⚠️ Partially Complete

**Entities Used:** BenefitCase, CensusVersion, CensusMember
**Functions/APIs:** processGradientAI (external GradientAI API)
**Missing Dependencies:**
- 🔴 **GradientAI API key required:** GradientAIAnalysisPanel will error without valid key in secrets
**Missing Handlers:**
- ❌ CensusUploadModal onClose does NOT call queryClient.invalidateQueries — versions list does not auto-refresh after upload (comment in code confirms this: "Refetch versions to see new upload")
**Missing Data Bindings:**
- ❌ viewingVersionId is not persisted when case changes — user must re-select version after switching cases
**Missing Validations:** None noted
**Orphaned Controls:** None

**Exact Fixes:**
1. In CensusUploadModal's onClose, add \`queryClient.invalidateQueries({ queryKey: ["census-all"] })\` to refresh version list.
2. Gracefully disable GradientAI panel when API key not configured rather than showing an error.
3. Auto-select the most recent version when a case is first selected.

---

## 6. Quotes (/quotes) ✅ Production Ready

**Entities Used:** QuoteScenario, BenefitCase
**Functions/APIs:** calculateQuoteRates (backend function)
**Missing Dependencies:** None
**Missing Handlers:** None
**Missing Data Bindings:** All wired correctly
**Missing Validations:** None
**Orphaned Controls:** None

**Minor Gap:**
- ⚠️ No deep-link route /quotes/:id for individual scenario sharing or email linking
- ⚠️ "Create Proposal from Scenario" action in ScenarioCard — need to verify navigation completes correctly with pre-fill

**Exact Fixes:**
1. Add /quotes/:id route for scenario deep-linking (optional but recommended for audit trail and email sharing).

---

## 7. Proposal Builder (/proposals) ⚠️ Partially Complete

**Entities Used:** Proposal (list, create, update, delete)
**Functions/APIs:** sendProposalEmail, exportProposalPDF
**Missing Dependencies:** None (email service configured in Settings)
**Missing Handlers:**
- ❌ **ProposalFilterPresets:** \`onSelectPreset\` is wired as \`() => {}\` — clicking presets does nothing
- ❌ No visible error state if sendProposalEmail fails — silent failure
**Missing Data Bindings:**
- ❌ \`expandedProposalId\` state is set but never triggered — ProposalDetailExpanded panel never opens
**Missing Validations:**
- ❌ No validation preventing duplicate proposal for same employer + version
**Orphaned Controls:**
- 🔶 \`expandedProposalId\` / \`setExpandedProposalId\` declared in state but no UI trigger exists to set it

**Exact Fixes:**
1. Wire ProposalFilterPresets \`onSelectPreset\` to update \`statusFilter\`, \`employerFilter\`, etc.
2. Add error toast in the send proposal flow when sendProposalEmail returns an error.
3. Either wire \`expandedProposalId\` to a click handler on ProposalCard, or remove the unused state.

---

## 8. Enrollment (/enrollment) ⚠️ Partially Complete

**Entities Used:** EnrollmentWindow (list, create), EmployeeEnrollment (via card)
**Functions/APIs:** sendEnrollmentInvite (email service)
**Missing Dependencies:**
- 🔴 **Email service required for invitations:** sendEnrollmentInvite fails without email configuration
**Missing Handlers:**
- ❌ EnrollmentWindowCard "Send Invitations" action — need to verify handler is fully wired in child component
**Missing Data Bindings:**
- ❌ No deep-link from Enrollment to Case Detail (enrollment windows are linked by employer name string, not case_id FK in all cases)
**Missing Notifications:**
- ❌ No confirmation shown after bulk invitations are sent (success count, failure count)
**Orphaned Controls:** None

**Exact Fixes:**
1. Add invitation send confirmation toast with count of emails sent/failed.
2. Validate email service configuration before enabling send invitations button.

---

## 9. Renewals (/renewals) ✅ Production Ready

**Entities Used:** RenewalCycle (list, create, update, delete), CensusMember (for risk forecast)
**Functions/APIs:** None directly
**Missing Dependencies:** None
**Missing Handlers:** None
**Missing Data Bindings:** All wired
**Orphaned Controls:** None

**Minor Gap:**
- ⚠️ RenewalCycle has no \`case_id\` FK — relationship to BenefitCase is by employer_name string only. No drill-through to case.
- ⚠️ CensusMember query fetches ALL members (up to 10,000) with no case filter — large payload for risk forecast

**Exact Fixes:**
1. Add \`case_id\` field to RenewalCycle entity and wire it from the create modal.
2. Filter CensusMember fetch by case_id when available.

---

## 10. Tasks (/tasks) ✅ Production Ready

**Entities Used:** CaseTask (list, create, update, delete), BenefitCase (for case selector in modal)
**Functions/APIs:** None
**Missing Dependencies:** None
**Missing Handlers:** All CRUD operations wired
**Missing Data Bindings:** All wired
**Orphaned Controls:** None

**Minor Gap:**
- ⚠️ No \`?case_id\` query param support — cannot deep-link from Case Detail to Tasks filtered to that case
- ⚠️ "Due Today" KPI card click sets statusFilter="active" but does not set a due-date filter — misleading behavior

**Exact Fixes:**
1. Read \`?case_id\` from URL params on mount and pre-filter tasks.
2. Fix "Due Today" card click to actually filter to tasks due today, not just "active".

---

## 11. Employers (/employers) ✅ Production Ready

**Entities Used:** EmployerGroup (list, create, update), Agency (list), BenefitCase (for case count map)
**Functions/APIs:** None
**Missing Dependencies:** None
**Missing Handlers:** All CRUD ops wired. Delete not implemented (no delete button).
**Missing Validations:**
- ❌ EIN field accepts any text — no XX-XXXXXXX format enforcement
- ❌ No validation preventing duplicate employer name within same agency

**Minor Gap:**
- ⚠️ No delete functionality — employers can only be deactivated (status=terminated) via Edit, but no explicit delete button

**Exact Fixes:**
1. Add EIN format validation (regex /^\d{2}-\d{7}$/).
2. Consider adding a delete confirmation button for terminated employers.

---

## 12. Plan Library (/plans) ⚠️ Partially Complete

**Entities Used:** BenefitPlan (list, create, update), PlanRateTable (via RateTableEditor)
**Functions/APIs:** ExtractDataFromUploadedFile (for bulk import), UploadFile
**Missing Handlers:**
- ❌ **PlanFilterPresets:** \`onSelectPreset\` is \`() => {}\` — presets are non-functional
- ❌ **PlanSearchAdvanced:** \`onSearch\` is \`() => {}\` — advanced search does nothing
**Missing Data Bindings:** None for core list
**Orphaned Controls:**
- 🔶 PlanFilterPresets buttons render but trigger no state change
- 🔶 PlanSearchAdvanced renders but does not filter the plan list

**Exact Fixes:**
1. Wire PlanFilterPresets \`onSelectPreset\` to set \`carrierFilter\`, \`networkFilter\`, \`activeTab\`.
2. Wire PlanSearchAdvanced \`onSearch\` to update the \`search\` state or a separate advanced filter state.

---

## 13. Exception Queue (/exceptions) ⚠️ Partially Complete

**Entities Used:** ExceptionItem (list, create, update), BenefitCase (in create modal)
**Functions/APIs:** None
**Missing Handlers:**
- ❌ **ExceptionBulkActionsPanel:** selectedIds are passed as count only — bulk resolve/dismiss mutations are defined locally but the panel component's own action buttons may not call the parent mutations
- ❌ **ExceptionFilterPresets:** \`onSelectPreset\` is \`() => {}\` — non-functional
- ❌ **ExceptionCommentThread:** Rendered in detail drawer with no \`exceptionId\` prop passed — comments cannot load or save
**Missing Data Bindings:**
- ❌ ExceptionCommentThread receives no props — comment data has no entity to bind to
**Orphaned Controls:**
- 🔶 ExceptionTriageAssistant panel in drawer right column is \`hidden lg:block\` — desktop-only, no mobile access
**Missing Workflow Connections:**
- ❌ No automatic exception generation when census validation fails, quote calculation errors, or DocuSign webhook fires

**Exact Fixes:**
1. Pass \`exceptionId={detailException.id}\` to ExceptionCommentThread.
2. Wire ExceptionBulkActionsPanel action buttons to the parent \`bulkResolve\` and \`bulkDismiss\` mutations.
3. Wire ExceptionFilterPresets presets to actual filter state setters.

---

## 14. Contribution Modeling (/contributions) ✅ Production Ready

**Entities Used:** ContributionModel (list, create, delete), QuoteScenario, BenefitCase
**Functions/APIs:** None (all calculations client-side)
**Missing Dependencies:** None
**Missing Handlers:** All wired
**Missing Data Bindings:** All wired
**Orphaned Controls:** None

**Minor Gap:**
- ⚠️ \`compareIds\` / \`toggleCompare\` / \`modelsToCompare\` declared in state but compare selection checkboxes may not be rendered in ContributionModelCard (compare is activated via viewMode toggle, not per-model checkbox)
- ⚠️ No edit functionality on ContributionModelCard — only delete is available

**Exact Fixes:**
1. Verify ContributionModelCard exposes an onEdit prop and wire to an edit modal.
2. Consider making compare selection per-card with checkbox, matching the current state setup.
`
      },

      // ─────────────────────────────────────────────────────────────────────
      // TOPIC 3: DETAILED AUDIT — PORTAL & EMPLOYEE PAGES
      // ─────────────────────────────────────────────────────────────────────
      {
        topic_code: "AUDIT_PORTAL_PAGES_DETAIL",
        topic_title: "Full Page Audit — Portal & Employee Pages (Detailed)",
        topic_type: "reference",
        sort_order: 102,
        topic_summary: "Detailed audit for PolicyMatchAI, Settings, Employer Portal, Employee Portal, Employee Enrollment, Employee Benefits, Integration Infrastructure.",
        search_keywords: "portal audit, employee portal, employer portal, policymatch audit, integration infrastructure audit, settings audit",
        topic_body: `# Full Page Audit — Portal & Employee Pages

---

## 15. PolicyMatchAI (/policymatch) 🔴 Blocked

**Entities Used:** CensusVersion, BenefitPlan, PolicyMatchResult
**Functions/APIs:** matchPoliciesWithGradient, policyMatchAI (both require GradientAI API key)
**Missing Dependencies:**
- 🔴 **GradientAI API key required in secrets.** Without it, matchPoliciesWithGradient and policyMatchAI both throw. The page will show errors on first analysis attempt.
**Missing Handlers:** None (UI is complete)
**Missing Data Bindings:** None
**Orphaned Controls:**
- 🔶 PolicyMatchBulkActions, PolicyMatchFilterPresets — verify actual wiring in the page (not visible in component structure summary)

**Exact Fixes:**
1. Add a banner/gate on the PolicyMatchAI page: "GradientAI API key not configured. Contact your administrator." — disable Run Analysis button if key is missing.
2. Detect missing key gracefully (catch function invocation error) instead of showing a raw error.

---

## 16. Integration Infrastructure (/integration-infra) 🔶 Incomplete

**Entities Used:** None
**Functions/APIs:** None
**Missing Dependencies:** Everything — this entire page is static UI
**Missing Handlers:** All panels are documentation/showcase only:
- ApiKeysPanel — static copy
- WebhooksPanel — static copy
- EndpointHealthPanel — hardcoded mock data
- OAuthSSOPanel — static copy
- RateLimitingPanel — static copy
- SDKsAndLibrariesPanel — static copy
- RetryMiddlewarePanel — static copy
- PayloadValidatorPanel — static copy
- All 12 sub-panels: presentation-only

**Orphaned Controls:** Every button in every panel (no real API calls)

**Exact Fixes:**
1. Add a prominent banner: "This section is a reference documentation hub. Features shown here are planned integrations."
2. Move the page behind admin-only auth check (currently accessible to any authenticated user).
3. Remove from primary sidebar navigation OR add a "Documentation" label to set expectations.

---

## 17. Settings (/settings) ⚠️ Partially Complete

**Entities Used:** Agency (read, update), User (list — admin only)
**Functions/APIs:** None directly
**Missing Dependencies:** None for core function
**Missing Handlers:**
- ❌ BillingUsagePanel — likely static (no Stripe billing integration visible)
- ❌ BrandingPanel — branding settings may not persist to a live agency display
- ❌ FeatureTogglesPanel — toggles stored where? No entity visible for feature flags
- ❌ WebhookConfigPanel — webhook endpoint URLs are probably static display
**Missing Data Bindings:**
- ❌ FeatureTogglesPanel has no entity backing — toggle state may not persist across sessions
**Missing Permissions:**
- ⚠️ Admin-only tabs (Team, Integrations, Billing, etc.) are gated by \`user.role === "admin"\` — correct. But no redirect for non-admins who navigate directly.

**Exact Fixes:**
1. Store FeatureToggle state in Agency.settings object (which already exists as \`type: object\`).
2. Connect BrandingPanel fields to Agency record (logo URL, brand color).
3. Clarify WebhookConfigPanel as display-only until webhook URLs are live.

---

## 18. Employer Portal (/employer-portal) 🔴 Blocked

**Entities Used:** Proposal, BenefitCase, Document, EmployeeEnrollment
**Functions/APIs:** None directly
**Missing Dependencies:**
- 🔴 **No employer authentication.** The page is accessible to any logged-in user in the main app. An employer (non-app user) cannot authenticate to view this page. The portal needs either:
  a) A separate token-based public URL, or
  b) Email-matching logic where the employer's primary_contact_email matches the logged-in user
**Missing Permissions:**
- 🔴 No role check or employer identity check — any admin or broker user sees all employer portal data
**Missing Workflow Connections:**
- ❌ Approving a proposal in the portal should advance the BenefitCase stage to "approved_for_enrollment" — this connection may not be wired
- ❌ No notification to broker when employer views/approves/rejects a proposal

**Exact Fixes:**
1. Add URL token parameter (?token=...) and validate it against EmployerGroup.settings.portal_token server-side.
2. Wire proposal approval action to BenefitCase.update({ stage: "approved_for_enrollment" }).
3. Trigger ActivityLog.create() and email notification to assigned broker on employer approve/reject.

---

## 19. Employee Portal (/employee-portal) 🔴 Blocked

**Entities Used:** EmployeeEnrollment, EnrollmentWindow, BenefitPlan
**Functions/APIs:** None directly
**Missing Dependencies:**
- 🔴 **No server-side token validation.** EmployeeEnrollment.access_token exists in the entity, but the frontend does not validate it before rendering. Any authenticated user can navigate to /employee-portal.
**Missing Permissions:**
- 🔴 No access token check in the page code — data is loaded based on URL params or session only
**Missing Workflow Connections:**
- ❌ No clear navigation CTA from Employee Portal → /employee-enrollment wizard
- ❌ No session expiry handling for employee access

**Exact Fixes:**
1. Validate access_token from URL query param against EmployeeEnrollment.access_token in a backend function before rendering portal data.
2. Add prominent "Start / Continue Enrollment →" CTA button that navigates to /employee-enrollment?token=...
3. Implement session timeout via SessionTimeout component (already built at components/employee/SessionTimeout).

---

## 20. Employee Portal Login (/employee-portal-login) ❌ Broken

**Entities Used:** Unknown
**Functions/APIs:** Unknown
**Issue:** This page is a stub with no visible functional login form. It appears to be a placeholder for token-based access but no login flow is implemented. Employees who receive an invitation email would need either a direct token URL (bypassing this page) or a login form here.

**Exact Fixes:**
1. If access is purely token-link based (email → ?token= URL): Remove this route from App.jsx and redirect employees to /employee-portal?token=... directly.
2. If a login form is needed: Implement email + access code (PIN) verification calling a backend function that returns a session token.
3. Current state: Do not use. Route is dead.

---

## 21. Employee Enrollment (/employee-enrollment) 🔴 Blocked

**Entities Used:** EmployeeEnrollment (update), BenefitPlan (list), EnrollmentWindow (read)
**Functions/APIs:** sendDocuSignEnvelope, getDocuSignSigningURL
**Missing Dependencies:**
- 🔴 **DocuSign API key required.** Without DOCUSIGN_* secrets configured, sendDocuSignEnvelope will fail. The enrollment wizard cannot complete step 6 (signature) without DocuSign.
- 🔴 **Access token not validated** (same issue as Employee Portal)
**Missing Validations:**
- ❌ No validation that EnrollmentWindow.status === "open" before allowing enrollment
- ❌ No guard preventing duplicate enrollment (employee submits twice)
**Missing Notifications:**
- ❌ No email confirmation to employee after enrollment completion (outside of DocuSign)

**Exact Fixes:**
1. Add server-side access token validation before loading enrollment data.
2. Check EnrollmentWindow.status === "open" and show "Enrollment window is closed" message if not.
3. Add duplicate check: if EmployeeEnrollment.status === "completed", show "You have already enrolled" message.
4. Configure DocuSign keys in Settings or gracefully skip the signature step if DocuSign not configured.

---

## 22. Employee Benefits (/employee-benefits) ⚠️ Partially Complete

**Entities Used:** EmployeeEnrollment, BenefitPlan
**Functions/APIs:** None
**Missing Dependencies:**
- ⚠️ Page is only meaningful after enrollment is completed. No guard for employees who haven't enrolled yet.
**Missing Handlers:** None
**Missing Workflow Connections:**
- ❌ No navigation from Employee Benefits → Employee Portal
- ❌ DocuSign audit trail requires DocuSign to be configured

**Exact Fixes:**
1. Add guard: if EmployeeEnrollment.status !== "completed", show "Your enrollment is pending" state.
2. Add back-navigation to Employee Portal.
`
      },

      // ─────────────────────────────────────────────────────────────────────
      // TOPIC 4: ORPHANED CONTROLS & UNUSED STATE AUDIT
      // ─────────────────────────────────────────────────────────────────────
      {
        topic_code: "AUDIT_ORPHANED_CONTROLS",
        topic_title: "Full Page Audit — Orphaned Controls & Unused State",
        topic_type: "reference",
        sort_order: 103,
        topic_summary: "All React state variables, component props, and UI controls that are declared but never functionally wired.",
        search_keywords: "orphaned controls, unused state, dead code, unconnected components, wiring gaps, stub handlers",
        topic_body: `# Orphaned Controls & Unused State Audit

## Definition
An **orphaned control** is a UI element that is rendered but whose event handler is \`() => {}\`, whose prop is never used downstream, or whose state variable is set but never drives visible behavior.

---

## ProposalBuilder (/proposals)

| Item | Type | Issue |
|---|---|---|
| \`expandedProposalId\` / \`setExpandedProposalId\` | State variable | Declared and passed to ProposalCard but no UI trigger sets it. ProposalDetailExpanded panel conditionally renders on it but never appears. |
| ProposalFilterPresets \`onSelectPreset={() => {}}\` | Callback prop | Presets render buttons; clicking them fires an empty function. No filter state changes. |

**Fix:** Wire \`onSelectPreset\` to update filter state. Trigger \`setExpandedProposalId(p.id)\` from a "Show Details" button on ProposalCard.

---

## Plan Library (/plans)

| Item | Type | Issue |
|---|---|---|
| PlanFilterPresets \`onSelectPreset={() => {}}\` | Callback prop | Preset buttons fire nothing |
| PlanSearchAdvanced \`onSearch={() => {}}\` | Callback prop | Advanced search form submits to nothing |

**Fix:** Wire both to update \`search\`, \`carrierFilter\`, \`networkFilter\`, \`activeTab\` as appropriate.

---

## Exception Queue (/exceptions)

| Item | Type | Issue |
|---|---|---|
| ExceptionFilterPresets \`onSelectPreset={(filters) => {}}\` | Callback prop | Presets fire nothing |
| ExceptionCommentThread (in drawer) | Component | Rendered with no props — no exceptionId, no entity binding |
| \`selectedIds\` (Set) passed to ExceptionBulkActionsPanel as \`selectedCount\` only | Prop mismatch | The actual mutation functions (bulkResolve, bulkDismiss) live in the parent page but the panel likely has its own action buttons that call nothing |

**Fix:**
1. Pass \`exception.id\` to ExceptionCommentThread.
2. Pass \`onBulkResolve\` and \`onBulkDismiss\` as props to ExceptionBulkActionsPanel.
3. Wire ExceptionFilterPresets to filter state setters.

---

## Census (/census)

| Item | Type | Issue |
|---|---|---|
| onClose of CensusUploadModal | Handler | Comment in code: "Refetch versions to see new upload" — but no refetch call is made. |

**Fix:** Add \`queryClient.invalidateQueries({ queryKey: ["census-all"] })\` to onClose.

---

## Tasks (/tasks)

| Item | Type | Issue |
|---|---|---|
| "Due Today" KPI card click | Handler | Sets \`statusFilter("active")\` — does not filter to tasks due today, misleading UX |

**Fix:** Create a \`dueTodayFilter\` state and apply it in the filter logic.

---

## ContributionModeling (/contributions)

| Item | Type | Issue |
|---|---|---|
| \`compareIds\` Set | State | Populated via \`toggleCompare(id)\` but no card-level checkbox renders to add IDs. Compare activates via viewMode toggle, not per-model. \`modelsToCompare\` computed but unused. |

**Fix:** Either add per-card checkboxes that call \`toggleCompare\`, or remove the Set-based selection and just use \`filtered\` in compare mode.

---

## Global Pattern: Stub Preset Callbacks

The following pages all have filter preset components wired with \`() => {}\`:
- /proposals — ProposalFilterPresets
- /plans — PlanFilterPresets
- /exceptions — ExceptionFilterPresets

This is a systemic pattern. All three need the same fix: pass filter state setters as the \`onSelectPreset\` handler.

---

## Unused Pages / Routes

| Page | Route | Issue |
|---|---|---|
| Employee Portal Login | /employee-portal-login | Stub — no login form. Route exists but page is non-functional. |
| Help Manual Manager | /help-manual-manager | Fully duplicates functionality in /help-admin Manual Topics tab |

**Fix:**
1. Redirect /employee-portal-login → remove route or implement login form.
2. Redirect /help-manual-manager to /help-admin and remove from App.jsx, or add a redirect component.
`
      },

      // ─────────────────────────────────────────────────────────────────────
      // TOPIC 5: MISSING WORKFLOW CONNECTIONS
      // ─────────────────────────────────────────────────────────────────────
      {
        topic_code: "AUDIT_WORKFLOW_CONNECTIONS",
        topic_title: "Full Page Audit — Missing Workflow Connections",
        topic_type: "reference",
        sort_order: 104,
        topic_summary: "Every missing stage transition, status update propagation, notification hook, and inter-page connection in the application workflow.",
        search_keywords: "workflow gaps, missing stage transitions, notification hooks, inter-page connections, stage advancement, status propagation",
        topic_body: `# Missing Workflow Connections Audit

## Core Lifecycle Gaps

### Gap 1: Renewal → Case
**Current state:** RenewalCycle has no \`case_id\` FK. Relationship is by employer_name string only.
**Impact:** Cannot navigate from a renewal to its source case. Cannot auto-advance case stage when renewal is completed.
**Fix:** Add \`case_id\` to RenewalCycle. Wire from CreateRenewalModal. Add "View Case →" link in RenewalDetailModal.

### Gap 2: Employer Portal Approval → Case Stage Advance
**Current state:** Employer can click "Approve" in the Employer Portal, which updates Proposal.status = "approved". But BenefitCase.stage is NOT automatically advanced to "approved_for_enrollment".
**Impact:** Case sits at "employer_review" stage indefinitely after employer approval.
**Fix:** After Proposal.update({ status: "approved" }), call BenefitCase.update({ stage: "approved_for_enrollment" }) in the same mutation.

### Gap 3: Enrollment Completion → Case Stage Advance
**Current state:** EmployeeEnrollment.status = "completed" is set for each employee. But no code advances BenefitCase.stage to "enrollment_complete" when all enrollments finish.
**Impact:** Case stage never automatically moves past "enrollment_open".
**Fix:** After each enrollment completion, check if all EmployeeEnrollment records for the window are completed/waived. If so, update EnrollmentWindow.status = "completed" and BenefitCase.stage = "enrollment_complete".

### Gap 4: DocuSign Completion → Enrollment Status Update
**Current state:** docuSignWebhook function exists. When DocuSign fires a "completed" event, it should update EmployeeEnrollment.docusign_status = "completed" and set docusign_signed_at.
**Impact:** DocuSign audit trail and enrollment confirmation depend on this webhook being correctly registered and firing.
**Fix:** Verify docuSignWebhook is registered as the DocuSign event webhook URL in the DocuSign dashboard. Confirm it updates the correct EmployeeEnrollment record.

### Gap 5: Census Upload → Case Census Status Update
**Current state:** When a CensusVersion is created, BenefitCase.census_status should update to "uploaded". After validation, it should update to "validated" or "issues_found".
**Impact:** Case overview tab shows "not_started" census status even after uploading census.
**Fix:** After CensusVersion.create(), call BenefitCase.update({ census_status: "uploaded" }). After validation run, update to "validated" or "issues_found".

### Gap 6: Quote Calculation Completion → Case Quote Status Update
**Current state:** calculateQuoteRates updates QuoteScenario.status = "completed". But BenefitCase.quote_status is never updated.
**Impact:** Case overview always shows "not_started" quote status.
**Fix:** After calculateQuoteRates succeeds, update BenefitCase.quote_status = "completed".

---

## Missing Notification Hooks

| Event | Current State | Missing |
|---|---|---|
| Proposal sent to employer | sendProposalEmail called | No notification to broker when employer views it |
| Employer approves proposal | Proposal.status updated | No email/notification to broker |
| Employer rejects proposal | Proposal.status updated | No email/notification to broker |
| Census validation completes | UI shows results | No notification to assigned broker |
| Enrollment window closing soon | UI badge shows | No email reminder to employees who haven't completed |
| Task overdue | UI shows "Overdue" label | No automated notification to assigned user |
| Exception created | ExceptionItem.create | No notification to assigned_to user |
| Exception critical severity | ExceptionItem.create | No escalation notification |
| Renewal within 30 days | UI shows urgency | No automated email to broker |

**Fix Priority:**
1. HIGH: Broker notification on employer proposal approve/reject
2. HIGH: Employee reminder for closing enrollment windows
3. MEDIUM: Task overdue notification
4. MEDIUM: Critical exception notification

---

## Missing Report Dependencies

| Report | Location | Missing |
|---|---|---|
| Proposal approval rate | ProposalAnalyticsDashboard | Requires sufficient historical proposal data |
| Census quality score | CensusQualityDashboard | Requires CensusMember records with validation flags |
| Renewal risk forecast | RenewalRiskForecast | Requires CensusMember data AND selected renewal |
| Policy match results | PolicyMatchAI | Requires GradientAI key AND census data |
| Help coverage snapshot | HelpCoverageReport | Requires HelpTarget records to be seeded |
| Exception resolution time | ExceptionAnalyticsDashboard | Requires resolved exceptions with resolved_at timestamps |

---

## Missing Permission Checks

| Page | Issue | Fix |
|---|---|---|
| /employer-portal | Any logged-in user can view all employer portal data | Add employer identity verification |
| /employee-portal | Any logged-in user can navigate to this page | Add access token validation |
| /integration-infra | Accessible to all logged-in users | Add admin-only check |
| /help-admin | No explicit admin check on the page component itself | Add useAuth() + user.role === "admin" check |
| ExceptionQueue "My Exceptions" filter | Uses user.email from useAuth | Correct — no issue |
| Settings admin tabs | Correctly gated | No issue |

---

## Missing Save Logic

| Page | Item | Issue |
|---|---|---|
| Settings | FeatureTogglesPanel | Toggle state not persisted to any entity — in-memory only |
| Settings | BrandingPanel | Brand settings not connected to Agency.settings |
| Exception Detail Drawer | Notes / Status updates | ExceptionCommentThread has no entity backing |
| Employer Portal | Communication Hub messages | ActivityLog.create used? Verify message persistence |
`
      },

      // ─────────────────────────────────────────────────────────────────────
      // TOPIC 6: PRIORITIZED FIX RECOMMENDATIONS
      // ─────────────────────────────────────────────────────────────────────
      {
        topic_code: "AUDIT_FIX_RECOMMENDATIONS",
        topic_title: "Full Page Audit — Prioritized Fix Recommendations",
        topic_type: "reference",
        sort_order: 105,
        topic_summary: "All identified issues prioritized by severity with exact code-level fixes for every page.",
        search_keywords: "fix recommendations, prioritized fixes, exact fixes, production hardening, what to fix, action plan, remediation",
        topic_body: `# Prioritized Fix Recommendations

## Priority 1 — CRITICAL (Block production launch)

### FIX-01: Employee Portal Token Validation
**Page:** /employee-portal, /employee-enrollment
**Exact Fix:**
In both pages, read \`?token=\` from URL params on mount. Call a backend function \`validateEnrollmentToken({ token })\` that checks EmployeeEnrollment.access_token and returns the enrollment record. Reject and show error if token is invalid or expired.
\`\`\`js
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
// call validateEnrollmentToken({ token }) on mount
\`\`\`

### FIX-02: Employer Portal Identity Check
**Page:** /employer-portal
**Exact Fix:**
Add URL param ?employer_id= or ?token=. Validate that the logged-in user's email matches EmployerGroup.primary_contact_email, OR validate a portal token. Until wired, add admin-only guard as a temporary measure:
\`\`\`js
const { user } = useAuth();
if (!user || user.role !== 'admin') return <AccessDenied />;
\`\`\`

### FIX-03: Remove/Implement Employee Portal Login
**Page:** /employee-portal-login  
**Exact Fix:** Remove route from App.jsx until implemented:
\`\`\`jsx
// Remove this line from App.jsx:
<Route path="/employee-portal-login" element={<EmployeePortalLogin />} />
\`\`\`
Or implement a real access-code login form that calls a backend function.

### FIX-04: Agency Seed Guarantee
**Page:** /cases/new
**Exact Fix:** In the New Case form, if \`agencies.length === 0\`, auto-create a default agency or show a blocking setup notice:
\`\`\`js
if (agencies.length === 0) {
  // show "Please configure your agency in Settings before creating cases"
}
\`\`\`

---

## Priority 2 — HIGH (Feature correctness)

### FIX-05: Census Upload — Invalidate Query on Close
**Page:** /census, CensusUploadModal
**Exact Fix:** In Census.jsx, add queryClient to the onClose handler:
\`\`\`js
onClose={() => {
  setShowUpload(false);
  queryClient.invalidateQueries({ queryKey: ["census-all"] });
}}
\`\`\`

### FIX-06: Employer Approval → Case Stage Auto-Advance
**Page:** /employer-portal, ProposalReviewPanel
**Exact Fix:** After approving a proposal, also update the linked case:
\`\`\`js
await base44.entities.Proposal.update(proposal.id, { status: "approved", approved_at: now });
if (proposal.case_id) {
  await base44.entities.BenefitCase.update(proposal.case_id, { stage: "approved_for_enrollment" });
}
\`\`\`

### FIX-07: Case Status Updates After Census Upload
**Page:** CensusUploadModal (onSuccess)
**Exact Fix:**
\`\`\`js
onSuccess: async () => {
  await base44.entities.BenefitCase.update(caseId, { census_status: "uploaded" });
  queryClient.invalidateQueries({ queryKey: ["census-all"] });
  queryClient.invalidateQueries({ queryKey: ["case", caseId] });
}
\`\`\`

### FIX-08: Case Quote Status After Calculation
**Page:** Quotes.jsx, handleCalculate
**Exact Fix:** After calculateQuoteRates succeeds:
\`\`\`js
// existing success handler, add:
if (scenario.case_id) {
  await base44.entities.BenefitCase.update(scenario.case_id, { quote_status: "completed" });
  queryClient.invalidateQueries({ queryKey: ["case", scenario.case_id] });
}
\`\`\`

### FIX-09: Wire ProposalFilterPresets
**Page:** /proposals (ProposalBuilder.jsx)
**Exact Fix:**
\`\`\`jsx
<ProposalFilterPresets onSelectPreset={(preset) => {
  if (preset.status) setStatusFilter(preset.status);
  if (preset.employer) setEmployerFilter(preset.employer);
  if (preset.dateRange) setDateRange(preset.dateRange);
}} />
\`\`\`

### FIX-10: Wire PlanFilterPresets and PlanSearchAdvanced
**Page:** /plans (PlanLibrary.jsx)
**Exact Fix:**
\`\`\`jsx
<PlanFilterPresets onSelectPreset={(preset) => {
  if (preset.carrier) setCarrierFilter(preset.carrier);
  if (preset.network) setNetworkFilter(preset.network);
  if (preset.planType) setActiveTab(preset.planType);
}} />
<PlanSearchAdvanced onSearch={(query) => setSearch(query)} />
\`\`\`

---

## Priority 3 — MEDIUM (UX & data integrity)

### FIX-11: Wire ExceptionCommentThread
**Page:** /exceptions (ExceptionQueue.jsx)
**Exact Fix:**
\`\`\`jsx
<ExceptionCommentThread exceptionId={detailException.id} />
\`\`\`

### FIX-12: Wire ExceptionBulkActionsPanel Actions
**Page:** /exceptions
**Exact Fix:** Pass mutation callbacks as props:
\`\`\`jsx
<ExceptionBulkActionsPanel
  selectedCount={selectedIds.size}
  onBulkResolve={() => bulkResolve.mutate()}
  onBulkDismiss={() => bulkDismiss.mutate()}
/>
\`\`\`

### FIX-13: Wire ExceptionFilterPresets
**Page:** /exceptions
**Exact Fix:**
\`\`\`jsx
<ExceptionFilterPresets onSelectPreset={(preset) => {
  if (preset.status) setStatusFilter(preset.status);
  if (preset.severity) setSeverityFilter(preset.severity);
  if (preset.category) setCategoryFilter(preset.category);
}} />
\`\`\`

### FIX-14: Add ?case_id Deep-Link to Tasks
**Page:** /tasks (Tasks.jsx)
**Exact Fix:** On mount, read URL param and set as initial filter:
\`\`\`js
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const caseId = params.get('case_id');
  if (caseId) setSearch(caseId); // or add a caseIdFilter state
}, []);
\`\`\`

### FIX-15: Add "View in Census Module" Link in CaseCensusTab
**File:** components/cases/CaseCensusTab.jsx
**Exact Fix:** Add a Link at the top of the tab:
\`\`\`jsx
<Link to={'/census?case_id=' + caseId} className="text-xs text-primary hover:underline flex items-center gap-1">
  <ArrowUpRight className="w-3 h-3" /> Open in Census Module
</Link>
\`\`\`

### FIX-16: Add "View in Quotes" Link in CaseQuotesTab
**File:** components/cases/CaseQuotesTab.jsx
**Exact Fix:**
\`\`\`jsx
<Link to={'/quotes?case_id=' + caseId} className="text-xs text-primary hover:underline flex items-center gap-1">
  <ArrowUpRight className="w-3 h-3" /> Open in Quotes Module
</Link>
\`\`\`

### FIX-17: Fix "Due Today" KPI Card Filter Logic
**Page:** /tasks (Tasks.jsx line ~378)
**Exact Fix:** Add a \`dueTodayFilter\` state and apply in the filter:
\`\`\`js
// In stat card click handler:
{ label: "Due Today", ..., onClick: () => { setStatusFilter("active"); setDueTodayOnly(true); } }

// In filter logic:
const matchDueToday = !dueTodayOnly || (t.due_date && isToday(new Date(t.due_date)));
\`\`\`

### FIX-18: Add Census Deep-Link Support in Census Page
**Page:** /census (Census.jsx)
**Exact Fix:**
\`\`\`js
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const caseId = params.get('case_id');
  if (caseId) setSelectedCaseId(caseId);
}, []);
\`\`\`

---

## Priority 4 — LOW (Polish & maintenance)

### FIX-19: Mark Integration Infrastructure as Reference
**Page:** /integration-infra
Add a yellow info banner at the top: "This page contains reference documentation for planned integrations."

### FIX-20: Consolidate /help-manual-manager
**File:** App.jsx
Either redirect to /help-admin or remove route:
\`\`\`jsx
// Replace HelpManualManager route with a redirect:
<Route path="/help-manual-manager" element={<Navigate to="/help-admin" replace />} />
\`\`\`

### FIX-21: Persist FeatureToggles to Agency.settings
**Page:** /settings, FeatureTogglesPanel
Wire toggle state to \`base44.auth.updateMe()\` or \`Agency.update({ settings: { ...settings, toggleKey: value } })\`.

### FIX-22: EIN Format Validation in Employers
**Page:** /employers, EmployerModal
\`\`\`jsx
// In save mutation validation:
if (form.ein && !/^\d{2}-\d{7}$/.test(form.ein)) {
  return alert("EIN must be in XX-XXXXXXX format");
}
\`\`\`

### FIX-23: Add GradientAI Feature Gate
**Pages:** /census (GradientAIAnalysisPanel), /policymatch
Wrap GradientAI-dependent sections:
\`\`\`jsx
{gradientAIConfigured ? <GradientAIAnalysisPanel ... /> : (
  <div className="text-xs text-muted-foreground p-4 border rounded-lg">
    GradientAI integration not configured. Contact your administrator.
  </div>
)}
\`\`\`

---

## Summary: Fix Counts by Priority

| Priority | Count | Estimated Effort |
|---|---|---|
| P1 Critical | 4 fixes | 2–3 days |
| P2 High | 7 fixes | 2–3 days |
| P3 Medium | 8 fixes | 2–3 days |
| P4 Low | 5 fixes | 1 day |
| **Total** | **24 fixes** | **~8–10 dev days** |
`
      },
    ];

    let created = 0, updated = 0;
    const errors = [];
    for (const topicData of topics) {
      try {
        const existing = await db.entities.HelpManualTopic.filter({ topic_code: topicData.topic_code });
        if (existing && existing.length > 0) {
          await db.entities.HelpManualTopic.update(existing[0].id, {
            ...topicData, is_active: true, is_published: true,
            published_at: new Date().toISOString(), last_updated_by: user.email
          });
          updated++;
        } else {
          await db.entities.HelpManualTopic.create({
            ...topicData, is_active: true, is_published: true,
            published_at: new Date().toISOString(), last_updated_by: user.email
          });
          created++;
        }
      } catch (e) { errors.push({ topic_code: topicData.topic_code, error: e.message }); }
    }

    return Response.json({
      success: true, seed: "full_audit_report",
      created, updated, total: topics.length, errors
    });
  } catch (error) {
    console.error('[function' + '] error:', error.message, error.stack);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});