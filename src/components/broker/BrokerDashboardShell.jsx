/**
 * Broker Workspace Dashboard Shell — Phase 7A-2.5
 * 
 * Fail-closed dashboard wrapper.
 * Shows workspace-disabled or pending-activation state while BROKER_WORKSPACE_ENABLED=false.
 * Integrates with getBrokerWorkspaceAccessState for access control.
 */

import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { getBrokerWorkspaceAccessState } from '@/lib/contracts/brokerWorkspaceContract';

export default function BrokerDashboardShell({ brokerAgencyId }) {
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
          // Get access state to show appropriate message
          const state = await getBrokerWorkspaceAccessState(brokerAgencyId);
          setAccessState(state);
          setLoading(false);
          return;
        }

        // If flag were enabled, would evaluate full access here
        const state = await getBrokerWorkspaceAccessState(brokerAgencyId);
        setAccessState(state);
      } catch (error) {
        console.error('Dashboard access evaluation error:', error);
        setAccessState({
          eligible: false,
          reason: 'EVALUATION_ERROR',
          access_state: 'INVALID_SCOPE',
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
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Workspace feature flag disabled
  if (!workspaceEnabled) {
    if (accessState?.eligible && accessState?.access_state === 'APPROVED_BUT_WORKSPACE_DISABLED') {
      return (
        <div className="min-h-screen bg-background p-6">
          <div className="max-w-6xl mx-auto">
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <h1 className="text-3xl font-bold text-foreground mb-4">Workspace Pending Activation</h1>
              <p className="text-muted-foreground mb-2">
                Your account is approved and ready to use the broker workspace.
              </p>
              <p className="text-sm text-muted-foreground">
                The workspace feature is currently under preparation and will be available soon.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <h1 className="text-3xl font-bold text-foreground mb-4">Workspace Unavailable</h1>
            <p className="text-muted-foreground">
              The broker workspace feature is not currently available. Please check back later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Access not eligible
  if (!accessState?.eligible) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-card border border-destructive/20 rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
            <p className="text-muted-foreground">
              You do not have access to the broker workspace at this time.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Workspace would render here if enabled
  return null;
}