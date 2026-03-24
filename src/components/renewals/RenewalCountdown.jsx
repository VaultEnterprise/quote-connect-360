import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export default function RenewalCountdown({ renewal }) {
  const stats = useMemo(() => {
    const renewalDate = new Date(renewal.renewal_date);
    const today = new Date();
    const daysRemaining = differenceInDays(renewalDate, today);
    const totalDays = differenceInDays(renewalDate, new Date(renewal.renewal_date).setFullYear(new Date(renewal.renewal_date).getFullYear() - 1));
    const daysElapsed = totalDays - daysRemaining;
    const progress = Math.max(0, Math.round((daysElapsed / totalDays) * 100));

    return {
      daysRemaining: Math.max(0, daysRemaining),
      renewalDate: format(renewalDate, 'MMM d, yyyy'),
      progress,
      urgency: daysRemaining < 30 ? 'critical' : daysRemaining < 60 ? 'high' : daysRemaining < 90 ? 'medium' : 'low',
    };
  }, [renewal.renewal_date]);

  const milestones = [
    { label: 'Market', status: renewal.status === 'marketed' ? 'done' : 'pending' },
    { label: 'Options Ready', status: renewal.status === 'options_prepared' ? 'done' : 'pending' },
    { label: 'Decision', status: renewal.status === 'decision_made' ? 'done' : 'pending' },
    { label: 'Install', status: renewal.status === 'install_renewal' ? 'done' : 'pending' },
  ];

  const urgencyColor = {
    critical: 'text-red-600',
    high: 'text-orange-600',
    medium: 'text-yellow-600',
    low: 'text-green-600',
  };

  return (
    <Card className="p-6 space-y-4">
      <div>
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-sm text-muted-foreground">Renewal Date</p>
            <p className="text-lg font-semibold">{stats.renewalDate}</p>
          </div>
          <Badge variant={stats.urgency === 'critical' ? 'destructive' : stats.urgency === 'high' ? 'outline' : 'secondary'}>
            {stats.daysRemaining} days
          </Badge>
        </div>
        <Progress value={stats.progress} />
      </div>

      {/* Milestones */}
      <div>
        <p className="text-sm font-semibold mb-3">Milestones</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {milestones.map((milestone, idx) => (
            <div key={idx} className="text-center p-2 border rounded">
              <div className="flex justify-center mb-1">
                {milestone.status === 'done' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <Clock className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <p className="text-xs font-medium">{milestone.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Alert */}
      {stats.urgency === 'critical' && (
        <div className="p-3 bg-red-50 border border-red-200 rounded flex gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>Less than 30 days to renewal. Immediate action required.</span>
        </div>
      )}
    </Card>
  );
}