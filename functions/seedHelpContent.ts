import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// Master registry of all targets (inline to avoid import issues in Deno)
const HELP_TARGETS = [
  { target_code:"DASHBOARD.PAGE", module_code:"DASHBOARD", page_code:"DASHBOARD", component_type:"page", target_label:"Dashboard Page" },
  { target_code:"DASHBOARD.KPI.ACTIVE_CASES", module_code:"DASHBOARD", page_code:"DASHBOARD", component_type:"card", target_label:"Active Cases KPI" },
  { target_code:"DASHBOARD.KPI.ENROLLMENTS", module_code:"DASHBOARD", page_code:"DASHBOARD", component_type:"card", target_label:"Open Enrollments KPI" },
  { target_code:"DASHBOARD.PIPELINE", module_code:"DASHBOARD", page_code:"DASHBOARD", component_type:"section", target_label:"Case Pipeline View" },
  { target_code:"CASES.PAGE", module_code:"CASES", page_code:"CASES", component_type:"page", target_label:"Cases List Page" },
  { target_code:"CASES.DETAIL.STAGE", module_code:"CASES", page_code:"CASE_DETAIL", component_type:"status", target_label:"Case Stage" },
  { target_code:"CASES.STAGES.DRAFT", module_code:"CASES", page_code:"CASE_DETAIL", component_type:"workflow_step", target_label:"Draft Stage" },
  { target_code:"CASES.STAGES.CENSUS", module_code:"CASES", page_code:"CASE_DETAIL", component_type:"workflow_step", target_label:"Census In Progress Stage" },
  { target_code:"CASES.STAGES.QUOTING", module_code:"CASES", page_code:"CASE_DETAIL", component_type:"workflow_step", target_label:"Quoting Stage" },
  { target_code:"CASES.STAGES.ENROLLMENT", module_code:"CASES", page_code:"CASE_DETAIL", component_type:"workflow_step", target_label:"Enrollment Open Stage" },
  { target_code:"CENSUS.PAGE", module_code:"CENSUS", page_code:"CENSUS", component_type:"page", target_label:"Census Page" },
  { target_code:"CENSUS.GRADIENT_AI", module_code:"CENSUS", page_code:"CENSUS", component_type:"section", target_label:"GradientAI Risk Analysis" },
  { target_code:"QUOTES.PAGE", module_code:"QUOTES", page_code:"QUOTES", component_type:"page", target_label:"Quotes Page" },
  { target_code:"QUOTES.CONTRIBUTION", module_code:"QUOTES", page_code:"QUOTES", component_type:"section", target_label:"Contribution Strategy" },
  { target_code:"PROPOSALS.PAGE", module_code:"PROPOSALS", page_code:"PROPOSALS", component_type:"page", target_label:"Proposal Builder Page" },
  { target_code:"PROPOSALS.STATUS.DRAFT", module_code:"PROPOSALS", page_code:"PROPOSALS", component_type:"status", target_label:"Proposal Draft Status" },
  { target_code:"ENROLLMENT.PAGE", module_code:"ENROLLMENT", page_code:"ENROLLMENT", component_type:"page", target_label:"Enrollment Page" },
  { target_code:"ENROLLMENT.PARTICIPATION", module_code:"ENROLLMENT", page_code:"ENROLLMENT", component_type:"card", target_label:"Participation Rate" },
  { target_code:"RENEWALS.DISRUPTION_SCORE", module_code:"RENEWALS", page_code:"RENEWALS", component_type:"field", target_label:"Disruption Score" },
  { target_code:"PLANS.DEDUCTIBLE", module_code:"PLANS", page_code:"PLANS", component_type:"field", target_label:"Deductible Field" },
  { target_code:"PLANS.OOP_MAX", module_code:"PLANS", page_code:"PLANS", component_type:"field", target_label:"Out-of-Pocket Maximum" },
  { target_code:"PLANS.HSA_ELIGIBLE", module_code:"PLANS", page_code:"PLANS", component_type:"field", target_label:"HSA Eligible Flag" },
  { target_code:"POLICYMATCH.RISK_TIER", module_code:"POLICYMATCH", page_code:"POLICYMATCH", component_type:"field", target_label:"Risk Tier" },
  { target_code:"CONTRIBUTIONS.ACA_FLAG", module_code:"CONTRIBUTIONS", page_code:"CONTRIBUTIONS", component_type:"field", target_label:"ACA Affordability Flag" },
  { target_code:"EXCEPTIONS.SEVERITY", module_code:"EXCEPTIONS", page_code:"EXCEPTIONS", component_type:"field", target_label:"Exception Severity" },
  { target_code:"EE_PORTAL.COVERAGE_TIER", module_code:"PORTALS", page_code:"EE_PORTAL", component_type:"field", target_label:"Coverage Tier Selection" },
  { target_code:"EE_PORTAL.WAIVER", module_code:"PORTALS", page_code:"EE_PORTAL", component_type:"action", target_label:"Waive Coverage Action" },
];

const SEED_CONTENT = {
  "DASHBOARD.PAGE": {
    help_title: "Dashboard — Your Command Center",
    short_help: "The Dashboard gives you a real-time overview of your entire benefits book of business.",
    detailed_help: "## Dashboard Overview\n\nThe Dashboard is your central hub for monitoring all active cases, upcoming renewals, open enrollments, and priority tasks.\n\n### Key Sections\n- **KPI Cards** — Live counts of active cases, open enrollments, and upcoming renewals\n- **Pipeline View** — Visual case stage distribution across your book\n- **Today's Priorities** — Urgent items requiring immediate attention\n- **Quick Actions** — Shortcuts to the most common workflows",
    expected_user_action: "Review your daily priorities each morning. Click any KPI card to drill into the underlying records.",
    warnings: "Data on the Dashboard is refreshed in near real-time. Some counts may lag by up to 2 minutes during heavy processing.",
  },
  "CASES.DETAIL.STAGE": {
    help_title: "Case Stage",
    short_help: "The current lifecycle stage of this benefits case, from Draft through Active.",
    detailed_help: "## Case Stage\n\nEvery case moves through a defined set of lifecycle stages. The current stage controls which actions are available and what workflows are active.\n\n### Stage Flow\n1. **Draft** → 2. **Census In Progress** → 3. **Census Validated** → 4. **Ready for Quote** → 5. **Quoting** → 6. **Proposal Ready** → 7. **Employer Review** → 8. **Approved for Enrollment** → 9. **Enrollment Open** → 10. **Active**",
    expected_user_action: "Use the 'Advance Stage' button to move the case forward. The system will validate all prerequisites before allowing stage advancement.",
    warnings: "Stages cannot be skipped. If a prerequisite is not met (e.g., census not validated), the system will block advancement.",
    allowed_values: "draft, census_in_progress, census_validated, ready_for_quote, quoting, proposal_ready, employer_review, approved_for_enrollment, enrollment_open, active",
  },
  "CENSUS.GRADIENT_AI": {
    help_title: "GradientAI Risk Analysis",
    short_help: "AI-powered predictive risk scoring for your employee census population.",
    detailed_help: "## GradientAI Risk Analysis\n\nGradientAI analyzes your census data to produce predictive risk scores for each member and the group overall.\n\n### What it produces\n- **Risk Score (0-100)** — Lower scores indicate better (preferred) risk\n- **Risk Tier** — Preferred / Standard / Elevated / High\n- **Predicted Annual Claims** — Estimated annual claims cost per member\n- **Risk Factors** — Key drivers of the risk assessment",
    expected_user_action: "Run GradientAI analysis after the census is validated. Review the risk distribution before building quote scenarios.",
    warnings: "GradientAI predictions are statistical estimates, not guarantees. Results should supplement, not replace, underwriting judgment.",
  },
  "QUOTES.CONTRIBUTION": {
    help_title: "Contribution Strategy",
    short_help: "Defines how employer and employee costs are split for each benefit plan in the scenario.",
    detailed_help: "## Contribution Strategy\n\nThe contribution strategy determines how the total premium is divided between employer and employee.\n\n### Strategy Types\n- **Percentage** — Employer pays X% of the total premium\n- **Flat Dollar** — Employer pays a fixed monthly dollar amount\n- **Defined Contribution** — Employer sets a specific dollar budget per employee\n- **Custom** — Different rules per employee class or tier",
    expected_user_action: "Set your contribution strategy before running cost calculations. This directly affects employee out-of-pocket costs shown in proposals.",
    warnings: "ACA affordability rules require employee premium contributions not to exceed a specific percentage of household income. Use the ACA flag to verify compliance.",
  },
  "ENROLLMENT.PARTICIPATION": {
    help_title: "Participation Rate",
    short_help: "The percentage of eligible employees who have enrolled in benefits.",
    detailed_help: "## Participation Rate\n\nParticipation rate = (Enrolled Employees ÷ Total Eligible Employees) × 100.\n\nMost carriers require a minimum participation rate (typically 70-75%) for small group coverage. Low participation can trigger carrier review or denial.",
    expected_user_action: "Monitor participation rate daily during open enrollment. Send reminders to pending employees. Aim for at least 75% participation.",
    warnings: "If participation drops below carrier minimums, coverage may be at risk. Contact your carrier representative immediately.",
  },
  "RENEWALS.DISRUPTION_SCORE": {
    help_title: "Disruption Score",
    short_help: "A 0–100 score measuring how significantly a renewal change will impact employees.",
    detailed_help: "## Disruption Score\n\nThe Disruption Score measures how much a renewal option will affect employees compared to their current coverage.\n\n**0-25** = Minimal disruption (plan changes are minor)\n**26-50** = Moderate disruption (some network or cost changes)\n**51-75** = High disruption (significant changes to coverage or costs)\n**76-100** = Severe disruption (major plan overhaul)",
    expected_user_action: "Use the disruption score alongside rate change % to evaluate renewal options. High disruption + high rate change = strong motivation to market.",
  },
  "PLANS.DEDUCTIBLE": {
    help_title: "Plan Deductible",
    short_help: "The amount an employee must pay out-of-pocket before the insurance plan begins covering costs.",
    detailed_help: "## Deductible\n\nThe deductible is the annual amount an employee pays for covered health care services before the insurance plan starts to pay.\n\n**Individual Deductible** — Applies to one person on the plan.\n**Family Deductible** — Once the family aggregate is met, the plan covers all family members.",
    expected_user_action: "Compare deductible amounts across plans when building comparison proposals. Lower deductibles generally mean higher premiums.",
    allowed_values: "Monetary amount in USD. Common ranges: $0 (for copay plans), $500–$1,500 (standard), $1,400–$7,050 (HDHP).",
    usage_example: "A $1,000 individual deductible means an employee pays the first $1,000 of covered medical costs each plan year before insurance pays.",
  },
  "PLANS.HSA_ELIGIBLE": {
    help_title: "HSA Eligible Flag",
    short_help: "Indicates whether this plan qualifies employees to open and contribute to a Health Savings Account (HSA).",
    detailed_help: "## HSA Eligibility\n\nFor a plan to be HSA-eligible, it must be a High Deductible Health Plan (HDHP) that meets IRS minimum deductible thresholds.\n\nBenefits of HSA-eligible plans:\n- Employees can open an HSA and contribute pre-tax dollars\n- Unused HSA funds roll over year-to-year\n- Employer can also contribute to employee HSAs",
    warnings: "If an employee is enrolled in Medicare or covered by another non-HDHP plan, they are not eligible to contribute to an HSA even if enrolled in an HSA-eligible plan.",
  },
  "POLICYMATCH.RISK_TIER": {
    help_title: "Risk Tier",
    short_help: "A categorization of the group's overall health risk: Preferred, Standard, Elevated, or High.",
    detailed_help: "## Risk Tier\n\nThe risk tier summarizes the group's predicted claims risk.\n\n- **Preferred** — Low predicted claims, favorable underwriting expected\n- **Standard** — Average risk, typical carrier pricing\n- **Elevated** — Above-average risk, potential rate loading\n- **High** — Significant risk factors, may require medical underwriting",
    expected_user_action: "Use risk tier in carrier selection and plan recommendation. Elevated/High risk groups may benefit from level-funded or self-funded arrangements.",
  },
  "CONTRIBUTIONS.ACA_FLAG": {
    help_title: "ACA Affordability Flag",
    short_help: "Indicates whether the employer contribution meets ACA affordability standards for minimum essential coverage.",
    detailed_help: "## ACA Affordability\n\nUnder the Affordable Care Act, applicable large employers (ALEs) must offer coverage that is affordable. Coverage is affordable if the employee's required contribution for self-only coverage does not exceed a specific percentage of household income (indexed annually by the IRS).\n\nIf this flag is red, the current contribution strategy may expose the employer to ACA penalties.",
    warnings: "Non-compliance with ACA affordability rules can result in employer shared responsibility payments (ESRP). Consult with legal counsel before finalizing contribution strategies for ALEs.",
  },
  "EXCEPTIONS.SEVERITY": {
    help_title: "Exception Severity",
    short_help: "The urgency level of this exception item: Low, Medium, High, or Critical.",
    detailed_help: "## Exception Severity Levels\n\n- **Low** — Informational; no immediate action required\n- **Medium** — Should be resolved within 5 business days\n- **High** — Requires resolution within 24–48 hours\n- **Critical** — Immediate action required; may be blocking case progression or compliance",
    expected_user_action: "Triage exceptions daily. Assign Critical and High exceptions immediately. Use the workflow board to track resolution progress.",
  },
  "EE_PORTAL.COVERAGE_TIER": {
    help_title: "Coverage Tier Selection",
    short_help: "Determines which family members will be covered under the selected benefit plan.",
    detailed_help: "## Coverage Tiers\n\n- **Employee Only** — Covers only the employee\n- **Employee + Spouse** — Covers employee and legal spouse/domestic partner\n- **Employee + Children** — Covers employee and eligible dependent children\n- **Family** — Covers employee, spouse, and all eligible children",
    expected_user_action: "Select the tier that matches your actual family situation. Changing tiers after enrollment may only be possible at the next open enrollment or with a qualifying life event.",
    warnings: "Adding dependents after the enrollment deadline requires a Qualifying Life Event (QLE). Contact HR if you need to make changes outside of open enrollment.",
  },
  "EE_PORTAL.WAIVER": {
    help_title: "Waive Coverage",
    short_help: "Opt out of employer-sponsored benefit coverage for this enrollment period.",
    detailed_help: "## Waiving Coverage\n\nIf you have coverage through another source (e.g., a spouse's employer plan, Medicare), you may choose to waive employer-sponsored coverage.\n\n**Important:** Once you waive coverage, you cannot enroll until the next open enrollment period unless you experience a Qualifying Life Event (QLE).",
    expected_user_action: "Only waive coverage if you have confirmed alternative coverage. You will be asked to provide a waiver reason.",
    warnings: "Waiving coverage is a binding election. Ensure you have alternative coverage before submitting a waiver.",
  },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    let created = 0;
    let skipped = 0;

    for (const target of HELP_TARGETS) {
      // Check if HelpContent already exists for this target
      const existing = await base44.asServiceRole.entities.HelpContent.filter(
        { help_target_code: target.target_code }, "-created_date", 1
      );

      if (existing.length > 0) {
        skipped++;
        continue;
      }

      const seedData = SEED_CONTENT[target.target_code];
      if (seedData) {
        await base44.asServiceRole.entities.HelpContent.create({
          help_target_code: target.target_code,
          module_code: target.module_code,
          page_code: target.page_code,
          content_source: "system_generated",
          status: "active",
          version_no: 1,
          search_keywords: [target.target_label.toLowerCase(), target.module_code.toLowerCase()],
          ...seedData,
        });
        created++;
      } else {
        // Generate a minimal placeholder
        await base44.asServiceRole.entities.HelpContent.create({
          help_target_code: target.target_code,
          module_code: target.module_code,
          page_code: target.page_code,
          content_source: "system_generated",
          status: "draft",
          version_no: 1,
          help_title: target.target_label,
          short_help: `This is the ${target.target_label} in the ${target.module_code} module. Help content is pending admin review.`,
          detailed_help: `## ${target.target_label}\n\nDetailed help for this item has been queued for creation. An administrator can edit this content in the Help Management console.`,
          search_keywords: [target.target_label.toLowerCase(), target.module_code.toLowerCase()],
        });
        created++;
      }
    }

    return Response.json({ success: true, created, skipped, total: HELP_TARGETS.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});