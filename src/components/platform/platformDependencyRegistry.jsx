import { getCaseWorkflowSignals } from "@/components/cases/caseWorkflow";
import { buildQuoteReadiness } from "@/components/quotes/quoteGovernanceEngine";
import { buildRateDependencySummary } from "@/components/rates/rateGovernanceEngine";

export function buildPlatformDependencyRegistry({
  cases = [],
  tasks = [],
  censusVersions = [],
  scenarios = [],
  enrollments = [],
  renewals = [],
  exceptions = [],
  plans = [],
  rateTables = [],
  scenarioPlans = [],
  employeeEnrollments = [],
}) {
  const caseDependencies = cases.map((caseRecord) => {
    const related = {
      tasks: tasks.filter((task) => task.case_id === caseRecord.id),
      censusVersions: censusVersions.filter((item) => item.case_id === caseRecord.id),
      scenarios: scenarios.filter((item) => item.case_id === caseRecord.id),
      enrollmentWindows: enrollments.filter((item) => item.case_id === caseRecord.id),
      renewals: renewals.filter((item) => item.case_id === caseRecord.id),
      exceptions: exceptions.filter((item) => item.case_id === caseRecord.id),
    };

    const workflowSignals = getCaseWorkflowSignals({ caseData: caseRecord, ...related });
    const latestScenario = [...related.scenarios].sort((a, b) => new Date(b.updated_date || b.created_date || 0) - new Date(a.updated_date || a.created_date || 0))[0];
    const quoteReadiness = latestScenario
      ? buildQuoteReadiness({
          scenario: latestScenario,
          caseRecord,
          censusVersions,
          enrollments,
          renewals,
        })
      : null;

    return {
      caseId: caseRecord.id,
      employerName: caseRecord.employer_name,
      workflowSignals,
      quoteReadiness,
      related,
    };
  });

  const rateSummary = buildRateDependencySummary({
    plans,
    rateTables,
    scenarioPlans,
    quoteScenarios: scenarios,
    employeeEnrollments,
    renewals,
  });

  return {
    caseDependencies,
    systemSummary: {
      censusIssues: caseDependencies.filter((item) => item.workflowSignals.censusIssues.length > 0).length,
      quoteFailures: caseDependencies.filter((item) => item.workflowSignals.erroredQuotes.length > 0 || item.workflowSignals.expiringQuotes.length > 0).length,
      enrollmentBlockers: caseDependencies.filter((item) => item.workflowSignals.enrollmentBlocked).length,
      renewalRisk: caseDependencies.filter((item) => item.workflowSignals.renewalAtRisk).length,
      exceptionCount: exceptions.filter((item) => !["resolved", "dismissed"].includes(item.status)).length,
      rateSummary,
    },
  };
}

export function buildPlatformExceptions(registry) {
  const exceptions = [];

  registry.caseDependencies.forEach((item) => {
    if (item.workflowSignals.censusIssues.length > 0) {
      exceptions.push({
        case_id: item.caseId,
        employer_name: item.employerName,
        category: "census",
        severity: "high",
        title: "Census validation blocking downstream workflows",
        description: "Latest census snapshot still has blocking issues.",
      });
    }

    if (item.workflowSignals.erroredQuotes.length > 0) {
      exceptions.push({
        case_id: item.caseId,
        employer_name: item.employerName,
        category: "quote",
        severity: "high",
        title: "Quote calculation failure detected",
        description: "One or more quote scenarios are in error status.",
      });
    }

    if (item.quoteReadiness && !item.quoteReadiness.checks.enrollmentCompatible && item.related.scenarios.some((scenario) => scenario.status === "approved")) {
      exceptions.push({
        case_id: item.caseId,
        employer_name: item.employerName,
        category: "enrollment",
        severity: "medium",
        title: "Approved quote is not enrollment-ready",
        description: "Approved pricing decision is missing a compatible enrollment handoff.",
      });
    }
  });

  if (registry.systemSummary.rateSummary.plansWithoutRates > 0) {
    exceptions.push({
      category: "quote",
      severity: "critical",
      title: "Rate governance gap detected",
      description: `${registry.systemSummary.rateSummary.plansWithoutRates} active plans are missing rate tables.`,
    });
  }

  return exceptions;
}