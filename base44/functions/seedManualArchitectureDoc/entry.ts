/**
 * seedManualArchitectureDoc
 * Seeds the Manual Architecture Document — the master inventory of all
 * documentation topics, their structure, and the HelpAI knowledge map.
 * Also seeds the Quick Reference Cards for each module.
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

      // ── MASTER ARCHITECTURE DOCUMENT ─────────────────────────────────────
      {
        topic_code: "ARCH_MANUAL_INVENTORY",
        topic_title: "Manual Architecture & Documentation Inventory",
        topic_type: "reference", module_code: null, sort_order: 50,
        topic_summary: "Complete inventory of all documentation topics in the ConnectQuote 360 Application Manual — organized by type, module, chapter, and HelpAI retrieval priority.",
        search_keywords: "manual architecture, documentation inventory, topic list, chapters list, all documentation, manual structure, help system architecture, documentation map, what documentation exists, help content inventory",
        topic_body: `# Manual Architecture & Documentation Inventory
## ConnectQuote 360 — Application Operations Manual

---

## Document Architecture Overview

The ConnectQuote 360 documentation system is structured in four layers:

| Layer | Type | Purpose | HelpAI Priority |
|---|---|---|---|
| **Layer 1** | Contextual Help (HelpContent) | Field/button-level inline guidance | Highest |
| **Layer 2** | Page Guides (HelpManualTopic) | How to use each screen | High |
| **Layer 3** | Module Guides / Chapters | Deep module knowledge | High |
| **Layer 4** | Workflows / How-Tos / FAQs | Process guidance | Medium |
| **Layer 5** | Glossary / Reference | Term definitions | Lower |

---

## Chapter Inventory (Module Guides)

| Chapter | Topic Code | Title | Module | Status |
|---|---|---|---|---|
| 1 | CH1_APP_OVERVIEW | Application Overview | Global | Published |
| 2 | CH2_MODULES_OVERVIEW | Module Overview | Global | Published |
| 3 | CH3_CASES_MODULE | Cases Module: Complete Guide | CASES | Published |
| 4 | CH4_CENSUS_MODULE | Census Module: Complete Guide | CENSUS | Published |
| 5 | CH5_QUOTES_MODULE | Quotes Module: Complete Guide | QUOTES | Published |
| 6 | CH6_PROPOSALS_MODULE | Proposals Module: Complete Guide | PROPOSALS | Published |
| 7 | CH7_ENROLLMENT_MODULE | Enrollment Module: Complete Guide | ENROLLMENT | Published |
| 8 | CH8_RENEWALS_MODULE | Renewals Module: Complete Guide | RENEWALS | Published |
| 9 | CH9_PLANS_MODULE | Plan Library: Complete Guide | PLANS | Published |
| 10 | CH10_POLICYMATCH | PolicyMatchAI: Complete Guide | POLICYMATCH | Published |
| 11 | CH11_EXCEPTIONS_MODULE | Exceptions Module: Complete Guide | EXCEPTIONS | Published |
| 12 | CH12_CONTRIBUTIONS_MODULE | Contribution Modeling: Complete Guide | CONTRIBUTIONS | Published |
| 13 | CH13_DASHBOARD | Dashboard: Complete Guide | DASHBOARD | Published |
| 14 | CH14_SETTINGS_ADMIN | Settings & Administration: Complete Guide | SETTINGS | Published |
| 15 | CH15_EMPLOYEE_PORTAL | Employee Portal: Complete Guide | PORTALS | Published |
| 16 | CH16_EMPLOYER_PORTAL | Employer Portal: Complete Guide | PORTALS | Published |
| 17 | CH17_WORKFLOWS | Workflow Reference Guide | Global | Published |
| 18 | CH18_TROUBLESHOOTING | Troubleshooting & FAQ | Global | Published |
| 19 | CH19_GLOSSARY | Glossary of Terms | Global | Published |
| 20 | CH20_TASKS_MODULE | Tasks Module: Complete Guide | TASKS | Published |
| 21 | EMPLOYERS_MODULE_GUIDE | Employers Module: Complete Guide | EMPLOYERS | Published |
| — | HELPAI_RETRIEVAL_INDEX | HelpAI Knowledge Index & Retrieval Config | Global | Published |

---

## Page Guide Inventory

| Topic Code | Page | Module | Status |
|---|---|---|---|
| PG_DASHBOARD | Dashboard | DASHBOARD | Published |
| PG_CASES_LIST | Cases List | CASES | Published |
| PG_CASE_DETAIL | Case Detail | CASES | Published |
| PG_CENSUS | Census | CENSUS | Published |
| PG_QUOTES | Quotes | QUOTES | Published |
| PG_PROPOSALS | Proposals | PROPOSALS | Published |
| PG_ENROLLMENT | Enrollment | ENROLLMENT | Published |
| PG_RENEWALS | Renewals | RENEWALS | Published |
| PG_PLAN_LIBRARY | Plan Library | PLANS | Published |
| PG_EXCEPTIONS | Exception Queue | EXCEPTIONS | Published |
| PG_POLICYMATCH | PolicyMatchAI | POLICYMATCH | Published |

---

## Workflow Guide Inventory

| Topic Code | Workflow | Status |
|---|---|---|
| CH17_WORKFLOWS | All Major Workflows (Case, Census, Proposal, Enrollment, Renewal) | Published |
| HOWTO_NEW_CASE_END_TO_END | How-To: New Business Case (End to End) | Published |
| HOWTO_RENEWAL | How-To: Annual Renewal | Published |

---

## FAQ Bank Inventory

| Topic Code | Subject Area | Status |
|---|---|---|
| FAQ_CASES | Cases FAQ | Published |
| FAQ_CENSUS | Census FAQ | Published |
| FAQ_ENROLLMENT | Enrollment FAQ | Published |
| FAQ_PROPOSALS | Proposals FAQ | Published |
| FAQ_ADMIN | Administration FAQ | Published |
| FAQ_PLANS | Plan Library FAQ | Published |
| CH18_TROUBLESHOOTING | Troubleshooting (all modules) | Published |

---

## Reference Inventory

| Topic Code | Title | Status |
|---|---|---|
| CH19_GLOSSARY | Glossary of Terms (40+ terms) | Published |
| HELPAI_RETRIEVAL_INDEX | HelpAI Knowledge Index | Published |
| ARCH_MANUAL_INVENTORY | This document — Architecture Inventory | Published |
| QR_CASES | Quick Reference: Cases | Published |
| QR_CENSUS | Quick Reference: Census | Published |
| QR_ENROLLMENT | Quick Reference: Enrollment | Published |
| QR_RENEWALS | Quick Reference: Renewals | Published |
| QR_STAGES | Quick Reference: All Stage Codes | Published |

---

## HelpAI Knowledge Map

When a user asks HelpAI a question, it searches this knowledge base using the following retrieval cascade:

\`\`\`
User Question
     │
     ▼
1. HelpContent (exact target match for current page/field)
     │ not found or low confidence
     ▼
2. HelpManualTopic — topic_type: page_guide (for current page)
     │
     ▼
3. HelpManualTopic — topic_type: workflow_guide / how_to
     │
     ▼
4. HelpManualTopic — topic_type: module_guide (for current module)
     │
     ▼
5. HelpManualTopic — topic_type: faq / troubleshooting
     │
     ▼
6. HelpManualTopic — topic_type: reference (glossary, architecture)
     │
     ▼
7. Low confidence → flag for admin review
\`\`\`

---

## Documentation Maintenance Schedule

| Activity | Frequency | Owner |
|---|---|---|
| Review FAQ bank for new questions | Monthly | Help Admin |
| Update module guides after feature releases | On release | Help Admin |
| Review HelpAI low-confidence log | Weekly | Help Admin |
| Run coverage snapshot | Monthly | Help Admin |
| Update glossary for new terms | Quarterly | Help Admin |
| Re-seed manual after major updates | On major release | Help Admin |

---

## Seed Function Reference

| Function | Contents | Chapters |
|---|---|---|
| seedApplicationManualPart1 | Chapters 1–10 | App Overview through PolicyMatchAI |
| seedApplicationManualPart2 | Chapters 11–21 + HelpAI Index | Exceptions through Employers + HelpAI |
| seedManualPageGuides | Page Guides | All major pages |
| seedManualFAQBank | FAQ Bank + How-To Guides | All modules + workflows |
| seedManualArchitectureDoc | Architecture Doc + Quick Reference Cards | This doc + QR cards |
| seedHelpContent | Contextual Help | All UI targets (field-level) |
| seedDashboardHelp | Dashboard Help | Dashboard-specific contextual help |`
      },

      // ── QUICK REFERENCE CARDS ────────────────────────────────────────────
      {
        topic_code: "QR_STAGES",
        topic_title: "Quick Reference: All Case & Enrollment Stage Codes",
        topic_type: "reference", module_code: null, sort_order: 55,
        topic_summary: "Quick reference for all stage values used across Cases, Enrollment Windows, Renewal Cycles, Proposals, and DocuSign.",
        search_keywords: "stage codes, all stages, case stages, enrollment stages, renewal stages, proposal status codes, DocuSign status codes, stage values, status reference, what are all the stages",
        topic_body: `# Quick Reference: All Stage & Status Codes

## Case Stages (BenefitCase.stage)
| Stage Code | Display Name | Meaning |
|---|---|---|
| draft | Draft | Initial setup |
| census_in_progress | Census In Progress | Collecting employee data |
| census_validated | Census Validated | Data clean, ready for rating |
| ready_for_quote | Ready for Quote | Awaiting scenario creation |
| quoting | Quoting | Building quote scenarios |
| proposal_ready | Proposal Ready | Preparing proposal |
| employer_review | Employer Review | Proposal sent to employer |
| approved_for_enrollment | Approved for Enrollment | Employer approved |
| enrollment_open | Enrollment Open | Employees enrolling |
| enrollment_complete | Enrollment Complete | All elections received |
| install_in_progress | Install In Progress | Carrier setup underway |
| active | Active | Coverage in effect |
| renewal_pending | Renewal Pending | Renewal cycle initiated |
| renewed | Renewed | Renewal completed |
| closed | Closed | Case terminated |

## Enrollment Window Status (EnrollmentWindow.status)
| Code | Meaning |
|---|---|
| planned | Created, not yet open |
| open | Accepting employee elections |
| in_progress | Active with partial completions |
| completed | Window closed, all elections finalized |
| closed | Administratively closed |

## Employee Enrollment Status (EmployeeEnrollment.status)
| Code | Meaning |
|---|---|
| invited | Invitation sent, not started |
| started | Employee has begun enrollment wizard |
| completed | All elections made and submitted |
| waived | Employee declined coverage |

## DocuSign Envelope Status
| Code | Meaning |
|---|---|
| not_sent | Envelope not yet created |
| sent | Sent to employee's email |
| delivered | Employee opened the email |
| completed | Employee signed |
| declined | Employee declined to sign |
| voided | Envelope voided (can resend) |

## Proposal Status
| Code | Meaning |
|---|---|
| draft | Being prepared |
| sent | Delivered to employer |
| viewed | Employer opened it |
| employer_review | Employer actively reviewing |
| approved | Employer approved |
| rejected | Employer rejected |
| expired | Passed expiration without action |

## Census Validation Status
| Code | Meaning |
|---|---|
| not_started | No census uploaded |
| uploaded | File received, pending review |
| validated | All critical errors resolved |
| issues_found | Critical errors require action |

## Quote Scenario Status
| Code | Meaning |
|---|---|
| draft | Being built |
| in_review | Under team review |
| final | Finalized for proposal |

## Renewal Cycle Status
| Code | Meaning |
|---|---|
| upcoming | Renewal identified, not yet started |
| in_review | Rates received, being analyzed |
| requoting | Building renewal quote scenarios |
| proposal_ready | Renewal proposal being prepared |
| employer_review | Renewal proposal sent |
| approved | Employer approved renewal |
| enrollment_open | Re-enrollment window open |
| complete | Renewal finalized |`
      },

      {
        topic_code: "QR_CASES",
        topic_title: "Quick Reference: Cases",
        topic_type: "reference", module_code: "CASES", sort_order: 360,
        topic_summary: "One-page quick reference for the Cases module — key fields, stage prerequisite checklist, and common actions.",
        search_keywords: "cases quick reference, case cheat sheet, case stages checklist, case fields list, advance stage checklist, case actions",
        topic_body: `# Quick Reference: Cases

## Create a Case
Cases → + New Case → Employer Group + Case Type + Effective Date + Priority + Assigned To → Save

## Stage Advancement Checklist
| To Advance To… | You Need… |
|---|---|
| Census In Progress | Employer confirmed, effective date set |
| Census Validated | Census uploaded, all critical errors resolved |
| Ready for Quote | Census validated ✓ |
| Quoting | At least 1 quote scenario created |
| Proposal Ready | Scenario finalized |
| Employer Review | Proposal sent via Send Proposal |
| Approved for Enrollment | Employer approval in Employer Portal |
| Enrollment Open | Enrollment window created and activated |
| Enrollment Complete | All employees enrolled/waived, DocuSign done |
| Install In Progress | Enrollment Complete ✓ |
| Active | Carrier install confirmed |
| Renewal Pending | Active group, renewal date approaching |
| Renewed | Renewal cycle completed |

## Key Case Fields
| Field | Notes |
|---|---|
| Case Number | Auto-generated — format: CQ-YYYY-NNNN |
| Case Type | new_business / renewal / mid_year_change / takeover |
| Priority | low / normal / high / urgent |
| Products Requested | Array: Medical, Dental, Vision, Life, STD, LTD, etc. |
| Stage | See stage list above |
| Assigned To | User email of broker/rep |

## Common Actions
- Edit core fields: Case Detail → Edit Case button
- View full history: Case Detail → Activity Tab
- Add a task: Case Detail → Tasks Tab → + Add Task
- Upload documents: Case Detail → Documents Tab → Upload
- Add a note: Case Detail → Activity Tab → Add Note
- Close case: Case Detail → Close Case button (admin confirm required)`
      },

      {
        topic_code: "QR_CENSUS",
        topic_title: "Quick Reference: Census",
        topic_type: "reference", module_code: "CENSUS", sort_order: 460,
        topic_summary: "One-page quick reference for census upload — required columns, valid coverage tier values, common errors, and validation status meanings.",
        search_keywords: "census quick reference, census cheat sheet, census required columns, census valid values, census error codes, census validation status",
        topic_body: `# Quick Reference: Census

## Upload Steps
1. Census page → select case → Upload Census → select file
2. Review column mapping → confirm
3. Review validation results → fix critical errors
4. Re-upload or edit inline until status = Validated

## Required Columns (exact headers)
\`Employee Name\` | \`Date of Birth\` (MM/DD/YYYY) | \`Gender\` (Male/Female/Other) | \`Employment Status\` (Full-Time/Part-Time) | \`Coverage Tier\` | \`ZIP Code\` | \`Hire Date\`

## Valid Coverage Tier Values (EXACT)
- \`Employee Only\`
- \`Employee+Spouse\`
- \`Employee+Children\`
- \`Family\`

## Validation Status Meanings
| Status | Meaning | Can Advance? |
|---|---|---|
| not_started | No file uploaded | ❌ |
| uploaded | Uploaded, validation pending | ❌ |
| issues_found | Critical errors present | ❌ |
| validated | Clean, ready for quoting | ✅ |

## Most Common Errors & Fixes
| Error | Fix |
|---|---|
| Invalid Coverage Tier | Use exact values above |
| Missing Date of Birth | Add DOB for all rows |
| Duplicate Employee | Remove or verify duplicate rows |
| Age Out of Range | Verify birth year (common: 19xx vs 20xx typo) |
| Invalid ZIP Code | Check 5-digit ZIP, no leading spaces |

## GradientAI Risk Scores
| Score | Risk | Suggested Action |
|---|---|---|
| 0–25 | Very Low | Standard plans |
| 26–50 | Low | Standard approach |
| 51–75 | Moderate | Discuss plan options with employer |
| 76–85 | High | Consider richer plans, higher contribution |
| 86–100 | Very High | Pre-screen with carriers, specialized underwriting |`
      },

      {
        topic_code: "QR_ENROLLMENT",
        topic_title: "Quick Reference: Enrollment",
        topic_type: "reference", module_code: "ENROLLMENT", sort_order: 760,
        topic_summary: "One-page quick reference for enrollment — window setup, invitation checklist, participation formula, DocuSign statuses.",
        search_keywords: "enrollment quick reference, enrollment cheat sheet, participation rate formula, DocuSign status codes, enrollment window fields, enrollment checklist",
        topic_body: `# Quick Reference: Enrollment

## Create Enrollment Window Checklist
- [ ] Case is in Approved for Enrollment stage
- [ ] Census has employee email addresses
- [ ] Plans confirmed and active in Plan Library
- [ ] Window dates set (start/end)
- [ ] Effective date confirmed with carrier

## Enrollment Window Setup
1. Enrollment → Create Enrollment Window
2. Fill: Name | Start Date | End Date | Case | Effective Date | Available Plans
3. Activate → Send Invitations

## Participation Rate Formula
\`\`\`
(Completed + Waived) ÷ Total Invited × 100 = Participation %
\`\`\`
**Target: 75%+** (most carriers). Below 75% = carrier may reject submission.

## Member Statuses
| Status | Meaning | Action |
|---|---|---|
| invited | Email sent, not started | Resend if >3 days |
| started | In wizard, not done | Follow up |
| completed | All elections submitted | ✅ |
| waived | Declined coverage | ✅ (counts as done) |

## DocuSign Status Guide
| Status | Meaning | Action |
|---|---|---|
| not_sent | Form not yet generated | Wait for election completion |
| sent | Email sent to employee | Wait |
| delivered | Employee opened email | Wait |
| completed | Signed ✅ | None needed |
| declined | Employee declined | Void & resend |
| voided | Voided, new one needed | Resend |

## After Window Closes
1. Review final participation % with carrier minimums
2. Confirm all DocuSign envelopes are completed
3. Export enrollment report (PDF/CSV)
4. Advance case → Enrollment Complete
5. Begin carrier install coordination`
      },

      {
        topic_code: "QR_RENEWALS",
        topic_title: "Quick Reference: Renewals",
        topic_type: "reference", module_code: "RENEWALS", sort_order: 860,
        topic_summary: "One-page quick reference for renewals — disruption score scale, renewal stages, rate change thresholds, and action timeline.",
        search_keywords: "renewals quick reference, renewals cheat sheet, disruption score scale, renewal stages, rate change threshold, renewal timeline, renewal action checklist",
        topic_body: `# Quick Reference: Renewals

## Renewal Timeline (from renewal date)
| Days Before | Action |
|---|---|
| 90 days | Identify upcoming renewals. Request carrier rates. |
| 80 days | Update census with new hires/terms. |
| 70 days | Build renewal quote scenarios with new rates. |
| 60 days | Prepare and send renewal proposal. |
| 45 days | Employer decision deadline. |
| 30 days | Create renewal enrollment window (if plan changes). |
| 15 days | Complete re-enrollment. |
| 0 days | Renewal effective. Confirm with carrier. |

## Disruption Score Action Guide
| Score | Risk | Action |
|---|---|---|
| 0–25 | Low | Standard renewal communication |
| 26–50 | Moderate | Detailed employer briefing |
| 51–75 | High | Alternatives analysis, employer call |
| 76–100 | Very High | Executive outreach, market re-shop |

## Rate Change Thresholds
| Rate Change | Employer Response |
|---|---|
| 0–5% | Usually accepted without negotiation |
| 5–10% | Discuss with employer, present options |
| 10–15% | Strong alternatives analysis required |
| 15%+ | Full market re-shop recommended |

## Renewal Stages
Upcoming → In Review → Requoting → Proposal Ready → Employer Review → Approved → Enrollment Open → Complete

## Key Calculations
**Disruption Score** — AI-calculated. Updates automatically when rate change % is entered.
**Days to Renewal** — Auto-calculated from renewal date on Employer Group record.`
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
    return Response.json({ success: true, seed: "architecture_doc", created, updated, total: topics.length, errors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});