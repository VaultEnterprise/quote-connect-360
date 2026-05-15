/**
 * MGAExportDeliveryActionMenu.jsx
 * Gate 6J-A — Delivery Action Controls (Retry, Cancel, Resend)
 * Enforces role-based visibility and permission checks
 */

import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical, RotateCcw, X, Send } from 'lucide-react';
import MGAExportDeliveryRetryDialog from './MGAExportDeliveryRetryDialog';
import MGAExportDeliveryCancelDialog from './MGAExportDeliveryCancelDialog';

export default function MGAExportDeliveryActionMenu({
  delivery,
  userRole,
  userEmail,
  onRetry,
  onCancel,
  onResend,
  permissions = {}
}) {
  const [showRetryDialog, setShowRetryDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Permission checks
  const canRetry = permissions.retry && ['mga_admin', 'mga_manager', 'platform_super_admin'].includes(userRole);
  const canCancel = permissions.cancel && (
    ['mga_admin', 'platform_super_admin'].includes(userRole) ||
    (userRole === 'mga_user' && userEmail === delivery.created_by)
  );
  const canResend = permissions.resend && ['mga_admin', 'mga_manager', 'platform_super_admin'].includes(userRole);

  // Eligibility checks
  const isEligibleForRetry = ['PENDING', 'FAILED'].includes(delivery.status);
  const isEligibleForCancel = delivery.status === 'PENDING';
  const isEligibleForResend = ['SENT', 'FAILED'].includes(delivery.status);

  if (!canRetry && !canCancel && !canResend) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canRetry && isEligibleForRetry && (
            <DropdownMenuItem onClick={() => setShowRetryDialog(true)}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Retry Delivery
            </DropdownMenuItem>
          )}
          {canCancel && isEligibleForCancel && (
            <DropdownMenuItem onClick={() => setShowCancelDialog(true)}>
              <X className="w-4 h-4 mr-2" />
              Cancel Delivery
            </DropdownMenuItem>
          )}
          {canResend && isEligibleForResend && (
            <>
              {(canRetry || canCancel) && <DropdownMenuSeparator />}
              <DropdownMenuItem onClick={() => onResend?.(delivery.export_id)}>
                <Send className="w-4 h-4 mr-2" />
                Resend Delivery
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {showRetryDialog && (
        <MGAExportDeliveryRetryDialog
          delivery={delivery}
          onConfirm={() => {
            onRetry?.(delivery.export_id);
            setShowRetryDialog(false);
          }}
          onClose={() => setShowRetryDialog(false)}
        />
      )}

      {showCancelDialog && (
        <MGAExportDeliveryCancelDialog
          delivery={delivery}
          onConfirm={() => {
            onCancel?.(delivery.export_id);
            setShowCancelDialog(false);
          }}
          onClose={() => setShowCancelDialog(false)}
        />
      )}
    </>
  );
}