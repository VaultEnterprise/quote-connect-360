import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export default function RenewalCard({ renewal, onAction }) {
  const metrics = useMemo(() => {
    const rateChange = renewal.rate_change_percent || 0;
    const disruption = renewal.disruption_score || 0;

    const currentPremium = renewal.current_premium || 0;
    const renewalPremium = renewal.renewal_premium || 0;
    const premiumIncrease = renewalPremium - currentPremium;

    return {
      rateChange: rateChange.toFixed(1),
      rateChangePercent: Math.abs(rateChange).toFixed(1),
      disruption,
      currentPremium: currentPremium.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
      renewalPremium: renewalPremium.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
      premiumIncrease: Math.abs(premiumIncrease).toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
      isPriceIncrease: premiumIncrease > 0,
    };
  }, [renewal]);

  const daysToRenewal = useMemo(() => {
    return differenceInDays(new Date(renewal.renewal_date), new Date());
  }, [renewal.renewal_date]);

  const statusColor = {
    pre_renewal: 'bg-slate-50 border-slate-200',
    marketed: 'bg-blue-50 border-blue-200',
    options_prepared: 'bg-purple-50 border-purple-200',
    employer_review: 'bg-orange-50 border-orange-200',
    decision_made: 'bg-green-50 border-green-200',
    install_renewal: 'bg-indigo-50 border-indigo-200',
    active_renewal: 'bg-emerald-50 border-emerald-200',
    completed: 'bg-gray-50 border-gray-200',
  };

  const recommendationColor = {
    renew_as_is: 'bg-green-100 text-green-900 border-green-300',
    renew_with_changes: 'bg-blue-100 text-blue-900 border-blue-300',
    market: 'bg-orange-100 text-orange-900 border-orange-300',
    terminate: 'bg-red-100 text-red-900 border-red-300',
  };

  return (
    <Card className={`p-4 border ${statusColor[renewal.status]}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">{renewal.employer_name}</h3>
            <p className="text-xs text-muted-foreground">
              Renewal Date: {format(new Date(renewal.renewal_date), 'MMM d, yyyy')}
            </p>
          </div>
          <div className="text-right">
            <Badge variant="outline" className="text-xs">
              {renewal.status.replace(/_/g, ' ').toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Rate Change */}
        <div className="p-3 rounded border bg-white/50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Rate Change</span>
            <div className="flex items-center gap-1">
              {metrics.rateChange > 0 ? (
                <TrendingUp className="w-4 h-4 text-red-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-green-600" />
              )}
              <span className={metrics.rateChange > 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>
                {metrics.rateChange > 0 ? '+' : '-'}{metrics.rateChangePercent}%
              </span>
            </div>
          </div>
          <div className="mt-2 text-xs space-y-1">
            <p className="text-muted-foreground">Current: {metrics.currentPremium}</p>
            <p className="text-muted-foreground">Renewal: {metrics.renewalPremium}</p>
            <p className={metrics.isPriceIncrease ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
              {metrics.isPriceIncrease ? '+' : '-'}{metrics.premiumIncrease}
            </p>
          </div>
        </div>

        {/* Disruption Score */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Disruption Risk</span>
            <span className={`font-semibold ${metrics.disruption > 70 ? 'text-red-600' : metrics.disruption > 40 ? 'text-orange-600' : 'text-green-600'}`}>
              {metrics.disruption.toFixed(0)}/100
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all ${
                metrics.disruption > 70 ? 'bg-red-500' : metrics.disruption > 40 ? 'bg-orange-500' : 'bg-green-500'
              }`}
              style={{ width: `${metrics.disruption}%` }}
            />
          </div>
        </div>

        {/* Recommendation */}
        {renewal.recommendation && (
          <div className={`p-2 rounded border text-xs font-semibold ${recommendationColor[renewal.recommendation]}`}>
            {renewal.recommendation.replace(/_/g, ' ').toUpperCase()}
          </div>
        )}

        {/* Days to Renewal */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-4 h-4" />
          {daysToRenewal > 0 ? `${daysToRenewal} days until renewal` : 'Renewal date passed'}
        </div>

        {/* Actions */}
        {onAction && (
          <Button size="sm" className="w-full" onClick={() => onAction(renewal.id)}>
            View Details
          </Button>
        )}
      </div>
    </Card>
  );
}