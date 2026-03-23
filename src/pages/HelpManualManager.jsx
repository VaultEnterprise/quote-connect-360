import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  Plus, Edit2, Eye, EyeOff, Trash2, Sparkles, Save, BookOpen, Globe, Lock
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import PageHeader from "@/components/shared/PageHeader";
import { MODULES } from "@/lib/helpTargetRegistry";

const MODULE_LABELS = {
  DASHBOARD:"Dashboard", CASES:"Cases", CENSUS:"Census", QUOTES:"Quotes",
  PROPOSALS:"Proposals", ENROLLMENT:"Enrollment", RENEWALS:"Renewals",
  PLANS:"Plan Library", POLICYMATCH:"PolicyMatchAI", EMPLOYERS:"Employers",
  TASKS:"Tasks", CONTRIBUTIONS:"Contributions", EXCEPTIONS:"Exceptions",
  SETTINGS:"Settings", PORTALS:"Portals",
};

const TOPIC_TYPES = ["module_guide", "page_guide", "workflow_guide", "faq", "troubleshooting", "how_to", "reference"];

const EMPTY_FORM = {
  topic_code: "", topic_title: "", topic_summary: "", topic_body: "",
  topic_type: "page_guide", module_code: "", is_published: false,
};

export default function HelpManualManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [preview, setPreview] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [search, setSearch] = useState("");

  const { data: topics = [] } = useQuery({
    queryKey: ["help-manual-topics"],
    queryFn: () => base44.entities.HelpManualTopic.list("-updated_date", 200),
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingId) {
        return base44.entities.HelpManualTopic.update(editingId, { ...data, last_updated_by: user?.email });
      } else {
        return base44.entities.HelpManualTopic.create({ ...data, last_updated_by: user?.email });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["help-manual-topics"] });
      toast({ title: "Topic saved" });
      setEditingId(null);
      setForm(EMPTY_FORM);
    },
  });

  const togglePublish = useMutation({
    mutationFn: ({ id, current }) => base44.entities.HelpManualTopic.update(id, { is_published: !current }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["help-manual-topics"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.HelpManualTopic.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["help-manual-topics"] }),
  });

  const openEditor = (topic) => {
    setEditingId(topic.id);
    setForm({
      topic_code: topic.topic_code || "",
      topic_title: topic.topic_title || "",
      topic_summary: topic.topic_summary || "",
      topic_body: topic.topic_body || "",
      topic_type: topic.topic_type || "page_guide",
      module_code: topic.module_code || "",
      is_published: topic.is_published || false,
    });
    setPreview(false);
  };

  const generateAI = async () => {
    if (!form.topic_title) return;
    setAiGenerating(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Write a comprehensive help manual topic for ConnectQuote 360 (a benefits administration platform) on the topic: "${form.topic_title}".
Type: ${form.topic_type}. Module: ${form.module_code || "General"}.
${form.topic_summary ? "Context: " + form.topic_summary : ""}

Write a detailed markdown article (300-600 words) with ## headers, bullet points, and practical guidance.
Return JSON: { "topic_body": "...markdown...", "topic_summary": "1-2 sentence summary" }`,
        response_json_schema: {
          type: "object",
          properties: { topic_body: { type: "string" }, topic_summary: { type: "string" } }
        }
      });
      setForm(p => ({ ...p, topic_body: res.topic_body || p.topic_body, topic_summary: res.topic_summary || p.topic_summary }));
      toast({ title: "AI Generated", description: "Review and save the content." });
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setAiGenerating(false);
    }
  };

  if (user?.role !== "admin") return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Admin access required.</p></div>;

  const filtered = topics.filter(t =>
    !search || t.topic_title?.toLowerCase().includes(search.toLowerCase()) ||
    t.module_code?.toLowerCase().includes(search.toLowerCase())
  );

  if (editingId !== null || form.topic_code) {
    return (
      <div className="space-y-4">
        <PageHeader
          title={editingId ? "Edit Manual Topic" : "New Manual Topic"}
          description="Create or update a long-form help manual article"
          actions={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setEditingId(null); setForm(EMPTY_FORM); }}>Cancel</Button>
              <Button variant="outline" size="sm" onClick={() => setPreview(!preview)} className="gap-1">
                <Eye className="w-3.5 h-3.5" /> {preview ? "Edit" : "Preview"}
              </Button>
              <Button variant="outline" size="sm" onClick={generateAI} disabled={aiGenerating || !form.topic_title} className="gap-1">
                <Sparkles className="w-3.5 h-3.5" /> {aiGenerating ? "Generating…" : "AI Generate"}
              </Button>
              <Button size="sm" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="gap-1">
                <Save className="w-3.5 h-3.5" /> Save
              </Button>
            </div>
          }
        />

        {preview ? (
          <Card className="max-w-3xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <CardTitle>{form.topic_title}</CardTitle>
              </div>
              {form.topic_summary && <p className="text-sm text-muted-foreground">{form.topic_summary}</p>}
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none"><ReactMarkdown>{form.topic_body}</ReactMarkdown></div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div><Label className="text-xs">Topic Code *</Label><Input value={form.topic_code} onChange={e => setForm(p => ({ ...p, topic_code: e.target.value }))} placeholder="e.g. CASES_LIFECYCLE" className="mt-1 text-xs font-mono" /></div>
              <div><Label className="text-xs">Topic Title *</Label><Input value={form.topic_title} onChange={e => setForm(p => ({ ...p, topic_title: e.target.value }))} className="mt-1 text-xs" /></div>
              <div><Label className="text-xs">Summary</Label><Textarea value={form.topic_summary} onChange={e => setForm(p => ({ ...p, topic_summary: e.target.value }))} className="mt-1 text-xs h-16" /></div>
              <div>
                <Label className="text-xs">Topic Type</Label>
                <Select value={form.topic_type} onValueChange={v => setForm(p => ({ ...p, topic_type: v }))}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{TOPIC_TYPES.map(t => <SelectItem key={t} value={t} className="text-xs">{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Module</Label>
                <Select value={form.module_code} onValueChange={v => setForm(p => ({ ...p, module_code: v }))}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="Select module" /></SelectTrigger>
                  <SelectContent>{MODULES.map(m => <SelectItem key={m} value={m} className="text-xs">{MODULE_LABELS[m] || m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input type="checkbox" id="published" checked={form.is_published} onChange={e => setForm(p => ({ ...p, is_published: e.target.checked }))} />
                <Label htmlFor="published" className="text-xs cursor-pointer">Published (visible to users)</Label>
              </div>
            </div>
            <div>
              <Label className="text-xs">Topic Body (Markdown) *</Label>
              <Textarea value={form.topic_body} onChange={e => setForm(p => ({ ...p, topic_body: e.target.value }))} className="mt-1 text-xs font-mono h-80" placeholder="## Overview&#10;&#10;Write your topic here..." />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Help Manual Manager"
        description="Create and manage long-form help topics for the user-facing Help Manual"
        actions={
          <Button size="sm" onClick={() => setForm({ ...EMPTY_FORM, topic_code: `TOPIC_${Date.now()}` })} className="gap-1">
            <Plus className="w-3.5 h-3.5" /> New Topic
          </Button>
        }
      />

      <Input placeholder="Search topics…" value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />

      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/20 mb-3" />
          <p className="text-muted-foreground text-sm">No manual topics yet.</p>
          <Button size="sm" className="mt-3" onClick={() => setForm({ ...EMPTY_FORM, topic_code: `TOPIC_${Date.now()}` })}>Create First Topic</Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(topic => (
            <Card key={topic.id} className={!topic.is_published ? "opacity-70" : ""}>
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">{topic.topic_title}</h3>
                    <Badge variant="outline" className="text-[8px]">{topic.topic_type?.replace(/_/g," ")}</Badge>
                    {topic.module_code && <Badge className="text-[8px] bg-blue-50 text-blue-700">{MODULE_LABELS[topic.module_code] || topic.module_code}</Badge>}
                    {topic.is_published
                      ? <Badge className="text-[8px] bg-emerald-100 text-emerald-700 flex items-center gap-0.5"><Globe className="w-2.5 h-2.5" /> Published</Badge>
                      : <Badge className="text-[8px] bg-slate-100 text-slate-600 flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" /> Draft</Badge>
                    }
                  </div>
                  {topic.topic_summary && <p className="text-xs text-muted-foreground line-clamp-2">{topic.topic_summary}</p>}
                  <p className="text-[10px] font-mono text-muted-foreground mt-1">{topic.topic_code}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEditor(topic)}><Edit2 className="w-3 h-3" /></Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => togglePublish.mutate({ id: topic.id, current: topic.is_published })}>
                    {topic.is_published ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => deleteMutation.mutate(topic.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}