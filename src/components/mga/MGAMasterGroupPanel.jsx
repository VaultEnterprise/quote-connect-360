/**
 * MGA Phase 5 — Section 3: Master Group Management Panel
 * All data via Phase 3 masterGroupService. No direct entity reads/writes.
 * Create MasterGroup action: INACTIVE — Phase 5 sub-feature, requires separate activation.
 */
import React, { useState, useEffect } from 'react';
import { listMasterGroups, reactivateBrokerAgency } from '@/lib/mga/services/masterGroupService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, ChevronRight, Plus, Edit2, Power, PowerOff } from 'lucide-react';
import MGACreateBrokerAgencyModal from '@/components/mga/MGACreateBrokerAgencyModal';
import MGABrokerAgencyDetailDrawer from '@/components/mga/MGABrokerAgencyDetailDrawer';
import MGABrokerAgencyEditModal from '@/components/mga/MGABrokerAgencyEditModal';
import MGABrokerAgencyDeactivateDialog from '@/components/mga/MGABrokerAgencyDeactivateDialog';
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

// Gate 6E: Roles authorized to create a Broker / Agency organization
const CREATE_AUTHORIZED_ROLES = ['mga_admin', 'platform_super_admin'];

export default function MGAMasterGroupPanel({ mgaId, scopeRequest, userRole }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailOrg, setDetailOrg] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [editOrg, setEditOrg] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deactivateOrg, setDeactivateOrg] = useState(null);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);

  // Gate 6E: RBAC visibility gate — UI convenience only; auth enforced in service layer
  const canCreate = CREATE_AUTHORIZED_ROLES.includes(userRole);
  
  // Gate 6H: Feature flags for lifecycle UI
  const DETAIL_ENABLED = true;
  const EDIT_ENABLED = true;
  const DEACTIVATE_ENABLED = true;

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
    // Internal entity remains MasterGroup for backward compatibility. User-facing label is Broker / Agency.
    return <p className="text-sm text-muted-foreground p-4">Access restricted — Broker / Agency list unavailable for your scope.</p>;
  }

  return (
    <div className="bg-card border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-medium text-sm">Broker / Agencies</h2>
          {!loading && <span className="text-xs text-muted-foreground">({groups.length})</span>}
        </div>
        {/* Gate 6E: Create Broker / Agency — active for mga_admin and platform_super_admin */}
        {canCreate && (
          <Button
            size="sm"
            variant="outline"
            className="ml-auto gap-1.5 text-xs h-7"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-3.5 h-3.5" /> Add Broker / Agency
          </Button>
        )}
      </div>

      {loading ? (
        <div className="p-6 space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}
        </div>
      ) : groups.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">No Broker / Agencies in scope.</div>
      ) : (
        <div className="divide-y">
          {groups.map(g => (
            <div key={g.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => { setDetailOrg(g); setShowDetail(true); }}
                  className="text-left w-full"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground truncate hover:underline">{g.name}</span>
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
                </button>
              </div>
              
              {/* Gate 6H: Lifecycle action buttons */}
              <div className="flex gap-1 flex-shrink-0">
                {DETAIL_ENABLED && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => { setDetailOrg(g); setShowDetail(true); }}
                    title="View details"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
                
                {EDIT_ENABLED && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => { setEditOrg(g); setShowEditModal(true); }}
                    title="Edit organization"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                )}
                
                {DEACTIVATE_ENABLED && CREATE_AUTHORIZED_ROLES.includes(userRole) && (
                  <>
                    {g.status === 'active' && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => { setDeactivateOrg(g); setShowDeactivateDialog(true); }}
                        title="Deactivate"
                      >
                        <Power className="w-4 h-4" />
                      </Button>
                    )}
                    {g.status === 'inactive' && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={async () => {
                          const result = await reactivateBrokerAgency({
                            ...scopeRequest,
                            target_entity_id: g.id,
                            idempotency_key: `reactivate-${g.id}-${Date.now()}`,
                          });
                          if (result?.success) load();
                        }}
                        title="Reactivate"
                      >
                        <PowerOff className="w-4 h-4" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Gate 6E: Create Broker / Agency modal */}
      {canCreate && (
        <MGACreateBrokerAgencyModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          mgaId={mgaId}
          scopeRequest={scopeRequest}
          onSuccess={load}
        />
      )}

      {/* Gate 6H: Lifecycle components */}
      {DETAIL_ENABLED && (
        <MGABrokerAgencyDetailDrawer
          open={showDetail}
          onClose={() => setShowDetail(false)}
          orgId={detailOrg?.id}
          mgaId={mgaId}
          scopeRequest={scopeRequest}
          userRole={userRole}
          onEdit={(org) => { setEditOrg(org); setShowEditModal(true); }}
          onDeactivate={(org) => { setDeactivateOrg(org); setShowDeactivateDialog(true); }}
          onReactivate={async (org) => {
            const result = await reactivateBrokerAgency({
              ...scopeRequest,
              target_entity_id: org.id,
              idempotency_key: `reactivate-${org.id}-${Date.now()}`,
            });
            if (result?.success) load();
          }}
        />
      )}

      {EDIT_ENABLED && (
        <MGABrokerAgencyEditModal
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          org={editOrg}
          scopeRequest={scopeRequest}
          onSuccess={load}
        />
      )}

      {DEACTIVATE_ENABLED && (
        <MGABrokerAgencyDeactivateDialog
          open={showDeactivateDialog}
          onClose={() => setShowDeactivateDialog(false)}
          org={deactivateOrg}
          scopeRequest={scopeRequest}
          onSuccess={load}
        />
      )}
    </div>
  );
}