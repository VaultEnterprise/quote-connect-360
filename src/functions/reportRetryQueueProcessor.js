/**
 * Report Retry Queue Processor (Gate 6I-B.1)
 * 
 * Processes failed schedules in retry queue with exponential backoff.
 * Respects max retries and retry_delay_minutes.
 * 
 * Triggered by Base44 scheduled automation (every 15 minutes).
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

    const { batch_size = 50 } = payload;

    // Check feature flag
    const flags = await getFeatureFlags();
    if (!flags.SCHEDULE_RETRY_ENABLED) {
      return Response.json({
        status: 200,
        data: {
          processed_count: 0,
          retried_count: 0,
          success_count: 0,
          failed_again_count: 0,
          skipped_count: 0,
          reason: 'Retry feature disabled (feature flag off)'
        }
      });
    }

    // Find all schedules with retry enabled and failed status
    const failedSchedules = await base44.asServiceRole.entities.MGAReportSchedule.filter(
      {
        status: 'active',
        retry_on_failure: true,
        last_execution_status: 'failed'
      },
      '-last_run_at',
      batch_size
    );

    let retried = 0;
    let success = 0;
    let failed = 0;
    let skipped = 0;

    const now = new Date();

    for (const schedule of failedSchedules) {
      // Check if current_retry_count < max_retries
      if ((schedule.current_retry_count || 0) >= (schedule.max_retries || 3)) {
        // Max retries exceeded, skip
        skipped++;
        continue;
      }

      // Check if retry_delay_minutes has elapsed
      if (schedule.last_run_at) {
        const lastRun = new Date(schedule.last_run_at);
        const retryDelay = (schedule.retry_delay_minutes || 60) * 60 * 1000;
        const elapsedMs = now - lastRun;

        if (elapsedMs < retryDelay) {
          // Still waiting for retry delay
          skipped++;
          continue;
        }
      }

      // Trigger retry
      try {
        const executionId = generateExecutionId();
        const retryCount = (schedule.current_retry_count || 0) + 1;

        // Record retry attempt
        await base44.asServiceRole.entities.ReportExecutionAuditLog.create({
          schedule_id: schedule.id,
          execution_id: executionId,
          master_general_agent_id: schedule.master_general_agent_id,
          event_type: 'execution_retried',
          detail: `Report retry attempt ${retryCount}`,
          outcome: 'success',
          metadata: {
            retry_count: retryCount
          },
          timestamp: new Date().toISOString()
        });

        // Call reportGenerationExecutor
        const result = await base44.asServiceRole.functions.invoke('reportGenerationExecutor', {
          schedule_id: schedule.id,
          execution_id: executionId,
          triggered_by: 'retry_queue',
          manual_trigger_user_email: null
        });

        retried++;

        if (result.data?.success) {
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Failed to retry schedule ${schedule.id}:`, error.message);
        failed++;
      }
    }

    return Response.json({
      status: 200,
      data: {
        processed_count: failedSchedules.length,
        retried_count: retried,
        success_count: success,
        failed_again_count: failed,
        skipped_count: skipped
      }
    });
  } catch (error) {
    console.error('Retry queue processor error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Helper functions

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

function generateExecutionId() {
  return `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}