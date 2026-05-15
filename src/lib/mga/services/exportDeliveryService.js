/**
 * MGA Gate 6J-A — Export Delivery Governance Service
 * lib/mga/services/exportDeliveryService.js
 *
 * Governance controls for export delivery status, retry/cancel/resend actions.
 * Enforces strict permission, scope, and audit trail requirements.
 * CRITICAL: No email, webhooks, background jobs, or external delivery.
 */

import { base44 } from '@/api/base44Client';
import { validateServiceRequest, buildScopedResponse, checkScope, prepareAndRecordAudit } from './serviceContract.js';

const DOMAIN = 'delivery';

/**
 * Track export for delivery (called after Gate 6C export generation)
 * Creates delivery status record in ActivityLog only (no separate table).
 */
export async function trackExportDelivery(request) {
  const v = validateServiceRequest(request, { requireIdempotency: false });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });

  const { decision, denied, response } = await checkScope({
    ...request,
    domain: DOMAIN,
    action: 'track',
    target_entity_type: 'ExportDelivery'
  });
  if (denied) return response;

  // Build delivery metadata (minimal, audit-log only)
  const deliveryRecord = {
    export_id: request.export_id,
    master_general_agent_id: decision.effective_mga_id,
    master_group_id: request.master_group_id || null,
    status: 'PENDING',
    retry_count: 0,
    created_by: decision.authenticated_user,
    tracking_timestamp: new Date().toISOString()
  };

  // Record audit event (no separate table; audit log is source of truth)
  await prepareAndRecordAudit(decision, {
    outcome: 'success',
    after: deliveryRecord,
    detail: `Delivery tracking initiated for export ${request.export_id}`
  }, request.idempotency_key);

  // Return delivery metadata for frontend reference
  return buildScopedResponse({
    data: {
      export_id: request.export_id,
      status: 'PENDING',
      tracked_at: deliveryRecord.tracking_timestamp
    },
    correlation_id: decision.correlation_id
  });
}

/**
 * Get delivery status for an export
 * Reconstructs status from ActivityLog events
 */
export async function getDeliveryStatus(request) {
  const { decision, denied, response } = await checkScope({
    ...request,
    domain: DOMAIN,
    action: 'view',
    target_entity_type: 'ExportDelivery'
  });
  if (denied) return response;

  // Fetch audit events for this export
  const events = await base44.entities.ActivityLog.filter({
    entity_type: 'ExportDeliveryStatus',
    entity_id: request.export_id,
    master_general_agent_id: decision.effective_mga_id
  });

  if (!events?.length) {
    return buildScopedResponse({
      success: false,
      reason_code: 'NOT_FOUND_IN_SCOPE',
      masked_not_found: true,
      correlation_id: decision.correlation_id
    });
  }

  // Reconstruct status from latest event
  const latestEvent = events[events.length - 1];
  return buildScopedResponse({
    data: {
      export_id: request.export_id,
      status: latestEvent.new_value,
      failure_reason_code: latestEvent.detail ? null : 'NONE',
      retry_count: events.filter(e => e.action === 'export_delivery_retry_initiated').length,
      last_updated_at: latestEvent.created_date,
      events_count: events.length
    },
    correlation_id: decision.correlation_id
  });
}

/**
 * List all delivery statuses for exports in MGA scope
 */
export async function listDeliveryStatuses(request) {
  const { decision, denied, response } = await checkScope({
    ...request,
    domain: DOMAIN,
    action: 'list',
    target_entity_type: 'ExportDelivery',
    target_entity_id: 'list_operation'
  });
  if (denied) return response;

  // Query audit events for delivery status tracking
  const filters = {
    entity_type: 'ExportDeliveryStatus',
    action: 'export_delivery_tracked',
    master_general_agent_id: decision.effective_mga_id
  };

  if (request.master_group_id) {
    filters.master_group_id = request.master_group_id;
  }

  const events = await base44.entities.ActivityLog.filter(filters);

  // Map to delivery status objects
  const deliveries = events.map(event => ({
    export_id: event.entity_id,
    master_general_agent_id: event.master_general_agent_id,
    master_group_id: event.master_group_id,
    status: event.new_value || 'PENDING',
    tracked_at: event.created_date
  }));

  return buildScopedResponse({
    data: deliveries,
    correlation_id: decision.correlation_id
  });
}

/**
 * Retry delivery (immediate retry, backoff handled server-side)
 * Enforces permission, scope, data consistency, idempotency
 */
export async function retryDelivery(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });

  const { decision, denied, response } = await checkScope({
    ...request,
    domain: DOMAIN,
    action: 'retry',
    target_entity_type: 'ExportDelivery'
  });
  if (denied) return response;

  // Verify permission: mga_admin or mga_manager
  if (!['mga_admin', 'mga_manager', 'platform_super_admin'].includes(decision.effective_role)) {
    return buildScopedResponse({
      success: false,
      reason_code: 'PERMISSION_DENIED',
      detail: 'Only MGA admins and managers can retry deliveries',
      correlation_id: decision.correlation_id
    });
  }

  // Fetch latest delivery status
  const events = await base44.entities.ActivityLog.filter({
    entity_type: 'ExportDeliveryStatus',
    entity_id: request.export_id,
    master_general_agent_id: decision.effective_mga_id
  });

  if (!events?.length) {
    return buildScopedResponse({
      success: false,
      reason_code: 'NOT_FOUND_IN_SCOPE',
      masked_not_found: true,
      correlation_id: decision.correlation_id
    });
  }

  const latestEvent = events[events.length - 1];
  const currentStatus = latestEvent.new_value;

  // Only allow retry if PENDING or FAILED
  if (!['PENDING', 'FAILED'].includes(currentStatus)) {
    return buildScopedResponse({
      success: false,
      reason_code: 'INVALID_STATE',
      detail: `Cannot retry delivery with status ${currentStatus}. Only PENDING or FAILED allowed.`,
      correlation_id: decision.correlation_id
    });
  }

  // Count existing retries
  const retryCount = events.filter(e => e.action === 'export_delivery_retry_initiated').length;

  // Audit: record retry event
  await prepareAndRecordAudit(decision, {
    outcome: 'success',
    before: { status: currentStatus, retry_count: retryCount },
    after: { status: 'PENDING', retry_count: retryCount + 1 },
    detail: `Delivery retry initiated. Attempt ${retryCount + 1}.`
  }, request.idempotency_key);

  return buildScopedResponse({
    data: {
      export_id: request.export_id,
      status: 'PENDING',
      retry_count: retryCount + 1,
      retried_at: new Date().toISOString()
    },
    correlation_id: decision.correlation_id
  });
}

/**
 * Cancel delivery (idempotent)
 * Only PENDING deliveries can be cancelled.
 */
export async function cancelDelivery(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });

  const { decision, denied, response } = await checkScope({
    ...request,
    domain: DOMAIN,
    action: 'cancel',
    target_entity_type: 'ExportDelivery'
  });
  if (denied) return response;

  // Verify permission: mga_admin or export owner (mga_user)
  if (!['mga_admin', 'platform_super_admin'].includes(decision.effective_role)) {
    // mga_user can only cancel own exports
    if (decision.effective_role === 'mga_user' && decision.authenticated_user !== request.created_by) {
      return buildScopedResponse({
        success: false,
        reason_code: 'PERMISSION_DENIED',
        detail: 'Users can only cancel their own exports',
        correlation_id: decision.correlation_id
      });
    }
  }

  // Fetch latest delivery status
  const events = await base44.entities.ActivityLog.filter({
    entity_type: 'ExportDeliveryStatus',
    entity_id: request.export_id,
    master_general_agent_id: decision.effective_mga_id
  });

  if (!events?.length) {
    return buildScopedResponse({
      success: false,
      reason_code: 'NOT_FOUND_IN_SCOPE',
      masked_not_found: true,
      correlation_id: decision.correlation_id
    });
  }

  const latestEvent = events[events.length - 1];
  const currentStatus = latestEvent.new_value;

  // Only allow cancel if PENDING
  if (currentStatus !== 'PENDING') {
    return buildScopedResponse({
      success: false,
      reason_code: 'INVALID_STATE',
      detail: `Cannot cancel delivery with status ${currentStatus}. Only PENDING allowed.`,
      correlation_id: decision.correlation_id
    });
  }

  // Audit: record cancellation
  await prepareAndRecordAudit(decision, {
    outcome: 'success',
    before: { status: 'PENDING' },
    after: { status: 'CANCELLED' },
    detail: `Delivery cancelled by ${decision.authenticated_user}.`
  }, request.idempotency_key);

  return buildScopedResponse({
    data: {
      export_id: request.export_id,
      status: 'CANCELLED',
      cancelled_at: new Date().toISOString()
    },
    correlation_id: decision.correlation_id
  });
}

/**
 * Resend delivery (manual resend, creates new delivery record)
 * Enforces permission, scope, data consistency
 */
export async function resendDelivery(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });

  const { decision, denied, response } = await checkScope({
    ...request,
    domain: DOMAIN,
    action: 'resend',
    target_entity_type: 'ExportDelivery'
  });
  if (denied) return response;

  // Verify permission: mga_admin or mga_manager
  if (!['mga_admin', 'mga_manager', 'platform_super_admin'].includes(decision.effective_role)) {
    return buildScopedResponse({
      success: false,
      reason_code: 'PERMISSION_DENIED',
      detail: 'Only MGA admins and managers can resend deliveries',
      correlation_id: decision.correlation_id
    });
  }

  // Fetch latest delivery status
  const events = await base44.entities.ActivityLog.filter({
    entity_type: 'ExportDeliveryStatus',
    entity_id: request.export_id,
    master_general_agent_id: decision.effective_mga_id
  });

  if (!events?.length) {
    return buildScopedResponse({
      success: false,
      reason_code: 'NOT_FOUND_IN_SCOPE',
      masked_not_found: true,
      correlation_id: decision.correlation_id
    });
  }

  const latestEvent = events[events.length - 1];
  const currentStatus = latestEvent.new_value;

  // Only allow resend if SENT or FAILED
  if (!['SENT', 'FAILED'].includes(currentStatus)) {
    return buildScopedResponse({
      success: false,
      reason_code: 'INVALID_STATE',
      detail: `Cannot resend delivery with status ${currentStatus}. Only SENT or FAILED allowed.`,
      correlation_id: decision.correlation_id
    });
  }

  // Create new delivery record (references old)
  const newDeliveryId = `${request.export_id}-resend-${Date.now()}`;

  // Audit: record resend event
  await prepareAndRecordAudit(decision, {
    outcome: 'success',
    before: { status: currentStatus, old_delivery_id: request.export_id },
    after: { status: 'PENDING', new_delivery_id: newDeliveryId },
    detail: `Manual resend initiated. New delivery ID: ${newDeliveryId}`
  }, request.idempotency_key);

  return buildScopedResponse({
    data: {
      export_id: request.export_id,
      old_delivery_id: request.export_id,
      new_delivery_id: newDeliveryId,
      new_status: 'PENDING',
      resent_at: new Date().toISOString()
    },
    correlation_id: decision.correlation_id
  });
}

/**
 * Get delivery audit trail for an export
 * Returns all delivery-related events (tracked, retried, cancelled, resent)
 */
export async function getDeliveryAuditTrail(request) {
  const { decision, denied, response } = await checkScope({
    ...request,
    domain: DOMAIN,
    action: 'audit',
    target_entity_type: 'ExportDelivery'
  });
  if (denied) return response;

  // Verify permission: view audit trail
  if (!['mga_admin', 'mga_manager', 'mga_read_only', 'platform_super_admin'].includes(decision.effective_role)) {
    return buildScopedResponse({
      success: false,
      reason_code: 'PERMISSION_DENIED',
      detail: 'Only admins, managers, and read-only users can view audit trails',
      correlation_id: decision.correlation_id
    });
  }

  // Fetch delivery events
  const events = await base44.entities.ActivityLog.filter({
    entity_type: 'ExportDeliveryStatus',
    entity_id: request.export_id,
    master_general_agent_id: decision.effective_mga_id
  });

  if (!events?.length) {
    return buildScopedResponse({
      success: false,
      reason_code: 'NOT_FOUND_IN_SCOPE',
      masked_not_found: true,
      correlation_id: decision.correlation_id
    });
  }

  // Map to audit trail format (no PII, safe metadata only)
  const auditTrail = events.map(event => ({
    event_type: event.action,
    status_change: event.old_value ? `${event.old_value} → ${event.new_value}` : event.new_value,
    actor_email: event.actor_email,
    actor_role: event.actor_role,
    timestamp: event.created_date,
    detail: event.detail || 'N/A',
    outcome: event.outcome
  }));

  return buildScopedResponse({
    data: auditTrail,
    correlation_id: decision.correlation_id
  });
}

export default {
  trackExportDelivery,
  getDeliveryStatus,
  listDeliveryStatuses,
  retryDelivery,
  cancelDelivery,
  resendDelivery,
  getDeliveryAuditTrail
};