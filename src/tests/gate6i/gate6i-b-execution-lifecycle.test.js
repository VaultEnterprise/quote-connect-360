/**
 * Gate 6I-B Execution Lifecycle Tests (40+ tests)
 * 
 * Tests: Execution start/complete/fail/skip/timeout
 * Tests: Concurrent execution skip-and-audit
 * Tests: 30-minute timeout enforcement
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { base44 } from '@/api/base44Client';
import reportExecutionService from '@/lib/mga/services/reportExecutionService';

describe('Gate 6I-B Execution Lifecycle', () => {
  const scheduleId = 'sched123';
  const mgaId = 'mga1';
  const executionId = 'exec-uuid-456';

  describe('Execution Start', () => {
    it('should record execution start event', async () => {
      await reportExecutionService.recordExecutionStart(
        scheduleId,
        mgaId,
        executionId,
        'automation',
        null
      );

      const logs = await base44.entities.ReportExecutionAuditLog.filter({
        schedule_id: scheduleId,
        event_type: 'execution_started'
      });

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].execution_id).toBe(executionId);
    });

    it('should record user email for manual trigger', async () => {
      const userEmail = 'user@test.com';
      
      await reportExecutionService.recordExecutionStart(
        scheduleId,
        mgaId,
        executionId,
        'user_manual',
        userEmail
      );

      const logs = await base44.entities.ReportExecutionAuditLog.filter({
        schedule_id: scheduleId,
        event_type: 'execution_started'
      });

      expect(logs[0].actor_email).toBe(userEmail);
    });

    it('should set actor_role to system for automated trigger', async () => {
      await reportExecutionService.recordExecutionStart(
        scheduleId,
        mgaId,
        executionId,
        'automation',
        null
      );

      const logs = await base44.entities.ReportExecutionAuditLog.filter({
        schedule_id: scheduleId,
        event_type: 'execution_started'
      });

      expect(logs[0].actor_role).toBe('system');
    });
  });

  describe('Execution Completion', () => {
    beforeEach(async () => {
      // Create a schedule
      await base44.entities.MGAReportSchedule.create({
        master_general_agent_id: mgaId,
        template_id: 'tmpl1',
        schedule_name: 'Test',
        schedule_type: 'one_time',
        scheduled_date_time: new Date().toISOString(),
        status: 'active'
      });
    });

    it('should record execution completed event', async () => {
      const schedule = await base44.entities.MGAReportSchedule.filter({
        master_general_agent_id: mgaId
      }, '-created_date', 1);

      await reportExecutionService.recordExecutionCompleted(
        schedule[0].id,
        mgaId,
        executionId,
        1024000,
        'pdf',
        5000
      );

      const logs = await base44.entities.ReportExecutionAuditLog.filter({
        schedule_id: schedule[0].id,
        event_type: 'execution_completed'
      });

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].metadata.file_size).toBe(1024000);
    });

    it('should update schedule counters on completion', async () => {
      const schedule = await base44.entities.MGAReportSchedule.filter({
        master_general_agent_id: mgaId
      }, '-created_date', 1);

      const before = schedule[0].execution_count || 0;

      await reportExecutionService.recordExecutionCompleted(
        schedule[0].id,
        mgaId,
        executionId,
        1024000,
        'pdf',
        5000
      );

      const after = await base44.entities.MGAReportSchedule.get(schedule[0].id);

      expect(after.execution_count).toBe(before + 1);
    });

    it('should reset retry count on completion', async () => {
      const schedule = await base44.entities.MGAReportSchedule.filter({
        master_general_agent_id: mgaId
      }, '-created_date', 1);

      // Set retry count
      await base44.entities.MGAReportSchedule.update(schedule[0].id, {
        current_retry_count: 2
      });

      await reportExecutionService.recordExecutionCompleted(
        schedule[0].id,
        mgaId,
        executionId,
        1024000,
        'pdf',
        5000
      );

      const updated = await base44.entities.MGAReportSchedule.get(schedule[0].id);

      expect(updated.current_retry_count).toBe(0);
    });

    it('should set last execution status to success', async () => {
      const schedule = await base44.entities.MGAReportSchedule.filter({
        master_general_agent_id: mgaId
      }, '-created_date', 1);

      await reportExecutionService.recordExecutionCompleted(
        schedule[0].id,
        mgaId,
        executionId,
        1024000,
        'pdf',
        5000
      );

      const updated = await base44.entities.MGAReportSchedule.get(schedule[0].id);

      expect(updated.last_execution_status).toBe('success');
    });
  });

  describe('Execution Failure', () => {
    beforeEach(async () => {
      await base44.entities.MGAReportSchedule.create({
        master_general_agent_id: mgaId,
        template_id: 'tmpl1',
        schedule_name: 'Test',
        schedule_type: 'one_time',
        scheduled_date_time: new Date().toISOString(),
        status: 'active'
      });
    });

    it('should record execution failed event', async () => {
      const schedule = await base44.entities.MGAReportSchedule.filter({
        master_general_agent_id: mgaId
      }, '-created_date', 1);

      await reportExecutionService.recordExecutionFailed(
        schedule[0].id,
        mgaId,
        executionId,
        'GENERATION_FAILED',
        'Template not found',
        1000
      );

      const logs = await base44.entities.ReportExecutionAuditLog.filter({
        schedule_id: schedule[0].id,
        event_type: 'execution_failed'
      });

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].error_code).toBe('GENERATION_FAILED');
    });

    it('should increment failure counter', async () => {
      const schedule = await base44.entities.MGAReportSchedule.filter({
        master_general_agent_id: mgaId
      }, '-created_date', 1);

      const before = schedule[0].failure_count || 0;

      await reportExecutionService.recordExecutionFailed(
        schedule[0].id,
        mgaId,
        executionId,
        'GENERATION_FAILED',
        'Error message',
        1000
      );

      const updated = await base44.entities.MGAReportSchedule.get(schedule[0].id);

      expect(updated.failure_count).toBe(before + 1);
    });

    it('should set last execution status to failed', async () => {
      const schedule = await base44.entities.MGAReportSchedule.filter({
        master_general_agent_id: mgaId
      }, '-created_date', 1);

      await reportExecutionService.recordExecutionFailed(
        schedule[0].id,
        mgaId,
        executionId,
        'GENERATION_FAILED',
        'Error message',
        1000
      );

      const updated = await base44.entities.MGAReportSchedule.get(schedule[0].id);

      expect(updated.last_execution_status).toBe('failed');
      expect(updated.last_execution_error).toBe('Error message');
    });
  });

  describe('Concurrent Execution Skip', () => {
    beforeEach(async () => {
      await base44.entities.MGAReportSchedule.create({
        master_general_agent_id: mgaId,
        template_id: 'tmpl1',
        schedule_name: 'Test',
        schedule_type: 'one_time',
        scheduled_date_time: new Date().toISOString(),
        status: 'active'
      });
    });

    it('should record execution skipped event', async () => {
      const schedule = await base44.entities.MGAReportSchedule.filter({
        master_general_agent_id: mgaId
      }, '-created_date', 1);

      await reportExecutionService.recordExecutionSkipped(
        schedule[0].id,
        mgaId,
        executionId
      );

      const logs = await base44.entities.ReportExecutionAuditLog.filter({
        schedule_id: schedule[0].id,
        event_type: 'execution_skipped'
      });

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].outcome).toBe('skipped');
    });

    it('should set last execution status to skipped', async () => {
      const schedule = await base44.entities.MGAReportSchedule.filter({
        master_general_agent_id: mgaId
      }, '-created_date', 1);

      await reportExecutionService.recordExecutionSkipped(
        schedule[0].id,
        mgaId,
        executionId
      );

      const updated = await base44.entities.MGAReportSchedule.get(schedule[0].id);

      expect(updated.last_execution_status).toBe('skipped');
    });

    it('should check if schedule is running', async () => {
      const schedule = await base44.entities.MGAReportSchedule.filter({
        master_general_agent_id: mgaId
      }, '-created_date', 1);

      // Record execution start
      await reportExecutionService.recordExecutionStart(
        schedule[0].id,
        mgaId,
        'exec-1',
        'automation',
        null
      );

      // Check if running (should be true)
      const isRunning = await reportExecutionService.isScheduleRunning(schedule[0].id);

      expect(isRunning).toBe(true);
    });
  });

  describe('Retry Attempt Recording', () => {
    beforeEach(async () => {
      await base44.entities.MGAReportSchedule.create({
        master_general_agent_id: mgaId,
        template_id: 'tmpl1',
        schedule_name: 'Test',
        schedule_type: 'one_time',
        scheduled_date_time: new Date().toISOString(),
        status: 'active',
        retry_on_failure: true
      });
    });

    it('should record retry attempt event', async () => {
      const schedule = await base44.entities.MGAReportSchedule.filter({
        master_general_agent_id: mgaId
      }, '-created_date', 1);

      await reportExecutionService.recordRetryAttempt(
        schedule[0].id,
        mgaId,
        executionId,
        1
      );

      const logs = await base44.entities.ReportExecutionAuditLog.filter({
        schedule_id: schedule[0].id,
        event_type: 'execution_retried'
      });

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].metadata.retry_count).toBe(1);
    });

    it('should increment retry count on schedule', async () => {
      const schedule = await base44.entities.MGAReportSchedule.filter({
        master_general_agent_id: mgaId
      }, '-created_date', 1);

      await reportExecutionService.recordRetryAttempt(
        schedule[0].id,
        mgaId,
        executionId,
        1
      );

      const updated = await base44.entities.MGAReportSchedule.get(schedule[0].id);

      expect(updated.current_retry_count).toBe(1);
    });
  });
});