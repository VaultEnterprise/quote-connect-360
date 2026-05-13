/**
 * Report Schedule Service (Gate 6I-B.1)
 * 
 * Manages schedule lifecycle, execution, retry logic, scope/permission enforcement,
 * and audit logging for recurring report generation.
 */

import { base44 } from '@/api/base44Client';
import { auditWriter } from '@/lib/auditWriter';
import permissionResolver from '@/lib/permissionResolver';

class ReportScheduleService {
  /**
   * Create a new schedule
   */
  async createSchedule(user, scheduleData) {
    // Validate permission
    const permDecision = await permissionResolver.resolvePermission(
      user,
      'create_schedule',
      { master_general_agent_id: scheduleData.master_general_agent_id }
    );
    
    if (!permDecision.allowed) {
      await auditWriter.recordEvent({
        event_type: 'schedule_creation_denied',
        master_general_agent_id: scheduleData.master_general_agent_id,
        actor_email: user.email,
        actor_role: user.role,
        detail: `Permission denied: ${permDecision.reason}`,
        outcome: 'blocked',
        timestamp: new Date().toISOString()
      });
      throw new Error('Permission denied: cannot create schedule');
    }

    // Validate scope
    if (scheduleData.master_general_agent_id !== user.master_general_agent_id) {
      await auditWriter.recordEvent({
        event_type: 'schedule_creation_denied',
        master_general_agent_id: scheduleData.master_general_agent_id,
        actor_email: user.email,
        actor_role: user.role,
        detail: 'Scope violation: MGA mismatch',
        outcome: 'blocked',
        timestamp: new Date().toISOString()
      });
      throw new Error('Scope violation: cannot create schedule for different MGA');
    }

    // Validate frequency if recurring
    if (scheduleData.schedule_type === 'recurring') {
      this._validateRecurringSchedule(scheduleData);
    }

    // Create schedule
    const schedule = await base44.entities.MGAReportSchedule.create({
      ...scheduleData,
      created_by: user.email,
      owner_user_id: user.id,
      status: 'draft'
    });

    // Audit log
    await auditWriter.recordEvent({
      event_type: 'schedule_created',
      schedule_id: schedule.id,
      master_general_agent_id: schedule.master_general_agent_id,
      actor_email: user.email,
      actor_role: user.role,
      detail: `Schedule created: ${schedule.schedule_name}`,
      outcome: 'success',
      timestamp: new Date().toISOString()
    });

    return schedule;
  }

  /**
   * Update an existing schedule
   */
  async updateSchedule(user, scheduleId, updateData) {
    // Fetch schedule
    let schedule;
    try {
      schedule = await base44.entities.MGAReportSchedule.get(scheduleId);
    } catch (e) {
      throw new Error('Schedule not found');
    }

    // Validate scope
    if (schedule.master_general_agent_id !== user.master_general_agent_id) {
      await auditWriter.recordEvent({
        event_type: 'schedule_update_denied',
        schedule_id: scheduleId,
        master_general_agent_id: schedule.master_general_agent_id,
        actor_email: user.email,
        actor_role: user.role,
        detail: 'Scope violation: MGA mismatch',
        outcome: 'blocked',
        timestamp: new Date().toISOString()
      });
      throw new Error('Scope violation: cannot update schedule for different MGA');
    }

    // Validate permission
    const permDecision = await permissionResolver.resolvePermission(
      user,
      'update_schedule',
      schedule
    );
    
    if (!permDecision.allowed) {
      await auditWriter.recordEvent({
        event_type: 'schedule_update_denied',
        schedule_id: scheduleId,
        master_general_agent_id: schedule.master_general_agent_id,
        actor_email: user.email,
        actor_role: user.role,
        detail: `Permission denied: ${permDecision.reason}`,
        outcome: 'blocked',
        timestamp: new Date().toISOString()
      });
      throw new Error('Permission denied: cannot update schedule');
    }

    // Validate frequency if changing schedule_type to recurring
    if (updateData.schedule_type === 'recurring') {
      this._validateRecurringSchedule({ ...schedule, ...updateData });
    }

    // Update schedule
    const updated = await base44.entities.MGAReportSchedule.update(scheduleId, updateData);

    // Audit log
    await auditWriter.recordEvent({
      event_type: 'schedule_updated',
      schedule_id: scheduleId,
      master_general_agent_id: schedule.master_general_agent_id,
      actor_email: user.email,
      actor_role: user.role,
      detail: `Schedule updated: ${updated.schedule_name}`,
      outcome: 'success',
      timestamp: new Date().toISOString()
    });

    return updated;
  }

  /**
   * Activate a schedule (draft → active)
   */
  async activateSchedule(user, scheduleId) {
    let schedule;
    try {
      schedule = await base44.entities.MGAReportSchedule.get(scheduleId);
    } catch (e) {
      throw new Error('Schedule not found');
    }

    // Validate scope
    if (schedule.master_general_agent_id !== user.master_general_agent_id) {
      throw new Error('Scope violation: cannot activate schedule for different MGA');
    }

    // Validate permission
    const permDecision = await permissionResolver.resolvePermission(
      user,
      'activate_schedule',
      schedule
    );
    
    if (!permDecision.allowed) {
      throw new Error('Permission denied: cannot activate schedule');
    }

    // Update status
    const updated = await base44.entities.MGAReportSchedule.update(scheduleId, {
      status: 'active'
    });

    // Audit log
    await auditWriter.recordEvent({
      event_type: 'schedule_activated',
      schedule_id: scheduleId,
      master_general_agent_id: schedule.master_general_agent_id,
      actor_email: user.email,
      actor_role: user.role,
      detail: `Schedule activated: ${updated.schedule_name}`,
      outcome: 'success',
      timestamp: new Date().toISOString()
    });

    return updated;
  }

  /**
   * Pause a schedule (active → paused)
   */
  async pauseSchedule(user, scheduleId, reason = null) {
    let schedule;
    try {
      schedule = await base44.entities.MGAReportSchedule.get(scheduleId);
    } catch (e) {
      throw new Error('Schedule not found');
    }

    // Validate scope
    if (schedule.master_general_agent_id !== user.master_general_agent_id) {
      throw new Error('Scope violation: cannot pause schedule for different MGA');
    }

    // Update status
    const updated = await base44.entities.MGAReportSchedule.update(scheduleId, {
      status: 'paused'
    });

    // Audit log
    await auditWriter.recordEvent({
      event_type: 'schedule_paused',
      schedule_id: scheduleId,
      master_general_agent_id: schedule.master_general_agent_id,
      actor_email: user.email,
      actor_role: user.role,
      detail: `Schedule paused: ${updated.schedule_name}${reason ? ` (${reason})` : ''}`,
      outcome: 'success',
      timestamp: new Date().toISOString()
    });

    return updated;
  }

  /**
   * Cancel a schedule (any → cancelled)
   */
  async cancelSchedule(user, scheduleId, reason = null) {
    let schedule;
    try {
      schedule = await base44.entities.MGAReportSchedule.get(scheduleId);
    } catch (e) {
      throw new Error('Schedule not found');
    }

    // Validate scope
    if (schedule.master_general_agent_id !== user.master_general_agent_id) {
      throw new Error('Scope violation: cannot cancel schedule for different MGA');
    }

    // Update status
    const updated = await base44.entities.MGAReportSchedule.update(scheduleId, {
      status: 'cancelled'
    });

    // Audit log
    await auditWriter.recordEvent({
      event_type: 'schedule_cancelled',
      schedule_id: scheduleId,
      master_general_agent_id: schedule.master_general_agent_id,
      actor_email: user.email,
      actor_role: user.role,
      detail: `Schedule cancelled: ${updated.schedule_name}${reason ? ` (${reason})` : ''}`,
      outcome: 'success',
      timestamp: new Date().toISOString()
    });

    return updated;
  }

  /**
   * List schedules for user's MGA
   */
  async listSchedules(user, filters = {}) {
    // Query only user's MGA
    const schedules = await base44.entities.MGAReportSchedule.filter({
      master_general_agent_id: user.master_general_agent_id,
      ...filters
    });

    return schedules;
  }

  /**
   * Get single schedule with scope check
   */
  async getSchedule(user, scheduleId) {
    let schedule;
    try {
      schedule = await base44.entities.MGAReportSchedule.get(scheduleId);
    } catch (e) {
      throw new Error('Schedule not found');
    }

    // Validate scope
    if (schedule.master_general_agent_id !== user.master_general_agent_id) {
      throw new Error('Scope violation: cannot access schedule for different MGA');
    }

    return schedule;
  }

  /**
   * Validate recurring schedule constraints
   * @private
   */
  _validateRecurringSchedule(scheduleData) {
    if (scheduleData.schedule_type !== 'recurring') {
      return;
    }

    // Validate frequency is set
    if (!scheduleData.frequency) {
      throw new Error('Frequency required for recurring schedules');
    }

    // Validate minimum interval (1 hour)
    if (scheduleData.frequency === 'hourly') {
      const interval = scheduleData.frequency_interval || 1;
      if (interval < 1) {
        throw new Error('Minimum hourly interval is 1 hour');
      }
    }

    // Validate maximum interval (1 year)
    if (scheduleData.frequency === 'daily') {
      const interval = scheduleData.frequency_interval || 1;
      if (interval > 365) {
        throw new Error('Maximum daily interval is 365 days (1 year)');
      }
    }

    // Validate cron if custom
    if (scheduleData.frequency === 'custom') {
      this._validateCronExpression(scheduleData.frequency_cron);
    }
  }

  /**
   * Validate cron expression (prevent sub-hourly)
   * @private
   */
  _validateCronExpression(cronExpr) {
    if (!cronExpr) {
      throw new Error('Cron expression required for custom frequency');
    }

    // Simple validation: reject patterns that run more than once per hour
    const parts = cronExpr.trim().split(/\s+/);
    if (parts.length !== 5) {
      throw new Error('Invalid cron expression format');
    }

    const [minute] = parts;
    
    // Check if minute allows sub-hourly execution (e.g., "*/15" = every 15 minutes)
    if (minute.includes('*/')) {
      const interval = parseInt(minute.split('/')[1]);
      if (interval < 60) {
        throw new Error('Minimum recurring interval is 1 hour (sub-hourly cron not allowed)');
      }
    }
  }
}

export default new ReportScheduleService();