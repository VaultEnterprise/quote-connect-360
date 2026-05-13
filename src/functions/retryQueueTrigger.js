/**
 * Retry Queue Trigger (Gate 6I-B.2)
 * 
 * Trigger contract for retry queue processing.
 * Called by Base44 automation on interval.
 * Enforces feature flags and retry constraints before processing.
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

    // Check feature flags
    const flags = await getFeatureFlags();
    if (!flags.REPORT_SCHEDULING_ENABLED) {
      return Response.json(
        { error: 'Report scheduling disabled', status: 'disabled' },
        { status: 403 }
      );
    }

    if (!flags.SCHEDULE_RETRY_ENABLED) {
      return Response.json({
        status: 200,
        data: {
          processed_count: 0,
          retried_count: 0,
          skipped_count: 0,
          reason: 'Retry processing disabled (feature flag off)'
        }
      });
    }

    // Invoke reportRetryQueueProcessor
    const result = await base44.asServiceRole.functions.invoke('reportRetryQueueProcessor', {
      batch_size: batch_size
    });

    return Response.json({
      status: 200,
      data: result.data
    });
  } catch (error) {
    console.error('Retry queue trigger error:', error.message);
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