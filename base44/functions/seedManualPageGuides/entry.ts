/**
 * seedManualPageGuides
 * Seeds individual Page Guide topics for every major page in the application.
 * These are detailed "How to use this page" guides — one per page.
 * Admin only. Safe to re-run (upserts by topic_code).
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const db = base44.asServiceRole;

    const topics = [

      // ── DASHBOARD ──────────────────────────────────────────────────────────
      {
        topic_code: "PG_DASHBOARD",
        topic_title: "Page Guide: Dashboard",
        topic_type: "page_guide", module_code: "DASHBOARD", sort_order: 1310,
        topic_summary: "How to use the Dashboard page — interpret KPIs, read the pipeline, respond to alerts, and navigate to priority work.",
        search_keywords: "dashboard guide, how to use dashboard, KPI cards, pipeline view, quick actions, today priorities, stalled cases, enrollment countdown, census gap, dashboard navigation",
        topic_body: `# Page Guide: Dashboard (/dashboard)

## What This Page Does
Your real-time operational command center. Answers: *What needs my attention right now?*

## Step-by-Step Usage

### 1. Check KPI Cards (top row)
Scan three numbers at a glance:
- **Active Cases** — Total open cases. Click to go to Cases filtered to active.
- **Open Enrollments** — Enrollment windows currently accepting elections. Click to go to Enrollment.
- **Upcoming Renewals** — Groups renewing within 90 days. Click to go to Renewals.

### 2. Review Today's Priorities
AI-surfaced items requiring immediate action. Act on items here before moving to other modules.
Priority rules: tasks overdue → enrollment windows closing in <48h → cases in Employer Review with no activity 5+ days → critical exceptions unresolved 24h+.

### 3. Scan the Case Pipeline
Horizontal bar showing case counts per lifecycle stage. Spot bottlenecks (stages with disproportionate counts). Click any stage box to open Cases filtered to that stage.

### 4. Check Stalled Cases Alert
Cases with no activity in 7+ days. Review each and add a note or advance the stage. Left unattended, these become at-risk accounts.

### 5. Check Census Gap Alert
Cases in Census In Progress with no census uploaded. These block quoting workflow.

### 6. Review Enrollment Countdowns
Active windows with days-remaining color coding:
- 🟢 Green = 7+ days (comfortable)
- 🟡 Yellow = 3–6 days (follow up with employees)
- 🔴 Red = 1–2 days (urgent outreach needed)

### 7. Use Quick Actions
One-click access to the most common next steps: New Case, Upload Census, Create Quote, Send Proposal, View Tasks.

## Tips
- Start each workday on the Dashboard — it surfaces what matters without hunting through each module.
- Stalled case alerts auto-clear when activity is added to the case.
- KPI counts update in real time as records change.`
      },

      // ── CASES LIST ────────────────────────────────────────────────────────
      {
        topic_code: "PG_CASES_LIST",
        topic_title: "Page Guide: Cases List",
        topic_type: "page_guide", module_code: "CASES", sort_order: 310,
        topic_summary: "How to use the Cases list page — search, filter, view modes, create cases, and navigate to case detail.",
        search_keywords: "cases list, cases page, how to find a case, filter cases by stage, search cases, new case button, case cards, pipeline view, cases grid, find employer case",
        topic_body: `# Page Guide: Cases List (/cases)

## What This Page Does
Displays all benefit cases with filtering, sorting, and view options. Starting point for all case work.

## Step-by-Step Usage

### 1. Find a Case
**By name:** Type employer name in search bar (top right).
**By stage:** Use Stage filter dropdown to show only cases in a specific stage.
**By priority:** Use Priority filter to surface High/Urgent cases.
**By assigned rep:** Use Assigned To filter for workload management.

### 2. Read a Case Card
Each card shows: Case Number | Employer Name | Stage (color-coded badge) | Priority | Assigned To | Last Activity Date | Employee Count | Case Type

**Stage badge colors:** Draft = grey | Active stages = blue | Employer Review = amber | Enrollment = teal | Complete/Active = green | Closed = muted

### 3. Switch Views
**Card View** — Visual cards, good for at-a-glance status.
**Pipeline View** — Kanban columns by stage. Drag cards to advance stage.
**List View** — Compact table. Best for large case portfolios.

### 4. Create a New Case
Click **+ New Case** (top right). Required: Employer Group (select or create), Case Type, Effective Date, Priority, Assigned To.

### 5. Open Case Detail
Click any case card to open full Case Detail page.

## Common Workflows
- **Morning review:** Filter by "My Cases" (Assigned To = you) to see your portfolio.
- **Pipeline health:** Switch to Pipeline View to see distribution across stages.
- **Urgent cases:** Filter by Priority = Urgent to address highest-priority items first.`
      },

      // ── CASE DETAIL ───────────────────────────────────────────────────────
      {
        topic_code: "PG_CASE_DETAIL",
        topic_title: "Page Guide: Case Detail",
        topic_type: "page_guide", module_code: "CASES", sort_order: 320,
        topic_summary: "How to use the Case Detail page — read case info, advance stages, use tabs, add notes, and manage related records.",
        search_keywords: "case detail page, case tabs, census tab, quotes tab, tasks tab, documents tab, activity log, advance stage, case info card, case header, case number detail, how to advance stage",
        topic_body: `# Page Guide: Case Detail (/cases/:id)

## What This Page Does
The complete record for a single benefit case. All case work (census, quotes, proposals, tasks, documents, activity) is managed here.

## Layout Sections

### Case Header
Top of page. Shows: Case Number | Employer Name | Stage Badge | Priority | Assigned To | Effective Date

**Action Buttons (top right):**
- **Advance Stage** — Move case to next stage (see prerequisites in Chapter 3)
- **Edit Case** — Edit core case fields
- **Close Case** — Close case with reason (admin confirmation required)

### Stage Progress Bar
Visual indicator of case position in lifecycle. Completed stages shown in solid color.

### Case Info Card
Core fields: Case Type | Effective Date | Products Requested | Employee Count | Target Close Date | Notes

### Tab Bar

**Census Tab**
Shows census upload status, validation results, member count. Link to full Census module pre-filtered for this case.

**Quotes Tab**
Lists all quote scenarios linked to this case. Click a scenario to open it. Create new scenario from this tab.

**Tasks Tab**
Tasks linked to this case. Add task (pre-linked to this case), mark complete, assign to team member.

**Documents Tab**
All documents attached to this case. Upload documents, view PDF proposals, download files.

**Activity Tab**
Full audit trail: stage changes, notes added, proposals sent, enrollments opened, all user actions with timestamps.

## Common Workflows
- **Starting a case:** Open → fill Case Info → upload census (Census Tab) → advance to Census In Progress.
- **Checking progress:** Activity Tab shows full history.
- **Before advancing stage:** Read the prerequisite note in Advance Stage modal.`
      },

      // ── CENSUS PAGE ───────────────────────────────────────────────────────
      {
        topic_code: "PG_CENSUS",
        topic_title: "Page Guide: Census",
        topic_type: "page_guide", module_code: "CENSUS", sort_order: 410,
        topic_summary: "How to upload a census, resolve validation errors, run GradientAI analysis, and manage census versions.",
        search_keywords: "census page guide, how to upload census, census validation, fix census errors, GradientAI analysis, census member table, census version history, census file upload, CSV upload, column mapping",
        topic_body: `# Page Guide: Census (/census)

## What This Page Does
Upload employee data, validate it, analyze risk with GradientAI, and manage version history. Clean validated census is required before quoting.

## Step-by-Step: Upload and Validate

### Step 1: Select Case
Use case selector (top) to choose the case you're working on.

### Step 2: Upload Census File
Click **Upload Census**. Drag or select your CSV/Excel file. System auto-maps columns. Review mapping and confirm.

**Required columns:** Employee Name, Date of Birth, Gender, Employment Status, Coverage Tier, ZIP Code, Hire Date

### Step 3: Review Validation Results
After upload, validation results appear immediately.
- **Red (Errors)** — Must fix before advancing. Download error report for details.
- **Yellow (Warnings)** — Should review but won't block.
- **Blue (Info)** — Observations only.

### Step 4: Fix Errors
**Option A:** Fix in source file, re-upload.
**Option B:** Click member row in Census Member Table → edit in drawer.

### Step 5: Confirm Validation
When all critical errors are resolved, status changes to **Validated**. Case can now advance to Ready for Quote.

## Running GradientAI Analysis
1. Ensure census is uploaded (validated preferred but not required)
2. Click **Run Analysis** in GradientAI panel (right side or bottom)
3. Wait ~10–20 seconds for AI results
4. Review: Aggregate Risk Score | Age Distribution | Risk Insights | Plan Recommendations

## Managing Versions
Each upload creates a new version. Previous versions accessible in **Version History** tab.
Use **Compare Versions** to see what changed between uploads.

## Common Issues
- "Invalid Coverage Tier" — Use exact values: Employee Only, Employee+Spouse, Employee+Children, Family
- "Duplicate Employee" — Check for same name/DOB appearing twice in file
- "Age Out of Range" — Verify DOB — likely a typo in the year`
      },

      // ── QUOTES PAGE ───────────────────────────────────────────────────────
      {
        topic_code: "PG_QUOTES",
        topic_title: "Page Guide: Quotes",
        topic_type: "page_guide", module_code: "QUOTES", sort_order: 510,
        topic_summary: "How to create quote scenarios, select plans, configure contributions, use cost modeling slider, compare scenarios, and generate proposals.",
        search_keywords: "quotes page guide, how to create a quote, new scenario, plan selection, contribution configuration, cost modeling slider, scenario comparison, create proposal from quote, quote scenario workflow",
        topic_body: `# Page Guide: Quotes (/quotes)

## What This Page Does
Build benefit quote scenarios with plan selections and contribution strategies. Foundation for proposals.

## Step-by-Step: Create a Quote Scenario

### Step 1: Select Case
Use the case selector (top) to choose the case you're quoting.

### Step 2: Click New Scenario
Opens Scenario Creation dialog.

### Step 3: Name the Scenario
Use descriptive names like "Medical PPO + Dental" or "2025 Conservative Option."

### Step 4: Select Plans
Browse Plan Library within the scenario builder. Filter by: Carrier | Network Type (HMO/PPO/HDHP) | Metal Tier | HSA Eligible | Plan Type. Select 1–6 plans.

### Step 5: Configure Contribution
Choose strategy: Fixed Amount | Fixed Percentage | Reference Plan | Composite Rate | Voluntary.
Set the employer contribution value for each plan/tier.

### Step 6: Review Cost Modeling
System shows in real time:
- Total Monthly Premium (employer + employee)
- Average Employee Monthly Cost
- Per-Tier Breakdown
- ACA Affordability Status (green/amber/red flag)

### Step 7: Use Cost Modeling Slider
Drag slider to adjust employer contribution %. Watch costs update instantly. Find optimal split between employer cost control and ACA compliance.

### Step 8: Save Scenario
Click Save. Scenario card appears in the scenarios grid.

## Comparing Scenarios
Check 2+ scenario checkboxes → Click Compare. Side-by-side view of premiums, employee costs, benefit differences.

## Creating a Proposal
From a scenario card, click **Create Proposal**. System creates a Proposal record pre-populated with scenario data. You're taken to Proposal Builder.`
      },

      // ── PROPOSALS PAGE ────────────────────────────────────────────────────
      {
        topic_code: "PG_PROPOSALS",
        topic_title: "Page Guide: Proposals",
        topic_type: "page_guide", module_code: "PROPOSALS", sort_order: 610,
        topic_summary: "How to build, send, track, and manage proposals — including PDF export, employer review, approval workflow, and versioning.",
        search_keywords: "proposals page guide, how to send a proposal, proposal builder, proposal PDF, send proposal, proposal approval, employer review, proposal version, proposal status, new version proposal",
        topic_body: `# Page Guide: Proposals (/proposals)

## What This Page Does
Create, deliver, and track benefit proposals. Proposals are sent to employers who then approve or reject via the Employer Portal.

## Step-by-Step: Send a Proposal

### Step 1: Find or Create Proposal
A proposal is auto-created when you click "Create Proposal" from a quote scenario.
Or: Click **New Proposal** from this page and link to a case.

### Step 2: Build Proposal Content
In Proposal Builder:
- Edit proposal title and introduction
- Review plan summaries (pulled from scenario)
- Verify contribution breakdowns
- Add notes or custom sections
- Preview layout before sending

### Step 3: Export PDF (Optional)
Click **Export PDF** to download a formatted document. Review before sending.

### Step 4: Send Proposal
Click **Send Proposal**. Confirm the employer contact email.
System: sets status to Sent | sends email to employer | logs in audit trail | advances case to Employer Review.

> ⚠ Once sent, a proposal cannot be edited. Changes require a New Version.

### Step 5: Monitor Status
Proposal cards show real-time status: Sent → Viewed → Employer Review → Approved / Rejected.

### Step 6: If Rejected
Click **New Version** on the rejected proposal. Creates a draft copy. Edit content, re-send.

### Step 7: If Approved
Case automatically advances to Approved for Enrollment. Enrollment window can now be created.

## Send Reminder
If employer hasn't responded: click **Send Reminder** on proposal card. Available 24h after last action.

## Pipeline View
Switch to Pipeline View (Kanban) for visual management of all proposals across statuses.`
      },

      // ── ENROLLMENT PAGE ───────────────────────────────────────────────────
      {
        topic_code: "PG_ENROLLMENT",
        topic_title: "Page Guide: Enrollment",
        topic_type: "page_guide", module_code: "ENROLLMENT", sort_order: 710,
        topic_summary: "How to create enrollment windows, send invitations, monitor participation, manage DocuSign, and complete enrollment.",
        search_keywords: "enrollment page guide, how to create enrollment window, send enrollment invitation, enrollment participation, DocuSign status, enrollment member table, enrollment completion, resend invitation",
        topic_body: `# Page Guide: Enrollment (/enrollment)

## What This Page Does
Manages open enrollment windows from creation through completion. Tracks every employee's election progress.

## Step-by-Step: Run an Enrollment

### Step 1: Create Enrollment Window
Click **Create Enrollment Window**.
Fill in: Window Name | Start Date | End Date | Linked Case | Effective Date | Available Plans (select from Plan Library)

### Step 2: Activate the Window
Set status to **Open**. This enables employee portal access.

### Step 3: Send Invitations
Click **Send Invitations**. System generates a unique secure link per employee and sends invitation emails.
Verify: case has a validated census with employee emails before this step.

### Step 4: Monitor Participation
Watch real-time counters: Invited | Started | Completed | Waived | Pending

**Participation Rate** = (Completed + Waived) / Total Invited × 100
Target: 75%+ (most carrier minimums). Status shows green/amber/red.

### Step 5: Review Member Table
See each employee's status. Sort by Status to quickly find who hasn't started.
For incomplete employees: click **Resend Invitation** to send another email.

### Step 6: Manage DocuSign
After election: system auto-generates enrollment form and sends DocuSign envelope.
Monitor DocuSign Status column: not_sent | sent | delivered | **completed** | declined | voided
For declined: click **Resend DocuSign** to void old envelope and send new one.

### Step 7: Close Enrollment
When window end date passes or participation target met: set status to **Completed**.
Case advances to Enrollment Complete. Broker reviews final elections and coordinates carrier install.

## Key Rules
- Employees cannot change elections after window closes without a qualifying life event.
- Waived employees count toward participation denominator (reduces participation %).`
      },

      // ── RENEWALS PAGE ─────────────────────────────────────────────────────
      {
        topic_code: "PG_RENEWALS",
        topic_title: "Page Guide: Renewals",
        topic_type: "page_guide", module_code: "RENEWALS", sort_order: 810,
        topic_summary: "How to manage renewal pipeline, interpret disruption scores, enter rate changes, and use renewal calendar and risk forecast.",
        search_keywords: "renewals page guide, renewal pipeline, how to manage renewal, disruption score, rate change entry, renewal calendar, risk forecast, renewal workload, upcoming renewals, renewal stages",
        topic_body: `# Page Guide: Renewals (/renewals)

## What This Page Does
Tracks all annual renewal cycles. Helps you identify at-risk accounts, manage rate changes, and prioritize renewal workload.

## Reading the Dashboard

### KPI Bar
- **Upcoming (90 days)** — All groups renewing in next 90 days. Defines your renewal workload.
- **Average Rate Change %** — Portfolio-wide average carrier rate change. Above 10% = challenging renewal season.
- **High Disruption** — Count of renewals with disruption score ≥76.

### Pipeline View (Kanban)
Stages: Upcoming → In Review → Requoting → Proposal Ready → Employer Review → Approved → Enrollment Open → Complete
Drag cards across stages to track progress.

### Calendar View
Monthly view of all renewal due dates. Click a day to see renewals due that month.
Colors: Green (60+ days) | Yellow (30–60 days) | Red (<30 days)

## Working a Renewal

### Step 1: Identify Upcoming Renewals
Filter to "Upcoming" stage. Sort by Renewal Date ascending to see soonest-due groups first.

### Step 2: Enter Rate Changes
Open a renewal card → click Edit → enter Carrier Rate Change % received from carrier. This updates the disruption score.

### Step 3: Interpret Disruption Score
| Score | Action |
|---|---|
| 0–25 | Standard renewal — straightforward re-enrollment |
| 26–50 | Moderate — review plan options, prepare employer communication |
| 51–75 | High — prepare alternatives, schedule employer call |
| 76–100 | Very High — executive engagement, consider market re-shop |

### Step 4: Build Renewal Quote
From the renewal record, navigate to Quotes → create renewal scenario with new rates. Compare with current year.

### Step 5: Prepare Renewal Proposal
Follow standard proposal workflow. Note: renewal proposals typically include year-over-year cost comparison.

## Risk Forecast
AI-generated list of groups most at risk of non-renewal. Review monthly. Proactive outreach to at-risk groups improves retention.`
      },

      // ── PLAN LIBRARY PAGE ─────────────────────────────────────────────────
      {
        topic_code: "PG_PLAN_LIBRARY",
        topic_title: "Page Guide: Plan Library",
        topic_type: "page_guide", module_code: "PLANS", sort_order: 910,
        topic_summary: "How to add plans, configure rate tables, use the comparison tool, manage plan lifecycle, and bulk import plans.",
        search_keywords: "plan library page guide, how to add a plan, plan rate table, plan comparison tool, bulk import plans, plan status, edit plan, deductible setup, OOP max setup, plan creation",
        topic_body: `# Page Guide: Plan Library (/plans)

## What This Page Does
Catalog of all benefit plans available for quoting. Plans must be in the library with accurate rates before they can be selected in scenarios.

## Adding a Plan

### Step 1: Click Add Plan
Opens Plan Form.

### Step 2: Fill Plan Details
Required: Plan Name | Carrier | Plan Type | Network Type | Deductible (Individual/Family) | OOP Max (Individual/Family) | Coinsurance %
Optional: Metal Tier | Copay (PCP/Specialist) | HSA/HRA Eligible | Premium Includes (vision/dental)

### Step 3: Configure Rate Table
In the Rate Table tab within the plan form:
- Enter monthly premium per coverage tier (Employee Only, +Spouse, +Children, Family)
- For age-banded plans: enter per-age-year rates
- Set effective date range

> ⚠ Rate table accuracy is critical. Incorrect rates will produce incorrect cost projections in all quote scenarios that use this plan.

### Step 4: Set Status to Active
Plans default to Draft. Set to **Active** to make available in quote scenario plan picker.

## Editing a Plan
Click any plan card → click Edit (pencil icon). Make changes → Save.
> Note: Editing rates on an active plan affects all new quote calculations. Existing quotes are not retroactively updated.

## Archiving a Plan
Plans that are no longer sold should be Archived (not deleted). Archived plans remain visible for historical records but cannot be selected in new scenarios.

## Bulk Import
Click **Bulk Import** → download template → fill plan data → upload completed template.
Validate column headers match template exactly. Required columns listed in template header row.

## Plan Comparison Tool
Select 2–4 plans using checkboxes → click **Compare**. Side-by-side view of all benefit fields and rates.

## Analytics Panel
View: top 10 plans by quote frequency, premium distribution by plan type, network type breakdown.`
      },

      // ── EXCEPTIONS PAGE ────────────────────────────────────────────────────
      {
        topic_code: "PG_EXCEPTIONS",
        topic_title: "Page Guide: Exception Queue",
        topic_type: "page_guide", module_code: "EXCEPTIONS", sort_order: 1110,
        topic_summary: "How to triage exceptions, work through the exception workflow, use the comment thread, and manage automation rules.",
        search_keywords: "exceptions page guide, how to resolve an exception, exception triage, exception workflow, exception comment, exception severity, critical exception, exception status, mark exception resolved",
        topic_body: `# Page Guide: Exception Queue (/exceptions)

## What This Page Does
Manages operational and compliance exceptions. Critical exceptions carry regulatory risk; timely resolution is mandatory.

## Reading the KPI Bar
- **Open** — All unresolved exceptions
- **Critical** — Immediate action required (same-day response)
- **Avg Resolution Time** — Benchmark for team performance. Target: <48h
- **By Severity** — Distribution shows if workload is concentrated in high-risk items

## Working the Workflow Board (Kanban)
Columns: Open | In Review | Pending Resolution | Escalated | Resolved | Closed
Drag exception cards to advance status, or use the status dropdown within each card.

## Triaging an Exception

### Step 1: Sort by Severity
Always address **Critical** first, then **High**. Filter severity to focus.

### Step 2: Open Exception Card
Click to expand. See: Description | Auto-generated triage notes | AI suggested resolution steps | Related case link | Similar past exceptions.

### Step 3: Take Action
Options:
- Assign to team member (Assigned To field)
- Add comment with action taken
- Attach supporting document
- Change status to In Review, then Pending Resolution, then Resolved

### Step 4: Resolve
Set status to **Resolved**. Add resolution notes in comment thread. System timestamps and logs the resolution.

## Comment Thread
Each exception has a comment thread. Use for: documenting steps taken, @mentioning colleagues, attaching evidence, logging carrier communications.

## AI Triage Assistant
Suggests resolution steps based on: exception type, related case context, similar resolved exceptions. Use as starting point, not final authority.

## Automation Rules (Admin)
Settings for: auto-assign by type, auto-escalate after X hours unresolved, email notifications, auto-close policies. Configured in Settings > Automation.`
      },

      // ── POLICYMATCH PAGE ───────────────────────────────────────────────────
      {
        topic_code: "PG_POLICYMATCH",
        topic_title: "Page Guide: PolicyMatchAI",
        topic_type: "page_guide", module_code: "POLICYMATCH", sort_order: 1010,
        topic_summary: "How to run a PolicyMatchAI analysis, interpret risk scores, read recommendations, and use the comparison matrix.",
        search_keywords: "PolicyMatchAI page guide, how to run policy match, AI plan recommendations, risk score interpretation, value score, risk tier, run analysis, comparison matrix, policy match results",
        topic_body: `# Page Guide: PolicyMatchAI (/policymatch)

## What This Page Does
AI-powered plan matching. Analyzes your census population and recommends the best-fit plans from the library.

## Running an Analysis

### Step 1: Select Census
Choose the census you want to analyze (must be uploaded). Pre-populated if navigating from a case.

### Step 2: Select Mode
- **Quick Match** — Fast analysis using aggregate census data. Best for initial screening.
- **Full Analysis** — Deep risk modeling. Takes longer, more precise. Use for final recommendations.

### Step 3: Click Run Analysis
Processing time: Quick (5–15 seconds) | Full (30–60 seconds).
Progress indicator shows stages: Census Processing → Risk Scoring → Plan Matching → Ranking.

## Reading Results

### Risk Score (0–100)
Population-level risk. Factors in: age distribution, gender, coverage tier mix, geographic risk, historical claims.
**Use:** Higher risk score = consider richer plan options or higher contribution to maintain employee satisfaction and retention.

### Value Score
How well available plans fit this population. High value = strong plan-to-population alignment at competitive premium.

### Risk Tier Badge
| Tier | Action |
|---|---|
| Preferred | Standard market approach. Most plans available. |
| Standard | Normal quoting. Standard carrier underwriting. |
| Rated | Some carriers may apply surcharges. Focus on best-fit plans. |
| High Risk | Work with specialized underwriters. Pre-screen with carriers. |

### Plan Recommendations
Ranked list with "Why recommended" explanations for each plan.
- Value Score column: how well this plan fits the population
- Risk-Adjusted Premium: estimated premium accounting for risk tier

### Comparison Matrix
Select top plans to compare side-by-side: all benefit fields, premiums, scores, compatibility notes.

## History Timeline
All previous analyses saved. Compare how risk profile changes over time (useful for renewals: compare current year vs prior year).`
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
    return Response.json({ success: true, seed: "page_guides", created, updated, total: topics.length, errors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});