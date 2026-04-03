import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * autoCreateRenewalCycles
 * Scheduled automation: runs daily to create RenewalCycle records for active cases
 * whose renewal date is within the configured lookahead window (default: 120 days).
 *
 * Avoids duplicates by checking for existing renewal cycles per case.
 * Called by Base44 scheduled automation.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin role required' }, { status: 403 });

    const LOOKAHEAD_DAYS = 120;
    const now = new Date();
    const cutoffDate = new Date(now.getTime() + LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000);
    const nowIso = now.toISOString().slice(0, 10);
    const cutoffIso = cutoffDate.toISOString().slice(0, 10);

    // Fetch active cases with a renewal date set
    const activeCases = await base44.asServiceRole.entities.BenefitCase.filter(
      { stage: 'active' }, 'renewal_date', 500
    );

    const eligibleCases = activeCases.filter(c =>
      c.renewal_date &&
      c.renewal_date >= nowIso &&
      c.renewal_date <= cutoffIso
    );

    let created = 0;
    let skipped = 0;

    for (const c of eligibleCases) {
      // Check if a renewal cycle already exists for this case
      const existing = await base44.asServiceRole.entities.RenewalCycle.filter(
        { case_id: c.id }, '-created_date', 1
      );

      if (existing.length > 0) {
        skipped++;
        continue;
      }

      // Create renewal cycle
      await base44.asServiceRole.entities.RenewalCycle.create({
        case_id: c.id,
        employer_group_id: c.employer_group_id || null,
        employer_name: c.employer_name || '',
        renewal_date: c.renewal_date,
        status: 'pre_renewal',
        assigned_to: c.assigned_to || null,
        notes: `Auto-created ${LOOKAHEAD_DAYS}-day renewal trigger for ${c.employer_name}`,
      });
      created++;

      // Create a task for the assigned broker
      if (c.assigned_to) {
        await base44.asServiceRole.entities.CaseTask.create({
          case_id: c.id,
          employer_name: c.employer_name || '',
          title: `Renewal approaching — ${c.employer_name}`,
          description: `Renewal date: ${c.renewal_date}. Begin pre-renewal strategy: review current rates, consider remarketing options, prepare renewal package.`,
          task_type: 'action_required',
          priority: 'high',
          status: 'pending',
          assigned_to: c.assigned_to,
          due_date: new Date(new Date(c.renewal_date).getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        });
      }
    }

    console.log(`[autoCreateRenewalCycles] created=${created} skipped=${skipped} eligible=${eligibleCases.length}`);
    return Response.json({ success: true, created, skipped, eligible: eligibleCases.length });
  } catch (error) {
    console.error('[autoCreateRenewalCycles] error:', error.message);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});
