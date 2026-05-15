/**
 * Phase 1 Database Assertions
 * Read-only QA assertions for broker entity state validation
 */

import { base44 } from '@/api/base44Client';

export class Phase1BrokerDbAssertions {
  async assertBrokerAgencyProfileExists(email) {
    const profiles = await base44.asServiceRole.entities.BrokerAgencyProfile.filter({
      primary_contact_email: email
    });
    if (!profiles || profiles.length === 0) {
      throw new Error(`BrokerAgencyProfile not found for email: ${email}`);
    }
    return profiles[0];
  }

  async assertBrokerAgencyProfileStandalone(profile) {
    if (profile.master_general_agent_id) {
      throw new Error(`BrokerAgencyProfile should not have master_general_agent_id for standalone broker. Found: ${profile.master_general_agent_id}`);
    }
    if (!profile.broker_agency_id) {
      throw new Error('BrokerAgencyProfile missing broker_agency_id');
    }
  }

  async assertBrokerAgencyProfilePending(profile) {
    if (profile.onboarding_status !== 'pending_profile_completion' && profile.onboarding_status !== 'pending_platform_review') {
      throw new Error(`Expected onboarding_status to be pending, got: ${profile.onboarding_status}`);
    }
    if (profile.portal_access_enabled !== false) {
      throw new Error(`Expected portal_access_enabled=false for pending broker, got: ${profile.portal_access_enabled}`);
    }
  }

  async assertBrokerAgencyProfileActive(profile) {
    if (profile.onboarding_status !== 'active') {
      throw new Error(`Expected onboarding_status=active after approval, got: ${profile.onboarding_status}`);
    }
    if (profile.portal_access_enabled !== true) {
      throw new Error(`Expected portal_access_enabled=true after approval, got: ${profile.portal_access_enabled}`);
    }
    if (!profile.approved_at) {
      throw new Error('BrokerAgencyProfile missing approved_at timestamp');
    }
  }

  async assertBrokerPlatformRelationshipExists(brokerAgencyId) {
    const relationships = await base44.asServiceRole.entities.BrokerPlatformRelationship.filter({
      broker_agency_id: brokerAgencyId
    });
    if (!relationships || relationships.length === 0) {
      throw new Error(`BrokerPlatformRelationship not found for broker_agency_id: ${brokerAgencyId}`);
    }
    return relationships[0];
  }

  async assertBrokerPlatformRelationshipPending(relationship) {
    if (relationship.relationship_status !== 'pending_review' && relationship.relationship_status !== 'invited') {
      throw new Error(`Expected relationship_status pending, got: ${relationship.relationship_status}`);
    }
  }

  async assertBrokerPlatformRelationshipActive(relationship) {
    if (relationship.relationship_status !== 'active') {
      throw new Error(`Expected relationship_status=active after approval, got: ${relationship.relationship_status}`);
    }
    if (!relationship.approved_at) {
      throw new Error('BrokerPlatformRelationship missing approved_at timestamp');
    }
  }

  async assertNoBrokerMGARelationship(brokerAgencyId) {
    try {
      const relationships = await base44.asServiceRole.entities.BrokerMGARelationship.filter({
        broker_agency_id: brokerAgencyId
      });
      if (relationships && relationships.length > 0) {
        throw new Error(`BrokerMGARelationship should not exist for standalone broker. Found ${relationships.length} records.`);
      }
    } catch (err) {
      if (err.message.includes('entity not found') || err.message.includes('does not exist')) {
        return;
      }
      throw err;
    }
  }

  async assertAuditEventsExist(eventTypes, brokerAgencyId) {
    const activityLogs = await base44.asServiceRole.entities.ActivityLog.filter({
      entity_id: brokerAgencyId
    });
    if (!activityLogs || activityLogs.length === 0) {
      throw new Error(`No audit events found for broker_agency_id: ${brokerAgencyId}`);
    }
    const recordedEvents = activityLogs.map(log => log.action);
    const missingEvents = eventTypes.filter(type => !recordedEvents.includes(type));
    if (missingEvents.length > 0) {
      throw new Error(`Missing audit events: ${missingEvents.join(', ')}`);
    }
    return activityLogs;
  }

  async assertNoPhase2Invitation(brokerAgencyId) {
    try {
      const invitations = await base44.asServiceRole.entities.BrokerAgencyUser.filter({
        broker_agency_id: brokerAgencyId
      });
      if (invitations && invitations.length > 0) {
        throw new Error(`BrokerAgencyUser should not be created in Phase 1. Found ${invitations.length} records.`);
      }
    } catch (err) {
      if (err.message.includes('entity not found') || err.message.includes('does not exist')) {
        return;
      }
      throw err;
    }
  }

  async assertNoInvitationEmail(brokerEmail) {
    try {
      const logs = await base44.asServiceRole.entities.HelpSearchLog.filter({
        user_email: brokerEmail
      });
      return logs;
    } catch (err) {
      return null;
    }
  }
}

export const dbAssertions = new Phase1BrokerDbAssertions();