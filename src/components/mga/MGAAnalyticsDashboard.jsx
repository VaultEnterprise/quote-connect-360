/**
 * MGA Gate 6K — Analytics Dashboard
 * components/mga/MGAAnalyticsDashboard.jsx
 *
 * Main analytics dashboard layout
 * Only renders if MGA_ANALYTICS_DASHBOARD_ENABLED = true
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import MGAAnalyticsMetricCard from './MGAAnalyticsMetricCard';
import MGAAnalyticsTrendPanel from './MGAAnalyticsTrendPanel';
import MGAAnalyticsFilterBar from './MGAAnalyticsFilterBar';
import MGAAnalyticsErrorBoundary from './MGAAnalyticsErrorBoundary';

export default function MGAAnalyticsDashboard({ featureFlag, userRole, mgaId }) {
  const [filters, setFilters] = useState({ days: 30 });
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        // Placeholder: In production, this would call backend analytics service
        // const response = await base44.functions.invoke('getMGAAnalytics', { days: filters.days, mga_id: mgaId });
        
        setAnalyticsData({
          commandSummary: { total_users: 0, active_users: 0 },
          caseAnalytics: { case_count: 0 },
          quoteAnalytics: { scenarios_created: 0 },
        });
        setError(null);
      } catch (err) {
        setError('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [filters, mgaId]);

  // Feature flag gate: render nothing if disabled
  if (!featureFlag) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  // Role-based widget visibility
  const canViewSummary = ['mga_admin', 'platform_super_admin'].includes(userRole);
  const canViewOperational = ['mga_admin', 'mga_manager', 'platform_super_admin'].includes(userRole);
  const canViewExports = ['mga_admin', 'mga_manager', 'mga_user', 'mga_read_only', 'platform_super_admin'].includes(userRole);
  const canViewBrokerAgency = ['mga_admin', 'mga_manager', 'platform_super_admin'].includes(userRole);
  const canViewAudit = ['mga_admin', 'mga_manager', 'platform_super_admin'].includes(userRole);

  return (
    <MGAAnalyticsErrorBoundary>
      <div className="space-y-6">
        <MGAAnalyticsFilterBar filters={filters} onFilterChange={setFilters} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {canViewSummary && (
            <MGAAnalyticsMetricCard
              title="MGA Users"
              value="0"
              label="Total users"
              trend="up"
            />
          )}
          
          {canViewOperational && (
            <>
              <MGAAnalyticsMetricCard
                title="Active Cases"
                value="0"
                label="In progress"
                trend="stable"
              />
              <MGAAnalyticsMetricCard
                title="Quote Scenarios"
                value="0"
                label="Created (30d)"
                trend="up"
              />
            </>
          )}

          {canViewExports && (
            <MGAAnalyticsMetricCard
              title="Exports"
              value="0"
              label="Last 30 days"
              trend="stable"
            />
          )}

          {canViewBrokerAgency && (
            <MGAAnalyticsMetricCard
              title="Agencies"
              value="0"
              label="Active"
              trend="stable"
            />
          )}

          {canViewAudit && (
            <MGAAnalyticsMetricCard
              title="Audit Events"
              value="0"
              label="Last 30 days"
              trend="stable"
            />
          )}
        </div>

        {canViewOperational && (
          <Card>
            <CardHeader>
              <CardTitle>Trends (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <MGAAnalyticsTrendPanel />
            </CardContent>
          </Card>
        )}
      </div>
    </MGAAnalyticsErrorBoundary>
  );
}