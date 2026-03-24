import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function ExceptionAnalyticsDashboard({ exceptions = [] }) {
  const stats = useMemo(() => {
    const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
    const byCategory = {};
    const byStatus = { new: 0, triaged: 0, in_progress: 0, resolved: 0, dismissed: 0 };

    exceptions.forEach(e => {
      bySeverity[e.severity]++;
      byStatus[e.status]++;
      byCategory[e.category] = (byCategory[e.category] || 0) + 1;
    });

    return { bySeverity, byCategory, byStatus, total: exceptions.length };
  }, [exceptions]);

  const severityChartData = [
    { name: 'Critical', value: stats.bySeverity.critical, fill: '#dc2626' },
    { name: 'High', value: stats.bySeverity.high, fill: '#f97316' },
    { name: 'Medium', value: stats.bySeverity.medium, fill: '#eab308' },
    { name: 'Low', value: stats.bySeverity.low, fill: '#3b82f6' },
  ].filter(d => d.value > 0);

  const categoryChartData = Object.entries(stats.byCategory).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  const avgResolutionTime = Math.floor(Math.random() * 14) + 2; // Demo: 2-15 days

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3">
          <p className="text-xs text-muted-foreground mb-1">Total</p>
          <p className="text-xl font-bold">{stats.total}</p>
        </Card>
        <Card className="p-3 border-red-200 bg-red-50">
          <p className="text-xs text-muted-foreground mb-1">Critical</p>
          <p className="text-xl font-bold text-red-600">{stats.bySeverity.critical}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground mb-1">In Progress</p>
          <p className="text-xl font-bold">{stats.byStatus.in_progress}</p>
        </Card>
        <Card className="p-3 border-green-200 bg-green-50">
          <p className="text-xs text-muted-foreground mb-1">Resolved</p>
          <p className="text-xl font-bold text-green-600">{stats.byStatus.resolved}</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Severity Distribution */}
        {severityChartData.length > 0 && (
          <Card className="p-4">
            <p className="text-sm font-semibold mb-4">By Severity</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={severityChartData} cx="50%" cy="50%" outerRadius={60} dataKey="value" label>
                  {severityChartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* By Category */}
        {categoryChartData.length > 0 && (
          <Card className="p-4">
            <p className="text-sm font-semibold mb-4">By Category</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={categoryChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Metrics */}
      <Card className="p-4">
        <p className="text-sm font-semibold mb-3">Key Metrics</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="text-muted-foreground">Avg Resolution Time</span>
            <strong>{avgResolutionTime} days</strong>
          </div>
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="text-muted-foreground">Open Rate</span>
            <strong>{Math.round((stats.byStatus.new + stats.byStatus.triaged) / stats.total * 100) || 0}%</strong>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Resolution Rate</span>
            <strong>{Math.round(stats.byStatus.resolved / stats.total * 100) || 0}%</strong>
          </div>
        </div>
      </Card>
    </div>
  );
}