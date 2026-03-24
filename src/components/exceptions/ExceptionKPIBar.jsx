import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertOctagon, Clock, CheckCircle } from 'lucide-react';

export default function ExceptionKPIBar({ exceptions = [] }) {
  const metrics = useMemo(() => {
    const total = exceptions.length;
    const bySeverity = {
      critical: exceptions.filter(e => e.severity === 'critical').length,
      high: exceptions.filter(e => e.severity === 'high').length,
      medium: exceptions.filter(e => e.severity === 'medium').length,
      low: exceptions.filter(e => e.severity === 'low').length,
    };

    const byStatus = {
      new: exceptions.filter(e => e.status === 'new').length,
      in_progress: exceptions.filter(e => e.status === 'in_progress').length,
      waiting: exceptions.filter(e => e.status === 'waiting_external').length,
      resolved: exceptions.filter(e => e.status === 'resolved').length,
    };

    const avgResolutionTime = exceptions
      .filter(e => e.resolved_at)
      .reduce((sum, e) => {
        const created = new Date(e.created_date);
        const resolved = new Date(e.resolved_at);
        return sum + (resolved - created) / (1000 * 60 * 60 * 24);
      }, 0) / Math.max(1, exceptions.filter(e => e.resolved_at).length);

    return {
      total,
      critical: bySeverity.critical,
      high: bySeverity.high,
      medium: bySeverity.medium,
      new: byStatus.new,
      inProgress: byStatus.in_progress,
      resolved: byStatus.resolved,
      resolutionDays: Math.round(avgResolutionTime * 10) / 10,
    };
  }, [exceptions]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {/* Total */}
      <Card className="p-4 text-center hover:shadow-md transition-shadow">
        <div className="flex justify-center mb-2">
          <AlertTriangle className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-xs text-muted-foreground mb-1">Total Exceptions</p>
        <p className="text-2xl font-bold">{metrics.total}</p>
      </Card>

      {/* Critical */}
      <Card className="p-4 text-center border-red-200 bg-red-50 hover:shadow-md transition-shadow">
        <div className="flex justify-center mb-2">
          <AlertOctagon className="w-5 h-5 text-red-600" />
        </div>
        <p className="text-xs text-muted-foreground mb-1">Critical</p>
        <p className="text-2xl font-bold text-red-600">{metrics.critical}</p>
      </Card>

      {/* New/In Progress */}
      <Card className="p-4 text-center border-orange-200 bg-orange-50 hover:shadow-md transition-shadow">
        <div className="flex justify-center mb-2">
          <Clock className="w-5 h-5 text-orange-600" />
        </div>
        <p className="text-xs text-muted-foreground mb-1">Active</p>
        <p className="text-2xl font-bold text-orange-600">{metrics.new + metrics.inProgress}</p>
      </Card>

      {/* Resolved */}
      <Card className="p-4 text-center border-green-200 bg-green-50 hover:shadow-md transition-shadow">
        <div className="flex justify-center mb-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
        </div>
        <p className="text-xs text-muted-foreground mb-1">Resolved</p>
        <p className="text-2xl font-bold text-green-600">{metrics.resolved}</p>
      </Card>

      {/* Resolution Time */}
      <Card className="p-4 col-span-2 sm:col-span-4 text-center border-purple-200 bg-purple-50">
        <p className="text-xs text-muted-foreground mb-2">Avg Resolution Time</p>
        <div className="flex items-center justify-center gap-2">
          <span className="text-3xl font-bold text-purple-600">{metrics.resolutionDays}</span>
          <span className="text-sm text-muted-foreground">days</span>
        </div>
      </Card>
    </div>
  );
}