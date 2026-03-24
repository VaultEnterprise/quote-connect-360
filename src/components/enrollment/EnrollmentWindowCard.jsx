import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Users, TrendingUp } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export default function EnrollmentWindowCard({ window, onAction }) {
  const windowInfo = useMemo(() => {
    if (!window) return null;

    const daysRemaining = differenceInDays(new Date(window.end_date), new Date());
    const total = window.total_eligible || 0;
    const enrollmentRate = total > 0 ? Math.round((window.enrolled_count / total) * 100) : 0;

    return {
      daysRemaining: Math.max(0, daysRemaining),
      enrollmentRate,
      isActive: window.status === 'open',
      isClosing: daysRemaining <= 3 && daysRemaining > 0,
      isClosed: daysRemaining <= 0,
    };
  }, [window]);

  if (!window || !windowInfo) {
    return <Card className="p-4 text-muted-foreground text-sm">No enrollment window</Card>;
  }

  const statusColor = {
    scheduled: 'bg-slate-50 border-slate-200',
    open: 'bg-green-50 border-green-200',
    closing_soon: 'bg-orange-50 border-orange-200',
    closed: 'bg-red-50 border-red-200',
    finalized: 'bg-blue-50 border-blue-200',
  };

  const statusBadgeVariant = {
    scheduled: 'outline',
    open: { variant: 'default', className: 'bg-green-600' },
    closing_soon: { variant: 'destructive', className: 'bg-orange-600' },
    closed: 'destructive',
    finalized: 'secondary',
  };

  return (
    <Card className={`p-6 border-l-4 transition-all ${statusColor[window.status]}`} style={{ borderLeftColor: window.status === 'open' ? '#10b981' : window.status === 'closing_soon' ? '#f97316' : '#6b7280' }}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-sm mb-1">{window.employer_name}</h3>
            <p className="text-xs text-muted-foreground">
              {format(new Date(window.start_date), 'MMM d')} - {format(new Date(window.end_date), 'MMM d, yyyy')}
            </p>
          </div>
          <Badge variant={statusBadgeVariant[window.status]?.variant} className={statusBadgeVariant[window.status]?.className}>
            {window.status.replace(/_/g, ' ').toUpperCase()}
          </Badge>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 bg-white/50 rounded">
            <Users className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Enrolled</p>
            <p className="font-semibold text-sm">{window.enrolled_count}/{window.total_eligible}</p>
          </div>

          <div className="text-center p-2 bg-white/50 rounded">
            <TrendingUp className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Rate</p>
            <p className="font-semibold text-sm text-green-600">{windowInfo.enrollmentRate}%</p>
          </div>

          <div className="text-center p-2 bg-white/50 rounded">
            <Calendar className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Days Left</p>
            <p className={`font-semibold text-sm ${windowInfo.isClosing ? 'text-orange-600' : windowInfo.isClosed ? 'text-red-600' : 'text-slate-600'}`}>
              {windowInfo.daysRemaining}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Enrollment Progress</span>
            <span>{windowInfo.enrollmentRate}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
              style={{ width: `${windowInfo.enrollmentRate}%` }}
            />
          </div>
        </div>

        {/* Pending Count */}
        {window.pending_count > 0 && (
          <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-900">
            <strong>{window.pending_count}</strong> employees still need to complete enrollment
          </div>
        )}

        {/* Actions */}
        {onAction && windowInfo.isActive && (
          <Button size="sm" className="w-full" onClick={() => onAction(window.id)}>
            Send Reminder
          </Button>
        )}
      </div>
    </Card>
  );
}