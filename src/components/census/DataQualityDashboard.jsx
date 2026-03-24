import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function DataQualityDashboard({ members, version }) {
  const qualityStats = useMemo(() => {
    if (!members || members.length === 0) {
      return { score: 0, total: 0, issues: [] };
    }

    const requiredFields = ['first_name', 'last_name', 'date_of_birth', 'email'];
    const issues = [];
    let totalValid = 0;

    members.forEach((member, idx) => {
      const row = idx + 2; // +2 for header + 1-indexed
      let rowValid = true;

      requiredFields.forEach(field => {
        if (!member[field]) {
          issues.push({ row, field, type: 'missing', message: `Missing ${field}` });
          rowValid = false;
        }
      });

      if (member.date_of_birth && isNaN(new Date(member.date_of_birth).getTime())) {
        issues.push({ row, field: 'date_of_birth', type: 'invalid', message: 'Invalid date format' });
        rowValid = false;
      }

      if (member.email && !member.email.includes('@')) {
        issues.push({ row, field: 'email', type: 'invalid', message: 'Invalid email' });
        rowValid = false;
      }

      if (rowValid) totalValid++;
    });

    const score = Math.round((totalValid / members.length) * 100);

    return { score, total: members.length, issues, valid: totalValid };
  }, [members]);

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium">Data Quality Score</p>
              <span className={`text-2xl font-bold ${qualityStats.score >= 90 ? 'text-green-600' : qualityStats.score >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                {qualityStats.score}%
              </span>
            </div>
            <Progress value={qualityStats.score} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {qualityStats.valid} of {qualityStats.total} records valid
            </p>
          </div>

          {qualityStats.issues.length > 0 && (
            <div className="space-y-2 pt-4 border-t">
              <p className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                {qualityStats.issues.length} Issues Found
              </p>
              <div className="space-y-1 max-h-48 overflow-y-auto text-xs">
                {qualityStats.issues.slice(0, 20).map((issue, idx) => (
                  <div key={idx} className="flex justify-between p-2 bg-muted rounded text-muted-foreground">
                    <span>Row {issue.row}: {issue.message}</span>
                  </div>
                ))}
                {qualityStats.issues.length > 20 && (
                  <p className="text-muted-foreground p-2">+{qualityStats.issues.length - 20} more issues</p>
                )}
              </div>
            </div>
          )}

          {qualityStats.issues.length === 0 && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded text-green-700 text-sm">
              <CheckCircle className="w-4 h-4" />
              All records valid. Ready to proceed.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}