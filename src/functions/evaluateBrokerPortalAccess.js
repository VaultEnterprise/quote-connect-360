/**
 * Evaluate Broker Portal Access — Phase 7A-1.8
 * 
 * Backend function to evaluate broker portal access eligibility.
 * Checks 8 conditions across BrokerAgencyProfile, BrokerPlatformRelationship, BrokerAgencyUser.
 * Returns access state (one of 12 states) + eligibility flag.
 * Audit logs all evaluations.
 * Safe payloads only (no sensitive data exposed).
 * 
 * Feature Flag: Always runs (no gating), but workspace activation gated by Gate 7A-2 flags
 * 
 * @endpoint /functions/evaluateBrokerPortalAccess
 * @method POST
 * @payload { broker_agency_id }
 * @returns { access_state, is_eligible, reason, conditions_met, message }
 */

/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { evaluateBrokerPortalAccess } from '../lib/contracts/brokerPortalAccessContract.js';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { broker_agency_id } = payload;

    if (!broker_agency_id) {
      return Response.json({ error: 'broker_agency_id required' }, { status: 400 });
    }

    // Call contract method
    const result = await evaluateBrokerPortalAccess(base44, {
      tenant_id: 'default_tenant', // In production, extract from user context
      user_id: user.id || user.email,
      user_email: user.email,
      role: user.role,
    }, { broker_agency_id });

    return Response.json(result);
  } catch (error) {
    console.error('Portal access evaluation error:', error);
    if (error.status === 404) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }
    return Response.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
});