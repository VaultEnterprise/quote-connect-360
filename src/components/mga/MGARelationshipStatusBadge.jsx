import React from 'react';
import { Badge } from '@/components/ui/badge';

const statusConfig = {
  PROPOSED: {
    label: 'Proposed',
    color: 'bg-yellow-100 text-yellow-800',
    icon: '◉'
  },
  ACTIVE: {
    label: 'Active',
    color: 'bg-green-100 text-green-800',
    icon: '✓'
  },
  SUSPENDED: {
    label: 'Suspended',
    color: 'bg-orange-100 text-orange-800',
    icon: '⊘'
  },
  SCOPE_CHANGE_REQUESTED: {
    label: 'Scope Change Pending',
    color: 'bg-blue-100 text-blue-800',
    icon: '◈'
  },
  TERMINATED: {
    label: 'Terminated',
    color: 'bg-red-100 text-red-800',
    icon: '✕'
  }
};

/**
 * Relationship Status Badge
 * Displays relationship status with visual indicator
 * Fail-closed: returns null if status is missing or invalid
 */
export default function MGARelationshipStatusBadge({ status }) {
  if (!status || !statusConfig[status]) {
    return null;
  }

  const config = statusConfig[status];
  return (
    <Badge className={`${config.color} font-semibold`}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </Badge>
  );
}