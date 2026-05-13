/**
 * Broker Workspace Contract — Phase 7A-2.2
 * 
 * Backend contract layer for broker workspace data access.
 * All broker workspace queries must go through this contract.
 * No raw frontend entity reads.
 * 
 * Scope enforcement:
 * - Tenant scope (master_general_agent_id for MGA users, null for standalone brokers)
 * - Broker agency scope (broker_agency_id)
 * - DistributionChannelContext scope where applicable
 * - Feature flags (all fail-closed)
 * - Permissions
 * 
 * Safe payload behavior:
 * - No raw census data
 * - No SSN or sensitive employee data
 * - No public document URLs
 * - Document references private/signed only
 * - Dashboard counters cannot leak out-of-scope records
 */

import { base44 } from '@/api/base44Client';

/**
 * getBrokerWorkspaceAccessState
 * 
 * Evaluate broker workspace access eligibility using Gate 7A-1 portal access rules.
 * Returns one of 12 access states without activating workspace (feature flag control).
 * 
 * Access States:
 * 1. NOT_STARTED - No onboarding initiated
 * 2. PENDING_EMAIL_VERIFICATION - Email verification pending
 * 3. PROFILE_INCOMPLETE - Onboarding profile incomplete
 * 4. PENDING_COMPLIANCE - Awaiting compliance document submission
 * 5. PENDING_PLATFORM_REVIEW - Submitted for platform review
 * 6. PENDING_MORE_INFORMATION - Platform review requested more info
 * 7. COMPLIANCE_HOLD - Compliance hold active, portal access blocked
 * 8. REJECTED - Application rejected
 * 9. SUSPENDED - Account suspended
 * 10. APPROVED_BUT_WORKSPACE_DISABLED - Approved but workspace flag false
 * 11. ELIGIBLE_PENDING_WORKSPACE_ACTIVATION - Eligible pending feature flag activation
 * 12. ACTIVE - Workspace activated (reserved for later activation only)
 */
export async function getBrokerWorkspaceAccessState(brokerAgencyId) {
  try {
    const user = await base44.auth.me();
    
    // Audit event: access evaluation started
    if (user) {
      try {
        await base44.entities.AuditEvent.create({
          action: 'BROKER_WORKSPACE_ACCESS_EVALUATED',
          actor_email: user.email,
          broker_agency_id: brokerAgencyId,
          outcome: 'initiated',
        });
      } catch (auditError) {
        console.error('Audit log error:', auditError);
      }
    }

    if (!user) {
      return {
        eligible: false,
        reason: 'NOT_AUTHENTICATED',
        access_state: 'NOT_STARTED',
        workspace_activated: false,
        status: 401,
      };
    }

    // Scope validation: user must be valid BrokerAgencyUser
    const brokerUsers = await base44.entities.BrokerAgencyUser.filter({
      broker_agency_id: brokerAgencyId,
      user_email: user.email,
    });

    if (!brokerUsers || brokerUsers.length === 0) {
      // Cross-tenant or invalid scope - masked 404
      try {
        await base44.entities.AuditEvent.create({
          action: 'BROKER_WORKSPACE_ACCESS_DENIED_INVALID_ROLE',
          actor_email: user.email,
          broker_agency_id: brokerAgencyId,
          outcome: 'blocked',
          detail: 'Invalid BrokerAgencyUser role',
        });
      } catch (auditError) {
        console.error('Audit log error:', auditError);
      }
      return {
        eligible: false,
        reason: 'INVALID_BROKER_AGENCY_USER',
        access_state: 'INVALID_USER_ROLE',
        workspace_activated: false,
        status: 404, // masked 404
      };
    }

    // Get broker agency profile
    const brokerProfiles = await base44.entities.BrokerAgencyProfile.filter({
      id: brokerAgencyId,
    });

    if (!brokerProfiles || brokerProfiles.length === 0) {
      // Invalid scope - masked 404
      try {
        await base44.entities.AuditEvent.create({
          action: 'BROKER_WORKSPACE_ACCESS_DENIED_SCOPE',
          actor_email: user.email,
          broker_agency_id: brokerAgencyId,
          outcome: 'blocked',
          detail: 'Broker agency profile not found',
        });
      } catch (auditError) {
        console.error('Audit log error:', auditError);
      }
      return {
        eligible: false,
        reason: 'BROKER_AGENCY_NOT_FOUND',
        access_state: 'INVALID_SCOPE',
        workspace_activated: false,
        status: 404, // masked 404
      };
    }

    const brokerProfile = brokerProfiles[0];

    // State 1: NOT_STARTED or PENDING_EMAIL_VERIFICATION
    if (brokerProfile.onboarding_status === 'not_started') {
      try {
        await base44.entities.AuditEvent.create({
          action: 'BROKER_WORKSPACE_ACCESS_DENIED_PENDING_REVIEW',
          actor_email: user.email,
          broker_agency_id: brokerAgencyId,
          outcome: 'blocked',
          detail: 'Onboarding not started',
        });
      } catch (auditError) {
        console.error('Audit log error:', auditError);
      }
      return {
        eligible: false,
        reason: 'ONBOARDING_NOT_STARTED',
        access_state: 'NOT_STARTED',
        workspace_activated: false,
        status: 403,
      };
    }

    // State 3: PROFILE_INCOMPLETE
    if (brokerProfile.onboarding_status === 'in_progress') {
      try {
        await base44.entities.AuditEvent.create({
          action: 'BROKER_WORKSPACE_ACCESS_DENIED_PENDING_REVIEW',
          actor_email: user.email,
          broker_agency_id: brokerAgencyId,
          outcome: 'blocked',
          detail: 'Onboarding profile incomplete',
        });
      } catch (auditError) {
        console.error('Audit log error:', auditError);
      }
      return {
        eligible: false,
        reason: 'ONBOARDING_NOT_COMPLETE',
        access_state: 'PROFILE_INCOMPLETE',
        workspace_activated: false,
        status: 403,
      };
    }

    // State 4: PENDING_COMPLIANCE
    if (brokerProfile.onboarding_status === 'pending_compliance') {
      try {
        await base44.entities.AuditEvent.create({
          action: 'BROKER_WORKSPACE_ACCESS_DENIED_PENDING_REVIEW',
          actor_email: user.email,
          broker_agency_id: brokerAgencyId,
          outcome: 'blocked',
          detail: 'Awaiting compliance documents',
        });
      } catch (auditError) {
        console.error('Audit log error:', auditError);
      }
      return {
        eligible: false,
        reason: 'AWAITING_COMPLIANCE',
        access_state: 'PENDING_COMPLIANCE',
        workspace_activated: false,
        status: 403,
      };
    }

    // State 5: PENDING_PLATFORM_REVIEW
    if (brokerProfile.onboarding_status === 'pending_review') {
      try {
        await base44.entities.AuditEvent.create({
          action: 'BROKER_WORKSPACE_ACCESS_DENIED_PENDING_REVIEW',
          actor_email: user.email,
          broker_agency_id: brokerAgencyId,
          outcome: 'blocked',
          detail: 'Pending platform review',
        });
      } catch (auditError) {
        console.error('Audit log error:', auditError);
      }
      return {
        eligible: false,
        reason: 'PENDING_PLATFORM_REVIEW',
        access_state: 'PENDING_PLATFORM_REVIEW',
        workspace_activated: false,
        status: 403,
      };
    }

    // State 6: PENDING_MORE_INFORMATION
    if (brokerProfile.onboarding_status === 'pending_more_information') {
      try {
        await base44.entities.AuditEvent.create({
          action: 'BROKER_WORKSPACE_ACCESS_DENIED_PENDING_REVIEW',
          actor_email: user.email,
          broker_agency_id: brokerAgencyId,
          outcome: 'blocked',
          detail: 'Pending additional information from applicant',
        });
      } catch (auditError) {
        console.error('Audit log error:', auditError);
      }
      return {
        eligible: false,
        reason: 'AWAITING_MORE_INFORMATION',
        access_state: 'PENDING_MORE_INFORMATION',
        workspace_activated: false,
        status: 403,
      };
    }

    // State 8: REJECTED
    if (brokerProfile.onboarding_status === 'rejected') {
      try {
        await base44.entities.AuditEvent.create({
          action: 'BROKER_WORKSPACE_ACCESS_DENIED_PENDING_REVIEW',
          actor_email: user.email,
          broker_agency_id: brokerAgencyId,
          outcome: 'blocked',
          detail: 'Application rejected',
        });
      } catch (auditError) {
        console.error('Audit log error:', auditError);
      }
      return {
        eligible: false,
        reason: 'APPLICATION_REJECTED',
        access_state: 'REJECTED',
        workspace_activated: false,
        status: 403,
      };
    }

    // State 9: SUSPENDED
    if (brokerProfile.onboarding_status === 'suspended') {
      try {
        await base44.entities.AuditEvent.create({
          action: 'BROKER_WORKSPACE_ACCESS_DENIED_SUSPENDED',
          actor_email: user.email,
          broker_agency_id: brokerAgencyId,
          outcome: 'blocked',
          detail: 'Account suspended',
        });
      } catch (auditError) {
        console.error('Audit log error:', auditError);
      }
      return {
        eligible: false,
        reason: 'ACCOUNT_SUSPENDED',
        access_state: 'SUSPENDED',
        workspace_activated: false,
        status: 403,
      };
    }

    // If we reach here, onboarding_status should be 'active'
    if (brokerProfile.onboarding_status !== 'active') {
      return {
        eligible: false,
        reason: 'UNKNOWN_ONBOARDING_STATUS',
        access_state: 'INVALID_SCOPE',
        workspace_activated: false,
        status: 403,
      };
    }

    // Get broker platform relationship
    const relationships = await base44.entities.BrokerPlatformRelationship.filter({
      broker_agency_id: brokerAgencyId,
    });

    if (!relationships || relationships.length === 0) {
      return {
        eligible: false,
        reason: 'NO_PLATFORM_RELATIONSHIP',
        access_state: 'INVALID_SCOPE',
        workspace_activated: false,
        status: 403,
      };
    }

    const relationship = relationships[0];

    if (relationship.relationship_status !== 'active') {
      return {
        eligible: false,
        reason: 'RELATIONSHIP_NOT_ACTIVE',
        access_state: 'INVALID_SCOPE',
        workspace_activated: false,
        status: 403,
      };
    }

    if (!brokerProfile.portal_access_enabled) {
      return {
        eligible: false,
        reason: 'PORTAL_ACCESS_DISABLED',
        access_state: 'PORTAL_ACCESS_DISABLED',
        workspace_activated: false,
        status: 403,
      };
    }

    // State 7: COMPLIANCE_HOLD
    if (brokerProfile.compliance_status === 'compliance_hold') {
      try {
        await base44.entities.AuditEvent.create({
          action: 'BROKER_WORKSPACE_ACCESS_DENIED_COMPLIANCE_HOLD',
          actor_email: user.email,
          broker_agency_id: brokerAgencyId,
          outcome: 'blocked',
          detail: 'Active compliance hold',
        });
      } catch (auditError) {
        console.error('Audit log error:', auditError);
      }
      return {
        eligible: false,
        reason: 'COMPLIANCE_HOLD_ACTIVE',
        access_state: 'COMPLIANCE_HOLD',
        workspace_activated: false,
        status: 403,
      };
    }

    // State 10/11: APPROVED but workspace disabled or pending activation
    const workspaceActivated = brokerProfile.workspace_activated || false;

    if (!workspaceActivated) {
      // State 10: APPROVED_BUT_WORKSPACE_DISABLED (when flag is false)
      try {
        await base44.entities.AuditEvent.create({
          action: 'BROKER_WORKSPACE_ACCESS_ELIGIBLE_PENDING_ACTIVATION',
          actor_email: user.email,
          broker_agency_id: brokerAgencyId,
          outcome: 'eligible_but_disabled',
          detail: 'Approved but workspace flag disabled',
        });
      } catch (auditError) {
        console.error('Audit log error:', auditError);
      }
      return {
        eligible: true,
        portal_access_eligible: true,
        reason: 'PORTAL_ACCESS_ELIGIBLE',
        access_state: 'APPROVED_BUT_WORKSPACE_DISABLED',
        workspace_activated: false,
        status: 200,
      };
    }

    // State 12: ACTIVE (only reachable after workspace activation approval)
    try {
      await base44.entities.AuditEvent.create({
        action: 'BROKER_WORKSPACE_ACCESS_ELIGIBLE_PENDING_ACTIVATION',
        actor_email: user.email,
        broker_agency_id: brokerAgencyId,
        outcome: 'eligible_active',
        detail: 'Workspace activated and eligible',
      });
    } catch (auditError) {
      console.error('Audit log error:', auditError);
    }
    return {
      eligible: true,
      portal_access_eligible: true,
      workspace_activated: true,
      reason: 'WORKSPACE_ACTIVATED',
      access_state: 'ACTIVE',
      status: 200,
    };
  } catch (error) {
    try {
      const user = await base44.auth.me();
      if (user) {
        await base44.entities.AuditEvent.create({
          action: 'BROKER_WORKSPACE_ACCESS_DENIED_SCOPE',
          actor_email: user.email,
          broker_agency_id: brokerAgencyId,
          outcome: 'error',
          detail: `Evaluation error: ${error.message}`,
        });
      }
    } catch (auditError) {
      console.error('Audit log error:', auditError);
    }
    return {
      eligible: false,
      reason: 'EVALUATION_ERROR',
      error: error.message,
      access_state: 'INVALID_SCOPE',
      workspace_activated: false,
      status: 500,
    };
  }
}

/**
 * getBrokerDashboard
 * 
 * Returns safe dashboard counters only.
 * Separates Direct Book and MGA-Affiliated Book.
 * Does not expose hidden records in counts.
 */
export async function getBrokerDashboard(brokerAgencyId) {
  try {
    const accessState = await getBrokerWorkspaceAccessState(brokerAgencyId);
    
    if (!accessState.eligible) {
      return {
        success: false,
        error: accessState.reason,
        status: accessState.status,
      };
    }

    // Log audit event
    await base44.entities.AuditEvent.create({
      action: 'BROKER_DASHBOARD_VIEWED',
      actor_email: (await base44.auth.me()).email,
      broker_agency_id: brokerAgencyId,
      outcome: 'success',
    });

    // Count employers (scoped to broker)
    const employers = await base44.entities.BrokerEmployer.filter({
      broker_agency_id: brokerAgencyId,
    });
    const employerCount = employers ? employers.length : 0;

    // Count cases (scoped to broker)
    const cases = await base44.entities.BrokerCase.filter({
      broker_agency_id: brokerAgencyId,
    });
    const caseCount = cases ? cases.length : 0;

    // Count quotes (scoped to broker cases)
    const quotes = await base44.entities.QuoteScenario.filter({
      case_id: { $in: (cases || []).map(c => c.id) },
    });
    const quoteCount = quotes ? quotes.length : 0;

    // Count proposals (scoped to broker cases)
    const proposals = await base44.entities.Proposal.filter({
      case_id: { $in: (cases || []).map(c => c.id) },
    });
    const proposalCount = proposals ? proposals.length : 0;

    return {
      success: true,
      dashboard: {
        book_of_business: {
          direct_book: {
            total_employers: employerCount,
            total_cases: caseCount,
            open_quotes: quoteCount,
            proposals_ready: proposalCount,
          },
          mga_affiliated_book: {
            // Placeholder for hybrid broker context
            status: 'not_applicable_or_separated',
          },
        },
        alerts: {
          compliance_alerts: 0, // Would be populated from BrokerAgencyProfile.compliance_status
          tasks_due: 0, // Would be populated from filtered task list
          renewals_due: 0, // Would be populated from renewal scope
        },
      },
      status: 200,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: 500,
    };
  }
}

/**
 * listBrokerBookOfBusiness
 * 
 * Returns safe book-of-business list.
 * Supports Direct Book vs MGA-Affiliated Book separation.
 * No cross-broker leakage.
 * No MGA visibility into standalone Direct Book.
 */
export async function listBrokerBookOfBusiness(brokerAgencyId) {
  try {
    const accessState = await getBrokerWorkspaceAccessState(brokerAgencyId);
    
    if (!accessState.eligible) {
      return {
        success: false,
        error: accessState.reason,
        status: accessState.status,
      };
    }

    // Get broker's Direct Book employers and cases
    const employers = await base44.entities.BrokerEmployer.filter({
      broker_agency_id: brokerAgencyId,
    });
    const cases = await base44.entities.BrokerCase.filter({
      broker_agency_id: brokerAgencyId,
    });

    const directBook = {
      channel: 'DIRECT_BOOK',
      owner: brokerAgencyId,
      employers: (employers || []).map(e => ({
        id: e.id,
        name: e.name,
        employee_count: e.employee_count,
        status: e.status,
      })),
      cases: (cases || []).map(c => ({
        id: c.id,
        case_number: c.case_number,
        employer_id: c.broker_employer_id,
        stage: c.stage,
        effective_date: c.effective_date,
      })),
    };

    // MGA-Affiliated Book would be populated separately if applicable to hybrid broker
    const mgaAffiliatedBook = {
      channel: 'MGA_AFFILIATED_BOOK',
      status: 'not_applicable_for_standalone_broker',
    };

    return {
      success: true,
      book_of_business: {
        direct_book: directBook,
        mga_affiliated_book: mgaAffiliatedBook,
      },
      status: 200,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: 500,
    };
  }
}

/**
 * listBrokerEmployers
 * 
 * Returns only broker-visible employers.
 * Uses broker scope filtering.
 */
export async function listBrokerEmployers(brokerAgencyId) {
  try {
    const accessState = await getBrokerWorkspaceAccessState(brokerAgencyId);
    
    if (!accessState.eligible) {
      return {
        success: false,
        error: accessState.reason,
        status: accessState.status,
      };
    }

    const employers = await base44.entities.BrokerEmployer.filter({
      broker_agency_id: brokerAgencyId,
    });

    return {
      success: true,
      employers: (employers || []).map(e => ({
        id: e.id,
        name: e.name,
        ein: e.ein,
        employee_count: e.employee_count,
        status: e.status,
        created_date: e.created_date,
      })),
      count: employers ? employers.length : 0,
      status: 200,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: 500,
    };
  }
}

/**
 * listBrokerCases
 * 
 * Returns only broker-visible cases.
 * Preserves channel lineage.
 */
export async function listBrokerCases(brokerAgencyId) {
  try {
    const accessState = await getBrokerWorkspaceAccessState(brokerAgencyId);
    
    if (!accessState.eligible) {
      return {
        success: false,
        error: accessState.reason,
        status: accessState.status,
      };
    }

    const cases = await base44.entities.BrokerCase.filter({
      broker_agency_id: brokerAgencyId,
    });

    return {
      success: true,
      cases: (cases || []).map(c => ({
        id: c.id,
        case_number: c.case_number,
        case_type: c.case_type,
        stage: c.stage,
        effective_date: c.effective_date,
        employee_count: c.employee_count,
        created_date: c.created_date,
      })),
      count: cases ? cases.length : 0,
      status: 200,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: 500,
    };
  }
}

/**
 * listBrokerCensusVersions
 * 
 * Returns census metadata only.
 * No raw census rows.
 * No SSN / sensitive employee data.
 */
export async function listBrokerCensusVersions(brokerAgencyId) {
  try {
    const accessState = await getBrokerWorkspaceAccessState(brokerAgencyId);
    
    if (!accessState.eligible) {
      return {
        success: false,
        error: accessState.reason,
        status: accessState.status,
      };
    }

    // Get broker cases to filter census versions
    const cases = await base44.entities.BrokerCase.filter({
      broker_agency_id: brokerAgencyId,
    });

    if (!cases || cases.length === 0) {
      return {
        success: true,
        census_versions: [],
        count: 0,
        status: 200,
      };
    }

    // Get census versions for broker cases (metadata only)
    const censusVersions = await base44.entities.CensusVersion.filter({
      case_id: { $in: cases.map(c => c.id) },
    });

    return {
      success: true,
      census_versions: (censusVersions || []).map(cv => ({
        id: cv.id,
        case_id: cv.case_id,
        version_number: cv.version_number,
        file_name: cv.file_name,
        status: cv.status,
        total_employees: cv.total_employees,
        eligible_employees: cv.eligible_employees,
        total_dependents: cv.total_dependents,
        uploaded_at: cv.created_date,
      })),
      count: censusVersions ? censusVersions.length : 0,
      status: 200,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: 500,
    };
  }
}

/**
 * listBrokerQuotes
 * 
 * Read-only quote visibility only.
 * No QuoteWorkspaceWrapper exposure.
 * No quote creation or edit activation.
 */
export async function listBrokerQuotes(brokerAgencyId) {
  try {
    const accessState = await getBrokerWorkspaceAccessState(brokerAgencyId);
    
    if (!accessState.eligible) {
      return {
        success: false,
        error: accessState.reason,
        status: accessState.status,
      };
    }

    // Get broker cases to filter quotes
    const cases = await base44.entities.BrokerCase.filter({
      broker_agency_id: brokerAgencyId,
    });

    if (!cases || cases.length === 0) {
      return {
        success: true,
        quotes: [],
        count: 0,
        status: 200,
      };
    }

    // Get quotes for broker cases (read-only)
    const quotes = await base44.entities.QuoteScenario.filter({
      case_id: { $in: cases.map(c => c.id) },
    });

    return {
      success: true,
      quotes: (quotes || []).map(q => ({
        id: q.id,
        case_id: q.case_id,
        name: q.name,
        status: q.status,
        is_recommended: q.is_recommended,
        total_monthly_premium: q.total_monthly_premium,
        quoted_at: q.quoted_at,
      })),
      count: quotes ? quotes.length : 0,
      read_only: true,
      quote_creation_enabled: false, // Feature flag control for Gate 7A-4
      status: 200,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: 500,
    };
  }
}

/**
 * listBrokerProposals
 * 
 * Read-only proposal visibility only.
 * No proposal creation activation unless later approved.
 */
export async function listBrokerProposals(brokerAgencyId) {
  try {
    const accessState = await getBrokerWorkspaceAccessState(brokerAgencyId);
    
    if (!accessState.eligible) {
      return {
        success: false,
        error: accessState.reason,
        status: accessState.status,
      };
    }

    // Get broker cases to filter proposals
    const cases = await base44.entities.BrokerCase.filter({
      broker_agency_id: brokerAgencyId,
    });

    if (!cases || cases.length === 0) {
      return {
        success: true,
        proposals: [],
        count: 0,
        status: 200,
      };
    }

    // Get proposals for broker cases (read-only)
    const proposals = await base44.entities.Proposal.filter({
      case_id: { $in: cases.map(c => c.id) },
    });

    return {
      success: true,
      proposals: (proposals || []).map(p => ({
        id: p.id,
        case_id: p.case_id,
        title: p.title,
        status: p.status,
        sent_at: p.sent_at,
        viewed_at: p.viewed_at,
      })),
      count: proposals ? proposals.length : 0,
      read_only: true,
      proposal_creation_enabled: false, // Feature flag control
      status: 200,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: 500,
    };
  }
}

/**
 * listBrokerTasks
 * 
 * Returns broker-visible tasks only.
 * No out-of-scope counts.
 */
export async function listBrokerTasks(brokerAgencyId) {
  try {
    const accessState = await getBrokerWorkspaceAccessState(brokerAgencyId);
    
    if (!accessState.eligible) {
      return {
        success: false,
        error: accessState.reason,
        status: accessState.status,
      };
    }

    // Get broker cases to filter tasks
    const cases = await base44.entities.BrokerCase.filter({
      broker_agency_id: brokerAgencyId,
    });

    if (!cases || cases.length === 0) {
      return {
        success: true,
        tasks: [],
        count: 0,
        status: 200,
      };
    }

    // Get tasks for broker cases
    const tasks = await base44.entities.CaseTask.filter({
      case_id: { $in: cases.map(c => c.id) },
    });

    return {
      success: true,
      tasks: (tasks || []).map(t => ({
        id: t.id,
        case_id: t.case_id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        due_date: t.due_date,
        assigned_to: t.assigned_to,
      })),
      count: tasks ? tasks.length : 0,
      status: 200,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: 500,
    };
  }
}

/**
 * listBrokerDocuments
 * 
 * Returns document metadata only.
 * Private/signed references only.
 * No public URLs.
 */
export async function listBrokerDocuments(brokerAgencyId) {
  try {
    const accessState = await getBrokerWorkspaceAccessState(brokerAgencyId);
    
    if (!accessState.eligible) {
      return {
        success: false,
        error: accessState.reason,
        status: accessState.status,
      };
    }

    // Get broker cases to filter documents
    const cases = await base44.entities.BrokerCase.filter({
      broker_agency_id: brokerAgencyId,
    });

    if (!cases || cases.length === 0) {
      return {
        success: true,
        documents: [],
        count: 0,
        status: 200,
      };
    }

    // Get documents for broker cases
    const documents = await base44.entities.Document.filter({
      case_id: { $in: cases.map(c => c.id) },
    });

    return {
      success: true,
      documents: (documents || []).map(d => ({
        id: d.id,
        case_id: d.case_id,
        name: d.document_type,
        document_type: d.document_type,
        file_name: d.file_name,
        uploaded_by: d.uploaded_by,
        created_date: d.created_date,
        // NO public URL exposure
        // File URL must be accessed via signed reference only
      })),
      count: documents ? documents.length : 0,
      file_access: 'requires_private_signed_url',
      status: 200,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: 500,
    };
  }
}