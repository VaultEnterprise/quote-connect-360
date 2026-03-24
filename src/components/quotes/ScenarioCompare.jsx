import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function ScenarioCompare({ scenarios = [] }) {
  const [compareMetric, setCompareMetric] = useState('total_monthly_premium');

  const chartData = useMemo(() => {
    if (scenarios.length === 0) return [];

    return scenarios.map(s => ({
      name: s.name?.substring(0, 12) || 'Scenario',
      totalPremium: s.total_monthly_premium || 0,
      employerCost: s.employer_monthly_cost || 0,
      employeeCost: s.employee_monthly_cost_avg || 0,
      fullName: s.name,
    }));
  }, [scenarios]);

  const comparison = useMemo(() => {
    if (scenarios.length < 2) return null;

    const first = scenarios[0];
    const second = scenarios[1];

    const premiumDiff = (second.total_monthly_premium - first.total_monthly_premium) || 0;
    const costDiff = (second.employer_monthly_cost - first.employer_monthly_cost) || 0;

    return {
      premiumDiff,
      premiumPercent: first.total_monthly_premium ? ((premiumDiff / first.total_monthly_premium) * 100).toFixed(1) : 0,
      costDiff,
      costPercent: first.employer_monthly_cost ? ((costDiff / first.employer_monthly_cost) * 100).toFixed(1) : 0,
    };
  }, [scenarios]);

  if (scenarios.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-muted-foreground">Add at least one scenario to compare</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Chart */}
      <Card className="p-4">
        <p className="text-sm font-semibold mb-4">Premium Comparison</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
            <Legend />
            <Bar dataKey="totalPremium" fill="#3b82f6" name="Total Premium" />
            <Bar dataKey="employerCost" fill="#8b5cf6" name="Employer Cost" />
            <Bar dataKey="employeeCost" fill="#ec4899" name="Avg Employee Cost" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Comparison Table */}
      <Card className="p-4">
        <p className="text-sm font-semibold mb-4">Detailed Comparison</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-semibold text-muted-foreground">Metric</th>
                {scenarios.map(s => (
                  <th key={s.id} className="text-right py-2 font-semibold px-4">
                    {s.name?.substring(0, 16)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b hover:bg-muted/50">
                <td className="py-3 font-medium">Total Monthly Premium</td>
                {scenarios.map(s => (
                  <td key={s.id} className="text-right py-3 px-4 font-semibold">
                    ${(s.total_monthly_premium || 0).toLocaleString()}
                  </td>
                ))}
              </tr>
              <tr className="border-b hover:bg-muted/50">
                <td className="py-3 font-medium">Employer Monthly Cost</td>
                {scenarios.map(s => (
                  <td key={s.id} className="text-right py-3 px-4 text-blue-600 font-semibold">
                    ${(s.employer_monthly_cost || 0).toLocaleString()}
                  </td>
                ))}
              </tr>
              <tr className="border-b hover:bg-muted/50">
                <td className="py-3 font-medium">Avg Employee Cost</td>
                {scenarios.map(s => (
                  <td key={s.id} className="text-right py-3 px-4 text-purple-600 font-semibold">
                    ${(s.employee_monthly_cost_avg || 0).toLocaleString()}
                  </td>
                ))}
              </tr>
              <tr className="border-b hover:bg-muted/50">
                <td className="py-3 font-medium">Plan Count</td>
                {scenarios.map(s => (
                  <td key={s.id} className="text-right py-3 px-4">
                    {s.plan_count || 0} plans
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-muted/50">
                <td className="py-3 font-medium">Status</td>
                {scenarios.map(s => (
                  <td key={s.id} className="text-right py-3 px-4">
                    <Badge variant="outline" className="text-xs">
                      {s.status}
                    </Badge>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Summary Comparison */}
      {comparison && scenarios.length >= 2 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <p className="text-sm font-semibold mb-3">Difference: {scenarios[1].name} vs {scenarios[0].name}</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Premium Difference</span>
              <div className="flex items-center gap-2">
                {comparison.premiumDiff !== 0 && (
                  <>
                    {comparison.premiumDiff > 0 ? (
                      <ArrowUpRight className="w-4 h-4 text-red-600" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-green-600" />
                    )}
                    <span className={comparison.premiumDiff > 0 ? 'text-red-600' : 'text-green-600'}>
                      ${Math.abs(comparison.premiumDiff).toLocaleString()} ({comparison.premiumPercent}%)
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Employer Cost Difference</span>
              <div className="flex items-center gap-2">
                {comparison.costDiff !== 0 && (
                  <>
                    {comparison.costDiff > 0 ? (
                      <ArrowUpRight className="w-4 h-4 text-red-600" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-green-600" />
                    )}
                    <span className={comparison.costDiff > 0 ? 'text-red-600' : 'text-green-600'}>
                      ${Math.abs(comparison.costDiff).toLocaleString()} ({comparison.costPercent}%)
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}