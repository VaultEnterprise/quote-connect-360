import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

export default function PlanComparisonGrid({ plans }) {
  const [selected, setSelected] = useState([]);

  const togglePlan = (planId) => {
    setSelected(prev =>
      prev.includes(planId)
        ? prev.filter(id => id !== planId)
        : [...prev, planId].slice(-3) // Max 3
    );
  };

  const selectedPlans = plans.filter(p => selected.includes(p.id));

  const features = [
    { key: 'carrier', label: 'Carrier' },
    { key: 'network_type', label: 'Network' },
    { key: 'deductible_individual', label: 'Individual Deductible' },
    { key: 'copay_pcp', label: 'PCP Copay' },
    { key: 'copay_specialist', label: 'Specialist Copay' },
    { key: 'copay_er', label: 'ER Copay' },
    { key: 'coinsurance', label: 'Coinsurance' },
    { key: 'oop_max_individual', label: 'OOP Max' },
  ];

  return (
    <div className="space-y-4">
      {/* Plan Selection */}
      <Card className="p-4">
        <p className="text-sm font-medium mb-3">Select Plans to Compare ({selected.length}/3)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
          {plans.map(plan => (
            <label key={plan.id} className="flex items-center gap-2 p-2 border rounded hover:bg-muted cursor-pointer">
              <Checkbox
                checked={selected.includes(plan.id)}
                onCheckedChange={() => togglePlan(plan.id)}
              />
              <span className="text-sm font-medium">{plan.plan_name}</span>
            </label>
          ))}
        </div>
      </Card>

      {/* Comparison Table */}
      {selectedPlans.length > 0 && (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted">
                <th className="text-left p-3 font-semibold">Feature</th>
                {selectedPlans.map(plan => (
                  <th key={plan.id} className="text-left p-3 font-semibold">{plan.plan_name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((feature, idx) => (
                <tr key={feature.key} className={idx % 2 === 0 ? 'bg-card' : 'bg-muted/30'}>
                  <td className="p-3 font-medium text-muted-foreground">{feature.label}</td>
                  {selectedPlans.map(plan => (
                    <td key={plan.id} className="p-3">
                      {feature.key.includes('copay') || feature.key.includes('deductible') || feature.key.includes('oop')
                        ? `$${plan[feature.key] || 0}`
                        : feature.key.includes('coinsurance')
                        ? `${plan[feature.key] || 0}%`
                        : plan[feature.key] || 'N/A'
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