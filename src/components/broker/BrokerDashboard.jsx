/**
 * Broker Workspace Dashboard — Phase 7A-2.6
 * 
 * Main dashboard component.
 * Integrates dashboard cards and contract payloads.
 * Uses centralized useBrokerWorkspace hook for state management.
 * Workspace-disabled while BROKER_WORKSPACE_ENABLED=false.
 */

import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBrokerWorkspace } from '@/lib/hooks/useBrokerWorkspace';
import BrokerDashboardShell from './BrokerDashboardShell';
import BrokerBookOfBusinessCard from './BrokerBookOfBusinessCard';
import BrokerCasesQuotesCard from './BrokerCasesQuotesCard';
import BrokerProposalsAlertCard from './BrokerProposalsAlertCard';
import BrokerTasksRenewalsCard from './BrokerTasksRenewalsCard';
import BrokerBenefitsAdminCard from './BrokerBenefitsAdminCard';

export default function BrokerDashboard() {
  const [searchParams] = useSearchParams();
  const brokerAgencyId = searchParams.get('broker_agency_id');

  const {
    isLoading,
    workspaceEnabled,
    dashboard,
  } = useBrokerWorkspace(brokerAgencyId);

  // Show shell wrapper when workspace is disabled
  if (!workspaceEnabled) {
    return <BrokerDashboardShell brokerAgencyId={brokerAgencyId} />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Dashboard Data Unavailable</h1>
            <p className="text-muted-foreground">
              Unable to load dashboard data. Please refresh and try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Broker Workspace</h1>
          <p className="text-muted-foreground mt-1">Manage your book of business and cases</p>
        </div>

        {/* Book of Business Card */}
        <BrokerBookOfBusinessCard dashboard={dashboard} />

        {/* Cases and Quotes */}
        <BrokerCasesQuotesCard dashboard={dashboard} />

        {/* Proposals and Alerts */}
        <BrokerProposalsAlertCard dashboard={dashboard} />

        {/* Tasks and Renewals */}
        <BrokerTasksRenewalsCard dashboard={dashboard} />

        {/* Benefits Admin Placeholder */}
        <BrokerBenefitsAdminCard />
      </div>
    </div>
  );
}