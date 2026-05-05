/**
 * MGA Phase 5 — Section 1: MGA Header
 * Displays MGA identity and compliance context.
 * Safety: tax_id_ein and banking_setup_status NOT shown (no financial permission in Phase 5).
 */
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Building2, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

const STATUS_STYLES = {
  active: 'bg-green-100 text-green-800',
  pending_onboarding: 'bg-yellow-100 text-yellow-800',
  inactive: 'bg-gray-100 text-gray-600',
  suspended: 'bg-red-100 text-red-800',
};

const COMPLIANCE_ALERT_STATUSES = ['issues_found', 'suspended'];
const AGREEMENT_ALERT_STATUSES = ['not_started', 'expired', 'terminated'];

export default function MGAHeader({ mgaRecord }) {
  if (!mgaRecord) return null;

  const showComplianceAlert = COMPLIANCE_ALERT_STATUSES.includes(mgaRecord.compliance_status);
  const showAgreementAlert = AGREEMENT_ALERT_STATUSES.includes(mgaRecord.agreement_status);

  return (
    <div className="bg-card border rounded-xl p-6 space-y-4">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-primary/10">
          <Building2 className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-semibold text-foreground">
              {mgaRecord.legal_entity_name || mgaRecord.name}
            </h1>
            {mgaRecord.dba_name && (
              <span className="text-sm text-muted-foreground">DBA: {mgaRecord.dba_name}</span>
            )}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[mgaRecord.status] || 'bg-gray-100 text-gray-600'}`}>
              {mgaRecord.status?.replace(/_/g, ' ')}
            </span>
            {mgaRecord.code && (
              <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">{mgaRecord.code}</span>
            )}
          </div>

          <div className="flex items-center gap-6 mt-2 text-sm text-muted-foreground flex-wrap">
            {mgaRecord.primary_contact_name && (
              <span>Contact: <span className="text-foreground">{mgaRecord.primary_contact_name}</span></span>
            )}
            {mgaRecord.primary_contact_email && (
              <span>{mgaRecord.primary_contact_email}</span>
            )}
            {mgaRecord.activation_date && mgaRecord.status === 'active' && (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                Active since {new Date(mgaRecord.activation_date).toLocaleDateString()}
              </span>
            )}
            {mgaRecord.onboarding_status && mgaRecord.status !== 'active' && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Onboarding: {mgaRecord.onboarding_status?.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        </div>
      </div>

      {(showComplianceAlert || showAgreementAlert) && (
        <div className="flex flex-col gap-2">
          {showComplianceAlert && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-yellow-200 bg-yellow-50 text-yellow-800 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              Compliance status: <strong className="capitalize">{mgaRecord.compliance_status?.replace(/_/g, ' ')}</strong> — review required.
            </div>
          )}
          {showAgreementAlert && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-orange-200 bg-orange-50 text-orange-800 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              Agreement status: <strong className="capitalize">{mgaRecord.agreement_status?.replace(/_/g, ' ')}</strong> — signature required.
            </div>
          )}
        </div>
      )}
    </div>
  );
}