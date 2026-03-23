import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronRight } from "lucide-react";

const CATEGORY_ICONS = {
  getting_started: "🚀",
  features: "⚡",
  workflows: "🔄",
  integrations: "🔗",
  settings: "⚙️",
  troubleshooting: "🔧",
  best_practices: "✨",
};

export default function UserManualSearch({ onSelectManual }) {
  const [search, setSearch] = useState("");

  const { data: manuals = [] } = useQuery({
    queryKey: ["user-manuals"],
    queryFn: () => base44.entities.UserManual.filter({ published: true }, "-created_date", 200),
  });

  const results = useMemo(() => {
    if (!search) return [];
    return manuals.filter(m =>
      m.title?.toLowerCase().includes(search.toLowerCase()) ||
      m.description?.toLowerCase().includes(search.toLowerCase()) ||
      m.content?.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 8);
  }, [search, manuals]);

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search help..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {search && results.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            {results.map(manual => (
              <button
                key={manual.id}
                onClick={() => {
                  onSelectManual(manual);
                  setSearch("");
                }}
                className="w-full p-3 border-b last:border-0 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg flex-shrink-0">{CATEGORY_ICONS[manual.category] || "📖"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{manual.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{manual.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {search && results.length === 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50">
          <CardContent className="p-4 text-center text-xs text-muted-foreground">
            No manuals found. Try different keywords.
          </CardContent>
        </Card>
      )}
    </div>
  );
}