/**
 * brokerSignup backend function
 * Handles broker self-signup: creates profile, platform relationship, sends approval request
 */

/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const {
      tenant_id,
      legal_name,
      dba_name,
      primary_contact_name,
      primary_contact_email,
      primary_phone,
      zip_code,
      state,
      license_states = [],
      license_expiration_date,
      insurance_lines = [],
      industry_specialties = [],
      employer_size_min,
      employer_size_max,
      actor_user_email
    } = payload;

    // Validate required fields
    if (!legal_name || !primary_contact_email || !zip_code || !state) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create broker agency profile
    const brokerProfile = await base44.asServiceRole.entities.BrokerAgencyProfile.create({
      tenant_id,
      legal_name,
      dba_name: dba_name || null,
      code: `BROKER-${Date.now()}`,
      primary_contact_email,
      primary_contact_name,
      primary_phone,
      zip_code,
      state,
      service_states: [state],
      service_zip_codes: [zip_code],
      insurance_lines,
      active_for_lines: insurance_lines,
      industry_specialties,
      employer_size_min: employer_size_min || null,
      employer_size_max: employer_size_max || null,
      license_states,
      license_expiration_date,
      onboarding_status: 'pending_profile_completion',
      relationship_status: 'draft',
      compliance_status: 'pending_review',
      portal_access_enabled: false,
      self_signup_source: 'direct_signup',
      created_by_user_email: actor_user_email || 'broker_signup'
    });

    // Create broker platform relationship
    const platformRel = await base44.asServiceRole.entities.BrokerPlatformRelationship.create({
      tenant_id,
      broker_agency_id: brokerProfile.id,
      status: 'invited',
      approval_status: 'pending',
      relationship_type: 'direct_platform',
      requested_at: new Date().toISOString(),
      requested_by_user_email: actor_user_email || 'broker_signup',
      compliance_status: 'pending_review'
    });

    // Log audit event (placeholder for now, AuditEvent may not exist in Phase 1)
    console.log(`[AUDIT] BROKER_AGENCY_CREATED: ${legal_name} (${brokerProfile.id})`);

    return Response.json({
      success: true,
      broker_agency_id: brokerProfile.id,
      platform_relationship_id: platformRel.id,
      status: 'pending_profile_completion',
      message: 'Broker profile submitted for review'
    }, { status: 201 });
  } catch (error) {
    console.error('Error in brokerSignup:', error);
    return Response.json(
      { error: error.message || 'Failed to process broker signup' },
      { status: 500 }
    );
  }
});