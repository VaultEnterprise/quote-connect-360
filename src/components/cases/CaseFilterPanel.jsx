import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronDown, X } from 'lucide-react';

export default function CaseFilterPanel({ onFilterChange, onSavePreset }) {
  const [expanded, setExpanded] = useState(false);
  const [filters, setFilters] = useState({
    searchTerm: '',
    status: '',
    stage: '',
    priority: '',
    dateFrom: '',
    dateTo: '',
  });
  const [presetName, setPresetName] = useState('');

  const stages = ['draft', 'census_in_progress', 'census_validated', 'ready_for_quote', 'quoting', 'proposal_ready', 'employer_review', 'approved_for_enrollment', 'enrollment_open', 'enrollment_complete', 'install_in_progress', 'active', 'renewal_pending', 'renewed', 'closed'];

  const handleChange = (key, value) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
    onFilterChange(updated);
  };

  const handleSave = () => {
    if (presetName.trim()) {
      onSavePreset(presetName, filters);
      setPresetName('');
    }
  };

  const hasFilters = Object.values(filters).some(v => v);

  return (
    <div className="space-y-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
      >
        <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        Filters {hasFilters && <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">Active</span>}
      </button>

      {expanded && (
        <Card className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Search Employer</label>
              <Input
                placeholder="Employer name..."
                value={filters.searchTerm}
                onChange={(e) => handleChange('searchTerm', e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
              <Select value={filters.status} onValueChange={(v) => handleChange('status', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>All</SelectItem>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Stage</label>
              <Select value={filters.stage} onValueChange={(v) => handleChange('stage', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Stages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>All</SelectItem>
                  {stages.map((s) => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Priority</label>
              <Select value={filters.priority} onValueChange={(v) => handleChange('priority', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>All</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">From Date</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleChange('dateFrom', e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">To Date</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleChange('dateTo', e.target.value)}
              />
            </div>
          </div>

          {hasFilters && (
            <div className="space-y-2 pt-2 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Save this filter as..."
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  className="flex-1"
                />
                <Button size="sm" onClick={handleSave}>Save Preset</Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center"
                onClick={() => {
                  setFilters({ searchTerm: '', status: '', stage: '', priority: '', dateFrom: '', dateTo: '' });
                  onFilterChange({ searchTerm: '', status: '', stage: '', priority: '', dateFrom: '', dateTo: '' });
                }}
              >
                <X className="w-4 h-4 mr-1" /> Clear All
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}