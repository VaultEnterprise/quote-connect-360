import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import ReactMarkdown from "react-markdown";
import { Save, Eye, Sparkles, X, BookOpen } from "lucide-react";
import { MODULES } from "@/lib/helpTargetRegistry";

const MODULE_LABELS = {
  DASHBOARD:"Dashboard", CASES:"Cases", CENSUS:"Census", QUOTES:"Quotes",
  PROPOSALS:"Proposals", ENROLLMENT:"Enrollment", RENEWALS:"Renewals",
  PLANS:"Plan Library", POLICYMATCH:"PolicyMatchAI", EMPLOYERS:"Employers",
  TASKS:"Tasks", CONTRIBUTIONS:"Contributions", EXCEPTIONS:"Exceptions",
  SETTINGS:"Settings", PORTALS:"Portals",
};

const TOPIC_TYPES = ["module_guide","page_guide","workflow_guide","faq","troubleshooting","how_to","reference","release_note"];
const EMPTY = { topic_code:"", topic_title:"", topic_summary:"", topic_body:"", topic_type:"page_guide", module_code:"", search_keywords:"", sort_order:0, is_published:false };

export default function TopicEditorModal({ topic, onClose }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [preview, setPreview] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  useEffect(() => {
    if (topic) {
      setForm({
        topic_code: topic.topic_code || "",
        topic_title: topic.topic_title || "",
        topic_summary: topic.topic_summary || "",
        topic_body: topic.topic_body || "",
        topic_type: topic.topic_type || "page_guide",
        module_code: topic.module_code || "",
        search_keywords: topic.search_keywords || "",
        sort_order: topic.sort_order || 0,
        is_published: topic.is_published || false,
      });
    } else {
      setForm({ ...EMPTY, topic_code: `TOPIC_${Date.now()}` });
    }
  }, [topic]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = { ...data, last_updated_by: user?.email };
      if (topic?.id) return base44.entities.HelpManualTopic.update(topic.id, payload);
      return base44.entities.HelpManualTopic.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["help-manual-topics"] });
      toast({ title: "Topic saved" });
      onClose();
    },
  });

  const generateAI = async () => {
    if (!form.topic_title) return;
    setAiGenerating(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are writing documentation for ConnectQuote 360, an enterprise benefits administration platform for insurance brokers.

Write a comprehensive help manual article for topic: "${form.topic_title}"
Type: ${form.topic_type.replace(/_/g," ")}
Module: ${form.module_code ? MODULE_LABELS[form.module_code] : "General"}
${form.topic_summary ? "Additional context: " + form.topic_summary : ""}

Write 400-700 words in clean markdown with:
- ## section headers
- Numbered steps for processes
- Tables where comparing items
- Bold for important terms
- Practical guidance a benefits broker would actually need

Also generate a comprehensive search_keywords string (15-25 comma-separated terms users might search for).

Return JSON with: topic_body (markdown string), topic_summary (2-sentence summary), search_keywords (comma-separated string)`,
        response_json_schema: {
          type: "object",
          properties: {
            topic_body: { type: "string" },
            topic_summary: { type: "string" },
            search_keywords: { type: "string" }
          }
        }
      });
      setForm(p => ({
        ...p,
        topic_body: res.topic_body || p.topic_body,
        topic_summary: res.topic_summary || p.topic_summary,
        search_keywords: res.search_keywords || p.search_keywords,
      }));
      toast({ title: "AI Generated", description: "Review content and save." });
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setAiGenerating(false);
    }
  };

  const f = (field) => (e) => setForm(p => ({ ...p, [field]: e.target?.value ?? e }));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto p-4">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-5xl my-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-primary" />
            <div>
              <h2 className="font-semibold">{topic ? "Edit Manual Topic" : "New Manual Topic"}</h2>
              {topic && <code className="text-[10px] font-mono text-muted-foreground">{topic.topic_code}</code>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setPreview(!preview)} className="gap-1">
              <Eye className="w-3.5 h-3.5" /> {preview ? "Edit" : "Preview"}
            </Button>
            <Button size="sm" variant="outline" onClick={generateAI} disabled={aiGenerating || !form.topic_title} className="gap-1">
              <Sparkles className="w-3.5 h-3.5" /> {aiGenerating ? "Generating…" : "AI Write"}
            </Button>
            <Button size="sm" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="gap-1">
              <Save className="w-3.5 h-3.5" /> {saveMutation.isPending ? "Saving…" : "Save"}
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onClose}><X className="w-4 h-4" /></Button>
          </div>
        </div>

        <div className="p-6">
          {preview ? (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>{form.topic_title}</CardTitle>
                  <Badge className="text-[8px]">{form.topic_type?.replace(/_/g," ")}</Badge>
                </div>
                {form.topic_summary && <p className="text-sm text-muted-foreground">{form.topic_summary}</p>}
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none"><ReactMarkdown>{form.topic_body}</ReactMarkdown></div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Metadata column */}
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Topic Code *</Label>
                  <Input value={form.topic_code} onChange={f("topic_code")} className="mt-1 text-xs font-mono" placeholder="CASES_LIFECYCLE" />
                </div>
                <div>
                  <Label className="text-xs">Title *</Label>
                  <Input value={form.topic_title} onChange={f("topic_title")} className="mt-1 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">Summary</Label>
                  <Textarea value={form.topic_summary} onChange={f("topic_summary")} className="mt-1 text-xs h-16" />
                </div>
                <div>
                  <Label className="text-xs">Topic Type</Label>
                  <Select value={form.topic_type} onValueChange={v => setForm(p => ({ ...p, topic_type: v }))}>
                    <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{TOPIC_TYPES.map(t => <SelectItem key={t} value={t} className="text-xs">{t.replace(/_/g," ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Module</Label>
                  <Select value={form.module_code || "__none__"} onValueChange={v => setForm(p => ({ ...p, module_code: v === "__none__" ? "" : v }))}>
                    <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="Global / None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Global / None</SelectItem>
                      {MODULES.map(m => <SelectItem key={m} value={m} className="text-xs">{MODULE_LABELS[m] || m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Sort Order</Label>
                  <Input type="number" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} className="mt-1 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">Search Keywords</Label>
                  <Textarea value={form.search_keywords} onChange={f("search_keywords")} className="mt-1 text-xs h-16" placeholder="comma-separated keywords…" />
                </div>
                <label className="flex items-center gap-2 text-xs cursor-pointer pt-1">
                  <input type="checkbox" checked={form.is_published} onChange={e => setForm(p => ({ ...p, is_published: e.target.checked }))} />
                  Published (visible to users)
                </label>
              </div>

              {/* Body column (2/3 width) */}
              <div className="md:col-span-2">
                <Label className="text-xs">Topic Body (Markdown) *</Label>
                <Textarea
                  value={form.topic_body}
                  onChange={f("topic_body")}
                  className="mt-1 text-xs font-mono h-[520px]"
                  placeholder="## Overview&#10;&#10;Write your help content here using Markdown..."
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  {form.topic_body.length} characters · ~{Math.max(1, Math.round(form.topic_body.split(/\s+/).length / 200))} min read
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}