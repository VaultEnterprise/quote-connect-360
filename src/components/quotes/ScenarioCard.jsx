import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreVertical, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

export default function ScenarioCard({ scenario, onSelect, onDelete, isRecommended }) {
  const metrics = useMemo(() => {
    const total = scenario.total_monthly_premium || 0;
    const employer = scenario.employer_monthly_cost || 0;
    const employee = scenario.employee_monthly_cost_avg || 0;

    return {
      totalMonthly: total.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
      employerMonthly: employer.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
      employeeMonthly: employee.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
      employerPercent: total > 0 ? Math.round((employer / total) * 100) : 0,
    };
  }, [scenario]);

  const statusColor = {
    draft: 'bg-slate-50 border-slate-200',
    running: 'bg-blue-50 border-blue-200',
    completed: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    expired: 'bg-gray-50 border-gray-200',
  };

  return (
    <Card className={`p-4 border ${statusColor[scenario.status]}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm">{scenario.name}</h3>
              {isRecommended && (
                <Badge className="bg-green-600 text-xs">RECOMMENDED</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {scenario.products_included?.join(', ').toUpperCase() || 'No products'}
            </p>
          </div>
          <Button size="icon" variant="ghost" className="h-8 w-8">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {scenario.status.replace(/_/g, ' ').toUpperCase()}
          </Badge>
          {scenario.status === 'completed' && (
            <span className="text-xs text-muted-foreground">
              {scenario.quoted_at ? `Quoted ${format(new Date(scenario.quoted_at), 'MMM d')}` : ''}
            </span>
          )}
        </div>

        {/* Financial Summary */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Monthly Premium</span>
            <span className="font-semibold">{metrics.totalMonthly}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Employer Cost</span>
            <span className="font-semibold text-blue-600">{metrics.employerMonthly}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Avg Employee Cost</span>
            <span className="font-semibold text-purple-600">{metrics.employeeMonthly}</span>
          </div>
        </div>

        {/* Cost Split */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Cost Split</span>
            <span>{metrics.employerPercent}% / {100 - metrics.employerPercent}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden flex">
            <div
              className="bg-blue-500"
              style={{ width: `${metrics.employerPercent}%` }}
            />
            <div className="bg-purple-500 flex-1" />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Employer</span>
            <span>Employee</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={() => onSelect?.(scenario.id)}>
            View Details
          </Button>
          {onDelete && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete?.(scenario.id)}
            >
              Delete
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}