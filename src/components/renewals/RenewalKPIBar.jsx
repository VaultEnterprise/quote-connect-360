import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

export default function RenewalKPIBar({ renewals = [] }) {
  const metrics = useMemo(() => {
    const total = renewals.length;
    const byStatus = {
      pre_renewal: renewals.filter(r => r.status === 'pre_renewal').length,
      marketed: renewals.filter(r => r.status === 'marketed').length,
      options_prepared: renewals.filter(r => r.status === 'options_prepared').length,
      decision_made: renewals.filter(r => r.status === 'decision_made').length,
      active: renewals.filter(r => ['active_renewal', 'completed'].includes(r.status)).length,
    };

    const highRisk = renewals.filter(r => (r.disruption_score || 0) > 70).length;
    const avgRateChange = renewals.length > 0 
      ? (renewals.reduce((sum, r) => sum + (r.rate_change_percent || 0), 0) / renewals.length).toFixed(1)
      : 0;

    return { total, byStatus, highRisk, avgRateChange };
  }, [renewals]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {/* Total Renewals */}
      <Card className="p-4 text-center hover:shadow-md transition-shadow">
        <div className="flex justify-center mb-2">
          <Briefcase className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-xs text-muted-foreground mb-1">Total Renewals</p>
        <p className="text-2xl font-bold">{metrics.total}</p>
      </Card>

      {/* Pre-Renewal */}
      <Card className="p-4 text-center border-slate-200 bg-slate-50 hover:shadow-md transition-shadow">
        <div className="flex justify-center mb-2">
          <Briefcase className="w-5 h-5 text-slate-600" />
        </div>
        <p className="text-xs text-muted-foreground mb-1">Pre-Renewal</p>
        <p className="text-2xl font-bold text-slate-600">{metrics.byStatus.pre_renewal}</p>
      </Card>

      {/* In Progress */}
      <Card className="p-4 text-center border-blue-200 bg-blue-50 hover:shadow-md transition-shadow">
        <div className="flex justify-center mb-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
        </div>
        <p className="text-xs text-muted-foreground mb-1">In Progress</p>
        <p className="text-2xl font-bold text-blue-600">
          {metrics.byStatus.marketed + metrics.byStatus.options_prepared + metrics.byStatus.decision_made}
        </p>
      </Card>

      {/* High Risk */}
      <Card className="p-4 text-center border-orange-200 bg-orange-50 hover:shadow-md transition-shadow">
        <div className="flex justify-center mb-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
        </div>
        <p className="text-xs text-muted-foreground mb-1">High Risk</p>
        <p className="text-2xl font-bold text-orange-600">{metrics.highRisk}</p>
      </Card>

      {/* Average Rate Change */}
      <Card className="p-4 col-span-2 sm:col-span-4 text-center border-purple-200 bg-purple-50">
        <div className="flex items-center justify-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-2">Average Rate Change</p>
            <div className="flex items-baseline justify-center gap-2">
              <span className={`text-3xl font-bold ${metrics.avgRateChange > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {metrics.avgRateChange > 0 ? '+' : ''}{metrics.avgRateChange}%
              </span>
              <span className="text-sm text-muted-foreground">across all renewals</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}