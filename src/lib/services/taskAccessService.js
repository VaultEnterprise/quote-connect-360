/**
 * Task Access Service
 * 
 * Enforces role permission + broker ownership/relationship scope for task access.
 * All denials audited. Safe payloads only.
 * 
 * Gate 7A-3 Phase 7A-3.4
 */

import { base44 } from '@/api/base44Client';
import permissionResolver from '@/lib/permissionResolver.js';
import { auditWriter } from '@/lib/auditWriter.js';

class TaskAccessService {
  /**
   * Get task with access control
   * @param {object} user
   * @param {string} taskId
   * @param {object} options — { override_reason?: string }
   * @returns {object} { task: {...safe_fields}, allowed: boolean, reason?: string }
   */
  async getTask(user, taskId, options = {}) {
    const actionName = 'read_task';

    let taskRecord;
    try {
      taskRecord = await base44.entities.CaseTask.get(taskId);
    } catch (e) {
      return {
        allowed: false,
        reason: 'TASK_NOT_FOUND',
        task: null
      };
    }

    const permissionDecision = await permissionResolver.resolvePermission(
      user,
      actionName,
      taskRecord
    );

    if (!permissionDecision.allowed) {
      if (['platform_admin', 'platform_super_admin'].includes(user.role)) {
        const overrideReason = options.override_reason?.trim();
        if (!overrideReason) {
          await this._auditDenial(user, actionName, taskRecord, 'DENY_OVERRIDE_MISSING_REASON');
          return {
            allowed: false,
            reason: 'DENY_OVERRIDE_MISSING_REASON',
            task: null
          };
        }

        await this._auditOverride(user, actionName, taskRecord, overrideReason);
        return {
          allowed: true,
          task: this._safeTaskPayload(taskRecord),
          override_applied: true
        };
      }

      await this._auditDenial(user, actionName, taskRecord, permissionDecision.reason);
      return {
        allowed: false,
        reason: permissionDecision.reason,
        task: null
      };
    }

    return {
      allowed: true,
      task: this._safeTaskPayload(taskRecord)
    };
  }

  /**
   * List tasks with access control
   * @param {object} user
   * @returns {object} { tasks: [], allowed: number, denied: number }
   */
  async listTasks(user) {
    let allTasks;
    try {
      allTasks = await base44.entities.CaseTask.list();
    } catch (e) {
      return {
        tasks: [],
        allowed: 0,
        denied: 0,
        error: e.message
      };
    }

    const allowed = [];
    const denied = [];

    for (const taskRecord of allTasks) {
      const permissionDecision = await permissionResolver.resolvePermission(
        user,
        'read_task',
        taskRecord
      );

      if (permissionDecision.allowed) {
        allowed.push(this._safeTaskPayload(taskRecord));
      } else {
        denied.push(taskRecord.id);
        await this._auditDenial(user, 'read_task', taskRecord, permissionDecision.reason);
      }
    }

    return {
      tasks: allowed,
      allowed: allowed.length,
      denied: denied.length
    };
  }

  /**
   * Create task with access control
   * @param {object} user
   * @param {object} taskData
   * @returns {object} { task: {...}, allowed: boolean, reason?: string }
   */
  async createTask(user, taskData) {
    const actionName = 'create_task';

    const rolePerms = permissionResolver.getActionsByRole(user.role) || [];
    if (!rolePerms.includes(actionName)) {
      await this._auditDenial(user, actionName, null, 'DENY_ROLE_LACKS_PERMISSION');
      return {
        allowed: false,
        reason: 'DENY_ROLE_LACKS_PERMISSION',
        task: null
      };
    }

    if (['platform_admin', 'platform_super_admin'].includes(user.role)) {
      const newTask = await base44.entities.CaseTask.create(taskData);
      return {
        allowed: true,
        task: this._safeTaskPayload(newTask)
      };
    }

    if (['broker_user', 'broker_admin'].includes(user.role)) {
      if (taskData.broker_agency_id !== user.broker_agency_id) {
        await this._auditDenial(user, actionName, taskData, 'DENY_NOT_BROKER_OWNER');
        return {
          allowed: false,
          reason: 'DENY_NOT_BROKER_OWNER',
          task: null
        };
      }

      const newTask = await base44.entities.CaseTask.create(taskData);
      return {
        allowed: true,
        task: this._safeTaskPayload(newTask)
      };
    }

    if (['mga_user', 'mga_admin'].includes(user.role)) {
      if (!taskData.relationship_id) {
        await this._auditDenial(user, actionName, taskData, 'DENY_MISSING_RELATIONSHIP');
        return {
          allowed: false,
          reason: 'DENY_MISSING_RELATIONSHIP',
          task: null
        };
      }

      const newTask = await base44.entities.CaseTask.create(taskData);
      return {
        allowed: true,
        task: this._safeTaskPayload(newTask)
      };
    }

    return {
      allowed: false,
      reason: 'DENY_INVALID_ROLE',
      task: null
    };
  }

  /**
   * Update task with access control
   * @param {object} user
   * @param {string} taskId
   * @param {object} updates
   * @returns {object} { task: {...}, allowed: boolean, reason?: string }
   */
  async updateTask(user, taskId, updates) {
    const actionName = 'update_task';

    let taskRecord;
    try {
      taskRecord = await base44.entities.CaseTask.get(taskId);
    } catch (e) {
      return {
        allowed: false,
        reason: 'TASK_NOT_FOUND',
        task: null
      };
    }

    const permissionDecision = await permissionResolver.resolvePermission(
      user,
      actionName,
      taskRecord
    );

    if (!permissionDecision.allowed) {
      await this._auditDenial(user, actionName, taskRecord, permissionDecision.reason);
      return {
        allowed: false,
        reason: permissionDecision.reason,
        task: null
      };
    }

    const updated = await base44.entities.CaseTask.update(taskId, updates);
    return {
      allowed: true,
      task: this._safeTaskPayload(updated)
    };
  }

  /**
   * Audit denied access
   * @private
   */
  async _auditDenial(user, action, record, reason) {
    try {
      await auditWriter.recordEvent({
        event_type: 'task_access_denied',
        entity_id: record?.id || 'NEW_RECORD',
        actor_email: user.email,
        actor_role: user.role,
        action,
        detail: `Task access denied: ${reason}`,
        outcome: 'blocked',
        reason_code: reason,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error('Failed to audit task denial:', e.message);
    }
  }

  /**
   * Audit platform admin override
   * @private
   */
  async _auditOverride(user, action, record, overrideReason) {
    try {
      await auditWriter.recordEvent({
        event_type: 'task_access_override',
        entity_id: record?.id || 'NEW_RECORD',
        actor_email: user.email,
        actor_role: user.role,
        action,
        detail: `Task access override by ${user.role}: ${overrideReason}`,
        outcome: 'override',
        reason_code: 'PLATFORM_ADMIN_OVERRIDE',
        override_reason: overrideReason,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error('Failed to audit task override:', e.message);
    }
  }

  /**
   * Return safe task payload (no internals)
   * @private
   */
  _safeTaskPayload(taskRecord) {
    return {
      id: taskRecord.id,
      case_id: taskRecord.case_id,
      title: taskRecord.title,
      description: taskRecord.description,
      task_type: taskRecord.task_type,
      status: taskRecord.status,
      priority: taskRecord.priority,
      assigned_to: taskRecord.assigned_to,
      due_date: taskRecord.due_date,
      completed_at: taskRecord.completed_at,
      completed_by: taskRecord.completed_by,
      employer_name: taskRecord.employer_name,
      broker_agency_id: taskRecord.broker_agency_id,
      relationship_id: taskRecord.relationship_id || undefined
    };
  }
}

export default new TaskAccessService();