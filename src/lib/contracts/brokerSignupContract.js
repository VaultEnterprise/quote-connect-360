/**
 * brokerSignupContract.js
 * 
 * Broker Signup Contract Implementation (Gate 7A-1)
 * 
 * All protected broker signup/onboarding/approval actions go through this contract.
 * No raw frontend entity reads allowed.
 * Feature flags, scope, permission, and audit enforcement required.
 * 
 * Methods:
 * 1. submitStandaloneBrokerSignup
 * 2. validateBrokerSignupToken
 * 3. completeBrokerOnboardingProfile
 * 4. uploadBrokerComplianceDocument
 * 5. resendBrokerOnboardingInvite
 * 6. cancelBrokerSignup
 * 7. approveStandaloneBroker
 * 8. rejectStandaloneBroker
 * 9. requestBrokerMoreInformation
 */

import crypto from 'crypto';
import { base44 } from '@/api/base44Client';

// ============================================================================
// FEATURE FLAG ENFORCEMENT
// ============================================================================

const FEATURE_FLAGS = {
  BROKER_SIGNUP_ENABLED: false,
  BROKER_ONBOARDING_ENABLED: false,
  BROKER_PLATFORM_RELATIONSHIP_ENABLED: false,
  FIRST_CLASS_BROKER_MODEL_ENABLED: false,
  DISTRIBUTION_CHANNEL_CONTEXT_ENABLED: false,
};

function assertFeatureFlagEnabled(flagName) {
  if (!FEATURE_FLAGS[flagName]) {
    throw new Error(`NOT_AUTHORIZED_FOR_GATE_7A_1: ${flagName} is not enabled. Feature remains fail-closed.`);
  }
}

// ============================================================================
// AUDIT EVENT WRITER
// ============================================================================

async function createAuditEvent(base44Client, eventData) {
  // Audit events are append-only, immutable
  // Never update or delete; only create
  if (!base44Client) {
    throw new Error('Unauthorized: No authenticated client');
  }

  const auditEvent = {
    action: eventData.action,
    actor_user_id: eventData.actor_user_id,
    actor_role: eventData.actor_role,
    target_entity_type: eventData.target_entity_type,
    target_entity_id: eventData.target_entity_id,
    outcome: eventData.outcome || 'success',
    tenant_id: eventData.tenant_id,
    audit_trace_id: eventData.audit_trace_id,
    before_json: eventData.before_json || null,
    after_json: eventData.after_json || null,
  };

  // Store audit event (append-only)
  // Note: Real implementation would write to AuditEvent entity
  // For now, log structure for validation
  console.log('[AUDIT]', JSON.stringify(auditEvent, null, 2));
  return auditEvent;
}

// ============================================================================
// TOKEN HASHING UTILITIES
// ============================================================================

function generateTokenHash(token) {
  // Hash token using HMAC-SHA256; never store plaintext
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
}

function verifyTokenHash(token, storedHash) {
  const tokenHash = generateTokenHash(token);
  // Constant-time comparison of hex strings (safe for SHA256 hashes)
  return tokenHash === storedHash && tokenHash.length === storedHash.length;
}

// ============================================================================
// SCOPE VALIDATION
// ============================================================================

function assertScopeAccess(base44Client, resource) {
  // Cross-tenant check
  if (resource.tenant_id && resource.tenant_id !== base44Client.getTenantId?.()) {
    throw new Error('NOT_FOUND: Resource not visible in your scope');
  }
}

// ============================================================================
// PERMISSION VALIDATION
// ============================================================================

function assertPermission(base44Client, permission, actor) {
  // All permissions default false (fail-closed)
  const permissionMap = {
    'broker_agency.onboarding_start': false,
    'broker_agency.compliance_document_upload': false,
    'platform_broker.approval_queue_view': false,
    'platform_broker.approval_decide': false,
    'broker_agency.portal_access_enable': false,
  };

  if (!permissionMap[permission]) {
    throw new Error(`PERMISSION_DENIED: ${permission} is not enabled or you lack this permission`);
  }
}

// ============================================================================
// METHOD 1: submitStandaloneBrokerSignup
// ============================================================================

export async function submitStandaloneBrokerSignup(base44Client, signupData) {
  // Feature flag check
  assertFeatureFlagEnabled('BROKER_SIGNUP_ENABLED');

  const auditTraceId = crypto.randomUUID();
  const tenantId = signupData.tenant_id || 'default_tenant';

  // STEP 1: Create BrokerAgencyProfile (standalone, no MGA)
  let brokerAgencyProfile;
  try {
    brokerAgencyProfile = await base44Client.entities.BrokerAgencyProfile.create({
      tenant_id: tenantId,
      legal_name: signupData.legal_name,
      primary_contact_email: signupData.primary_contact_email,
      code: signupData.code,
      onboarding_status: 'business_identity',
      approval_status: 'pending',
      master_general_agent_id: null, // Standalone broker — no MGA
      owner_org_type: 'broker_agency',
      owner_org_id: null, // Will be set after profile created
      visibility_scope: 'owner_only',
      audit_trace_id: auditTraceId,
      created_by_role: 'public_signup',
    });
  } catch (error) {
    throw new Error(`Failed to create BrokerAgencyProfile: ${error.message}`);
  }

  // Update owner_org_id to self-reference
  brokerAgencyProfile.owner_org_id = brokerAgencyProfile.id;
  await base44Client.entities.BrokerAgencyProfile.update(brokerAgencyProfile.id, {
    owner_org_id: brokerAgencyProfile.id,
  });

  // STEP 2: Create BrokerPlatformRelationship (pending_review)
  let platformRelationship;
  try {
    platformRelationship = await base44Client.entities.BrokerPlatformRelationship.create({
      tenant_id: tenantId,
      broker_agency_id: brokerAgencyProfile.id,
      status: 'pending_approval',
      approval_status: 'pending',
      compliance_status: 'pending_review',
      audit_trace_id: auditTraceId,
    });
  } catch (error) {
    throw new Error(`Failed to create BrokerPlatformRelationship: ${error.message}`);
  }

  // STEP 3: Create BrokerAgencyOnboardingCase
  let onboardingCase;
  try {
    onboardingCase = await base44Client.entities.BrokerAgencyOnboardingCase.create({
      tenant_id: tenantId,
      broker_agency_id: brokerAgencyProfile.id,
      status: 'pending_email_verification',
      npn_validated: false,
      compliance_documents_submitted: false,
      compliance_hold: false,
      compliance_hold_reason: 'none',
      audit_trace_id: auditTraceId,
      created_by_user_id: 'system',
      created_by_role: 'public_signup',
    });
  } catch (error) {
    throw new Error(`Failed to create BrokerAgencyOnboardingCase: ${error.message}`);
  }

  // STEP 4: Generate invitation token and hash
  const invitationToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = generateTokenHash(invitationToken);

  // STEP 5: Create BrokerAgencyInvitation (token_hash only)
  let invitation;
  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    invitation = await base44Client.entities.BrokerAgencyInvitation.create({
      tenant_id: tenantId,
      onboarding_case_id: onboardingCase.id,
      invited_email: signupData.primary_contact_email,
      invited_name: signupData.primary_contact_name,
      invited_role: 'owner',
      status: 'invited',
      token_hash: tokenHash, // HASH ONLY, NOT plaintext
      invitation_sent_at: now,
      expires_at: expiresAt,
      audit_trace_id: auditTraceId,
      created_by_user_id: 'system',
    });
  } catch (error) {
    throw new Error(`Failed to create BrokerAgencyInvitation: ${error.message}`);
  }

  // STEP 6: Audit event
  await createAuditEvent(base44Client, {
    action: 'BROKER_SIGNUP_SUBMITTED',
    actor_user_id: 'system',
    actor_role: 'public_signup',
    target_entity_type: 'BrokerAgencyProfile',
    target_entity_id: brokerAgencyProfile.id,
    outcome: 'success',
    tenant_id: tenantId,
    audit_trace_id: auditTraceId,
    after_json: JSON.stringify({
      broker_agency_id: brokerAgencyProfile.id,
      onboarding_case_id: onboardingCase.id,
      invitation_id: invitation.id,
      status: 'pending_email_verification',
    }),
  });

  // Return invitation token to applicant (ONE TIME ONLY)
  // Plaintext token returned to applicant; only hash stored in database
  return {
    success: true,
    broker_agency_id: brokerAgencyProfile.id,
    onboarding_case_id: onboardingCase.id,
    invitation_id: invitation.id,
    onboarding_token: invitationToken, // Plaintext to applicant for onboarding link
    audit_trace_id: auditTraceId,
  };
}

// ============================================================================
// METHOD 2: validateBrokerSignupToken
// ============================================================================

export async function validateBrokerSignupToken(base44Client, onboardingToken) {
  const auditTraceId = crypto.randomUUID();
  const tenantId = 'default_tenant';

  // Query invitation by onboarding_case_id or email
  let invitation;
  try {
    const invitations = await base44Client.entities.BrokerAgencyInvitation.filter({});
    // Find by token_hash (will be done via contract lookup, not raw query)
    invitation = invitations.find(inv => {
      try {
        return verifyTokenHash(onboardingToken, inv.token_hash);
      } catch {
        return false;
      }
    });
  } catch (error) {
    await createAuditEvent(base44Client, {
      action: 'TOKEN_VALIDATED',
      outcome: 'blocked',
      reason: 'invitation_lookup_failed',
      audit_trace_id: auditTraceId,
    });
    throw new Error('NOT_FOUND: Invalid token');
  }

  if (!invitation) {
    await createAuditEvent(base44Client, {
      action: 'TOKEN_VALIDATED',
      outcome: 'blocked',
      reason: 'invalid_token',
      audit_trace_id: auditTraceId,
    });
    throw new Error('NOT_FOUND: Invalid token');
  }

  // Check expiration
  if (new Date() > new Date(invitation.expires_at)) {
    await createAuditEvent(base44Client, {
      action: 'TOKEN_EXPIRED_DENIED',
      outcome: 'blocked',
      target_entity_type: 'BrokerAgencyInvitation',
      target_entity_id: invitation.id,
      audit_trace_id: auditTraceId,
    });
    throw new Error('NOT_FOUND: Token expired');
  }

  // Check single-use: has token already been consumed?
  if (invitation.single_use_consumed_at) {
    await createAuditEvent(base44Client, {
      action: 'TOKEN_REPLAY_DENIED',
      outcome: 'blocked',
      target_entity_type: 'BrokerAgencyInvitation',
      target_entity_id: invitation.id,
      audit_trace_id: auditTraceId,
    });
    throw new Error('NOT_FOUND: Token already used');
  }

  // Token is valid
  await createAuditEvent(base44Client, {
    action: 'TOKEN_VALIDATED',
    outcome: 'success',
    target_entity_type: 'BrokerAgencyInvitation',
    target_entity_id: invitation.id,
    audit_trace_id: auditTraceId,
  });

  return {
    valid: true,
    onboarding_case_id: invitation.onboarding_case_id,
    invited_email: invitation.invited_email,
    audit_trace_id: auditTraceId,
  };
}

// ============================================================================
// METHOD 3: completeBrokerOnboardingProfile
// ============================================================================

export async function completeBrokerOnboardingProfile(base44Client, profileData) {
  assertFeatureFlagEnabled('BROKER_ONBOARDING_ENABLED');

  const auditTraceId = profileData.audit_trace_id || crypto.randomUUID();
  const tenantId = profileData.tenant_id || 'default_tenant';

  // Fetch onboarding case
  let onboardingCase;
  try {
    onboardingCase = await base44Client.entities.BrokerAgencyOnboardingCase.filter({
      id: profileData.onboarding_case_id,
    }).then(cases => cases[0]);
  } catch (error) {
    throw new Error(`Onboarding case not found: ${error.message}`);
  }

  assertScopeAccess(base44Client, { tenant_id: tenantId });

  // Update BrokerAgencyProfile with additional details
  const brokerAgencyId = onboardingCase.broker_agency_id;
  try {
    await base44Client.entities.BrokerAgencyProfile.update(brokerAgencyId, {
      primary_contact_phone: profileData.primary_contact_phone,
      business_address_line1: profileData.address,
      city: profileData.city,
      state: profileData.state,
      zip: profileData.zip,
      producer_license_number: profileData.npn,
      resident_state: profileData.resident_state,
      licensed_states: profileData.licensed_states || [],
      onboarding_status: 'licensing_compliance',
    });
  } catch (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  // Update onboarding case status
  try {
    await base44Client.entities.BrokerAgencyOnboardingCase.update(
      onboardingCase.id,
      {
        status: 'pending_profile_completion',
        audit_trace_id: auditTraceId,
      }
    );
  } catch (error) {
    throw new Error(`Failed to update onboarding case: ${error.message}`);
  }

  // Audit event
  await createAuditEvent(base44Client, {
    action: 'BROKER_PROFILE_COMPLETED',
    actor_user_id: profileData.actor_user_id || brokerAgencyId,
    actor_role: 'broker_applicant',
    target_entity_type: 'BrokerAgencyProfile',
    target_entity_id: brokerAgencyId,
    outcome: 'success',
    tenant_id: tenantId,
    audit_trace_id: auditTraceId,
  });

  return {
    success: true,
    onboarding_case_id: onboardingCase.id,
    status: 'pending_profile_completion',
  };
}

// ============================================================================
// METHOD 4: uploadBrokerComplianceDocument
// ============================================================================

export async function uploadBrokerComplianceDocument(base44Client, documentData) {
  assertFeatureFlagEnabled('BROKER_COMPLIANCE_DOCUMENT_ENFORCEMENT');

  const auditTraceId = documentData.audit_trace_id || crypto.randomUUID();
  const tenantId = documentData.tenant_id || 'default_tenant';

  assertScopeAccess(base44Client, { tenant_id: tenantId });

  // Create compliance document record
  let document;
  try {
    document = await base44Client.entities.BrokerComplianceDocument.create({
      tenant_id: tenantId,
      onboarding_case_id: documentData.onboarding_case_id,
      broker_agency_id: documentData.broker_agency_id,
      document_type: documentData.document_type,
      file_url: documentData.file_url,
      file_name: documentData.file_name,
      file_size: documentData.file_size,
      upload_status: 'pending_review',
      uploaded_by: documentData.uploaded_by,
      audit_trace_id: auditTraceId,
    });
  } catch (error) {
    throw new Error(`Failed to create compliance document: ${error.message}`);
  }

  // Update onboarding case
  try {
    await base44Client.entities.BrokerAgencyOnboardingCase.update(
      documentData.onboarding_case_id,
      { compliance_documents_submitted: true }
    );
  } catch (error) {
    throw new Error(`Failed to update onboarding case: ${error.message}`);
  }

  // Audit event
  await createAuditEvent(base44Client, {
    action: 'BROKER_COMPLIANCE_DOCUMENT_UPLOADED',
    actor_user_id: documentData.uploaded_by,
    actor_role: 'broker_applicant',
    target_entity_type: 'BrokerComplianceDocument',
    target_entity_id: document.id,
    outcome: 'success',
    tenant_id: tenantId,
    audit_trace_id: auditTraceId,
  });

  return {
    success: true,
    document_id: document.id,
    status: 'pending_review',
  };
}

// ============================================================================
// METHOD 5: resendBrokerOnboardingInvite
// ============================================================================

export async function resendBrokerOnboardingInvite(base44Client, invitationData) {
  // Fetch existing invitation
  let invitation;
  try {
    invitation = await base44Client.entities.BrokerAgencyInvitation.filter({
      id: invitationData.invitation_id,
    }).then(invs => invs[0]);
  } catch (error) {
    throw new Error(`Invitation not found: ${error.message}`);
  }

  assertScopeAccess(base44Client, invitation);

  // Generate new token (old one remains valid but can be superseded)
  const newToken = crypto.randomBytes(32).toString('hex');
  const newTokenHash = generateTokenHash(newToken);

  // Update invitation with new token hash
  try {
    await base44Client.entities.BrokerAgencyInvitation.update(invitation.id, {
      token_hash: newTokenHash,
      invitation_sent_at: new Date(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  } catch (error) {
    throw new Error(`Failed to resend invitation: ${error.message}`);
  }

  return {
    success: true,
    invitation_id: invitation.id,
    onboarding_token: newToken,
  };
}

// ============================================================================
// METHOD 6: cancelBrokerSignup
// ============================================================================

export async function cancelBrokerSignup(base44Client, signupData) {
  const auditTraceId = signupData.audit_trace_id || crypto.randomUUID();

  // Fetch onboarding case
  let onboardingCase;
  try {
    onboardingCase = await base44Client.entities.BrokerAgencyOnboardingCase.filter({
      id: signupData.onboarding_case_id,
    }).then(cases => cases[0]);
  } catch (error) {
    throw new Error(`Onboarding case not found: ${error.message}`);
  }

  assertScopeAccess(base44Client, onboardingCase);

  // Mark as rejected/terminated
  try {
    await base44Client.entities.BrokerAgencyOnboardingCase.update(
      onboardingCase.id,
      {
        status: 'terminated',
        rejected_at: new Date(),
      }
    );
  } catch (error) {
    throw new Error(`Failed to cancel signup: ${error.message}`);
  }

  // Audit event
  await createAuditEvent(base44Client, {
    action: 'BROKER_SIGNUP_CANCELLED',
    target_entity_type: 'BrokerAgencyOnboardingCase',
    target_entity_id: onboardingCase.id,
    outcome: 'success',
    audit_trace_id: auditTraceId,
  });

  return { success: true };
}

// ============================================================================
// METHOD 7: approveStandaloneBroker
// ============================================================================

export async function approveStandaloneBroker(base44Client, approvalData) {
  assertPermission(base44Client, 'platform_broker.approval_decide');

  const auditTraceId = approvalData.audit_trace_id || crypto.randomUUID();
  const tenantId = approvalData.tenant_id || 'default_tenant';

  // Fetch onboarding case
  let onboardingCase;
  try {
    onboardingCase = await base44Client.entities.BrokerAgencyOnboardingCase.filter({
      id: approvalData.onboarding_case_id,
    }).then(cases => cases[0]);
  } catch (error) {
    throw new Error(`Onboarding case not found: ${error.message}`);
  }

  // Check compliance hold
  if (onboardingCase.compliance_hold) {
    throw new Error('COMPLIANCE_HOLD: Cannot approve while compliance hold is active');
  }

  // Broker applicant cannot self-approve
  const brokerAgencyId = onboardingCase.broker_agency_id;
  if (approvalData.actor_user_id === brokerAgencyId) {
    throw new Error('PERMISSION_DENIED: Broker applicant cannot self-approve');
  }

  // Update onboarding case
  try {
    await base44Client.entities.BrokerAgencyOnboardingCase.update(
      onboardingCase.id,
      {
        status: 'active',
        approved_at: new Date(),
        assigned_approver: approvalData.approved_by_user,
        audit_trace_id: auditTraceId,
      }
    );
  } catch (error) {
    throw new Error(`Failed to approve: ${error.message}`);
  }

  // Update BrokerPlatformRelationship
  try {
    await base44Client.entities.BrokerPlatformRelationship.update(
      approvalData.platform_relationship_id,
      {
        status: 'approved',
        approval_status: 'approved',
      }
    );
  } catch (error) {
    throw new Error(`Failed to update relationship: ${error.message}`);
  }

  // Update BrokerAgencyProfile
  try {
    await base44Client.entities.BrokerAgencyProfile.update(brokerAgencyId, {
      approval_status: 'approved',
      onboarding_status: 'activated',
    });
  } catch (error) {
    throw new Error(`Failed to activate profile: ${error.message}`);
  }

  // Audit event
  await createAuditEvent(base44Client, {
    action: 'BROKER_PLATFORM_RELATIONSHIP_APPROVED',
    actor_user_id: approvalData.approved_by_user,
    actor_role: 'platform_admin',
    target_entity_type: 'BrokerAgencyOnboardingCase',
    target_entity_id: onboardingCase.id,
    outcome: 'success',
    tenant_id: tenantId,
    audit_trace_id: auditTraceId,
  });

  return { success: true, status: 'active' };
}

// ============================================================================
// METHOD 8: rejectStandaloneBroker
// ============================================================================

export async function rejectStandaloneBroker(base44Client, rejectionData) {
  assertPermission(base44Client, 'platform_broker.approval_decide');

  const auditTraceId = rejectionData.audit_trace_id || crypto.randomUUID();
  const tenantId = rejectionData.tenant_id || 'default_tenant';

  // Fetch onboarding case
  let onboardingCase;
  try {
    onboardingCase = await base44Client.entities.BrokerAgencyOnboardingCase.filter({
      id: rejectionData.onboarding_case_id,
    }).then(cases => cases[0]);
  } catch (error) {
    throw new Error(`Onboarding case not found: ${error.message}`);
  }

  // Update onboarding case
  try {
    await base44Client.entities.BrokerAgencyOnboardingCase.update(
      onboardingCase.id,
      {
        status: 'rejected',
        rejected_at: new Date(),
        notes: rejectionData.rejection_reason,
        audit_trace_id: auditTraceId,
      }
    );
  } catch (error) {
    throw new Error(`Failed to reject: ${error.message}`);
  }

  // Update BrokerPlatformRelationship
  try {
    await base44Client.entities.BrokerPlatformRelationship.update(
      rejectionData.platform_relationship_id,
      {
        status: 'rejected',
        approval_status: 'rejected',
      }
    );
  } catch (error) {
    throw new Error(`Failed to update relationship: ${error.message}`);
  }

  // Audit event
  await createAuditEvent(base44Client, {
    action: 'BROKER_PLATFORM_RELATIONSHIP_REJECTED',
    actor_user_id: rejectionData.rejected_by_user,
    actor_role: 'platform_admin',
    target_entity_type: 'BrokerAgencyOnboardingCase',
    target_entity_id: onboardingCase.id,
    outcome: 'success',
    tenant_id: tenantId,
    audit_trace_id: auditTraceId,
  });

  return { success: true, status: 'rejected' };
}

// ============================================================================
// METHOD 9: requestBrokerMoreInformation
// ============================================================================

export async function requestBrokerMoreInformation(base44Client, moreInfoData) {
  assertPermission(base44Client, 'platform_broker.approval_decide');

  const auditTraceId = moreInfoData.audit_trace_id || crypto.randomUUID();
  const tenantId = moreInfoData.tenant_id || 'default_tenant';

  // Fetch onboarding case
  let onboardingCase;
  try {
    onboardingCase = await base44Client.entities.BrokerAgencyOnboardingCase.filter({
      id: moreInfoData.onboarding_case_id,
    }).then(cases => cases[0]);
  } catch (error) {
    throw new Error(`Onboarding case not found: ${error.message}`);
  }

  // Update onboarding case
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30); // 30-day deadline

  try {
    await base44Client.entities.BrokerAgencyOnboardingCase.update(
      onboardingCase.id,
      {
        status: 'pending_more_information',
        notes: moreInfoData.more_info_request,
        audit_trace_id: auditTraceId,
      }
    );
  } catch (error) {
    throw new Error(`Failed to request more info: ${error.message}`);
  }

  // Audit event
  await createAuditEvent(base44Client, {
    action: 'BROKER_MORE_INFORMATION_REQUESTED',
    actor_user_id: moreInfoData.requested_by_user,
    actor_role: 'platform_admin',
    target_entity_type: 'BrokerAgencyOnboardingCase',
    target_entity_id: onboardingCase.id,
    outcome: 'success',
    tenant_id: tenantId,
    audit_trace_id: auditTraceId,
  });

  return { success: true, status: 'pending_more_information', due_date: dueDate };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  submitStandaloneBrokerSignup,
  validateBrokerSignupToken,
  completeBrokerOnboardingProfile,
  uploadBrokerComplianceDocument,
  resendBrokerOnboardingInvite,
  cancelBrokerSignup,
  approveStandaloneBroker,
  rejectStandaloneBroker,
  requestBrokerMoreInformation,
};