/* global Deno */

/**
 * acceptBrokerMGARelationship — Backend Function
 * Accept a proposed MGA/Broker relationship
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

    const payload = await req.json();
    const { relationship_id } = payload;

    if (!relationship_id) {
      return Response.json({ error: 'relationship_id required' }, { status: 400 });
    }

    const relationship = await base44.entities.BrokerMGARelationship.get(relationship_id);
    if (!relationship) {
      return Response.json({ error: 'Relationship not found' }, { status: 404 });
    }

    if (relationship.relationship_status !== 'PROPOSED') {
      return Response.json({
        error: `Cannot accept relationship in ${relationship.relationship_status} state`
      }, { status: 400 });
    }

    // Accept relationship
    const updated = await base44.entities.BrokerMGARelationship.update(relationship_id, {
      relationship_status: 'ACTIVE',
      accepted_by_email: user.email,
      accepted_date: new Date().toISOString(),
      visibility_active: true,
      effective_date: new Date().toISOString()
    });

    return Response.json({ relationship: updated, success: true });
  } catch (error) {
    console.error('acceptBrokerMGARelationship error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});