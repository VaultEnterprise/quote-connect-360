/**
 * Report Execution Service (Gate 6I-B.1)
 * 
 * Manages report execution lifecycle, timeout enforcement, concurrent execution skip,
 * and retry queue management.
 */

import { base44 } from '@/api/base44Client';
import { auditWriter } from '@/lib/auditWriter';

const EXECUTION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

class ReportExecutionService {
  /**
   * Check if a schedule is currently running
   */
  async isScheduleRunning(scheduleId) {
    // Find most recent execution
    const recentExecutions = await base44.entities.ReportExecutionAuditLog.filter({
      schedule_id: scheduleId,
      event_type: 'execution_started'
    }, '-timestamp', 1);

    if (recentExecutions.length === 0) {
      return false;
    }

    const lastStart = new Date(recentExecutions[0].timestamp);
    const now = new Date();
    const elapsedMs = now - lastStart;

    // Still running if less than timeout has passed
    return elapsedMs < EXECUTION_TIMEOUT_MS;
  }

  /**
   * Record execution start event
   */
  async recordExecutionStart(scheduleId, mgaId, executionId, triggeredBy, userEmail = null) {
    await auditWriter.recordEvent({
      event_type: 'execution_started',
      schedule_id: scheduleId,
      execution_id: executionId,
      master_general_agent_id: mgaId,
      actor_email: userEmail || null,
      actor_role: userEmail ? 'user' : 'system',
      detail: `Report execution started (${triggeredBy})`,
      outcome: 'success',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Record execution completion
   */
  async recordExecutionCompleted(
    scheduleId,
    mgaId,
    executionId,
    fileSize,
    format,
    executionTimeMs
  ) {
    // Update schedule
    const schedule = await base44.entities.MGAReportSchedule.get(scheduleId);
    await base44.entities.MGAReportSchedule.update(scheduleId, {
      last_run_at: new Date().toISOString(),
      last_execution_status: 'success',
      last_execution_error: null,
      execution_count: (schedule.execution_count || 0) + 1,
      current_retry_count: 0
    });

    // Audit log
    await auditWriter.recordEvent({
      event_type: 'execution_completed',
      schedule_id: scheduleId,
      execution_id: executionId,
      master_general_agent_id: mgaId,
      detail: `Report executed successfully in ${Math.round(executionTimeMs / 1000)}s`,
      outcome: 'success',
      metadata: {
        file_size: fileSize,
        format: format,
        execution_time_ms: executionTimeMs
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Record execution failure
   */
  async recordExecutionFailed(
    scheduleId,
    mgaId,
    executionId,
    errorCode,
    errorMessage,
    executionTimeMs
  ) {
    // Update schedule
    const schedule = await base44.entities.MGAReportSchedule.get(scheduleId);
    await base44.entities.MGAReportSchedule.update(scheduleId, {
      last_execution_status: 'failed',
      last_execution_error: errorMessage,
      failure_count: (schedule.failure_count || 0) + 1
    });

    // Audit log
    await auditWriter.recordEvent({
      event_type: 'execution_failed',
      schedule_id: scheduleId,
      execution_id: executionId,
      master_general_agent_id: mgaId,
      detail: `Report execution failed: ${errorMessage}`,
      outcome: 'failed',
      error_code: errorCode,
      error_message: errorMessage,
      metadata: {
        execution_time_ms: executionTimeMs
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Record execution skipped (concurrent)
   */
  async recordExecutionSkipped(scheduleId, mgaId, executionId) {
    // Update schedule
    const schedule = await base44.entities.MGAReportSchedule.get(scheduleId);
    await base44.entities.MGAReportSchedule.update(scheduleId, {
      last_execution_status: 'skipped'
    });

    // Audit log
    await auditWriter.recordEvent({
      event_type: 'execution_skipped',
      schedule_id: scheduleId,
      execution_id: executionId,
      master_general_agent_id: mgaId,
      detail: 'Report execution skipped (previous run still active)',
      outcome: 'skipped',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Record retry attempt
   */
  async recordRetryAttempt(scheduleId, mgaId, executionId, retryCount) {
    // Update schedule
    await base44.entities.MGAReportSchedule.update(scheduleId, {
      current_retry_count: retryCount
    });

    // Audit log
    await auditWriter.recordEvent({
      event_type: 'execution_retried',
      schedule_id: scheduleId,
      execution_id: executionId,
      master_general_agent_id: mgaId,
      detail: `Report retry attempt ${retryCount}`,
      outcome: 'success',
      metadata: {
        retry_count: retryCount
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get schedules eligible for retry
   */
  async getRetryEligibleSchedules(batchSize = 50) {
    // Find schedules with: status=active, retry_on_failure=true, last_execution_status=failed
    const schedules = await base44.entities.MGAReportSchedule.filter({
      status: 'active',
      retry_on_failure: true,
      last_execution_status: 'failed'
    }, '-last_run_at', batchSize);

    // Filter by retry delay elapsed
    const now = new Date();
    return schedules.filter(schedule => {
      if (!schedule.last_run_at) return false;
      
      const lastRun = new Date(schedule.last_run_at);
      const retryDelay = (schedule.retry_delay_minutes || 60) * 60 * 1000;
      const elapsedMs = now - lastRun;

      return elapsedMs >= retryDelay && schedule.current_retry_count < schedule.max_retries;
    });
  }

  /**
   * Record report download
   */
  async recordReportDownload(scheduleId, mgaId, executionId, userEmail) {
    await auditWriter.recordEvent({
      event_type: 'report_downloaded',
      schedule_id: scheduleId,
      execution_id: executionId,
      master_general_agent_id: mgaId,
      actor_email: userEmail,
      detail: `Report downloaded by ${userEmail}`,
      outcome: 'success',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Record report deletion
   */
  async recordReportDeleted(scheduleId, mgaId, executionId, userEmail, reason = null) {
    await auditWriter.recordEvent({
      event_type: 'report_deleted',
      schedule_id: scheduleId,
      execution_id: executionId,
      master_general_agent_id: mgaId,
      actor_email: userEmail,
      detail: `Report deleted by ${userEmail}${reason ? ` (${reason})` : ''}`,
      outcome: 'success',
      timestamp: new Date().toISOString()
    });
  }
}

export default new ReportExecutionService();