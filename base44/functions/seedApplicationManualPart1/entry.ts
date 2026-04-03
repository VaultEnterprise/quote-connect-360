/**
 * seedApplicationManualPart1
 * Seeds Chapters 1–10 of the ConnectQuote 360 Application Operations Manual.
 * Admin only. Safe to re-run (upserts by topic_code).
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

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
        topic_code: "CH1_APP_OVERVIEW",
        topic_title: "Chapter 1 — ConnectQuote 360: Application Overview",
        topic_type: "module_guide", module_code: null, sort_order: 100,
        topic_summary: "Complete overview of ConnectQuote 360 — its purpose, user roles, navigation model, and core concepts.",
        search_keywords: "overview, application purpose, what is connectquote, platform introduction, system overview, benefits admin, user types, roles, navigation, how it works",
        topic_body: `# Chapter 1 — ConnectQuote 360: Application Overview

## 1.1 Document Information
| Field | Value |
|---|---|
| Product | ConnectQuote 360 |
| Document Type | Application Operations Manual |
| Audience | End Users, Administrators, Managers, Trainers, Support |
| Version | 1.0 |

## 1.2 Application Purpose
**ConnectQuote 360** is an enterprise-grade benefits administration platform for insurance agencies, brokers, and benefits consultants. It manages the complete lifecycle of employer group benefit cases — from initial prospect and census collection through quoting, proposal, enrollment, and ongoing renewals.

The platform unifies: case management, census processing, quote modeling, proposal generation, employee enrollment, renewal management, plan library, analytics, and AI assistance (PolicyMatchAI, GradientAI, HelpAI).

## 1.3 User Types and Roles
| Role | Description | Primary Access |
|---|---|---|
| **Admin** | Platform administrator | All modules, settings, team management, audit logs |
| **User (Broker/Rep)** | Assigned broker or account manager | Cases, Census, Quotes, Proposals, Enrollment, Renewals, Plans |
| **Employer** | Employer group contact | Employer Portal only |
| **Employee** | Employee enrollee | Employee Portal only |

## 1.4 Navigation Model
Left sidebar navigation:
1. Dashboard — Operational command center
2. Cases — Employer group case pipeline
3. Census — Employee data collection
4. Quotes — Quote scenario modeling
5. Proposals — Proposal generation and delivery
6. Enrollment — Enrollment window management
7. Renewals — Annual renewal tracking
8. Tasks — Cross-module task management
9. Employers — Employer group records
10. Plans — Benefit plan library
11. PolicyMatchAI — AI-driven plan matching
12. Exceptions — Exception and compliance queue
13. Contributions — Contribution strategy modeling
14. Settings — Platform configuration

## 1.5 Core Concepts
**Benefit Case** — Central organizing unit. Every employer engagement is a case with stage, census, quotes, proposals, and enrollment windows.
**Census** — Collection of employee demographic and eligibility data. Drives quoting and enrollment.
**Quote Scenario** — Configured set of benefit plans and contribution strategies.
**Proposal** — Formal document presenting quote scenarios to employer for approval.
**Enrollment Window** — Period during which employees elect benefits via the Employee Portal.
**Renewal Cycle** — Annual plan renewal process for active employer groups.

## 1.6 The Help System
Three layers:
1. **Contextual Help Icons (?)** — Beside fields/buttons. Click for detailed explanation.
2. **Help Center (/help)** — Full documentation organized by module and topic.
3. **HelpAI Assistant** — Floating AI chat (bottom-right). Natural language questions answered from approved docs.

## 1.7 How HelpAI Works
HelpAI uses a governed retrieval model — searches approved content in priority order: contextual help → page guides → workflow guides → module guides → FAQ → glossary. It will not invent behavior not documented.`
      },
      {
        topic_code: "CH2_MODULES_OVERVIEW",
        topic_title: "Chapter 2 — Module Overview",
        topic_type: "module_guide", module_code: null, sort_order: 200,
        topic_summary: "Summary of all modules — their business purpose, primary users, and key functions.",
        search_keywords: "modules list, all modules, system modules, module overview, what modules exist, navigation modules, platform modules",
        topic_body: `# Chapter 2 — Module Overview

## 2.1 Dashboard
Central operations hub. Real-time KPIs, case pipeline, pending tasks, enrollment countdowns, alerts. Used by all roles.

## 2.2 Cases
Manage full benefit case lifecycle from prospect to active client. Primary users: Brokers, Account Managers. Key functions: create cases, advance stages, attach census/quotes/documents.

## 2.3 Census
Collect, upload, validate, and analyze employee demographic data. Primary users: Brokers, Operations. Key functions: CSV upload, validation engine, duplicate detection, GradientAI risk analysis, version history.

## 2.4 Quotes
Build and compare benefit quote scenarios. Primary users: Brokers, Quote Analysts. Key functions: scenario creation, plan selection, contribution modeling, scenario comparison, proposal generation.

## 2.5 Proposals
Generate, send, and track formal benefit proposals. Primary users: Brokers, Account Managers. Key functions: proposal builder, PDF export, email delivery, employer review portal, version history.

## 2.6 Enrollment
Manage enrollment windows and track employee participation. Primary users: Brokers, HR Admins. Key functions: window creation, invitation delivery, participation tracking, DocuSign integration.

## 2.7 Renewals
Track and manage annual plan renewal cycles. Primary users: Account Managers. Key functions: renewal pipeline, rate change tracking, disruption scoring, calendar view.

## 2.8 Tasks
Cross-module task management. Primary users: All staff. Key functions: create/assign tasks, set due dates, link to cases.

## 2.9 Employers
Manage employer group master records. Primary users: All roles. Key functions: employer profiles, contact records, case linkage.

## 2.10 Plan Library
Benefit plan catalog with rates and comparison tools. Primary users: Brokers, Analysts, Admins. Key functions: plan cards, rate tables, comparison tool, bulk import.

## 2.11 PolicyMatchAI
AI plan recommendation engine. Primary users: Brokers, Analysts. Key functions: risk scoring, value scoring, plan recommendations, comparison matrix.

## 2.12 Contribution Modeling
Employer contribution strategy design with ACA analysis. Primary users: Brokers, Finance Analysts. Key functions: strategy types, contribution modeling, ACA affordability flag.

## 2.13 Exceptions
Compliance and operational exception management. Primary users: Operations, Compliance, Admins. Key functions: exception queue, severity classification, triage, comment threads, automation rules.

## 2.14 Settings
Platform-wide configuration, team management, integrations. Primary users: Admins. Key functions: org profile, user invitations, API integrations, feature toggles, branding, billing, audit logs.`
      },
      {
        topic_code: "CH3_CASES_MODULE",
        topic_title: "Chapter 3 — Cases Module: Complete Guide",
        topic_type: "module_guide", module_code: "CASES", sort_order: 300,
        topic_summary: "Complete guide to the Cases module — case creation, lifecycle stages, case detail page, tabs, actions, and workflow.",
        search_keywords: "cases, benefit case, case management, case lifecycle, stages, create case, case detail, advance stage, case workflow, draft, census in progress, quoting, proposal ready, enrollment open, active, closed, case number, case type, case stage",
        topic_body: `# Chapter 3 — Cases Module

## 3.1 Module Purpose
The **Cases** module is the central workflow hub. Every employer group engagement is a Benefit Case — a structured record tracking all activities, stages, documents, census, quotes, and enrollments.

## 3.2 Cases List Page (/cases)
**Layout:** Header bar (title, New Case button, view toggle) | Filter bar (Stage, Priority, Assigned User, Case Type) | Case cards

**Stage Filter options:** All, Draft, Census In Progress, Census Validated, Ready for Quote, Quoting, Proposal Ready, Employer Review, Approved for Enrollment, Enrollment Open, Enrollment Complete, Install In Progress, Active, Renewal Pending, Renewed, Closed

**Case Card displays:** Case Number, Employer Name, Stage (color-coded), Priority, Assigned To, Last Activity, Employee Count, Case Type

## 3.3 Case Detail Page (/cases/:id)
**Layout:** Case Header (number, employer, stage badge, priority, assigned broker, action buttons) | Stage Progress Bar | Case Info Card | Tab Bar (Census | Quotes | Tasks | Documents | Activity)

### Advance Stage Button
Advances case to next stage. Confirmation modal appears before change.
| Current Stage | Prerequisite |
|---|---|
| Draft | Employer and case type confirmed |
| Census In Progress | Census uploaded |
| Census Validated | No critical validation errors |
| Quoting | At least one scenario created |
| Proposal Ready | At least one proposal in Draft |
| Employer Review | Proposal sent |
| Approved for Enrollment | Employer approval received |

> ⚠ Stage advancement is logged and may trigger downstream actions. Review prerequisites before advancing.

## 3.4 Case Lifecycle Workflow
Draft → Census In Progress → Census Validated → Ready for Quote → Quoting → Proposal Ready → Employer Review → Approved for Enrollment → Enrollment Open → Enrollment Complete → Install In Progress → Active → Renewal Pending → Renewed | Closed

## 3.5 Stage Meanings
| Stage | Business Meaning |
|---|---|
| Draft | Initial setup in progress |
| Census In Progress | Employee census being collected |
| Census Validated | Census approved, ready for rating |
| Ready for Quote | Awaiting quote scenarios |
| Quoting | Quote scenarios being built |
| Proposal Ready | Proposal being prepared |
| Employer Review | Proposal delivered to employer |
| Approved for Enrollment | Employer approved plan selection |
| Enrollment Open | Employees actively enrolling |
| Enrollment Complete | All elections received |
| Install In Progress | Carrier installation in progress |
| Active | Coverage is in effect |
| Renewal Pending | Renewal cycle initiated |
| Renewed | Renewal completed |
| Closed | Case closed or terminated |

## 3.6 Case Fields
| Field | Type | Description | Required |
|---|---|---|---|
| Case Number | Auto | System-generated reference ID | Auto |
| Case Type | Enum | New Business / Renewal / Mid-Year Change / Takeover | Yes |
| Employer Group | Lookup | Links to EmployerGroup record | Yes |
| Effective Date | Date | Plan effective date | Yes |
| Stage | Enum | Current lifecycle stage | Auto |
| Priority | Enum | Low / Normal / High / Urgent | Yes |
| Assigned To | Email | Broker/rep user email | Yes |
| Products Requested | Array | Product types (Medical, Dental, Vision, etc.) | No |
| Employee Count | Number | Headcount for this case | No |
| Target Close Date | Date | Internal target date | No |
| Notes | Text | Free-form internal notes | No |`
      },
      {
        topic_code: "CH4_CENSUS_MODULE",
        topic_title: "Chapter 4 — Census Module: Complete Guide",
        topic_type: "module_guide", module_code: "CENSUS", sort_order: 400,
        topic_summary: "Complete guide to census upload, validation, GradientAI risk analysis, member management, and version history.",
        search_keywords: "census, employee data, census upload, validation, census errors, member table, GradientAI, risk analysis, census version, duplicate detection, data quality, census fields, eligibility, date of birth, ZIP code, coverage tier",
        topic_body: `# Chapter 4 — Census Module

## 4.1 Purpose
Manages collection, validation, and analysis of employee demographic data. Accurate validated census is required for quoting and enrollment.

## 4.2 Census Page (/census)
**Layout:** Header (case selector, Upload Census button) | Validation Panel | Census Member Table | GradientAI Risk Analysis | Version History

## 4.3 Upload Census
1. Click Upload Census
2. Select CSV or Excel file
3. System maps columns to schema
4. Validation runs automatically
5. Results display immediately

**Required fields:** Employee Name, Date of Birth, Gender, Employment Status, Coverage Tier, ZIP Code, Hire Date
**Optional fields:** Salary, Department, Location, Dependent Information

## 4.4 Validation
Three categories: **Errors (Critical)** — block quoting | **Warnings** — review but don't block | **Informational** — observations

**Validation Statuses:** not_started | uploaded | validated | issues_found

**Common Errors:**
| Error | Cause | Resolution |
|---|---|---|
| Missing Date of Birth | Blank DOB field | Add DOB for all members |
| Invalid Coverage Tier | Unrecognized value | Use: Employee Only, Employee+Spouse, Employee+Children, Family |
| Duplicate Employee | Same name/DOB twice | Remove duplicate or verify |
| Age Out of Range | Under 18 or over 99 | Verify birthdate |
| Invalid ZIP Code | ZIP not recognized | Correct ZIP code |

## 4.5 Census Member Table
Grid of all census members. Columns: Name, DOB/Age, Gender, Coverage Tier, ZIP, Hire Date, Validation Status. Error rows highlighted red. Click row to open member detail drawer.

## 4.6 GradientAI Risk Analysis
Analyzes census population and produces:
- Aggregate Risk Score (Low / Moderate / High / Very High)
- Age Distribution Analysis
- Dependent Ratio
- Risk Insights
- Plan Recommendations

How to use: Upload and validate census → Navigate to GradientAI panel → Click Run Analysis → Review results

> Note: GradientAI results are advisory. Final decisions remain with the broker and employer.

## 4.7 Version History
Every census upload creates a new Census Version. Previous versions preserved for comparison and audit. Version comparison tool shows additions, removals, and changed fields.

## 4.8 Workflow Impact
| Census Status | Effect |
|---|---|
| not_started | Cannot advance past Census In Progress |
| uploaded | Cannot advance yet |
| validated | Can advance to Ready for Quote |
| issues_found | Blocks advancement |`
      },
      {
        topic_code: "CH5_QUOTES_MODULE",
        topic_title: "Chapter 5 — Quotes Module: Complete Guide",
        topic_type: "module_guide", module_code: "QUOTES", sort_order: 500,
        topic_summary: "Complete guide to quote scenario creation, plan selection, contribution modeling, scenario comparison, and proposal generation.",
        search_keywords: "quotes, quote scenario, quoting, benefit scenarios, plan selection, contribution strategy, cost modeling, monthly premium, scenario comparison, create proposal from quote, quote KPI, fixed amount, fixed percentage, reference plan",
        topic_body: `# Chapter 5 — Quotes Module

## 5.1 Purpose
Where brokers build, model, and compare benefit quote scenarios. Translates validated census into plan selections with cost projections that form the basis of proposals.

## 5.2 Quotes Page (/quotes)
**Layout:** KPI Bar | Scenario Cards | Scenario Comparison Panel | Header Actions (New Scenario, case selector)

## 5.3 KPI Cards
| KPI | Description |
|---|---|
| Total Monthly Premium | Sum of all employer+employee contributions |
| Average Employee Cost | Avg monthly cost per employee |
| Scenarios Count | Number of scenarios for this case |
| Plans in Scope | Total plans across all scenarios |

## 5.4 Scenario Card Fields
Scenario Name | Plan Count | Total Monthly Premium | Employee Share | Employer Share | Status (Draft/In Review/Final) | Products | Created Date

## 5.5 Creating a Quote Scenario
1. Click New Scenario
2. Name the scenario
3. Select case
4. Choose plans from Plan Library (filter by network type, carrier, metal tier, HSA eligibility)
5. Configure contribution strategy
6. Review cost modeling
7. Save scenario

## 5.6 Contribution Strategies
| Strategy | Description |
|---|---|
| Fixed Amount | Employer pays flat $ per employee/month |
| Fixed Percentage | Employer pays set % of premium |
| Reference Plan | Employer contribution based on reference plan premium |
| Composite Rate | Blended employer rate across all tiers |
| Voluntary | Employee pays 100% |

> ACA Note: System calculates ACA affordability compliance. ACA flag appears if contribution falls below safe harbor levels.

## 5.7 Cost Modeling Slider
Interactive tool to adjust contribution percentages in real time. Shows impact on total employer cost, per-employee cost, and ACA affordability status.

## 5.8 Scenario Comparison
Side-by-side comparison of multiple scenarios: premium differences, employee cost, benefit differences, network types.

## 5.9 Create Proposal From Scenario
Click Create Proposal to: generate a Proposal record linked to the case, pre-populate with scenario data, navigate to Proposal Builder.
> Prerequisite: Case must be in Quoting or later stage.`
      },
      {
        topic_code: "CH6_PROPOSALS_MODULE",
        topic_title: "Chapter 6 — Proposals Module: Complete Guide",
        topic_type: "module_guide", module_code: "PROPOSALS", sort_order: 600,
        topic_summary: "Complete guide to proposal creation, statuses, PDF export, email delivery, employer review, approval, and version history.",
        search_keywords: "proposals, proposal builder, send proposal, proposal status, draft proposal, sent proposal, approved proposal, rejected proposal, proposal PDF, proposal email, employer review, proposal version, proposal workflow",
        topic_body: `# Chapter 6 — Proposals Module

## 6.1 Purpose
Manages creation, delivery, and tracking of formal benefit proposals sent to employer groups.

## 6.2 Proposal Lifecycle
Draft → Sent → Employer Review → Approved
                              → Rejected → (Revise) → New Version → Sent

## 6.3 Proposal Statuses
| Status | Meaning |
|---|---|
| Draft | Being prepared. Not yet sent. |
| Sent | Delivered to employer. |
| Viewed | Employer has opened it. |
| Employer Review | Employer actively reviewing. |
| Approved | Employer approved. Case advances to enrollment. |
| Rejected | Employer rejected. Revision required. |
| Expired | Not acted upon within expiration window. |

## 6.4 Proposals Page (/proposals)
**Layout:** KPI Bar (counts by status) | Pipeline View (Kanban by status) | Proposal Cards | Filters (status, case, date range)

**Proposal Card Fields:** Proposal Name | Case | Employer | Status | Version | Sent Date | Expiry Date | Created By

## 6.5 Send Proposal Action
Sends proposal to employer via email. Simultaneously:
1. Sets status to "Sent"
2. Records sent timestamp
3. Sends notification email to employer
4. Logs action in audit trail
5. Advances case to "Employer Review" if applicable

**Prerequisites:** Proposal in Draft status | Valid employer contact email | Complete content

> ⚠ Once sent, cannot be unsent. Make changes by creating a new version.

## 6.6 PDF Export
Generates professionally formatted PDF including: agency/employer details, effective date, plan summaries, contribution breakdown, employee cost estimates, terms.

## 6.7 Proposal Versioning
Each revision after sending creates a new version. All versions preserved for audit.

## 6.8 Employer Review (via Employer Portal)
Employer logs in → reviews proposal → clicks Approve or Reject.
- Approval → case advances to "Approved for Enrollment"
- Rejection → notification sent to broker to revise

## 6.9 Send Reminder
Sends follow-up email for proposals in Sent or Employer Review with no response. Prerequisite: 24 hours since last reminder.`
      },
      {
        topic_code: "CH7_ENROLLMENT_MODULE",
        topic_title: "Chapter 7 — Enrollment Module: Complete Guide",
        topic_type: "module_guide", module_code: "ENROLLMENT", sort_order: 700,
        topic_summary: "Complete guide to enrollment windows, employee invitations, participation tracking, member elections, DocuSign, and enrollment completion.",
        search_keywords: "enrollment, enrollment window, open enrollment, employee enrollment, enrollment invitation, participation rate, enrollment member table, DocuSign, enrollment complete, coverage election, benefit election, enrollment status, waiver",
        topic_body: `# Chapter 7 — Enrollment Module

## 7.1 Purpose
Manages online open enrollment. Controls enrollment windows, tracks participation, and manages DocuSign signature workflow.

## 7.2 Enrollment Page (/enrollment)
**Layout:** KPI Bar (active windows, total enrolled, participation rate, pending signatures) | Enrollment Window Cards | Member Table | Filters

## 7.3 Enrollment Window Fields
| Field | Description |
|---|---|
| Window Name | Descriptive name (e.g., "2025 Open Enrollment") |
| Start Date | First date employees can elect |
| End Date | Last date employees can elect |
| Status | Planned / Open / In Progress / Closed / Completed |
| Linked Case | Benefit case this enrollment is for |
| Effective Date | Coverage effective date |
| Plans Available | Plans employees can select |

## 7.4 Employee Enrollment Invitation
1. Enrollment window activated
2. Unique access token generated per employee
3. Invitation emails sent with secure Employee Portal link
4. Employee completes election
5. Data flows back to Enrollment module

## 7.5 Participation Rate
(Completed Elections / Total Invited Employees) × 100
Most carriers require 75%+ participation.

## 7.6 Enrollment Member Table
Columns: Employee Name | Email | Status (invited/started/completed/waived) | Coverage Tier | Selected Plan | Dependents | DocuSign Status | Completed Date

## 7.7 DocuSign Statuses
not_sent | sent | delivered | completed | declined | voided

DocuSign Workflow: Employee completes selection → System generates form → DocuSign envelope sent → Employee signs → Document stored → Status updated via webhook

## 7.8 Coverage Tiers
| Tier | Covered |
|---|---|
| Employee Only | Employee only |
| Employee + Spouse | Employee + spouse/domestic partner |
| Employee + Children | Employee + dependent children |
| Family | Employee + spouse + children |

> ⚠ Tier cannot change after window closes without a qualifying life event.

## 7.9 Enrollment Completion
Complete when: all employees elected or waived | participation meets carrier threshold | DocuSign forms collected | case advanced to Enrollment Complete`
      },
      {
        topic_code: "CH8_RENEWALS_MODULE",
        topic_title: "Chapter 8 — Renewals Module: Complete Guide",
        topic_type: "module_guide", module_code: "RENEWALS", sort_order: 800,
        topic_summary: "Complete guide to renewal pipeline, disruption scoring, rate change tracking, renewal calendar, and workload management.",
        search_keywords: "renewals, renewal cycle, renewal pipeline, disruption score, rate change, renewal calendar, annual renewal, plan renewal, renewal status, renewal workload, renewal risk forecast",
        topic_body: `# Chapter 8 — Renewals Module

## 8.1 Purpose
Manages annual plan renewal process. When a group's benefit year approaches expiration, a renewal cycle tracks re-quoting, re-proposal, and re-enrollment.

## 8.2 Renewals Page (/renewals)
**Layout:** KPI Bar | Pipeline View (Kanban) | Calendar View | Workload Bar | Renewal Cards

## 8.3 Renewal Card Fields
Employer Name | Renewal Date | Days Until Renewal | Rate Change % | Disruption Score | Renewal Stage | Account Manager | Products

## 8.4 Disruption Score (0–100)
AI-calculated metric estimating how disruptive the renewal will be.
Factors: rate change magnitude, network changes, plan discontinuations, population changes, historical election patterns.
| Score | Risk Level |
|---|---|
| 0–25 | Low |
| 26–50 | Moderate |
| 51–75 | High |
| 76–100 | Very High |

## 8.5 Rate Change %
Carrier's proposed rate change for the renewal period. Positive = increase. Rate changes above 10% typically require enhanced employer communication.

## 8.6 Renewal Pipeline Stages
Upcoming → In Review → Requoting → Proposal Ready → Employer Review → Approved → Enrollment Open → Complete

## 8.7 Renewal Calendar View
Monthly calendar of renewal due dates. Green (60+ days) | Yellow (30–60 days) | Red (<30 days, urgent)

## 8.8 Risk Forecast
AI-powered identification of groups at risk of non-renewal based on rate change, disruption score, historical retention, and industry benchmarks.`
      },
      {
        topic_code: "CH9_PLANS_MODULE",
        topic_title: "Chapter 9 — Plan Library: Complete Guide",
        topic_type: "module_guide", module_code: "PLANS", sort_order: 900,
        topic_summary: "Complete guide to the Plan Library — plan cards, fields, rate tables, comparison tool, HSA eligibility, and bulk import.",
        search_keywords: "plans, plan library, benefit plans, plan catalog, deductible, out of pocket maximum, OOP max, network type, HMO, PPO, HDHP, HSA eligible, plan comparison, rate table, plan import, plan card, metal tier, coinsurance, copay",
        topic_body: `# Chapter 9 — Plan Library

## 9.1 Purpose
Centralized catalog of all benefit plans. Every plan must be in the library with accurate rate information before it can be selected in quote scenarios.

## 9.2 Plan Library Page (/plans)
**Layout:** Header (search, filters, Add Plan, Bulk Import) | Plan Cards (grid) | Plan Comparison Tool | Analytics Panel

## 9.3 Plan Card Fields
| Field | Description |
|---|---|
| Plan Name | Full plan name (e.g., "Anthem Blue Cross PPO 1500") |
| Carrier | Insurance carrier |
| Plan Type | Medical / Dental / Vision / Life / STD / LTD |
| Network Type | HMO / PPO / HDHP / EPO / POS |
| Metal Tier | Bronze / Silver / Gold / Platinum |
| Deductible | Annual individual/family deductible |
| Out-of-Pocket Maximum | Maximum annual out-of-pocket cost |
| Coinsurance | % employee pays after deductible |
| Copay (Office Visit) | Fixed copay for primary care |
| Copay (Specialist) | Fixed copay for specialists |
| HSA Eligible | Qualifies for HSA contributions |
| HRA Eligible | Qualifies for HRA |
| Status | Active / Inactive / Archived |

## 9.4 Network Types
| Type | Description |
|---|---|
| HMO | PCP referrals required. Lower premiums. No out-of-network except emergencies. |
| PPO | Flexible. See any provider. Out-of-network covered at higher cost. |
| HDHP | Lower premiums, higher deductibles. HSA-compatible. |
| EPO | Like HMO without referral requirement. No out-of-network. |
| POS | Hybrid HMO/PPO. PCP referral + some out-of-network. |

## 9.5 Deductible
Amount insured pays before insurance covers most services. Individual and family limits apply. HDHP minimums set by IRS ($1,600 individual / $3,200 family in 2024).

## 9.6 Out-of-Pocket Maximum
Most an insured pays per plan year before plan covers 100%. Includes deductible, copays, coinsurance. Does NOT include premiums. ACA plans have federally mandated OOP maximums.

## 9.7 HSA Eligible Flag
Plans must be an HDHP meeting IRS minimum deductible thresholds. Cannot have disqualifying coverage. Unlocks HSA contribution configuration in quote scenarios.

## 9.8 Rate Tables
Per-member-per-month premiums by coverage tier and age band. Must be maintained accurately — incorrect rates produce incorrect cost projections.

## 9.9 Plan Comparison Tool
Side-by-side comparison of 2–4 plans across all key benefit parameters.

## 9.10 Bulk Import
Import multiple plans from CSV/Excel template. Required: Plan Name, Carrier, Plan Type, Network Type, Deductible, OOP Max, Coinsurance.`
      },
      {
        topic_code: "CH10_POLICYMATCH",
        topic_title: "Chapter 10 — PolicyMatchAI: Complete Guide",
        topic_type: "module_guide", module_code: "POLICYMATCH", sort_order: 1000,
        topic_summary: "Complete guide to PolicyMatchAI — risk scoring, value scoring, risk tier classification, plan recommendations, and comparison matrix.",
        search_keywords: "PolicyMatchAI, policy match, AI plan matching, risk score, value score, risk tier, plan recommendations, AI recommendations, plan matching engine, recommendation engine, preferred, standard, rated, high risk",
        topic_body: `# Chapter 10 — PolicyMatchAI

## 10.1 Purpose
AI-powered plan recommendation engine that analyzes census population and matches it with optimal plans from the Plan Library using risk scoring and value analysis.

## 10.2 PolicyMatchAI Page (/policymatch)
**Layout:** Analysis Controls (census selector, run analysis, mode) | Results Panel (risk tier, scores, recommendations) | Comparison Matrix | Risk Breakdown | History Timeline

## 10.3 Risk Score (0–100)
Overall risk level of the census population.
Components: age distribution, gender mix, coverage tier distribution, geographic risk factors, historical claims.
| Score | Risk Level |
|---|---|
| 0–20 | Very Low |
| 21–40 | Low |
| 41–60 | Moderate |
| 61–80 | High |
| 81–100 | Very High |

## 10.4 Value Score
Measures how well available plans match the needs and cost profile of the population. Balances plan benefit richness vs. premium, network adequacy, and HSA compatibility. Higher = better alignment.

## 10.5 Risk Tier Badge
| Tier | Color | Description |
|---|---|---|
| Preferred | Green | Low risk, preferred carrier pricing |
| Standard | Blue | Average risk, standard market pricing |
| Rated | Yellow | Above-average risk, carrier may apply surcharges |
| High Risk | Red | Significant risk factors, limited plan availability |

## 10.6 Plan Recommendations
Ranked list sorted by: Value Score (highest first), network adequacy, cost competitiveness, HSA eligibility.
Each recommendation includes: plan name, carrier, why recommended, risk-adjusted premium estimate, expected employee cost.

## 10.7 Comparison Matrix
Grid comparing top 4–6 recommended plans across: premium tiers, deductible, OOP Max, copays, network type, value score, risk compatibility.`
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
    return Response.json({ success: true, part: 1, created, updated, total: topics.length, errors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});