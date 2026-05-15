import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, PauseCircle, Trash2, Loader } from 'lucide-react';

/**
 * Relationship Lifecycle Action Controls
 * Displays permitted lifecycle actions (propose, accept, reject, suspend, terminate)
 * Fail-closed: no actions shown if relationship or status is missing
 */
export default function MGARelationshipLifecycleActions({
  relationship,
  userRole,
  onAccept,
  onReject,
  onSuspend,
  onTerminate,
  loading = false
}) {
  const [actionDialog, setActionDialog] = useState(null);
  const [reason, setReason] = useState('');

  if (!relationship || !relationship.relationship_status) {
    return null;
  }

  const status = relationship.relationship_status;
  const canAccept = status === 'PROPOSED' && userRole === 'mga_admin';
  const canReject = status === 'PROPOSED' && userRole === 'mga_admin';
  const canSuspend = status === 'ACTIVE' && ['platform_admin', 'mga_admin'].includes(userRole);
  const canTerminate = ['ACTIVE', 'SUSPENDED'].includes(status) && userRole === 'platform_admin';

  const handleAction = async (action) => {
    if (action === 'accept') {
      await onAccept?.();
    } else if (action === 'reject') {
      await onReject?.({ reason });
    } else if (action === 'suspend') {
      await onSuspend?.({ reason });
    } else if (action === 'terminate') {
      await onTerminate?.({ reason });
    }
    setActionDialog(null);
    setReason('');
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {canAccept && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setActionDialog('accept')}
            disabled={loading}
            className="border-green-200 text-green-700 hover:bg-green-50"
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Accept
          </Button>
        )}

        {canReject && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setActionDialog('reject')}
            disabled={loading}
            className="border-red-200 text-red-700 hover:bg-red-50"
          >
            <XCircle className="w-4 h-4 mr-1" />
            Reject
          </Button>
        )}

        {canSuspend && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setActionDialog('suspend')}
            disabled={loading}
            className="border-orange-200 text-orange-700 hover:bg-orange-50"
          >
            <PauseCircle className="w-4 h-4 mr-1" />
            Suspend
          </Button>
        )}

        {canTerminate && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setActionDialog('terminate')}
            disabled={loading}
            className="border-red-200 text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Terminate
          </Button>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Loader className="w-4 h-4 animate-spin" />
            Processing...
          </div>
        )}
      </div>

      {/* Action Confirmation Dialogs */}
      <AlertDialog open={actionDialog === 'accept'} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accept Relationship?</AlertDialogTitle>
            <AlertDialogDescription>
              This will activate the MGA/Broker relationship and enable data access within the defined scope.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => handleAction('accept')} className="bg-green-600">
            Accept Relationship
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={actionDialog === 'reject'} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Relationship?</AlertDialogTitle>
            <AlertDialogDescription>
              This will decline the proposed relationship. Provide a reason (optional).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Reason for rejection..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="h-24"
          />
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => handleAction('reject')} className="bg-red-600">
            Reject Relationship
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={actionDialog === 'suspend'} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend Relationship?</AlertDialogTitle>
            <AlertDialogDescription>
              This will suspend data access while preserving the relationship record. Provide a reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Reason for suspension..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="h-24"
            required
          />
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => handleAction('suspend')} className="bg-orange-600">
            Suspend Relationship
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={actionDialog === 'terminate'} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminate Relationship?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently terminate the relationship. Provide a reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Reason for termination..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="h-24"
            required
          />
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => handleAction('terminate')} className="bg-red-600">
            Terminate Relationship
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}