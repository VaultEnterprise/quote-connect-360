import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * closeExpiredEnrollmentWindows
 * Scheduled automation: runs daily to close enrollment windows past their end_date.
 * Called by Base44 scheduled automation — admin context via service role.
 *
 * Windows are closed when:
 *  - end_date is set and is in the past
 *  - status is 'open' or 'closing_soon'
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin role required' }, { status: 403 });

    const now = new Date().toISOString();
    const closingSoonThreshold = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(); // T+3 days

    let offset = 0;
    let closed = 0;
    let markedClosingSoon = 0;

    while (true) {
      const batch = await base44.asServiceRole.entities.EnrollmentWindow.list('-end_date', 200, offset);
      if (!batch.length) break;

      for (const window of batch) {
        if (!window.end_date) continue;

        if (window.end_date < now && ['open', 'closing_soon'].includes(window.status)) {
          await base44.asServiceRole.entities.EnrollmentWindow.update(window.id, {
            status: 'closed',
            auto_closed_at: now,
          });
          closed++;
        } else if (
          window.end_date >= now &&
          window.end_date <= closingSoonThreshold &&
          window.status === 'open'
        ) {
          await base44.asServiceRole.entities.EnrollmentWindow.update(window.id, {
            status: 'closing_soon',
          });
          markedClosingSoon++;
        }
      }

      if (batch.length < 200) break;
      offset += 200;
    }

    console.log(`[closeExpiredEnrollmentWindows] closed=${closed} closingSoon=${markedClosingSoon}`);
    return Response.json({ success: true, closed, markedClosingSoon });
  } catch (error) {
    console.error('[closeExpiredEnrollmentWindows] error:', error.message);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});
