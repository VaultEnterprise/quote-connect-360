import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import MGARelationshipStatusBadge from './MGARelationshipStatusBadge';
import MGARelationshipDetailDrawer from './MGARelationshipDetailDrawer';
import MGARelationshipLifecycleActions from './MGARelationshipLifecycleActions';

/**
 * Broker Relationship Management Panel
 * Broker view of MGA relationships
 * Role-aware: broker_admin only
 * Fail-closed: renders nothing if user is not broker_admin
 */
export default function BrokerRelationshipManagementPanel({ user, relationships = [] }) {
  const [selectedId, setSelectedId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fail-closed: no render if user is not broker_admin
  if (!user || user.role !== 'broker_admin') {
    return null;
  }

  // Filter to only relationships involving this broker
  const filtered = relationships.filter(r => r.broker_agency_id === user.broker_agency_id);

  const handleAccept = async (relationshipId) => {
    setLoading(true);
    try {
      await base44.functions.invoke('acceptBrokerMGARelationship', {
        relationship_id: relationshipId
      });
      setDrawerOpen(false);
    } catch (error) {
      console.error('Failed to accept relationship:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (relationshipId, data) => {
    setLoading(true);
    try {
      await base44.functions.invoke('rejectBrokerMGARelationship', {
        relationship_id: relationshipId,
        reason: data.reason || ''
      });
      setDrawerOpen(false);
    } catch (error) {
      console.error('Failed to reject relationship:', error);
    } finally {
      setLoading(false);
    }
  };

  const selected = filtered.find(r => r.id === selectedId);

  if (filtered.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Your MGA Relationships</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {filtered.map(relationship => (
            <div
              key={relationship.id}
              className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
              onClick={() => {
                setSelectedId(relationship.id);
                setDrawerOpen(true);
              }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-semibold text-slate-900">
                    {relationship.master_general_agent_id}
                  </span>
                  <MGARelationshipStatusBadge status={relationship.relationship_status} />
                </div>
                <p className="text-sm text-slate-600">
                  Scope: {relationship.operational_scope || 'N/A'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(relationship.id);
                  setDrawerOpen(true);
                }}
              >
                View
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <MGARelationshipDetailDrawer
        open={drawerOpen && !!selected}
        onOpenChange={setDrawerOpen}
        relationship={selected}
      />

      {selected && drawerOpen && (
        <div className="mt-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
          <h4 className="font-semibold text-sm mb-3">Actions</h4>
          <MGARelationshipLifecycleActions
            relationship={selected}
            userRole={user.role}
            onAccept={() => handleAccept(selected.id)}
            onReject={(data) => handleReject(selected.id, data)}
            loading={loading}
          />
        </div>
      )}
    </>
  );
}