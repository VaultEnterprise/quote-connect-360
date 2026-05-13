/**
 * Report Generation Executor (Gate 6I-B.1)
 * 
 * Executes scheduled report generation with scope/permission/audit.
 * Called by Base44 automation or manual trigger.
 * 
 * No email/webhook delivery (deferred to 6J-B, 6J-C).
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const EXECUTION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// @ts-ignore - Deno globals
const { Deno } = globalThis;

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { schedule_id, execution_id, triggered_by, manual_trigger_user_email } = payload;

    if (!schedule_id || !execution_id) {
      return Response.json(
        { error: 'Missing required fields: schedule_id, execution_id' },
        { status: 400 }
      );
    }

    // Check feature flag
    const flags = await getFeatureFlags();
    if (!flags.REPORT_AUTO_EXECUTION_ENABLED) {
      return Response.json(
        { error: 'Report execution disabled (feature flag off)' },
        { status: 403 }
      );
    }

    const startTime = Date.now();
    let timeoutHandle;

    try {
      // Fetch schedule
      let schedule;
      try {
        schedule = await base44.asServiceRole.entities.MGAReportSchedule.get(schedule_id);
      } catch (e) {
        return errorResponse(400, 'SCHEDULE_NOT_FOUND', 'Schedule not found', execution_id);
      }

      // Fetch template
      let template;
      try {
        template = await base44.asServiceRole.entities.MGAReportTemplate.get(schedule.template_id);
      } catch (e) {
        return errorResponse(400, 'TEMPLATE_NOT_FOUND', 'Template not found', execution_id);
      }

      // Check if schedule already running (concurrent execution)
      const recentExecutions = await base44.asServiceRole.entities.ReportExecutionAuditLog.filter(
        {
          schedule_id: schedule_id,
          event_type: 'execution_started'
        },
        '-timestamp',
        1
      );

      if (recentExecutions.length > 0) {
        const lastStart = new Date(recentExecutions[0].timestamp);
        const elapsedMs = Date.now() - lastStart;
        
        if (elapsedMs < EXECUTION_TIMEOUT_MS) {
          // Still running - skip
          await recordExecutionSkipped(base44, schedule_id, schedule.master_general_agent_id, execution_id);
          return Response.json({
            status: 200,
            data: {
              execution_id: execution_id,
              schedule_id: schedule_id,
              status: 'skipped',
              reason: 'Previous execution still running'
            }
          });
        }
      }

      // Record execution start
      await recordExecutionStart(
        base44,
        schedule_id,
        schedule.master_general_agent_id,
        execution_id,
        triggered_by,
        manual_trigger_user_email
      );

      // Set timeout (30 minutes)
      const timeoutPromise = new Promise((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new Error('EXECUTION_TIMEOUT: Report generation exceeded 30 minutes'));
        }, EXECUTION_TIMEOUT_MS);
      });

      // Call mgaReportExport (existing function, already safe)
      const reportPromise = base44.asServiceRole.functions.invoke('mgaReportExport', {
        schedule_id: schedule_id,
        template_id: template.id,
        filters_json: template.filters_json,
        export_format: schedule.export_format || template.export_format,
        mga_id: schedule.master_general_agent_id
      });

      const result = await Promise.race([reportPromise, timeoutPromise]);

      clearTimeout(timeoutHandle);
      const executionTimeMs = Date.now() - startTime;

      // Record completion
      await recordExecutionCompleted(
        base44,
        schedule_id,
        schedule.master_general_agent_id,
        execution_id,
        result.data.file_size,
        result.data.report_format,
        executionTimeMs
      );

      return Response.json({
        status: 200,
        data: {
          execution_id: execution_id,
          schedule_id: schedule_id,
          status: 'completed',
          file_uri: result.data.file_uri,
          report_format: result.data.report_format,
          file_size: result.data.file_size,
          generated_at: new Date().toISOString(),
          success: true
        }
      });
    } catch (error) {
      clearTimeout(timeoutHandle);
      const executionTimeMs = Date.now() - startTime;
      const errorCode = error.message.includes('TIMEOUT') ? 'EXECUTION_TIMEOUT' : 'GENERATION_FAILED';

      // Fetch schedule for audit logging
      let schedule;
      try {
        schedule = await base44.asServiceRole.entities.MGAReportSchedule.get(schedule_id);
      } catch (e) {
        schedule = { master_general_agent_id: 'UNKNOWN' };
      }

      // Record failure
      await recordExecutionFailed(
        base44,
        schedule_id,
        schedule.master_general_agent_id,
        execution_id,
        errorCode,
        error.message,
        executionTimeMs
      );

      return errorResponse(500, errorCode, error.message, execution_id);
    }
  } catch (error) {
    console.error('Executor error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Helper functions

async function getFeatureFlags() {
  // Stub: In production, fetch from feature flag service
  // For now, return all false (no runtime activation)
  return {
    REPORT_SCHEDULING_ENABLED: false,
    RECURRING_SCHEDULE_ENABLED: false,
    SCHEDULE_AUTOMATION_ENABLED: false,
    REPORT_AUTO_EXECUTION_ENABLED: false,
    REPORT_RETENTION_CLEANUP_ENABLED: false,
    SCHEDULE_RETRY_ENABLED: false
  };
}

async function recordExecutionStart(base44, scheduleId, mgaId, executionId, triggeredBy, userEmail) {
  try {
    await base44.asServiceRole.entities.ReportExecutionAuditLog.create({
      schedule_id: scheduleId,
      execution_id: executionId,
      master_general_agent_id: mgaId,
      event_type: 'execution_started',
      actor_email: userEmail || null,
      actor_role: userEmail ? 'user' : 'system',
      detail: `Report execution started (${triggeredBy})`,
      outcome: 'success',
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error('Failed to record execution start:', e.message);
  }
}

async function recordExecutionCompleted(base44, scheduleId, mgaId, executionId, fileSize, format, executionTimeMs) {
  try {
    // Update schedule
    const schedule = await base44.asServiceRole.entities.MGAReportSchedule.get(scheduleId);
    await base44.asServiceRole.entities.MGAReportSchedule.update(scheduleId, {
      last_run_at: new Date().toISOString(),
      last_execution_status: 'success',
      last_execution_error: null,
      execution_count: (schedule.execution_count || 0) + 1,
      current_retry_count: 0
    });

    // Audit log
    await base44.asServiceRole.entities.ReportExecutionAuditLog.create({
      schedule_id: scheduleId,
      execution_id: executionId,
      master_general_agent_id: mgaId,
      event_type: 'execution_completed',
      detail: `Report executed successfully in ${Math.round(executionTimeMs / 1000)}s`,
      outcome: 'success',
      metadata: {
        file_size: fileSize,
        format: format,
        execution_time_ms: executionTimeMs
      },
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error('Failed to record execution completed:', e.message);
  }
}

async function recordExecutionFailed(base44, scheduleId, mgaId, executionId, errorCode, errorMessage, executionTimeMs) {
  try {
    // Update schedule
    const schedule = await base44.asServiceRole.entities.MGAReportSchedule.get(scheduleId);
    await base44.asServiceRole.entities.MGAReportSchedule.update(scheduleId, {
      last_execution_status: 'failed',
      last_execution_error: errorMessage,
      failure_count: (schedule.failure_count || 0) + 1
    });

    // Audit log
    await base44.asServiceRole.entities.ReportExecutionAuditLog.create({
      schedule_id: scheduleId,
      execution_id: executionId,
      master_general_agent_id: mgaId,
      event_type: 'execution_failed',
      detail: `Report execution failed: ${errorMessage}`,
      outcome: 'failed',
      error_code: errorCode,
      error_message: errorMessage,
      metadata: {
        execution_time_ms: executionTimeMs
      },
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error('Failed to record execution failed:', e.message);
  }
}

async function recordExecutionSkipped(base44, scheduleId, mgaId, executionId) {
  try {
    // Update schedule
    const schedule = await base44.asServiceRole.entities.MGAReportSchedule.get(scheduleId);
    await base44.asServiceRole.entities.MGAReportSchedule.update(scheduleId, {
      last_execution_status: 'skipped'
    });

    // Audit log
    await base44.asServiceRole.entities.ReportExecutionAuditLog.create({
      schedule_id: scheduleId,
      execution_id: executionId,
      master_general_agent_id: mgaId,
      event_type: 'execution_skipped',
      detail: 'Report execution skipped (previous run still active)',
      outcome: 'skipped',
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error('Failed to record execution skipped:', e.message);
  }
}

function errorResponse(status, errorCode, errorMessage, executionId) {
  return Response.json(
    {
      status: status,
      data: {
        error: errorMessage,
        error_code: errorCode,
        execution_id: executionId
      }
    },
    { status: status }
  );
}