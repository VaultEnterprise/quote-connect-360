/**
 * seedManualFAQBank
 * Seeds a comprehensive FAQ bank and How-To guide collection.
 * Covers the most frequent user questions across all modules.
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

      // ── CASES FAQ ─────────────────────────────────────────────────────────
      {
        topic_code: "FAQ_CASES",
        topic_title: "FAQ: Cases — Common Questions",
        topic_type: "faq", module_code: "CASES", sort_order: 395,
        topic_summary: "Answers to the most common questions about case management — stages, creation, assignment, editing, and closing.",
        search_keywords: "case FAQ, case questions, how to create case, who creates cases, case stage change, edit case, delete case, re-open case, case assigned to, change case priority, case number format, multiple cases same employer",
        topic_body: `# FAQ: Cases

**Q: How do I create a new case?**
Navigate to Cases → click + New Case (top right). Fill in: Employer Group (required), Case Type (required), Effective Date, Priority, Assigned To. Save to create. Case starts in Draft stage.

**Q: Can I have multiple cases for the same employer?**
Yes. An employer group can have multiple cases — for example, a renewal case while the prior year's case is Active, or separate cases for different benefit lines. Each case is independent.

**Q: How do I change who a case is assigned to?**
Open Case Detail → click Edit Case → change Assigned To field → Save. The prior assignee's workload is updated immediately.

**Q: Can I go backward in stages?**
Stage reversals are intentionally restricted to prevent data corruption. Contact your administrator to discuss a stage reversal, who can make the change with appropriate documentation.

**Q: What's the difference between Closed and Renewed?**
**Renewed** — The group has successfully completed a renewal cycle. Coverage continues under new terms.
**Closed** — Case is terminated with no renewal. Reasons: group lost, declined to renew, switched carriers outside the system, or administrative close.

**Q: Why is the Advance Stage button greyed out?**
Prerequisites for the next stage have not been met. Hover over the button for a tooltip, or review the Stage Prerequisites table in Chapter 3. Most common reasons: census not validated, no quote scenario created, no proposal sent, employer approval not received.

**Q: How do I see all activity on a case?**
Open Case Detail → Activity Tab. Shows full chronological audit trail: all changes, notes, stage advances, proposals sent, enrollments opened, documents attached.

**Q: How do I add a note to a case?**
Case Detail → Activity Tab → click Add Note → enter note text → save. Notes are timestamped and attributed to your user.

**Q: Can I delete a case?**
Cases are not deleted — they are Closed. This preserves the audit trail and all associated records (census, quotes, proposals, enrollment data). Contact your admin if a case was created in error.

**Q: What does "Case Type: Takeover" mean?**
A Takeover is when the agency is taking over management of an existing employer group from another broker/agency. The group already has active coverage; you're assuming the broker-of-record relationship. Census and current plan details should be collected and entered.`
      },

      // ── CENSUS FAQ ────────────────────────────────────────────────────────
      {
        topic_code: "FAQ_CENSUS",
        topic_title: "FAQ: Census — Common Questions",
        topic_type: "faq", module_code: "CENSUS", sort_order: 495,
        topic_summary: "Answers to common census questions — file formats, validation errors, GradientAI, version history, and census corrections.",
        search_keywords: "census FAQ, census questions, census file format, census upload error, fix census, census validation failed, GradientAI results, census correction, re-upload census, census version, what columns census, duplicate census member",
        topic_body: `# FAQ: Census

**Q: What file formats are accepted for census upload?**
CSV (.csv) and Excel (.xlsx, .xls) files are supported. Tab-delimited .txt files may also work if you rename to .csv. Maximum file size: 10MB.

**Q: What columns are required in the census file?**
Required: Employee Name (or First Name + Last Name), Date of Birth, Gender, Employment Status, Coverage Tier, ZIP Code, Hire Date.
Optional (improves analysis): Salary, Department, Location, Dependent Name/DOB/Relationship.

**Q: My census has "Invalid Coverage Tier" errors. What are the valid values?**
The system requires exact values: **Employee Only**, **Employee+Spouse**, **Employee+Children**, **Family**. Check your file for variations like "EE Only", "EE+SP", "1+1" — these must be updated to exact values.

**Q: How do I fix census errors without re-uploading the whole file?**
Click on the error row in the Census Member Table → member detail drawer opens on the right → edit the field inline → save. Changes are recorded in the current census version.

**Q: Census shows validation passed but some rows are yellow — can I still proceed?**
Yellow rows are **warnings**, not errors. They do not block advancement. However, review each warning — some indicate data quality issues (e.g., age outliers, ZIP codes in unusual states) that may affect quote accuracy.

**Q: Can I keep the old census version after re-uploading?**
Yes. Every upload creates a new Census Version. Previous versions are preserved in the Version History tab and can be compared side-by-side. Nothing is deleted.

**Q: The employer updated their census after we already started quoting — what do I do?**
Upload the new census file (creates a new version). Re-run validation. If the population changed significantly, review quote scenarios — premium rates may shift based on new member demographics.

**Q: GradientAI says "High Risk" but the employer thinks the group is healthy. Why?**
GradientAI uses multiple factors including age distribution, geographic risk benchmarks, and coverage tier mix. A group can have healthy employees but score high due to: older average age, high proportion of family coverage, ZIP codes with high healthcare utilization. Share the detailed breakdown (Age Distribution, Risk Insights panels) with the employer for transparency.

**Q: How many employees can a census file contain?**
Technically up to several thousand, but for performance, files over 1,000 rows may take longer to validate. For groups over 500 employees, allow extra time for GradientAI analysis.`
      },

      // ── ENROLLMENT FAQ ────────────────────────────────────────────────────
      {
        topic_code: "FAQ_ENROLLMENT",
        topic_title: "FAQ: Enrollment — Common Questions",
        topic_type: "faq", module_code: "ENROLLMENT", sort_order: 795,
        topic_summary: "Answers to common enrollment questions — invitations, portal access, waiving, DocuSign, participation, and completion.",
        search_keywords: "enrollment FAQ, enrollment questions, employee can't access portal, resend invitation, enrollment waiver, DocuSign declined, participation rate low, enrollment completed, close enrollment window, enrollment error, employee wants to change plan",
        topic_body: `# FAQ: Enrollment

**Q: An employee says they never received their enrollment invitation. What do I do?**
1. Go to Enrollment → select the window → find the employee in the Member Table.
2. Verify their email address is correct.
3. Click **Resend Invitation** on their row.
4. Ask the employee to check spam/junk folder.
5. If email is wrong, update in the census record and resend.

**Q: Can employees enroll on a mobile phone?**
Yes. The Employee Portal is mobile-responsive and works on smartphones and tablets.

**Q: An employee wants to waive coverage. How does that work?**
In the Employee Portal, the employee selects "Waive Coverage" instead of choosing a plan. They are prompted to enter a waiver reason. The waiver is recorded and counts as a completed election (reduces pending count but counts against participation rate denominator).

**Q: Our participation rate is below 75%. What options do we have?**
Options: (1) Send reminder emails to all pending employees (Resend Invitation, filter by Status = invited/started). (2) Extend the enrollment window end date if time permits. (3) Contact employees directly via phone. (4) Some carriers allow waivers with proof of other coverage to be excluded from participation denominator — check with the carrier.

**Q: An employee selected the wrong plan and the window is still open. Can they change?**
Yes — as long as the enrollment window is still Open, employees can log back in with their secure link and change their election. Once the window closes, changes require a qualifying life event.

**Q: The enrollment window is closed but an employee missed it entirely. What now?**
Document the situation. Options: (1) Special enrollment with qualifying life event if applicable. (2) Coordinate with carrier for late-entry exception (not guaranteed). (3) Employee waits until next open enrollment period.

**Q: DocuSign shows "Completed" for some employees but the plan hasn't been confirmed with the carrier. Is this correct?**
Yes. "Completed" in DocuSign means the employee has signed the enrollment form. The signed document is stored in the system. Carrier submission is a separate step in the Install workflow (after Enrollment Complete stage).

**Q: Can I void a DocuSign envelope and resend it?**
Yes. In the Enrollment Member Table, find the employee → click the DocuSign status → select "Void and Resend." The old envelope is voided and a new one is generated. The employee receives a new signing email.`
      },

      // ── PROPOSALS FAQ ─────────────────────────────────────────────────────
      {
        topic_code: "FAQ_PROPOSALS",
        topic_title: "FAQ: Proposals — Common Questions",
        topic_type: "faq", module_code: "PROPOSALS", sort_order: 695,
        topic_summary: "Answers to common proposal questions — editing sent proposals, versioning, approval, employer portal access, and PDF export.",
        search_keywords: "proposals FAQ, proposal questions, edit sent proposal, proposal version, employer didn't receive proposal, re-send proposal, proposal rejected, proposal expired, proposal PDF, how long proposal valid",
        topic_body: `# FAQ: Proposals

**Q: I need to make a change to a proposal I already sent. How?**
You cannot edit a sent proposal. Click **New Version** on the proposal card. This creates a draft copy which you can edit. Once revised, send the new version. Employer receives the updated proposal. Old version is preserved in version history.

**Q: The employer says they didn't receive the proposal email. What do I do?**
1. Verify the employer contact email in the Employer Group record is correct.
2. Click **Send Reminder** on the proposal card — this resends the notification.
3. Ask the employer to check their spam folder.
4. Alternatively, export a PDF and email directly to the employer (as a backup).

**Q: What happens when a proposal expires?**
Status changes to Expired automatically after the expiration date. The case remains in Employer Review stage. Create a New Version and resend to restart the review process.

**Q: The employer approved the proposal. What happens next in the system?**
Case advances to **Approved for Enrollment** automatically. You can now create an Enrollment Window. The proposal status shows Approved with timestamp.

**Q: The employer rejected the proposal. What should I do?**
Review rejection notes (employer provides reason in Employer Portal). Create a New Version, address the employer's concerns (different plans, lower contributions, etc.), and resend.

**Q: Can I send a proposal directly from the PDF without using the system's send function?**
You can export PDF and email it manually, but this bypasses system tracking — the proposal won't show as "Sent" in the system, the employer portal won't be activated, and the case stage won't advance automatically. Use the system Send function for a complete workflow.

**Q: How many versions of a proposal can I create?**
There is no limit on proposal versions. Each version is numbered (V1, V2, V3...) and stored in proposal history.

**Q: Can an employer re-open a rejected proposal?**
No — once rejected, a proposal stays rejected. Create a new version with revisions.`
      },

      // ── ADMIN FAQ ─────────────────────────────────────────────────────────
      {
        topic_code: "FAQ_ADMIN",
        topic_title: "FAQ: Administration — Common Questions",
        topic_type: "faq", module_code: "SETTINGS", sort_order: 1495,
        topic_summary: "Answers to common admin questions — user management, roles, API setup, feature toggles, billing, and audit logs.",
        search_keywords: "admin FAQ, admin questions, invite user, change user role, remove user, API key setup, feature toggle, disable feature, billing, audit log, admin access, password reset, DocuSign setup, GradientAI setup",
        topic_body: `# FAQ: Administration

**Q: How do I invite a new user to the platform?**
Settings → Team Management → Invite User. Enter email and role (User or Admin). An invitation email is sent. The new user must click the link to complete registration.

**Q: How do I change a user's role from User to Admin?**
Settings → Team Management → find the user → click Edit → change Role → Save.
⚠ Only grant Admin role to authorized personnel. Admins have access to all records, settings, billing, and audit logs.

**Q: Can I remove a user who has left the company?**
Settings → Team Management → find user → click Deactivate. The user loses login access. Their records (cases, tasks, activities) remain intact in the system for audit purposes.

**Q: How do I set up the DocuSign integration?**
Settings → Integrations → DocuSign → enter your DocuSign Account ID and Integration Key → Test Connection. Also configure the webhook URL in DocuSign admin to point back to the system webhook endpoint (provided in the settings panel).

**Q: How do I enable or disable GradientAI?**
Settings → Feature Toggles → toggle "GradientAI Risk Analysis" on/off. Changes take effect immediately for all users.
⚠ Disabling GradientAI removes the Risk Analysis panel from Census for all users. Notify users before disabling.

**Q: Where can I see everything that happened in the system?**
Settings → Audit Logs. Full read-only audit trail of all creates, updates, deletes, login events, and major actions. Filterable by entity type, user, and date range.

**Q: Our agency name changed — how do I update it?**
Settings → Organization → edit Agency Name → Save.
⚠ Do NOT change Agency Code without contacting support — the code is used as an internal identifier and changing it can affect data integrity.

**Q: How do I see billing and usage?**
Settings → Billing. Shows current plan, usage metrics, next billing date, and invoice history.`
      },

      // ── PLANS FAQ ────────────────────────────────────────────────────────
      {
        topic_code: "FAQ_PLANS",
        topic_title: "FAQ: Plan Library — Common Questions",
        topic_type: "faq", module_code: "PLANS", sort_order: 995,
        topic_summary: "Answers to common plan library questions — adding plans, rate tables, archiving, HSA eligibility, and plan comparison.",
        search_keywords: "plan library FAQ, plan questions, add plan, plan rate wrong, update plan rates, archive plan, plan not showing in quotes, HSA plan, plan comparison, bulk import plans, plan type, delete plan",
        topic_body: `# FAQ: Plan Library

**Q: I added a plan but it's not showing up in the quote scenario plan picker. Why?**
Check the plan's Status. Only **Active** plans appear in the plan picker. New plans default to Draft status. Open the plan → Edit → set Status to Active → Save.

**Q: I need to update rates on an existing plan. How do I do that without affecting old quotes?**
Open the plan → Edit → Rate Table tab → update rates. This affects new quote calculations going forward. Existing scenarios that already have this plan selected will recalculate on next open. If you need to preserve old rates for historical reference, consider creating a new plan record with updated rates and archiving the old one.

**Q: What's the difference between Inactive and Archived?**
**Inactive** — Plan is temporarily not available for selection but may be reactivated.
**Archived** — Plan is permanently retired (e.g., discontinued by carrier). Preserved for historical records. Not available for new quotes.

**Q: How do I make a plan HSA eligible?**
Edit plan → check the "HSA Eligible" checkbox → Save. The plan must be an HDHP meeting IRS minimum deductible thresholds. Enabling this flag unlocks HSA contribution configuration in quote scenarios.

**Q: How do I delete a plan that was created by mistake?**
Plans are not deleted — they are Archived. This preserves data integrity for any scenarios or proposals that may reference the plan. Archive the incorrect plan and create a correct one.

**Q: The bulk import template isn't working. What columns are required?**
Download a fresh template from Plan Library → Bulk Import → Download Template. The template has exact column headers required. Do not rename columns. Required: Plan Name, Carrier, Plan Type, Network Type, Deductible Individual, Deductible Family, OOP Max Individual, OOP Max Family.

**Q: Can I compare more than 4 plans at once?**
The comparison tool supports 2–4 plans simultaneously for readability. For larger comparisons, run multiple 4-plan comparisons or use the scenario comparison feature in Quotes which can compare plans across scenarios.`
      },

      // ── HOWTO: CASE CREATION END-TO-END ──────────────────────────────────
      {
        topic_code: "HOWTO_NEW_CASE_END_TO_END",
        topic_title: "How-To: Complete a New Business Case (End to End)",
        topic_type: "how_to", module_code: "CASES", sort_order: 350,
        topic_summary: "Step-by-step guide to taking a new business case from creation through active — covering all modules in sequence.",
        search_keywords: "how to complete a case, new business case steps, case end to end, case complete workflow, new group step by step, from draft to active, case workflow guide, complete benefit case",
        topic_body: `# How-To: Complete a New Business Case (End to End)

## Overview
Total time: varies by group size and complexity. Typical timeline: 2–6 weeks.

---

## Phase 1: Create the Case (Day 1)
1. **Cases → + New Case**
2. Select or create the Employer Group record (Employers module)
3. Set: Case Type = New Business | Effective Date | Priority | Assigned To
4. Add Products Requested (Medical, Dental, Vision, etc.)
5. Add notes about group background (employees, industry, history)
6. **Case is now in Draft stage**

---

## Phase 2: Collect and Validate Census (Days 1–3)
1. Obtain census file from employer HR contact
2. **Census → Upload Census** → select case → upload file
3. Review validation results — fix all critical errors
4. Re-upload if changes needed
5. When all errors resolved: **census status = Validated**
6. Run GradientAI analysis — document risk score and insights
7. **Advance Case to Census Validated**

---

## Phase 3: Build Quote Scenarios (Days 2–5)
1. **Quotes → New Scenario** → link to case
2. Select 2–4 plan options (consider risk tier from GradientAI)
3. Configure contribution strategy — test ACA affordability
4. Use Cost Modeling Slider to find optimal employer/employee split
5. Create 2–3 alternative scenarios (conservative, moderate, rich)
6. Compare scenarios side-by-side
7. **Advance Case to Quoting → Proposal Ready**

---

## Phase 4: Create and Send Proposal (Days 5–7)
1. **Quotes → Create Proposal** on preferred scenario(s)
2. Open Proposal Builder — review content, add intro text
3. Export PDF to preview
4. Click **Send Proposal** → confirm employer email
5. **Case advances to Employer Review automatically**
6. Follow up after 2–3 days if no response

---

## Phase 5: Employer Approval (Days 7–14)
1. Employer receives email → logs into Employer Portal
2. Reviews proposal → clicks Approve (or Reject with notes)
3. If rejected: create new proposal version, revise, resend
4. When approved: **Case advances to Approved for Enrollment**

---

## Phase 6: Enrollment (Days 14–28)
1. **Enrollment → Create Enrollment Window**
2. Set dates, link to case, select available plans
3. Activate window → Send Invitations
4. Monitor participation daily — send reminders as needed
5. When participation target met or window closes: Complete Enrollment
6. **Case advances to Enrollment Complete**

---

## Phase 7: Install and Activate
1. Coordinate carrier installation — provide signed enrollment forms
2. Carrier confirms coverage setup
3. **Advance case through Install In Progress → Active**
4. Case is now Active. Group is covered. ✅`
      },

      // ── HOWTO: HANDLE RENEWAL ─────────────────────────────────────────────
      {
        topic_code: "HOWTO_RENEWAL",
        topic_title: "How-To: Manage an Annual Renewal",
        topic_type: "how_to", module_code: "RENEWALS", sort_order: 850,
        topic_summary: "Step-by-step guide for managing an annual renewal from rate receipt through completed re-enrollment.",
        search_keywords: "how to manage renewal, annual renewal steps, renewal workflow, renewal from start to finish, how to process renewal, rate change, renewal quote, renewal proposal, re-enrollment",
        topic_body: `# How-To: Manage an Annual Renewal

## When to Start
90 days before renewal date. Renewals → filter Upcoming within 90 days.

---

## Step 1: Receive Carrier Renewal Rates (90 days out)
1. Obtain renewal rates from carrier (email/carrier portal)
2. Open renewal record → Edit → enter **Rate Change %**
3. System recalculates Disruption Score automatically
4. Review Disruption Score — determines urgency and approach

---

## Step 2: Update Census (80 days out)
1. Request updated census from employer (new hires, terminations, dependent changes)
2. Upload new census version in Census module
3. Re-run GradientAI analysis — compare risk to prior year
4. Document any notable population changes

---

## Step 3: Build Renewal Quote Scenarios (70 days out)
1. Quotes → New Scenario → name clearly (e.g., "2026 Renewal — Current Plans")
2. Enter current plans with new carrier rates
3. Create alternative scenarios: keep current plans | alternative plans | cost-reduction option
4. Include year-over-year comparison in modeling
5. Note ACA affordability status with new rates

---

## Step 4: Prepare Renewal Proposal (60 days out)
1. Create proposal from best renewal scenario
2. Proposal should include: current vs. renewal rate comparison, disruption analysis, recommendation letter
3. Send proposal to employer
4. Schedule call to walk employer through options (especially for high-disruption groups)

---

## Step 5: Employer Decision (45 days out)
1. Employer reviews and approves selected plan(s)
2. If negotiating with carrier on rates: hold proposal as draft until final rates confirmed
3. If changing plans: update quote scenario, revise proposal, resend

---

## Step 6: Re-Enrollment (30 days out, if plan changes)
If plans or rates change significantly:
1. Create new Enrollment Window (renewal enrollment)
2. Notify employees of changes
3. Run full re-enrollment workflow
4. Collect DocuSign forms for plan changes

If no plan changes: confirm continuation with employees (simplified process).

---

## Step 7: Renewal Complete
1. Carrier confirms renewed coverage
2. Advance case → Renewed
3. Close Renewal Cycle in Renewals module
4. Create new Renewal Cycle for next year's renewal`
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
    return Response.json({ success: true, seed: "faq_bank", created, updated, total: topics.length, errors });
  } catch (error) {
    console.error('[function' + '] error:', error.message, error.stack);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});