/**
 * MGA Phase 5 — Section 2: KPI / Summary Widgets
 * All data loaded through Phase 3 scoped services. No direct entity reads.
 * Fail-closed: if any service returns denied, widget shows "Access restricted".
 */
import React, { useState, useEffect } from 'react';
import { listCases } from '@/lib/mga/services/caseService';
import { listMasterGroups } from '@/lib/mga/services/masterGroupService';
import { listCensusVersions } from '@/lib/mga/services/censusService';
import { listQuotes } from '@/lib/mga/services/quoteService';
import { listAuditEventsByScope } from '@/lib/mga/services/auditService';
import { Briefcase, Building2, FileText, Users, AlertCircle, Activity } from 'lucide-react';

function KPICard({ label, value, icon: IconComponent, onClick, loading, denied }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-2 p-4 bg-card border rounded-xl hover:border-primary/40 transition-all text-left w-full"
    >
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <IconComponent className="w-4 h-4" />
        <span>{label}</span>
      </div>
      {loading ? (
        <div className="h-7 w-12 bg-muted rounded animate-pulse" />
      ) : denied ? (
        <span className="text-xs text-muted-foreground">Access restricted</span>
      ) : (
        <span className="text-2xl font-bold text-foreground">{value ?? '—'}</span>
      )}
    </button>
  );
}

export default function MGAKPIBar({ mgaId, scopeRequest }) {
  const [kpis, setKpis] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mgaId) return;
    loadKPIs();
  }, [mgaId]);

  async function loadKPIs() {
    setLoading(true);
    const base = { ...scopeRequest, target_entity_id: mgaId };

    const [masterGroups, cases, censusVersions, quotes, auditLogs] = await Promise.allSettled([
      listMasterGroups({ ...base }),
      listCases({ ...base }),
      listCensusVersions({ ...base }),
      listQuotes({ ...base }),
      listAuditEventsByScope({ ...base, target_entity_id: 'list_operation', limit: 200 }),
    ]);

    const extract = (result) => result.status === 'fulfilled' && result.value?.success !== false
      ? result.value?.data || []
      : null;

    const mgs = extract(masterGroups);
    const cs = extract(cases);
    const cvs = extract(censusVersions);
    const qs = extract(quotes);
    const als = extract(auditLogs);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    setKpis({
      totalMasterGroups: mgs ? mgs.length : null,
      activeMasterGroups: mgs ? mgs.filter(g => g.status === 'active').length : null,
      activeCases: cs ? cs.filter(c => c.stage !== 'closed').length : null,
      pendingCensus: cvs ? cvs.filter(v => ['uploaded', 'mapping', 'validating'].includes(v.status)).length : null,
      quotesInProgress: qs ? qs.filter(q => ['draft', 'running'].includes(q.status)).length : null,
      recentActivity: als ? als.filter(a => a.created_date >= sevenDaysAgo).length : null,
    });
    setLoading(false);
  }

  const denied = (val) => val === null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <KPICard label="Master Groups" value={kpis.totalMasterGroups} icon={Building2} loading={loading} denied={denied(kpis.totalMasterGroups)} />
      <KPICard label="Active Groups" value={kpis.activeMasterGroups} icon={Building2} loading={loading} denied={denied(kpis.activeMasterGroups)} />
      <KPICard label="Active Cases" value={kpis.activeCases} icon={Briefcase} loading={loading} denied={denied(kpis.activeCases)} />
      <KPICard label="Pending Census" value={kpis.pendingCensus} icon={Users} loading={loading} denied={denied(kpis.pendingCensus)} />
      <KPICard label="Quotes In Progress" value={kpis.quotesInProgress} icon={FileText} loading={loading} denied={denied(kpis.quotesInProgress)} />
      <KPICard label="Activity (7d)" value={kpis.recentActivity} icon={Activity} loading={loading} denied={denied(kpis.recentActivity)} />
    </div>
  );
}