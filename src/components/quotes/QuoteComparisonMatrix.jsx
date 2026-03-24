import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

export default function QuoteComparisonMatrix({ scenarios }) {
  const [selectedScenarios, setSelectedScenarios] = useState(scenarios.slice(0, 2).map(s => s.id));

  const toggleSelection = (scenarioId) => {
    setSelectedScenarios(prev =>
      prev.includes(scenarioId)
        ? prev.filter(id => id !== scenarioId)
        : [...prev, scenarioId].slice(-3) // Max 3 comparisons
    );
  };

  const selected = scenarios.filter(s => selectedScenarios.includes(s.id));

  const fields = [
    { key: 'plan_count', label: 'Plan Count' },
    { key: 'total_monthly_premium', label: 'Total Premium' },
    { key: 'employer_monthly_cost', label: 'Employer Cost' },
    { key: 'employee_monthly_cost_avg', label: 'Avg Employee Cost' },
    { key: 'employer_contribution_ee', label: 'EE Contribution %' },
    { key: 'employer_contribution_dep', label: 'Dependent Contribution %' },
  ];

  return (
    <div className="space-y-4">
      {/* Scenario Selection */}
      <Card className="p-4">
        <p className="text-sm font-medium mb-3">Select Scenarios to Compare ({selectedScenarios.length}/3)</p>
        <div className="flex flex-wrap gap-2">
          {scenarios.map(scenario => (
            <label key={scenario.id} className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-muted">
              <Checkbox
                checked={selectedScenarios.includes(scenario.id)}
                onCheckedChange={() => toggleSelection(scenario.id)}
              />
              <span className="text-sm">{scenario.name}</span>
            </label>
          ))}
        </div>
      </Card>

      {/* Comparison Table */}
      {selected.length > 0 && (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted">
                <th className="text-left p-3 font-semibold">Metric</th>
                {selected.map(scenario => (
                  <th key={scenario.id} className="text-left p-3 font-semibold">{scenario.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fields.map((field, idx) => (
                <tr key={field.key} className={idx % 2 === 0 ? 'bg-card' : 'bg-muted/30'}>
                  <td className="p-3 font-medium text-muted-foreground">{field.label}</td>
                  {selected.map(scenario => (
                    <td key={scenario.id} className="p-3">
                      {field.key.includes('cost') || field.key.includes('premium')
                        ? `$${(scenario[field.key] || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`
                        : field.key.includes('contribution')
                        ? `${scenario[field.key] || 0}%`
                        : scenario[field.key] || 'N/A'
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}