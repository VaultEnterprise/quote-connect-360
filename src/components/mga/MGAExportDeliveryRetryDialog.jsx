/**
 * MGAExportDeliveryRetryDialog.jsx
 * Gate 6J-A — Retry Confirmation Dialog
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function MGAExportDeliveryRetryDialog({ delivery, onConfirm, onClose }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Retry Delivery</DialogTitle>
          <DialogDescription>
            Retry delivery for export {delivery.export_id.substring(0, 8)}...
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="text-sm">
            <div className="font-medium mb-1">Current Status</div>
            <div className="text-muted-foreground">{delivery.status}</div>
          </div>
          {delivery.retry_count > 0 && (
            <div className="text-sm">
              <div className="font-medium mb-1">Retry Attempts</div>
              <div className="text-muted-foreground">{delivery.retry_count}</div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Retry Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}