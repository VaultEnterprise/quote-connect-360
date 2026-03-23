import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Sparkles, TrendingUp } from "lucide-react";

const MODULE_ICONS = {
  DASHBOARD:"🏠", CASES:"💼", CENSUS:"👥", QUOTES:"📋", PROPOSALS:"📄",
  ENROLLMENT:"✅", RENEWALS:"🔄", PLANS:"📚", POLICYMATCH:"🧠",
  EMPLOYERS:"🏢", TASKS:"✓", CONTRIBUTIONS:"💰", EXCEPTIONS:"⚠️",
  SETTINGS:"⚙️", PORTALS:"🚪",
};

const MODULE_LABELS = {
  DASHBOARD:"Dashboard", CASES:"Cases", CENSUS:"Census", QUOTES:"Quotes",
  PROPOSALS:"Proposals", ENROLLMENT:"Enrollment", RENEWALS:"Renewals",
  PLANS:"Plan Library", POLICYMATCH:"PolicyMatchAI", EMPLOYERS:"Employers",
  TASKS:"Tasks", CONTRIBUTIONS:"Contributions", EXCEPTIONS:"Exceptions",
  SETTINGS:"Settings", PORTALS:"Portals",
};

export default function HelpHomeScreen({ modules, contentMap, helpTargets, onSelectModule, onSelectTarget, recentTargets, manualTopics, onSelectTopic }) {
  const popularTargets = React.useMemo(() => {
    return Object.values(contentMap)
      .filter(c => (c.view_count || 0) > 0)
      .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
      .slice(0, 6);
  }, [contentMap]);

  return (
    <div className="space-y-8">
      {/* Module Grid */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Browse by Module</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {modules.map(mod => {
            const covered = helpTargets.filter(t => t.module_code === mod && contentMap[t.target_code]).length;
            const total = helpTargets.filter(t => t.module_code === mod).length;
            const pct = total > 0 ? Math.round((covered / total) * 100) : 0;
            return (
              <Card key={mod} className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50 group"
                onClick={() => onSelectModule(mod)}>
                <CardContent className="p-4 text-center space-y-2">
                  <span className="text-3xl">{MODULE_ICONS[mod] || "📖"}</span>
                  <p className="font-semibold text-sm group-hover:text-primary transition-colors">{MODULE_LABELS[mod] || mod}</p>
                  <div className="space-y-1">
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary/60 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground">{covered}/{total} topics</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Manual Guides */}
      {manualTopics && manualTopics.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> User Guides & Manuals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {manualTopics.slice(0, 6).map(topic => (
              <Card key={topic.id} className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
                onClick={() => onSelectTopic(topic)}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <BookOpen className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{topic.topic_title}</p>
                    {topic.topic_summary && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{topic.topic_summary}</p>}
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="outline" className="text-[9px]">{topic.topic_type?.replace(/_/g, " ")}</Badge>
                      {topic.module_code && <Badge variant="outline" className="text-[9px]">{topic.module_code}</Badge>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Popular Topics */}
      {popularTargets.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Most Viewed Topics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {popularTargets.map(c => (
              <button key={c.id} onClick={() => onSelectTarget(c.help_target_code)}
                className="text-left p-3 rounded-lg border hover:border-primary/50 hover:shadow-sm transition-all bg-card">
                <p className="font-medium text-sm truncate">{c.help_title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[9px]">{c.module_code}</Badge>
                  <span className="text-[10px] text-muted-foreground">{c.view_count} views</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recently Viewed */}
      {recentTargets && recentTargets.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Recently Viewed</h2>
          <div className="flex flex-wrap gap-2">
            {recentTargets.map(code => {
              const c = contentMap[code];
              if (!c) return null;
              return (
                <button key={code} onClick={() => onSelectTarget(code)}
                  className="text-xs px-3 py-1.5 rounded-full border hover:border-primary/50 hover:bg-muted/50 transition-colors bg-card">
                  {c.help_title}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* HelpAI CTA */}
      <div className="rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 p-5 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-primary" />
            <p className="font-semibold text-sm">Can't find what you're looking for?</p>
          </div>
          <p className="text-xs text-muted-foreground">Ask HelpAI — it's trained on all approved documentation and can answer questions about any feature, field, or workflow.</p>
        </div>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("openHelpAI", {}))}
          className="flex-shrink-0 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Ask HelpAI
        </button>
      </div>
    </div>
  );
}