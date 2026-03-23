import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, BookOpen, ChevronRight, ChevronDown, X, MessageSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";
import PageHeader from "@/components/shared/PageHeader";
import { HELP_TARGETS, MODULES } from "@/lib/helpTargetRegistry";

const MODULE_LABELS = {
  DASHBOARD:"Dashboard", CASES:"Cases", CENSUS:"Census", QUOTES:"Quotes",
  PROPOSALS:"Proposals", ENROLLMENT:"Enrollment", RENEWALS:"Renewals",
  PLANS:"Plan Library", POLICYMATCH:"PolicyMatchAI", EMPLOYERS:"Employers",
  TASKS:"Tasks", CONTRIBUTIONS:"Contributions", EXCEPTIONS:"Exceptions",
  SETTINGS:"Settings", PORTALS:"Portals",
};

const MODULE_ICONS = {
  DASHBOARD:"🏠", CASES:"💼", CENSUS:"👥", QUOTES:"📋", PROPOSALS:"📄",
  ENROLLMENT:"✅", RENEWALS:"🔄", PLANS:"📚", POLICYMATCH:"🧠",
  EMPLOYERS:"🏢", TASKS:"✓", CONTRIBUTIONS:"💰", EXCEPTIONS:"⚠️",
  SETTINGS:"⚙️", PORTALS:"🚪",
};

export default function HelpCenter() {
  const [search, setSearch] = useState("");
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [expandedPages, setExpandedPages] = useState({});

  const { data: contents = [] } = useQuery({
    queryKey: ["help-contents-all"],
    queryFn: () => base44.entities.HelpContent.filter({ status: "active" }, "-view_count", 500),
  });

  // Build content map by target_code
  const contentMap = useMemo(() =>
    contents.reduce((acc, c) => { acc[c.help_target_code] = c; return acc; }, {}),
  [contents]);

  // Search across all content
  const searchResults = useMemo(() => {
    if (!search) return [];
    const q = search.toLowerCase();
    return contents.filter(c =>
      c.help_title?.toLowerCase().includes(q) ||
      c.short_help?.toLowerCase().includes(q) ||
      c.detailed_help?.toLowerCase().includes(q) ||
      c.help_target_code?.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [search, contents]);

  const moduleTargets = useMemo(() => {
    if (!selectedModule) return [];
    const targets = HELP_TARGETS.filter(t => t.module_code === selectedModule);
    // Group by page
    const byPage = {};
    for (const t of targets) {
      if (!byPage[t.page_code]) byPage[t.page_code] = [];
      byPage[t.page_code].push(t);
    }
    return byPage;
  }, [selectedModule]);

  const togglePage = (pageCode) =>
    setExpandedPages(p => ({ ...p, [pageCode]: !p[pageCode] }));

  const ComponentBadgeColors = {
    page: "bg-blue-100 text-blue-700",
    section: "bg-purple-100 text-purple-700",
    field: "bg-emerald-100 text-emerald-700",
    button: "bg-orange-100 text-orange-700",
    status: "bg-pink-100 text-pink-700",
    workflow_step: "bg-indigo-100 text-indigo-700",
    tab: "bg-slate-100 text-slate-700",
    card: "bg-yellow-100 text-yellow-700",
    action: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Help Center"
        description="Browse documentation, guides, and help for every feature in ConnectQuote 360"
      />

      {/* Search */}
      <div className="relative max-w-2xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search all help topics, fields, processes, and features…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-11 text-sm"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results */}
      {search && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for "{search}"</p>
          {searchResults.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground text-sm">No help topics found. Try different keywords or ask HelpAI.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {searchResults.map(c => (
                <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => { setSelectedTarget(c.help_target_code); setSearch(""); }}>
                  <CardContent className="p-4 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm">{c.help_title}</h3>
                        <Badge variant="outline" className="text-[9px]">{c.module_code}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{c.short_help}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Module Grid */}
      {!search && !selectedModule && !selectedTarget && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {MODULES.map(mod => {
            const covered = HELP_TARGETS.filter(t => t.module_code === mod && contentMap[t.target_code]).length;
            const total = HELP_TARGETS.filter(t => t.module_code === mod).length;
            return (
              <Card key={mod} className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
                onClick={() => setSelectedModule(mod)}>
                <CardContent className="p-4 text-center space-y-2">
                  <span className="text-3xl">{MODULE_ICONS[mod] || "📖"}</span>
                  <p className="font-semibold text-sm">{MODULE_LABELS[mod] || mod}</p>
                  <p className="text-[10px] text-muted-foreground">{covered}/{total} topics</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Module drill-down */}
      {!search && selectedModule && !selectedTarget && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setSelectedModule(null)} className="text-primary hover:underline text-sm flex items-center gap-1">
              ← All Modules
            </button>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-semibold">{MODULE_LABELS[selectedModule] || selectedModule}</span>
          </div>

          <div className="space-y-3">
            {Object.entries(moduleTargets).map(([pageCode, targets]) => (
              <Card key={pageCode}>
                <button
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
                  onClick={() => togglePage(pageCode)}
                >
                  <div className="flex items-center gap-2">
                    {expandedPages[pageCode] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    <span className="font-semibold text-sm">{pageCode.replace(/_/g, " ")}</span>
                    <Badge variant="outline" className="text-[9px]">{targets.length} items</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {targets.filter(t => contentMap[t.target_code]).length}/{targets.length} with help
                  </span>
                </button>

                {expandedPages[pageCode] && (
                  <CardContent className="pt-0 pb-3 space-y-1">
                    {targets.map(t => {
                      const hasContent = !!contentMap[t.target_code];
                      return (
                        <button
                          key={t.target_code}
                          onClick={() => setSelectedTarget(t.target_code)}
                          className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between gap-2 transition-colors ${hasContent ? "hover:bg-muted/50" : "opacity-60 hover:bg-muted/30"}`}
                        >
                          <div className="flex items-center gap-2">
                            <Badge className={`text-[8px] py-0 ${ComponentBadgeColors[t.component_type] || "bg-gray-100"}`}>
                              {t.component_type}
                            </Badge>
                            <span className="text-xs">{t.target_label}</span>
                          </div>
                          {hasContent
                            ? <ChevronRight className="w-3 h-3 text-muted-foreground" />
                            : <span className="text-[9px] text-muted-foreground">No content</span>
                          }
                        </button>
                      );
                    })}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Topic Detail */}
      {selectedTarget && (() => {
        const target = HELP_TARGETS.find(t => t.target_code === selectedTarget);
        const content = contentMap[selectedTarget];
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap text-sm">
              <button onClick={() => { setSelectedTarget(null); setSelectedModule(null); }} className="text-primary hover:underline">All Modules</button>
              {target && <>
                <span className="text-muted-foreground">/</span>
                <button onClick={() => { setSelectedTarget(null); setSelectedModule(target.module_code); }} className="text-primary hover:underline">{MODULE_LABELS[target.module_code]}</button>
                <span className="text-muted-foreground">/</span>
                <span>{target?.target_label}</span>
              </>}
            </div>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl">{content?.help_title || target?.target_label}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-[9px]">{target?.module_code}</Badge>
                      <Badge variant="outline" className="text-[9px]">{target?.component_type}</Badge>
                      <code className="text-[9px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{selectedTarget}</code>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 text-xs"
                    onClick={() => window.dispatchEvent(new CustomEvent("openHelpAI", { detail: { targetCode: selectedTarget, prefill: content?.help_title || target?.target_label } }))}
                  >
                    <MessageSquare className="w-3 h-3" /> Ask HelpAI
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {!content ? (
                  <div className="text-center py-8 space-y-2">
                    <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/20" />
                    <p className="text-muted-foreground text-sm">Help content is not yet available for this item.</p>
                  </div>
                ) : (
                  <>
                    {content.short_help && (
                      <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                        <p className="text-sm font-medium">{content.short_help}</p>
                      </div>
                    )}
                    {content.detailed_help && (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>{content.detailed_help}</ReactMarkdown>
                      </div>
                    )}
                    {content.expected_user_action && (
                      <div className="rounded-lg border p-4 space-y-1">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">What to do</p>
                        <p className="text-sm">{content.expected_user_action}</p>
                      </div>
                    )}
                    {content.allowed_values && (
                      <div className="rounded-lg border p-4 space-y-1">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Allowed Values</p>
                        <p className="text-sm text-muted-foreground">{content.allowed_values}</p>
                      </div>
                    )}
                    {content.usage_example && (
                      <div className="rounded-lg bg-slate-50 border p-4 space-y-1">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Example</p>
                        <p className="text-sm text-slate-700">{content.usage_example}</p>
                      </div>
                    )}
                    {content.warnings && (
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 space-y-1">
                        <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">⚠ Warning</p>
                        <p className="text-sm text-amber-800">{content.warnings}</p>
                      </div>
                    )}
                    {content.validation_notes && (
                      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 space-y-1">
                        <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Validation Notes</p>
                        <p className="text-sm text-blue-800">{content.validation_notes}</p>
                      </div>
                    )}
                    {content.related_topics && content.related_topics.length > 0 && (
                      <div className="pt-2 border-t space-y-2">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Related Topics</p>
                        <div className="flex flex-wrap gap-2">
                          {content.related_topics.map((t, i) => (
                            <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200">{t}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        );
      })()}
    </div>
  );
}