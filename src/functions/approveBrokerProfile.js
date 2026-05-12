/**
 * approveBrokerProfile backend function
 * Admin-only: approves broker, activates platform relationship, enables portal access
 */

/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !['admin', 'platform_super_admin'].includes(user.role)) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const payload = await req.json();
    const { broker_agency_id, approver_email, notes } = payload;

    if (!broker_agency_id) {
      return Response.json({ error: 'Missing broker_agency_id' }, { status: 400 });
    }

    // Update broker profile
    const broker = await base44.asServiceRole.entities.BrokerAgencyProfile.update(broker_agency_id, {
      onboarding_status: 'active',
      relationship_status: 'active',
      compliance_status: 'compliant',
      portal_access_enabled: true,
      approved_by_user_email: approver_email,
      approved_at: new Date().toISOString(),
      notes: notes || null
    });

    // Get and update platform relationship (idempotent check)
    const relationships = await base44.asServiceRole.entities.BrokerPlatformRelationship.filter({
      broker_agency_id
    });

    if (relationships?.length > 0) {
      const rel = relationships[0];
      // Only update if not already approved (idempotent)
      if (rel.approval_status !== 'approved') {
        await base44.asServiceRole.entities.BrokerPlatformRelationship.update(rel.id, {
          status: 'active',
          approval_status: 'approved',
          activated_at: new Date().toISOString(),
          approved_by_user_email: approver_email,
          approved_at: new Date().toISOString()
        });
      }
    }

    console.log(`[AUDIT] BROKER_AGENCY_APPROVED: ${broker_agency_id} by ${approver_email}`);

    return Response.json({
      success: true,
      broker_agency_id,
      status: 'active',
      message: 'Broker profile approved and activated'
    }, { status: 200 });
  } catch (error) {
    console.error('Error in approveBrokerProfile:', error);
    return Response.json(
      { error: error.message || 'Failed to approve broker profile' },
      { status: 500 }
    );
  }
});