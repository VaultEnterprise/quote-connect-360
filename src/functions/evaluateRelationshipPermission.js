/* global Deno */

/**
 * evaluateRelationshipPermission — Backend Function
 * Evaluate user permission for action on record
 * Combines role permission + relationship/ownership scope
 * 
 * Gate 7A-3 Phase 7A-3.3
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
    const { action, record, override_reason } = payload;

    if (!action || !record) {
      return Response.json({ error: 'Missing action or record' }, { status: 400 });
    }

    // Import permission resolver
    const permissionResolver = (await import('@/lib/permissionResolver.js')).default;

    // Step 1: Check role permission
    const rolePermissions = permissionResolver.getActionsByRole(user.role) || [];
    if (!rolePermissions.includes(action)) {
      return Response.json({
        decision: {
          allowed: false,
          reason: 'DENY_ROLE_LACKS_PERMISSION',
          reason_detail: `Role '${user.role}' cannot perform '${action}'`
        },
        success: false
      }, { status: 403 });
    }

    // Step 2: Platform admin override
    if (['platform_admin', 'platform_super_admin'].includes(user.role)) {
      return Response.json({
        decision: {
          allowed: true,
          reason: 'ALLOW_PLATFORM_ADMIN_OVERRIDE'
        },
        success: true
      });
    }

    // Step 3: MGA user - check relationship scope
    if (['mga_user', 'mga_admin', 'mga_read_only'].includes(user.role)) {
      const relationshipScopeResolver = (await import('@/lib/scopeResolvers/relationshipScopeResolver.js')).default;
      const scopeDecision = await relationshipScopeResolver.canMGAAccessRecord(
        user.email,
        user.mga_id,
        record,
        action
      );

      if (!scopeDecision.allowed) {
        return Response.json({
          decision: {
            allowed: false,
            reason: `DENY_RELATIONSHIP_SCOPE_${scopeDecision.reason}`,
            reason_detail: scopeDecision.detail,
            scope_failure: true
          },
          success: false
        }, { status: 403 });
      }

      return Response.json({
        decision: {
          allowed: true,
          reason: 'ALLOW_MGA_ROLE_AND_RELATIONSHIP_SCOPE',
          relationship_id: record.relationship_id
        },
        success: true
      });
    }

    // Step 4: Broker user - check direct ownership
    if (['broker_user', 'broker_admin', 'broker_read_only'].includes(user.role)) {
      const relationshipScopeResolver = (await import('@/lib/scopeResolvers/relationshipScopeResolver.js')).default;
      const scopeDecision = await relationshipScopeResolver.canBrokerAccessRecord(
        user.email,
        user.broker_agency_id,
        record
      );

      if (!scopeDecision.allowed) {
        return Response.json({
          decision: {
            allowed: false,
            reason: `DENY_BROKER_SCOPE_${scopeDecision.reason}`,
            reason_detail: scopeDecision.detail,
            scope_failure: true
          },
          success: false
        }, { status: 403 });
      }

      return Response.json({
        decision: {
          allowed: true,
          reason: 'ALLOW_BROKER_ROLE_AND_DIRECT_OWNERSHIP'
        },
        success: true
      });
    }

    // Step 5: Invalid role
    return Response.json({
      decision: {
        allowed: false,
        reason: 'DENY_INVALID_ROLE'
      },
      success: false
    }, { status: 403 });

  } catch (error) {
    console.error('evaluateRelationshipPermission error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});