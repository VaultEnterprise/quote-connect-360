/**
 * MGAExportDeliveryCancelDialog.jsx
 * Gate 6J-A — Cancel Delivery Confirmation Dialog
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
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertTriangle } from 'lucide-react';

export default function MGAExportDeliveryCancelDialog({ delivery, onConfirm, onClose }) {
  const [isLoading, setIsLoading] = useState(false);
  const [reason, setReason] = useState('');

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
          <DialogTitle>Cancel Delivery</DialogTitle>
          <DialogDescription>
            Cancel pending delivery for export {delivery.export_id.substring(0, 8)}...
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-3 rounded-lg bg-destructive/10 p-3">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="text-sm text-destructive">
              This action cannot be undone. The delivery will be marked as cancelled.
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">
              Reason (optional)
            </label>
            <Textarea
              placeholder="Enter cancellation reason..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1.5 h-20"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Keep Delivery
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Cancel Delivery
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}