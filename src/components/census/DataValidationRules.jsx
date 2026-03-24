import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

const VALIDATION_RULES = [
  { key: 'required_names', label: 'First & Last Names', severity: 'critical' },
  { key: 'valid_emails', label: 'Email Format', severity: 'high' },
  { key: 'dob_format', label: 'Date of Birth Format', severity: 'high' },
  { key: 'hire_date_logical', label: 'Hire Date Logic', severity: 'medium' },
  { key: 'employment_status', label: 'Employment Status Valid', severity: 'medium' },
  { key: 'salary_range', label: 'Salary in Range', severity: 'low' },
  { key: 'coverage_tier', label: 'Coverage Tier Valid', severity: 'medium' },
  { key: 'dependent_count', label: 'Dependent Count Match', severity: 'low' },
];

export default function DataValidationRules({ members = [] }) {
  const validationResults = useMemo(() => {
    if (!members || members.length === 0) {
      return VALIDATION_RULES.map(rule => ({ ...rule, passed: 0, failed: 0, warnings: 0 }));
    }

    return VALIDATION_RULES.map(rule => {
      let passed = 0, failed = 0, warnings = 0;

      members.forEach(member => {
        if (rule.key === 'required_names' && member.first_name && member.last_name) passed++;
        else if (rule.key === 'required_names') failed++;

        if (rule.key === 'valid_emails' && member.email?.includes('@')) passed++;
        else if (rule.key === 'valid_emails') warnings++;

        if (rule.key === 'dob_format' && member.date_of_birth) passed++;
        else if (rule.key === 'dob_format') failed++;

        if (rule.key === 'employment_status' && ['active', 'leave', 'terminated'].includes(member.employment_status)) passed++;
        else if (rule.key === 'employment_status') failed++;

        if (rule.key === 'coverage_tier' && member.coverage_tier) passed++;
        else if (rule.key === 'coverage_tier') warnings++;
      });

      return { ...rule, passed, failed, warnings };
    });
  }, [members]);

  const severityColor = {
    critical: 'text-red-600',
    high: 'text-orange-600',
    medium: 'text-yellow-600',
    low: 'text-blue-600',
  };

  return (
    <Card className="p-4 space-y-3">
      <p className="text-sm font-semibold">Validation Rules</p>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {validationResults.map(result => (
          <div key={result.key} className="p-3 border rounded hover:bg-muted/50">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {result.failed === 0 ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : result.warnings > 0 ? (
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <p className="text-sm font-medium">{result.label}</p>
              </div>
              <Badge variant="outline" className={`text-xs ${severityColor[result.severity]}`}>
                {result.severity}
              </Badge>
            </div>

            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="text-green-600">✓ {result.passed}</span>
              {result.warnings > 0 && <span className="text-yellow-600">⚠ {result.warnings}</span>}
              {result.failed > 0 && <span className="text-red-600">✕ {result.failed}</span>}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}