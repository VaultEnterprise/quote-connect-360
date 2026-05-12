/**
 * MGABrokerAgencyDeactivateDialog — Gate 6H
 * Confirmation dialog for deactivating Broker / Agency
 */
import React, { useState } from 'react';
import { deactivateBrokerAgency } from '@/lib/mga/services/masterGroupService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function MGABrokerAgencyDeactivateDialog({
  open,
  onClose,
  org,
  scopeRequest,
  onSuccess,
}) {
  const [deactivating, setDeactivating] = useState(false);
  const [error, setError] = useState(null);

  async function handleDeactivate() {
    setError(null);
    setDeactivating(true);

    const result = await deactivateBrokerAgency({
      ...scopeRequest,
      target_entity_id: org.id,
      idempotency_key: `deactivate-${org.id}-${Date.now()}`,
    });

    setDeactivating(false);
    if (result?.success) {
      onSuccess?.();
      onClose();
    } else {
      setError(result?.detail || 'Failed to deactivate organization');
    }
  }

  if (!org) return null;

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deactivate Broker / Agency?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <div>
              You are about to deactivate <strong>{org.name}</strong>. This action will:
            </div>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Deny access to all users assigned to this organization</li>
              <li>Hide this organization from active lists</li>
              <li>Be logged to the audit trail</li>
            </ul>
            <div className="text-sm text-destructive mt-3">
              This cannot be undone immediately — the organization can only be reactivated by an administrator.
            </div>
            {error && <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">{error}</div>}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-2 justify-end">
          <AlertDialogCancel disabled={deactivating}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeactivate} disabled={deactivating} className="bg-destructive">
            {deactivating ? 'Deactivating...' : 'Deactivate'}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}