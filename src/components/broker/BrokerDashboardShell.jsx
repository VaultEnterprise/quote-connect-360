/**
 * Broker Workspace Dashboard Shell — Phase 7A-2.6
 * 
 * Fail-closed dashboard wrapper.
 * Shows workspace-disabled or pending-activation state while BROKER_WORKSPACE_ENABLED=false.
 * Uses centralized useBrokerWorkspace hook for access evaluation.
 */

import React from 'react';
import { useBrokerWorkspace } from '@/lib/hooks/useBrokerWorkspace';

export default function BrokerDashboardShell({ brokerAgencyId }) {
  const {
    loadingAccess,
    workspaceEnabled,
    isAccessEligible,
    accessState,
  } = useBrokerWorkspace(brokerAgencyId);

  if (loadingAccess) {
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