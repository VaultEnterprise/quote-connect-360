/**
 * MGA Phase 5 — Section 6: Users & Roles Panel
 * Gate 6A (2026-05-05): Invite User activated for mga_admin only.
 * All data via userAdminService. scopeGate enforced in service layer.
 * Visible to mga_manager+ only.
 */
import React, { useState, useEffect } from 'react';
import { listMGAUsers } from '@/lib/mga/services/userAdminService';
import MGAInviteUserModal from './MGAInviteUserModal';
import { Users, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

const ROLE_COLORS = {
  mga_admin: 'bg-blue-100 text-blue-800',
  mga_manager: 'bg-purple-100 text-purple-700',
  mga_user: 'bg-gray-100 text-gray-700',
  mga_read_only: 'bg-gray-100 text-gray-500',
  platform_super_admin: 'bg-red-100 text-red-700',
};

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  invited: 'bg-yellow-100 text-yellow-700',
  inactive: 'bg-gray-100 text-gray-500',
};

export default function MGAUsersPanel({ mgaId, scopeRequest, userRole }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const isMGAAdmin = userRole === 'mga_admin';

  useEffect(() => {
    if (!mgaId) return;
    load();
  }, [mgaId]);

  async function load() {
    setLoading(true);
    const result = await listMGAUsers({ ...scopeRequest, target_entity_id: mgaId });
    if (!result?.success && result?.reason_code) {
      setDenied(true);
    } else {
      setUsers(result?.data || []);
    }
    setLoading(false);
  }

  if (denied) {
    return <p className="text-sm text-muted-foreground p-4">Access restricted — User list unavailable for your scope.</p>;
  }

  return (
    <div className="bg-card border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b">
        <Users className="w-4 h-4 text-muted-foreground" />
        <h2 className="font-medium text-sm">Users & Roles</h2>
        {!loading && <span className="text-xs text-muted-foreground">({users.length})</span>}
        {isMGAAdmin && (
          <Button
            size="sm"
            variant="outline"
            className="ml-auto gap-1.5 text-xs h-7"
            onClick={() => setShowInviteModal(true)}
          >
            <UserPlus className="w-3.5 h-3.5" /> Invite User
          </Button>
        )}
      </div>

      {loading ? (
        <div className="p-6 space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}
        </div>
      ) : users.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">No MGA users in scope.</div>
      ) : (
        <div className="divide-y">
          {users.map(u => (
            <div key={u.id} className="flex items-center gap-4 px-5 py-3">
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground truncate block">{u.user_email}</span>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-600'}`}>
                    {u.role?.replace(/_/g, ' ')}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[u.status] || 'bg-gray-100 text-gray-500'}`}>
                    {u.status}
                  </span>
                  {u.invited_at && (
                    <span className="text-xs text-muted-foreground">Invited {format(new Date(u.invited_at), 'MMM d, yyyy')}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isMGAAdmin && (
        <MGAInviteUserModal
          open={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          mgaId={mgaId}
          scopeRequest={scopeRequest}
          onSuccess={load}
        />
      )}
    </div>
  );
}