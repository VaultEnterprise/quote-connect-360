import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ContributionComparePanel({ models = [] }) {
  const comparisonData = useMemo(() => {
    if (models.length === 0) return [];

    return [
      {
        metric: 'Employer Cost',
        ...Object.fromEntries(models.map(m => [m.name, m.total_monthly_employer_cost || 0])),
      },
      {
        metric: 'Employee Avg',
        ...Object.fromEntries(models.map(m => [m.name, m.avg_employee_cost_ee_only || 0])),
      },
      {
        metric: 'Total Premium',
        ...Object.fromEntries(models.map(m => [m.name, m.total_monthly_premium || 0])),
      },
    ];
  }, [models]);

  if (models.length === 0) {
    return (
      <Card className="p-4 text-center text-muted-foreground text-sm">
        No contribution models to compare.
      </Card>
    );
  }

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-4">
      {/* Model Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {models.map((model, idx) => (
          <Card key={model.id} className="p-4 border-l-4" style={{ borderLeftColor: colors[idx % colors.length] }}>
            <div className="flex justify-between items-start mb-3">
              <p className="font-semibold text-sm">{model.name}</p>
              <Badge variant="outline" className="text-xs">{model.strategy}</Badge>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Employer Cost</span>
                <strong>${(model.total_monthly_employer_cost || 0).toFixed(0)}/mo</strong>
              </div>
              <div className="flex justify-between pb-2 border-b">
                <span className="text-muted-foreground">Employee Avg</span>
                <strong>${(model.avg_employee_cost_ee_only || 0).toFixed(0)}/mo</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">EE Contribution</span>
                <strong>{model.ee_contribution_pct || model.ee_contribution_flat ? `${model.ee_contribution_pct || 0}%` : 'Custom'}</strong>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Comparison Chart */}
      {comparisonData.length > 0 && (
        <Card className="p-4">
          <p className="text-sm font-semibold mb-4">Cost Comparison</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="metric" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => `$${value.toFixed(0)}`} />
              <Legend />
              {models.map((model, idx) => (
                <Bar key={model.id} dataKey={model.name} fill={colors[idx % colors.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Affordability Check */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-sm font-semibold mb-2">ACA Affordability</p>
        <div className="space-y-1 text-xs text-blue-900">
          {models.map((model, idx) => (
            <div key={model.id} className="flex justify-between">
              <span>{model.name}</span>
              <span>{model.aca_affordability_flag ? '✓ Passes' : '⚠ Review'}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}