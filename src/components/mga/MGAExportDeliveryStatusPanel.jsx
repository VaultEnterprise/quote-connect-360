/**
 * MGAExportDeliveryStatusPanel.jsx
 * Gate 6J-A — Export Delivery Status Display Component
 * Shows delivery status badge, retry count, and timestamp
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

const statusConfig = {
  PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
  SENT: { color: 'bg-green-100 text-green-800', icon: CheckCircle2, label: 'Sent' },
  FAILED: { color: 'bg-red-100 text-red-800', icon: AlertCircle, label: 'Failed' },
  CANCELLED: { color: 'bg-gray-100 text-gray-800', icon: Clock, label: 'Cancelled' },
};

export default function MGAExportDeliveryStatusPanel({ delivery }) {
  if (!delivery) {
    return (
      <div className="text-sm text-muted-foreground">
        No delivery data available
      </div>
    );
  }

  const config = statusConfig[delivery.status] || statusConfig.PENDING;
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${config.color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <div className="font-medium text-sm">{config.label}</div>
        {delivery.retry_count > 0 && (
          <div className="text-xs text-muted-foreground">
            Retried {delivery.retry_count} time{delivery.retry_count > 1 ? 's' : ''}
          </div>
        )}
        {delivery.last_updated_at && (
          <div className="text-xs text-muted-foreground">
            Updated {new Date(delivery.last_updated_at).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}