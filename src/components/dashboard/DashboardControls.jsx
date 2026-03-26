import React from "react";
import { Bookmark, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DATE_RANGE_OPTIONS, DASHBOARD_VIEW_OPTIONS } from "@/utils/dashboardControls";

const CASE_TYPE_OPTIONS = [
  { value: "new_business", label: "New Business" },
  { value: "renewal", label: "Renewal" },
  { value: "mid_year_change", label: "Mid-Year Change" },
  { value: "takeover", label: "Takeover" },
];

const STAGE_OPTIONS = [
  "draft",
  "census_in_progress",
  "census_validated",
  "ready_for_quote",
  "quoting",
  "proposal_ready",
  "employer_review",
  "approved_for_enrollment",
  "enrollment_open",
  "enrollment_complete",
  "install_in_progress",
  "active",
  "renewal_pending",
  "renewed",
  "closed",
];

function FilterSelect({ value, onValueChange, placeholder, options }) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-9 bg-background">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
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
          <Select value={filters.dateRange} onValueChange={(value) => onChange("dateRange", value)}>
            <SelectTrigger className="h-9 w-[180px] bg-background">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedPresetId || "none"} onValueChange={onPresetChange}>
            <SelectTrigger className="h-9 w-[180px] bg-background">
              <SelectValue placeholder="Saved views" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Saved views</SelectItem>
              {presets.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  {preset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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
          options={STAGE_OPTIONS.map((value) => ({ value, label: value.replace(/_/g, " ") }))}
        />
      </div>

      <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>Last updated: {lastUpdated || "Waiting for data"}</span>
        <span>Saved views and defaults are personalized to the current user.</span>
      </div>
    </div>
  );
}