/**
 * MGA Analytics Metric Card
 * components/mga/MGAAnalyticsMetricCard.jsx
 *
 * Reusable metric display component
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function MGAAnalyticsMetricCard({ title, value, label, trend, items }) {
  const trendIcon = 
    trend === 'up' ? <TrendingUp className="h-4 w-4 text-green-600" /> :
    trend === 'down' ? <TrendingDown className="h-4 w-4 text-red-600" /> :
    <Minus className="h-4 w-4 text-slate-400" />;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {trendIcon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
        {items && items.length > 0 && (
          <div className="mt-3 space-y-1 text-xs">
            {items.slice(0, 3).map((item, idx) => (
              <div key={idx} className="flex justify-between">
                <span>{item.name}</span>
                <span className="font-medium">{item.count}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}