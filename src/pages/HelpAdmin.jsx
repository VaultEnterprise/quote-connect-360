import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";
import {
  Search, ChevronRight, ChevronDown, Edit2, Eye, EyeOff, Trash2,
  Sparkles, Save, AlertCircle, CheckCircle2, BarChart2, Play,
  LayoutDashboard, FileBarChart, TrendingUp, BookOpen, Database,
  X, Target, MessageSquare, Zap, Settings2, RefreshCw, Plus,
  Activity, ShieldAlert, Scale
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import ReactMarkdown from "react-markdown";
import { HELP_TARGETS, MODULES } from "@/lib/helpTargetRegistry";

// Sub-components
import AdminSeedPanel from "@/components/help-admin/AdminSeedPanel";
import ContentCoverageTab from "@/components/help-admin/ContentCoverageTab";
import BulkAIGeneratePanel from "@/components/help-admin/BulkAIGeneratePanel";
import ManualTopicsTab from "@/components/help-admin/ManualTopicsTab";
import TopicEditorModal from "@/components/help-admin/TopicEditorModal";
import AIReviewTab from "@/components/help-admin/AIReviewTab";
import HelpConsoleKPIBar from "@/components/help-admin/HelpConsoleKPIBar";
import RecentActivityFeed from "@/components/help-admin/RecentActivityFeed";
import OrphanedContentPanel from "@/components/help-admin/OrphanedContentPanel";
import ContentQualityScore from "@/components/help-admin/ContentQualityScore";

const MODULE_LABELS = {
  DASHBOARD:"Dashboard", CASES:"Cases", CENSUS:"Census", QUOTES:"Quotes",
  PROPOSALS:"Proposals", ENROLLMENT:"Enrollment", RENEWALS:"Renewals",
  PLANS:"Plan Library", POLICYMATCH:"PolicyMatchAI", EMPLOYERS:"Employers",
  TASKS:"Tasks", CONTRIBUTIONS:"Contributions", EXCEPTIONS:"Exceptions",
  SETTINGS:"Settings", PORTALS:"Portals",
};

const EMPTY_FORM = {
  help_title:"", short_help_text:"", detailed_help_text:"", feature_capabilities_text:"",
  process_meaning_text:"", expected_user_action_text:"", allowed_values_text:"",
  examples_text:"", dependency_notes_text:"", warnings_text:"",
  validation_notes_text:"", related_topics_text:"", search_keywords:"",
  role_visibility:"all", content_status:"active",
};

export default function HelpAdmin() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [tab, setTab] = useState("coverage");
  const [search, setSearch] = useState("");
  const [selectedModule, setSelectedModule] = useState(null);
  const [expandedPages, setExpandedPages] = useState({});
  const [editingTarget, setEditingTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [preview, setPreview] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [bulkAIModule, setBulkAIModule] = useState(null);

  // Manual topic editor modal
  const [topicEditorOpen, setTopicEditorOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);

  const { data: contents = [] } = useQuery({
    queryKey: ["help-contents-admin"],
    queryFn: () => base44.entities.HelpContent.list("-updated_date", 500),
  });

  const { data: aiLogs = [] } = useQuery({
    queryKey: ["helpai-logs"],
    queryFn: () => base44.entities.HelpAIQuestionLog.filter({ requires_admin_review: true }, "-created_date", 50),
  });

  const { data: allAiLogs = [] } = useQuery({
    queryKey: ["helpai-logs-kpi"],
    queryFn: () => base44.entities.HelpAIQuestionLog.list("-created_date", 200),
  });

  const { data: topics = [] } = useQuery({
    queryKey: ["help-manual-topics-kpi"],
    queryFn: () => base44.entities.HelpManualTopic.list("sort_order", 300),
  });

  const contentMap = useMemo(() =>
    contents.reduce((acc, c) => { acc[c.help_target_code] = c; return acc; }, {}),
  [contents]);

  const pendingReviewCount = aiLogs.length;

  const saveContent = useMutation({
    mutationFn: async (data) => {
      const existing = contentMap[editingTarget.target_code];
      const res = await base44.functions.invoke("saveHelpContent", {
        content_id: existing?.id || null,
        target_code: editingTarget.target_code,
        module_code: editingTarget.module_code,
        page_code: editingTarget.page_code,
        data,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["help-contents-admin"] });
      queryClient.invalidateQueries({ queryKey: ["help-contents-all"] });
      toast({ title: "Saved", description: `Content for "${editingTarget.target_label}" saved.` });
      setEditingTarget(null);
      setTab("coverage");
    },
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }) =>
      base44.entities.HelpContent.update(id, { content_status: status === "active" ? "inactive" : "active", is_active: status !== "active" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["help-contents-admin"] }),
  });

  const deleteContent = useMutation({
    mutationFn: (id) => base44.entities.HelpContent.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["help-contents-admin"] }),
  });

  const openEditor = (target) => {
    setEditingTarget(target);
    const existing = contentMap[target.target_code];
    if (existing) {
      setForm({
        help_title: existing.help_title || "",
        short_help_text: existing.short_help_text || "",
        detailed_help_text: existing.detailed_help_text || "",
        feature_capabilities_text: existing.feature_capabilities_text || "",
        process_meaning_text: existing.process_meaning_text || "",
        expected_user_action_text: existing.expected_user_action_text || "",
        allowed_values_text: existing.allowed_values_text || "",
        examples_text: existing.examples_text || "",
        dependency_notes_text: existing.dependency_notes_text || "",
        warnings_text: existing.warnings_text || "",
        validation_notes_text: existing.validation_notes_text || "",
        related_topics_text: existing.related_topics_text || "",
        search_keywords: existing.search_keywords || "",
        role_visibility: existing.role_visibility || "all",
        content_status: existing.content_status || "active",
      });
    } else {
      setForm({ ...EMPTY_FORM, help_title: target.target_label });
    }
    setPreview(false);
    setTab("editor");
  };

  const generateWithAI = async () => {
    if (!editingTarget) return;
    setAiGenerating(true);
    try {
      const res = await base44.functions.invoke("generateHelpForTarget", {
        target_code: editingTarget.target_code,
        target_label: editingTarget.target_label,
        module_code: editingTarget.module_code,
        page_code: editingTarget.page_code,
        component_type: editingTarget.component_type,
      });
      const data = res.data?.content || {};
      setForm(prev => ({
        ...prev,
        help_title: data.help_title || prev.help_title || editingTarget.target_label,
        short_help_text: data.short_help_text || prev.short_help_text,
        detailed_help_text: data.detailed_help_text || prev.detailed_help_text,
        feature_capabilities_text: data.feature_capabilities_text || prev.feature_capabilities_text,
        process_meaning_text: data.process_meaning_text || prev.process_meaning_text,
        expected_user_action_text: data.expected_user_action_text || prev.expected_user_action_text,
        allowed_values_text: data.allowed_values_text || prev.allowed_values_text,
        examples_text: data.examples_text || prev.examples_text,
        dependency_notes_text: data.dependency_notes_text || prev.dependency_notes_text,
        warnings_text: data.warnings_text || prev.warnings_text,
        validation_notes_text: data.validation_notes_text || prev.validation_notes_text,
        related_topics_text: data.related_topics_text || prev.related_topics_text,
        search_keywords: data.search_keywords || prev.search_keywords,
      }));
      toast({ title: "AI Generated", description: "Review and save." });
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setAiGenerating(false);
    }
  };

  const searchFiltered = useMemo(() => {
    if (!search) return [];
    const q = search.toLowerCase();
    return HELP_TARGETS.filter(t =>
      t.target_label.toLowerCase().includes(q) ||
      t.target_code.toLowerCase().includes(q) ||
      t.module_code.toLowerCase().includes(q) ||
      contentMap[t.target_code]?.help_title?.toLowerCase().includes(q) ||
      contentMap[t.target_code]?.short_help_text?.toLowerCase().includes(q) ||
      contentMap[t.target_code]?.search_keywords?.toLowerCase().includes(q)
    ).slice(0, 40);
  }, [search, contentMap]);

  const moduleGroups = useMemo(() => {
    if (!selectedModule) return {};
    const targets = HELP_TARGETS.filter(t => t.module_code === selectedModule);
    const byPage = {};
    for (const t of targets) {
      if (!byPage[t.page_code]) byPage[t.page_code] = [];
      byPage[t.page_code].push(t);
    }
    return byPage;
  }, [selectedModule]);

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Admin access required.</p>
      </div>
    );
  }

  const openTopicEditor = (topic) => { setEditingTopic(topic || null); setTopicEditorOpen(true); };
  const closeTopicEditor = () => { setEditingTopic(null); setTopicEditorOpen(false); };

  // When bulk AI module is set, navigate to bulk_ai tab with pre-set module
  const handleBulkAIModule = (mod) => {
    setBulkAIModule(mod);
    setTab("bulk_ai");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <PageHeader
          title="Help Management Console"
          description="Manage all help content, manual topics, AI knowledge base, and documentation quality"
        />
        <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => setShowActivity(p => !p)}>
          <Activity className="w-3.5 h-3.5" /> {showActivity ? "Hide" : "Activity"}
        </Button>
      </div>

      {/* System health KPI bar */}
      <HelpConsoleKPIBar
        contentMap={contentMap}
        aiLogs={allAiLogs}
        topics={topics}
        onNavigate={(t) => setTab(t)}
      />

      {/* Activity feed (toggleable) */}
      {showActivity && (
        <RecentActivityFeed onClose={() => setShowActivity(false)} />
      )}

      {/* Orphaned content warning */}
      <OrphanedContentPanel contentMap={contentMap} />

      {/* Navigation strip to related admin pages */}
      <div className="flex flex-wrap gap-2">
        <Link to="/help-dashboard"><Button size="sm" variant="outline" className="gap-1 text-xs h-7"><LayoutDashboard className="w-3 h-3" /> Help Dashboard</Button></Link>
        <Link to="/help-coverage"><Button size="sm" variant="outline" className="gap-1 text-xs h-7"><FileBarChart className="w-3 h-3" /> Coverage Report</Button></Link>
        <Link to="/help-analytics"><Button size="sm" variant="outline" className="gap-1 text-xs h-7"><TrendingUp className="w-3 h-3" /> Search Analytics</Button></Link>
        <Link to="/help-target-registry"><Button size="sm" variant="outline" className="gap-1 text-xs h-7"><BarChart2 className="w-3 h-3" /> Target Registry</Button></Link>
        <Link to="/help"><Button size="sm" variant="outline" className="gap-1 text-xs h-7"><Eye className="w-3 h-3" /> View Help Center</Button></Link>
        <Link to="/help-manual-manager"><Button size="sm" variant="outline" className="gap-1 text-xs h-7"><BookOpen className="w-3 h-3" /> Manual Manager</Button></Link>
        <Link to="/aca-library"><Button size="sm" variant="outline" className="gap-1 text-xs h-7 border-blue-200 text-blue-700 hover:bg-blue-50"><Scale className="w-3 h-3" /> ACA Library</Button></Link>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto gap-0.5">
          <TabsTrigger value="coverage" className="gap-1 text-xs"><Target className="w-3 h-3" /> Coverage</TabsTrigger>
          <TabsTrigger value="browse" className="gap-1 text-xs"><Search className="w-3 h-3" /> Browse</TabsTrigger>
          <TabsTrigger value="manual" className="gap-1 text-xs"><BookOpen className="w-3 h-3" /> Manual Topics</TabsTrigger>
          <TabsTrigger value="bulk_ai" className="gap-1 text-xs"><Sparkles className="w-3 h-3" /> Bulk AI Generate</TabsTrigger>
          <TabsTrigger value="seeds" className="gap-1 text-xs"><Database className="w-3 h-3" /> Seed Data</TabsTrigger>
          <TabsTrigger value="editor" disabled={!editingTarget} className="gap-1 text-xs">
            <Edit2 className="w-3 h-3" /> Editor {editingTarget && <span className="max-w-24 truncate">— {editingTarget.target_label}</span>}
          </TabsTrigger>
          <TabsTrigger value="ai_review" className="gap-1 text-xs">
            <MessageSquare className="w-3 h-3" /> AI Review
            {pendingReviewCount > 0 && <Badge className="ml-1 text-[9px] bg-destructive text-white">{pendingReviewCount}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* ── COVERAGE ─────────────────────────────────────────────────────── */}
        <TabsContent value="coverage" className="mt-5">
          <ContentCoverageTab
            contentMap={contentMap}
            onEditTarget={(t) => openEditor(t)}
            onBrowseModule={(mod) => { setSelectedModule(mod); setTab("browse"); }}
            onBulkAIModule={handleBulkAIModule}
          />
        </TabsContent>

        {/* ── BROWSE BY MODULE ────────────────────────────────────────────── */}
        <TabsContent value="browse" className="mt-5 space-y-4">
          {!selectedModule ? (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search targets by label, code, module, or content text…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              {search ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">{searchFiltered.length} result{searchFiltered.length !== 1 ? "s" : ""} — searching labels, codes, titles, keywords and short help</p>
                  {searchFiltered.length === 0 && <p className="text-sm text-muted-foreground">No targets found.</p>}
                  {searchFiltered.map(t => {
                    const c = contentMap[t.target_code];
                    return (
                      <Card key={t.target_code} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-3 flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <span className="text-sm font-medium">{t.target_label}</span>
                              <Badge variant="outline" className="text-[8px]">{t.module_code}</Badge>
                              <Badge variant="outline" className="text-[8px]">{t.component_type}</Badge>
                              {!c && <Badge className="text-[8px] bg-amber-100 text-amber-700">Missing</Badge>}
                              {c?.content_status === "active" && <Badge className="text-[8px] bg-emerald-100 text-emerald-700">Active</Badge>}
                            </div>
                            <p className="text-[10px] font-mono text-muted-foreground">{t.target_code}</p>
                            {c?.short_help_text && <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1 italic">{c.short_help_text}</p>}
                          </div>
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => openEditor(t)}>
                            <Edit2 className="w-3 h-3" /> {c ? "Edit" : "Add Help"}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {MODULES.map(mod => {
                    const targets = HELP_TARGETS.filter(t => t.module_code === mod);
                    const modActive = targets.filter(t => contentMap[t.target_code]?.content_status === "active").length;
                    const modMissing = targets.filter(t => !contentMap[t.target_code]).length;
                    const pct = Math.round((modActive / targets.length) * 100);
                    return (
                      <Card key={mod} className="cursor-pointer hover:border-primary/50 transition-all group" onClick={() => setSelectedModule(mod)}>
                        <CardContent className="p-4">
                          <p className="font-semibold text-sm">{MODULE_LABELS[mod] || mod}</p>
                          <p className="text-[11px] text-muted-foreground">{targets.length} targets</p>
                          <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${pct === 100 ? "bg-emerald-500" : pct > 50 ? "bg-primary" : "bg-amber-500"}`} style={{ width: `${pct}%` }} />
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-muted-foreground">{modActive}/{targets.length}</span>
                            {modMissing > 0
                              ? <Badge className="text-[8px] bg-amber-100 text-amber-700">{modMissing} missing</Badge>
                              : <Badge className="text-[8px] bg-emerald-100 text-emerald-700">Complete</Badge>
                            }
                          </div>
                          {modMissing > 0 && (
                            <Button size="sm" variant="ghost" className="w-full mt-2 h-6 text-[10px] gap-1 text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => { e.stopPropagation(); handleBulkAIModule(mod); }}>
                              <Sparkles className="w-3 h-3" /> Generate {modMissing} missing
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => setSelectedModule(null)} className="text-primary hover:underline text-sm">← All Modules</button>
                <span className="text-muted-foreground">/</span>
                <span className="font-semibold text-sm">{MODULE_LABELS[selectedModule]}</span>
                <div className="ml-auto flex gap-2">
                  <Button size="sm" variant="outline" className="h-7 gap-1 text-xs text-purple-600 border-purple-200"
                    onClick={() => handleBulkAIModule(selectedModule)}>
                    <Sparkles className="w-3 h-3" /> Generate Missing for Module
                  </Button>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setSelectedModule(null)}><X className="w-3 h-3" /></Button>
                </div>
              </div>
              {Object.entries(moduleGroups).map(([pageCode, targets]) => {
                const activeInPage = targets.filter(t => contentMap[t.target_code]?.content_status === "active").length;
                return (
                  <Card key={pageCode}>
                    <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/30"
                      onClick={() => setExpandedPages(p => ({ ...p, [pageCode]: !p[pageCode] }))}>
                      <div className="flex items-center gap-2">
                        {expandedPages[pageCode] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        <span className="font-medium text-sm">{pageCode.replace(/_/g, " ")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${Math.round(activeInPage/targets.length*100)}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{activeInPage}/{targets.length}</span>
                      </div>
                    </button>
                    {expandedPages[pageCode] && (
                      <CardContent className="pt-0 pb-3 space-y-0.5">
                        {targets.map(t => {
                          const c = contentMap[t.target_code];
                          return (
                            <div key={t.target_code} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/50 gap-2 group">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Badge variant="outline" className="text-[8px] py-0 flex-shrink-0">{t.component_type}</Badge>
                                <span className="text-xs truncate">{t.target_label}</span>
                                {!c && <Badge className="text-[8px] bg-red-100 text-red-700 flex-shrink-0">Missing</Badge>}
                                {c?.content_status === "draft" && <Badge className="text-[8px] bg-amber-100 text-amber-700 flex-shrink-0">Draft</Badge>}
                                {c?.content_status === "active" && <Badge className="text-[8px] bg-emerald-100 text-emerald-700 flex-shrink-0">Active</Badge>}
                                {c?.content_status === "review_required" && <Badge className="text-[8px] bg-orange-100 text-orange-700 flex-shrink-0">Review</Badge>}
                                {c?.short_help_text && (
                                  <span className="text-[9px] text-muted-foreground italic truncate hidden lg:block max-w-40">{c.short_help_text}</span>
                                )}
                              </div>
                              <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" title="Edit" onClick={() => openEditor(t)}>
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                                {c && (
                                  <>
                                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" title="Toggle Status"
                                      onClick={() => toggleStatus.mutate({ id: c.id, status: c.content_status })}>
                                      {c.content_status === "active" ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" title="Delete"
                                      onClick={() => { if (confirm("Delete this help content?")) deleteContent.mutate(c.id); }}>
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── MANUAL TOPICS ───────────────────────────────────────────────── */}
        <TabsContent value="manual" className="mt-5">
          <ManualTopicsTab
            onEditTopic={(t) => openTopicEditor(t)}
            onNewTopic={() => openTopicEditor(null)}
          />
        </TabsContent>

        {/* ── BULK AI GENERATE ────────────────────────────────────────────── */}
        <TabsContent value="bulk_ai" className="mt-5">
          <BulkAIGeneratePanel contentMap={contentMap} presetModule={bulkAIModule} />
        </TabsContent>

        {/* ── SEED DATA ───────────────────────────────────────────────────── */}
        <TabsContent value="seeds" className="mt-5">
          <AdminSeedPanel />
        </TabsContent>

        {/* ── CONTEXTUAL CONTENT EDITOR ───────────────────────────────────── */}
        <TabsContent value="editor" className="mt-5">
          {editingTarget ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => setTab("coverage")}>
                    <X className="w-3 h-3" /> Close Editor
                  </Button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{editingTarget.target_label}</span>
                      <Badge variant="outline" className="text-[9px]">{editingTarget.component_type}</Badge>
                      <Badge variant="outline" className="text-[9px]">{editingTarget.module_code}</Badge>
                    </div>
                    <code className="text-[10px] font-mono text-muted-foreground">{editingTarget.target_code}</code>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => setPreview(!preview)} className="gap-1">
                    <Eye className="w-3.5 h-3.5" /> {preview ? "Edit" : "Preview"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={generateWithAI} disabled={aiGenerating} className="gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> {aiGenerating ? "Generating…" : "AI Generate"}
                  </Button>
                  <Button size="sm" onClick={() => saveContent.mutate(form)} disabled={saveContent.isPending} className="gap-1">
                    <Save className="w-3.5 h-3.5" /> {saveContent.isPending ? "Saving…" : "Save"}
                  </Button>
                </div>
              </div>

              {/* Quality score */}
              <ContentQualityScore form={form} />

              {preview ? (
                <Card className="max-w-xl">
                  <CardContent className="p-5 space-y-4">
                    <h3 className="font-semibold text-base">{form.help_title}</h3>
                    {form.short_help_text && <p className="text-sm font-medium bg-primary/5 border border-primary/10 rounded-lg p-3">{form.short_help_text}</p>}
                    {form.detailed_help_text && <div className="prose prose-sm max-w-none text-sm"><ReactMarkdown>{form.detailed_help_text}</ReactMarkdown></div>}
                    {form.expected_user_action_text && <div className="rounded-lg border p-3"><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">What to do</p><p className="text-sm">{form.expected_user_action_text}</p></div>}
                    {form.warnings_text && <div className="rounded-lg bg-amber-50 border border-amber-200 p-3"><p className="text-xs font-semibold text-amber-700 mb-1">⚠ Warning</p><p className="text-sm text-amber-800">{form.warnings_text}</p></div>}
                    {form.examples_text && <div className="rounded-lg border p-3"><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Examples</p><p className="text-sm">{form.examples_text}</p></div>}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div><Label className="text-xs">Help Title *</Label><Input value={form.help_title} onChange={e => setForm(p => ({ ...p, help_title: e.target.value }))} className="mt-1 text-xs" /></div>
                    <div><Label className="text-xs">Short Help Text *</Label><Textarea value={form.short_help_text} onChange={e => setForm(p => ({ ...p, short_help_text: e.target.value }))} className="mt-1 text-xs h-16" /></div>
                    <div><Label className="text-xs">Expected User Action</Label><Textarea value={form.expected_user_action_text} onChange={e => setForm(p => ({ ...p, expected_user_action_text: e.target.value }))} className="mt-1 text-xs h-14" /></div>
                    <div><Label className="text-xs">Allowed Values</Label><Textarea value={form.allowed_values_text} onChange={e => setForm(p => ({ ...p, allowed_values_text: e.target.value }))} className="mt-1 text-xs h-12" /></div>
                    <div><Label className="text-xs">Examples</Label><Textarea value={form.examples_text} onChange={e => setForm(p => ({ ...p, examples_text: e.target.value }))} className="mt-1 text-xs h-12" /></div>
                    <div><Label className="text-xs">Warnings</Label><Textarea value={form.warnings_text} onChange={e => setForm(p => ({ ...p, warnings_text: e.target.value }))} className="mt-1 text-xs h-12" /></div>
                    <div><Label className="text-xs">Validation Notes</Label><Textarea value={form.validation_notes_text} onChange={e => setForm(p => ({ ...p, validation_notes_text: e.target.value }))} className="mt-1 text-xs h-10" /></div>
                    <div><Label className="text-xs">Dependency Notes</Label><Textarea value={form.dependency_notes_text} onChange={e => setForm(p => ({ ...p, dependency_notes_text: e.target.value }))} className="mt-1 text-xs h-10" /></div>
                    <div>
                      <Label className="text-xs">Content Status</Label>
                      <Select value={form.content_status} onValueChange={v => setForm(p => ({ ...p, content_status: v }))}>
                        <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="review_required">Review Required</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Role Visibility</Label>
                      <Select value={form.role_visibility} onValueChange={v => setForm(p => ({ ...p, role_visibility: v }))}>
                        <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Users</SelectItem>
                          <SelectItem value="admin">Admin Only</SelectItem>
                          <SelectItem value="user">Regular Users</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Detailed Help Text (Markdown) *</Label>
                      <Textarea value={form.detailed_help_text} onChange={e => setForm(p => ({ ...p, detailed_help_text: e.target.value }))} className="mt-1 text-xs h-56 font-mono" />
                      <p className="text-[10px] text-muted-foreground mt-0.5">{form.detailed_help_text.length} chars</p>
                    </div>
                    <div><Label className="text-xs">Feature Capabilities</Label><Textarea value={form.feature_capabilities_text} onChange={e => setForm(p => ({ ...p, feature_capabilities_text: e.target.value }))} className="mt-1 text-xs h-14" /></div>
                    <div><Label className="text-xs">Process Meaning</Label><Textarea value={form.process_meaning_text} onChange={e => setForm(p => ({ ...p, process_meaning_text: e.target.value }))} className="mt-1 text-xs h-14" /></div>
                    <div><Label className="text-xs">Related Topics (comma-separated)</Label><Input value={form.related_topics_text} onChange={e => setForm(p => ({ ...p, related_topics_text: e.target.value }))} className="mt-1 text-xs" /></div>
                    <div><Label className="text-xs">Search Keywords (comma-separated)</Label><Input value={form.search_keywords} onChange={e => setForm(p => ({ ...p, search_keywords: e.target.value }))} className="mt-1 text-xs" /></div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <Edit2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No target selected. Click Edit on any target in the Coverage or Browse tabs.</p>
            </div>
          )}
        </TabsContent>

        {/* ── AI REVIEW ───────────────────────────────────────────────────── */}
        <TabsContent value="ai_review" className="mt-5">
          <AIReviewTab onEditTarget={(t) => openEditor(t)} />
        </TabsContent>
      </Tabs>

      {/* Manual Topic Editor Modal */}
      {topicEditorOpen && (
        <TopicEditorModal
          topic={editingTopic}
          onClose={closeTopicEditor}
        />
      )}
    </div>
  );
}