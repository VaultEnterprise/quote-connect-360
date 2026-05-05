/**
 * MGA Phase 5 — Section 7: Audit / Activity Panel
 * All data via auditService. Scoped to actor's MGA only.
 * Platform security/impersonation events: visible to platform_super_admin only.
 * Visible to mga_manager+ only.
 */
import React, { useState, useEffect } from 'react';
import { listAuditEventsByScope } from '@/lib/mga/services/auditService';
import { Activity, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';

const CATEGORY_STYLES = {
  operational: 'bg-blue-100 text-blue-700',
  security: 'bg-red-100 text-red-700',
  governance: 'bg-purple-100 text-purple-700',
  impersonation: 'bg-orange-100 text-orange-700',
};

export default function MGAAuditPanel({ mgaId, scopeRequest, isPlatformAdmin }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!mgaId) return;
    load();
  }, [mgaId]);

  async function load() {
    setLoading(true);
    const result = await listAuditEventsByScope({
      ...scopeRequest,
      target_entity_id: 'list_operation',
      limit: 50,
    });
    if (!result?.success && result?.reason_code) {
      setDenied(true);
    } else {
      let events = result?.data || [];
      // Safety: MGA users must not see platform security/impersonation events
      if (!isPlatformAdmin) {
        events = events.filter(e => !['security', 'impersonation'].includes(e.action_category));
      }
      setLogs(events);
    }
    setLoading(false);
  }

  if (denied) {
    return <p className="text-sm text-muted-foreground p-4">Access restricted — Audit log unavailable for your scope.</p>;
  }

  return (
    <div className="bg-card border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b">
        <Activity className="w-4 h-4 text-muted-foreground" />
        <h2 className="font-medium text-sm">Audit Log</h2>
        {!loading && <span className="text-xs text-muted-foreground">({logs.length} recent events)</span>}
      </div>

      {loading ? (
        <div className="p-6 space-y-3">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}
        </div>
      ) : logs.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">No audit events in scope.</div>
      ) : (
        <div className="divide-y">
          {logs.map(log => (
            <div key={log.id} className="flex items-start gap-3 px-5 py-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-foreground">{log.action || log.description || log.id}</span>
                  {log.action_category && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_STYLES[log.action_category] || 'bg-gray-100 text-gray-600'}`}>
                      {log.action_category}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                  {log.actor_email && <span>{log.actor_email}</span>}
                  {log.created_date && (
                    <span>{format(new Date(log.created_date), 'MMM d, yyyy HH:mm')}</span>
                  )}
                  {log.outcome && (
                    <span className={log.outcome === 'success' ? 'text-green-600' : 'text-red-600'}>
                      {log.outcome}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}