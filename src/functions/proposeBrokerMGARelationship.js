/* global Deno */

/**
 * proposeBrokerMGARelationship — Backend Function
 * Propose a new MGA/Broker relationship
 * 
 * Gate 7A-3 Phase 7A-3.1
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only platform admin, mga_admin, or broker_admin can propose
    if (!['platform_admin', 'mga_admin', 'broker_admin'].includes(user.role)) {
      return Response.json({ error: 'Forbidden: insufficient role' }, { status: 403 });
    }

    const payload = await req.json();
    const { broker_agency_id, master_general_agent_id, operational_scope, scope_definition } = payload;

    if (!broker_agency_id || !master_general_agent_id || !operational_scope) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create relationship
    const relationship = await base44.entities.BrokerMGARelationship.create({
      broker_agency_id,
      master_general_agent_id,
      relationship_status: 'PROPOSED',
      operational_scope,
      scope_definition: scope_definition || {},
      proposed_by_email: user.email,
      proposed_by_role: user.role,
      proposed_date: new Date().toISOString(),
      visibility_active: false,
      audit_correlation_id: `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

    return Response.json({ relationship, success: true });
  } catch (error) {
    console.error('proposeBrokerMGARelationship error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});