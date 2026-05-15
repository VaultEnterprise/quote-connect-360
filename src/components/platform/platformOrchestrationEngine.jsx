export function buildCaseStageRecommendations(registry) {
  return registry.caseDependencies.map((item) => {
    const currentStage = item.related?.caseData?.stage;
    const recommendation = [];

    if (item.workflowSignals.censusIssues.length > 0) recommendation.push("Fix census snapshot issues before quoting.");
    if (item.workflowSignals.erroredQuotes.length > 0) recommendation.push("Recalculate or repair quote scenarios.");
    if (item.quoteReadiness && item.quoteReadiness.checks.pricingReady && !item.quoteReadiness.checks.enrollmentCompatible) recommendation.push("Create enrollment window before advancing approved quote.");
    if (item.workflowSignals.renewalAtRisk) recommendation.push("Review overdue renewal cycle.");

    return {
      caseId: item.caseId,
      employerName: item.employerName,
      recommendation,
    };
  });
}

export function buildActionCenterFromRegistry(registry) {
  const { systemSummary } = registry;
  return [
    { label: "Resolve census blockers", href: "/census", meta: `${systemSummary.censusIssues} issues` },
    { label: "Repair quote failures", href: "/quotes", meta: `${systemSummary.quoteFailures} failures` },
    { label: "Open enrollment blockers", href: "/enrollment", meta: `${systemSummary.enrollmentBlockers} blockers` },
    { label: "Review renewal risk", href: "/renewals", meta: `${systemSummary.renewalRisk} at risk` },
    { label: "Fix rate governance gaps", href: "/rates", meta: `${systemSummary.rateSummary.plansWithoutRates} missing rates` },
    { label: "Work exception queue", href: "/exceptions", meta: `${systemSummary.exceptionCount} open` },
  ];
}