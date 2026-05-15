/* global Deno */
/// <reference lib="deno.ns" />
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function addResult(results, txQuoteCaseId, validator_code, validator_name, severity, status, message, field_path = '', destination_code = '') {
  results.push({ txquote_case_id: txQuoteCaseId, validator_code, validator_name, severity, status, message, field_path, destination_code });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { txQuoteCaseId } = await req.json();
    if (!txQuoteCaseId) return Response.json({ error: 'TxQuote case is required' }, { status: 400 });

    const txQuoteCase = (await base44.entities.TxQuoteCase.filter({ id: txQuoteCaseId }))[0];
    if (!txQuoteCase) return Response.json({ error: 'TxQuote case not found' }, { status: 404 });

    const [caseData, censusVersions, employerProfile, currentPlan, contribution, claims, destinations, documents, rules, existingResults] = await Promise.all([
      base44.entities.BenefitCase.filter({ id: txQuoteCase.case_id }).then((items) => items[0]),
      base44.entities.CensusVersion.filter({ case_id: txQuoteCase.case_id }, '-version_number', 20),
      base44.entities.TxQuoteEmployerProfile.filter({ txquote_case_id: txQuoteCaseId }, '-created_date', 1).then((items) => items[0] || null),
      base44.entities.TxQuoteCurrentPlanInfo.filter({ txquote_case_id: txQuoteCaseId }, '-created_date', 1).then((items) => items[0] || null),
      base44.entities.TxQuoteContributionStrategy.filter({ txquote_case_id: txQuoteCaseId }, '-created_date', 1).then((items) => items[0] || null),
      base44.entities.TxQuoteClaimsRequirement.filter({ txquote_case_id: txQuoteCaseId }, '-created_date', 1).then((items) => items[0] || null),
      base44.entities.TxQuoteDestination.filter({ txquote_case_id: txQuoteCaseId }, 'destination_code', 20),
      base44.entities.TxQuoteSupportingDocument.filter({ txquote_case_id: txQuoteCaseId }, '-created_date', 100),
      base44.entities.TxQuoteDestinationRule.list('destination_code', 100),
      base44.entities.TxQuoteReadinessResult.filter({ txquote_case_id: txQuoteCaseId }, '-created_date', 500),
    ]);

    for (const row of existingResults) {
      await base44.entities.TxQuoteReadinessResult.delete(row.id);
    }

    const results = [];
    const validatedCensus = censusVersions.find((item) => item.status === 'validated' && item.file_url);
    const selectedDestinations = destinations.filter((item) => item.is_selected);
    const claimsThresholdRule = rules.find((item) => item.rule_code === 'claims_required_over_enrolled_count' && item.is_active) || { rule_config: { threshold: 50 } };
    const participationRule = rules.find((item) => item.rule_code === 'minimum_participation_percent' && item.is_active) || { rule_config: { minimum: 25 } };
    const contributionRule = rules.find((item) => item.rule_code === 'minimum_employer_contribution_percent' && item.is_active) || { rule_config: { minimum: 50 } };
    const claimsThreshold = Number(claimsThresholdRule.rule_config?.threshold || 50);
    const minimumParticipation = Number(participationRule.rule_config?.minimum || 25);
    const minimumContribution = Number(contributionRule.rule_config?.minimum || 50);
    const enrolledCount = Number(claims?.total_enrolled_count || employerProfile?.enrolling_employee_count || 0);
    const claimsRequired = enrolledCount >= claimsThreshold;

    if (validatedCensus) addResult(results, txQuoteCaseId, 'validated_census', 'Validated Census', 'info', 'pass', 'Validated census confirmed.', 'census_version_id');
    else addResult(results, txQuoteCaseId, 'validated_census', 'Validated Census', 'error', 'fail', 'Validated census is required before sending.', 'census_version_id');

    if (selectedDestinations.length > 0) addResult(results, txQuoteCaseId, 'destination_selection', 'Destination Selection', 'info', 'pass', `${selectedDestinations.length} destination(s) selected.`, 'destinations');
    else addResult(results, txQuoteCaseId, 'destination_selection', 'Destination Selection', 'error', 'fail', 'At least one destination must be selected.', 'destinations');

    if (txQuoteCase.effective_date || caseData?.effective_date) addResult(results, txQuoteCaseId, 'effective_date', 'Effective Date', 'info', 'pass', 'Effective date is present.', 'effective_date');
    else addResult(results, txQuoteCaseId, 'effective_date', 'Effective Date', 'error', 'fail', 'Effective date is required.', 'effective_date');

    if (employerProfile?.primary_contact_name && employerProfile?.primary_contact_email) addResult(results, txQuoteCaseId, 'employer_contact', 'Employer Contact', 'info', 'pass', 'Primary contact is complete.', 'employer_profile.primary_contact');
    else addResult(results, txQuoteCaseId, 'employer_contact', 'Employer Contact', 'error', 'fail', 'Primary contact name and email are required.', 'employer_profile.primary_contact');

    if (employerProfile?.eligible_employee_count) addResult(results, txQuoteCaseId, 'eligible_count', 'Eligible Employee Count', 'info', 'pass', 'Eligible employee count is present.', 'employer_profile.eligible_employee_count');
    else addResult(results, txQuoteCaseId, 'eligible_count', 'Eligible Employee Count', 'error', 'fail', 'Eligible employee count is required.', 'employer_profile.eligible_employee_count');

    if (currentPlan?.current_carrier && currentPlan?.current_plan_name) addResult(results, txQuoteCaseId, 'current_plan', 'Current Plan Info', 'info', 'pass', 'Current plan information is complete.', 'current_plan');
    else addResult(results, txQuoteCaseId, 'current_plan', 'Current Plan Info', 'error', 'fail', 'Current carrier and plan name are required.', 'current_plan');

    if (contribution?.employer_contribution_type) addResult(results, txQuoteCaseId, 'contribution_strategy', 'Contribution Strategy', 'info', 'pass', 'Contribution strategy is present.', 'contribution');
    else addResult(results, txQuoteCaseId, 'contribution_strategy', 'Contribution Strategy', 'error', 'fail', 'Contribution strategy is required.', 'contribution');

    if ((contribution?.participation_percent ?? 0) >= minimumParticipation) addResult(results, txQuoteCaseId, 'participation_percent', 'Participation', 'info', 'pass', `Participation meets minimum threshold of ${minimumParticipation}%.`, 'contribution.participation_percent');
    else addResult(results, txQuoteCaseId, 'participation_percent', 'Participation', 'error', 'fail', `Participation is below required minimum of ${minimumParticipation}%.`, 'contribution.participation_percent');

    if ((contribution?.contribution_percent_employee_only ?? 0) >= minimumContribution) addResult(results, txQuoteCaseId, 'minimum_contribution', 'Employer Contribution', 'info', 'pass', `Employer contribution meets minimum threshold of ${minimumContribution}%.`, 'contribution.contribution_percent_employee_only');
    else addResult(results, txQuoteCaseId, 'minimum_contribution', 'Employer Contribution', 'error', 'fail', `Employer contribution is below required minimum of ${minimumContribution}%.`, 'contribution.contribution_percent_employee_only');

    const currentBillReceived = documents.some((item) => item.document_type === 'current_bill' && item.is_received);
    const renewalOfferReceived = documents.some((item) => item.document_type === 'renewal_offer' && item.is_received);

    if (currentBillReceived || renewalOfferReceived) addResult(results, txQuoteCaseId, 'supporting_rates', 'Supporting Rates', 'info', 'pass', 'Supporting rate documentation is attached.', 'documents');
    else addResult(results, txQuoteCaseId, 'supporting_rates', 'Supporting Rates', 'error', 'fail', 'Current bill or renewal offer document is required.', 'documents');

    if (claimsRequired) {
      if (claims?.claims_received || documents.some((item) => item.document_type === 'claims_report' && item.is_received)) addResult(results, txQuoteCaseId, 'claims_requirement', 'Claims Requirement', 'info', 'pass', 'Claims documentation is attached.', 'claims');
      else addResult(results, txQuoteCaseId, 'claims_requirement', 'Claims Requirement', 'error', 'fail', `Claims are required because enrolled count is ${enrolledCount}.`, 'claims');
    } else {
      addResult(results, txQuoteCaseId, 'claims_requirement', 'Claims Requirement', 'warning', 'conditional', `Claims are optional because enrolled count is below ${claimsThreshold}.`, 'claims');
    }

    for (const destination of selectedDestinations) {
      if (destination.email_to) addResult(results, txQuoteCaseId, 'destination_contact', `${destination.destination_name} Contact`, 'info', 'pass', `${destination.destination_name} recipient is configured.`, 'destinations.email_to', destination.destination_code);
      else addResult(results, txQuoteCaseId, 'destination_contact', `${destination.destination_name} Contact`, 'error', 'fail', `${destination.destination_name} recipient email is required.`, 'destinations.email_to', destination.destination_code);
    }

    if (!documents.some((item) => item.document_type === 'validated_census' && item.is_received) && validatedCensus) {
      await base44.entities.TxQuoteSupportingDocument.create({
        txquote_case_id: txQuoteCaseId,
        document_type: 'validated_census',
        document_id: validatedCensus.id,
        file_name: validatedCensus.file_name,
        uploaded_at: new Date().toISOString(),
        uploaded_by: user.email,
        is_required: true,
        is_received: true,
        applies_to_destinations: selectedDestinations.map((item) => item.destination_code),
      });
    }

    if (results.length) {
      await base44.asServiceRole.entities.TxQuoteReadinessResult.bulkCreate(results);
    }

    const failCount = results.filter((item) => item.status === 'fail').length;
    const conditionalCount = results.filter((item) => item.status === 'conditional').length;
    const score = results.length ? Math.round((results.filter((item) => item.status === 'pass').length / results.length) * 100) : 0;
    const readiness_status = failCount === 0 ? (conditionalCount > 0 ? 'conditional' : 'ready') : 'incomplete';

    for (const destination of destinations) {
      const destinationFails = results.filter((item) => item.destination_code === destination.destination_code && item.status === 'fail').length;
      const destinationConditionals = results.filter((item) => item.destination_code === destination.destination_code && item.status === 'conditional').length;
      const destinationStatus = destinationFails === 0 ? (destinationConditionals > 0 ? 'conditional' : 'ready') : 'incomplete';
      await base44.entities.TxQuoteDestination.update(destination.id, { readiness_status: destinationStatus });
    }

    let status = 'in_progress';
    if (readiness_status === 'ready') status = 'ready';
    if ((txQuoteCase.sent_destination_count || 0) > 0 && readiness_status === 'ready') status = txQuoteCase.status;

    await base44.entities.TxQuoteCase.update(txQuoteCaseId, {
      readiness_status,
      readiness_score: score,
      status,
      requires_claims: claimsRequired,
      selected_destination_count: selectedDestinations.length,
      last_validated_at: new Date().toISOString(),
      updated_by_email: user.email,
    });

    return Response.json({ success: true, readiness_status, score, failCount, conditionalCount, selectedDestinationCount: selectedDestinations.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});