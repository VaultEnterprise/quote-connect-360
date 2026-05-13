/**
 * Broker Workspace Service — Phase 7A-2.6
 * 
 * Centralized data loading service for broker workspace.
 * Encapsulates contract layer interaction.
 * No raw frontend entity reads.
 * Safe payload handling only.
 */

import {
  getBrokerWorkspaceAccessState,
  getBrokerDashboard,
  listBrokerBookOfBusiness,
  listBrokerEmployers,
  listBrokerCases,
  listBrokerCensusVersions,
  listBrokerQuotes,
  listBrokerProposals,
  listBrokerTasks,
  listBrokerDocuments,
} from '@/lib/contracts/brokerWorkspaceContract';

/**
 * Validate safe payload structure.
 * Prevents leakage of raw or unsafe data.
 */
function validateSafePayload(payload) {
  if (!payload) return false;
  
  // Check for forbidden fields that indicate unsafe data
  const forbiddenFields = [
    'ssn',
    'tax_id',
    'ein',
    'netsuite_id',
    'raw_census_data',
    'health_data',
    'payroll_data',
    'file_url', // Public URLs forbidden; use signed references only
  ];

  const checkForbidden = (obj) => {
    if (!obj || typeof obj !== 'object') return false;
    
    for (const field of forbiddenFields) {
      if (field in obj) return true;
    }

    for (const key in obj) {
      if (typeof obj[key] === 'object' && checkForbidden(obj[key])) {
        return true;
      }
    }

    return false;
  };

  return !checkForbidden(payload);
}

/**
 * Get broker workspace access state.
 * Returns safe access state only.
 */
export async function getBrokerWorkspaceAccessStateService(brokerAgencyId) {
  try {
    const result = await getBrokerWorkspaceAccessState(brokerAgencyId);
    
    if (!result.eligible && result.status === 404) {
      // Masked 404 for cross-tenant or scope failures
      return {
        success: false,
        eligible: false,
        status: 404,
        access_state: 'INVALID_SCOPE',
      };
    }

    return {
      success: true,
      ...result,
    };
  } catch (error) {
    console.error('Access state fetch error:', error);
    return {
      success: false,
      eligible: false,
      status: 500,
      error: error.message,
    };
  }
}

/**
 * Get broker dashboard safe payload.
 * Validates safe payload structure.
 */
export async function getBrokerDashboardService(brokerAgencyId) {
  try {
    const result = await getBrokerDashboard(brokerAgencyId);

    if (!result.success) {
      return {
        success: false,
        status: result.status,
        error: result.error,
      };
    }

    // Validate safe payload structure
    if (!validateSafePayload(result.dashboard)) {
      console.error('Unsafe data detected in dashboard payload');
      return {
        success: false,
        status: 500,
        error: 'INVALID_PAYLOAD_STRUCTURE',
      };
    }

    return {
      success: true,
      dashboard: result.dashboard,
    };
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    return {
      success: false,
      status: 500,
      error: error.message,
    };
  }
}

/**
 * Get broker book of business with channel separation.
 * Returns Direct Book and MGA-Affiliated Book separately.
 */
export async function getBrokerBookOfBusinessService(brokerAgencyId, mgaId = null) {
  try {
    const result = await listBrokerBookOfBusiness(brokerAgencyId, mgaId);

    if (!result.success) {
      return {
        success: false,
        status: result.status,
        error: result.error,
      };
    }

    // Validate safe payloads
    if (!validateSafePayload(result.book_of_business)) {
      console.error('Unsafe data detected in book of business payload');
      return {
        success: false,
        status: 500,
        error: 'INVALID_PAYLOAD_STRUCTURE',
      };
    }

    return {
      success: true,
      book_of_business: result.book_of_business,
    };
  } catch (error) {
    console.error('Book of business fetch error:', error);
    return {
      success: false,
      status: 500,
      error: error.message,
    };
  }
}

/**
 * Get broker employers with channel labels.
 */
export async function getBrokerEmployersService(brokerAgencyId, mgaId = null) {
  try {
    const result = await listBrokerEmployers(brokerAgencyId, mgaId);

    if (!result.success) {
      return {
        success: false,
        status: result.status,
        error: result.error,
      };
    }

    if (!validateSafePayload(result.employers)) {
      console.error('Unsafe data detected in employers payload');
      return {
        success: false,
        status: 500,
        error: 'INVALID_PAYLOAD_STRUCTURE',
      };
    }

    return {
      success: true,
      employers: result.employers,
    };
  } catch (error) {
    console.error('Employers fetch error:', error);
    return {
      success: false,
      status: 500,
      error: error.message,
    };
  }
}

/**
 * Get broker cases with channel labels.
 */
export async function getBrokerCasesService(brokerAgencyId, mgaId = null) {
  try {
    const result = await listBrokerCases(brokerAgencyId, mgaId);

    if (!result.success) {
      return {
        success: false,
        status: result.status,
        error: result.error,
      };
    }

    if (!validateSafePayload(result.cases)) {
      console.error('Unsafe data detected in cases payload');
      return {
        success: false,
        status: 500,
        error: 'INVALID_PAYLOAD_STRUCTURE',
      };
    }

    return {
      success: true,
      cases: result.cases,
    };
  } catch (error) {
    console.error('Cases fetch error:', error);
    return {
      success: false,
      status: 500,
      error: error.message,
    };
  }
}

/**
 * Get broker census versions (metadata only, no raw rows).
 */
export async function getBrokerCensusVersionsService(brokerAgencyId) {
  try {
    const result = await listBrokerCensusVersions(brokerAgencyId);

    if (!result.success) {
      return {
        success: false,
        status: result.status,
        error: result.error,
      };
    }

    // Extra validation for census data: never expose raw rows or SSN
    if (result.census_versions) {
      for (const cv of result.census_versions) {
        if (cv.ssn || cv.raw_data || cv.employee_records) {
          console.error('Raw census data detected in payload');
          return {
            success: false,
            status: 500,
            error: 'INVALID_PAYLOAD_STRUCTURE',
          };
        }
      }
    }

    return {
      success: true,
      census_versions: result.census_versions,
    };
  } catch (error) {
    console.error('Census versions fetch error:', error);
    return {
      success: false,
      status: 500,
      error: error.message,
    };
  }
}

/**
 * Get broker quotes (read-only, no QuoteWorkspaceWrapper).
 */
export async function getBrokerQuotesService(brokerAgencyId, mgaId = null) {
  try {
    const result = await listBrokerQuotes(brokerAgencyId, mgaId);

    if (!result.success) {
      return {
        success: false,
        status: result.status,
        error: result.error,
      };
    }

    if (!validateSafePayload(result.quotes)) {
      console.error('Unsafe data detected in quotes payload');
      return {
        success: false,
        status: 500,
        error: 'INVALID_PAYLOAD_STRUCTURE',
      };
    }

    // Ensure read-only flag
    return {
      success: true,
      quotes: result.quotes,
      read_only: result.read_only || true,
      quote_creation_enabled: result.quote_creation_enabled || false,
    };
  } catch (error) {
    console.error('Quotes fetch error:', error);
    return {
      success: false,
      status: 500,
      error: error.message,
    };
  }
}

/**
 * Get broker proposals (read-only).
 */
export async function getBrokerProposalsService(brokerAgencyId, mgaId = null) {
  try {
    const result = await listBrokerProposals(brokerAgencyId, mgaId);

    if (!result.success) {
      return {
        success: false,
        status: result.status,
        error: result.error,
      };
    }

    if (!validateSafePayload(result.proposals)) {
      console.error('Unsafe data detected in proposals payload');
      return {
        success: false,
        status: 500,
        error: 'INVALID_PAYLOAD_STRUCTURE',
      };
    }

    // Ensure read-only flag
    return {
      success: true,
      proposals: result.proposals,
      read_only: result.read_only || true,
      proposal_creation_enabled: result.proposal_creation_enabled || false,
    };
  } catch (error) {
    console.error('Proposals fetch error:', error);
    return {
      success: false,
      status: 500,
      error: error.message,
    };
  }
}

/**
 * Get broker tasks (safe metadata only).
 */
export async function getBrokerTasksService(brokerAgencyId) {
  try {
    const result = await listBrokerTasks(brokerAgencyId);

    if (!result.success) {
      return {
        success: false,
        status: result.status,
        error: result.error,
      };
    }

    if (!validateSafePayload(result.tasks)) {
      console.error('Unsafe data detected in tasks payload');
      return {
        success: false,
        status: 500,
        error: 'INVALID_PAYLOAD_STRUCTURE',
      };
    }

    return {
      success: true,
      tasks: result.tasks,
    };
  } catch (error) {
    console.error('Tasks fetch error:', error);
    return {
      success: false,
      status: 500,
      error: error.message,
    };
  }
}

/**
 * Get broker documents (metadata only, no public URLs).
 */
export async function getBrokerDocumentsService(brokerAgencyId) {
  try {
    const result = await listBrokerDocuments(brokerAgencyId);

    if (!result.success) {
      return {
        success: false,
        status: result.status,
        error: result.error,
      };
    }

    // Validate no public URLs in payload
    if (result.documents) {
      for (const doc of result.documents) {
        if (doc.file_url && !doc.file_url.includes('signed')) {
          console.error('Public document URL detected in payload');
          return {
            success: false,
            status: 500,
            error: 'INVALID_PAYLOAD_STRUCTURE',
          };
        }
      }
    }

    return {
      success: true,
      documents: result.documents,
      file_access: 'requires_private_signed_url',
    };
  } catch (error) {
    console.error('Documents fetch error:', error);
    return {
      success: false,
      status: 500,
      error: error.message,
    };
  }
}