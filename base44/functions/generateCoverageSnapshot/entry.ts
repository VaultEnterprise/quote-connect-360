import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// Full target registry (inline — no local imports allowed)
const HELP_TARGETS = [
  { target_code:"DASHBOARD.PAGE", module_code:"DASHBOARD" },
  { target_code:"DASHBOARD.KPI.ACTIVE_CASES", module_code:"DASHBOARD" },
  { target_code:"DASHBOARD.KPI.ENROLLMENTS", module_code:"DASHBOARD" },
  { target_code:"DASHBOARD.KPI.RENEWALS", module_code:"DASHBOARD" },
  { target_code:"DASHBOARD.PIPELINE", module_code:"DASHBOARD" },
  { target_code:"DASHBOARD.QUICK_ACTIONS", module_code:"DASHBOARD" },
  { target_code:"DASHBOARD.PRIORITIES", module_code:"DASHBOARD" },
  { target_code:"CASES.PAGE", module_code:"CASES" },
  { target_code:"CASES.STAGE_FILTER", module_code:"CASES" },
  { target_code:"CASES.CASE_CARD", module_code:"CASES" },
  { target_code:"CASES.NEW_CASE_BTN", module_code:"CASES" },
  { target_code:"CASES.DETAIL.PAGE", module_code:"CASES" },
  { target_code:"CASES.DETAIL.STAGE", module_code:"CASES" },
  { target_code:"CASES.DETAIL.CENSUS_TAB", module_code:"CASES" },
  { target_code:"CASES.DETAIL.QUOTES_TAB", module_code:"CASES" },
  { target_code:"CASES.DETAIL.TASKS_TAB", module_code:"CASES" },
  { target_code:"CASES.DETAIL.DOCS_TAB", module_code:"CASES" },
  { target_code:"CASES.DETAIL.ADVANCE_BTN", module_code:"CASES" },
  { target_code:"CASES.STAGES.DRAFT", module_code:"CASES" },
  { target_code:"CASES.STAGES.CENSUS", module_code:"CASES" },
  { target_code:"CASES.STAGES.QUOTING", module_code:"CASES" },
  { target_code:"CASES.STAGES.PROPOSAL", module_code:"CASES" },
  { target_code:"CASES.STAGES.ENROLLMENT", module_code:"CASES" },
  { target_code:"CASES.STAGES.ACTIVE", module_code:"CASES" },
  { target_code:"CENSUS.PAGE", module_code:"CENSUS" },
  { target_code:"CENSUS.UPLOAD_BTN", module_code:"CENSUS" },
  { target_code:"CENSUS.VALIDATION", module_code:"CENSUS" },
  { target_code:"CENSUS.MEMBER_TABLE", module_code:"CENSUS" },
  { target_code:"CENSUS.GRADIENT_AI", module_code:"CENSUS" },
  { target_code:"QUOTES.PAGE", module_code:"QUOTES" },
  { target_code:"QUOTES.SCENARIO_CARD", module_code:"QUOTES" },
  { target_code:"QUOTES.NEW_SCENARIO", module_code:"QUOTES" },
  { target_code:"QUOTES.CONTRIBUTION", module_code:"QUOTES" },
  { target_code:"QUOTES.KPI_TOTAL_PREMIUM", module_code:"QUOTES" },
  { target_code:"PROPOSALS.PAGE", module_code:"PROPOSALS" },
  { target_code:"PROPOSALS.STATUS.DRAFT", module_code:"PROPOSALS" },
  { target_code:"PROPOSALS.STATUS.SENT", module_code:"PROPOSALS" },
  { target_code:"PROPOSALS.STATUS.APPROVED", module_code:"PROPOSALS" },
  { target_code:"PROPOSALS.SEND_BTN", module_code:"PROPOSALS" },
  { target_code:"ENROLLMENT.PAGE", module_code:"ENROLLMENT" },
  { target_code:"ENROLLMENT.WINDOW", module_code:"ENROLLMENT" },
  { target_code:"ENROLLMENT.PARTICIPATION", module_code:"ENROLLMENT" },
  { target_code:"ENROLLMENT.MEMBER_TABLE", module_code:"ENROLLMENT" },
  { target_code:"ENROLLMENT.STATUS.OPEN", module_code:"ENROLLMENT" },
  { target_code:"ENROLLMENT.STATUS.CLOSED", module_code:"ENROLLMENT" },
  { target_code:"RENEWALS.PAGE", module_code:"RENEWALS" },
  { target_code:"RENEWALS.PIPELINE", module_code:"RENEWALS" },
  { target_code:"RENEWALS.DISRUPTION_SCORE", module_code:"RENEWALS" },
  { target_code:"RENEWALS.RATE_CHANGE", module_code:"RENEWALS" },
  { target_code:"PLANS.PAGE", module_code:"PLANS" },
  { target_code:"PLANS.CARD", module_code:"PLANS" },
  { target_code:"PLANS.COMPARE", module_code:"PLANS" },
  { target_code:"PLANS.NETWORK_TYPE", module_code:"PLANS" },
  { target_code:"PLANS.DEDUCTIBLE", module_code:"PLANS" },
  { target_code:"PLANS.OOP_MAX", module_code:"PLANS" },
  { target_code:"PLANS.HSA_ELIGIBLE", module_code:"PLANS" },
  { target_code:"POLICYMATCH.PAGE", module_code:"POLICYMATCH" },
  { target_code:"POLICYMATCH.RISK_TIER", module_code:"POLICYMATCH" },
  { target_code:"POLICYMATCH.RISK_SCORE", module_code:"POLICYMATCH" },
  { target_code:"POLICYMATCH.VALUE_SCORE", module_code:"POLICYMATCH" },
  { target_code:"EMPLOYERS.PAGE", module_code:"EMPLOYERS" },
  { target_code:"EMPLOYERS.STATUS", module_code:"EMPLOYERS" },
  { target_code:"TASKS.PAGE", module_code:"TASKS" },
  { target_code:"TASKS.PRIORITY", module_code:"TASKS" },
  { target_code:"TASKS.STATUS", module_code:"TASKS" },
  { target_code:"CONTRIBUTIONS.PAGE", module_code:"CONTRIBUTIONS" },
  { target_code:"CONTRIBUTIONS.STRATEGY", module_code:"CONTRIBUTIONS" },
  { target_code:"CONTRIBUTIONS.ACA_FLAG", module_code:"CONTRIBUTIONS" },
  { target_code:"EXCEPTIONS.PAGE", module_code:"EXCEPTIONS" },
  { target_code:"EXCEPTIONS.SEVERITY", module_code:"EXCEPTIONS" },
  { target_code:"EXCEPTIONS.STATUS", module_code:"EXCEPTIONS" },
  { target_code:"SETTINGS.PAGE", module_code:"SETTINGS" },
  { target_code:"SETTINGS.ORGANIZATION", module_code:"SETTINGS" },
  { target_code:"SETTINGS.INTEGRATIONS", module_code:"SETTINGS" },
  { target_code:"SETTINGS.FEATURES", module_code:"SETTINGS" },
  { target_code:"SETTINGS.TEAM", module_code:"SETTINGS" },
  { target_code:"EE_PORTAL.PAGE", module_code:"PORTALS" },
  { target_code:"EE_PORTAL.PLAN_SELECTION", module_code:"PORTALS" },
  { target_code:"EE_PORTAL.COVERAGE_TIER", module_code:"PORTALS" },
  { target_code:"EE_PORTAL.WAIVER", module_code:"PORTALS" },
  { target_code:"ER_PORTAL.PAGE", module_code:"PORTALS" },
  { target_code:"ER_PORTAL.PROPOSAL_REVIEW", module_code:"PORTALS" },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    // Fetch all help content
    const allContent = await base44.asServiceRole.entities.HelpContent.list("-created_date", 500);
    const contentMap = {};
    for (const c of allContent) {
      contentMap[c.help_target_code] = c;
    }

    // Fetch AI question logs
    const aiLogs = await base44.asServiceRole.entities.HelpAIQuestionLog.list("-created_date", 500);
    const lowConfidenceCount = aiLogs.filter(l => (l.answer_confidence || 0) < 0.4).length;
    const unansweredCount = aiLogs.filter(l => !l.answer_text).length;

    const total = HELP_TARGETS.length;
    let activeCount = 0;
    let missingCount = 0;
    let draftCount = 0;
    let reviewCount = 0;
    const byModule = {};

    for (const t of HELP_TARGETS) {
      const c = contentMap[t.target_code];
      const mod = t.module_code;
      if (!byModule[mod]) byModule[mod] = { total: 0, active: 0, missing: 0 };
      byModule[mod].total++;

      if (!c) {
        missingCount++;
        byModule[mod].missing++;
      } else if (c.status === 'active') {
        activeCount++;
        byModule[mod].active++;
        if (c.content_source === 'system_generated') reviewCount++;
      } else if (c.status === 'draft') {
        draftCount++;
        byModule[mod].missing++; // draft counts as not-yet-active coverage
      }
    }

    const snapshot = await base44.asServiceRole.entities.HelpCoverageSnapshot.create({
      snapshot_date: new Date().toISOString().split('T')[0],
      total_targets: total,
      targets_with_active_help: activeCount,
      targets_missing_help: missingCount,
      targets_with_draft_only: draftCount,
      review_required_count: reviewCount,
      low_confidence_question_count: lowConfidenceCount,
      unanswered_question_count: unansweredCount,
      coverage_pct: Math.round((activeCount / total) * 100),
      by_module: byModule,
    });

    // Log audit event
    await base44.asServiceRole.entities.HelpAuditLog.create({
      event_type: 'HELP_COVERAGE_SNAPSHOT_TAKEN',
      entity_type: 'HelpCoverageSnapshot',
      entity_id: snapshot.id,
      actor_email: user.email,
      actor_role: user.role,
      notes: `Snapshot: ${activeCount}/${total} covered (${Math.round((activeCount/total)*100)}%)`,
    });

    return Response.json({
      success: true,
      snapshot_id: snapshot.id,
      coverage_pct: snapshot.coverage_pct,
      total_targets: total,
      active: activeCount,
      missing: missingCount,
      draft: draftCount,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});