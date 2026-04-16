import { base44 } from "@/api/base44Client";

export const TXQUOTE_DESTINATIONS = [
  { code: "TRIAD", name: "Triad" },
  { code: "SUS", name: "SUS" },
  { code: "AST", name: "AST" },
];

export function getLatestValidatedCensus(censusVersions = []) {
  return censusVersions.find((item) => item.status === "validated" && item.file_url) || null;
}

export function computeParticipationPercent(eligibleCount, enrollingCount, waiverCount = 0) {
  if (!eligibleCount) return 0;
  const participating = Math.max((enrollingCount || 0) + (waiverCount || 0), 0);
  return Math.round((participating / eligibleCount) * 100);
}

export function getTxQuoteButtonState({ txQuoteCase, readinessResults = [], destinations = [], censusVersions = [] }) {
  const validated = !!getLatestValidatedCensus(censusVersions);
  const missingCount = readinessResults.filter((item) => item.status === "fail" && item.severity === "error").length;
  const sentCount = destinations.filter((item) => item.sent_status === "sent").length;

  if (!validated) return { label: "TxQuote", disabled: true, tone: "muted", missingCount: 0 };
  if (txQuoteCase?.status === "sent_complete") return { label: "TxQuote Sent", disabled: false, tone: "success", missingCount };
  if (txQuoteCase?.readiness_status === "ready") return { label: "TxQuote Ready", disabled: false, tone: "ready", missingCount: 0 };
  if (missingCount > 0) return { label: `TxQuote (${missingCount} missing)`, disabled: false, tone: "warning", missingCount };
  if (sentCount > 0) return { label: "TxQuote", disabled: false, tone: "info", missingCount };
  return { label: "TxQuote", disabled: false, tone: "default", missingCount };
}

export async function ensureTxQuoteWorkspace(caseData, censusVersions = []) {
  const existing = await base44.entities.TxQuoteCase.filter({ case_id: caseData.id }, "-created_date", 1);
  if (existing[0]) return existing[0];

  const validatedCensus = getLatestValidatedCensus(censusVersions);
  const created = await base44.entities.TxQuoteCase.create({
    case_id: caseData.id,
    census_version_id: validatedCensus?.id,
    effective_date: caseData.effective_date,
    requested_plan_type: caseData.products_requested?.join(", ") || "medical",
    quote_type: caseData.case_type,
    funding_type: "level_funded",
    status: "draft",
    readiness_status: "incomplete",
    created_by_email: caseData.assigned_to || caseData.created_by,
    updated_by_email: caseData.assigned_to || caseData.created_by,
  });

  await Promise.all([
    base44.entities.TxQuoteEmployerProfile.create({
      txquote_case_id: created.id,
      legal_company_name: caseData.employer_name,
      eligible_employee_count: caseData.employee_count,
      group_size_total: caseData.employee_count,
    }),
    base44.entities.TxQuoteCurrentPlanInfo.create({ txquote_case_id: created.id }),
    base44.entities.TxQuoteContributionStrategy.create({ txquote_case_id: created.id }),
    base44.entities.TxQuoteClaimsRequirement.create({ txquote_case_id: created.id }),
    ...TXQUOTE_DESTINATIONS.map((destination) => base44.entities.TxQuoteDestination.create({
      txquote_case_id: created.id,
      destination_code: destination.code,
      destination_name: destination.name,
    })),
  ]);

  return created;
}

export function buildReadinessSummary({ txQuoteCase, employerProfile, currentPlan, contribution, claims, supportingDocuments = [], readinessResults = [], destinations = [] }) {
  const errors = readinessResults.filter((item) => item.status === "fail");
  const conditions = readinessResults.filter((item) => item.status === "conditional");
  return {
    status: txQuoteCase?.readiness_status || "incomplete",
    score: txQuoteCase?.readiness_score || 0,
    errorCount: errors.length,
    conditionalCount: conditions.length,
    selectedDestinationCount: destinations.filter((item) => item.is_selected).length,
    receivedDocumentCount: supportingDocuments.filter((item) => item.is_received).length,
    employerComplete: !!(employerProfile?.primary_contact_name && employerProfile?.primary_contact_email && employerProfile?.eligible_employee_count),
    currentPlanComplete: !!(currentPlan?.current_carrier && currentPlan?.current_plan_name),
    contributionComplete: !!(contribution?.employer_contribution_type && contribution?.participation_percent !== null && contribution?.participation_percent !== undefined),
    claimsComplete: claims?.claims_required ? !!claims?.claims_received : true,
  };
}