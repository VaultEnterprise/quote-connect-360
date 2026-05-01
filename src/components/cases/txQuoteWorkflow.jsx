export const TXQUOTE_PROVIDER_CODES = ["AST", "SUS", "TRIAD", "NATIONWIDE", "MEC_MVP", "BENEFITTER"];

export function getLatestValidatedCensus(censusVersions = []) {
  return censusVersions.find((item) => item.status === "validated" && item.file_url && item.validation_errors === 0) || null;
}

export function canUserTransmitTxQuote(caseData, user) {
  return !!user && (user.role === "admin" || caseData?.assigned_to === user.email);
}

export function getTxQuoteDisabledReason({ caseData, censusVersions = [], routes = [], user, latestImportJob = null }) {
  const validatedCensus = getLatestValidatedCensus(censusVersions);
  if (!latestImportJob || !["completed", "reprocessed"].includes(latestImportJob.status) || Number(latestImportJob.critical_error_count || 0) > 0) {
    return "Census must pass validation before transmission.";
  }
  if (!validatedCensus) return "No validated census file exists.";
  if (!canUserTransmitTxQuote(caseData, user)) return "You do not have permission to transmit quote requests.";
  if (!caseData?.employer_name || !caseData?.effective_date) return "Case data is incomplete.";
  if (!['census_validated', 'ready_for_quote', 'quoting', 'proposal_ready', 'employer_review'].includes(caseData?.stage)) return "Case is not in a valid state for quote transmission.";
  if (!routes.some((route) => route.active && route.destination_email)) return "Provider routing is not configured.";
  return "";
}

export function isTxQuoteStepComplete({ censusVersions = [], transmissions = [] }) {
  const validatedCensus = getLatestValidatedCensus(censusVersions);
  if (!validatedCensus) return false;
  if (!transmissions.length) return false;
  const batches = transmissions.reduce((acc, item) => {
    const key = (item.selected_provider_batch || []).join('|');
    if (!key) return acc;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
  return Object.values(batches).some((batch) => {
    const expected = batch[0]?.selected_provider_batch || [];
    if (!expected.length) return false;
    return expected.every((providerCode) => batch.some((item) => item.provider_code === providerCode && item.status === 'success'));
  });
}