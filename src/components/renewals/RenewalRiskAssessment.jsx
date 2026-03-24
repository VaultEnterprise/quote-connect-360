import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RenewalRiskAssessment({ renewal, historicalData = [] }) {
  const riskFactors = useMemo(() => {
    const factors = [];

    if (renewal.rate_change_percent > 10) {
      factors.push({
        label: 'High Rate Increase',
        value: `${renewal.rate_change_percent.toFixed(1)}%`,
        severity: 'critical',
      });
    }

    if (renewal.disruption_score > 70) {
      factors.push({
        label: 'High Disruption Risk',
        value: `${renewal.disruption_score}/100`,
        severity: 'high',
      });
    }

    if (!renewal.recommendation || renewal.recommendation === 'market') {
      factors.push({
        label: 'Market Recommendation',
        value: 'Explore alternatives',
        severity: 'medium',
      });
    }

    return factors;
  }, [renewal]);

  const riskLevel = renewal.disruption_score > 70 ? 'high' : renewal.disruption_score > 40 ? 'medium' : 'low';

  return (
    <div className="space-y-4">
      {/* Risk Score */}
      <Card className="p-4">
        <p className="text-sm font-semibold mb-3">Overall Risk Score</p>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  riskLevel === 'high' ? 'bg-red-500' : riskLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${renewal.disruption_score || 0}%` }}
              />
            </div>
          </div>
          <Badge variant={riskLevel === 'high' ? 'destructive' : riskLevel === 'medium' ? 'outline' : 'secondary'}>
            {renewal.disruption_score || 0}/100
          </Badge>
        </div>
      </Card>

      {/* Risk Factors */}
      {riskFactors.length > 0 && (
        <Card className="p-4 space-y-3">
          <p className="text-sm font-semibold">Risk Factors</p>
          {riskFactors.map((factor, idx) => (
            <div key={idx} className="flex items-start gap-2 p-2 bg-muted rounded">
              <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                factor.severity === 'critical' ? 'text-red-600' :
                factor.severity === 'high' ? 'text-orange-600' : 'text-yellow-600'
              }`} />
              <div className="flex-1">
                <p className="text-sm font-medium">{factor.label}</p>
                <p className="text-xs text-muted-foreground">{factor.value}</p>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Historical Trend */}
      {historicalData.length > 0 && (
        <Card className="p-4">
          <p className="text-sm font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Premium Trend
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Line type="monotone" dataKey="premium" stroke="#0ea5e9" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}