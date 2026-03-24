import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, AlertCircle, AlertOctagon, CheckCircle, Trash2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export default function ExceptionCard({ exception, onAction, onDelete }) {
  const severityConfig = {
    low: { icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    medium: { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    high: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    critical: { icon: AlertOctagon, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-300' },
  };

  const statusConfig = {
    new: 'bg-slate-100 text-slate-900',
    triaged: 'bg-blue-100 text-blue-900',
    in_progress: 'bg-purple-100 text-purple-900',
    waiting_external: 'bg-orange-100 text-orange-900',
    resolved: 'bg-green-100 text-green-900',
    dismissed: 'bg-gray-100 text-gray-900',
  };

  const daysOverdue = useMemo(() => {
    if (!exception.due_by) return null;
    const days = differenceInDays(new Date(exception.due_by), new Date());
    return days < 0 ? Math.abs(days) : null;
  }, [exception.due_by]);

  const severity = exception.severity || 'medium';
  const SeverityIcon = severityConfig[severity]?.icon || AlertTriangle;

  return (
    <Card className={`p-4 border ${severityConfig[severity]?.bg} ${severityConfig[severity]?.border}`}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <SeverityIcon className={`w-5 h-5 ${severityConfig[severity]?.color} flex-shrink-0 mt-0.5`} />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1 truncate">{exception.title}</h3>
            <p className="text-xs text-muted-foreground">
              {exception.employer_name || 'Case'} • {exception.category}
            </p>
          </div>
          <Badge className={`text-xs flex-shrink-0 ${statusConfig[exception.status]}`}>
            {exception.status.replace(/_/g, ' ').toUpperCase()}
          </Badge>
        </div>

        {/* Description */}
        {exception.description && (
          <p className="text-sm text-foreground line-clamp-2">{exception.description}</p>
        )}

        {/* Suggested Action */}
        {exception.suggested_action && (
          <div className="p-2 bg-white/50 rounded border text-xs">
            <p className="font-medium text-muted-foreground mb-1">Suggested Action:</p>
            <p>{exception.suggested_action}</p>
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {exception.assigned_to && (
              <span>Assigned: <strong>{exception.assigned_to}</strong></span>
            )}
          </div>
          {daysOverdue && (
            <span className="text-red-600 font-semibold">{daysOverdue} days overdue</span>
          )}
          {exception.due_by && !daysOverdue && (
            <span>Due: {format(new Date(exception.due_by), 'MMM d')}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button size="sm" className="flex-1" variant="outline" onClick={() => onAction?.(exception.id)}>
            View Details
          </Button>
          {onDelete && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => onDelete(exception.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}