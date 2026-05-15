/**
 * useBrokerWorkspace Hook — Phase 7A-2.6
 * 
 * Centralized state management for broker workspace.
 * Manages:
 * - Access state evaluation
 * - Dashboard data fetching
 * - Loading/error/empty states
 * - Safe payload handling
 * - Direct Book vs MGA-Affiliated Book sections
 * 
 * No raw frontend entity reads.
 * All data from brokerWorkspaceContract only.
 */

import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import {
  getBrokerWorkspaceAccessState,
  getBrokerDashboard,
} from '@/lib/contracts/brokerWorkspaceContract';

export function useBrokerWorkspace(brokerAgencyId) {
  // Access state
  const [accessState, setAccessState] = useState(null);
  
  // Dashboard data
  const [dashboard, setDashboard] = useState(null);
  
  // Loading states
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  
  // Error states
  const [accessError, setAccessError] = useState(null);
  const [dashboardError, setDashboardError] = useState(null);
  
  // Feature flag state
  const [workspaceEnabled, setWorkspaceEnabled] = useState(false);
  
  // Derived state
  const isAccessEligible = accessState?.eligible || false;
  const isWorkspaceActivated = accessState?.workspace_activated || false;
  const isPendingActivation = isAccessEligible && !isWorkspaceActivated && workspaceEnabled;
  const isApprovedButDisabled = isAccessEligible && !workspaceEnabled;

  /**
   * Evaluate broker workspace access state.
   * Gate 7A-1 portal access prerequisites enforced.
   */
  const evaluateAccess = useCallback(async () => {
    if (!brokerAgencyId) {
      setLoadingAccess(false);
      return;
    }

    try {
      setLoadingAccess(true);
      setAccessError(null);

      // Feature flag check: fail-closed
      const flagEnabled = false; // Hardcoded: BROKER_WORKSPACE_ENABLED = false
      setWorkspaceEnabled(flagEnabled);

      // Evaluate access state
      const state = await getBrokerWorkspaceAccessState(brokerAgencyId);
      setAccessState(state);

      if (!state.eligible) {
        setAccessError({
          reason: state.reason,
          access_state: state.access_state,
          status: state.status,
        });
      }
    } catch (error) {
      console.error('Access evaluation error:', error);
      setAccessError({
        reason: 'EVALUATION_ERROR',
        message: error.message,
      });
      setAccessState({
        eligible: false,
        access_state: 'INVALID_SCOPE',
      });
    } finally {
      setLoadingAccess(false);
    }
  }, [brokerAgencyId]);

  /**
   * Fetch dashboard data from safe contract payload.
   * Only called if workspace enabled and access eligible.
   */
  const fetchDashboard = useCallback(async () => {
    if (!brokerAgencyId || !isAccessEligible || !workspaceEnabled) {
      return;
    }

    try {
      setLoadingDashboard(true);
      setDashboardError(null);

      const result = await getBrokerDashboard(brokerAgencyId);

      if (!result.success) {
        setDashboardError({
          reason: result.error,
          status: result.status,
        });
        return;
      }

      // Validate safe payload structure
      if (result.dashboard && result.dashboard.book_of_business) {
        setDashboard(result.dashboard);
      } else {
        setDashboardError({
          reason: 'INVALID_PAYLOAD',
          message: 'Dashboard payload structure invalid',
        });
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      setDashboardError({
        reason: 'FETCH_ERROR',
        message: error.message,
      });
    } finally {
      setLoadingDashboard(false);
    }
  }, [brokerAgencyId, isAccessEligible, workspaceEnabled]);

  /**
   * Initial access evaluation on mount or brokerAgencyId change.
   */
  useEffect(() => {
    evaluateAccess();
  }, [brokerAgencyId, evaluateAccess]);

  /**
   * Fetch dashboard data when workspace is enabled and access is eligible.
   */
  useEffect(() => {
    if (workspaceEnabled && isAccessEligible && !accessError) {
      fetchDashboard();
    }
  }, [workspaceEnabled, isAccessEligible, accessError, fetchDashboard]);

  /**
   * Get safe book of business sections.
   */
  const getBookOfBusiness = useCallback(() => {
    if (!dashboard?.book_of_business) {
      return null;
    }

    return {
      direct_book: dashboard.book_of_business.direct_book || null,
      mga_affiliated_book: dashboard.book_of_business.mga_affiliated_book || null,
    };
  }, [dashboard]);

  /**
   * Get safe alerts.
   */
  const getAlerts = useCallback(() => {
    if (!dashboard?.alerts) {
      return null;
    }

    return {
      compliance_alerts: dashboard.alerts.compliance_alerts || 0,
      tasks_due: dashboard.alerts.tasks_due || 0,
      renewals_due: dashboard.alerts.renewals_due || 0,
    };
  }, [dashboard]);

  return {
    // Access state
    accessState,
    isAccessEligible,
    isWorkspaceActivated,
    isPendingActivation,
    isApprovedButDisabled,
    
    // Dashboard data
    dashboard,
    
    // Loading states
    loadingAccess,
    loadingDashboard,
    isLoading: loadingAccess || loadingDashboard,
    
    // Error states
    accessError,
    dashboardError,
    hasError: !!(accessError || dashboardError),
    
    // Feature flag
    workspaceEnabled,
    
    // Data accessors
    getBookOfBusiness,
    getAlerts,
    
    // Actions
    evaluateAccess,
    fetchDashboard,
    
    // Utility methods
    reload: () => {
      evaluateAccess();
    },
  };
}