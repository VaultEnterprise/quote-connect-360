import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader } from 'lucide-react';
import MGARelationshipStatusBadge from './MGARelationshipStatusBadge';
import MGARelationshipDetailDrawer from './MGARelationshipDetailDrawer';
import MGARelationshipLifecycleActions from './MGARelationshipLifecycleActions';

/**
 * MGA Relationship Management Panel
 * Displays relationships with safe payload fields only
 * Role-aware visibility: platform_admin, mga_admin, broker_admin only
 * Feature-flag controlled (stub for Phase 7A-3.5)
 * Fail-closed: renders nothing if user/relationships are missing
 */
export default function MGARelationshipManagementPanel({ user, relationships = [] }) {
  const [selectedId, setSelectedId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fail-closed: no render if user or user.role is missing
  if (!user || !user.role) {
    return null;
  }

  // Role-aware visibility: only platform_admin, mga_admin, broker_admin
  const allowedRoles = ['platform_admin', 'platform_super_admin', 'mga_admin', 'broker_admin'];
  if (!allowedRoles.includes(user.role)) {
    return null;
  }

  // Feature flag stub (Phase 7A-3.5: all flags remain false, no activation)
  // const relationshipFlagEnabled = featureFlags.MGA_RELATIONSHIP_PANEL_ENABLED;
  // if (!relationshipFlagEnabled) return null;

  // Filter relationships based on role
  const filterRelationships = () => {
    if (user.role === 'platform_admin' || user.role === 'platform_super_admin') {
      return relationships;
    }
    if (user.role === 'mga_admin') {
      return relationships.filter(r => r.master_general_agent_id === user.mga_id);
    }
    if (user.role === 'broker_admin') {
      return relationships.filter(r => r.broker_agency_id === user.broker_agency_id);
    }
    return [];
  };

  const filtered = filterRelationships();

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

  const handleSuspend = async (relationshipId, data) => {
    setLoading(true);
    try {
      await base44.functions.invoke('suspendBrokerMGARelationship', {
        relationship_id: relationshipId,
        reason: data.reason || ''
      });
      setDrawerOpen(false);
    } catch (error) {
      console.error('Failed to suspend relationship:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTerminate = async (relationshipId, data) => {
    setLoading(true);
    try {
      await base44.functions.invoke('terminateBrokerMGARelationship', {
        relationship_id: relationshipId,
        reason: data.reason || ''
      });
      setDrawerOpen(false);
    } catch (error) {
      console.error('Failed to terminate relationship:', error);
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
          <CardTitle className="text-lg font-semibold">MGA Relationships</CardTitle>
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
                    {relationship.broker_agency_id} ↔ {relationship.master_general_agent_id}
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
                View Details
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
          <h4 className="font-semibold text-sm mb-3">Lifecycle Actions</h4>
          <MGARelationshipLifecycleActions
            relationship={selected}
            userRole={user.role}
            onAccept={() => handleAccept(selected.id)}
            onReject={(data) => handleReject(selected.id, data)}
            onSuspend={(data) => handleSuspend(selected.id, data)}
            onTerminate={(data) => handleTerminate(selected.id, data)}
            loading={loading}
          />
        </div>
      )}
    </>
  );
}