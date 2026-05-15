import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, BookOpen, Clock, Zap, ChevronRight } from "lucide-react";

const CATEGORY_CONFIG = {
  getting_started: { icon: "🚀", label: "Getting Started", color: "bg-blue-100 text-blue-700" },
  features: { icon: "⚡", label: "Features", color: "bg-purple-100 text-purple-700" },
  workflows: { icon: "🔄", label: "Workflows", color: "bg-emerald-100 text-emerald-700" },
  integrations: { icon: "🔗", label: "Integrations", color: "bg-orange-100 text-orange-700" },
  settings: { icon: "⚙️", label: "Settings", color: "bg-slate-100 text-slate-700" },
  troubleshooting: { icon: "🔧", label: "Troubleshooting", color: "bg-red-100 text-red-700" },
  best_practices: { icon: "✨", label: "Best Practices", color: "bg-pink-100 text-pink-700" },
};

/**
 * UserManualLibrary — Browse published user manuals
 * Status: Functional but may overlap with HelpCenter module browsing
 * Usage: Can be surfaced in HelpCenter or used standalone
 * Note: Display UserManual entities; ensure no duplication with HelpContent display
 */
export default function UserManualLibrary({ onSelectManual }) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");

  const { data: manuals = [] } = useQuery({
    queryKey: ["user-manuals"],
    queryFn: () => base44.entities.UserManual.filter({ published: true }, "-created_date", 200),
  });

  const modules = useMemo(() => {
    return [...new Set(manuals.map(m => m.module).filter(Boolean))].sort();
  }, [manuals]);

  const filtered = useMemo(() => {
    return manuals.filter(m => {
      if (search && !m.title?.toLowerCase().includes(search.toLowerCase()) &&
          !m.description?.toLowerCase().includes(search.toLowerCase())) return false;
      if (categoryFilter !== "all" && m.category !== categoryFilter) return false;
      if (moduleFilter !== "all" && m.module !== moduleFilter) return false;
      return true;
    });
  }, [manuals, search, categoryFilter, moduleFilter]);

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search manuals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-44 h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.icon} {cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {modules.length > 0 && (
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-44 h-9 text-xs"><SelectValue placeholder="All Modules" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                {modules.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No manuals found. Try adjusting your filters.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(manual => {
            const cfg = CATEGORY_CONFIG[manual.category] || CATEGORY_CONFIG.features;
            return (
              <Card
                key={manual.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onSelectManual(manual)}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{cfg.icon}</span>
                        <Badge className={`text-[9px] py-0 ${cfg.color}`}>
                          {cfg.label}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-sm">{manual.title}</h3>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2">{manual.description}</p>

                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> {manual.module}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {manual.estimated_read_time || 5} min
                    </span>
                    {manual.difficulty_level && (
                      <Badge className="text-[8px] py-0" variant="outline">
                        {manual.difficulty_level}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}