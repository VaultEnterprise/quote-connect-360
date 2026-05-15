import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function buildSubject(template, data) {
  const fallback = `Quote Request - ${data.employerName} - ${data.caseName} - ${data.effectiveDate}`;
  const base = template || fallback;
  return base
    .replaceAll('{EmployerName}', data.employerName)
    .replaceAll('{CaseName}', data.caseName)
    .replaceAll('{EffectiveDate}', data.effectiveDate);
}

function buildBody(template, data) {
  const fallback = [
    `Hello ${data.providerName},`,
    '',
    'Please provide a quote for the attached validated census file.',
    '',
    `Employer: ${data.employerName}`,
    `Case: ${data.caseName}`,
    `Effective Date: ${data.effectiveDate}`,
    `Products Requested: ${data.productType || 'Not specified'}`,
    '',
    'The validated census file is attached for review.',
    '',
    data.contactOverride ? `Contact Override: ${data.contactOverride}` : '',
    data.turnaroundDate ? `Requested Turnaround Date: ${data.turnaroundDate}` : '',
    data.internalNote ? `Internal Note: ${data.internalNote}` : '',
    '',
    `Sent by: ${data.senderName}`,
    `Sender Email: ${data.senderEmail}`,
  ].filter(Boolean).join('\n');

  return (template || fallback)
    .replaceAll('{ProviderName}', data.providerName)
    .replaceAll('{EmployerName}', data.employerName)
    .replaceAll('{CaseName}', data.caseName)
    .replaceAll('{EffectiveDate}', data.effectiveDate)
    .replaceAll('{ProductType}', data.productType || 'Not specified')
    .replaceAll('{ContactOverride}', data.contactOverride || '')
    .replaceAll('{TurnaroundDate}', data.turnaroundDate || '')
    .replaceAll('{InternalNote}', data.internalNote || '')
    .replaceAll('{SenderName}', data.senderName)
    .replaceAll('{SenderEmail}', data.senderEmail);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { caseId, providerCodes = [], cc, internalNote, turnaroundDateRequested, productType, contactOverride } = payload || {};

    if (!caseId) {
      return Response.json({ error: 'Case is required' }, { status: 400 });
    }

    if (!providerCodes.length) {
      return Response.json({ error: 'Select at least one provider' }, { status: 400 });
    }

    const caseList = await base44.entities.BenefitCase.filter({ id: caseId });
    const caseData = caseList[0];
    if (!caseData) {
      return Response.json({ error: 'Case not found' }, { status: 404 });
    }

    if (!(user.role === 'admin' || caseData.assigned_to === user.email)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!caseData.employer_name || !caseData.effective_date) {
      return Response.json({ error: 'Case data is incomplete' }, { status: 400 });
    }

    if (!['census_validated', 'ready_for_quote', 'quoting', 'proposal_ready', 'employer_review'].includes(caseData.stage)) {
      return Response.json({ error: 'Case is not in a valid state for quote transmission' }, { status: 400 });
    }

    const censusVersions = await base44.entities.CensusVersion.filter({ case_id: caseId }, '-version_number');
    const validatedCensus = censusVersions.find((item) => item.status === 'validated' && item.file_url);

    if (!validatedCensus) {
      return Response.json({ error: 'No validated census file exists' }, { status: 400 });
    }

    const routes = await base44.asServiceRole.entities.QuoteProviderRoute.list();
    const selectedRoutes = routes.filter((route) => providerCodes.includes(route.provider_code));

    if (selectedRoutes.length !== providerCodes.length) {
      return Response.json({ error: 'One or more providers are not configured' }, { status: 400 });
    }

    const invalidRoute = selectedRoutes.find((route) => !route.active || !route.destination_email);
    if (invalidRoute) {
      return Response.json({ error: `${invalidRoute.provider_name} routing is inactive or incomplete` }, { status: 400 });
    }

    const fileResponse = await fetch(validatedCensus.file_url);
    if (!fileResponse.ok) {
      return Response.json({ error: 'Validated census file could not be retrieved' }, { status: 400 });
    }

    const fileBuffer = await fileResponse.arrayBuffer();
    const fileName = validatedCensus.file_name || `validated-census-${validatedCensus.version_number || 1}.csv`;
    const file = new File([fileBuffer], fileName, { type: fileResponse.headers.get('content-type') || 'application/octet-stream' });
    const uploadResult = await base44.integrations.Core.UploadFile({ file });
    const attachmentUrl = uploadResult.file_url;

    const senderEmail = Deno.env.get('TXQUOTE_FROM_EMAIL');
    if (!senderEmail) {
      return Response.json({ error: 'Outbound email sender is not configured' }, { status: 400 });
    }

    await base44.entities.ActivityLog.create({
      case_id: caseId,
      actor_email: user.email,
      actor_name: user.full_name,
      action: 'TxQuote initiated',
      detail: `Providers selected: ${providerCodes.join(', ')}`,
      entity_type: 'BenefitCase',
      entity_id: caseId,
    });

    const results = [];

    for (const route of selectedRoutes) {
      const templateData = {
        providerName: route.provider_name,
        employerName: caseData.employer_name,
        caseName: caseData.case_number || caseData.id,
        effectiveDate: caseData.effective_date,
        productType,
        contactOverride,
        turnaroundDate: turnaroundDateRequested,
        internalNote,
        senderName: user.full_name || user.email,
        senderEmail,
      };

      const subject = buildSubject(route.subject_template, templateData);
      const body = buildBody(route.body_template, templateData) + `\n\nAttachment: ${attachmentUrl}`;
      const recipientCc = [route.default_cc, cc].filter(Boolean).join(', ');

      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          from_name: user.full_name || 'Quote Team',
          to: route.destination_email,
          subject,
          body,
        });

        await base44.asServiceRole.entities.QuoteTransmission.create({
          case_id: caseId,
          census_version_id: validatedCensus.id,
          census_file_name: fileName,
          provider_code: route.provider_code,
          provider_name: route.provider_name,
          recipient_email: route.destination_email,
          cc_email: recipientCc,
          subject,
          body,
          status: 'success',
          sent_at: new Date().toISOString(),
          sent_by: user.email,
          turnaround_date_requested: turnaroundDateRequested,
          product_type: productType,
          contact_override: contactOverride,
          internal_note: internalNote,
          selected_provider_batch: providerCodes,
        });

        await base44.entities.ActivityLog.create({
          case_id: caseId,
          actor_email: user.email,
          actor_name: user.full_name,
          action: 'TxQuote sent',
          detail: `Quote request sent to ${route.provider_name} (${route.destination_email})`,
          entity_type: 'QuoteTransmission',
          entity_id: route.provider_code,
          new_value: 'success',
        });

        results.push({ provider_code: route.provider_code, provider_name: route.provider_name, status: 'success' });
      } catch (error) {
        await base44.asServiceRole.entities.QuoteTransmission.create({
          case_id: caseId,
          census_version_id: validatedCensus.id,
          census_file_name: fileName,
          provider_code: route.provider_code,
          provider_name: route.provider_name,
          recipient_email: route.destination_email,
          cc_email: recipientCc,
          subject,
          body,
          status: 'failed',
          failure_reason: error.message,
          sent_at: new Date().toISOString(),
          sent_by: user.email,
          turnaround_date_requested: turnaroundDateRequested,
          product_type: productType,
          contact_override: contactOverride,
          internal_note: internalNote,
          selected_provider_batch: providerCodes,
        });

        await base44.entities.ActivityLog.create({
          case_id: caseId,
          actor_email: user.email,
          actor_name: user.full_name,
          action: 'TxQuote failed',
          detail: `Quote request failed for ${route.provider_name}: ${error.message}`,
          entity_type: 'QuoteTransmission',
          entity_id: route.provider_code,
          new_value: 'failed',
        });

        results.push({ provider_code: route.provider_code, provider_name: route.provider_name, status: 'failed', failure_reason: error.message });
      }
    }

    const allSucceeded = results.every((item) => item.status === 'success');

    if (allSucceeded && caseData.stage === 'census_validated') {
      await base44.entities.BenefitCase.update(caseId, {
        stage: 'ready_for_quote',
        quote_status: 'in_progress',
        last_activity_date: new Date().toISOString(),
      });
    } else {
      await base44.entities.BenefitCase.update(caseId, {
        last_activity_date: new Date().toISOString(),
      });
    }

    return Response.json({
      success: allSucceeded,
      results,
      census_version_id: validatedCensus.id,
      file_name: fileName,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});