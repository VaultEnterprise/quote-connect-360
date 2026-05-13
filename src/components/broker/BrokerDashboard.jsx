/**
 * Broker Workspace Dashboard — Phase 7A-2.5
 * 
 * Main dashboard component.
 * Integrates dashboard cards and contract payloads.
 * Workspace-disabled while BROKER_WORKSPACE_ENABLED=false.
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { getBrokerDashboard } from '@/lib/contracts/brokerWorkspaceContract';
import BrokerDashboardShell from './BrokerDashboardShell';
import BrokerBookOfBusinessCard from './BrokerBookOfBusinessCard';
import BrokerCasesQuotesCard from './BrokerCasesQuotesCard';
import BrokerProposalsAlertCard from './BrokerProposalsAlertCard';
import BrokerTasksRenewalsCard from './BrokerTasksRenewalsCard';
import BrokerBenefitsAdminCard from './BrokerBenefitsAdminCard';

export default function BrokerDashboard() {
  const [searchParams] = useSearchParams();
  const brokerAgencyId = searchParams.get('broker_agency_id');

  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [workspaceEnabled, setWorkspaceEnabled] = useState(false);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // Feature flag check: fail-closed
        const flagEnabled = false; // Hardcoded: BROKER_WORKSPACE_ENABLED = false
        setWorkspaceEnabled(flagEnabled);

        if (!flagEnabled || !brokerAgencyId) {
          setLoading(false);
          return;
        }

        // Would load dashboard data from contract if enabled
        const data = await getBrokerDashboard(brokerAgencyId);
        if (data.success) {
          setDashboard(data.dashboard);
        }
      } catch (error) {
        console.error('Dashboard load error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [brokerAgencyId]);

  // Show shell wrapper when workspace is disabled
  if (!workspaceEnabled) {
    return <BrokerDashboardShell brokerAgencyId={brokerAgencyId} />;
  }

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