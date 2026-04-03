import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * expireQuoteScenarios
 * Scheduled automation: runs daily to mark expired QuoteScenarios.
 * Called by Base44 scheduled automation — admin context via service role.
 *
 * A scenario is expired when:
 *  - expires_at is set
 *  - expires_at date is in the past
 *  - status is NOT already 'expired', 'approved', or 'declined'
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin role required' }, { status: 403 });

    const now = new Date().toISOString();

    // Fetch all non-terminal scenarios that have an expiry date
    let offset = 0;
    let expired = 0;
    let skipped = 0;

    while (true) {
      const batch = await base44.asServiceRole.entities.QuoteScenario.list('-created_date', 500, offset);
      if (!batch.length) break;

      const toExpire = batch.filter(s =>
        s.expires_at &&
        s.expires_at < now &&
        !['expired', 'approved', 'declined'].includes(s.status)
      );

      await Promise.all(toExpire.map(s =>
        base44.asServiceRole.entities.QuoteScenario.update(s.id, {
          status: 'expired',
          expiry_processed_at: now,
        })
      ));

      expired += toExpire.length;
      skipped += batch.length - toExpire.length;

      if (batch.length < 500) break;
      offset += 500;
    }

    console.log(`[expireQuoteScenarios] expired=${expired} skipped=${skipped}`);
    return Response.json({ success: true, expired, skipped });
  } catch (error) {
    console.error('[expireQuoteScenarios] error:', error.message);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});
