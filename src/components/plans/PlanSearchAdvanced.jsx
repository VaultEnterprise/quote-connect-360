import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Filter, X } from "lucide-react";

export default function PlanSearchAdvanced({ onSearch }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState({
    deductible_max: "",
    network: "all",
    hsa_only: false,
    has_rates: false,
  });

  const applyFilters = () => {
    onSearch(filters);
    setShowAdvanced(false);
  };

  const clearFilters = () => {
    setFilters({
      deductible_max: "",
      network: "all",
      hsa_only: false,
      has_rates: false,
    });
  };

  const activeCount = Object.values(filters).filter(v => v !== "" && v !== "all" && v !== false).length;

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-end">
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <Filter className="w-3 h-3" /> Advanced Search
          {activeCount > 0 && <span className="ml-1 inline-block w-5 h-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center">{activeCount}</span>}
        </Button>
      </div>

      {showAdvanced && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div>
              <label className="text-xs font-medium mb-1.5 block">Max Deductible</label>
              <Input
                type="number"
                placeholder="e.g., 1500"
                value={filters.deductible_max}
                onChange={e => setFilters(p => ({ ...p, deductible_max: e.target.value }))}
                className="h-8 text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block">Network Type</label>
              <Select value={filters.network} onValueChange={v => setFilters(p => ({ ...p, network: v }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Networks</SelectItem>
                  <SelectItem value="PPO">PPO Only</SelectItem>
                  <SelectItem value="HMO">HMO Only</SelectItem>
                  <SelectItem value="HDHP">HDHP Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={filters.hsa_only}
                onCheckedChange={v => setFilters(p => ({ ...p, hsa_only: v }))}
                id="hsa_only"
              />
              <label htmlFor="hsa_only" className="text-xs font-medium cursor-pointer">HSA-Eligible Only</label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={filters.has_rates}
                onCheckedChange={v => setFilters(p => ({ ...p, has_rates: v }))}
                id="has_rates"
              />
              <label htmlFor="has_rates" className="text-xs font-medium cursor-pointer">Has Rate Tables</label>
            </div>

            <div className="flex gap-2">
              <Button size="sm" onClick={applyFilters} className="text-xs h-7">Apply Filters</Button>
              <Button size="sm" variant="outline" onClick={clearFilters} className="text-xs h-7">Clear</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}