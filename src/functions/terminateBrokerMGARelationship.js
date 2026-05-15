/* global Deno */

/**
 * terminateBrokerMGARelationship — Backend Function
 * Terminate an MGA/Broker relationship
 * Stops future MGA visibility; historical records preserved.
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

    // Only platform admin can terminate
    if (user.role !== 'platform_admin') {
      return Response.json({ error: 'Forbidden: platform_admin required' }, { status: 403 });
    }

    const payload = await req.json();
    const { relationship_id, reason } = payload;

    if (!relationship_id) {
      return Response.json({ error: 'relationship_id required' }, { status: 400 });
    }

    const relationship = await base44.entities.BrokerMGARelationship.get(relationship_id);
    if (!relationship) {
      return Response.json({ error: 'Relationship not found' }, { status: 404 });
    }

    const terminalStates = ['TERMINATED'];
    if (terminalStates.includes(relationship.relationship_status)) {
      return Response.json({
        error: `Cannot terminate relationship in ${relationship.relationship_status} state`
      }, { status: 400 });
    }

    // Terminate relationship
    const updated = await base44.entities.BrokerMGARelationship.update(relationship_id, {
      relationship_status: 'TERMINATED',
      status_reason: reason || 'Terminated by platform admin',
      termination_date: new Date().toISOString(),
      visibility_active: false
    });

    return Response.json({ relationship: updated, success: true });
  } catch (error) {
    console.error('terminateBrokerMGARelationship error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});