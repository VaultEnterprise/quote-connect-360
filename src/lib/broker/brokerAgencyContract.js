/**
 * brokerAgencyContract
 * Enforces scope, permissions, and audit rules for broker agency operations
 * All create/update/archive operations must go through this contract
 */

import { base44 } from '@/api/base44Client';

export const brokerAgencyContract = {
  /**
   * Creates a new standalone broker agency profile
   * Validates tenant scope, stamps platform relationship, enforces approval workflow
   * NOTE: Contract layer is advisory. Backend functions are the source of truth.
   */
  async createStandaloneBrokerProfile(payload) {
    const { tenant_id, legal_name, dba_name, code, primary_contact_email, primary_contact_name, primary_phone, actor_user_email } = payload;

    // Validate required fields
    if (!tenant_id || !legal_name || !primary_contact_email) {
      throw new Error('Missing required fields: tenant_id, legal_name, primary_contact_email');
    }

    // Create broker agency profile in pending_profile_completion status
    const brokerProfile = await base44.asServiceRole.entities.BrokerAgencyProfile.create({
      tenant_id,
      legal_name,
      dba_name,
      code: code || `BROKER-${Date.now()}`,
      primary_contact_email,
      primary_contact_name,
      primary_phone,
      onboarding_status: 'pending_profile_completion',
      relationship_status: 'draft',
      compliance_status: 'pending_review',
      portal_access_enabled: false,
      self_signup_source: 'direct_signup',
      created_by_user_email: actor_user_email
    });

    // Create platform relationship
    const platformRel = await base44.asServiceRole.entities.BrokerPlatformRelationship.create({
      tenant_id,
      broker_agency_id: brokerProfile.id,
      status: 'invited',
      approval_status: 'pending',
      relationship_type: 'direct_platform',
      requested_at: new Date().toISOString(),
      requested_by_user_email: actor_user_email,
      compliance_status: 'pending_review'
    });

    // Log audit event
    await logAuditEvent({
      tenant_id,
      event_type: 'BROKER_AGENCY_CREATED',
      actor_email: actor_user_email,
      broker_agency_id: brokerProfile.id,
      detail: `Broker agency ${legal_name} created, pending profile completion`
    });

    return {
      broker_agency_id: brokerProfile.id,
      platform_relationship_id: platformRel.id,
      status: 'pending_profile_completion'
    };
  },

  /**
   * Updates broker profile
   * Only profiles in draft or pending_approval status can be updated by owner
   */
  async updateBrokerProfile(payload) {
    const { tenant_id, broker_agency_id, updates, actor_user_email, actor_role } = payload;

    // Fetch current profile
    const profile = await base44.entities.BrokerAgencyProfile.get(broker_agency_id);
    if (!profile || profile.tenant_id !== tenant_id) {
      throw new Error('Broker profile not found or tenant mismatch');
    }

    // Only admin or broker owner can update in draft/pending status
    const isAdmin = actor_role === 'admin' || actor_role === 'platform_super_admin';
    const isOwner = profile.created_by_user_email === actor_user_email;
    const canUpdate = isAdmin || (isOwner && ['draft', 'pending_approval'].includes(profile.onboarding_status));

    if (!canUpdate) {
      throw new Error('Not authorized to update this broker profile');
    }

    // Update profile
    const updated = await base44.entities.BrokerAgencyProfile.update(broker_agency_id, updates);

    // Log audit event
    await logAuditEvent({
      tenant_id,
      event_type: 'BROKER_AGENCY_PROFILE_UPDATED',
      actor_email: actor_user_email,
      broker_agency_id,
      detail: `Updated: ${Object.keys(updates).join(', ')}`
    });

    return updated;
  },

  /**
   * Approves broker profile and activates platform relationship
   * Admin/platform only
   * NOTE: Backend function is authoritative. Contract is advisory only.
   */
  async approveBrokerProfile(payload) {
    const { tenant_id, broker_agency_id, approver_email, approver_role, notes } = payload;

    // Only platform admin can approve
    if (approver_role !== 'admin' && approver_role !== 'platform_super_admin') {
      throw new Error('Only platform admins can approve broker profiles');
    }

    // Update profile
    const profile = await base44.asServiceRole.entities.BrokerAgencyProfile.update(broker_agency_id, {
      onboarding_status: 'active',
      relationship_status: 'active',
      compliance_status: 'compliant',
      portal_access_enabled: true,
      approved_by_user_email: approver_email,
      approved_at: new Date().toISOString(),
      notes
    });

    // Activate platform relationship (idempotent)
    const relationships = await base44.asServiceRole.entities.BrokerPlatformRelationship.filter({ broker_agency_id });
    if (relationships?.length > 0 && relationships[0].approval_status !== 'approved') {
      await base44.asServiceRole.entities.BrokerPlatformRelationship.update(relationships[0].id, {
        status: 'active',
        approval_status: 'approved',
        activated_at: new Date().toISOString(),
        approved_by_user_email: approver_email,
        approved_at: new Date().toISOString()
      });
    }

    // Log audit event
    await logAuditEvent({
      tenant_id,
      event_type: 'BROKER_AGENCY_APPROVED',
      actor_email: approver_email,
      broker_agency_id,
      detail: `Broker profile approved and activated`
    });

    return { status: 'approved', profile };
  },

  /**
   * Suspends broker profile and relationship
   */
  async suspendBrokerProfile(payload) {
    const { tenant_id, broker_agency_id, suspension_reason, actor_email, actor_role } = payload;

    if (actor_role !== 'admin' && actor_role !== 'platform_super_admin') {
      throw new Error('Only platform admins can suspend brokers');
    }

    const updated = await base44.entities.BrokerAgencyProfile.update(broker_agency_id, {
      relationship_status: 'suspended',
      portal_access_enabled: false,
      suspended_at: new Date().toISOString(),
      suspension_reason
    });

    // Also suspend platform relationship
    const rel = (await base44.entities.BrokerPlatformRelationship.filter({ broker_agency_id }))[0];
    if (rel) {
      await base44.entities.BrokerPlatformRelationship.update(rel.id, { status: 'suspended' });
    }

    await logAuditEvent({
      tenant_id,
      event_type: 'BROKER_AGENCY_SUSPENDED',
      actor_email,
      broker_agency_id,
      detail: `Suspended: ${suspension_reason}`
    });

    return updated;
  }
};

/**
 * Logs audit events for broker operations
 */
async function logAuditEvent({ tenant_id, event_type, actor_email, broker_agency_id, detail }) {
  try {
    // If AuditEvent entity exists, log it; otherwise log to console for Phase 1
    if (base44.entities.AuditEvent) {
      await base44.entities.AuditEvent.create({
        tenant_id,
        event_type,
        actor_email,
        broker_agency_id,
        detail,
        created_at: new Date().toISOString()
      });
    } else {
      console.log(`[AUDIT] ${event_type}: ${detail}`);
    }
  } catch (err) {
    console.error('Error logging audit event:', err);
  }
}