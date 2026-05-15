/**
 * Proposals and Alerts Card — Phase 7A-2.5
 * 
 * Displays proposals ready and compliance alerts by channel.
 * Read-only metadata only.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

export default function BrokerProposalsAlertCard({ dashboard }) {
  if (!dashboard?.book_of_business) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="w-4 h-4" />
              Proposals Ready
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="w-4 h-4" />
              Compliance Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { direct_book, mga_affiliated_book } = dashboard.book_of_business;
  const { alerts } = dashboard;

  const directProposals = direct_book?.proposals_ready || 0;
  const mgaProposals = mga_affiliated_book?.proposals_ready || 0;
  const complianceAlerts = alerts?.compliance_alerts || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Proposals Ready */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle2 className="w-4 h-4" />
            Proposals Ready
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Direct Book</span>
              <span className="text-2xl font-bold text-foreground">{directProposals}</span>
            </div>
            {mga_affiliated_book?.accessible && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">MGA-Affiliated</span>
                <span className="text-2xl font-bold text-foreground">{mgaProposals}</span>
              </div>
            )}
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="text-sm font-semibold text-foreground">Total</span>
              <span className="text-2xl font-bold text-primary">{directProposals + mgaProposals}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">Read-only view</p>
        </CardContent>
      </Card>

      {/* Compliance Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="w-4 h-4" />
            Compliance Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Active Alerts</span>
              <span className={`text-2xl font-bold ${complianceAlerts > 0 ? 'text-destructive' : 'text-foreground'}`}>
                {complianceAlerts}
              </span>
            </div>
          </div>
          {complianceAlerts === 0 && (
            <p className="text-xs text-muted-foreground mt-4">No active compliance alerts</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}