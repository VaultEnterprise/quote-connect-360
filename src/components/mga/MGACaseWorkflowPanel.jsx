/**
 * MGA Phase 5 — Section 4: Case / Quote / Census Workflow Panel
 * Sub-panels: Cases, Census, Quotes.
 * All data via Phase 3 scoped services only. No direct entity reads.
 */
import React, { useState, useEffect } from 'react';
import { listCases } from '@/lib/mga/services/caseService';
import { listCensusVersions } from '@/lib/mga/services/censusService';
import { listQuotes } from '@/lib/mga/services/quoteService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Briefcase, Users, FileText } from 'lucide-react';

const STAGE_COLORS = {
  draft: 'bg-gray-100 text-gray-600',
  census_in_progress: 'bg-blue-100 text-blue-700',
  census_validated: 'bg-blue-100 text-blue-800',
  ready_for_quote: 'bg-purple-100 text-purple-700',
  quoting: 'bg-purple-100 text-purple-800',
  proposal_ready: 'bg-indigo-100 text-indigo-700',
  active: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-500',
};

const QUOTE_STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-600',
  running: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-800',
  expired: 'bg-red-100 text-red-700',
  error: 'bg-red-100 text-red-800',
};

export default function MGACaseWorkflowPanel({ mgaId, scopeRequest }) {
  const [cases, setCases] = useState([]);
  const [census, setCensus] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mgaId) return;
    load();
  }, [mgaId]);

  async function load() {
    setLoading(true);
    const base = { ...scopeRequest, target_entity_id: mgaId };
    const [c, cv, q] = await Promise.allSettled([
      listCases({ ...base }),
      listCensusVersions({ ...base }),
      listQuotes({ ...base }),
    ]);
    if (c.status === 'fulfilled' && c.value?.data) setCases(c.value.data);
    if (cv.status === 'fulfilled' && cv.value?.data) setCensus(cv.value.data);
    if (q.status === 'fulfilled' && q.value?.data) setQuotes(q.value.data);
    setLoading(false);
  }

  return (
    <Tabs defaultValue="cases">
      <TabsList>
        <TabsTrigger value="cases" className="gap-1.5">
          <Briefcase className="w-3.5 h-3.5" /> Cases {!loading && <span className="text-xs">({cases.length})</span>}
        </TabsTrigger>
        <TabsTrigger value="census" className="gap-1.5">
          <Users className="w-3.5 h-3.5" /> Census {!loading && <span className="text-xs">({census.length})</span>}
        </TabsTrigger>
        <TabsTrigger value="quotes" className="gap-1.5">
          <FileText className="w-3.5 h-3.5" /> Quotes {!loading && <span className="text-xs">({quotes.length})</span>}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="cases">
        <div className="bg-card border rounded-xl overflow-hidden mt-3">
          {loading ? (
            <LoadingRows />
          ) : cases.length === 0 ? (
            <EmptyState label="No cases in scope." />
          ) : (
            <div className="divide-y">
              {cases.slice(0, 20).map(c => (
                <div key={c.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground truncate">{c.employer_name || c.case_number || c.id}</span>
                      {c.case_number && <span className="text-xs font-mono text-muted-foreground">{c.case_number}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STAGE_COLORS[c.stage] || 'bg-gray-100 text-gray-600'}`}>
                        {c.stage?.replace(/_/g, ' ')}
                      </span>
                      {c.priority && c.priority !== 'normal' && (
                        <span className="text-xs text-muted-foreground capitalize">{c.priority}</span>
                      )}
                      {c.assigned_to && (
                        <span className="text-xs text-muted-foreground">Assigned: {c.assigned_to}</span>
                      )}
                    </div>
                  </div>
                  {c.last_activity_date && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(c.last_activity_date), 'MMM d')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="census">
        <div className="bg-card border rounded-xl overflow-hidden mt-3">
          {loading ? (
            <LoadingRows />
          ) : census.length === 0 ? (
            <EmptyState label="No census versions in scope." />
          ) : (
            <div className="divide-y">
              {census.slice(0, 20).map(v => (
                <div key={v.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">{v.file_name || `Version ${v.version_number}`}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-muted-foreground capitalize">{v.status}</span>
                      {v.total_employees && <span className="text-xs text-muted-foreground">{v.total_employees} employees</span>}
                      {v.validation_errors > 0 && (
                        <span className="text-xs text-red-600">{v.validation_errors} errors</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="quotes">
        <div className="bg-card border rounded-xl overflow-hidden mt-3">
          {loading ? (
            <LoadingRows />
          ) : quotes.length === 0 ? (
            <EmptyState label="No quote scenarios in scope." />
          ) : (
            <div className="divide-y">
              {quotes.slice(0, 20).map(q => (
                <div key={q.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">{q.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${QUOTE_STATUS_COLORS[q.status] || 'bg-gray-100 text-gray-600'}`}>
                        {q.status}
                      </span>
                      {q.total_monthly_premium && (
                        <span className="text-xs text-muted-foreground">${q.total_monthly_premium?.toLocaleString()}/mo</span>
                      )}
                      {q.approval_status && q.approval_status !== 'none' && (
                        <span className="text-xs font-medium text-muted-foreground capitalize">Approval: {q.approval_status}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}

function LoadingRows() {
  return (
    <div className="p-6 space-y-3">
      {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}
    </div>
  );
}

function EmptyState({ label }) {
  return <div className="p-8 text-center text-sm text-muted-foreground">{label}</div>;
}