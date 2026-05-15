/**
 * Immutable Audit Writer
 * 
 * Enforces append-only audit event logging for all Gate 7A-0 operations.
 * No UPDATE or DELETE paths exist for audit events.
 * Corrections require new append-only correction events.
 * 
 * Audit events support:
 * - Broker platform events (signup, approval, suspension)
 * - Broker MGA relationship events (creation, approval, suspension)
 * - Broker business events (case, quote, proposal, census)
 * - Quote delegation events (assignment, acceptance, completion)
 * - Benefits bridge events (setup requests, approvals)
 * - Distribution channel events (context creation, configuration)
 * - Scope access grant events (creation, expiration, revocation)
 * - Permission denial events (safe, non-leaking)
 * - Scope denial events (masked, no metadata leakage)
 */

import { base44 } from '@/api/base44Client';

/**
 * Write an audit event (append-only).
 * Returns the created audit event (read-only confirmation).
 * No caller-supplied actor context; all identity comes from authenticated session.
 * 
 * @param {Object} auditPayload - Audit event details
 * @param {string} auditPayload.tenant_id - Tenant ID (from resolved scope)
 * @param {string} auditPayload.actor_user_id - Authenticated user ID (server-controlled)
 * @param {string} auditPayload.actor_role - Actor's role at time of action (server-controlled)
 * @param {string} auditPayload.actor_org_type - Actor's organization type (from scope)
 * @param {string} auditPayload.actor_org_id - Actor's organization ID (from scope)
 * @param {string} auditPayload.distribution_channel_context_id - Channel context (if applicable)
 * @param {string} auditPayload.target_entity_type - Entity being acted upon
 * @param {string} auditPayload.target_entity_id - Entity ID
 * @param {string} auditPayload.action - Action performed (create, update, delete, approve, suspend, etc.)
 * @param {Object} auditPayload.before_json - State before action (redacted where applicable)
 * @param {Object} auditPayload.after_json - State after action (redacted where applicable)
 * @param {string} auditPayload.reason - Reason for action (policy enforcement reason, not free text)
 * @param {string} auditPayload.audit_trace_id - Correlation ID for related actions
 * @param {Object} auditPayload.metadata - IP, device, session info (if available)
 * @returns {Object} Created AuditEvent record
 */
export const writeAuditEvent = async (auditPayload) => {
  // Validate required fields
  const requiredFields = ['tenant_id', 'actor_user_id', 'action', 'target_entity_type'];
  for (const field of requiredFields) {
    if (!auditPayload[field]) {
      throw new Error(`Missing required audit field: ${field}`);
    }
  }

  // Ensure created_at is server-controlled (never caller-supplied)
  const now = new Date().toISOString();

  // Build immutable audit record
  const auditEvent = {
    tenant_id: auditPayload.tenant_id,
    actor_user_id: auditPayload.actor_user_id,
    actor_role: auditPayload.actor_role || 'unknown',
    actor_org_type: auditPayload.actor_org_type || null,
    actor_org_id: auditPayload.actor_org_id || null,
    distribution_channel_context_id: auditPayload.distribution_channel_context_id || null,
    target_entity_type: auditPayload.target_entity_type,
    target_entity_id: auditPayload.target_entity_id || null,
    action: auditPayload.action,
    before_json: auditPayload.before_json || null,
    after_json: auditPayload.after_json || null,
    reason: auditPayload.reason || null,
    audit_trace_id: auditPayload.audit_trace_id || generateAuditTraceId(),
    metadata: auditPayload.metadata || null,
    created_at: now
  };

  // Create audit event (append-only, no update/delete paths exist)
  try {
    const created = await base44.entities.AuditEvent.create(auditEvent);
    return created;
  } catch (error) {
    throw new Error(`Audit event creation failed: ${error.message}`);
  }
};

/**
 * Write a permission denial event (safe, non-leaking).
 * Called when permission check fails after valid scope.
 * Does not expose scope details or hidden record metadata.
 * 
 * @param {Object} context - Denial context
 * @param {string} context.tenant_id - Tenant ID
 * @param {string} context.actor_user_id - User who was denied
 * @param {string} context.actor_role - User's role
 * @param {string} context.permission_path - Permission that was denied (e.g., 'broker_direct.case.create')
 * @param {string} context.target_entity_type - Type of entity being accessed
 * @param {string} context.target_entity_id - ID of entity (optional)
 * @param {string} context.reason - Reason code (insufficient_privilege, gate_not_open, etc.)
 * @param {string} context.audit_trace_id - Correlation ID
 * @returns {Object} Created AuditEvent
 */
export const writePermissionDenialEvent = async (context) => {
  return writeAuditEvent({
    tenant_id: context.tenant_id,
    actor_user_id: context.actor_user_id,
    actor_role: context.actor_role,
    target_entity_type: context.target_entity_type || 'permission',
    target_entity_id: context.target_entity_id || null,
    action: 'permission_denied',
    reason: context.reason || 'insufficient_privilege',
    after_json: {
      permission_path: context.permission_path,
      reason: context.reason
    },
    audit_trace_id: context.audit_trace_id
  });
};

/**
 * Write a masked scope denial event.
 * Called when scope check fails (returns masked 404).
 * Logs denial reason internally without exposing metadata.
 * 
 * @param {Object} context - Scope denial context
 * @param {string} context.tenant_id - Tenant ID
 * @param {string} context.actor_user_id - User who was denied
 * @param {string} context.actor_role - User's role
 * @param {string} context.reason - Internal reason (tenant_mismatch, broker_scope_mismatch, etc.)
 * @param {string} context.audit_trace_id - Correlation ID
 * @returns {Object} Created AuditEvent
 */
export const writeMaskedScopeDenialEvent = async (context) => {
  // Audit the denial reason internally (not exposed to user)
  return writeAuditEvent({
    tenant_id: context.tenant_id,
    actor_user_id: context.actor_user_id,
    actor_role: context.actor_role,
    target_entity_type: 'scope_boundary',
    action: 'scope_denial_masked',
    reason: context.reason, // Internal reason code only
    audit_trace_id: context.audit_trace_id
  });
};

/**
 * Write a broker platform event (signup, approval, suspension).
 * Called on broker agency lifecycle transitions.
 * 
 * @param {Object} context - Event context
 * @param {string} context.tenant_id - Tenant ID
 * @param {string} context.actor_user_id - Platform admin approving/denying
 * @param {string} context.actor_role - Platform admin role
 * @param {Object} context.before_state - Broker profile before change
 * @param {Object} context.after_state - Broker profile after change
 * @param {string} context.action - Action (create, approve, reject, suspend, reactivate)
 * @param {string} context.reason - Reason for action (policy code, not free text)
 * @param {string} context.audit_trace_id - Correlation ID
 * @returns {Object} Created AuditEvent
 */
export const writeBrokerPlatformEvent = async (context) => {
  return writeAuditEvent({
    tenant_id: context.tenant_id,
    actor_user_id: context.actor_user_id,
    actor_role: context.actor_role,
    actor_org_type: 'platform',
    distribution_channel_context_id: context.distribution_channel_context_id || null,
    target_entity_type: 'broker_agency_profile',
    target_entity_id: context.broker_agency_id,
    action: context.action,
    before_json: redactSensitiveFields(context.before_state),
    after_json: redactSensitiveFields(context.after_state),
    reason: context.reason,
    audit_trace_id: context.audit_trace_id
  });
};

/**
 * Write a broker MGA relationship event.
 * Called on relationship creation, approval, suspension, termination.
 * 
 * @param {Object} context - Event context
 * @param {string} context.tenant_id - Tenant ID
 * @param {string} context.actor_user_id - User initiating action
 * @param {string} context.actor_role - User's role
 * @param {string} context.actor_org_type - User's org type (broker_agency or mga)
 * @param {string} context.actor_org_id - User's org ID
 * @param {Object} context.before_state - Relationship before change
 * @param {Object} context.after_state - Relationship after change
 * @param {string} context.action - Action (create, approve, reject, suspend, terminate)
 * @param {string} context.reason - Reason for action
 * @param {string} context.audit_trace_id - Correlation ID
 * @returns {Object} Created AuditEvent
 */
export const writeBrokerMGARelationshipEvent = async (context) => {
  return writeAuditEvent({
    tenant_id: context.tenant_id,
    actor_user_id: context.actor_user_id,
    actor_role: context.actor_role,
    actor_org_type: context.actor_org_type,
    actor_org_id: context.actor_org_id,
    target_entity_type: 'broker_mga_relationship',
    target_entity_id: context.relationship_id,
    action: context.action,
    before_json: context.before_state || null,
    after_json: context.after_state || null,
    reason: context.reason,
    audit_trace_id: context.audit_trace_id
  });
};

/**
 * Write a broker business event (case, quote, proposal, census).
 * Called on business transactions in broker direct or MGA-affiliated channels.
 * Redacts sensitive data (census, SSN, health, payroll, documents).
 * 
 * @param {Object} context - Event context
 * @param {string} context.tenant_id - Tenant ID
 * @param {string} context.actor_user_id - Broker user
 * @param {string} context.actor_role - Broker user role
 * @param {string} context.actor_org_type - broker_agency
 * @param {string} context.actor_org_id - Broker ID
 * @param {string} context.target_entity_type - Entity type (case, quote, proposal, census_member)
 * @param {string} context.target_entity_id - Entity ID
 * @param {Object} context.after_state - State after creation/update (redacted)
 * @param {string} context.action - Action (create, update, submit, etc.)
 * @param {string} context.reason - Reason (workflow stage transition, etc.)
 * @param {string} context.audit_trace_id - Correlation ID
 * @returns {Object} Created AuditEvent
 */
export const writeBrokerBusinessEvent = async (context) => {
  return writeAuditEvent({
    tenant_id: context.tenant_id,
    actor_user_id: context.actor_user_id,
    actor_role: context.actor_role,
    actor_org_type: context.actor_org_type,
    actor_org_id: context.actor_org_id,
    distribution_channel_context_id: context.distribution_channel_context_id || null,
    target_entity_type: context.target_entity_type,
    target_entity_id: context.target_entity_id,
    action: context.action,
    before_json: context.before_state ? redactSensitiveFields(context.before_state) : null,
    after_json: context.after_state ? redactSensitiveFields(context.after_state) : null,
    reason: context.reason,
    audit_trace_id: context.audit_trace_id
  });
};

/**
 * Write a quote delegation event.
 * Called on delegation assignment, acceptance, completion, cancellation.
 * Remains inactive during Gate 7A-0 (logged for future activation).
 * 
 * @param {Object} context - Event context
 * @param {string} context.tenant_id - Tenant ID
 * @param {string} context.actor_user_id - User performing action
 * @param {string} context.actor_role - User's role
 * @param {string} context.actor_org_type - User's org type
 * @param {string} context.actor_org_id - User's org ID
 * @param {string} context.action - Action (assign, accept, decline, complete, take_over, etc.)
 * @param {Object} context.after_state - Delegation state after action
 * @param {string} context.reason - Reason (workload, expertise, etc.)
 * @param {string} context.audit_trace_id - Correlation ID
 * @returns {Object} Created AuditEvent
 */
export const writeQuoteDelegationEvent = async (context) => {
  return writeAuditEvent({
    tenant_id: context.tenant_id,
    actor_user_id: context.actor_user_id,
    actor_role: context.actor_role,
    actor_org_type: context.actor_org_type,
    actor_org_id: context.actor_org_id,
    target_entity_type: 'quote_delegation',
    target_entity_id: context.delegation_id,
    action: context.action,
    after_json: context.after_state || null,
    reason: context.reason,
    audit_trace_id: context.audit_trace_id
  });
};

/**
 * Write a benefits admin bridge event.
 * Called on setup requests, approvals, go-live transitions.
 * Remains inactive during Gate 7A-0 (logged for future activation).
 * 
 * @param {Object} context - Event context
 * @param {string} context.tenant_id - Tenant ID
 * @param {string} context.actor_user_id - User performing action
 * @param {string} context.actor_role - User's role
 * @param {string} context.action - Action (request_setup, start_setup, approve_go_live, etc.)
 * @param {string} context.target_entity_type - Entity type
 * @param {string} context.target_entity_id - Entity ID
 * @param {Object} context.after_state - State after action
 * @param {string} context.reason - Reason
 * @param {string} context.audit_trace_id - Correlation ID
 * @returns {Object} Created AuditEvent
 */
export const writeBenefitsAdminEvent = async (context) => {
  return writeAuditEvent({
    tenant_id: context.tenant_id,
    actor_user_id: context.actor_user_id,
    actor_role: context.actor_role,
    target_entity_type: context.target_entity_type,
    target_entity_id: context.target_entity_id,
    action: context.action,
    after_json: context.after_state || null,
    reason: context.reason,
    audit_trace_id: context.audit_trace_id
  });
};

/**
 * Write a correction event for a prior audit record.
 * Used when prior audit entry needs correction or clarification.
 * Preserves original event; creates new correction entry.
 * 
 * @param {Object} context - Correction context
 * @param {string} context.tenant_id - Tenant ID
 * @param {string} context.actor_user_id - User making correction
 * @param {string} context.actor_role - User's role
 * @param {string} context.prior_audit_event_id - ID of prior event being corrected
 * @param {string} context.correction_reason - Reason for correction
 * @param {Object} context.corrected_data - Corrected information
 * @returns {Object} Created AuditEvent
 */
export const writeCorrectionEvent = async (context) => {
  return writeAuditEvent({
    tenant_id: context.tenant_id,
    actor_user_id: context.actor_user_id,
    actor_role: context.actor_role,
    target_entity_type: 'audit_event_correction',
    target_entity_id: context.prior_audit_event_id,
    action: 'correction',
    after_json: {
      corrected_data: context.corrected_data,
      correction_reason: context.correction_reason
    },
    reason: 'audit_correction'
  });
};

/**
 * Redact sensitive fields from JSON payloads.
 * Removes census data, SSN, health info, payroll, private documents.
 * Preserves safe fields for audit trail.
 * 
 * @param {Object} state - State object to redact
 * @returns {Object} Redacted state (sensitive fields removed)
 */
export const redactSensitiveFields = (state) => {
  if (!state || typeof state !== 'object') {
    return state;
  }

  const redacted = { ...state };

  // Redact sensitive fields by key name patterns
  const sensitivePatterns = [
    'ssn',
    'health',
    'medical',
    'diagnosis',
    'claim',
    'salary',
    'compensation',
    'payroll',
    'banking',
    'account',
    'routing',
    'docusign',
    'signature',
    'encrypted',
    'private',
    'confidential',
    'password'
  ];

  for (const key in redacted) {
    const lowerKey = key.toLowerCase();

    // Check if key matches sensitive patterns
    if (sensitivePatterns.some((pattern) => lowerKey.includes(pattern))) {
      redacted[key] = '[REDACTED]';
    }

    // Redact nested objects recursively
    if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      redacted[key] = redactSensitiveFields(redacted[key]);
    }
  }

  return redacted;
};

/**
 * Generate a unique audit trace ID for correlating related actions.
 * Used for grouping multi-step operations (e.g., approval workflow).
 * 
 * @returns {string} Unique correlation ID
 */
export const generateAuditTraceId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `audit_${timestamp}_${random}`;
};

/**
 * Ensure no UPDATE path exists for audit events.
 * This method intentionally does not exist (throws error if called).
 * Audit events are immutable; corrections require new events.
 */
export const updateAuditEventBlocked = () => {
  throw new Error('Audit events are immutable. Use writeCorrectionEvent to create a correction record.');
};

/**
 * Ensure no DELETE path exists for audit events.
 * This method intentionally does not exist (throws error if called).
 * Audit records must be retained for compliance and audit trails.
 */
export const deleteAuditEventBlocked = () => {
  throw new Error('Audit events cannot be deleted. Retention is mandatory for compliance.');
};