import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { enrollment_id } = await req.json();
    if (!enrollment_id) return Response.json({ error: 'enrollment_id required' }, { status: 400 });

    const enrollments = await base44.entities.EmployeeEnrollment.filter({ id: enrollment_id });
    if (!enrollments?.length) return Response.json({ error: 'Enrollment not found' }, { status: 404 });

    const enrollment = enrollments[0];
    const portalUrl = `${req.headers.get('origin') || 'https://app.base44.com'}/employee-portal-login`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: enrollment.employee_email,
      subject: `Your Benefits Enrollment is Ready — ${enrollment.employer_name || 'Your Employer'}`,
      body: `
<html>
<body style="font-family: sans-serif; color: #1a1a2e; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #3b82f6, #06b6d4); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
    <h1 style="color: white; margin: 0; font-size: 22px;">Benefits Enrollment</h1>
    <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0;">Your enrollment window is now open</p>
  </div>

  <p>Hi <strong>${enrollment.employee_name}</strong>,</p>
  <p>Your benefits enrollment window is now open. Please complete your enrollment as soon as possible.</p>

  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <p style="margin: 0 0 8px; font-weight: 600;">Your Login Details</p>
    <p style="margin: 4px 0; font-size: 14px;"><strong>Email:</strong> ${enrollment.employee_email}</p>
    <p style="margin: 4px 0; font-size: 14px; color: #64748b;">Your secure access token has been set. Click the button below to access your enrollment portal — you'll be prompted to enter your email and the token you received in a previous communication, or contact your HR administrator if you need your token resent.</p>
  </div>

  ${enrollment.effective_date ? `<p style="font-size: 14px; color: #64748b;">Coverage effective: <strong>${enrollment.effective_date}</strong></p>` : ''}

  <div style="text-align: center; margin: 28px 0;">
    <a href="${portalUrl}" style="background: #3b82f6; color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 15px;">Start My Enrollment →</a>
  </div>

  <p style="font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px;">
    If you have questions, contact your HR department or benefits administrator. This email was sent by Connect Quote 360.
  </p>
</body>
</html>`,
    });

    // Mark as invited
    await base44.entities.EmployeeEnrollment.update(enrollment_id, {
      status: enrollment.status === 'invited' ? 'invited' : enrollment.status,
      invited_at: new Date().toISOString(),
    });

    return Response.json({ success: true, email: enrollment.employee_email });
  } catch (error) {
    console.error('[function' + '] error:', error.message, error.stack);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});