import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Save, RotateCcw } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function AdvancedFilterPanel({
  filters = [], // [{ key, label, type, value }, ...]
  onFilterChange = () => {}, // (updatedFilters) => {}
  onSave = () => {}, // (presetName) => {}
  onLoadPreset = () => {}, // (presetName) => {}
  presets = [], // ["My Active Cases", ...]
  filterOptions = {}, // { fieldName: [{ label, value }, ...], ... }
}) {
  const [activeFilters, setActiveFilters] = useState(filters);
  const [presetName, setPresetName] = useState("");

  const handleAddFilter = () => {
    const newFilters = [
      ...activeFilters,
      { key: "", label: "", type: "text", value: "", operator: "equals" },
    ];
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleRemoveFilter = (index) => {
    const newFilters = activeFilters.filter((_, i) => i !== index);
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleFilterChange = (index, field, val) => {
    const newFilters = [...activeFilters];
    newFilters[index] = { ...newFilters[index], [field]: val };
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    setActiveFilters([]);
    onFilterChange([]);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          🔍 Filters
          {activeFilters.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFilters.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Advanced Filters</h3>
          {activeFilters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="gap-1 text-xs"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </Button>
          )}
        </div>

        {/* Active Filters */}
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {activeFilters.map((filter, idx) => (
            <div key={idx} className="flex gap-2 items-end">
              <Select value={filter.key} onValueChange={(val) => handleFilterChange(idx, "key", val)}>
                <SelectTrigger className="w-24 h-8 text-xs">
                  <SelectValue placeholder="Field" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(filterOptions).map((key) => (
                    <SelectItem key={key} value={key}>
                      {key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {filter.type === "select" ? (
                <Select value={filter.value} onValueChange={(val) => handleFilterChange(idx, "value", val)}>
                  <SelectTrigger className="flex-1 h-8 text-xs">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions[filter.key]?.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type="text"
                  placeholder="Value"
                  value={filter.value}
                  onChange={(e) => handleFilterChange(idx, "value", e.target.value)}
                  className="flex-1 h-8 text-xs"
                />
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveFilter(idx)}
                className="h-8 w-8 p-0"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>

        {/* Add Filter Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddFilter}
          className="w-full gap-1.5 text-xs h-8"
        >
          <Plus className="w-3 h-3" /> Add Filter
        </Button>

        {/* Save/Load Presets */}
        {presets.length > 0 && (
          <>
            <div className="border-t pt-2">
              <p className="text-xs font-semibold mb-1.5">Saved Presets:</p>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((preset) => (
                  <Button
                    key={preset}
                    variant="secondary"
                    size="sm"
                    className="text-[11px] h-7"
                    onClick={() => onLoadPreset(preset)}
                  >
                    {preset}
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}

        {activeFilters.length > 0 && (
          <div className="flex gap-2 border-t pt-2">
            <Input
              placeholder="Save as preset..."
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              className="h-8 text-xs"
            />
            <Button
              size="sm"
              onClick={() => {
                if (presetName) {
                  onSave(presetName);
                  setPresetName("");
                }
              }}
              className="gap-1 text-xs h-8"
            >
              <Save className="w-3 h-3" /> Save
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}