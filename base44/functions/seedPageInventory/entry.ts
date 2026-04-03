/**
 * seedPageInventory
 * Seeds the complete ConnectQuote 360 Application Page Inventory
 * as HelpManualTopics for HelpAI access and documentation governance.
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
      {
        topic_code: "INV_MASTER_PAGE_INVENTORY",
        topic_title: "Master Page Inventory — ConnectQuote 360",
        topic_type: "reference", module_code: null, sort_order: 10,
        topic_summary: "Complete inventory of all 30 routed pages in ConnectQuote 360 with route, module, type, access roles, and status.",
        search_keywords: "page inventory, all pages, routes, navigation, application map, page list, screens, modules",
        topic_body: `# Master Page Inventory — ConnectQuote 360

## Application Summary
| Stat | Value |
|---|---|
| Total Routed Pages | 30 |
| Primary Navigation Pages | 17 |
| Admin/Help Pages | 7 |
| Portal Pages | 4 |
| Utility Pages | 2 |
| All routes wrapped in | AppLayout (Sidebar + TopBar) |
| Auth model | AuthProvider — all routes require authentication |
| Layout component | components/layout/AppLayout → components/layout/Sidebar |

---

## A. Complete Page Registry

| # | Page Code | Page Name | Route | Module | Page Type | Status |
|---|---|---|---|---|---|---|
| 1 | PG_DASHBOARD | Dashboard | / | DASHBOARD | dashboard | ✅ Complete |
| 2 | PG_CASES_LIST | Cases List | /cases | CASES | standard_screen | ✅ Complete |
| 3 | PG_CASE_NEW | New Case Form | /cases/new | CASES | wizard | ✅ Complete |
| 4 | PG_CASE_DETAIL | Case Detail | /cases/:id | CASES | standard_screen | ✅ Complete |
| 5 | PG_CENSUS | Census Management | /census | CENSUS | standard_screen | ✅ Complete |
| 6 | PG_QUOTES | Quotes | /quotes | QUOTES | standard_screen | ✅ Complete |
| 7 | PG_PROPOSALS | Proposal Builder | /proposals | PROPOSALS | standard_screen | ✅ Complete |
| 8 | PG_ENROLLMENT | Enrollment | /enrollment | ENROLLMENT | standard_screen | ✅ Complete |
| 9 | PG_RENEWALS | Renewals | /renewals | RENEWALS | standard_screen | ✅ Complete |
| 10 | PG_TASKS | Tasks | /tasks | TASKS | standard_screen | ✅ Complete |
| 11 | PG_EMPLOYERS | Employers | /employers | EMPLOYERS | standard_screen | ✅ Complete |
| 12 | PG_PLAN_LIBRARY | Plan Library | /plans | PLANS | standard_screen | ✅ Complete |
| 13 | PG_EXCEPTIONS | Exception Queue | /exceptions | EXCEPTIONS | standard_screen | ✅ Complete |
| 14 | PG_CONTRIBUTIONS | Contribution Modeling | /contributions | CONTRIBUTIONS | standard_screen | ✅ Complete |
| 15 | PG_POLICYMATCH | PolicyMatchAI | /policymatch | POLICYMATCH | standard_screen | ✅ Complete |
| 16 | PG_INTEGRATION_INFRA | Integration Infrastructure | /integration-infra | SETTINGS | admin_page | ⚠ UI-only (no live APIs) |
| 17 | PG_SETTINGS | Settings | /settings | SETTINGS | settings_page | ✅ Complete |
| 18 | PG_EMPLOYER_PORTAL | Employer Portal | /employer-portal | PORTALS | standard_screen | ✅ Complete |
| 19 | PG_EMPLOYEE_PORTAL | Employee Portal | /employee-portal | PORTALS | standard_screen | ✅ Complete |
| 20 | PG_EMPLOYEE_PORTAL_LOGIN | Employee Portal Login | /employee-portal-login | PORTALS | modal | ⚠ Partial — login form only |
| 21 | PG_EMPLOYEE_ENROLLMENT | Employee Enrollment Wizard | /employee-enrollment | PORTALS | wizard | ✅ Complete |
| 22 | PG_EMPLOYEE_BENEFITS | Employee Benefits Summary | /employee-benefits | PORTALS | standard_screen | ✅ Complete |
| 23 | PG_HELP_CENTER | Help Center | /help | HELP | standard_screen | ✅ Complete |
| 24 | PG_HELP_ADMIN | Help Management Console | /help-admin | HELP | admin_page | ✅ Complete |
| 25 | PG_HELP_DASHBOARD | Help Governance Dashboard | /help-dashboard | HELP | dashboard | ✅ Complete |
| 26 | PG_HELP_COVERAGE | Help Coverage Report | /help-coverage | HELP | report_page | ✅ Complete |
| 27 | PG_HELP_ANALYTICS | Help Search Analytics | /help-analytics | HELP | report_page | ✅ Complete |
| 28 | PG_HELP_MANUAL_MANAGER | Help Manual Manager | /help-manual-manager | HELP | admin_page | ✅ Complete |
| 29 | PG_HELP_TARGET_REGISTRY | Help Target Registry | /help-target-registry | HELP | admin_page | ✅ Complete |
| 30 | PG_404 | Page Not Found | * (catch-all) | — | utility | ✅ Complete |

---

## B. Navigation Structure

### Core Workflow (Sidebar Group 1)
Dashboard → Cases → Employers → Census → Quotes → Contributions → Proposals → Enrollment → Renewals

### Tools & Reference (Sidebar Group 2)
Plan Library → PolicyMatchAI → Tasks → Exceptions → Integration Infra

### Portals (Sidebar Group 3)
Employer Portal → Employee Portal

### Bottom Navigation
Help Center → Help Console (Admin) → Settings

### Not in Sidebar (accessible via links or direct URL)
- /cases/new (linked from Cases page)
- /cases/:id (linked from Cases list)
- /employee-portal-login
- /employee-enrollment
- /employee-benefits
- /help-dashboard, /help-coverage, /help-analytics, /help-manual-manager, /help-target-registry (linked from Help Admin)
`
      },

      {
        topic_code: "INV_PAGE_SECTION_MAP",
        topic_title: "Page-to-Section Map",
        topic_type: "reference", module_code: null, sort_order: 11,
        topic_summary: "Every section, tab, panel, and sub-region of every page in the application.",
        search_keywords: "page sections, tabs, panels, page layout, section map, page structure, UI regions",
        topic_body: `# Page-to-Section Map

## PG_DASHBOARD (/)
- Section 1: Page Header (title, description)
- Section 2: KPI Cards strip (Active Cases, Open Enrollments, Upcoming Renewals)
- Section 3: Interactive Pipeline visualization (CasePipelineView)
- Section 4: Quick Actions panel (QuickActions)
- Section 5: Today's Priorities list (TodaysPriorities)
- Section 6: Stalled Cases Alert (StalledCases)
- Section 7: Census Gap Alert (CensusGapAlert)
- Section 8: Enrollment Countdowns (EnrollmentCountdowns)

## PG_CASES_LIST (/cases)
- Section 1: Page Header (title, case count, New Case button)
- Section 2: KPI Summary strip (Active Cases, Enrollment Open, Urgent Priority, Stalled 7+ days)
- Section 3: Filter Bar (search, stage filter, type filter, priority filter, sort, view toggle)
- Section 4: Active filter chips + count
- Section 5: Case List (CaseListCard components) OR Pipeline View (CasePipelineView)
- Section 6: Empty state (EmptyState component)

## PG_CASE_NEW (/cases/new)
- Section 1: Back nav + page title
- Section 2: Employer card (select existing OR new employer name, employee count)
- Section 3: Case Details card (case type, priority, effective date, target close date, assigned to)
- Section 4: Products Requested card (checkbox grid)
- Section 5: Notes card (textarea)
- Section 6: Form action buttons (Cancel, Create Case)

## PG_CASE_DETAIL (/cases/:id)
- Section 1: Case header (employer name, stage badge, priority badge, case number, case type, effective date, assigned to)
- Section 2: Action buttons (Edit, Close Case, Advance Stage)
- Section 3: Stage Progress bar (StageProgress)
- Section 4: Tab bar (Overview | Census | Quotes | Tasks | Documents | Activity)
- Tab: Overview → Info cards grid, Products Requested, Notes, Lifecycle Checklist
- Tab: Census → CaseCensusTab (version list, upload CTA)
- Tab: Quotes → CaseQuotesTab (scenario list, new scenario CTA)
- Tab: Tasks → CaseTasksTab (task list, add task)
- Tab: Documents → DocumentsTab (doc list, upload)
- Tab: Activity → ActivityTab (audit trail)
- Section 5: Floating AI Assistant (AIAssistant)
- Modals: CaseEditModal, CaseCloseModal, StageAdvanceModal

## PG_CENSUS (/census)
- Section 1: Page Header (title, Upload Census button)
- Section 2: Case Selector (search + select dropdown + clear)
- Section 3: Selected Case Info card (employer name, case number, stage, Upload button)
- Section 4: CensusVersionHistory (version list, view members CTA)
- Section 5: RiskDashboard (age distribution, risk factors — shown when version selected)
- Section 6: GradientAIAnalysisPanel (AI risk analysis)
- Section 7: CensusMemberTable (member grid — shown when version selected)
- Section 8: Empty states (no case selected / no census data)
- Modal: CensusUploadModal

## PG_QUOTES (/quotes)
- Section 1: Page Header (title, description, expiring-soon alert, New Scenario button)
- Section 2: QuotesKPIBar (total premium, avg employee cost, scenario count, plans in scope)
- Section 3: ScenarioCompare panel (shown when compare mode active)
- Section 4: Filter/view bar (By Case / All toggle, search, status filter, employer filter, sort, carrier filter, clear)
- Section 5: Active filter chips
- Section 6: Bulk actions bar (compare, mark expired, delete, clear)
- Section 7: Calculate all drafts banner
- Section 8: Scenarios grouped by case (collapsible) OR flat list (ScenarioCard)
- Section 9: Empty state
- Modals: NewScenarioFromQuotes, QuoteScenarioModal

## PG_PROPOSALS (/proposals)
- Section 1: Page Header (title, expiring-soon alert, mark-expired CTA, Export button, New Proposal button)
- Section 2: View mode toggle (List / Analytics / Workflow)
- Analytics view: ProposalAnalyticsDashboard, ProposalApprovalTrend, ProposalQualityScore, ProposalHistoryTimeline
- Workflow view: ProposalWorkflowSuggestions, ProposalQualityScore, ProposalComparisonMatrix
- List view (default):
  - Section 3: ProposalKPIBar (clickable: draft, sent, viewed, approved, rejected, expired, expiring, stale)
  - Section 4: ProposalFilterPresets (quick filter presets)
  - Section 5: ProposalQualityScore
  - Section 6: ProposalComparisonMatrix
  - Section 7: View + Filter Bar (list/pipeline toggle, search, status, employer, broker, date range, sort, clear)
  - Section 8: Bulk select bar (select all / deselect all)
  - Section 9: ProposalBulkActions (bulk status update, delete)
  - Section 10: Proposal list (ProposalCard) or Pipeline (ProposalPipelineView)
  - Section 11: Empty state
- Modals: ProposalModal (create/edit), ProposalViewModal, RejectProposalModal

## PG_ENROLLMENT (/enrollment)
- Section 1: Page Header (title, closing-soon alert, New Enrollment Window button)
- Section 2: EnrollmentKPIBar (active windows, total enrolled, participation rate, pending signatures)
- Section 3: Filter bar (search, status filter, clear)
- Section 4: EnrollmentWindowCard list (each card: employer, dates, status, participation bar, member counts)
- Section 5: Empty state
- Modal: CreateEnrollmentModal

## PG_RENEWALS (/renewals)
- Section 1: Page Header (title, record counts, Export button, New Renewal button)
- Section 2: RenewalKPIBar (clickable: total, due-90-days, high-disruption, overdue, avg-rate-change)
- Section 3: RateDistributionChart (histogram of rate change distribution)
- Section 4: RenewalWorkloadBar (by assignee)
- Section 5: Filter bar (search, status, urgency, assignee, rate direction, sort, view mode toggle, clear)
- Section 6: Active filter chips
- Section 7: Bulk actions bar (change status, delete, clear)
- Section 8: Record count
- Section 9: List view (RenewalCard) OR Pipeline (RenewalPipelineView) OR Calendar (RenewalCalendarView)
- Section 10: Empty state
- Section 11: RenewalRiskForecast (floating panel, shown when renewal selected + census data)
- Modal: RenewalDetailModal, CreateRenewalModal

## PG_TASKS (/tasks)
- Section 1: Page Header (title, New Task button)
- Section 2: Filter bar (search, status filter, priority filter, assigned filter)
- Section 3: Task list (task cards with title, case link, due date, priority badge, status)
- Section 4: Empty state

## PG_EMPLOYERS (/employers)
- Section 1: Page Header (title, Add Employer button)
- Section 2: Search + filter bar
- Section 3: Employer cards grid (name, EIN, city/state, employee count, status badge)
- Section 4: Empty state

## PG_PLAN_LIBRARY (/plans)
- Section 1: Page Header (title, Add Plan button, Bulk Import button)
- Section 2: Filter/search bar (search, plan type, network type, carrier, metal tier, HSA filter)
- Section 3: Analytics panel (PlanAnalyticsPanel — top plans, premium distribution)
- Section 4: Plan cards grid (PlanCard)
- Section 5: Plan comparison tool (PlanComparisonTool — shown when plans selected)
- Section 6: Empty state
- Modals: PlanFormModal, PlanImportModal, PlanCompareDrawer, RateTableEditor

## PG_EXCEPTIONS (/exceptions)
- Section 1: Page Header (title, New Exception button)
- Section 2: ExceptionKPIBar (open, critical, high, avg resolution time)
- Section 3: ExceptionWorkflowBoard (Kanban by status)
- Section 4: Filter bar
- Section 5: ExceptionCard list
- Section 6: Empty state
- Drawer: ExceptionDetailDrawer

## PG_CONTRIBUTIONS (/contributions)
- Section 1: Page Header (title, New Model button)
- Section 2: ContributionKPIBar (total employer cost, avg employee cost, ACA compliance)
- Section 3: Filter/comparison controls
- Section 4: ContributionModelCard list
- Section 5: ContributionComparePanel (side-by-side comparison)
- Section 6: ACA affordability analysis
- Section 7: Empty state
- Modal: CreateModelModal

## PG_POLICYMATCH (/policymatch)
- Section 1: Page Header (title, description)
- Section 2: Analysis controls (census selector, mode selector, Run Analysis button)
- Section 3: PolicyMatchRecommendationEngine (results: risk score, value score, risk tier badge)
- Section 4: PolicyMatchComparisonMatrix (top plans comparison)
- Section 5: PolicyMatchRiskBreakdown (age/gender/coverage distribution)
- Section 6: PolicyMatchAnalyticsDashboard (portfolio-level analytics)
- Section 7: PolicyMatchHistoryTimeline (past analyses)
- Section 8: PolicyMatchFilterPresets
- Section 9: PolicyMatchBulkActions
- Section 10: PolicyMatchQualityScore
- Section 11: PolicyMatchModeGuide

## PG_SETTINGS (/settings)
- Section 1: Page Header (title, Save button)
- Tab: Organization (agency name, code, address, city, state, zip, phone, email, status)
- Tab: Account (user profile)
- Tab: Team (admin only — user list, invite user, role management)
- Tab: Integrations (admin only — DocuSign, GradientAI, carriers, email service)
- Tab: Branding (admin only — BrandingPanel)
- Tab: Feature Toggles (admin only — FeatureTogglesPanel)
- Tab: Billing (admin only — BillingUsagePanel)
- Tab: Audit Logs (admin only — AuditLogPanel)
- Tab: Help (links to help admin pages)
- Sub-panels: APIIntegrationsPanel, WebhookConfigPanel, AuditLogPanel, BillingUsagePanel, BrandingPanel, FeatureTogglesPanel

## PG_EMPLOYER_PORTAL (/employer-portal)
- Section 1: ActionRequiredBanner (proposal needs review, enrollment needs approval)
- Section 2: CaseLifecycleStatus (timeline visual)
- Section 3: ProposalReviewPanel (view proposal, approve/reject buttons)
- Section 4: EnrollmentDrillDown (participation stats)
- Section 5: DocumentsPanel
- Section 6: FinancialModeling
- Section 7: CommunicationHub (message thread)
- Section 8: BrokerContactCard
- Section 9: RenewalStatus

## PG_EMPLOYEE_ENROLLMENT (/employee-enrollment)
- Section 1: Enrollment Deadline Banner (EnrollmentDeadlineBanner)
- Section 2: Multi-step wizard (EnrollmentWizard):
  - Step 1: Welcome & Eligibility verification
  - Step 2: Coverage Tier selection
  - Step 3: Plan Selection (PlanSelectionStep, PlanDetailView, PlanCompareModal)
  - Step 4: Dependents (DependentForm)
  - Step 5: Review & Confirm (EnrollmentConfirmation)
  - Step 6: DocuSign Signature (DocuSignSigningPane)
- Section 3: Session timeout warning (SessionTimeout)
- Section 4: HelpContactCard

## PG_EMPLOYEE_BENEFITS (/employee-benefits)
- Section 1: BenefitsDashboard (plan summary, effective dates, monthly premium)
- Section 2: Benefits Glossary (BenefitsGlossary)
- Section 3: Life Event card (LifeEventCard)
- Section 4: Provider Search (ProviderSearch)
- Section 5: Risk-Adjusted Plan Recommendation (RiskAdjustedPlanRecommendation)
- Section 6: DocuSign status/audit trail (DocuSignStatusBadge, DocuSignAuditTrail)

## PG_HELP_CENTER (/help)
- Section 1: Search bar (global search, keyboard shortcut /)
- Section 2: HelpHomeScreen (module cards, user manual grid, popular topics, recent history, HelpAI CTA)
- Section 3: HelpModuleDrillDown (when module selected)
- Section 4: HelpTopicDetail OR HelpManualTopicDetail (when topic selected)
- Section 5: HelpAIAssistant (floating launcher)

## PG_HELP_ADMIN (/help-admin)
- Section 1: Page Header + nav links to help sub-pages
- Tab: Coverage (ContentCoverageTab — KPIs, module progress bars, filterable target list, export CSV)
- Tab: Browse (module grid → page accordion → target list with edit/toggle/delete)
- Tab: Manual Topics (ManualTopicsTab — full CRUD, filters by type/module/publish status)
- Tab: Bulk AI Generate (BulkAIGeneratePanel — queue N targets, progress bar, stop button)
- Tab: Seed Data (AdminSeedPanel — 3 seed pack cards)
- Tab: Editor (contextual help form — all HelpContent fields, AI generate, preview, save)
- Tab: AI Review (AIReviewTab — pending/low-conf/unanswered/reviewed filter, action buttons)
- Modal: TopicEditorModal (full manual topic editor with markdown body, metadata, AI write)
`
      },

      {
        topic_code: "INV_PAGE_FIELD_CONTROL_MAP",
        topic_title: "Page-to-Field & Control Map",
        topic_type: "reference", module_code: null, sort_order: 12,
        topic_summary: "Every input field, dropdown, checkbox, toggle, and control on every form and data-entry page.",
        search_keywords: "fields, controls, inputs, form fields, dropdowns, form map, field inventory, data entry",
        topic_body: `# Page-to-Field & Control Map

## PG_CASE_NEW — Fields
| Field | Type | Required | Values / Notes |
|---|---|---|---|
| employer_group_id | Select (lookup) | No | Existing EmployerGroup records |
| employer_name | Text Input | Yes | New or overrides selected employer |
| employee_count | Number Input | No | Integer |
| case_type | Select | Yes | new_business, renewal, mid_year_change, takeover |
| priority | Select | Yes | low, normal, high, urgent |
| effective_date | Date Input | No | ISO date |
| target_close_date | Date Input | No | ISO date |
| assigned_to | Text Input | No | User email (pre-fills with current user) |
| products_requested | Multi-toggle buttons | No | medical, dental, vision, life, std, ltd, voluntary |
| notes | Textarea | No | Free text |

**Validations:** employer_name required | Create button disabled until employer_name filled

## PG_CASE_DETAIL — Controls
| Control | Type | Notes |
|---|---|---|
| Edit (pencil button) | Button | Opens CaseEditModal |
| Close Case | Button | Opens CaseCloseModal — disabled if stage = "closed" |
| Advance → [Stage] | Button | Opens StageAdvanceModal — hidden if no next stage or closed |
| Stage Progress Bar | Visual | Read-only, driven by stage enum |
| Tab selector | Tabs | Overview / Census / Quotes / Tasks / Documents / Activity |
| Overview: info cards | Read-only | Employee count, census status, quote status, enrollment status, priority, assigned to |
| Products Requested | Badge display | Read-only, from case record |
| Notes | Read-only text | From case record |
| Lifecycle Checklist | Checklist visual | Read-only, derived from entity counts |

## CaseEditModal — Fields
case_type, effective_date, target_close_date, priority, assigned_to, employee_count, notes, products_requested

## CaseCloseModal — Fields
closed_reason (Select: lost, declined_to_renew, switched_carriers, duplicate, admin_close, other), notes (Textarea)

## PG_CENSUS — Controls
| Control | Type | Notes |
|---|---|---|
| Case search | Text Input | Filters case selector options |
| Case selector | Select | Dropdown of all BenefitCase records |
| Clear button | Button | Clears case selection and search |
| Upload Census button | Button | Opens CensusUploadModal |
| Version History list | List | Shows all CensusVersion for case, click to select version |
| View Members button | Button | Sets viewingVersionId, shows member table |
| Hide Members button | Button | Clears viewingVersionId |
| Run Analysis (GradientAI) | Button | Calls processGradientAI function |

## CensusUploadModal — Fields
file (CSV/Excel upload), case_id (pre-filled), version notes (optional Textarea)

## PG_QUOTES — Controls
| Control | Type | Notes |
|---|---|---|
| By Case / All toggle | Toggle buttons | Groups or flattens scenario list |
| Search | Text Input | Filters by scenario name, employer name |
| Status filter | Select | all, draft, running, completed, error, expired |
| Employer filter | Select | Dynamic from loaded scenarios |
| Sort | Select | created_date, premium, expiry, score |
| Carrier filter | Select | Dynamic from scenario data |
| Expiring soon alert | Toggle badge | Filters to expiring-within-14-days |
| New Scenario button | Button | Opens NewScenarioFromQuotes modal |
| Scenario checkboxes | Checkbox | Multi-select for compare (max 4) |
| Compare button | Button | Shown when 2+ selected |
| Bulk: Mark Expired | Button | Bulk status update |
| Bulk: Delete | Button | Bulk delete with confirmation |
| Calculate All Drafts | Button | Shown when draft scenarios > 1 |
| Case group header | Collapsible | Toggles scenario list for that case |

## NewScenarioFromQuotes / QuoteScenarioModal — Fields
name, case_id, carrier, plan_ids (multi-select), contribution_type (fixed_amount/fixed_pct/reference_plan/composite/voluntary), contribution_value, notes, effective_date

## PG_PROPOSALS — Controls
| Control | Type | Notes |
|---|---|---|
| View mode selector | Select | list, analytics, guide |
| List/Pipeline toggle | Button group | list \| pipeline |
| Search | Text Input | title, employer, broker |
| Status filter | Select | all + 6 statuses |
| Employer filter | Select | Dynamic |
| Broker filter | Select | Dynamic |
| Date range | Select | all, this_month, last_month, last_90, last_180 |
| Sort | Select | created_desc/asc, expiry_asc, value_desc, sent_desc |
| Expiring soon badge | Toggle alert | Filter to expiring-within-7-days |
| Mark Expired button | Button | Bulk update overdue → expired |
| Export CSV button | Button | Downloads CSV of filtered proposals |
| New Proposal button | Button | Opens ProposalModal |
| KPI tiles | Clickable cards | Set status/expiring/stale filter |
| Select All checkbox | Toggle | Multi-select all filtered |
| Per-proposal checkbox | Checkbox | Individual select |
| ProposalBulkActions | Action bar | Shown when items selected |

## ProposalModal — Fields
title, employer_name, broker_name, case_id, effective_date, total_monthly_premium, employer_monthly_cost, employee_avg_cost, notes, expires_at, status

## PG_ENROLLMENT — Controls
| Control | Type | Notes |
|---|---|---|
| Search | Text Input | By employer name |
| Status filter | Select | active (default), all, scheduled, open, closing_soon, closed, finalized |
| Closing-soon alert badge | Toggle button | Filter to closing-within-7-days |
| Clear filters button | Button | Resets filters |
| New Enrollment Window button | Button | Opens CreateEnrollmentModal |

## CreateEnrollmentModal — Fields
employer_name, case_id (Select), window_name, start_date, end_date, effective_date, status (default: scheduled), plans_available (multi-select from Plan Library), notes

## PG_RENEWALS — Controls
| Control | Type | Notes |
|---|---|---|
| Search | Text Input | By employer name |
| Status filter | Select | 8 status values |
| Urgency filter | Select | all, within 30/60/90 days |
| Assignee filter | Select | Dynamic from renewal data |
| Rate direction | Select | all, increases, decreases, flat |
| Sort | Select | 5 options |
| View mode | Button group | list \| pipeline \| calendar |
| Clear filters | Button | Resets all |
| Export CSV | Button | Downloads filtered renewals |
| New Renewal button | Button | Opens CreateRenewalModal |
| Bulk: Change Status | Select | In bulk bar |
| Bulk: Delete | Button | With confirmation |
| KPI tiles | Clickable | Filter shortcuts |
| Per-row checkbox | Checkbox | Multi-select |

## CreateRenewalModal — Fields
employer_name, case_id (Select), renewal_date, current_premium, renewal_premium, rate_change_percent, assigned_to, status, notes, products

## PG_PLAN_LIBRARY — Plan Form Fields
plan_name, carrier, plan_type (medical/dental/vision/life/std/ltd), network_type (HMO/PPO/HDHP/EPO/POS), metal_tier (bronze/silver/gold/platinum), deductible_individual, deductible_family, oop_max_individual, oop_max_family, coinsurance, copay_pcp, copay_specialist, hsa_eligible (toggle), hra_eligible (toggle), status (active/inactive/archived)

## Rate Table Editor — Fields (per plan)
Coverage tier (Employee Only / +Spouse / +Children / Family), monthly premium (per tier), effective_date_start, effective_date_end
`
      },

      {
        topic_code: "INV_PAGE_ACTION_MAP",
        topic_title: "Page-to-Action Map",
        topic_type: "reference", module_code: null, sort_order: 13,
        topic_summary: "Every button, action, mutation, function call, and navigation trigger on every page.",
        search_keywords: "actions, buttons, mutations, API calls, page actions, what buttons do, function calls",
        topic_body: `# Page-to-Action Map

## PG_CASES_LIST
| Action | Trigger | Result |
|---|---|---|
| New Case | Button click | Navigate to /cases/new |
| Filter: Stage/Type/Priority | Select change | Filter cases array (client-side) |
| Search | Input change | Filter cases array (client-side) |
| Sort | Select change | Sort cases array (client-side) |
| View toggle (List/Pipeline) | Button click | Swap CaseListCard ↔ CasePipelineView |
| Clear filters | Button click | Reset all filter state |
| Click KPI card | Click | Apply quick filter (e.g. stage=active) |
| Click case card | Click | Navigate to /cases/:id |

## PG_CASE_NEW
| Action | Trigger | Result |
|---|---|---|
| Select employer | Select change | Pre-fill employer_name, employee_count |
| Toggle product | Click | Add/remove from products_requested array |
| Submit form | Button (Create Case) | BenefitCase.create() → navigate to /cases/:id |
| Cancel | Button | Navigate back to /cases |

## PG_CASE_DETAIL
| Action | Trigger | Result |
|---|---|---|
| Back button | Click | Navigate to /cases |
| Edit Case | Button | Open CaseEditModal |
| Close Case | Button | Open CaseCloseModal |
| Advance Stage | Button | Open StageAdvanceModal |
| Confirm Advance | Modal confirm | BenefitCase.update(stage) + ActivityLog.create() |
| Confirm Close | Modal confirm | BenefitCase.update(stage=closed, closed_reason) + ActivityLog.create() |
| Save Edit | Modal save | BenefitCase.update(edited fields) |
| Switch Tab | Tab click | Change active tab content |

## PG_CENSUS
| Action | Trigger | Result |
|---|---|---|
| Select case | Select change | Filter versions, show case info card |
| Clear case | Button | Reset selectedCaseId |
| Upload Census | Button | Open CensusUploadModal |
| Complete Upload | Modal save | CensusVersion.create(), CensusMember bulk create |
| View Members | Button | Set viewingVersionId → show member table |
| Hide Members | Button | Clear viewingVersionId |
| Run GradientAI | Button in panel | Call processGradientAI function |
| Compare versions | Button | Show CensusVersionComparison |

## PG_QUOTES
| Action | Trigger | Result |
|---|---|---|
| New Scenario | Button | Open NewScenarioFromQuotes modal |
| Create scenario | Modal save | QuoteScenario.create() |
| Calculate rates | Button on card | calculateQuoteRates function call |
| Calculate All Drafts | Banner button | Loop calculateQuoteRates for all draft scenarios |
| Edit scenario | Pencil on card | Open QuoteScenarioModal with existing data |
| Save scenario edit | Modal save | QuoteScenario.update() |
| Toggle select | Checkbox | Add/remove from selectedIds |
| Compare | Bulk action | Set compareMode + open ScenarioCompare |
| Mark Expired (bulk) | Bulk action | QuoteScenario.update({ status: "expired" }) × N |
| Delete (bulk) | Bulk action | QuoteScenario.delete() × N |
| Create Proposal from scenario | Button in ScenarioCard | Navigate to /proposals with pre-fill context |
| Collapse case group | Click header | Toggle collapsedCases state |

## PG_PROPOSALS
| Action | Trigger | Result |
|---|---|---|
| New Proposal | Button | Open ProposalModal |
| Create/Save proposal | Modal save | Proposal.create() or Proposal.update() |
| View proposal | Card click | Open ProposalViewModal |
| Edit proposal | Edit button | Open ProposalModal with data |
| Reject proposal | Reject button | Open RejectProposalModal |
| Save rejection | Modal save | Proposal.update({ status: "rejected", rejection_reason }) |
| Send proposal | Button in view/edit modal | Calls sendProposalEmail function + update status to "sent" |
| Export CSV | Button | Client-side CSV generation and download |
| Mark all Expired | Button | Proposal.update({ status: "expired" }) × overdue proposals |
| Bulk actions | ProposalBulkActions bar | Proposal.update(status) × N or Proposal.delete() × N |
| Click KPI tile | Tile click | Apply filter |
| Switch view mode | Select | Show analytics/workflow/list content |
| Toggle select | Checkbox | Add/remove from selectedIds |

## PG_ENROLLMENT
| Action | Trigger | Result |
|---|---|---|
| New Enrollment Window | Button | Open CreateEnrollmentModal |
| Create window | Modal save | EnrollmentWindow.create() |
| Filter/search | Input/Select | Filter windows client-side |
| Click enrollment card | Card click | Expand EnrollmentWindowCard details |
| Send invitations | Button in card | Calls sendEnrollmentInvite function × N employees |
| Resend invitation | Per-member button | sendEnrollmentInvite function for single employee |
| Update window status | Action in card | EnrollmentWindow.update(status) |

## PG_RENEWALS
| Action | Trigger | Result |
|---|---|---|
| New Renewal | Button | Open CreateRenewalModal |
| Create renewal | Modal save | RenewalCycle.create() |
| Click renewal card | Click | Set selectedRenewal → open RenewalDetailModal |
| Edit in detail modal | Save button | RenewalCycle.update() |
| Export CSV | Button | Client-side CSV generation and download |
| Bulk change status | Select in bulk bar | RenewalCycle.update({ status }) × N |
| Bulk delete | Button | RenewalCycle.delete() × N with confirmation |
| Switch view (list/pipeline/calendar) | Toggle | Swap view component |
| Click KPI tile | Tile click | Apply quick filter |

## PG_PLANS
| Action | Trigger | Result |
|---|---|---|
| Add Plan | Button | Open PlanFormModal |
| Save plan | Modal save | BenefitPlan.create() or BenefitPlan.update() |
| Bulk Import | Button | Open PlanImportModal |
| Complete import | Modal | ExtractDataFromUploadedFile integration + BenefitPlan.bulkCreate() |
| Edit plan | Pencil on card | Open PlanFormModal with data |
| Archive plan | Status action | BenefitPlan.update({ status: "archived" }) |
| Toggle compare | Plan checkbox | Add to comparison |
| Open Rate Table | Button in plan form | Open RateTableEditor |
| Save rate table | Save | PlanRateTable.create/update() |

## PG_EXCEPTIONS
| Action | Trigger | Result |
|---|---|---|
| New Exception | Button | Open create form/modal |
| Create exception | Save | ExceptionItem.create() |
| Click exception | Click | Open ExceptionDetailDrawer |
| Change status | Status select | ExceptionItem.update({ status }) |
| Add comment | Comment form | ExceptionItem comment array update |
| Assign to | Assign field | ExceptionItem.update({ assigned_to }) |
| Mark Resolved | Button | ExceptionItem.update({ status: "resolved" }) |

## PG_EMPLOYEE_ENROLLMENT
| Action | Trigger | Result |
|---|---|---|
| Select coverage tier | Radio/select | Advance wizard step |
| Select plan | Plan card click | Set selectedPlanId |
| Compare plans | Button | Open PlanCompareModal |
| Add dependent | DependentForm | Add to dependents array |
| Remove dependent | X button | Remove from dependents array |
| Acknowledge enrollment | Checkbox | Enable submit |
| Submit enrollment | Final step button | EmployeeEnrollment.update(status=completed, plan, tier, dependents) |
| Waive coverage | Waive button | EmployeeEnrollment.update(status=waived, waiver_reason) |
| DocuSign sign | Button in signing pane | sendDocuSignEnvelope function → getDocuSignSigningURL function |

## PG_EMPLOYER_PORTAL
| Action | Trigger | Result |
|---|---|---|
| Approve proposal | Approve button | Proposal.update({ status: "approved", approved_at }) + BenefitCase.update(stage) |
| Reject proposal | Reject button | Open rejection form → Proposal.update({ status: "rejected" }) |
| View documents | Document list | Open PDF/file in new tab |
| Send message | Communication hub | ActivityLog.create() or notification |
`
      },

      {
        topic_code: "INV_DEPENDENCY_MAP",
        topic_title: "Page-to-Dependency Map",
        topic_type: "reference", module_code: null, sort_order: 14,
        topic_summary: "Every entity, API, function, integration, permission, and data dependency for every page.",
        search_keywords: "dependencies, entities, APIs, required data, page dependencies, upstream, downstream, required permissions",
        topic_body: `# Page-to-Dependency Map

## PG_DASHBOARD (/)
**Entities:** BenefitCase, CaseTask, EnrollmentWindow, RenewalCycle, QuoteScenario, ExceptionItem
**Functions:** None (all client-side computation)
**Integrations:** None
**Permissions:** Any authenticated user
**Upstream deps:** Cases, Enrollments, Renewals must exist for meaningful content
**Downstream:** Navigates to Cases, Enrollment, Renewals, Tasks, Census
**Components:** Dashboard.jsx → QuickActions, TodaysPriorities, StalledCases, CensusGapAlert, EnrollmentCountdowns, InteractivePipeline, MetricCard

## PG_CASES_LIST (/cases)
**Entities:** BenefitCase (list, filter)
**Upstream deps:** Employers should exist before creating cases
**Downstream:** Navigates to /cases/new, /cases/:id
**Sort/filter:** client-side only (no server-side pagination currently)
**Note:** Loads up to 200 cases — may need pagination for large datasets

## PG_CASE_NEW (/cases/new)
**Entities:** Agency (list), EmployerGroup (list), BenefitCase (create)
**Validations:** employer_name required, form submit disabled if empty
**Upstream deps:** Agency record must exist (uses agencies[0].id as fallback = "default")
**⚠ Risk:** If no Agency exists, agency_id = "default" — may fail FK validation
**Downstream:** After create → /cases/:id

## PG_CASE_DETAIL (/cases/:id)
**Entities:** BenefitCase (read, update), CaseTask (list by case_id), CensusVersion (list by case_id), QuoteScenario (list by case_id), Document (list by case_id), ActivityLog (create)
**Sub-component entities:** see CaseCensusTab, CaseQuotesTab, CaseTasksTab, DocumentsTab, ActivityTab
**Functions:** None directly (sub-tabs invoke functions)
**Auth:** user.email used for ActivityLog attribution
**Upstream:** BenefitCase record must exist for route to resolve
**Downstream:** Opens modals (Edit, Close, Advance); navigates to /cases

## PG_CENSUS (/census)
**Entities:** BenefitCase (list), CensusVersion (list, create), CensusMember (list by version)
**Functions:** processGradientAI (via GradientAIAnalysisPanel)
**Integrations:** GradientAI (external API via processGradientAI function)
**Upstream:** Case must exist and be selected; census file must be uploaded to have versions
**Downstream:** Census status feeds case stage advancement validation

## PG_QUOTES (/quotes)
**Entities:** QuoteScenario (list, create, update, delete), BenefitCase (list for case map), BenefitPlan (via modal, for plan selection), ScenarioPlan (via modal)
**Functions:** calculateQuoteRates (via Quotes page and ScenarioCard)
**Upstream:** Cases must exist to link scenarios; Plans must be in library for plan selection
**Downstream:** ScenarioCard → Create Proposal → navigates to /proposals

## PG_PROPOSALS (/proposals)
**Entities:** Proposal (list, create, update, delete)
**Functions:** sendProposalEmail, exportProposalPDF
**Integrations:** Email service (via sendProposalEmail), PDF generation (via exportProposalPDF/jsPDF)
**Upstream:** Cases and quote scenarios should exist for meaningful proposals
**Downstream:** Employer Portal receives proposal; case stage updated on approval

## PG_ENROLLMENT (/enrollment)
**Entities:** EnrollmentWindow (list, create, update), EmployeeEnrollment (list by window), BenefitPlan (for plan selection)
**Functions:** sendEnrollmentInvite
**Integrations:** Email service (invitation delivery)
**Upstream:** Case must be in "approved_for_enrollment" stage; census must have employee emails; plans must be in library
**Downstream:** EmployeeEnrollment records created; DocuSign flow triggered after completion

## PG_RENEWALS (/renewals)
**Entities:** RenewalCycle (list, create, update, delete), CensusMember (list — for risk forecast panel)
**Functions:** None directly
**Upstream:** Active cases with renewal dates feed renewal pipeline
**Downstream:** Renewal decision feeds case stage update

## PG_TASKS (/tasks)
**Entities:** CaseTask (list, create, update, delete)
**Upstream:** Cases should exist for meaningful task linkage (case_id FK)
**Note:** Tasks can exist without a case (case_id optional)

## PG_EMPLOYERS (/employers)
**Entities:** EmployerGroup (list, create, update, delete), Agency (list for agency_id)
**Upstream:** Agency record should exist
**Downstream:** EmployerGroup.id referenced by BenefitCase.employer_group_id

## PG_PLAN_LIBRARY (/plans)
**Entities:** BenefitPlan (list, create, update, delete), PlanRateTable (create, update per plan)
**Functions:** None directly
**Integrations:** ExtractDataFromUploadedFile (for bulk import), UploadFile (for import file upload)
**Upstream:** Carriers should be standardized for effective filtering
**Downstream:** Plans referenced by QuoteScenario, ScenarioPlan, EnrollmentWindow

## PG_EXCEPTIONS (/exceptions)
**Entities:** ExceptionItem (list, create, update, delete)
**Upstream:** Cases, census, or manual triggers create exceptions
**Downstream:** Exceptions resolved/dismissed feed compliance audit

## PG_CONTRIBUTIONS (/contributions)
**Entities:** ContributionModel (list, create, update, delete), QuoteScenario (referenced)
**Functions:** None directly (ACA calculation client-side)
**Upstream:** Scenarios must exist for meaningful contribution modeling

## PG_POLICYMATCH (/policymatch)
**Entities:** CensusVersion (select for analysis), BenefitPlan (for matching), PolicyMatchResult (create, list)
**Functions:** matchPoliciesWithGradient, policyMatchAI
**Integrations:** GradientAI, InvokeLLM (AI plan matching)
**Upstream:** Census must be uploaded; plans must be in library

## PG_SETTINGS (/settings)
**Entities:** Agency (read, update), User (list — admin only)
**Auth:** user.role === "admin" for Team, Integrations, Billing, Audit, Feature Toggles tabs
**Functions:** None directly
**Integrations:** DocuSign (configuration), GradientAI (API key), email service

## PG_EMPLOYER_PORTAL (/employer-portal)
**Entities:** Proposal (read, update), BenefitCase (read, update), Document (list), EmployeeEnrollment (list for stats)
**Auth:** Employer email match (portal uses employer-scoped access via query params or session)
**⚠ Risk:** No dedicated employer authentication route — relies on URL token or login session
**Upstream:** Proposal must be sent; case must be in employer_review stage

## PG_EMPLOYEE_PORTAL (/employee-portal)
**Entities:** EmployeeEnrollment (read, update), EnrollmentWindow (read), BenefitPlan (list for selection)
**Auth:** Access token from EmployeeEnrollment.access_token (token-based, no password)
**⚠ Risk:** Token validation logic must be implemented server-side; no middleware visible in frontend

## PG_EMPLOYEE_ENROLLMENT (/employee-enrollment)
**Entities:** EmployeeEnrollment (update), BenefitPlan (list), EnrollmentWindow (read)
**Functions:** sendDocuSignEnvelope, getDocuSignSigningURL
**Integrations:** DocuSign (envelope creation, signing URL, webhook via docuSignWebhook function)
**Upstream:** EmployeeEnrollment record must exist (access_token); EnrollmentWindow must be open

## PG_EMPLOYEE_BENEFITS (/employee-benefits)
**Entities:** EmployeeEnrollment (read — completed), BenefitPlan (read — selected plan)
**Upstream:** Enrollment must be completed

## ALL HELP ADMIN PAGES
**Entities:** HelpContent, HelpManualTopic, HelpTarget, HelpAIQuestionLog, HelpSearchLog, HelpCoverageSnapshot, HelpAuditLog, HelpAITrainingQueue, HelpModule, HelpPage, HelpSection
**Functions:** saveHelpContent, generateHelpForTarget, helpAIAnswer, generateCoverageSnapshot, all seed functions
**Integrations:** InvokeLLM (AI content generation, HelpAI answers)
**Auth:** user.role === "admin" for all help admin pages
`
      },

      {
        topic_code: "INV_MISSING_DEPENDENCY_REPORT",
        topic_title: "Missing Dependency Report",
        topic_type: "troubleshooting", module_code: null, sort_order: 15,
        topic_summary: "All identified missing dependencies, broken wiring, partial implementations, and gaps that need resolution.",
        search_keywords: "missing dependencies, broken pages, incomplete features, gaps, missing wiring, partial implementation, bugs, missing routes, production hardening",
        topic_body: `# Missing Dependency Report

## CRITICAL — Data & Auth Gaps

### 1. Employee Portal — Token Authentication Not Server-Enforced
**Page:** /employee-portal, /employee-enrollment
**Issue:** EmployeeEnrollment.access_token is stored in the entity, but the frontend does not validate it server-side before rendering enrollment data. The Employee Portal page exists at a shared route accessible to any logged-in user.
**Risk:** Any authenticated user can navigate to /employee-portal and potentially access enrollment data.
**Fix:** Validate access_token in a backend function. Employee Portal should be a separate public-facing app OR enforce token validation via query param + backend middleware.
**Severity:** HIGH

### 2. Employer Portal — No Dedicated Authentication
**Page:** /employer-portal
**Issue:** The Employer Portal is listed in the main sidebar under "Portals" — accessible to any logged-in user. There is no employer-specific authentication protecting the portal content.
**Risk:** Any broker/admin can view all employer portal data without restriction.
**Fix:** Employer portal should validate employer identity (email match via query param token, or separate route outside main auth).
**Severity:** HIGH

### 3. New Case — Agency ID Fallback
**Page:** /cases/new
**Issue:** CaseNew uses the first agency id with "default" fallback. If no Agency record exists, a placeholder string is stored. If BenefitCase has a FK constraint on agency_id, this will break.
**Fix:** Ensure at least one Agency record exists (seed data), or remove agency_id from the required create payload.
**Severity:** MEDIUM

---

## MEDIUM — Incomplete or Partial Pages

### 4. Integration Infrastructure Page — UI Only
**Page:** /integration-infra
**Issue:** This page is a fully built UI with panels for API Keys, Webhooks, Rate Limiting, OAuth/SSO, etc. However, all data is static/simulated — no real API calls, no real secret management, no live connection status.
**Fix:** Wire to real integration configurations (Stripe, DocuSign keys status, etc.) or clearly mark as "roadmap" in the UI.
**Severity:** MEDIUM

### 5. Employee Portal Login — Stub Page
**Page:** /employee-portal-login
**Issue:** Route exists in App.jsx, component is imported, but this appears to be a minimal stub for token-based access. No actual login form for employer email + access code visible in routing.
**Fix:** Complete the login flow or remove the route if access is entirely token-based from email link.
**Severity:** MEDIUM

### 6. Proposals — Send Proposal Function
**Page:** /proposals → ProposalCard / ProposalViewModal
**Issue:** sendProposalEmail function is invoked from proposal modals, but no error handling is visible in the modal send flow — silently fails if email service is not configured.
**Fix:** Add visible error state and email delivery confirmation to the send proposal UI.
**Severity:** MEDIUM

---

## LOW — Wiring and Navigation Gaps

### 7. Help Admin Sub-Pages Not in Sidebar
**Pages:** /help-dashboard, /help-coverage, /help-analytics, /help-manual-manager, /help-target-registry
**Issue:** These pages are only reachable via links inside /help-admin — no sidebar entry. Admins who don't know to go to /help-admin first cannot discover these pages.
**Fix:** Add help admin sub-navigation or a collapsible sidebar group.
**Severity:** LOW

### 8. Contribution Modeling — No Case Linkage
**Page:** /contributions
**Issue:** ContributionModel entity has no visible FK to BenefitCase or QuoteScenario in the page queries. Contribution models appear to be standalone, not linked to cases.
**Fix:** Add case_id or scenario_id to ContributionModel or document that contribution models are global templates.
**Severity:** LOW

### 9. Tasks — No Deep-Link from Cases
**Page:** /tasks
**Issue:** CaseTasksTab inside Case Detail shows case-linked tasks, but Tasks page (/tasks) loads all tasks without pre-filtering by case. No URL param to pre-filter by case.
**Fix:** Support ?case_id= query param in /tasks to pre-filter when navigating from a case.
**Severity:** LOW

### 10. Census — No Navigation from Case Detail to Full Census Page
**Page:** CaseCensusTab inside /cases/:id
**Issue:** The Census tab in Case Detail shows a summary but has no "View Full Census" link to /census?case_id={id}. Users must navigate to Census separately and re-select the case.
**Fix:** Add a "View in Census Module →" link that deep-links to /census with the case pre-selected.
**Severity:** LOW

### 11. Quotes — No Route to Individual Scenario Detail
**Issue:** All scenario interactions are in-page (modal-based). There is no dedicated /quotes/:id route for a specific scenario. Deep-linking to a scenario is not possible.
**Fix:** Add /quotes/:id route for scenario deep-linking, email sharing, or audit trail.
**Severity:** LOW

### 12. Renewals — No Link from Active Case to Renewal
**Issue:** An active case with renewal_pending stage has no direct navigation to the linked RenewalCycle. The relationship is by employer name (string), not by case_id FK.
**Fix:** Add case_id FK to RenewalCycle and link from Case Detail → "View Renewal →".
**Severity:** LOW

### 13. DocuSign Webhook — Single Function for All Envelopes
**Function:** docuSignWebhook
**Issue:** One webhook handler processes all DocuSign envelope events. If DocuSign sends events for multiple active envelopes concurrently, events might be misrouted if envelope_id lookup is ambiguous.
**Fix:** Verify envelope_id-based routing in docuSignWebhook is deterministic.
**Severity:** LOW

---

## ORPHANED COMPONENTS (Built but Potentially Underused)

### 14. PolicyMatchBulkActions, PolicyMatchFilterPresets
Components exist in /components/policymatch/ but their integration into the page may be partial. Verify they are actually rendered and functional.

### 15. ProposalFilterPresets
Imported and rendered in ProposalBuilder but onSelectPreset is passed as () => {} — no actual filter logic wired.
**Fix:** Wire preset selections to update filter state.

### 16. IntegrationInfrastructure sub-panels
12+ sub-panel components (ApiKeysPanel, AuthGuidePanel, PayloadValidatorPanel, etc.) are fully coded but serve as documentation/UI showcase only. Mark them clearly in the UI.
`
      },

      {
        topic_code: "INV_ORPHAN_DUPLICATE_REPORT",
        topic_title: "Orphaned & Duplicate Page/Component Report",
        topic_type: "reference", module_code: null, sort_order: 16,
        topic_summary: "Components that appear orphaned, routes that overlap, and duplicate functionality across pages.",
        search_keywords: "orphaned components, duplicate pages, overlapping functionality, redundant pages, unused components",
        topic_body: `# Orphaned & Duplicate Page/Component Report

## Potential Duplicate Functionality

### 1. HelpManualManager (/help-manual-manager) vs HelpAdmin Manual Topics Tab
**Issue:** HelpManualManager is a standalone page AND HelpAdmin now has a "Manual Topics" tab (ManualTopicsTab) which provides the same CRUD functionality with additional filters.
**Recommendation:** Keep HelpAdmin as the primary management surface. Redirect /help-manual-manager to /help-admin?tab=manual or remove it from the router.
**Status:** Duplicate — consolidate

### 2. ProposalBuilder page name vs actual functionality
**Issue:** Route is /proposals but the page is called "Proposal Builder" — the builder (modal) is actually ProposalModal. The page is a list/management view, not a builder.
**Recommendation:** Rename page title to "Proposals" for clarity. Builder is the modal, not the page.
**Status:** Minor naming inconsistency

### 3. Employee Portal (/employee-portal) vs Employee Enrollment (/employee-enrollment)
**Issue:** Two separate employee-facing pages with distinct purposes (portal = dashboard, enrollment = wizard). These are correctly separate. However, the navigation flow between them is not clearly defined — how does an employee get from /employee-portal to /employee-enrollment?
**Recommendation:** Ensure the Employee Portal has a clear CTA to begin enrollment.
**Status:** Separate pages, navigation flow gap

---

## Potentially Orphaned Routes

### 4. /employee-portal-login
**Issue:** No clear entry point for this page in the sidebar or portal flow. It appears to be a login stub for token-based access. If employee access is purely token-link based (email → direct URL with token), this page may never be used.
**Recommendation:** Either complete the login flow or remove the route and rely on deep-link tokens only.

### 5. /integration-infra
**Issue:** Listed in sidebar under "Tools & Reference" but is entirely a documentation/showcase page with no live functionality. Admins may be confused by the professional-looking UI that doesn't actually do anything.
**Recommendation:** Mark clearly as "Reference Documentation" or "Roadmap" in the UI, or move behind admin-only access.

---

## Components with Incomplete Wiring

| Component | Location | Issue |
|---|---|---|
| ProposalFilterPresets | pages/ProposalBuilder | onSelectPreset = () => {} — no logic |
| UserManualGenerator | components/help/ | Exists, may not be surfaced in current Help Center |
| UserManualLibrary | components/help/ | Exists, possibly superseded by HelpManualManager |
| UserManualManager | components/help/ | Possibly superseded by HelpAdmin Manual Topics tab |
| UserManualViewer | components/help/ | May overlap with HelpManualTopicDetail |
| UserManualSearch | components/help/ | May overlap with HelpCenter search |
| HelpCenterWidget | components/help/ | Small widget — verify it's rendered somewhere |

---

## Navigation Sidebar Gaps
The following pages exist and are fully functional but have NO sidebar entry:
- /cases/new (entry point via /cases page)
- /cases/:id (entry point via /cases list)
- /help-dashboard, /help-coverage, /help-analytics, /help-manual-manager, /help-target-registry (entry via /help-admin)
- /employee-portal-login, /employee-enrollment, /employee-benefits (entry via token email or direct URL)

This is by design for most pages but should be documented for support/onboarding.
`
      },

      {
        topic_code: "INV_RECOMMENDED_FIXES",
        topic_title: "Recommended Cleanup & Fix List",
        topic_type: "reference", module_code: null, sort_order: 17,
        topic_summary: "Prioritized list of recommended changes for production hardening, UX improvement, and technical debt reduction.",
        search_keywords: "fixes, recommended changes, production hardening, cleanup, improvements, technical debt, priorities",
        topic_body: `# Recommended Cleanup & Fix List

## Priority 1 — Security & Data Integrity (Do Before Production)

| # | Fix | Page | Effort |
|---|---|---|---|
| 1 | Implement server-side access token validation for Employee Portal | /employee-portal, /employee-enrollment | Medium |
| 2 | Add employer identity verification to Employer Portal | /employer-portal | Medium |
| 3 | Ensure at least one Agency seed record exists before case creation | /cases/new | Small |
| 4 | Add DocuSign webhook signature verification | functions/docuSignWebhook | Small |

## Priority 2 — Feature Completion

| # | Fix | Page | Effort |
|---|---|---|---|
| 5 | Wire ProposalFilterPresets onSelectPreset to actual filter state | /proposals | Small |
| 6 | Add error state + confirmation to Send Proposal flow | /proposals | Small |
| 7 | Complete employee portal login page OR remove the route | /employee-portal-login | Small |
| 8 | Mark Integration Infrastructure as "Reference/Roadmap" clearly | /integration-infra | Small |
| 9 | Add RenewalCycle.case_id FK and link from Case Detail to Renewal | /cases/:id, /renewals | Medium |

## Priority 3 — Navigation & Deep-Linking

| # | Fix | Page | Effort |
|---|---|---|---|
| 10 | Add "View in Census Module →" link from CaseCensusTab | /cases/:id | Small |
| 11 | Support ?case_id query param in /tasks for case-scoped task view | /tasks | Small |
| 12 | Add /quotes/:id route for scenario deep-linking | /quotes | Medium |
| 13 | Ensure Employee Portal has clear CTA to start enrollment wizard | /employee-portal | Small |

## Priority 4 — Consolidation & Cleanup

| # | Fix | Page | Effort |
|---|---|---|---|
| 14 | Consolidate UserManual* components (Generator, Library, Manager, Viewer, Search) — evaluate if any replace HelpAdmin functionality | components/help/ | Medium |
| 15 | Redirect /help-manual-manager to /help-admin?tab=manual or remove route from App.jsx | App.jsx | Small |
| 16 | Add help admin sub-nav or sidebar group for help admin pages | Sidebar | Small |
| 17 | Rename ProposalBuilder page title to "Proposals" for clarity | /proposals | Trivial |

## Priority 5 — Performance & Scale

| # | Fix | Page | Effort |
|---|---|---|---|
| 18 | Add server-side pagination to Cases list (currently loads 200 records) | /cases | Medium |
| 19 | Add server-side pagination to Quotes list (currently loads 200 records) | /quotes | Medium |
| 20 | Add server-side pagination to Proposals list (currently loads 200 records) | /proposals | Medium |
| 21 | CensusMember query in Renewals page fetches up to 10,000 records — scope by case_id | /renewals | Small |

## Summary Counts
| Category | Count |
|---|---|
| Critical (security/data) | 4 |
| Feature completion | 5 |
| Navigation/deep-linking | 4 |
| Consolidation/cleanup | 4 |
| Performance/scale | 4 |
| **Total recommended actions** | **21** |
`
      },
    ];

    let created = 0, updated = 0;
    const errors = [];
    for (const topicData of topics) {
      try {
        const existing = await db.entities.HelpManualTopic.filter({ topic_code: topicData.topic_code });
        if (existing && existing.length > 0) {
          await db.entities.HelpManualTopic.update(existing[0].id, { ...topicData, is_active: true, is_published: true, published_at: new Date().toISOString(), last_updated_by: user.email });
          updated++;
        } else {
          await db.entities.HelpManualTopic.create({ ...topicData, is_active: true, is_published: true, published_at: new Date().toISOString(), last_updated_by: user.email });
          created++;
        }
      } catch (e) { errors.push({ topic_code: topicData.topic_code, error: e.message }); }
    }

    return Response.json({ success: true, seed: "page_inventory", created, updated, total: topics.length, errors });
  } catch (error) {
    console.error('[function' + '] error:', error.message, error.stack);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});