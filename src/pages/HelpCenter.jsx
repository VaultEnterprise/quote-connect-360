import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, X, ChevronRight, Sparkles, BookOpen, Layout } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/shared/PageHeader";
import { HELP_TARGETS, MODULES } from "@/lib/helpTargetRegistry";
import HelpHomeScreen from "@/components/help/HelpHomeScreen";
import HelpModuleDrillDown from "@/components/help/HelpModuleDrillDown";
import HelpTopicDetail from "@/components/help/HelpTopicDetail";
import HelpManualTopicDetail from "@/components/help/HelpManualTopicDetail";

const RECENT_VIEWED_KEY = "help_center_recent_targets";
const MAX_RECENT = 8;

export default function HelpCenter() {
  const [search, setSearch] = useState("");
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null); // HelpManualTopic
  const [activeTab, setActiveTab] = useState("topics"); // topics | manuals
  const [recentTargets, setRecentTargets] = useState(() => {
    try { return JSON.parse(localStorage.getItem(RECENT_VIEWED_KEY) || "[]"); } catch { return []; }
  });
  const searchRef = useRef(null);

  // Check for deep-link ?target= in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("target");
    if (t) setSelectedTarget(t);
    const tp = params.get("topic");
    if (tp) setActiveTab("manuals");
  }, []);

  // Global keyboard shortcut: / or Ctrl+K focuses search
  useEffect(() => {
    const handler = (e) => {
      if ((e.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) ||
          (e.key === "k" && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") {
        setSearch("");
        searchRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const { data: contents = [] } = useQuery({
    queryKey: ["help-contents-all"],
    queryFn: () => base44.entities.HelpContent.filter({ content_status: "active", is_active: true }, "-view_count", 500),
  });

  const { data: manualTopics = [] } = useQuery({
    queryKey: ["help-manual-topics"],
    queryFn: async () => {
      try {
        return await base44.entities.HelpManualTopic.list("sort_order", 100);
      } catch (err) {
        console.warn("Failed to load manual topics:", err);
        return [];
      }
    },
  });

  const contentMap = useMemo(() =>
    contents.reduce((acc, c) => { acc[c.help_target_code] = c; return acc; }, {}),
  [contents]);

  const addToRecent = useCallback((code) => {
    setRecentTargets(prev => {
      const updated = [code, ...prev.filter(c => c !== code)].slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_VIEWED_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleSelectTarget = useCallback((code) => {
    setSelectedTarget(code);
    setSelectedTopic(null);
    addToRecent(code);
  }, [addToRecent]);

  const handleSelectTopic = useCallback((topic) => {
    setSelectedTopic(topic);
    setSelectedTarget(null);
    setActiveTab("manuals");
  }, []);

  const handleSelectModule = useCallback((mod) => {
    setSelectedModule(mod);
    setSelectedTarget(null);
    setSelectedTopic(null);
  }, []);

  const handleBackToHome = useCallback(() => {
    setSelectedModule(null);
    setSelectedTarget(null);
    setSelectedTopic(null);
  }, []);

  const handleBackToModule = useCallback(() => {
    setSelectedTarget(null);
  }, []);

  // Search logic — searches both contents and manual topics
  const searchResults = useMemo(() => {
    if (!search || search.length < 2) return { contents: [], topics: [] };
    const q = search.toLowerCase();
    const matchedContents = contents.filter(c =>
      c.help_title?.toLowerCase().includes(q) ||
      c.short_help_text?.toLowerCase().includes(q) ||
      c.detailed_help_text?.toLowerCase().includes(q) ||
      c.search_keywords?.toLowerCase().includes(q) ||
      c.help_target_code?.toLowerCase().includes(q)
    ).slice(0, 15);
    const matchedTopics = manualTopics.filter(t =>
      t.topic_title?.toLowerCase().includes(q) ||
      t.topic_summary?.toLowerCase().includes(q) ||
      t.topic_body?.toLowerCase().includes(q) ||
      t.search_keywords?.toLowerCase().includes(q)
    ).slice(0, 8);
    return { contents: matchedContents, topics: matchedTopics };
  }, [search, contents, manualTopics]);

  const totalSearchResults = searchResults.contents.length + searchResults.topics.length;

  const isSearching = search.length >= 2;
  const isDetail = !!selectedTarget;
  const isTopicDetail = !!selectedTopic;
  const isModuleDrillDown = !!selectedModule && !selectedTarget;
  const isHome = !isSearching && !isDetail && !isTopicDetail && !isModuleDrillDown;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Help Center"
        description="Browse documentation, guides, and help for every feature in ConnectQuote 360"
        actions={
          <Button variant="outline" size="sm" className="gap-1.5 text-xs"
            onClick={() => window.dispatchEvent(new CustomEvent("openHelpAI", {}))}>
            <Sparkles className="w-3.5 h-3.5 text-primary" /> Ask HelpAI
          </Button>
        }
      />

      {/* Search Bar */}
      <div className="relative max-w-2xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={searchRef}
          placeholder="Search all help topics, fields, processes, and guides…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-11 text-sm"
        />
        {search ? (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        ) : (
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded hidden sm:block">/</kbd>
        )}
      </div>

      {/* Tab switcher for home/module views */}
      {(isHome || isModuleDrillDown) && !isSearching && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
          <TabsList className="h-8">
            <TabsTrigger value="topics" className="text-xs gap-1.5 px-3">
              <Layout className="w-3.5 h-3.5" /> Feature Topics
            </TabsTrigger>
            <TabsTrigger value="manuals" className="text-xs gap-1.5 px-3">
              <BookOpen className="w-3.5 h-3.5" /> User Guides
              {manualTopics.length > 0 && (
                <Badge className="text-[8px] h-4 px-1 ml-0.5">{manualTopics.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Search Results */}
      {isSearching && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {totalSearchResults} result{totalSearchResults !== 1 ? "s" : ""} for <strong>"{search}"</strong>
          </p>

          {totalSearchResults === 0 ? (
            <Card className="p-8 text-center space-y-3">
              <Search className="w-10 h-10 mx-auto text-muted-foreground/20" />
              <p className="text-muted-foreground text-sm">No help topics found. Try different keywords.</p>
              <button
                onClick={() => { setSearch(""); window.dispatchEvent(new CustomEvent("openHelpAI", { detail: { prefill: search } })); }}
                className="text-sm text-primary hover:underline"
              >
                Ask HelpAI instead →
              </button>
            </Card>
          ) : (
            <>
              {searchResults.contents.length > 0 && (
                <div className="space-y-2">
                  {searchResults.contents.length < totalSearchResults && (
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Feature Topics</p>
                  )}
                  {searchResults.contents.map(c => (
                    <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => { handleSelectTarget(c.help_target_code); setSearch(""); }}>
                      <CardContent className="p-4 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-sm">{c.help_title}</h3>
                            <Badge variant="outline" className="text-[9px]">{c.module_code}</Badge>
                            <Badge variant="outline" className="text-[9px]">{c.page_code}</Badge>
                          </div>
                          {c.short_help_text && <p className="text-xs text-muted-foreground">{c.short_help_text}</p>}
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {searchResults.topics.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">User Guides</p>
                  {searchResults.topics.map(t => (
                    <Card key={t.id} className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => { handleSelectTopic(t); setSearch(""); }}>
                      <CardContent className="p-4 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <BookOpen className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                            <h3 className="font-semibold text-sm">{t.topic_title}</h3>
                            <Badge variant="outline" className="text-[9px]">{t.topic_type?.replace(/_/g, " ")}</Badge>
                          </div>
                          {t.topic_summary && <p className="text-xs text-muted-foreground">{t.topic_summary}</p>}
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Main Views */}
      {!isSearching && (
        <>
          {/* Detail: Feature topic */}
          {isDetail && (
            <HelpTopicDetail
              selectedTarget={selectedTarget}
              helpTargets={HELP_TARGETS}
              contentMap={contentMap}
              onBack={handleBackToHome}
              onBackToModule={() => { setSelectedTarget(null); }}
              onSelectTarget={handleSelectTarget}
            />
          )}

          {/* Detail: Manual topic */}
          {isTopicDetail && !isDetail && (
            <HelpManualTopicDetail topic={selectedTopic} onBack={() => setSelectedTopic(null)} />
          )}

          {/* Module Drill-Down */}
          {isModuleDrillDown && activeTab === "topics" && (
            <HelpModuleDrillDown
              selectedModule={selectedModule}
              helpTargets={HELP_TARGETS}
              contentMap={contentMap}
              onBack={handleBackToHome}
              onSelectTarget={handleSelectTarget}
            />
          )}

          {/* User Guides List in drill-down tab */}
          {isModuleDrillDown && activeTab === "manuals" && (
            <div className="space-y-4">
              <button onClick={handleBackToHome} className="text-primary hover:underline text-sm flex items-center gap-1">← All Modules</button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {manualTopics.map(topic => (
                  <Card key={topic.id} className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
                    onClick={() => handleSelectTopic(topic)}>
                    <CardContent className="p-4 flex items-start gap-3">
                      <BookOpen className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
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

          {/* Home screen */}
          {isHome && activeTab === "topics" && (
            <HelpHomeScreen
              modules={MODULES}
              contentMap={contentMap}
              helpTargets={HELP_TARGETS}
              onSelectModule={handleSelectModule}
              onSelectTarget={handleSelectTarget}
              recentTargets={recentTargets}
              manualTopics={manualTopics}
              onSelectTopic={handleSelectTopic}
            />
          )}

          {/* Home: Manuals list */}
          {isHome && activeTab === "manuals" && (
            <div className="space-y-3">
              {manualTopics.length === 0 ? (
                <Card className="p-8 text-center space-y-2">
                  <BookOpen className="w-10 h-10 mx-auto text-muted-foreground/20" />
                  <p className="text-muted-foreground text-sm">No published user guides yet.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {manualTopics.map(topic => (
                    <Card key={topic.id} className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
                      onClick={() => handleSelectTopic(topic)}>
                      <CardContent className="p-4 flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm">{topic.topic_title}</p>
                          {topic.topic_summary && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{topic.topic_summary}</p>}
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge variant="outline" className="text-[9px]">{topic.topic_type?.replace(/_/g, " ")}</Badge>
                            {topic.module_code && <Badge variant="outline" className="text-[9px]">{topic.module_code}</Badge>}
                            {topic.view_count > 0 && <span className="text-[10px] text-muted-foreground">{topic.view_count} views</span>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}