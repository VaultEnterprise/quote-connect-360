import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronDown } from 'lucide-react';

const STANDARD_FIELDS = [
  'first_name', 'last_name', 'date_of_birth', 'gender', 'ssn_last4', 'email', 'phone',
  'address', 'city', 'state', 'zip', 'hire_date', 'employment_status', 'employment_type',
  'hours_per_week', 'annual_salary', 'job_title', 'department', 'location', 'is_eligible'
];

export default function CensusColumnMapper({ csvColumns, onMappingComplete }) {
  const [mapping, setMapping] = useState({});
  const [preview, setPreview] = useState([]);
  const [step, setStep] = useState('mapping');

  const handleFieldMap = (csvColumn, systemField) => {
    setMapping(prev => ({ ...prev, [csvColumn]: systemField }));
  };

  const handleSubmit = () => {
    onMappingComplete(mapping);
  };

  return (
    <div className="space-y-4">
      {step === 'mapping' && (
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold">Map CSV Columns to Fields</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {csvColumns.map((col) => (
              <div key={col} className="flex items-center gap-3">
                <div className="w-40">
                  <p className="text-sm font-medium text-muted-foreground truncate">{col}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                <Select value={mapping[col] || ''} onValueChange={(v) => handleFieldMap(col, v)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select field..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Skip this column</SelectItem>
                    {STANDARD_FIELDS.map((field) => (
                      <SelectItem key={field} value={field}>{field.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSubmit} className="flex-1">Map & Continue</Button>
          </div>
        </Card>
      )}
    </div>
  );
}