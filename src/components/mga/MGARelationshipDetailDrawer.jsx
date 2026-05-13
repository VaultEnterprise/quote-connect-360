import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import MGARelationshipStatusBadge from './MGARelationshipStatusBadge';
import MGARelationshipScopeSummary from './MGARelationshipScopeSummary';
import MGARelationshipAuditPanel from './MGARelationshipAuditPanel';

/**
 * Relationship Detail Drawer
 * Displays full relationship details with status, scope, and audit history
 * Fail-closed: closes if relationship is missing or null
 */
export default function MGARelationshipDetailDrawer({ open, onOpenChange, relationship }) {
  if (!relationship) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-[600px] space-y-4">
        <SheetHeader>
          <SheetTitle>Relationship Details</SheetTitle>
          <SheetDescription>
            Review relationship status, scope, and history
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4">
          {/* Status Section */}
          <Card className="border-slate-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Status</span>
                <MGARelationshipStatusBadge status={relationship.relationship_status} />
              </div>
            </CardContent>
          </Card>

          {/* Relationship Info Section */}
          <Card className="border-slate-200">
            <CardContent className="pt-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-semibold text-slate-600">Broker Agency ID</span>
                  <p className="text-sm text-slate-900">{relationship.broker_agency_id}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-600">MGA ID</span>
                  <p className="text-sm text-slate-900">{relationship.master_general_agent_id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-semibold text-slate-600">Operational Scope</span>
                  <p className="text-sm text-slate-900">{relationship.operational_scope || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-600">Visibility</span>
                  <p className="text-sm text-slate-900">
                    {relationship.visibility_active ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scope Definition */}
          <MGARelationshipScopeSummary scopeDefinition={relationship.scope_definition} />

          {/* Audit History */}
          <MGARelationshipAuditPanel relationship={relationship} />
        </div>
      </SheetContent>
    </Sheet>
  );
}