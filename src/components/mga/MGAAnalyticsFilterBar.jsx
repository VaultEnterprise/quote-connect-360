/**
 * MGA Analytics Filter Bar
 * components/mga/MGAAnalyticsFilterBar.jsx
 *
 * Date range and scope filters
 */

import React from 'react';
import { Button } from '@/components/ui/button';

export default function MGAAnalyticsFilterBar({ filters, onFilterChange }) {
  return (
    <div className="flex gap-3 flex-wrap">
      <Button
        variant={filters.days === 7 ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange({ ...filters, days: 7 })}
      >
        7 Days
      </Button>
      <Button
        variant={filters.days === 30 ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange({ ...filters, days: 30 })}
      >
        30 Days
      </Button>
      <Button
        variant={filters.days === 90 ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange({ ...filters, days: 90 })}
      >
        90 Days
      </Button>
    </div>
  );
}