import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, ChevronDown } from 'lucide-react';

export default function FilterPanel({
  filters = [],
  onFilterChange,
  onReset,
  compact = false,
}) {
  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  if (!filters.length) return null;

  const filterGroups = filters.reduce((acc, filter) => {
    const group = filter.group || 'Other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(filter);
    return acc;
  }, {});

  return (
    <Card className={`p-4 ${compact ? 'space-y-3' : 'space-y-4'}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Filters</h3>
        {onReset && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-xs"
          >
            Reset All
          </Button>
        )}
      </div>

      <div className={`space-y-${compact ? 2 : 4}`}>
        {Object.entries(filterGroups).map(([groupName, groupFilters]) => (
          <div key={groupName} className="space-y-2">
            <button
              className="flex items-center gap-2 w-full px-2 py-1 hover:bg-muted rounded transition-colors"
              onClick={() => toggleGroup(groupName)}
            >
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform ${
                  expandedGroups[groupName] ? 'rotate-180' : '-rotate-90'
                }`}
              />
              <span className="text-sm font-semibold">{groupName}</span>
            </button>

            {expandedGroups[groupName] && (
              <div className="space-y-2 pl-6">
                {groupFilters.map(filter => (
                  <div key={filter.id} className="flex items-center gap-2">
                    {filter.type === 'checkbox' && (
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={filter.id}
                          checked={filter.value}
                          onCheckedChange={(checked) =>
                            onFilterChange?.({
                              ...filter,
                              value: checked,
                            })
                          }
                        />
                        <label
                          htmlFor={filter.id}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {filter.label}
                        </label>
                      </div>
                    )}

                    {filter.type === 'select' && (
                      <Select
                        value={filter.value || ''}
                        onValueChange={(val) =>
                          onFilterChange?.({ ...filter, value: val })
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder={filter.label} />
                        </SelectTrigger>
                        <SelectContent>
                          {filter.options?.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {filter.type === 'text' && (
                      <Input
                        type="text"
                        placeholder={filter.label}
                        value={filter.value || ''}
                        onChange={(e) =>
                          onFilterChange?.({ ...filter, value: e.target.value })
                        }
                        className="h-8 text-xs"
                      />
                    )}

                    {filter.value && filter.clearable !== false && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 flex-shrink-0"
                        onClick={() => onFilterChange?.({ ...filter, value: null })}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}