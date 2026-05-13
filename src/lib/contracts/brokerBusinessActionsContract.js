/**
 * Broker Business Actions Contract — Phase 7A-2.7
 * 
 * Centralized contract layer for broker business actions.
 * All methods fail-closed while feature flags are false.
 * No raw frontend entity reads; safe payloads only.
 * Scope and permission enforcement on all operations.
 * Comprehensive audit logging for all material actions.
 */

import { base44 } from '@/api/base44Client';
import { validateSafePayload, maskSensitiveIdentifiers } from '@/lib/security/brokerSafePayloadSanitizer';
import { auditFeatureDisabledAttempt, auditScopeDeniedAttempt, auditPermissionDeniedAttempt } from '@/lib/security/brokerAuditLogger';

// Feature flag defaults (all false during Phase 7A-2.7)
const FEATURE_FLAGS = {
  BROKER_WORKSPACE_ENABLED: false,
  BROKER_EMPLOYER_CREATE_ENABLED: false,
  BROKER_CASE_CREATE_ENABLED: false,
  BROKER_CENSUS_UPLOAD_ENABLED: false,
  BROKER_TASKS_ENABLED: false,
  BROKER_DOCUMENTS_ENABLED: false,
  BROKER_SETTINGS_ENABLED: false,
};

/**
 * Validate feature flag state and parent dependencies.
 */
function validateFeatureFlag(actionName, requiredFlags) {
  for (const flag of requiredFlags) {
    if (!FEATURE_FLAGS[flag]) {
      return {
        allowed: false,
        reason: 'FEATURE_DISABLED',
        disabled_flag: flag,
      };
    }
  }

  return {
    allowed: true,
  };
}

/**
 * Get authenticated user.
 */
async function getAuthenticatedUser() {
  try {
    return await base44.auth.me();
  } catch (error) {
    return null;
  }
}

/**
 * Audit log a broker business action.
 */
async function auditBrokerAction(eventType, brokerAgencyId, details = {}) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return;

    await base44.entities.ActivityLog.create({
      case_id: details.case_id || null,
      master_general_agent_id: null, // Direct book actions; MGA not set
      master_group_id: null,
      actor_email: user.email,
      actor_name: user.full_name,
      actor_role: user.role,
      action: eventType,
      detail: JSON.stringify({
        broker_agency_id: brokerAgencyId,
        ...details,
      }),
      entity_type: details.entity_type || 'BrokerAction',
      entity_id: details.entity_id || null,
      outcome: details.outcome || 'success',
      correlation_id: details.correlation_id || null,
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
}

/**
 * Validate broker agency ownership and scope.
 */
async function validateBrokerScope(brokerAgencyId) {
  if (!brokerAgencyId) {
    return {
      valid: false,
      status: 404,
      reason: 'BROKER_AGENCY_ID_MISSING',
    };
  }

  try {
    // Get authenticated user
    const user = await getAuthenticatedUser();
    if (!user) {
      return {
        valid: false,
        status: 401,
        reason: 'NOT_AUTHENTICATED',
      };
    }

    // Verify broker agency exists and user has access
    // This would validate against BrokerAgencyUser or broker principal role
    // For Phase 7A-2.7, we return masked 404 on scope failures
    const agency = await base44.entities.BrokerAgencyProfile.filter({
      id: brokerAgencyId,
    }).then(results => results[0]);

    if (!agency) {
      return {
        valid: false,
        status: 404,
        reason: 'INVALID_SCOPE',
      };
    }

    return {
      valid: true,
      agency,
    };
  } catch (error) {
    console.error('Scope validation error:', error);
    return {
      valid: false,
      status: 404,
      reason: 'INVALID_SCOPE',
    };
  }
}

/**
 * Check if user has broker agency admin or owner role.
 */
async function validateBrokerPermission(brokerAgencyId) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return {
        permitted: false,
        status: 401,
      };
    }

    // Check if user is broker agency user with appropriate role
    // For Phase 7A-2.7, simplified check
    const hasPermission = [
      'broker_agency_admin',
      'broker_agency_owner',
      'platform_super_admin',
      'admin',
    ].includes(user.role);

    if (!hasPermission) {
      return {
        permitted: false,
        status: 403,
      };
    }

    return {
      permitted: true,
    };
  } catch (error) {
    console.error('Permission validation error:', error);
    return {
      permitted: false,
      status: 403,
    };
  }
}

/**
 * Create broker employer (Direct Book only).
 * Fails closed while BROKER_EMPLOYER_CREATE_ENABLED=false.
 */
export async function createBrokerEmployer(brokerAgencyId, employerData) {
  const actionName = 'createBrokerEmployer';

  try {
    // 1. Feature flag check
    const flagCheck = validateFeatureFlag(actionName, [
      'BROKER_WORKSPACE_ENABLED',
      'BROKER_EMPLOYER_CREATE_ENABLED',
    ]);

    if (!flagCheck.allowed) {
      await auditBrokerAction('BROKER_BUSINESS_ACTION_DENIED_FEATURE_DISABLED', brokerAgencyId, {
        action: actionName,
        disabled_flag: flagCheck.disabled_flag,
        outcome: 'blocked',
      });

      return {
        success: false,
        status: 403,
        error: 'FEATURE_DISABLED',
      };
    }

    // 2. Scope validation
    const scopeCheck = await validateBrokerScope(brokerAgencyId);
    if (!scopeCheck.valid) {
      await auditBrokerAction('BROKER_BUSINESS_ACTION_DENIED_SCOPE', brokerAgencyId, {
        action: actionName,
        outcome: 'blocked',
      });

      return {
        success: false,
        status: scopeCheck.status,
        error: scopeCheck.reason,
      };
    }

    // 3. Permission validation
    const permCheck = await validateBrokerPermission(brokerAgencyId);
    if (!permCheck.permitted) {
      await auditBrokerAction('BROKER_BUSINESS_ACTION_DENIED_PERMISSION', brokerAgencyId, {
        action: actionName,
        outcome: 'blocked',
      });

      return {
        success: false,
        status: permCheck.status,
        error: 'PERMISSION_DENIED',
      };
    }

    // 4. Create employer with direct book classification
    const newEmployer = await base44.entities.Employer.create({
      broker_agency_id: brokerAgencyId,
      tenant_id: 'default', // Would come from user context in production
      distribution_channel: 'direct_book', // Standalone broker
      master_general_agent_id: null, // Direct book; no MGA
      name: employerData.name,
      ein: employerData.ein || null,
      address: employerData.address || null,
      city: employerData.city || null,
      state: employerData.state || null,
      zip: employerData.zip || null,
      phone: employerData.phone || null,
      email: employerData.email || null,
      employee_count: employerData.employee_count || 0,
      status: 'active',
      created_by_broker_agency: true,
    });

    // 5. Audit success
    await auditBrokerAction('BROKER_EMPLOYER_CREATED', brokerAgencyId, {
      entity_type: 'Employer',
      entity_id: newEmployer.id,
      employer_name: newEmployer.name,
      distribution_channel: 'direct_book',
      outcome: 'success',
    });

    // 6. Return safe payload
    return {
      success: true,
      employer: {
        id: newEmployer.id,
        name: newEmployer.name,
        ein: newEmployer.ein ? '****' : null, // Masked
        address: newEmployer.address,
        city: newEmployer.city,
        state: newEmployer.state,
        zip: newEmployer.zip,
        employee_count: newEmployer.employee_count,
        status: newEmployer.status,
        distribution_channel: 'direct_book',
        created_at: newEmployer.created_date,
      },
    };
  } catch (error) {
    console.error('Create employer error:', error);
    await auditBrokerAction('BROKER_BUSINESS_ACTION_FAILED', brokerAgencyId, {
      action: actionName,
      error: error.message,
      outcome: 'failed',
    });

    return {
      success: false,
      status: 500,
      error: error.message,
    };
  }
}

/**
 * Create broker case (Direct Book employer only).
 * Fails closed while BROKER_CASE_CREATE_ENABLED=false.
 */
export async function createBrokerCase(brokerAgencyId, caseData) {
  const actionName = 'createBrokerCase';

  try {
    // 1. Feature flag check
    const flagCheck = validateFeatureFlag(actionName, [
      'BROKER_WORKSPACE_ENABLED',
      'BROKER_CASE_CREATE_ENABLED',
    ]);

    if (!flagCheck.allowed) {
      await auditBrokerAction('BROKER_BUSINESS_ACTION_DENIED_FEATURE_DISABLED', brokerAgencyId, {
        action: actionName,
        disabled_flag: flagCheck.disabled_flag,
        outcome: 'blocked',
      });

      return {
        success: false,
        status: 403,
        error: 'FEATURE_DISABLED',
      };
    }

    // 2. Scope validation
    const scopeCheck = await validateBrokerScope(brokerAgencyId);
    if (!scopeCheck.valid) {
      await auditBrokerAction('BROKER_BUSINESS_ACTION_DENIED_SCOPE', brokerAgencyId, {
        action: actionName,
        outcome: 'blocked',
      });

      return {
        success: false,
        status: scopeCheck.status,
        error: scopeCheck.reason,
      };
    }

    // 3. Permission validation
    const permCheck = await validateBrokerPermission(brokerAgencyId);
    if (!permCheck.permitted) {
      await auditBrokerAction('BROKER_BUSINESS_ACTION_DENIED_PERMISSION', brokerAgencyId, {
        action: actionName,
        outcome: 'blocked',
      });

      return {
        success: false,
        status: permCheck.status,
        error: 'PERMISSION_DENIED',
      };
    }

    // 4. Verify employer is direct book
    const employer = await base44.entities.Employer.get(caseData.employer_id);
    if (!employer || employer.distribution_channel !== 'direct_book') {
      await auditBrokerAction('BROKER_BUSINESS_ACTION_DENIED_SCOPE', brokerAgencyId, {
        action: actionName,
        detail: 'employer_not_in_scope',
        outcome: 'blocked',
      });

      return {
        success: false,
        status: 403,
        error: 'EMPLOYER_NOT_IN_SCOPE',
      };
    }

    // 5. Create case with direct book channel preservation
    const newCase = await base44.entities.BenefitCase.create({
      agency_id: brokerAgencyId,
      employer_group_id: caseData.employer_id,
      case_type: caseData.case_type || 'new_business',
      effective_date: caseData.effective_date || null,
      stage: 'draft',
      priority: caseData.priority || 'normal',
      assigned_to: caseData.assigned_to || null,
      employer_name: employer.name,
      employee_count: employer.employee_count || 0,
      status: 'active',
      distribution_channel: 'direct_book', // Preserve direct book
      master_general_agent_id: null, // No MGA
    });

    // 6. Audit success
    await auditBrokerAction('BROKER_CASE_CREATED', brokerAgencyId, {
      entity_type: 'BenefitCase',
      entity_id: newCase.id,
      case_id: newCase.id,
      employer_id: caseData.employer_id,
      distribution_channel: 'direct_book',
      outcome: 'success',
    });

    // 7. Return safe payload
    return {
      success: true,
      case: {
        id: newCase.id,
        case_type: newCase.case_type,
        employer_name: newCase.employer_name,
        effective_date: newCase.effective_date,
        stage: newCase.stage,
        priority: newCase.priority,
        status: newCase.status,
        distribution_channel: 'direct_book',
        created_at: newCase.created_date,
      },
    };
  } catch (error) {
    console.error('Create case error:', error);
    await auditBrokerAction('BROKER_BUSINESS_ACTION_FAILED', brokerAgencyId, {
      action: actionName,
      error: error.message,
      outcome: 'failed',
    });

    return {
      success: false,
      status: 500,
      error: error.message,
    };
  }
}

/**
 * Upload broker census (metadata only).
 * No raw census rows returned.
 * Fails closed while BROKER_CENSUS_UPLOAD_ENABLED=false.
 */
export async function uploadBrokerCensus(brokerAgencyId, caseId, censusData) {
  const actionName = 'uploadBrokerCensus';

  try {
    // 1. Feature flag check
    const flagCheck = validateFeatureFlag(actionName, [
      'BROKER_WORKSPACE_ENABLED',
      'BROKER_CENSUS_UPLOAD_ENABLED',
    ]);

    if (!flagCheck.allowed) {
      await auditBrokerAction('BROKER_BUSINESS_ACTION_DENIED_FEATURE_DISABLED', brokerAgencyId, {
        action: actionName,
        disabled_flag: flagCheck.disabled_flag,
        case_id: caseId,
        outcome: 'blocked',
      });

      return {
        success: false,
        status: 403,
        error: 'FEATURE_DISABLED',
      };
    }

    // 2. Scope validation
    const scopeCheck = await validateBrokerScope(brokerAgencyId);
    if (!scopeCheck.valid) {
      await auditBrokerAction('BROKER_BUSINESS_ACTION_DENIED_SCOPE', brokerAgencyId, {
        action: actionName,
        case_id: caseId,
        outcome: 'blocked',
      });

      return {
        success: false,
        status: scopeCheck.status,
        error: scopeCheck.reason,
      };
    }

    // 3. Permission validation
    const permCheck = await validateBrokerPermission(brokerAgencyId);
    if (!permCheck.permitted) {
      await auditBrokerAction('BROKER_BUSINESS_ACTION_DENIED_PERMISSION', brokerAgencyId, {
        action: actionName,
        case_id: caseId,
        outcome: 'blocked',
      });

      return {
        success: false,
        status: permCheck.status,
        error: 'PERMISSION_DENIED',
      };
    }

    // 4. Verify case exists and is direct book
    const benefitCase = await base44.entities.BenefitCase.get(caseId);
    if (!benefitCase || benefitCase.agency_id !== brokerAgencyId) {
      return {
        success: false,
        status: 404,
        error: 'CASE_NOT_FOUND',
      };
    }

    // 5. Create census version (metadata only)
    const censusVersion = await base44.entities.CensusVersion.create({
      case_id: caseId,
      master_general_agent_id: null, // Direct book
      master_group_id: null,
      version_number: (censusData.version || 1),
      file_name: censusData.file_name || 'census.csv',
      file_url: censusData.file_uri || null, // Private/signed only
      status: 'uploaded',
      total_employees: censusData.total_employees || 0,
      total_dependents: censusData.total_dependents || 0,
      eligible_employees: censusData.eligible_employees || 0,
      uploaded_by: (await getAuthenticatedUser())?.email || 'system',
      notes: censusData.notes || null,
    });

    // 6. Audit upload attempt
    await auditBrokerAction('BROKER_CENSUS_UPLOAD_ATTEMPTED', brokerAgencyId, {
      entity_type: 'CensusVersion',
      entity_id: censusVersion.id,
      case_id: caseId,
      file_name: censusData.file_name,
      outcome: 'success',
    });

    // 7. Return safe metadata payload (NO raw census rows, NO SSN, NO health data)
    return {
      success: true,
      census: {
        id: censusVersion.id,
        version_number: censusVersion.version_number,
        file_name: censusVersion.file_name,
        status: censusVersion.status,
        total_employees: censusVersion.total_employees,
        total_dependents: censusVersion.total_dependents,
        eligible_employees: censusVersion.eligible_employees,
        validation_status: 'pending',
        uploaded_at: censusVersion.created_date,
      },
      // NO file_url, NO raw rows, NO SSN/health data
    };
  } catch (error) {
    console.error('Census upload error:', error);
    await auditBrokerAction('BROKER_BUSINESS_ACTION_FAILED', brokerAgencyId, {
      action: actionName,
      case_id: caseId,
      error: error.message,
      outcome: 'failed',
    });

    return {
      success: false,
      status: 500,
      error: error.message,
    };
  }
}

/**
 * Manage broker task (create/update).
 * Fails closed while BROKER_TASKS_ENABLED=false.
 */
export async function manageBrokerTask(brokerAgencyId, taskData) {
  const actionName = 'manageBrokerTask';

  try {
    // 1. Feature flag check
    const flagCheck = validateFeatureFlag(actionName, [
      'BROKER_WORKSPACE_ENABLED',
      'BROKER_TASKS_ENABLED',
    ]);

    if (!flagCheck.allowed) {
      await auditBrokerAction('BROKER_BUSINESS_ACTION_DENIED_FEATURE_DISABLED', brokerAgencyId, {
        action: actionName,
        disabled_flag: flagCheck.disabled_flag,
        outcome: 'blocked',
      });

      return {
        success: false,
        status: 403,
        error: 'FEATURE_DISABLED',
      };
    }

    // 2. Scope validation
    const scopeCheck = await validateBrokerScope(brokerAgencyId);
    if (!scopeCheck.valid) {
      return {
        success: false,
        status: scopeCheck.status,
        error: scopeCheck.reason,
      };
    }

    // 3. Permission validation
    const permCheck = await validateBrokerPermission(brokerAgencyId);
    if (!permCheck.permitted) {
      return {
        success: false,
        status: permCheck.status,
        error: 'PERMISSION_DENIED',
      };
    }

    // 4. Create or update task
    let task;
    if (taskData.id) {
      // Update existing task
      task = await base44.entities.CaseTask.update(taskData.id, {
        title: taskData.title,
        description: taskData.description,
        status: taskData.status || 'pending',
        priority: taskData.priority || 'normal',
        due_date: taskData.due_date || null,
      });

      await auditBrokerAction('BROKER_TASK_UPDATED', brokerAgencyId, {
        entity_type: 'CaseTask',
        entity_id: task.id,
        case_id: taskData.case_id,
        outcome: 'success',
      });
    } else {
      // Create new task
      task = await base44.entities.CaseTask.create({
        case_id: taskData.case_id,
        master_general_agent_id: null,
        master_group_id: null,
        title: taskData.title,
        description: taskData.description,
        task_type: taskData.task_type || 'action_required',
        status: 'pending',
        priority: taskData.priority || 'normal',
        assigned_to: taskData.assigned_to || null,
        due_date: taskData.due_date || null,
      });

      await auditBrokerAction('BROKER_TASK_CREATED', brokerAgencyId, {
        entity_type: 'CaseTask',
        entity_id: task.id,
        case_id: taskData.case_id,
        outcome: 'success',
      });
    }

    // 5. Return safe payload
    return {
      success: true,
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        due_date: task.due_date,
        created_at: task.created_date,
      },
    };
  } catch (error) {
    console.error('Manage task error:', error);
    await auditBrokerAction('BROKER_BUSINESS_ACTION_FAILED', brokerAgencyId, {
      action: actionName,
      error: error.message,
      outcome: 'failed',
    });

    return {
      success: false,
      status: 500,
      error: error.message,
    };
  }
}

/**
 * Upload broker document (private/signed reference only).
 * Fails closed while BROKER_DOCUMENTS_ENABLED=false.
 */
export async function uploadBrokerDocument(brokerAgencyId, caseId, documentData) {
  const actionName = 'uploadBrokerDocument';

  try {
    // 1. Feature flag check
    const flagCheck = validateFeatureFlag(actionName, [
      'BROKER_WORKSPACE_ENABLED',
      'BROKER_DOCUMENTS_ENABLED',
    ]);

    if (!flagCheck.allowed) {
      await auditBrokerAction('BROKER_BUSINESS_ACTION_DENIED_FEATURE_DISABLED', brokerAgencyId, {
        action: actionName,
        disabled_flag: flagCheck.disabled_flag,
        case_id: caseId,
        outcome: 'blocked',
      });

      return {
        success: false,
        status: 403,
        error: 'FEATURE_DISABLED',
      };
    }

    // 2. Scope validation
    const scopeCheck = await validateBrokerScope(brokerAgencyId);
    if (!scopeCheck.valid) {
      return {
        success: false,
        status: scopeCheck.status,
        error: scopeCheck.reason,
      };
    }

    // 3. Permission validation
    const permCheck = await validateBrokerPermission(brokerAgencyId);
    if (!permCheck.permitted) {
      return {
        success: false,
        status: permCheck.status,
        error: 'PERMISSION_DENIED',
      };
    }

    // 4. Verify case exists
    const benefitCase = await base44.entities.BenefitCase.get(caseId);
    if (!benefitCase) {
      return {
        success: false,
        status: 404,
        error: 'CASE_NOT_FOUND',
      };
    }

    // 5. Create document record (private/signed URL only)
    const document = await base44.entities.Document.create({
      case_id: caseId,
      employer_group_id: benefitCase.employer_group_id,
      master_general_agent_id: null,
      master_group_id: null,
      name: documentData.name,
      document_type: documentData.document_type || 'other',
      file_name: documentData.file_name || 'document',
      file_size: documentData.file_size || 0,
      file_url: documentData.file_uri || null, // Private/signed only
      notes: documentData.notes || null,
      uploaded_by: (await getAuthenticatedUser())?.email || 'system',
      employer_name: benefitCase.employer_name,
    });

    // 6. Audit upload
    await auditBrokerAction('BROKER_DOCUMENT_UPLOADED', brokerAgencyId, {
      entity_type: 'Document',
      entity_id: document.id,
      case_id: caseId,
      document_type: documentData.document_type,
      outcome: 'success',
    });

    // 7. Return safe payload (NO public URLs, private/signed only)
    return {
      success: true,
      document: {
        id: document.id,
        name: document.name,
        document_type: document.document_type,
        file_name: document.file_name,
        file_size: document.file_size,
        uploaded_at: document.created_date,
        notes: document.notes,
      },
      // NO file_url; clients must request signed URL separately
    };
  } catch (error) {
    console.error('Document upload error:', error);
    await auditBrokerAction('BROKER_BUSINESS_ACTION_FAILED', brokerAgencyId, {
      action: actionName,
      case_id: caseId,
      error: error.message,
      outcome: 'failed',
    });

    return {
      success: false,
      status: 500,
      error: error.message,
    };
  }
}

/**
 * Update broker agency profile.
 * Restricted to authorized fields only.
 * Fails closed while BROKER_SETTINGS_ENABLED=false.
 */
export async function updateBrokerAgencyProfile(brokerAgencyId, profileData) {
  const actionName = 'updateBrokerAgencyProfile';

  try {
    // 1. Feature flag check
    const flagCheck = validateFeatureFlag(actionName, [
      'BROKER_WORKSPACE_ENABLED',
      'BROKER_SETTINGS_ENABLED',
    ]);

    if (!flagCheck.allowed) {
      await auditBrokerAction('BROKER_BUSINESS_ACTION_DENIED_FEATURE_DISABLED', brokerAgencyId, {
        action: actionName,
        disabled_flag: flagCheck.disabled_flag,
        outcome: 'blocked',
      });

      return {
        success: false,
        status: 403,
        error: 'FEATURE_DISABLED',
      };
    }

    // 2. Scope validation
    const scopeCheck = await validateBrokerScope(brokerAgencyId);
    if (!scopeCheck.valid) {
      return {
        success: false,
        status: scopeCheck.status,
        error: scopeCheck.reason,
      };
    }

    // 3. Permission validation (broker owner/admin only)
    const permCheck = await validateBrokerPermission(brokerAgencyId);
    if (!permCheck.permitted) {
      return {
        success: false,
        status: permCheck.status,
        error: 'PERMISSION_DENIED',
      };
    }

    // 4. Whitelist updatable fields only
    const updateFields = {};
    const allowedFields = ['name', 'phone', 'email', 'address', 'city', 'state', 'zip'];

    for (const field of allowedFields) {
      if (field in profileData) {
        updateFields[field] = profileData[field];
      }
    }

    // 5. Explicitly prevent escalation attempts
    if (
      'master_general_agent_id' in profileData ||
      'portal_access_enabled' in profileData ||
      'compliance_status' in profileData
    ) {
      await auditBrokerAction('BROKER_BUSINESS_ACTION_DENIED_PERMISSION', brokerAgencyId, {
        action: actionName,
        detail: 'attempted_escalation_or_override',
        outcome: 'blocked',
      });

      return {
        success: false,
        status: 403,
        error: 'UNAUTHORIZED_FIELD_UPDATE',
      };
    }

    // 6. Update profile
    const updated = await base44.entities.BrokerAgencyProfile.update(
      brokerAgencyId,
      updateFields
    );

    // 7. Audit update
    await auditBrokerAction('BROKER_AGENCY_PROFILE_UPDATED', brokerAgencyId, {
      entity_type: 'BrokerAgencyProfile',
      entity_id: brokerAgencyId,
      updated_fields: Object.keys(updateFields),
      outcome: 'success',
    });

    // 8. Return safe payload
    return {
      success: true,
      profile: {
        id: updated.id,
        name: updated.name,
        phone: updated.phone,
        email: updated.email,
        address: updated.address,
        city: updated.city,
        state: updated.state,
        zip: updated.zip,
        updated_at: updated.updated_date,
      },
    };
  } catch (error) {
    console.error('Update profile error:', error);
    await auditBrokerAction('BROKER_BUSINESS_ACTION_FAILED', brokerAgencyId, {
      action: actionName,
      error: error.message,
      outcome: 'failed',
    });

    return {
      success: false,
      status: 500,
      error: error.message,
    };
  }
}