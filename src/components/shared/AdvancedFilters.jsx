import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Filter, X, Save, RotateCcw } from "lucide-react";

/**
 * AdvancedFilters
 * Reusable multi-field filter UI with preset saving.
 */
export default function AdvancedFilters({
  filters = [], // [{ key, label, type, options? }]
  values = {},
  onChange = () => {},
  onSavePreset = null,
  onLoadPreset = null,
  presets = [],
}) {
  const [open, setOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const activeCount = Object.values(values).filter(v => v && v !== "all").length;

  const handleReset = () => {
    const reset = {};
    filters.forEach(f => reset[f.key] = "all");
    onChange(reset);
  };

  const handleSavePreset = () => {
    if (presetName && onSavePreset) {
      onSavePreset(presetName, values);
      setPresetName("");
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        className="text-xs"
      >
        <Filter className="w-3.5 h-3.5 mr-1.5" />
        Filters
        {activeCount > 0 && <Badge className="ml-1.5 bg-primary text-primary-foreground">{activeCount}</Badge>}
      </Button>

      {open && (
        <Card className="absolute top-10 right-0 w-80 shadow-lg z-50">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Advanced Filters</CardTitle>
            <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => setOpen(false)}>
              <X className="w-3 h-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filter controls */}
            <div className="space-y-3">
              {filters.map(f => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-muted-foreground">{f.label}</label>
                  {f.type === "select" ? (
                    <Select value={values[f.key] || "all"} onValueChange={(v) => onChange({ ...values, [f.key]: v })}>
                      <SelectTrigger className="h-8 text-xs mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {f.options?.map(o => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : f.type === "text" ? (
                    <Input
                      placeholder={`Search ${f.label.toLowerCase()}...`}
                      value={values[f.key] || ""}
                      onChange={(e) => onChange({ ...values, [f.key]: e.target.value })}
                      className="h-8 text-xs mt-1"
                    />
                  ) : null}
                </div>
              ))}
            </div>

            {/* Preset controls */}
            {onSavePreset && (
              <div className="pt-3 border-t space-y-2">
                <div className="flex gap-1">
                  <Input
                    placeholder="Preset name..."
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    className="h-8 text-xs flex-1"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSavePreset}
                    disabled={!presetName}
                    className="h-8 text-xs"
                  >
                    <Save className="w-3 h-3" />
                  </Button>
                </div>
                {presets.length > 0 && (
                  <div className="text-xs font-medium mb-1">Saved Presets:</div>
                )}
                {presets.map(p => (
                  <Button
                    key={p.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (onLoadPreset) onLoadPreset(p.values);
                    }}
                    className="w-full justify-start text-xs text-muted-foreground hover:text-foreground"
                  >
                    {p.name}
                  </Button>
                ))}
              </div>
            )}

            {/* Reset button */}
            {activeCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="w-full text-xs"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}