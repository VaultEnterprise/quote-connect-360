import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';

export default function CensusBulkEditModal({ isOpen, members, onClose, onApply }) {
  const [field, setField] = useState('');
  const [value, setValue] = useState('');

  const editableFields = [
    { key: 'employment_status', label: 'Employment Status', options: ['active', 'leave', 'terminated'] },
    { key: 'employment_type', label: 'Employment Type', options: ['full_time', 'part_time', 'contractor'] },
    { key: 'coverage_tier', label: 'Coverage Tier', options: ['employee_only', 'employee_spouse', 'employee_children', 'family'] },
    { key: 'is_eligible', label: 'Eligibility', options: ['true', 'false'] },
  ];

  const handleApply = () => {
    if (!field || !value) return;
    onApply({ field, value, memberCount: members.length });
    setField('');
    setValue('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Edit ({members.length} members)</DialogTitle>
        </DialogHeader>

        <Card className="p-4 bg-muted text-sm">
          <p className="text-muted-foreground">Apply changes to {members.length} selected members</p>
        </Card>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Field to Update</label>
            <Select value={field} onValueChange={setField}>
              <SelectTrigger>
                <SelectValue placeholder="Select a field" />
              </SelectTrigger>
              <SelectContent>
                {editableFields.map(f => (
                  <SelectItem key={f.key} value={f.key}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {field && (
            <div>
              <label className="text-sm font-medium mb-2 block">New Value</label>
              <Select value={value} onValueChange={setValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a value" />
                </SelectTrigger>
                <SelectContent>
                  {editableFields
                    .find(f => f.key === field)
                    ?.options.map(opt => (
                      <SelectItem key={opt} value={opt}>
                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleApply} disabled={!field || !value}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}