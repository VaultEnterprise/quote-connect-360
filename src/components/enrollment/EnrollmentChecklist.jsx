import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

const DEFAULT_ITEMS = [
  { id: 'materials', label: 'Educational materials prepared', category: 'Preparation' },
  { id: 'comms_plan', label: 'Communication plan defined', category: 'Preparation' },
  { id: 'dates_set', label: 'Enrollment dates confirmed', category: 'Preparation' },
  { id: 'employees_notified', label: 'Employees notified', category: 'Communication' },
  { id: 'reminders_scheduled', label: 'Reminder emails scheduled', category: 'Communication' },
  { id: 'faq_ready', label: 'FAQ page ready', category: 'Communication' },
  { id: 'provider_directory', label: 'Provider directories shared', category: 'Resources' },
  { id: 'sbc_docs', label: 'SBC documents prepared', category: 'Resources' },
];

export default function EnrollmentChecklist({ onStatusChange }) {
  const [checked, setChecked] = useState({});

  const handleCheck = (id) => {
    const updated = { ...checked, [id]: !checked[id] };
    setChecked(updated);
    onStatusChange(updated);
  };

  const categories = [...new Set(DEFAULT_ITEMS.map(i => i.category))];
  const totalChecked = Object.values(checked).filter(Boolean).length;
  const progress = Math.round((totalChecked / DEFAULT_ITEMS.length) * 100);

  return (
    <Card className="p-6 space-y-4">
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">Pre-Enrollment Checklist</h3>
          <span className="text-sm font-medium text-primary">{totalChecked}/{DEFAULT_ITEMS.length}</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="space-y-4">
        {categories.map(category => (
          <div key={category}>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">{category}</p>
            <div className="space-y-2">
              {DEFAULT_ITEMS.filter(i => i.category === category).map(item => (
                <label key={item.id} className="flex items-center gap-3 p-2 hover:bg-muted rounded cursor-pointer">
                  <Checkbox
                    checked={checked[item.id] || false}
                    onCheckedChange={() => handleCheck(item.id)}
                  />
                  <span className="text-sm">{item.label}</span>
                  {checked[item.id] && <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {totalChecked === DEFAULT_ITEMS.length && (
        <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm font-medium text-center">
          ✓ All items complete. Ready to launch enrollment.
        </div>
      )}
    </Card>
  );
}