import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const DASHBOARD_HELP = [
  {
    help_target_code: "DASHBOARD.PAGE",
    module_code: "DASHBOARD",
    page_code: "DASHBOARD",
    content_source_type: "system_generated",
    content_status: "active",
    help_title: "Dashboard Overview",
    short_help_text: "Your central command center for all benefits operations — live KPIs, pipeline status, tasks, and enrollment activity in one place.",
    detailed_help_text: `## Dashboard Overview

The Dashboard is the main landing page of ConnectQuote 360. It gives you a real-time snapshot of everything happening across your benefits book of business.

### What you'll see
- **KPI metrics** — Active cases, quoting activity, open enrollments, overdue tasks, monthly premium, upcoming renewals, and average enrollment rate
- **Case pipeline** — An interactive bar chart showing how many cases are in each stage (Draft → Census → Quoting → Proposal → Enrollment → Active)
- **Today's Priorities** — Urgent items surfaced automatically based on deadlines and activity
- **Quick Actions** — One-click shortcuts to start common workflows
- **Recent Cases** — The 5 most recently updated cases with stage badges
- **Needs Attention** — Open exceptions and overdue tasks requiring immediate action
- **Enrollment Countdowns** — Active enrollment windows with days remaining
- **Upcoming Renewals** — Renewals due within 90 days

### How data is calculated
All metrics pull live from the database. Metrics involving enrollment rates only count windows with actual activity (enrolled_count > 0) to avoid artificially low averages.`,
    feature_capabilities_text: "Real-time KPIs, interactive pipeline chart, enrollment countdowns, renewal tracking, task/exception alerts, census gap warnings.",
    expected_user_action_text: "Use the Dashboard daily to spot bottlenecks. Click any case in Recent Cases to open it, or use Quick Actions to start a new workflow. Monitor the Needs Attention panel to clear exceptions and overdue tasks.",
    search_keywords: "dashboard overview metrics kpi pipeline enrollments renewals tasks exceptions",
    is_primary: true,
    is_active: true,
    version_no: 1,
    language_code: "en"
  },
  {
    help_target_code: "DASHBOARD.KPI.ACTIVE_CASES",
    module_code: "DASHBOARD",
    page_code: "DASHBOARD",
    content_source_type: "system_generated",
    content_status: "active",
    help_title: "Active Cases KPI",
    short_help_text: "Shows the total number of benefit cases currently in progress — any case that hasn't reached Closed or Renewed status.",
    detailed_help_text: `## Active Cases KPI

This metric counts every BenefitCase record where \`stage\` is **not** \`closed\` or \`renewed\`.

### Why it matters
Active Cases tells you the total load on your team right now. A high number relative to your team size may indicate you need to prioritize advancing stalled cases or closing out completed ones.

### Lifecycle stages counted as Active
- Draft
- Census In Progress / Census Validated
- Ready for Quote / Quoting
- Proposal Ready / Employer Review
- Approved for Enrollment
- Enrollment Open / Enrollment Complete
- Install In Progress
- Active / Renewal Pending

The smaller "(N total)" label beneath the count shows the all-time total including closed and renewed cases for context.`,
    feature_capabilities_text: "Counts all non-terminal cases. Subtitle shows total case count including closed cases.",
    expected_user_action_text: "Click this card or navigate to /cases to see the full list filtered to active cases. If this number is unexpectedly high, review the pipeline chart to see where cases are stalling.",
    warnings_text: "Cases stuck in Draft for more than 2 weeks are flagged in the Census Gap Alert section. Review those to ensure no cases are being forgotten.",
    search_keywords: "active cases count pipeline kpi metric total",
    is_primary: true,
    is_active: true,
    version_no: 1,
    language_code: "en"
  },
  {
    help_target_code: "DASHBOARD.KPI.ENROLLMENTS",
    module_code: "DASHBOARD",
    page_code: "DASHBOARD",
    content_source_type: "system_generated",
    content_status: "active",
    help_title: "Open Enrollments KPI",
    short_help_text: "Shows how many enrollment windows are currently open or closing soon, requiring active monitoring.",
    detailed_help_text: `## Open Enrollments KPI

This count reflects EnrollmentWindow records with a status of **open** or **closing_soon**.

### What triggers an enrollment window
An enrollment window is created when a case is advanced to the **Enrollment Open** stage. Each window has a start date, end date, employee list, and participation tracking.

### Status meanings
- **open** — Enrollment is live. Employees can log in and select plans
- **closing_soon** — Within a configurable threshold of the end date (typically ≤ 7 days)

### Avg Enrollment Rate (secondary KPI)
Directly below the Open Enrollments count, the secondary metric shows the average participation rate across all active windows. This calculation excludes windows with zero eligibles or zero enrollments to keep the average meaningful.`,
    feature_capabilities_text: "Counts open and closing_soon enrollment windows. Companion metric shows average participation rate.",
    expected_user_action_text: "Navigate to /enrollment to see all windows. For any window nearing its end date with low participation, use the Send Enrollment Invite function to email reminders to pending employees.",
    warnings_text: "If a window shows 0% participation close to its end date, escalate to the employer contact immediately. DocuSign signatures may also be outstanding.",
    search_keywords: "enrollment open window participation rate kpi employees",
    is_primary: true,
    is_active: true,
    version_no: 1,
    language_code: "en"
  },
  {
    help_target_code: "DASHBOARD.KPI.RENEWALS",
    module_code: "DASHBOARD",
    page_code: "DASHBOARD",
    content_source_type: "system_generated",
    content_status: "active",
    help_title: "Upcoming Renewals KPI",
    short_help_text: "Shows renewal cycles with a renewal date within the next 90 days — your most time-sensitive pipeline activity.",
    detailed_help_text: `## Upcoming Renewals KPI (90-day window)

Counts RenewalCycle records where \`renewal_date\` is between today and 90 days from now.

### Why 90 days?
Group benefits renewals typically require 60–90 days of carrier negotiation, rate analysis, and employer communication. A renewal showing up in this KPI means action is needed **now**.

### Color coding in the Upcoming Renewals list
Below the KPI bar, the Upcoming Renewals panel shows individual renewals color-coded by urgency:
- 🔴 **≤ 30 days** — Critical, renewal paperwork should already be submitted
- 🟡 **31–60 days** — Urgent, begin carrier negotiations immediately
- 🔵 **61–90 days** — Active, initiate employer discussion and gather census

### Renewal cycle statuses
| Status | Meaning |
|---|---|
| pending | Not yet started |
| in_progress | Actively being worked |
| negotiating | Carrier rate negotiation underway |
| completed | Renewal finalized |
| cancelled | Renewal will not proceed |`,
    feature_capabilities_text: "90-day renewal countdown, urgency color coding, link to full renewal pipeline.",
    expected_user_action_text: "Click any renewal in the list to open its detail. Use /renewals for the full pipeline view with workload bar and risk forecasting.",
    warnings_text: "If a renewal is within 30 days and still in 'pending' status, this is a critical issue. Contact the employer and carrier immediately.",
    search_keywords: "renewals 90 day upcoming kpi renewal date deadline",
    is_primary: true,
    is_active: true,
    version_no: 1,
    language_code: "en"
  },
  {
    help_target_code: "DASHBOARD.PIPELINE",
    module_code: "DASHBOARD",
    page_code: "DASHBOARD",
    content_source_type: "system_generated",
    content_status: "active",
    help_title: "Case Pipeline View",
    short_help_text: "An interactive bar chart showing how many cases are in each stage of the benefits lifecycle — from Draft through Active.",
    detailed_help_text: `## Case Pipeline View

The pipeline chart groups all cases into 6 stage buckets and shows case counts as bars. Click any bar to filter the full case list to that stage.

### Stage Groups
| Group | Stages Included |
|---|---|
| **Draft** | draft |
| **Census** | census_in_progress, census_validated |
| **Quoting** | ready_for_quote, quoting |
| **Proposal** | proposal_ready, employer_review |
| **Enrollment** | approved_for_enrollment, enrollment_open, enrollment_complete |
| **Active** | install_in_progress, active, renewal_pending |

### What a healthy pipeline looks like
- Most cases in **Quoting** or **Proposal** (your revenue-generating stages)
- Few cases stuck in **Draft** (indicates incomplete intake)
- Enrollment stage should have activity aligned with upcoming effective dates
- Active cases growing over time = successful installs

### Interpreting bottlenecks
If many cases cluster in a single stage, that stage may be a process bottleneck. For example, many cases in "Census" may indicate a data quality issue or insufficient census staff capacity.`,
    feature_capabilities_text: "Interactive stage grouping, clickable bars, color-coded stage visualization, integration with full case list.",
    expected_user_action_text: "Hover over each bar to see exact counts. Click a bar to navigate to the Cases page pre-filtered to that stage group. Monitor weekly for pipeline movement.",
    search_keywords: "pipeline chart stages cases bar chart draft census quoting proposal enrollment active",
    is_primary: true,
    is_active: true,
    version_no: 1,
    language_code: "en"
  },
  {
    help_target_code: "DASHBOARD.QUICK_ACTIONS",
    module_code: "DASHBOARD",
    page_code: "DASHBOARD",
    content_source_type: "system_generated",
    content_status: "active",
    help_title: "Quick Actions Panel",
    short_help_text: "One-click shortcuts to the most common workflows — create a case, upload census, start a quote, build a proposal, or manage enrollment.",
    detailed_help_text: `## Quick Actions Panel

The Quick Actions panel sits at the top of the Dashboard and provides instant access to the most frequently used entry points in the system.

### Available Quick Actions
| Action | Where it goes | When to use |
|---|---|---|
| **New Case** | /cases/new | Starting intake for a new employer group |
| **Upload Census** | /census | Submitting or updating employee census data |
| **New Quote** | /quotes | Creating a new quote scenario for a case |
| **Build Proposal** | /proposals | Starting the proposal builder |
| **Open Enrollment** | /enrollment | Creating or managing an enrollment window |
| **Plan Library** | /plans | Browsing and managing available benefit plans |

### Best practice
Start every new engagement with **New Case** to establish the case record. All subsequent work (census, quotes, proposals, enrollment) links back to the case for a complete audit trail.`,
    feature_capabilities_text: "Six quick-launch buttons for the most common workflows. No data entry required — just click to navigate.",
    expected_user_action_text: "Use Quick Actions as your starting point each day. Bookmark the Dashboard as your home page so Quick Actions are always one click away.",
    search_keywords: "quick actions shortcuts new case census quote proposal enrollment plan",
    is_primary: true,
    is_active: true,
    version_no: 1,
    language_code: "en"
  },
  {
    help_target_code: "DASHBOARD.PRIORITIES",
    module_code: "DASHBOARD",
    page_code: "DASHBOARD",
    content_source_type: "system_generated",
    content_status: "active",
    help_title: "Today's Priorities",
    short_help_text: "An auto-generated list of the most urgent items requiring your attention today, ranked by deadline and severity.",
    detailed_help_text: `## Today's Priorities

Today's Priorities is an intelligent feed that automatically surfaces the highest-urgency items across your entire book of business. It saves you from manually checking every module to find what needs attention.

### What appears in Today's Priorities
Items are prioritized and grouped as follows:

**🔴 Overdue / Critical**
- Tasks with a due_date in the past
- Open exceptions with severity = critical or high
- Enrollment windows closing within 24 hours

**🟡 Due Today / Urgent**
- Tasks due today
- Enrollments closing within 3 days
- Renewals within 30 days

**🔵 Coming Up**
- Tasks due within 7 days
- Renewals within 60 days

### How items are ranked
The system ranks by a combination of days remaining and severity. Critical exceptions always appear first, followed by time-sensitive deadlines.

### Taking action
Each item in the panel links directly to the relevant record. Click through to resolve the item, then return to the Dashboard — the item will disappear from the list once resolved.`,
    feature_capabilities_text: "Cross-module priority feed aggregating tasks, exceptions, enrollments, and renewals. Auto-ranked by urgency.",
    expected_user_action_text: "Check Today's Priorities every morning as your first action. Work through items from top to bottom. Items disappear automatically once resolved.",
    warnings_text: "If Today's Priorities consistently has more than 10 items, your team may be understaffed for the current case volume. Consider reassigning cases or escalating to management.",
    search_keywords: "priorities today urgent overdue tasks exceptions deadlines alerts",
    is_primary: true,
    is_active: true,
    version_no: 1,
    language_code: "en"
  }
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const results = { created: 0, updated: 0, skipped: 0, errors: [] };

    for (const helpItem of DASHBOARD_HELP) {
      try {
        // Check if content already exists for this target_code
        const existing = await base44.asServiceRole.entities.HelpContent.filter({
          help_target_code: helpItem.help_target_code,
          is_primary: true
        });

        if (existing && existing.length > 0) {
          // Update existing record to active status
          await base44.asServiceRole.entities.HelpContent.update(existing[0].id, {
            ...helpItem,
            content_status: "active",
            is_active: true,
          });
          results.updated++;
        } else {
          // Create new record
          await base44.asServiceRole.entities.HelpContent.create(helpItem);
          results.created++;
        }
      } catch (err) {
        results.errors.push({ target: helpItem.help_target_code, error: err.message });
      }
    }

    return Response.json({
      success: true,
      message: `Dashboard help seeded: ${results.created} created, ${results.updated} updated, ${results.skipped} skipped`,
      results,
      total: DASHBOARD_HELP.length
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});