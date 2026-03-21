// components/census/DataQualityInsights.tsx
// Data quality metrics and insights (Phase 3)

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';

interface DataQualityInsightsProps {
  members: any[];
}

export default function DataQualityInsights({ members }: DataQualityInsightsProps) {
  const insights = useMemo(() => {
    if (!members.length) return null;

    const coverage = {};
    const issues = {};

    members.forEach(m => {
      [
        'first_name', 'last_name', 'date_of_birth', 'email', 'phone', 'employee_id',
        'hire_date', 'employment_status', 'employment_type', 'hours_per_week',
        'annual_salary', 'department', 'coverage_tier'
      ].forEach(field => {
        coverage[field] = (coverage[field] || 0) + (m[field] ? 1 : 0);
      });
    });

    // Calculate coverage percentages
    const fieldCoverage = Object.entries(coverage).map(([field, count]) => ({
      field,
      coverage: ((count as number) / members.length) * 100,
    })).sort((a, b) => a.coverage - b.coverage);

    // Data quality issues
    const anomalies = [];

    // Age anomalies
    const ages = members
      .map(m => m.date_of_birth ? new Date().getFullYear() - new Date(m.date_of_birth).getFullYear() : null)
      .filter(a => a !== null);
    const avgAge = ages.reduce((a, b) => a + b, 0) / ages.length;
    const youngEmps = members.filter(m => {
      const age = m.date_of_birth ? new Date().getFullYear() - new Date(m.date_of_birth).getFullYear() : null;
      return age && age < 18;
    });
    if (youngEmps.length > 0) {
      anomalies.push({
        type: 'age_anomaly',
        count: youngEmps.length,
        message: `${youngEmps.length} members under 18 years old`,
        severity: 'warning'
      });
    }

    // Salary anomalies
    const salaries = members
      .map(m => m.annual_salary)
      .filter(s => s && !isNaN(s));
    const avgSalary = salaries.reduce((a, b) => a + b, 0) / salaries.length;
    const stdDevSalary = Math.sqrt(
      salaries.reduce((sq, n) => sq + Math.pow(n - avgSalary, 2), 0) / salaries.length
    );
    const outlierSalaries = salaries.filter(s => Math.abs(s - avgSalary) > 3 * stdDevSalary);
    if (outlierSalaries.length > 0) {
      anomalies.push({
        type: 'salary_outlier',
        count: outlierSalaries.length,
        message: `${outlierSalaries.length} salary outliers detected`,
        severity: 'info'
      });
    }

    // Missing required fields
    const missingRequired = [];
    const requiredFields = ['first_name', 'last_name', 'email'];
    requiredFields.forEach(field => {
      const missing = members.filter(m => !m[field]).length;
      if (missing > 0) {
        missingRequired.push({ field, count: missing });
      }
    });

    return {
      total: members.length,
      fieldCoverage,
      anomalies,
      missingRequired,
      avgAge: avgAge.toFixed(1),
      avgSalary: avgSalary.toFixed(0),
    };
  }, [members]);

  if (!insights) return null;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{insights.total}</p>
            <p className="text-xs text-muted-foreground">Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{insights.avgAge}</p>
            <p className="text-xs text-muted-foreground">Avg Age</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">${(parseInt(insights.avgSalary) / 1000).toFixed(0)}K</p>
            <p className="text-xs text-muted-foreground">Avg Salary</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{insights.fieldCoverage.filter(f => f.coverage === 100).length}</p>
            <p className="text-xs text-muted-foreground">Complete Fields</p>
          </CardContent>
        </Card>
      </div>

      {/* Field Coverage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Field Coverage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {insights.fieldCoverage.slice(0, 8).map(field => (
            <div key={field.field}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium capitalize">{field.field.replace(/_/g, ' ')}</span>
                <span className="text-xs text-muted-foreground">{field.coverage.toFixed(0)}%</span>
              </div>
              <Progress value={field.coverage} className="h-1.5" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Anomalies */}
      {insights.anomalies.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Data Quality Issues
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {insights.anomalies.map((anomaly, idx) => (
              <div key={idx} className="flex items-start gap-2 p-2 bg-amber-50 rounded">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-amber-900">{anomaly.message}</p>
                  <p className="text-xs text-amber-700 mt-0.5">Review for data quality</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {insights.missingRequired.length === 0 && (
        <div className="flex items-center gap-2 text-sm bg-green-50 border border-green-200 rounded-lg p-3">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <p className="text-green-700">All required fields populated</p>
        </div>
      )}
    </div>
  );
}