/**
 * MGA Phase 5 — Section 3: Master Group Management Panel
 * All data via Phase 3 masterGroupService. No direct entity reads/writes.
 * Create MasterGroup action: INACTIVE — Phase 5 sub-feature, requires separate activation.
 */
import React, { useState, useEffect } from 'react';
import { listMasterGroups } from '@/lib/mga/services/masterGroupService';
import { Badge } from '@/components/ui/badge';
import { Building2, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-600',
  suspended: 'bg-red-100 text-red-800',
  quarantined: 'bg-yellow-100 text-yellow-800',
};

const OWNERSHIP_COLORS = {
  assigned: 'bg-blue-100 text-blue-800',
  unassigned: 'bg-gray-100 text-gray-500',
  disputed: 'bg-orange-100 text-orange-700',
  quarantined: 'bg-yellow-100 text-yellow-700',
};

export default function MGAMasterGroupPanel({ mgaId, scopeRequest }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!mgaId) return;
    load();
  }, [mgaId]);

  async function load() {
    setLoading(true);
    const result = await listMasterGroups({ ...scopeRequest, target_entity_id: mgaId });
    if (!result?.success && result?.reason_code) {
      setDenied(true);
    } else {
      setGroups(result?.data || []);
    }
    setLoading(false);
  }

  if (denied) {
    return <p className="text-sm text-muted-foreground p-4">Access restricted — MasterGroup list unavailable for your scope.</p>;
  }

  return (
    <div className="bg-card border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-medium text-sm">Master Groups</h2>
          {!loading && <span className="text-xs text-muted-foreground">({groups.length})</span>}
        </div>
        {/* Create MasterGroup: INACTIVE — Phase 5 sub-feature activation pending */}
      </div>

      {loading ? (
        <div className="p-6 space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}
        </div>
      ) : groups.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">No master groups in scope.</div>
      ) : (
        <div className="divide-y">
          {groups.map(g => (
            <div key={g.id} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground truncate">{g.name}</span>
                  {g.code && <span className="text-xs font-mono text-muted-foreground">{g.code}</span>}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[g.status] || 'bg-gray-100 text-gray-600'}`}>
                    {g.status}
                  </span>
                  {g.ownership_status && g.ownership_status !== 'assigned' && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${OWNERSHIP_COLORS[g.ownership_status] || 'bg-gray-100 text-gray-500'}`}>
                      {g.ownership_status}
                    </span>
                  )}
                  {g.updated_date && (
                    <span className="text-xs text-muted-foreground">
                      Updated {format(new Date(g.updated_date), 'MMM d, yyyy')}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}