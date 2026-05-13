/**
 * Broker Workspace Route Shell — Phase 7A-2.5
 * 
 * Fail-closed route shell. Hidden while BROKER_WORKSPACE_ENABLED=false.
 * Enforces Gate 7A-1 portal access prerequisites.
 * Returns appropriate status codes based on access state.
 * Integrates BrokerDashboard component.
 * 
 * Backend: brokerWorkspaceAccessContract.getBrokerWorkspaceAccessState()
 * Feature Flag: BROKER_WORKSPACE_ENABLED (false)
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { getBrokerWorkspaceAccessState } from '@/lib/contracts/brokerWorkspaceContract';
import BrokerDashboard from '@/components/broker/BrokerDashboard';

export default function BrokerWorkspaceShell() {
  const [searchParams] = useSearchParams();
  const brokerAgencyId = searchParams.get('broker_agency_id');

  const [loading, setLoading] = useState(true);
  const [accessState, setAccessState] = useState(null);
  const [workspaceEnabled, setWorkspaceEnabled] = useState(false);

  useEffect(() => {
    const evaluateAccess = async () => {
      try {
        // Feature flag check: fail-closed
        const flagEnabled = false; // Hardcoded: BROKER_WORKSPACE_ENABLED = false
        setWorkspaceEnabled(flagEnabled);

        if (!flagEnabled) {
          setAccessState({
            eligible: false,
            reason: 'WORKSPACE_FEATURE_DISABLED',
            access_state: 'WORKSPACE_DISABLED',
            status: 403,
          });
          setLoading(false);
          return;
        }

        // Get broker agency from auth context if not provided
        const user = await base44.auth.me();
        if (!user) {
          setAccessState({
            eligible: false,
            reason: 'NOT_AUTHENTICATED',
            access_state: 'NOT_AUTHENTICATED',
            status: 401,
          });
          setLoading(false);
          return;
        }

        // If broker_agency_id provided via query param, use it; otherwise get from user context
        if (brokerAgencyId) {
          const state = await getBrokerWorkspaceAccessState(brokerAgencyId);
          setAccessState(state);
        } else {
          // Would need to get broker agency from user profile or context
          setAccessState({
            eligible: false,
            reason: 'BROKER_AGENCY_ID_MISSING',
            access_state: 'INVALID_SCOPE',
            status: 404,
          });
        }
      } catch (error) {
        setAccessState({
          eligible: false,
          reason: 'EVALUATION_ERROR',
          error: error.message,
          access_state: 'INVALID_SCOPE',
          status: 500,
        });
      } finally {
        setLoading(false);
      }
    };

    evaluateAccess();
  }, [brokerAgencyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Feature flag disabled
  if (!workspaceEnabled) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold text-foreground">Service Unavailable</h1>
          <p className="text-muted-foreground">
            The broker workspace is not currently available. Please check back later.
          </p>
          <p className="text-xs text-muted-foreground">
            Status: Feature gate inactive
          </p>
        </div>
      </div>
    );
  }

  // Access state evaluation failed or blocked
  if (!accessState || !accessState.eligible) {
    const state = accessState?.access_state || 'INVALID_STATE';
    const statusCode = accessState?.status || 403;

    // Masked 404 for cross-tenant or scope failures
    if (statusCode === 404) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center space-y-4 max-w-md">
            <h1 className="text-2xl font-bold text-foreground">404 Not Found</h1>
            <p className="text-muted-foreground">
              The requested resource could not be found.
            </p>
          </div>
        </div>
      );
    }

    // Access denied or pending states
    const accessStateMessages = {
      NOT_STARTED: 'Onboarding not started. Please complete the application process.',
      PROFILE_INCOMPLETE: 'Your profile is incomplete. Please finish the onboarding steps.',
      PENDING_COMPLIANCE: 'Awaiting compliance documents. Please submit required documents.',
      PENDING_PLATFORM_REVIEW: 'Your application is under review. This may take several business days.',
      PENDING_MORE_INFORMATION: 'Please provide the additional information requested.',
      COMPLIANCE_HOLD: 'A compliance issue is blocking access. Please contact support.',
      REJECTED: 'Your application was not approved. Please contact support.',
      SUSPENDED: 'Your account is suspended. Please contact support.',
      APPROVED_BUT_WORKSPACE_DISABLED: 'Your account is approved but the workspace is not yet active.',
      INVALID_USER_ROLE: 'You do not have a valid role for this workspace.',
      INVALID_SCOPE: 'Access validation failed. Please contact support.',
      WORKSPACE_DISABLED: 'The workspace is currently disabled.',
    };

    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground">
            {accessStateMessages[state] || 'You do not have access to the broker workspace.'}
          </p>
          <p className="text-xs text-muted-foreground">
            Status: {state}
          </p>
        </div>
      </div>
    );
  }

  // Portal access eligible but workspace not activated (feature flag control)
  if (accessState.eligible && !accessState.workspace_activated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold text-foreground">Workspace Pending Activation</h1>
          <p className="text-muted-foreground">
            Your account is approved, but the workspace is not yet activated. Please check back later.
          </p>
          <p className="text-xs text-muted-foreground">
            Status: Approved, awaiting workspace activation
          </p>
        </div>
      </div>
    );
  }

  // Workspace activated and eligible
  return <BrokerDashboard />;
}