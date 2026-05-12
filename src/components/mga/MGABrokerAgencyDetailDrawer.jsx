/**
 * MGABrokerAgencyDetailDrawer — Gate 6H
 * Read-only detail view with audit trail and lifecycle actions
 */
import React, { useState, useEffect } from 'react';
import { getMasterGroupDetail, listMasterGroupActivity } from '@/lib/mga/services/masterGroupService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-red-100 text-red-800',
  suspended: 'bg-yellow-100 text-yellow-800',
};

export default function MGABrokerAgencyDetailDrawer({
  open,
  onClose,
  orgId,
  mgaId,
  scopeRequest,
  userRole,
  onEdit,
  onDeactivate,
  onReactivate,
}) {
  const [org, setOrg] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const EDIT_ENABLED = true;
  const DEACTIVATE_ENABLED = true;
  const LIFECYCLE_ROLES = ['mga_admin', 'platform_super_admin'];

  useEffect(() => {
    if (!open || !orgId) return;
    load();
  }, [open, orgId]);

  async function load() {
    setLoading(true);
    const detail = await getMasterGroupDetail({ ...scopeRequest, target_entity_id: orgId });
    const logs = await listMasterGroupActivity({ ...scopeRequest, target_entity_id: orgId });
    setOrg(detail?.data);
    setActivity(logs?.data || []);
    setLoading(false);
  }

  if (!org && !loading) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Broker / Agency Details</DialogTitle>
          <DialogDescription>View and manage organization profile</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}
          </div>
        ) : org ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{org.name}</h3>
                {org.code && <p className="text-sm text-muted-foreground font-mono">{org.code}</p>}
              </div>
              <Badge className={STATUS_COLORS[org.status] || 'bg-gray-100 text-gray-600'}>
                {org.status}
              </Badge>
            </div>

            {/* Profile Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {org.address && (
                <div>
                  <p className="font-medium text-muted-foreground">Address</p>
                  <p>{org.address}</p>
                </div>
              )}
              {org.city && (
                <div>
                  <p className="font-medium text-muted-foreground">City</p>
                  <p>{org.city}</p>
                </div>
              )}
              {org.state && (
                <div>
                  <p className="font-medium text-muted-foreground">State</p>
                  <p>{org.state}</p>
                </div>
              )}
              {org.zip && (
                <div>
                  <p className="font-medium text-muted-foreground">ZIP</p>
                  <p>{org.zip}</p>
                </div>
              )}
              {org.phone && (
                <div>
                  <p className="font-medium text-muted-foreground">Phone</p>
                  <p>{org.phone}</p>
                </div>
              )}
              {org.email && (
                <div>
                  <p className="font-medium text-muted-foreground">Email</p>
                  <p>{org.email}</p>
                </div>
              )}
              {org.primary_contact_name && (
                <div>
                  <p className="font-medium text-muted-foreground">Primary Contact</p>
                  <p>{org.primary_contact_name}</p>
                </div>
              )}
              {org.updated_date && (
                <div>
                  <p className="font-medium text-muted-foreground">Last Updated</p>
                  <p>{format(new Date(org.updated_date), 'MMM d, yyyy HH:mm')}</p>
                </div>
              )}
            </div>

            {org.notes && (
              <div>
                <p className="font-medium text-muted-foreground text-sm">Notes</p>
                <p className="text-sm">{org.notes}</p>
              </div>
            )}

            {/* Audit Trail */}
            {activity.length > 0 && (
              <div>
                <p className="font-medium text-muted-foreground text-sm mb-3">Recent Activity</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {activity.slice(0, 10).map((log, i) => (
                    <div key={i} className="text-xs border-l-2 border-muted pl-2 py-1">
                      <p className="font-medium">{log.action}</p>
                      <p className="text-muted-foreground">
                        {log.actor_name} • {format(new Date(log.created_date || new Date()), 'MMM d, HH:mm')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              {EDIT_ENABLED && (
                <Button variant="outline" size="sm" onClick={() => { onEdit(org); onClose(); }}>
                  Edit Profile
                </Button>
              )}
              {DEACTIVATE_ENABLED && LIFECYCLE_ROLES.includes(userRole) && org.status === 'active' && (
                <Button variant="destructive" size="sm" onClick={() => { onDeactivate(org); onClose(); }}>
                  Deactivate
                </Button>
              )}
              {DEACTIVATE_ENABLED && LIFECYCLE_ROLES.includes(userRole) && org.status === 'inactive' && (
                <Button variant="outline" size="sm" onClick={() => { onReactivate(org); onClose(); }}>
                  Reactivate
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose} className="ml-auto">
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}