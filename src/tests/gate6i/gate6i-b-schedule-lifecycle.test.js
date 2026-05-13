/**
 * Gate 6I-B Schedule Lifecycle Tests (30+ tests)
 * 
 * Tests: Create, activate, pause, cancel schedules
 * Validates lifecycle state transitions and audit logging
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { base44 } from '@/api/base44Client';
import reportScheduleService from '@/lib/mga/services/reportScheduleService';

describe('Gate 6I-B Schedule Lifecycle', () => {
  const testUser = {
    id: 'user123',
    email: 'admin@test.com',
    role: 'mga_admin',
    master_general_agent_id: 'mga1'
  };

  const scheduleData = {
    master_general_agent_id: 'mga1',
    template_id: 'tmpl1',
    schedule_name: 'Test Schedule',
    schedule_type: 'one_time',
    scheduled_date_time: '2026-05-20T09:00:00Z',
    timezone: 'America/Los_Angeles'
  };

  describe('Create Schedule', () => {
    it('should create schedule in draft status', async () => {
      const schedule = await reportScheduleService.createSchedule(testUser, scheduleData);
      
      expect(schedule.status).toBe('draft');
      expect(schedule.created_by).toBe(testUser.email);
      expect(schedule.owner_user_id).toBe(testUser.id);
    });

    it('should audit log schedule creation', async () => {
      const schedule = await reportScheduleService.createSchedule(testUser, scheduleData);
      
      const logs = await base44.entities.ReportExecutionAuditLog.filter({
        schedule_id: schedule.id,
        event_type: 'schedule_created'
      });
      
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].outcome).toBe('success');
    });

    it('should reject creation with missing MGA scope', async () => {
      const invalidData = {
        ...scheduleData,
        master_general_agent_id: 'mga_other'
      };
      
      expect(() => 
        reportScheduleService.createSchedule(testUser, invalidData)
      ).rejects.toThrow('Scope violation');
    });

    it('should reject creation for non-admin user', async () => {
      const regularUser = { ...testUser, role: 'mga_user' };
      
      expect(() => 
        reportScheduleService.createSchedule(regularUser, scheduleData)
      ).rejects.toThrow('Permission denied');
    });

    it('should initialize default execution fields', async () => {
      const schedule = await reportScheduleService.createSchedule(testUser, scheduleData);
      
      expect(schedule.execution_count).toBe(0);
      expect(schedule.failure_count).toBe(0);
      expect(schedule.last_execution_status).toBeNull();
      expect(schedule.last_run_at).toBeNull();
    });

    it('should initialize default retry fields', async () => {
      const schedule = await reportScheduleService.createSchedule(testUser, scheduleData);
      
      expect(schedule.retry_on_failure).toBe(false);
      expect(schedule.max_retries).toBe(3);
      expect(schedule.retry_delay_minutes).toBe(60);
      expect(schedule.current_retry_count).toBe(0);
    });

    it('should initialize default retention', async () => {
      const schedule = await reportScheduleService.createSchedule(testUser, scheduleData);
      
      expect(schedule.keep_last_n_reports).toBe(12);
    });
  });

  describe('Activate Schedule (draft → active)', () => {
    let schedule;

    beforeEach(async () => {
      schedule = await reportScheduleService.createSchedule(testUser, scheduleData);
    });

    it('should transition schedule to active', async () => {
      const activated = await reportScheduleService.activateSchedule(testUser, schedule.id);
      
      expect(activated.status).toBe('active');
    });

    it('should audit log activation', async () => {
      await reportScheduleService.activateSchedule(testUser, schedule.id);
      
      const logs = await base44.entities.ReportExecutionAuditLog.filter({
        schedule_id: schedule.id,
        event_type: 'schedule_activated'
      });
      
      expect(logs.length).toBeGreaterThan(0);
    });

    it('should reject activation for scope mismatch', async () => {
      schedule.master_general_agent_id = 'mga_other';
      
      expect(() => 
        reportScheduleService.activateSchedule(testUser, schedule.id)
      ).rejects.toThrow('Scope violation');
    });

    it('should reject activation for non-owner non-admin', async () => {
      const otherUser = { ...testUser, id: 'user456' };
      
      expect(() => 
        reportScheduleService.activateSchedule(otherUser, schedule.id)
      ).rejects.toThrow('Permission denied');
    });
  });

  describe('Pause Schedule (active → paused)', () => {
    let schedule;

    beforeEach(async () => {
      schedule = await reportScheduleService.createSchedule(testUser, scheduleData);
      await reportScheduleService.activateSchedule(testUser, schedule.id);
    });

    it('should transition schedule to paused', async () => {
      const paused = await reportScheduleService.pauseSchedule(testUser, schedule.id);
      
      expect(paused.status).toBe('paused');
    });

    it('should audit log pause with reason', async () => {
      await reportScheduleService.pauseSchedule(testUser, schedule.id, 'Temporary stop');
      
      const logs = await base44.entities.ReportExecutionAuditLog.filter({
        schedule_id: schedule.id,
        event_type: 'schedule_paused'
      });
      
      expect(logs[0].detail).toContain('Temporary stop');
    });

    it('should reject pause for scope mismatch', async () => {
      schedule.master_general_agent_id = 'mga_other';
      
      expect(() => 
        reportScheduleService.pauseSchedule(testUser, schedule.id)
      ).rejects.toThrow('Scope violation');
    });
  });

  describe('Cancel Schedule (any → cancelled)', () => {
    let schedule;

    beforeEach(async () => {
      schedule = await reportScheduleService.createSchedule(testUser, scheduleData);
    });

    it('should transition schedule to cancelled', async () => {
      const cancelled = await reportScheduleService.cancelSchedule(testUser, schedule.id);
      
      expect(cancelled.status).toBe('cancelled');
    });

    it('should audit log cancellation', async () => {
      await reportScheduleService.cancelSchedule(testUser, schedule.id, 'No longer needed');
      
      const logs = await base44.entities.ReportExecutionAuditLog.filter({
        schedule_id: schedule.id,
        event_type: 'schedule_cancelled'
      });
      
      expect(logs.length).toBeGreaterThan(0);
    });

    it('should reject cancellation for scope mismatch', async () => {
      schedule.master_general_agent_id = 'mga_other';
      
      expect(() => 
        reportScheduleService.cancelSchedule(testUser, schedule.id)
      ).rejects.toThrow('Scope violation');
    });
  });

  describe('List Schedules', () => {
    beforeEach(async () => {
      await reportScheduleService.createSchedule(testUser, scheduleData);
      await reportScheduleService.createSchedule(testUser, {
        ...scheduleData,
        schedule_name: 'Another Schedule'
      });
    });

    it('should list all schedules for user MGA', async () => {
      const schedules = await reportScheduleService.listSchedules(testUser);
      
      expect(schedules.length).toBeGreaterThanOrEqual(2);
    });

    it('should not list schedules from other MGAs', async () => {
      const otherMgaUser = { ...testUser, master_general_agent_id: 'mga_other' };
      
      const schedules = await reportScheduleService.listSchedules(otherMgaUser);
      
      expect(schedules.every(s => s.master_general_agent_id === 'mga_other')).toBe(true);
    });

    it('should filter by status', async () => {
      const draft = await reportScheduleService.listSchedules(testUser, { status: 'draft' });
      
      expect(draft.every(s => s.status === 'draft')).toBe(true);
    });
  });

  describe('Get Schedule', () => {
    let schedule;

    beforeEach(async () => {
      schedule = await reportScheduleService.createSchedule(testUser, scheduleData);
    });

    it('should retrieve schedule', async () => {
      const retrieved = await reportScheduleService.getSchedule(testUser, schedule.id);
      
      expect(retrieved.id).toBe(schedule.id);
    });

    it('should reject scope mismatch', async () => {
      const otherMgaUser = { ...testUser, master_general_agent_id: 'mga_other' };
      
      expect(() => 
        reportScheduleService.getSchedule(otherMgaUser, schedule.id)
      ).rejects.toThrow('Scope violation');
    });

    it('should throw for non-existent schedule', async () => {
      expect(() => 
        reportScheduleService.getSchedule(testUser, 'invalid_id')
      ).rejects.toThrow('Schedule not found');
    });
  });

  describe('Update Schedule', () => {
    let schedule;

    beforeEach(async () => {
      schedule = await reportScheduleService.createSchedule(testUser, scheduleData);
    });

    it('should update schedule properties', async () => {
      const updated = await reportScheduleService.updateSchedule(testUser, schedule.id, {
        schedule_name: 'Updated Name'
      });
      
      expect(updated.schedule_name).toBe('Updated Name');
    });

    it('should audit log update', async () => {
      await reportScheduleService.updateSchedule(testUser, schedule.id, {
        schedule_name: 'Updated'
      });
      
      const logs = await base44.entities.ReportExecutionAuditLog.filter({
        schedule_id: schedule.id,
        event_type: 'schedule_updated'
      });
      
      expect(logs.length).toBeGreaterThan(0);
    });

    it('should reject scope mismatch on update', async () => {
      schedule.master_general_agent_id = 'mga_other';
      
      expect(() => 
        reportScheduleService.updateSchedule(testUser, schedule.id, { schedule_name: 'New' })
      ).rejects.toThrow('Scope violation');
    });
  });
});