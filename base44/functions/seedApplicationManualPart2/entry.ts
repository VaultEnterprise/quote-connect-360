/**
 * seedApplicationManualPart2
 * Seeds Chapters 11–20 + HelpAI Index guide of the ConnectQuote 360 Application Manual.
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
        topic_code: "CH11_EXCEPTIONS_MODULE",
        topic_title: "Chapter 11 — Exceptions Module: Complete Guide",
        topic_type: "module_guide", module_code: "EXCEPTIONS", sort_order: 1100,
        topic_summary: "Complete guide to the Exception Queue — severity levels, exception types, triage workflow, resolution process, and compliance tracking.",
        search_keywords: "exceptions, exception queue, compliance exceptions, exception severity, exception status, triage, resolve exception, exception workflow, compliance queue, exception management, critical exception, high exception",
        topic_body: `# Chapter 11 — Exceptions Module

## 11.1 Purpose
Manages operational and compliance exceptions arising during benefits administration. Generated automatically (census errors, ACA issues, missing docs) or manually by staff.

## 11.2 Exceptions Page (/exceptions)
**Layout:** KPI Bar (open, critical count, avg resolution time, by severity) | Workflow Board (Kanban by status) | Exception Cards | Filter Panel

## 11.3 Exception Severity
| Severity | Color | Description | Response |
|---|---|---|---|
| Critical | Red | Compliance/legal risk. Immediate action required. | Same day |
| High | Orange | Significant operational issue. | Within 24 hours |
| Medium | Yellow | Notable issue to be addressed. | Within 3 business days |
| Low | Blue | Minor or informational. | When convenient |

## 11.4 Exception Types
| Type | Description |
|---|---|
| Census Error | Critical errors in census data |
| ACA Compliance | ACA affordability or minimum value issue |
| Missing Document | Required document not on file |
| Enrollment Gap | Employee enrollment not completed |
| Rate Discrepancy | Rate mismatch between quote and carrier |
| Data Quality | Data integrity issue |
| Carrier Issue | Carrier-side problem requiring follow-up |
| Manual | Created manually by staff |

## 11.5 Exception Status Workflow
Open → In Review → Pending Resolution → Resolved
                 → Escalated → Resolved
Closed (administrative close)

## 11.6 Exception Triage
AI-suggested resolution steps based on exception type. Shows similar past exceptions and resolutions. Recommends actions and timelines.

## 11.7 Comment Thread
Each exception has a timestamped comment thread for team collaboration. Supports @mentions for user notification.

## 11.8 Automation Rules
Admins can configure: auto-assignment by exception type, auto-escalation for unresolved exceptions, notification emails on creation/escalation, auto-close after review period.`
      },
      {
        topic_code: "CH12_CONTRIBUTIONS_MODULE",
        topic_title: "Chapter 12 — Contribution Modeling: Complete Guide",
        topic_type: "module_guide", module_code: "CONTRIBUTIONS", sort_order: 1200,
        topic_summary: "Complete guide to contribution modeling strategies, ACA affordability analysis, and cost comparison panels.",
        search_keywords: "contribution modeling, employer contribution, contribution strategy, ACA affordability, ACA flag, fixed amount, fixed percentage, reference plan, composite rate, voluntary, contribution percentage, cost sharing, ALE, employer mandate",
        topic_body: `# Chapter 12 — Contribution Modeling

## 12.1 Purpose
Advanced tools for designing, analyzing, and comparing employer contribution strategies. Ensures ACA affordability compliance.

## 12.2 Contribution Modeling Page (/contributions)
**Layout:** KPI Bar (total employer cost, avg employee cost, ACA compliance status) | Contribution Model Cards | Comparison Panel | ACA Affordability Panel

## 12.3 Contribution Strategies
| Strategy | Description | Best For |
|---|---|---|
| Fixed Amount | Employer pays flat $ per employee | Budget certainty |
| Fixed Percentage | Employer pays set % of premium | Transparent sharing |
| Reference Plan | Employer contributes based on reference plan | Defined contribution |
| Composite Rate | Single blended rate across all tiers | Administrative simplicity |
| Voluntary | Employee pays 100% | Supplemental products |

## 12.4 ACA Affordability Flag
Appears on models that don't meet ACA standards.

**Minimum Value:** Plan must cover ≥60% of total allowed costs.
**Affordability (2024):** Employee's required contribution for self-only coverage must not exceed 8.39% of household income.

Safe harbor methods: W-2 wages, Rate of pay, Federal poverty line.

> ⚠ Employers with 50+ FTE (ALE status) face IRS penalties for non-compliance. Always verify ACA compliance for ALEs.

## 12.5 ACA Flag Status
| Flag | Meaning |
|---|---|
| ✅ ACA Compliant | Meets affordability and minimum value |
| ⚠ Review Required | Borderline — additional analysis recommended |
| ❌ Non-Compliant | Does not meet ACA standards |`
      },
      {
        topic_code: "CH13_DASHBOARD",
        topic_title: "Chapter 13 — Dashboard: Complete Guide",
        topic_type: "page_guide", module_code: "DASHBOARD", sort_order: 1300,
        topic_summary: "Complete guide to the Dashboard — KPI cards, pipeline view, quick actions, priorities, and how to interpret dashboard data.",
        search_keywords: "dashboard, KPI, active cases, open enrollments, upcoming renewals, pipeline, quick actions, today priorities, stalled cases, census gap alert, enrollment countdown, dashboard overview, command center",
        topic_body: `# Chapter 13 — Dashboard

## 13.1 Purpose
Operational command center. Provides real-time view of portfolio health, pending actions, upcoming deadlines, and critical alerts. Answers: *What needs my attention today?*

## 13.2 Dashboard Layout
1. KPI Bar — Key performance indicators
2. Case Pipeline — Visual pipeline across all stages
3. Quick Actions — One-click navigation to common tasks
4. Today's Priorities — AI-surfaced urgent items
5. Stalled Cases Alert — Cases with no recent activity
6. Census Gap Alert — Cases needing census uploads
7. Enrollment Countdowns — Active enrollment windows with deadlines

## 13.3 KPI Cards
**Active Cases:** All cases not in Draft, Closed, or Renewed status. Represents current active workload.
**Open Enrollments:** Enrollment windows currently in Open or In Progress status.
**Upcoming Renewals:** Renewal cycles due within the next 90 days.

## 13.4 Case Pipeline View
Horizontal pipeline showing case counts at each lifecycle stage. Click a stage to navigate to Cases list filtered to that stage. Identify bottlenecks, imbalanced workloads, and progress trends.

## 13.5 Quick Actions
| Action | Result |
|---|---|
| New Case | Opens case creation form |
| Upload Census | Opens census upload |
| Create Quote | Opens quote scenario creation |
| Send Proposal | Navigates to proposals ready to send |
| View Tasks | Navigates to task list |

## 13.6 Today's Priorities
AI-surfaced items: tasks due today or overdue, enrollment windows closing within 48 hours, cases in Employer Review with no activity for 5+ days, critical exceptions unresolved for 24+ hours.

## 13.7 Stalled Cases Alert
Cases with no activity for 7+ days (configurable). Highlighted for follow-up before they become at-risk.

## 13.8 Census Gap Alert
Cases in Census In Progress with no census uploaded. These block active workstreams.

## 13.9 Enrollment Countdowns
Active enrollment windows with days remaining countdown.
Green: 7+ days | Yellow: 3–6 days | Red: 1–2 days (urgent)`
      },
      {
        topic_code: "CH14_SETTINGS_ADMIN",
        topic_title: "Chapter 14 — Settings & Administration: Complete Guide",
        topic_type: "module_guide", module_code: "SETTINGS", sort_order: 1400,
        topic_summary: "Complete admin guide to Settings — organization config, team management, API integrations, feature toggles, branding, billing, audit logs, and help administration.",
        search_keywords: "settings, admin settings, organization settings, team management, API integrations, feature toggles, branding, billing, audit log, help admin, webhook, user invitation, role management, admin panel, DocuSign API, GradientAI API",
        topic_body: `# Chapter 14 — Settings & Administration

## 14.1 Purpose
Platform-wide configuration, team management, integration setup, and system governance. Most panels restricted to Admin users.

## 14.2 Settings Page (/settings)
**Tabs:** Organization | Account | Team (Admin) | Integrations (Admin) | Branding (Admin) | Feature Toggles (Admin) | Billing (Admin) | Audit Logs (Admin) | Help

## 14.3 Organization Settings
| Field | Description |
|---|---|
| Agency Name | Legal agency name |
| Agency Code | Unique identifier code |
| Address / City / State / ZIP | Location |
| Phone | Main contact phone |
| Email | Primary contact email |
| Status | active / inactive / suspended |

> ⚠ Changing Agency Code affects system-wide identifiers. Contact support before changing.

## 14.4 Team Management (Admin only)
**Invite User:** Sends email invitation. Fields: Email, Role (admin or user).
| Capability | Admin | User |
|---|---|---|
| All module access | ✅ | ✅ |
| Settings — Team, Billing, Audit | ✅ | ❌ |
| Feature Toggles | ✅ | ❌ |
| Help Admin | ✅ | ❌ |

> ⚠ Only grant admin role to authorized personnel.

## 14.5 API Integrations (Admin only)
Manage connections to: DocuSign, GradientAI, Carrier Rating APIs, Email Service. Each has: API key management, connection test, usage stats, webhook configuration.

## 14.6 Feature Toggles (Admin only)
| Toggle | Description |
|---|---|
| GradientAI Risk Analysis | Enable/disable AI risk scoring |
| PolicyMatchAI | Enable/disable AI plan matching |
| DocuSign Integration | Enable/disable electronic signatures |
| Employee Portal | Enable/disable employee self-service |
| Employer Portal | Enable/disable employer review portal |
| HelpAI Assistant | Enable/disable floating HelpAI chat |

> ⚠ Disabling features affects all users immediately. Notify affected users before toggling.

## 14.7 Audit Logs (Admin only)
Full system audit trail: record created/updated/deleted, user, timestamp, before/after values. Read-only. Cannot be deleted.

## 14.8 Help Administration
Settings → Help tab provides access to: Help Center, Help Admin, Help Dashboard, Coverage Report, Manual Manager, Target Registry.`
      },
      {
        topic_code: "CH15_EMPLOYEE_PORTAL",
        topic_title: "Chapter 15 — Employee Portal: Complete Guide",
        topic_type: "page_guide", module_code: "PORTALS", sort_order: 1500,
        topic_summary: "Complete guide to the Employee Portal — plan selection, coverage tier, dependents, waiver, DocuSign, and benefit confirmation.",
        search_keywords: "employee portal, employee enrollment, plan selection, coverage tier, dependents, waive coverage, DocuSign signing, enrollment wizard, benefit confirmation, employee benefits, secure link, access token",
        topic_body: `# Chapter 15 — Employee Portal

## 15.1 Purpose
Self-service web interface for employees to make benefit elections. Accessible via secure link in enrollment invitation email. No username/password — token-based access.

## 15.2 Employee Access
1. Employee receives enrollment invitation email
2. Email contains unique secure link with access token
3. Employee clicks link → taken to enrollment wizard
4. Token valid only during enrollment window

> Security: Each link is unique and individual. Do not share enrollment links.

## 15.3 Enrollment Wizard Steps
**Step 1 — Welcome & Eligibility:** Review personal info, confirm eligibility, review window dates.
**Step 2 — Coverage Tier Selection:** Employee Only | Employee+Spouse | Employee+Children | Family
**Step 3 — Plan Selection:** View available plans, compare side-by-side, select preferred plan.
**Step 4 — Add Dependents:** Enter dependent name, DOB, relationship (for applicable tiers).
**Step 5 — Review & Confirm:** Summary of all elections, acknowledge, click Complete Enrollment.
**Step 6 — DocuSign Signature:** If enabled, enrollment form sent for electronic signature.

## 15.4 Waiving Coverage
Employees who don't wish to enroll select Waive Coverage and provide a reason. Waiver is recorded. Waived employees count toward participation rate denominator.

> ⚠ Employees who waive cannot enroll mid-year without a qualifying life event.

## 15.5 Employee Benefits Summary (/employee-benefits)
Post-enrollment read-only view: current elections, effective dates, monthly premiums, dependent info, digital ID card links, HR/broker contact information.`
      },
      {
        topic_code: "CH16_EMPLOYER_PORTAL",
        topic_title: "Chapter 16 — Employer Portal: Complete Guide",
        topic_type: "page_guide", module_code: "PORTALS", sort_order: 1600,
        topic_summary: "Complete guide to the Employer Portal — proposal review, approval, enrollment monitoring, and communication hub.",
        search_keywords: "employer portal, employer review, proposal approval, employer access, approve proposal, reject proposal, employer enrollment status, broker contact, employer communication, employer dashboard",
        topic_body: `# Chapter 16 — Employer Portal

## 16.1 Purpose
Secure interface for employer HR administrators and decision-makers to review proposals, monitor enrollment, access documents, and communicate with their broker.

## 16.2 Access
Via direct link from broker or email notification when proposal is sent. Authentication via registered employer email.

## 16.3 Layout
Case Lifecycle Status (visual timeline) | Action Required Banner | Proposal Review Panel | Enrollment Dashboard | Documents Center | Financial Modeling | Communication Hub

## 16.4 Proposal Review
Employers review: plan summaries, benefit comparisons, monthly cost breakdowns, employer vs. employee cost split, effective dates.

**Approve:** Sets status to Approved | Notifies broker | Advances case to Approved for Enrollment
**Reject:** Sets status to Rejected | Notifies broker with rejection notes | Broker must revise and resubmit

## 16.5 Enrollment Monitoring
Real-time: total invited, completed vs. pending, participation rate, coverage tier distribution, enrollment window deadline countdown.

## 16.6 Broker Contact Card
Broker name, phone, email, agency name — always accessible from within the portal.`
      },
      {
        topic_code: "CH17_WORKFLOWS",
        topic_title: "Chapter 17 — Workflow Reference Guide",
        topic_type: "workflow_guide", module_code: null, sort_order: 1700,
        topic_summary: "Reference guide for all major workflows: case lifecycle, census workflow, proposal delivery, enrollment, and renewal.",
        search_keywords: "workflows, case workflow, census workflow, proposal workflow, enrollment workflow, renewal workflow, workflow stages, workflow transitions, workflow steps, process flow, how cases progress, how enrollment works",
        topic_body: `# Chapter 17 — Workflow Reference Guide

## 17.1 Case Lifecycle Workflow
**Trigger:** Broker creates a new Benefit Case.
**Progression:** Draft → Census In Progress → Census Validated → Ready for Quote → Quoting → Proposal Ready → Employer Review → Approved for Enrollment → Enrollment Open → Enrollment Complete → Install In Progress → Active → Renewal Pending → Renewed / Closed

**Stage Ownership:**
| Stage | Responsible Role |
|---|---|
| Draft–Quoting | Broker/Account Manager |
| Proposal Ready–Employer Review | Broker/Account Manager + Employer |
| Enrollment Open–Complete | HR/Operations |
| Install–Active | Operations/Carrier Coordinator |
| Renewal Pending | Account Manager |

## 17.2 Census Validation Workflow
**Trigger:** Broker uploads census file.
1. File uploaded → column mapping → validation engine runs
2. Errors/warnings displayed
3. Broker resolves errors → re-upload or in-line edit
4. Validation passes → status = "validated"
5. Case advances to Ready for Quote

**Blocking Conditions:** Critical validation errors | Missing required fields (DOB, ZIP) | Unresolved duplicate members

## 17.3 Proposal Delivery Workflow
**Trigger:** Broker creates proposal from finalized scenario.
1. Proposal created (Draft) → broker prepares content → Send Proposal clicked
2. System sends email → status = Sent → Employer logs in to Employer Portal
3. Employer reviews → Approves (case advances) or Rejects (broker revises)
4. If revised → new version created → resubmitted

## 17.4 Enrollment Workflow
**Trigger:** Case advances to Approved for Enrollment.
1. Broker creates Enrollment Window with dates and plans
2. Employee access tokens generated → invitation emails sent
3. Employees access Employee Portal → complete elections
4. DocuSign forms sent for signature
5. Broker monitors participation daily
6. Window closes → completions reviewed → case advances to Enrollment Complete

## 17.5 Renewal Workflow
**Trigger:** Active case reaches within 90 days of renewal date.
1. Renewal Cycle created (Upcoming) → carrier provides renewal rates
2. Broker enters rate changes → builds renewal quote scenarios
3. Renewal proposal prepared and sent to employer
4. Employer reviews/approves/negotiates
5. Re-enrollment window opened if plan changes
6. Employees re-enroll or confirm continuation
7. Renewal cycle marked Complete → case stage = Renewed`
      },
      {
        topic_code: "CH18_TROUBLESHOOTING",
        topic_title: "Chapter 18 — Troubleshooting & FAQ",
        topic_type: "troubleshooting", module_code: null, sort_order: 1800,
        topic_summary: "Common issues, user confusion points, and frequently asked questions with step-by-step resolutions.",
        search_keywords: "troubleshooting, FAQ, common issues, errors, problems, help, how to, why is, fix, resolve, not working, issue, problem, questions, stage not advancing, census errors, proposal not sending, enrollment access, plan rates wrong",
        topic_body: `# Chapter 18 — Troubleshooting & FAQ

## Cases
**Q: I can't advance my case to the next stage.**
Check prerequisites: census validated? quote scenario exists? proposal sent? Employer approved? Review prerequisites in Chapter 3.

**Q: Case stuck in Employer Review for weeks.**
Use Send Reminder on the proposal. If employer email is wrong, update in Employer Group record and resend proposal.

**Q: Accidentally closed a case that should be active.**
Contact your administrator. Stage reversals require admin review. Provide case number and intended stage.

---

## Census
**Q: Census upload shows critical errors.**
Download error report from Validation Panel. Each error shows row number and field. Fix in source file and re-upload.

**Q: System says there are duplicate employees.**
Review employees with same name. If genuinely different (e.g., two John Smiths), verify DOBs differ. If duplicates, remove one row.

**Q: Census validated but GradientAI shows unexpected risk.**
Review the risk breakdown panel. GradientAI uses additional factors beyond standard validation.

---

## Proposals
**Q: Send Proposal button is greyed out.**
Verify: (1) Proposal is in Draft status. (2) Employer contact has valid email. (3) Proposal content is complete.

**Q: Employer says they didn't receive proposal email.**
Check employer contact email in Employer Group record. Use Send Reminder to resend. Ask employer to check spam folder.

**Q: Need to make changes to a sent proposal.**
You cannot edit a sent proposal. Create a New Version (will be in Draft). Edit and resend.

---

## Enrollment
**Q: Employee says they can't access the enrollment portal.**
Check: enrollment window is Open, employee email is correct in census, invitation was sent. If link expired, resend invitation from Enrollment Member Table.

**Q: Employee wants to change plan after enrollment window closed.**
Requires qualifying life event (QLE). Document QLE and coordinate with carrier. Cannot be done directly in the system.

**Q: DocuSign shows "Declined to Sign."**
Follow up with employee. If they wish to proceed, void the current envelope and resend from the Enrollment Member Table.

---

## Plan Library
**Q: Plan showing incorrect rates in quotes.**
Review the plan's Rate Table in Plan Library. Verify rates for all coverage tiers and effective date range.

**Q: Can't find a plan in the library.**
Check plan status — may be Inactive or Archived. Use status filter to show all. If plan doesn't exist, add via Add Plan or Bulk Import.

---

## General
**Q: HelpAI gave me an incorrect answer.**
Use thumbs-down feedback. This flags for admin review. Contact administrator for urgent needs.

**Q: Accidentally invited wrong user as Admin.**
Contact your Admin. Roles can be updated in Settings → Team Management.

**Q: Pages loading slowly.**
Refresh (Ctrl+R / Cmd+R). If persists, clear browser cache. If still slow, contact system administrator with page name and time.`
      },
      {
        topic_code: "CH19_GLOSSARY",
        topic_title: "Chapter 19 — Glossary of Terms",
        topic_type: "reference", module_code: null, sort_order: 1900,
        topic_summary: "Comprehensive glossary of all business terms, workflow terms, status terms, and technical labels used in ConnectQuote 360.",
        search_keywords: "glossary, definitions, terminology, terms, what does mean, abbreviations, acronyms, ACA, HMO, PPO, HDHP, HSA, OOP, deductible, coinsurance, copay, carrier, census, enrollment, proposal, renewal, EE, ER, QLE, ALE",
        topic_body: `# Chapter 19 — Glossary

**ACA (Affordable Care Act)** — Federal law setting health insurance requirements including minimum essential coverage, minimum value, and affordability standards.

**ALE (Applicable Large Employer)** — Employer with 50+ full-time equivalent employees. Subject to ACA employer shared responsibility provisions (employer mandate).

**Benefit Case** — Primary organizational unit in ConnectQuote 360. Represents one employer group's benefit engagement.

**Census** — Structured dataset listing benefit-eligible employees with demographic and eligibility information required for rating and enrollment.

**Carrier** — Insurance company that underwrites and administers benefit plans.

**Coinsurance** — Percentage of covered medical costs the insured pays after meeting their deductible (e.g., 80/20 = plan pays 80%, employee pays 20%).

**Composite Rate** — Single blended premium rate applied to all employees regardless of age or tier. Common in large group markets.

**Contribution Strategy** — Method by which employer determines how much of the premium cost it absorbs vs. passes to employees.

**Coverage Tier** — Category of coverage elected: Employee Only, Employee+Spouse, Employee+Children, or Family.

**Deductible** — Amount insured pays out-of-pocket each plan year before insurance coverage begins.

**Dependent** — Family member (spouse, domestic partner, or child) covered under an employee's benefit plan.

**Disruption Score** — ConnectQuote 360 AI metric (0–100) estimating how disruptive a renewal will be.

**DocuSign** — Electronic signature platform integrated for collecting employee enrollment signatures.

**Effective Date** — Date coverage begins under an insurance plan.

**Eligibility** — Criteria determining whether an employee or dependent qualifies for coverage.

**Enrollment Window** — Defined period during which employees may make benefit elections.

**EPO** — Exclusive Provider Organization. Network-only coverage without referral requirement.

**GradientAI** — ConnectQuote 360's AI census risk analysis engine.

**HDHP** — High Deductible Health Plan. Higher deductibles, lower premiums, HSA-compatible.

**HMO** — Health Maintenance Organization. Requires PCP referrals. Network-only coverage.

**HRA** — Health Reimbursement Arrangement. Employer-funded account reimbursing qualified medical expenses.

**HSA** — Health Savings Account. Tax-advantaged account for HDHP enrollees for qualified medical expenses.

**Metal Tier** — ACA plan classification by actuarial value: Bronze (60%), Silver (70%), Gold (80%), Platinum (90%).

**Minimum Value** — ACA requirement that plan covers ≥60% of total allowed benefit costs.

**Network** — Group of healthcare providers contracted with a carrier at negotiated rates.

**OOP Maximum (Out-of-Pocket Maximum)** — Most an insured pays for covered services in a plan year; after which insurance pays 100%.

**Participation Rate** — Percentage of eligible employees enrolled in a benefit plan. Most carriers require 75%+.

**Plan** — Specific insurance product with defined benefits, premiums, network, and eligibility rules.

**PolicyMatchAI** — ConnectQuote 360's AI plan recommendation engine.

**POS** — Point of Service. Hybrid HMO/PPO plan.

**PPO** — Preferred Provider Organization. Flexible plan allowing any provider; in-network preferred.

**Proposal** — Formal document presenting selected benefit plans and costs to employer for approval.

**QLE (Qualifying Life Event)** — Personal change allowing benefit changes outside open enrollment (marriage, birth, loss of coverage).

**Quote Scenario** — Configured set of benefit plans and contribution strategies for an employer group.

**Rate Table** — Schedule of per-member-per-month premiums by coverage tier and/or age band.

**Renewal** — Annual process of reviewing and continuing (or changing) benefit coverage for an employer group.

**Safe Harbor** — ACA affordability calculation method ensuring employer contribution meets minimum standards.

**Waiver** — Employee's election to decline benefit coverage.

**Statuses:** Draft = not yet submitted | Active = currently in use | Archived = preserved, not active | Closed = no longer active | Pending = awaiting action | Completed = all steps finished`
      },
      {
        topic_code: "CH20_TASKS_MODULE",
        topic_title: "Chapter 20 — Tasks Module: Complete Guide",
        topic_type: "module_guide", module_code: "TASKS", sort_order: 2000,
        topic_summary: "Complete guide to the Tasks module — task creation, assignment, priority, status, case linkage, and completion workflow.",
        search_keywords: "tasks, task management, create task, assign task, task priority, task status, task due date, case task, follow up, task completion, overdue tasks, today priorities, urgent task",
        topic_body: `# Chapter 20 — Tasks Module

## 20.1 Purpose
Cross-module task and follow-up management for brokers, account managers, and operations staff.

## 20.2 Tasks Page (/tasks)
**Layout:** Header (Create Task, filters) | Task List (grouped by status or priority) | Filters (status, priority, due date, assigned user, linked case)

## 20.3 Task Fields
| Field | Description | Required |
|---|---|---|
| Title | Brief task description | Yes |
| Description | Detailed instructions | No |
| Status | open / in_progress / completed / cancelled | Yes |
| Priority | low / medium / high / urgent | Yes |
| Due Date | When task must be completed | Recommended |
| Assigned To | User responsible | Recommended |
| Linked Case | Related benefit case | No |
| Category | Follow-up / Documentation / Review / Communication | No |

## 20.4 Task Priority
| Priority | Color | Response |
|---|---|---|
| Urgent | Red | Complete today |
| High | Orange | Within 24 hours |
| Medium | Yellow | Within 3 days |
| Low | Blue | When convenient |

## 20.5 Task Status Workflow
open → in_progress → completed
     → cancelled

## 20.6 Tasks in Case Detail
Tasks Tab in case detail shows all tasks linked to that case. Creating a task from the Tasks Tab automatically links it to the current case.

## 20.7 Today's Priorities
Dashboard Today's Priorities shows tasks that are: due today | overdue | High/Urgent and due within 24 hours.`
      },
      {
        topic_code: "EMPLOYERS_MODULE_GUIDE",
        topic_title: "Chapter 21 — Employers Module: Complete Guide",
        topic_type: "module_guide", module_code: "EMPLOYERS", sort_order: 2100,
        topic_summary: "Complete guide to the Employers module — employer group records, contacts, status, and case linkage.",
        search_keywords: "employers, employer group, employer records, employer status, employer contacts, employer profile, EIN, SIC code, eligible count, employee count",
        topic_body: `# Chapter 21 — Employers Module

## 21.1 Purpose
Manages employer group master records. Every benefit case is linked to an employer group record.

## 21.2 Employers Page (/employers)
**Layout:** Search and filter bar | Employer cards | Add Employer button

## 21.3 Employer Record Fields
| Field | Description |
|---|---|
| Name | Company legal name |
| DBA Name | Doing Business As name |
| EIN | Employer Identification Number |
| Industry | Industry category |
| SIC Code | Standard Industrial Classification code |
| Address / City / State / ZIP | Location |
| Phone | Main phone |
| Website | Company website |
| Employee Count | Total headcount |
| Eligible Count | Benefit-eligible employee count |
| Effective Date | When the group became or will become effective |
| Renewal Date | Annual renewal date |
| Status | prospect / active / inactive / terminated |
| Primary Contact Name/Email/Phone | Main HR contact |

## 21.4 Employer Statuses
| Status | Meaning |
|---|---|
| prospect | Not yet a client |
| active | Currently covered employer group |
| inactive | Temporarily inactive |
| terminated | Coverage terminated |

## 21.5 Case Linkage
Each benefit case links to exactly one employer group record. From the employer record, you can view all cases associated with that employer.`
      },
      {
        topic_code: "HELPAI_RETRIEVAL_INDEX",
        topic_title: "HelpAI Knowledge Index & Retrieval Configuration",
        topic_type: "reference", module_code: null, sort_order: 2200,
        topic_summary: "HelpAI retrieval priority, knowledge sources, indexing strategy, and how to improve answer quality.",
        search_keywords: "HelpAI, AI assistant, knowledge base, retrieval, indexing, governed documentation, help AI configuration, answer quality, help AI training, confidence, low confidence",
        topic_body: `# HelpAI Knowledge Index & Retrieval Configuration

## Purpose
HelpAI is ConnectQuote 360's governed AI assistant. It answers only from approved documentation records.

## Retrieval Priority Order
1. Contextual Help Content — exact match for current UI element
2. Page-scoped Help Content — all records for current page
3. Module-scoped Help Content — all records for current module
4. Manual Topic: Page Guide — long-form page documentation
5. Manual Topic: Workflow Guide — workflow documentation
6. Manual Topic: Module Guide — module-level documentation
7. Manual Topic: FAQ/Troubleshooting — common issue resolutions
8. Glossary — term definitions

## Knowledge Sources
| Source | Entity | Priority |
|---|---|---|
| Contextual help | HelpContent | Highest |
| Page/workflow/module guides | HelpManualTopic | High |
| FAQ/Troubleshooting | HelpManualTopic | Medium |
| Glossary/Reference | HelpManualTopic | Lower |

## Search Keyword Strategy
Include in every record: exact field/button/page name | synonyms | common question phrasing | abbreviations/acronyms | related process terms

## Confidence Levels
| Level | Description | Action |
|---|---|---|
| High (≥0.7) | Direct documentation matches found | Return answer |
| Medium (0.4–0.69) | Partial matches found | Return with caveat |
| Low (<0.4) | Limited matches | Flag for admin review |

## Improving HelpAI Quality
1. Expand help content for frequently asked questions (see Help Admin)
2. Add search keywords to existing content
3. Review low-confidence questions in Help Analytics → AI Question Log
4. Create FAQ topics for recurring questions
5. Keep manual topics current when features change`
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
    return Response.json({ success: true, part: 2, created, updated, total: topics.length, errors });
  } catch (error) {
    console.error('[function' + '] error:', error.message, error.stack);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});