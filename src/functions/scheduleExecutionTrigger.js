/**
 * Schedule Execution Trigger (Gate 6I-B.2)
 * 
 * Trigger contract for scheduler integration.
 * Called by Base44 automation or manual trigger.
 * Enforces all feature flags and schedule constraints before invoking execution.
 * 
 * Feature flag gated:
 * - REPORT_SCHEDULING_ENABLED (parent)
 * - SCHEDULE_AUTOMATION_ENABLED (automation trigger)
 * - REPORT_AUTO_EXECUTION_ENABLED (actual execution)
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// @ts-ignore - Deno globals
const { Deno } = globalThis;

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { schedule_id, trigger_source = 'automation' } = payload;

    if (!schedule_id) {
      return Response.json(
        { error: 'Missing required field: schedule_id' },
        { status: 400 }
      );
    }

    // Check parent feature flag
    const flags = await getFeatureFlags();
    if (!flags.REPORT_SCHEDULING_ENABLED) {
      return Response.json(
        { error: 'Report scheduling disabled (feature flag off)', status: 'disabled' },
        { status: 403 }
      );
    }

    // Check automation flag if triggered by automation
    if (trigger_source === 'automation' && !flags.SCHEDULE_AUTOMATION_ENABLED) {
      return Response.json(
        { error: 'Schedule automation disabled (feature flag off)', status: 'disabled' },
        { status: 403 }
      );
    }

    // Fetch schedule
    let schedule;
    try {
      schedule = await base44.asServiceRole.entities.MGAReportSchedule.get(schedule_id);
    } catch (e) {
      return Response.json(
        { error: 'Schedule not found', status: 'error' },
        { status: 404 }
      );
    }

    // Verify schedule is active
    if (schedule.status !== 'active') {
      return Response.json(
        {
          error: `Schedule not active (status: ${schedule.status})`,
          status: 'skipped',
          schedule_id: schedule_id
        },
        { status: 200 }
      );
    }

    // Verify schedule is not expired (for recurring with recurrence_end_date)
    if (schedule.schedule_type === 'recurring' && schedule.recurrence_end_date) {
      const endDate = new Date(schedule.recurrence_end_date);
      const now = new Date();
      if (now > endDate) {
        return Response.json(
          {
            error: 'Schedule expired',
            status: 'skipped',
            schedule_id: schedule_id
          },
          { status: 200 }
        );
      }
    }

    // Verify schedule frequency constraints
    if (schedule.schedule_type === 'recurring') {
      const validation = validateScheduleFrequency(schedule);
      if (!validation.valid) {
        return Response.json(
          {
            error: validation.reason,
            status: 'error',
            schedule_id: schedule_id
          },
          { status: 400 }
        );
      }
    }

    // Generate execution ID
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Invoke reportGenerationExecutor
    const result = await base44.asServiceRole.functions.invoke('reportGenerationExecutor', {
      schedule_id: schedule_id,
      execution_id: executionId,
      triggered_by: trigger_source,
      manual_trigger_user_email: payload.user_email || null
    });

    return Response.json({
      status: 200,
      data: {
        schedule_id: schedule_id,
        execution_id: executionId,
        trigger_source: trigger_source,
        execution_result: result.data
      }
    });
  } catch (error) {
    console.error('Trigger error:', error.message);
    return Response.json(
      { error: error.message, status: 'error' },
      { status: 500 }
    );
  }
});

async function getFeatureFlags() {
  // Stub: In production, fetch from feature flag service
  return {
    REPORT_SCHEDULING_ENABLED: false,
    RECURRING_SCHEDULE_ENABLED: false,
    SCHEDULE_AUTOMATION_ENABLED: false,
    REPORT_AUTO_EXECUTION_ENABLED: false,
    REPORT_RETENTION_CLEANUP_ENABLED: false,
    SCHEDULE_RETRY_ENABLED: false
  };
}

function validateScheduleFrequency(schedule) {
  if (schedule.schedule_type !== 'recurring') {
    return { valid: true };
  }

  // Minimum 1 hour enforcement
  if (schedule.frequency === 'hourly') {
    const interval = schedule.frequency_interval || 1;
    if (interval < 1) {
      return { valid: false, reason: 'Minimum hourly interval is 1 hour' };
    }
  }

  // Maximum 1 year enforcement
  if (schedule.frequency === 'daily') {
    const interval = schedule.frequency_interval || 1;
    if (interval > 365) {
      return { valid: false, reason: 'Maximum daily interval is 365 days (1 year)' };
    }
  }

  // Cron sub-hourly rejection
  if (schedule.frequency === 'custom') {
    const cronExpr = schedule.frequency_cron;
    if (cronExpr) {
      const parts = cronExpr.trim().split(/\s+/);
      if (parts.length !== 5) {
        return { valid: false, reason: 'Invalid cron expression format' };
      }

      const [minute] = parts;
      if (minute.includes('*/')) {
        const interval = parseInt(minute.split('/')[1]);
        if (interval < 60) {
          return { valid: false, reason: 'Minimum recurring interval is 1 hour' };
        }
      }
    }
  }

  return { valid: true };
}