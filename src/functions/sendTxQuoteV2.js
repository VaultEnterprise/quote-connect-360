/// <reference lib="deno.ns" />
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function applyTemplate(template, values) {
  return Object.entries(values).reduce((output, [key, value]) => output.replaceAll(`{{${key}}}`, value ?? ''), template || '');
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

    const [caseData, employerProfile, currentPlan, contribution, claims, destinations, readinessResults, supportingDocuments, contacts, validatedCensusList] = await Promise.all([
      base44.entities.BenefitCase.filter({ id: txQuoteCase.case_id }).then((items) => items[0]),
      base44.entities.TxQuoteEmployerProfile.filter({ txquote_case_id: txQuoteCaseId }, '-created_date', 1).then((items) => items[0] || null),
      base44.entities.TxQuoteCurrentPlanInfo.filter({ txquote_case_id: txQuoteCaseId }, '-created_date', 1).then((items) => items[0] || null),
      base44.entities.TxQuoteContributionStrategy.filter({ txquote_case_id: txQuoteCaseId }, '-created_date', 1).then((items) => items[0] || null),
      base44.entities.TxQuoteClaimsRequirement.filter({ txquote_case_id: txQuoteCaseId }, '-created_date', 1).then((items) => items[0] || null),
      base44.entities.TxQuoteDestination.filter({ txquote_case_id: txQuoteCaseId }, 'destination_code', 20),
      base44.entities.TxQuoteReadinessResult.filter({ txquote_case_id: txQuoteCaseId }, '-created_date', 500),
      base44.entities.TxQuoteSupportingDocument.filter({ txquote_case_id: txQuoteCaseId }, '-created_date', 100),
      base44.entities.TxQuoteDestinationContact.list('destination_code', 50),
      base44.entities.CensusVersion.filter({ case_id: txQuoteCase.case_id }, '-version_number', 20),
    ]);

    const blockingItems = readinessResults.filter((item) => item.status === 'fail');
    if (blockingItems.length > 0) {
      return Response.json({ error: 'TxQuote is not ready to send' }, { status: 400 });
    }

    const selectedDestinations = destinations.filter((item) => item.is_selected);
    if (!selectedDestinations.length) {
      return Response.json({ error: 'No destinations selected' }, { status: 400 });
    }

    const senderEmail = Deno.env.get('TXQUOTE_FROM_EMAIL');
    if (!senderEmail) return Response.json({ error: 'Outbound email sender is not configured' }, { status: 400 });

    const validatedCensus = validatedCensusList.find((item) => item.status === 'validated' && item.file_url);
    if (!validatedCensus) return Response.json({ error: 'Validated census file not found' }, { status: 400 });

    const attachmentManifest = supportingDocuments.filter((item) => item.is_received).map((item) => ({ document_type: item.document_type, file_name: item.file_name, document_id: item.document_id }));
    attachmentManifest.unshift({ document_type: 'validated_census', file_name: validatedCensus.file_name, document_id: validatedCensus.id });

    const results = [];
    for (const destination of selectedDestinations) {
      const toEmail = destination.email_to || contacts.find((item) => item.destination_code === destination.destination_code && item.contact_type === 'to' && item.is_default && item.is_active)?.email;
      const ccEmail = destination.email_cc || contacts.find((item) => item.destination_code === destination.destination_code && item.contact_type === 'cc' && item.is_default && item.is_active)?.email || '';
      const bccEmail = destination.email_bcc || contacts.find((item) => item.destination_code === destination.destination_code && item.contact_type === 'bcc' && item.is_default && item.is_active)?.email || '';
      if (!toEmail) {
        results.push({ destination_code: destination.destination_code, status: 'failed', error: 'Missing recipient email' });
        continue;
      }

      const values = {
        employer_name: caseData?.employer_name || '',
        case_number: caseData?.case_number || caseData?.id || '',
        effective_date: txQuoteCase.effective_date || caseData?.effective_date || '',
        destination_name: destination.destination_name,
        current_carrier: currentPlan?.current_carrier || '',
        current_plan_name: currentPlan?.current_plan_name || '',
        contribution_type: contribution?.employer_contribution_type || '',
        participation_percent: String(contribution?.participation_percent || 0),
        contact_name: employerProfile?.primary_contact_name || '',
      };

      const subject = applyTemplate(destination.subject_template || 'Level-Funded Quote Request - {{employer_name}} - {{effective_date}}', values);
      const body = applyTemplate(destination.body_template || [
        'Hello {{destination_name}},',
        '',
        'Please review this level-funded quote request.',
        '',
        'Employer: {{employer_name}}',
        'Case: {{case_number}}',
        'Effective Date: {{effective_date}}',
        'Current Carrier: {{current_carrier}}',
        'Current Plan: {{current_plan_name}}',
        'Contribution Type: {{contribution_type}}',
        'Participation: {{participation_percent}}%',
        'Primary Contact: {{contact_name}}',
        '',
        `Validated Census: ${validatedCensus.file_url}`,
      ].join('\n'), values);

      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          from_name: user.full_name || 'TxQuote Team',
          to: toEmail,
          subject,
          body,
        });

        await Promise.all([
          base44.entities.TxQuoteDestination.update(destination.id, {
            sent_status: 'sent',
            sent_at: new Date().toISOString(),
            sent_by: user.email,
            email_to: toEmail,
            email_cc: ccEmail,
            email_bcc: bccEmail,
            resend_count: (destination.resend_count || 0) + (destination.sent_status === 'sent' ? 1 : 0),
            last_error: '',
          }),
          base44.asServiceRole.entities.TxQuoteSubmissionLog.create({
            txquote_case_id: txQuoteCaseId,
            destination_code: destination.destination_code,
            submission_type: destination.sent_status === 'sent' ? 'resend' : 'initial',
            sent_by: user.email,
            sent_at: new Date().toISOString(),
            email_to: toEmail,
            email_cc: ccEmail,
            email_bcc: bccEmail,
            subject_line: subject,
            body_snapshot: body,
            attachment_manifest: attachmentManifest,
            delivery_status: 'sent',
          }),
          base44.entities.ActivityLog.create({
            case_id: caseData.id,
            actor_email: user.email,
            actor_name: user.full_name,
            action: 'TxQuote sent',
            detail: `TxQuote sent to ${destination.destination_name}`,
            entity_type: 'TxQuoteDestination',
            entity_id: destination.id,
            new_value: 'sent',
          }),
        ]);

        results.push({ destination_code: destination.destination_code, status: 'sent' });
      } catch (error) {
        await Promise.all([
          base44.entities.TxQuoteDestination.update(destination.id, {
            sent_status: 'failed',
            last_error: error.message,
          }),
          base44.asServiceRole.entities.TxQuoteSubmissionLog.create({
            txquote_case_id: txQuoteCaseId,
            destination_code: destination.destination_code,
            submission_type: destination.sent_status === 'sent' ? 'resend' : 'initial',
            sent_by: user.email,
            sent_at: new Date().toISOString(),
            email_to: toEmail,
            email_cc: ccEmail,
            email_bcc: bccEmail,
            subject_line: subject,
            body_snapshot: body,
            attachment_manifest: attachmentManifest,
            delivery_status: 'failed',
            error_message: error.message,
          }),
        ]);
        results.push({ destination_code: destination.destination_code, status: 'failed', error: error.message });
      }
    }

    const sentCount = results.filter((item) => item.status === 'sent').length;
    const allSent = sentCount === selectedDestinations.length && selectedDestinations.length > 0;

    await base44.entities.TxQuoteCase.update(txQuoteCaseId, {
      status: allSent ? 'sent_complete' : sentCount > 0 ? 'sent_partial' : txQuoteCase.status,
      sent_destination_count: sentCount,
      selected_destination_count: selectedDestinations.length,
      last_sent_at: new Date().toISOString(),
      updated_by_email: user.email,
    });

    await base44.entities.BenefitCase.update(caseData.id, {
      stage: sentCount > 0 && caseData.stage === 'census_validated' ? 'ready_for_quote' : caseData.stage,
      quote_status: sentCount > 0 ? 'in_progress' : caseData.quote_status,
      last_activity_date: new Date().toISOString(),
    });

    return Response.json({ success: allSent, sentCount, totalSelected: selectedDestinations.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});