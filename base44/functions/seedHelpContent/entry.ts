import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Full registry with canonical field names
const HELP_TARGETS = [
  { target_code:"DASHBOARD.PAGE", module_code:"DASHBOARD", page_code:"DASHBOARD", target_type:"page", target_label:"Dashboard Page" },
  { target_code:"DASHBOARD.KPI.ACTIVE_CASES", module_code:"DASHBOARD", page_code:"DASHBOARD", target_type:"card", target_label:"Active Cases KPI" },
  { target_code:"DASHBOARD.KPI.ENROLLMENTS", module_code:"DASHBOARD", page_code:"DASHBOARD", target_type:"card", target_label:"Open Enrollments KPI" },
  { target_code:"DASHBOARD.KPI.RENEWALS", module_code:"DASHBOARD", page_code:"DASHBOARD", target_type:"card", target_label:"Upcoming Renewals KPI" },
  { target_code:"DASHBOARD.PIPELINE", module_code:"DASHBOARD", page_code:"DASHBOARD", target_type:"section", target_label:"Case Pipeline View" },
  { target_code:"DASHBOARD.QUICK_ACTIONS", module_code:"DASHBOARD", page_code:"DASHBOARD", target_type:"action", target_label:"Quick Actions Panel" },
  { target_code:"DASHBOARD.PRIORITIES", module_code:"DASHBOARD", page_code:"DASHBOARD", target_type:"section", target_label:"Today's Priorities" },
  { target_code:"CASES.PAGE", module_code:"CASES", page_code:"CASES", target_type:"page", target_label:"Cases List Page" },
  { target_code:"CASES.STAGE_FILTER", module_code:"CASES", page_code:"CASES", target_type:"filter", target_label:"Stage Filter" },
  { target_code:"CASES.NEW_CASE_BTN", module_code:"CASES", page_code:"CASES", target_type:"button", target_label:"New Case Button" },
  { target_code:"CASES.DETAIL.PAGE", module_code:"CASES", page_code:"CASE_DETAIL", target_type:"page", target_label:"Case Detail Page" },
  { target_code:"CASES.DETAIL.STAGE", module_code:"CASES", page_code:"CASE_DETAIL", target_type:"status", target_label:"Case Stage" },
  { target_code:"CASES.DETAIL.ADVANCE_BTN", module_code:"CASES", page_code:"CASE_DETAIL", target_type:"button", target_label:"Advance Stage Button" },
  { target_code:"CASES.STAGES.DRAFT", module_code:"CASES", page_code:"CASE_DETAIL", target_type:"workflow_step", target_label:"Draft Stage" },
  { target_code:"CASES.STAGES.CENSUS", module_code:"CASES", page_code:"CASE_DETAIL", target_type:"workflow_step", target_label:"Census In Progress Stage" },
  { target_code:"CASES.STAGES.QUOTING", module_code:"CASES", page_code:"CASE_DETAIL", target_type:"workflow_step", target_label:"Quoting Stage" },
  { target_code:"CASES.STAGES.PROPOSAL", module_code:"CASES", page_code:"CASE_DETAIL", target_type:"workflow_step", target_label:"Proposal Ready Stage" },
  { target_code:"CASES.STAGES.ENROLLMENT", module_code:"CASES", page_code:"CASE_DETAIL", target_type:"workflow_step", target_label:"Enrollment Open Stage" },
  { target_code:"CASES.STAGES.ACTIVE", module_code:"CASES", page_code:"CASE_DETAIL", target_type:"workflow_step", target_label:"Active Stage" },
  { target_code:"CENSUS.PAGE", module_code:"CENSUS", page_code:"CENSUS", target_type:"page", target_label:"Census Page" },
  { target_code:"CENSUS.UPLOAD_BTN", module_code:"CENSUS", page_code:"CENSUS", target_type:"button", target_label:"Upload Census Button" },
  { target_code:"CENSUS.VALIDATION", module_code:"CENSUS", page_code:"CENSUS", target_type:"section", target_label:"Census Validation Panel" },
  { target_code:"CENSUS.MEMBER_TABLE", module_code:"CENSUS", page_code:"CENSUS", target_type:"grid", target_label:"Census Member Table" },
  { target_code:"CENSUS.GRADIENT_AI", module_code:"CENSUS", page_code:"CENSUS", target_type:"section", target_label:"GradientAI Risk Analysis" },
  { target_code:"QUOTES.PAGE", module_code:"QUOTES", page_code:"QUOTES", target_type:"page", target_label:"Quotes Page" },
  { target_code:"QUOTES.NEW_SCENARIO", module_code:"QUOTES", page_code:"QUOTES", target_type:"button", target_label:"New Scenario Button" },
  { target_code:"QUOTES.CONTRIBUTION", module_code:"QUOTES", page_code:"QUOTES", target_type:"section", target_label:"Contribution Strategy" },
  { target_code:"QUOTES.KPI_TOTAL_PREMIUM", module_code:"QUOTES", page_code:"QUOTES", target_type:"card", target_label:"Total Monthly Premium KPI" },
  { target_code:"PROPOSALS.PAGE", module_code:"PROPOSALS", page_code:"PROPOSALS", target_type:"page", target_label:"Proposal Builder Page" },
  { target_code:"PROPOSALS.STATUS.DRAFT", module_code:"PROPOSALS", page_code:"PROPOSALS", target_type:"status", target_label:"Proposal Draft Status" },
  { target_code:"PROPOSALS.STATUS.SENT", module_code:"PROPOSALS", page_code:"PROPOSALS", target_type:"status", target_label:"Proposal Sent Status" },
  { target_code:"PROPOSALS.STATUS.APPROVED", module_code:"PROPOSALS", page_code:"PROPOSALS", target_type:"status", target_label:"Proposal Approved Status" },
  { target_code:"PROPOSALS.SEND_BTN", module_code:"PROPOSALS", page_code:"PROPOSALS", target_type:"button", target_label:"Send Proposal Button" },
  { target_code:"ENROLLMENT.PAGE", module_code:"ENROLLMENT", page_code:"ENROLLMENT", target_type:"page", target_label:"Enrollment Page" },
  { target_code:"ENROLLMENT.WINDOW", module_code:"ENROLLMENT", page_code:"ENROLLMENT", target_type:"card", target_label:"Enrollment Window Card" },
  { target_code:"ENROLLMENT.PARTICIPATION", module_code:"ENROLLMENT", page_code:"ENROLLMENT", target_type:"card", target_label:"Participation Rate" },
  { target_code:"ENROLLMENT.MEMBER_TABLE", module_code:"ENROLLMENT", page_code:"ENROLLMENT", target_type:"grid", target_label:"Enrollment Member Table" },
  { target_code:"RENEWALS.PAGE", module_code:"RENEWALS", page_code:"RENEWALS", target_type:"page", target_label:"Renewals Page" },
  { target_code:"RENEWALS.PIPELINE", module_code:"RENEWALS", page_code:"RENEWALS", target_type:"section", target_label:"Renewal Pipeline" },
  { target_code:"RENEWALS.DISRUPTION_SCORE", module_code:"RENEWALS", page_code:"RENEWALS", target_type:"field", target_label:"Disruption Score" },
  { target_code:"RENEWALS.RATE_CHANGE", module_code:"RENEWALS", page_code:"RENEWALS", target_type:"field", target_label:"Rate Change %" },
  { target_code:"PLANS.PAGE", module_code:"PLANS", page_code:"PLANS", target_type:"page", target_label:"Plan Library Page" },
  { target_code:"PLANS.COMPARE", module_code:"PLANS", page_code:"PLANS", target_type:"action", target_label:"Plan Comparison Tool" },
  { target_code:"PLANS.NETWORK_TYPE", module_code:"PLANS", page_code:"PLANS", target_type:"field", target_label:"Network Type Field" },
  { target_code:"PLANS.DEDUCTIBLE", module_code:"PLANS", page_code:"PLANS", target_type:"field", target_label:"Deductible Field" },
  { target_code:"PLANS.OOP_MAX", module_code:"PLANS", page_code:"PLANS", target_type:"field", target_label:"Out-of-Pocket Maximum" },
  { target_code:"PLANS.HSA_ELIGIBLE", module_code:"PLANS", page_code:"PLANS", target_type:"toggle", target_label:"HSA Eligible Flag" },
  { target_code:"POLICYMATCH.PAGE", module_code:"POLICYMATCH", page_code:"POLICYMATCH", target_type:"page", target_label:"PolicyMatchAI Page" },
  { target_code:"POLICYMATCH.RISK_TIER", module_code:"POLICYMATCH", page_code:"POLICYMATCH", target_type:"badge", target_label:"Risk Tier" },
  { target_code:"POLICYMATCH.RISK_SCORE", module_code:"POLICYMATCH", page_code:"POLICYMATCH", target_type:"field", target_label:"Risk Score" },
  { target_code:"POLICYMATCH.VALUE_SCORE", module_code:"POLICYMATCH", page_code:"POLICYMATCH", target_type:"field", target_label:"Value Score" },
  { target_code:"EMPLOYERS.PAGE", module_code:"EMPLOYERS", page_code:"EMPLOYERS", target_type:"page", target_label:"Employer Groups Page" },
  { target_code:"EMPLOYERS.STATUS", module_code:"EMPLOYERS", page_code:"EMPLOYERS", target_type:"status", target_label:"Employer Status" },
  { target_code:"TASKS.PAGE", module_code:"TASKS", page_code:"TASKS", target_type:"page", target_label:"Tasks Page" },
  { target_code:"TASKS.PRIORITY", module_code:"TASKS", page_code:"TASKS", target_type:"badge", target_label:"Task Priority" },
  { target_code:"TASKS.STATUS", module_code:"TASKS", page_code:"TASKS", target_type:"status", target_label:"Task Status" },
  { target_code:"CONTRIBUTIONS.PAGE", module_code:"CONTRIBUTIONS", page_code:"CONTRIBUTIONS", target_type:"page", target_label:"Contribution Modeling Page" },
  { target_code:"CONTRIBUTIONS.STRATEGY", module_code:"CONTRIBUTIONS", page_code:"CONTRIBUTIONS", target_type:"select_option", target_label:"Contribution Strategy" },
  { target_code:"CONTRIBUTIONS.ACA_FLAG", module_code:"CONTRIBUTIONS", page_code:"CONTRIBUTIONS", target_type:"badge", target_label:"ACA Affordability Flag" },
  { target_code:"EXCEPTIONS.PAGE", module_code:"EXCEPTIONS", page_code:"EXCEPTIONS", target_type:"page", target_label:"Exception Queue Page" },
  { target_code:"EXCEPTIONS.SEVERITY", module_code:"EXCEPTIONS", page_code:"EXCEPTIONS", target_type:"badge", target_label:"Exception Severity" },
  { target_code:"EXCEPTIONS.STATUS", module_code:"EXCEPTIONS", page_code:"EXCEPTIONS", target_type:"status", target_label:"Exception Status" },
  { target_code:"SETTINGS.PAGE", module_code:"SETTINGS", page_code:"SETTINGS", target_type:"page", target_label:"Settings Page" },
  { target_code:"SETTINGS.ORGANIZATION", module_code:"SETTINGS", page_code:"SETTINGS", target_type:"section", target_label:"Organization Settings" },
  { target_code:"SETTINGS.INTEGRATIONS", module_code:"SETTINGS", page_code:"SETTINGS", target_type:"section", target_label:"API Integrations" },
  { target_code:"SETTINGS.FEATURES", module_code:"SETTINGS", page_code:"SETTINGS", target_type:"section", target_label:"Feature Toggles" },
  { target_code:"SETTINGS.TEAM", module_code:"SETTINGS", page_code:"SETTINGS", target_type:"section", target_label:"Team Management" },
  { target_code:"EE_PORTAL.PAGE", module_code:"PORTALS", page_code:"EE_PORTAL", target_type:"page", target_label:"Employee Portal Page" },
  { target_code:"EE_PORTAL.PLAN_SELECTION", module_code:"PORTALS", page_code:"EE_PORTAL", target_type:"section", target_label:"Plan Selection Step" },
  { target_code:"EE_PORTAL.COVERAGE_TIER", module_code:"PORTALS", page_code:"EE_PORTAL", target_type:"radio_option", target_label:"Coverage Tier Selection" },
  { target_code:"EE_PORTAL.WAIVER", module_code:"PORTALS", page_code:"EE_PORTAL", target_type:"action", target_label:"Waive Coverage Action" },
  { target_code:"ER_PORTAL.PAGE", module_code:"PORTALS", page_code:"ER_PORTAL", target_type:"page", target_label:"Employer Portal Page" },
  { target_code:"ER_PORTAL.PROPOSAL_REVIEW", module_code:"PORTALS", page_code:"ER_PORTAL", target_type:"section", target_label:"Proposal Review Panel" },
];

// Seed content using canonical field names
const SEED_CONTENT = {
  "DASHBOARD.PAGE": {
    help_title: "Dashboard — Your Command Center",
    short_help_text: "The Dashboard gives you a real-time overview of your entire benefits book of business.",
    detailed_help_text: "## Dashboard Overview\n\nThe Dashboard is your central hub for monitoring all active cases, upcoming renewals, open enrollments, and priority tasks.\n\n### Key Sections\n- **KPI Cards** — Live counts of active cases, open enrollments, and upcoming renewals\n- **Pipeline View** — Visual case stage distribution across your book\n- **Today's Priorities** — Urgent items requiring immediate attention\n- **Quick Actions** — Shortcuts to the most common workflows",
    expected_user_action_text: "Review your daily priorities each morning. Click any KPI card to drill into the underlying records.",
    warnings_text: "Data on the Dashboard is refreshed in near real-time. Some counts may lag by up to 2 minutes during heavy processing.",
    search_keywords: "dashboard, overview, kpi, pipeline, priorities, home",
  },
  "CASES.DETAIL.STAGE": {
    help_title: "Case Stage",
    short_help_text: "The current lifecycle stage of this benefits case, from Draft through Active.",
    detailed_help_text: "## Case Stage\n\nEvery case moves through a defined set of lifecycle stages. The current stage controls which actions are available.\n\n### Stage Flow\n1. **Draft** → 2. **Census In Progress** → 3. **Census Validated** → 4. **Ready for Quote** → 5. **Quoting** → 6. **Proposal Ready** → 7. **Employer Review** → 8. **Approved for Enrollment** → 9. **Enrollment Open** → 10. **Active**",
    expected_user_action_text: "Use the 'Advance Stage' button to move the case forward. The system will validate all prerequisites before allowing stage advancement.",
    warnings_text: "Stages cannot be skipped. If a prerequisite is not met, the system will block advancement.",
    allowed_values_text: "draft, census_in_progress, census_validated, ready_for_quote, quoting, proposal_ready, employer_review, approved_for_enrollment, enrollment_open, active",
    search_keywords: "stage, lifecycle, workflow, case status, advance",
  },
  "CENSUS.GRADIENT_AI": {
    help_title: "GradientAI Risk Analysis",
    short_help_text: "AI-powered predictive risk scoring for your employee census population.",
    detailed_help_text: "## GradientAI Risk Analysis\n\nGradientAI analyzes your census data to produce predictive risk scores.\n\n### Outputs\n- **Risk Score (0-100)** — Lower is better (preferred risk)\n- **Risk Tier** — Preferred / Standard / Elevated / High\n- **Predicted Annual Claims** — Estimated annual claims cost per member\n- **Risk Factors** — Key drivers of the risk assessment",
    expected_user_action_text: "Run GradientAI analysis after census validation. Review the risk distribution before building quote scenarios.",
    warnings_text: "GradientAI predictions are statistical estimates, not guarantees. Results should supplement underwriting judgment.",
    search_keywords: "gradient ai, risk, scoring, predictive, census analysis",
  },
  "QUOTES.CONTRIBUTION": {
    help_title: "Contribution Strategy",
    short_help_text: "Defines how employer and employee costs are split for each benefit plan.",
    detailed_help_text: "## Contribution Strategy\n\n### Strategy Types\n- **Percentage** — Employer pays X% of total premium\n- **Flat Dollar** — Employer pays a fixed monthly amount\n- **Defined Contribution** — Employer sets a specific dollar budget per employee\n- **Custom** — Different rules per employee class or tier",
    expected_user_action_text: "Set your contribution strategy before running cost calculations. This directly affects employee out-of-pocket costs shown in proposals.",
    warnings_text: "ACA affordability rules require employee contributions not to exceed a specific % of household income. Use the ACA flag to verify compliance.",
    search_keywords: "contribution, employer contribution, employee cost, premium split, aca",
  },
  "ENROLLMENT.PARTICIPATION": {
    help_title: "Participation Rate",
    short_help_text: "The percentage of eligible employees who have enrolled in benefits.",
    detailed_help_text: "## Participation Rate\n\nParticipation rate = (Enrolled Employees ÷ Total Eligible Employees) × 100.\n\nMost carriers require a minimum participation rate (typically 70-75%) for small group coverage. Low participation can trigger carrier review or denial.",
    expected_user_action_text: "Monitor participation daily during open enrollment. Send reminders to pending employees. Aim for at least 75%.",
    warnings_text: "If participation drops below carrier minimums, coverage may be at risk. Contact your carrier immediately.",
    search_keywords: "participation, enrollment rate, minimum participation, carrier requirement",
  },
  "RENEWALS.DISRUPTION_SCORE": {
    help_title: "Disruption Score",
    short_help_text: "A 0–100 score measuring how significantly a renewal change will impact employees.",
    detailed_help_text: "## Disruption Score\n\n**0-25** = Minimal disruption\n**26-50** = Moderate disruption\n**51-75** = High disruption\n**76-100** = Severe disruption\n\nUse alongside rate change % to evaluate renewal options.",
    expected_user_action_text: "Use the disruption score with rate change % to evaluate renewal options. High disruption + high rate change = strong motivation to market.",
    search_keywords: "disruption, renewal, network change, plan change, impact",
  },
  "PLANS.DEDUCTIBLE": {
    help_title: "Plan Deductible",
    short_help_text: "The amount an employee pays out-of-pocket before insurance begins covering costs.",
    detailed_help_text: "## Deductible\n\nThe annual amount an employee pays for covered services before the plan starts to pay.\n\n**Individual Deductible** — Applies to one person.\n**Family Deductible** — Once the family aggregate is met, all family members are covered.",
    expected_user_action_text: "Compare deductibles across plans when building proposals. Lower deductibles generally mean higher premiums.",
    allowed_values_text: "USD amount. Common: $0 (copay plans), $500–$1,500 (standard), $1,400–$7,050 (HDHP).",
    examples_text: "A $1,000 individual deductible means the employee pays the first $1,000 of covered medical costs per plan year.",
    search_keywords: "deductible, individual deductible, family deductible, out of pocket, plan cost",
  },
  "PLANS.HSA_ELIGIBLE": {
    help_title: "HSA Eligible Flag",
    short_help_text: "Indicates whether this plan qualifies employees to open and contribute to a Health Savings Account.",
    detailed_help_text: "## HSA Eligibility\n\nFor a plan to be HSA-eligible, it must be a High Deductible Health Plan (HDHP) meeting IRS minimum deductible thresholds.\n\n**Benefits:**\n- Employees can contribute pre-tax dollars\n- Unused funds roll over year-to-year\n- Employers can also contribute to employee HSAs",
    warnings_text: "If an employee is enrolled in Medicare or another non-HDHP plan, they cannot contribute to an HSA even if enrolled in an HSA-eligible plan.",
    search_keywords: "hsa, health savings account, hdhp, tax advantaged, pre-tax",
  },
  "POLICYMATCH.RISK_TIER": {
    help_title: "Risk Tier",
    short_help_text: "A categorization of the group's overall health risk: Preferred, Standard, Elevated, or High.",
    detailed_help_text: "## Risk Tier\n\n- **Preferred** — Low predicted claims, favorable underwriting\n- **Standard** — Average risk, typical carrier pricing\n- **Elevated** — Above-average risk, potential rate loading\n- **High** — Significant risk factors, may require medical underwriting",
    expected_user_action_text: "Use risk tier in carrier selection. Elevated/High risk groups may benefit from level-funded or self-funded arrangements.",
    search_keywords: "risk tier, preferred, standard, elevated, high risk, underwriting",
  },
  "CONTRIBUTIONS.ACA_FLAG": {
    help_title: "ACA Affordability Flag",
    short_help_text: "Indicates whether the employer contribution meets ACA affordability standards.",
    detailed_help_text: "## ACA Affordability\n\nUnder the ACA, applicable large employers must offer affordable coverage. Coverage is affordable if the employee's required contribution for self-only coverage does not exceed a specific % of household income (indexed annually by IRS).\n\nIf this flag is red, the contribution strategy may expose the employer to ACA penalties.",
    warnings_text: "Non-compliance with ACA affordability rules can result in employer shared responsibility payments (ESRP). Consult legal counsel before finalizing contribution strategies for ALEs.",
    search_keywords: "aca, affordable care act, affordability, esrp, irs, employer mandate",
  },
  "EXCEPTIONS.SEVERITY": {
    help_title: "Exception Severity",
    short_help_text: "The urgency level of this exception: Low, Medium, High, or Critical.",
    detailed_help_text: "## Exception Severity Levels\n\n- **Low** — Informational; no immediate action required\n- **Medium** — Resolve within 5 business days\n- **High** — Resolve within 24–48 hours\n- **Critical** — Immediate action required; may block case progression or compliance",
    expected_user_action_text: "Triage exceptions daily. Assign Critical and High exceptions immediately.",
    search_keywords: "exception, severity, critical, high, medium, low, triage",
  },
  "EE_PORTAL.COVERAGE_TIER": {
    help_title: "Coverage Tier Selection",
    short_help_text: "Determines which family members will be covered under the selected benefit plan.",
    detailed_help_text: "## Coverage Tiers\n\n- **Employee Only** — Covers only the employee\n- **Employee + Spouse** — Employee and legal spouse/domestic partner\n- **Employee + Children** — Employee and eligible dependent children\n- **Family** — Employee, spouse, and all eligible children",
    expected_user_action_text: "Select the tier that matches your actual family situation.",
    warnings_text: "Changing tiers after enrollment requires a Qualifying Life Event (QLE). Contact HR if you need to make changes outside of open enrollment.",
    search_keywords: "coverage tier, family, employee only, spouse, children, dependents",
  },
  "EE_PORTAL.WAIVER": {
    help_title: "Waive Coverage",
    short_help_text: "Opt out of employer-sponsored benefit coverage for this enrollment period.",
    detailed_help_text: "## Waiving Coverage\n\nIf you have coverage through another source (e.g., spouse's plan, Medicare), you may waive employer-sponsored coverage.\n\n**Important:** Once you waive, you cannot enroll until the next open enrollment unless you have a Qualifying Life Event (QLE).",
    expected_user_action_text: "Only waive if you have confirmed alternative coverage. You will be asked to provide a waiver reason.",
    warnings_text: "Waiving coverage is a binding election. Ensure you have alternative coverage before submitting.",
    search_keywords: "waiver, waive, opt out, decline, alternative coverage, qle",
  },
};

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
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    let created = 0;
    let skipped = 0;

    for (const target of HELP_TARGETS) {
      const existing = await base44.asServiceRole.entities.HelpContent.filter(
        { help_target_code: target.target_code }, "-created_date", 1
      );

      if (existing.length > 0) { skipped++; continue; }

      const seedData = SEED_CONTENT[target.target_code];
      if (seedData) {
        await base44.asServiceRole.entities.HelpContent.create({
          help_target_code: target.target_code,
          module_code: target.module_code,
          page_code: target.page_code,
          content_source_type: "system_generated",
          content_status: "active",
          is_active: true,
          version_no: 1,
          language_code: "en",
          review_required: false,
          ...seedData,
        });
        created++;
      } else {
        await base44.asServiceRole.entities.HelpContent.create({
          help_target_code: target.target_code,
          module_code: target.module_code,
          page_code: target.page_code,
          content_source_type: "system_generated",
          content_status: "draft",
          is_active: true,
          version_no: 1,
          language_code: "en",
          review_required: true,
          help_title: target.target_label,
          short_help_text: `This is the ${target.target_label} in the ${target.module_code} module. Help content is pending admin review.`,
          detailed_help_text: `## ${target.target_label}\n\nDetailed help for this item has been queued for creation. An administrator can edit this content in the Help Management console.`,
          search_keywords: `${target.target_label.toLowerCase()}, ${target.module_code.toLowerCase()}, ${target.target_type}`,
        });
        created++;
      }
    }

    return Response.json({ success: true, created, skipped, total: HELP_TARGETS.length });
  } catch (error) {
    console.error('[function' + '] error:', error.message, error.stack);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});