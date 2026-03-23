import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";
import {
  Search, ChevronRight, ChevronDown, Edit2, Eye, EyeOff, Trash2,
  Sparkles, Save, AlertCircle, CheckCircle2, BarChart2, RefreshCw, Play,
  LayoutDashboard, FileBarChart, TrendingUp, BookOpen
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import ReactMarkdown from "react-markdown";
import { HELP_TARGETS, MODULES } from "@/lib/helpTargetRegistry";

const MODULE_LABELS = {
  DASHBOARD:"Dashboard", CASES:"Cases", CENSUS:"Census", QUOTES:"Quotes",
  PROPOSALS:"Proposals", ENROLLMENT:"Enrollment", RENEWALS:"Renewals",
  PLANS:"Plan Library", POLICYMATCH:"PolicyMatchAI", EMPLOYERS:"Employers",
  TASKS:"Tasks", CONTRIBUTIONS:"Contributions", EXCEPTIONS:"Exceptions",
  SETTINGS:"Settings", PORTALS:"Portals",
};

const EMPTY_FORM = {
  help_title: "", short_help_text: "", detailed_help_text: "", feature_capabilities_text: "",
  process_meaning_text: "", expected_user_action_text: "", allowed_values_text: "",
  examples_text: "", dependency_notes_text: "", warnings_text: "",
  validation_notes_text: "", related_topics_text: "", search_keywords: "",
  role_visibility: "all", content_status: "active",
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
  const [seeding, setSeeding] = useState(false);
  const [seedingDashboard, setSeedingDashboard] = useState(false);
  const [preview, setPreview] = useState(false);

  const { data: contents = [] } = useQuery({
    queryKey: ["help-contents-admin"],
    queryFn: () => base44.entities.HelpContent.list("-updated_date", 500),
  });

  const { data: aiLogs = [] } = useQuery({
    queryKey: ["helpai-logs"],
    queryFn: () => base44.entities.HelpAIQuestionLog.filter({ requires_admin_review: true }, "-created_date", 50),
  });

  const contentMap = useMemo(() =>
    contents.reduce((acc, c) => { acc[c.help_target_code] = c; return acc; }, {}),
  [contents]);

  const covered = HELP_TARGETS.filter(t => contentMap[t.target_code]?.content_status === "active").length;
  const missing = HELP_TARGETS.filter(t => !contentMap[t.target_code]).length;
  const drafts = contents.filter(c => c.content_status === "draft").length;

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
      toast({ title: "Help content saved", description: `Content for "${editingTarget.target_label}" saved with version history.` });
      setEditingTarget(null);
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
      setForm({ ...EMPTY_FORM, help_title: target.target_label, short_help_text: "" });
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
      toast({ title: "AI Generated", description: "Content generated. Review and save." });
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setAiGenerating(false);
    }
  };

  const runSeed = async () => {
    setSeeding(true);
    try {
      const res = await base44.functions.invoke("seedHelpContent", {});
      const data = res.data;
      queryClient.invalidateQueries({ queryKey: ["help-contents-admin"] });
      toast({ title: "Seed Complete", description: `Created ${data.created} records, skipped ${data.skipped}.` });
    } catch (e) {
      toast({ title: "Seed Error", description: e.message, variant: "destructive" });
    } finally {
      setSeeding(false);
    }
  };

  const searchFiltered = useMemo(() => {
    if (!search) return [];
    const q = search.toLowerCase();
    return HELP_TARGETS.filter(t =>
      t.target_label.toLowerCase().includes(q) ||
      t.target_code.toLowerCase().includes(q) ||
      t.module_code.toLowerCase().includes(q)
    ).slice(0, 30);
  }, [search]);

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Help Management Console"
        description="Manage help content for every element in the application"
        actions={
          <Button onClick={runSeed} disabled={seeding} variant="outline" size="sm" className="gap-1">
            <Play className="w-3.5 h-3.5" /> {seeding ? "Seeding…" : "Seed Default Help"}
          </Button>
        }
      />

      {/* Quick nav to other admin pages */}
      <div className="flex flex-wrap gap-2">
        <Link to="/help-dashboard"><Button size="sm" variant="outline" className="gap-1 text-xs"><LayoutDashboard className="w-3 h-3" /> Help Dashboard</Button></Link>
        <Link to="/help-coverage"><Button size="sm" variant="outline" className="gap-1 text-xs"><FileBarChart className="w-3 h-3" /> Coverage Report</Button></Link>
        <Link to="/help-analytics"><Button size="sm" variant="outline" className="gap-1 text-xs"><TrendingUp className="w-3 h-3" /> Search Analytics</Button></Link>
        <Link to="/help-manual-manager"><Button size="sm" variant="outline" className="gap-1 text-xs"><BookOpen className="w-3 h-3" /> Manual Manager</Button></Link>
        <Link to="/help-target-registry"><Button size="sm" variant="outline" className="gap-1 text-xs"><BarChart2 className="w-3 h-3" /> Target Registry</Button></Link>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="coverage">Coverage</TabsTrigger>
          <TabsTrigger value="browse">Browse by Module</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="editor" disabled={!editingTarget}>Editor {editingTarget && `— ${editingTarget.target_label}`}</TabsTrigger>
          <TabsTrigger value="ai_review">
            AI Review {aiLogs.length > 0 && <Badge className="ml-1 text-[9px] bg-destructive">{aiLogs.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* ── COVERAGE ── */}
        <TabsContent value="coverage" className="mt-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Targets", value: HELP_TARGETS.length, color: "text-primary" },
              { label: "With Active Help", value: covered, color: "text-emerald-600" },
              { label: "Missing Help", value: missing, color: "text-red-600" },
              { label: "Draft Content", value: drafts, color: "text-amber-600" },
            ].map(kpi => (
              <Card key={kpi.label}>
                <CardContent className="p-4 text-center">
                  <p className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader><CardTitle className="text-sm">Coverage by Module</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {MODULES.map(mod => {
                const targets = HELP_TARGETS.filter(t => t.module_code === mod);
                const modCovered = targets.filter(t => contentMap[t.target_code]?.content_status === "active").length;
                const pct = Math.round((modCovered / targets.length) * 100);
                return (
                  <div key={mod} className="flex items-center gap-3">
                    <button
                      onClick={() => { setSelectedModule(mod); setTab("browse"); }}
                      className="w-28 text-xs text-left font-medium hover:text-primary truncate"
                    >
                      {MODULE_LABELS[mod] || mod}
                    </button>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pct === 100 ? "bg-emerald-500" : pct > 50 ? "bg-primary" : "bg-amber-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-16 text-right">{modCovered}/{targets.length}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── BROWSE ── */}
        <TabsContent value="browse" className="mt-6 space-y-4">
          {!selectedModule ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {MODULES.map(mod => {
                const targets = HELP_TARGETS.filter(t => t.module_code === mod);
                const modMissing = targets.filter(t => !contentMap[t.target_code]).length;
                return (
                  <Card key={mod} className="cursor-pointer hover:border-primary/50 transition-all"
                    onClick={() => setSelectedModule(mod)}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">{MODULE_LABELS[mod] || mod}</p>
                        <p className="text-[11px] text-muted-foreground">{targets.length} targets</p>
                      </div>
                      <div className="text-right">
                        {modMissing > 0
                          ? <Badge className="text-[9px] bg-amber-100 text-amber-700">{modMissing} missing</Badge>
                          : <Badge className="text-[9px] bg-emerald-100 text-emerald-700">Complete</Badge>
                        }
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <button onClick={() => setSelectedModule(null)} className="text-primary hover:underline text-sm">← All Modules</button>
                <span className="text-muted-foreground">/</span>
                <span className="font-semibold text-sm">{MODULE_LABELS[selectedModule]}</span>
              </div>
              {Object.entries(moduleGroups).map(([pageCode, targets]) => (
                <Card key={pageCode}>
                  <button
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/30"
                    onClick={() => setExpandedPages(p => ({ ...p, [pageCode]: !p[pageCode] }))}
                  >
                    <div className="flex items-center gap-2">
                      {expandedPages[pageCode] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      <span className="font-medium text-sm">{pageCode.replace(/_/g, " ")}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {targets.filter(t => contentMap[t.target_code]?.content_status === "active").length}/{targets.length} active
                    </span>
                  </button>
                  {expandedPages[pageCode] && (
                    <CardContent className="pt-0 pb-3 space-y-1">
                      {targets.map(t => {
                        const c = contentMap[t.target_code];
                        return (
                          <div key={t.target_code} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/50 gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Badge variant="outline" className="text-[8px] py-0 flex-shrink-0">{t.component_type}</Badge>
                              <span className="text-xs truncate">{t.target_label}</span>
                              {!c && <Badge className="text-[8px] bg-amber-100 text-amber-700 flex-shrink-0">Missing</Badge>}
                              {c?.content_status === "draft" && <Badge className="text-[8px] bg-slate-100 flex-shrink-0">Draft</Badge>}
                              {c?.content_status === "review_required" && <Badge className="text-[8px] bg-orange-100 text-orange-700 flex-shrink-0">Review</Badge>}
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => openEditor(t)}>
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              {c && (
                                <>
                                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0"
                                    onClick={() => toggleStatus.mutate({ id: c.id, status: c.content_status })}>
                                    {c.content_status === "active" ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive"
                                    onClick={() => deleteContent.mutate(c.id)}>
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
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── SEARCH ── */}
        <TabsContent value="search" className="mt-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search help targets by label, code, or module…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchFiltered.length > 0 && (
            <div className="space-y-2">
              {searchFiltered.map(t => {
                const c = contentMap[t.target_code];
                return (
                  <Card key={t.target_code} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-3 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium">{t.target_label}</span>
                          <Badge variant="outline" className="text-[8px]">{t.module_code}</Badge>
                          <Badge variant="outline" className="text-[8px]">{t.component_type}</Badge>
                          {!c && <Badge className="text-[8px] bg-amber-100 text-amber-700">Missing</Badge>}
                        </div>
                        <p className="text-[10px] font-mono text-muted-foreground">{t.target_code}</p>
                      </div>
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => openEditor(t)}>
                        <Edit2 className="w-3 h-3" /> {c ? "Edit" : "Add Help"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
          {search && searchFiltered.length === 0 && (
            <p className="text-sm text-muted-foreground">No targets found matching "{search}".</p>
          )}
        </TabsContent>

        {/* ── EDITOR ── */}
        <TabsContent value="editor" className="mt-6">
          {editingTarget && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="font-semibold">{editingTarget.target_label}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{editingTarget.target_code}</code>
                    <Badge variant="outline" className="text-[9px]">{editingTarget.component_type}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
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

              {preview ? (
                <Card className="max-w-lg">
                  <CardContent className="p-5 space-y-4">
                    <h3 className="font-semibold text-base">{form.help_title}</h3>
                    {form.short_help_text && <p className="text-sm font-medium bg-primary/5 border border-primary/10 rounded-lg p-3">{form.short_help_text}</p>}
                    {form.detailed_help_text && <div className="prose prose-sm max-w-none text-sm"><ReactMarkdown>{form.detailed_help_text}</ReactMarkdown></div>}
                    {form.expected_user_action_text && <div className="rounded-lg border p-3"><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">What to do</p><p className="text-sm">{form.expected_user_action_text}</p></div>}
                    {form.warnings_text && <div className="rounded-lg bg-amber-50 border border-amber-200 p-3"><p className="text-xs font-semibold text-amber-700 mb-1">⚠ Warning</p><p className="text-sm text-amber-800">{form.warnings_text}</p></div>}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div><Label className="text-xs">Help Title *</Label><Input value={form.help_title} onChange={e => setForm(p => ({ ...p, help_title: e.target.value }))} className="mt-1 text-xs" /></div>
                    <div><Label className="text-xs">Short Help Text *</Label><Textarea value={form.short_help_text} onChange={e => setForm(p => ({ ...p, short_help_text: e.target.value }))} className="mt-1 text-xs h-16" /></div>
                    <div><Label className="text-xs">Expected User Action</Label><Textarea value={form.expected_user_action_text} onChange={e => setForm(p => ({ ...p, expected_user_action_text: e.target.value }))} className="mt-1 text-xs h-16" /></div>
                    <div><Label className="text-xs">Allowed Values</Label><Textarea value={form.allowed_values_text} onChange={e => setForm(p => ({ ...p, allowed_values_text: e.target.value }))} className="mt-1 text-xs h-12" /></div>
                    <div><Label className="text-xs">Examples</Label><Textarea value={form.examples_text} onChange={e => setForm(p => ({ ...p, examples_text: e.target.value }))} className="mt-1 text-xs h-12" /></div>
                    <div><Label className="text-xs">Warnings</Label><Textarea value={form.warnings_text} onChange={e => setForm(p => ({ ...p, warnings_text: e.target.value }))} className="mt-1 text-xs h-12" /></div>
                    <div><Label className="text-xs">Validation Notes</Label><Textarea value={form.validation_notes_text} onChange={e => setForm(p => ({ ...p, validation_notes_text: e.target.value }))} className="mt-1 text-xs h-12" /></div>
                    <div><Label className="text-xs">Dependency Notes</Label><Textarea value={form.dependency_notes_text} onChange={e => setForm(p => ({ ...p, dependency_notes_text: e.target.value }))} className="mt-1 text-xs h-12" /></div>
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
                  </div>
                  <div className="space-y-3">
                    <div><Label className="text-xs">Detailed Help Text (Markdown) *</Label><Textarea value={form.detailed_help_text} onChange={e => setForm(p => ({ ...p, detailed_help_text: e.target.value }))} className="mt-1 text-xs h-52 font-mono" /></div>
                    <div><Label className="text-xs">Feature Capabilities</Label><Textarea value={form.feature_capabilities_text} onChange={e => setForm(p => ({ ...p, feature_capabilities_text: e.target.value }))} className="mt-1 text-xs h-16" /></div>
                    <div><Label className="text-xs">Process Meaning</Label><Textarea value={form.process_meaning_text} onChange={e => setForm(p => ({ ...p, process_meaning_text: e.target.value }))} className="mt-1 text-xs h-16" /></div>
                    <div><Label className="text-xs">Related Topics (comma-separated)</Label><Input value={form.related_topics_text} onChange={e => setForm(p => ({ ...p, related_topics_text: e.target.value }))} className="mt-1 text-xs" /></div>
                    <div><Label className="text-xs">Search Keywords (comma-separated)</Label><Input value={form.search_keywords} onChange={e => setForm(p => ({ ...p, search_keywords: e.target.value }))} className="mt-1 text-xs" /></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ── AI REVIEW ── */}
        <TabsContent value="ai_review" className="mt-6 space-y-4">
          <p className="text-sm text-muted-foreground">Questions HelpAI answered with low confidence — review and improve the underlying help content.</p>
          {aiLogs.length === 0 ? (
            <Card className="text-center py-10">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500/30 mb-2" />
              <p className="text-sm text-muted-foreground">No low-confidence questions flagged for review.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {aiLogs.map(log => (
                <Card key={log.id} className="border-amber-200">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-amber-700 mb-1">User question ({log.page_code}):</p>
                        <p className="font-semibold text-sm">"{log.question_text}"</p>
                      </div>
                      <Badge className="text-[9px] bg-amber-100 text-amber-700 flex-shrink-0">
                        {Math.round((log.answer_confidence || 0) * 100)}% confidence
                      </Badge>
                    </div>
                    {log.answer_text && (
                      <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
                        <p className="font-medium mb-1">HelpAI's answer:</p>
                        <p className="line-clamp-3">{log.answer_text}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 gap-1"
                        onClick={() => {
                          base44.entities.HelpAIQuestionLog.update(log.id, { reviewed_by_admin: true, requires_admin_review: false });
                          queryClient.invalidateQueries({ queryKey: ["helpai-logs"] });
                        }}
                      >
                        <CheckCircle2 className="w-3 h-3" /> Mark Reviewed
                      </Button>
                      {log.source_target_codes && log.source_target_codes.length > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 gap-1"
                          onClick={() => {
                            const t = HELP_TARGETS.find(ht => ht.target_code === log.source_target_codes[0]);
                            if (t) openEditor(t);
                          }}
                        >
                          <Edit2 className="w-3 h-3" /> Improve Help Content
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}