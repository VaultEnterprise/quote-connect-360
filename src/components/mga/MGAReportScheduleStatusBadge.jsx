import React from 'react';
import { Badge } from '@/components/ui/badge';

const statusColors = {
  draft: 'bg-slate-100 text-slate-800',
  active: 'bg-green-100 text-green-800',
  paused: 'bg-orange-100 text-orange-800',
  cancelled: 'bg-red-100 text-red-800'
};

const statusLabels = {
  draft: 'Draft',
  active: 'Active',
  paused: 'Paused',
  cancelled: 'Cancelled'
};

export default function MGAReportScheduleStatusBadge({ status }) {
  return (
    <Badge className={statusColors[status] || statusColors.draft}>
      {statusLabels[status] || status}
    </Badge>
  );
}