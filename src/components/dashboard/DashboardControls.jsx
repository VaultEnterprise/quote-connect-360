import React, { useMemo } from "react";
import { Bookmark, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DATE_RANGE_OPTIONS, DASHBOARD_VIEW_OPTIONS } from "@/utils/dashboardControls";
import { STAGE_OPTIONS } from "@/contracts/workflowRegistry";

const CASE_TYPE_OPTIONS = [
  { value: "new_business", label: "New Business" },
  { value: "renewal", label: "Renewal" },
  { value: "mid_year_change", label: "Mid-Year Change" },
  { value: "takeover", label: "Takeover" },
];

function normalizeOptions(options, includeAllLabel = "All") {
  const dedupedOptions = (options || [])
    .filter((option) => option?.value !== undefined && option?.value !== null)
    .map((option) => {
      const normalizedValue = String(option.value).trim();
      const normalizedLabel = String(option.label ?? option.value).trim();
      return { value: normalizedValue, label: normalizedLabel || normalizedValue || "Unknown" };
    })
    .filter((option) => option.value && option.value !== "all")
    .filter((option, index, array) => array.findIndex((candidate) => candidate.value === option.value) === index);

  return [{ value: "all", label: includeAllLabel }, ...dedupedOptions];
}

function NativeSelect({ value, onValueChange, options, className }) {
  const safeOptions = useMemo(() => normalizeOptions(options), [options]);
  const normalizedValue = typeof value === "string" ? value.trim() : String(value ?? "all").trim();
  const safeValue = safeOptions.some((option) => option.value === normalizedValue) ? normalizedValue : "all";

  return (
    <select
      value={safeValue}
      onChange={(event) => onValueChange(event.target.value)}
      className={cn("flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring", className)}
    >
      {safeOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function FilterSelect({ value, onValueChange, placeholder, options }) {
  return <NativeSelect value={value} onValueChange={onValueChange} options={options} className="h-9" />;
}

export default function DashboardControls({
  filters,
  options,
  presets,
  selectedPresetId,
  onChange,
  onPresetChange,
  onSaveView,
  onSetDefault,
  onRefresh,
  isRefreshing,
  lastUpdated,
}) {
  const safePresets = useMemo(
    () => (presets || [])
      .filter((preset) => preset?.id)
      .map((preset) => ({
        ...preset,
        id: String(preset.id).trim(),
        name: String(preset.name || "Untitled view").trim() || "Untitled view",
      }))
      .filter((preset) => preset.id && preset.id !== "none")
      .filter((preset, index, array) => array.findIndex((candidate) => candidate.id === preset.id) === index),
    [presets]
  );

  const safeSelectedPresetId = safePresets.some((preset) => preset.id === selectedPresetId) ? selectedPresetId : "none";

  return (
    <div className="space-y-4 rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {DASHBOARD_VIEW_OPTIONS.map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={filters.viewMode === option.value ? "default" : "outline"}
              onClick={() => onChange("viewMode", option.value)}
            >
              {option.label}
            </Button>
          ))}
          <Badge variant="outline" className="h-8 px-3 text-xs">
            Comparing to previous period
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filters.dateRange}
            onChange={(event) => onChange("dateRange", event.target.value)}
            className="flex h-9 w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {DATE_RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={safeSelectedPresetId}
            onChange={(event) => onPresetChange(event.target.value)}
            className="flex h-9 w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="none">Saved views</option>
            {safePresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>

          <Button size="sm" variant="outline" onClick={onSaveView}>
            <Bookmark className="w-3.5 h-3.5" /> Save view
          </Button>

          <Button size="sm" variant="outline" onClick={onSetDefault} disabled={!selectedPresetId || selectedPresetId === "none"}>
            Set default
          </Button>

          <Button size="sm" variant="outline" onClick={onRefresh}>
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
        <FilterSelect value={filters.owner} onValueChange={(value) => onChange("owner", value)} placeholder="Owner" options={options.owners} />
        <FilterSelect value={filters.team} onValueChange={(value) => onChange("team", value)} placeholder="Team" options={options.teams} />
        <FilterSelect value={filters.agencyId} onValueChange={(value) => onChange("agencyId", value)} placeholder="Agency" options={options.agencies} />
        <FilterSelect value={filters.employerId} onValueChange={(value) => onChange("employerId", value)} placeholder="Employer" options={options.employers} />
        <FilterSelect value={filters.caseType} onValueChange={(value) => onChange("caseType", value)} placeholder="Case type" options={CASE_TYPE_OPTIONS} />
        <FilterSelect
          value={filters.stage}
          onValueChange={(value) => onChange("stage", value)}
          placeholder="Stage"
          options={STAGE_OPTIONS.filter((option) => option.value !== "all")}
        />
      </div>

      <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>Last updated: {lastUpdated || "Waiting for data"}</span>
        <span>Saved views and defaults are personalized to the current user.</span>
      </div>
    </div>
  );
}