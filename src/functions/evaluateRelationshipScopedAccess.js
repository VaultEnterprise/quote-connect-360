/* global Deno */

/**
 * evaluateRelationshipScopedAccess — Backend Function
 * Evaluate whether a user can access a record based on relationship scope
 * 
 * Gate 7A-3 Phase 7A-3.2
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { record, requested_action } = payload;

    if (!record || !record.id || !record.broker_agency_id) {
      return Response.json({ error: 'Invalid record' }, { status: 400 });
    }

    const action = requested_action || 'read';

    // Import resolver
    const relationshipScopeResolver = (await import('@/lib/scopeResolvers/relationshipScopeResolver.js')).default;

    let decision;

    // MGA users: check relationship scope
    if (['mga_user', 'mga_admin'].includes(user.role)) {
      decision = await relationshipScopeResolver.canMGAAccessRecord(
        user.email,
        user.mga_id || 'unknown',
        record,
        action
      );
    }
    // Broker users: check direct ownership
    else if (['broker_user', 'broker_admin'].includes(user.role)) {
      decision = await relationshipScopeResolver.canBrokerAccessRecord(
        user.email,
        user.broker_agency_id || 'unknown',
        record
      );
    }
    // Platform admin: allow
    else if (user.role === 'platform_admin') {
      decision = { allowed: true, reason: 'ALLOW_PLATFORM_ADMIN' };
    }
    // Other roles: deny
    else {
      decision = { allowed: false, reason: 'DENY_INVALID_ROLE' };
    }

    // Log denied access to audit trail
    if (!decision.allowed) {
      await base44.asServiceRole.entities.AuditEvent.create({
        event_type: 'relationship_scope_access_denied',
        entity_type: record.entity_type || 'UNKNOWN',
        entity_id: record.id,
        actor_email: user.email,
        actor_role: user.role,
        action,
        detail: `Access denied: ${decision.reason}. ${decision.detail}`,
        outcome: 'blocked',
        reason_code: decision.reason,
        relationship_id: record.relationship_id || null,
        created_at: new Date().toISOString()
      });
    }

    return Response.json({ decision, success: true });
  } catch (error) {
    console.error('evaluateRelationshipScopedAccess error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});