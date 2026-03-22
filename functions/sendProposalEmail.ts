import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { proposal_id, to_email } = await req.json();
    if (!proposal_id || !to_email) return Response.json({ error: 'proposal_id and to_email required' }, { status: 400 });

    const proposals = await base44.entities.Proposal.filter({ id: proposal_id });
    if (!proposals?.length) return Response.json({ error: 'Proposal not found' }, { status: 404 });

    const proposal = proposals[0];
    const origin = req.headers.get('origin') || 'https://app.base44.com';
    const portalUrl = `${origin}/employer-portal?proposal=${proposal_id}`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: to_email,
      subject: `Benefits Proposal: ${proposal.title} — ${proposal.employer_name}`,
      body: `
<html>
<body style="font-family: sans-serif; color: #1a1a2e; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
    <h1 style="color: white; margin: 0; font-size: 22px;">Benefits Proposal</h1>
    <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0;">${proposal.employer_name}</p>
  </div>

  <p>Dear ${proposal.employer_name} Team,</p>
  <p>Please find your benefits proposal below. You can review all plan details, contribution breakdowns, and cost summaries through the secure employer portal.</p>

  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <p style="margin: 0 0 4px; font-weight: 600; font-size: 15px;">${proposal.title}</p>
    ${proposal.effective_date ? `<p style="margin: 4px 0; font-size: 13px; color: #64748b;">Effective Date: <strong>${proposal.effective_date}</strong></p>` : ''}
    ${proposal.total_monthly_premium ? `<p style="margin: 4px 0; font-size: 13px; color: #64748b;">Total Monthly Premium: <strong>$${proposal.total_monthly_premium.toLocaleString()}</strong></p>` : ''}
    ${proposal.employer_monthly_cost ? `<p style="margin: 4px 0; font-size: 13px; color: #64748b;">Employer Monthly Cost: <strong>$${proposal.employer_monthly_cost.toLocaleString()}</strong></p>` : ''}
  </div>

  ${proposal.cover_message ? `<div style="background: #eff6ff; border-left: 3px solid #3b82f6; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 16px 0;"><p style="margin: 0; font-size: 14px; color: #1e40af;">${proposal.cover_message}</p></div>` : ''}

  <div style="text-align: center; margin: 28px 0;">
    <a href="${portalUrl}" style="background: #3b82f6; color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 15px;">Review Proposal →</a>
  </div>

  <p style="font-size: 13px; color: #475569;">Presented by: <strong>${proposal.broker_name || user.full_name}</strong>${proposal.agency_name ? ` · ${proposal.agency_name}` : ''}</p>

  <p style="font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px;">
    This proposal was sent via Connect Quote 360. If you have questions, reply to this email or contact your broker directly.
  </p>
</body>
</html>`,
    });

    // Mark as sent
    await base44.entities.Proposal.update(proposal_id, {
      status: 'sent',
      sent_at: new Date().toISOString(),
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});