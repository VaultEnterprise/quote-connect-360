import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Edit2, Eye, EyeOff, Trash2, Plus, Globe, Lock, BookOpen, Search, Filter } from "lucide-react";

const MODULE_LABELS = {
  DASHBOARD:"Dashboard", CASES:"Cases", CENSUS:"Census", QUOTES:"Quotes",
  PROPOSALS:"Proposals", ENROLLMENT:"Enrollment", RENEWALS:"Renewals",
  PLANS:"Plan Library", POLICYMATCH:"PolicyMatchAI", EMPLOYERS:"Employers",
  TASKS:"Tasks", CONTRIBUTIONS:"Contributions", EXCEPTIONS:"Exceptions",
  SETTINGS:"Settings", PORTALS:"Portals",
};

const TYPE_LABELS = {
  module_guide: "Module Guide", page_guide: "Page Guide", workflow_guide: "Workflow",
  faq: "FAQ", troubleshooting: "Troubleshooting", how_to: "How-To", reference: "Reference", release_note: "Release Note",
};

const TYPE_COLORS = {
  module_guide: "bg-blue-100 text-blue-700",
  page_guide: "bg-indigo-100 text-indigo-700",
  workflow_guide: "bg-purple-100 text-purple-700",
  faq: "bg-emerald-100 text-emerald-700",
  troubleshooting: "bg-amber-100 text-amber-700",
  how_to: "bg-teal-100 text-teal-700",
  reference: "bg-slate-100 text-slate-700",
  release_note: "bg-pink-100 text-pink-700",
};

export default function ManualTopicsTab({ onEditTopic, onNewTopic }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterModule, setFilterModule] = useState("all");
  const [filterPublished, setFilterPublished] = useState("all");

  const { data: topics = [], isLoading } = useQuery({
    queryKey: ["help-manual-topics"],
    queryFn: () => base44.entities.HelpManualTopic.list("sort_order", 300),
  });

  const togglePublish = useMutation({
    mutationFn: ({ id, current }) => base44.entities.HelpManualTopic.update(id, { is_published: !current }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["help-manual-topics"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.HelpManualTopic.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["help-manual-topics"] });
      toast({ title: "Topic deleted" });
    },
  });

  const filtered = useMemo(() => {
    return topics.filter(t => {
      const q = search.toLowerCase();
      const searchMatch = !search || t.topic_title?.toLowerCase().includes(q) || t.topic_code?.toLowerCase().includes(q) || t.topic_summary?.toLowerCase().includes(q);
      const typeMatch = filterType === "all" || t.topic_type === filterType;
      const moduleMatch = filterModule === "all" || t.module_code === filterModule || (filterModule === "global" && !t.module_code);
      const publishedMatch = filterPublished === "all" || (filterPublished === "published" && t.is_published) || (filterPublished === "draft" && !t.is_published);
      return searchMatch && typeMatch && moduleMatch && publishedMatch;
    });
  }, [topics, search, filterType, filterModule, filterPublished]);

  const published = topics.filter(t => t.is_published).length;

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span><strong className="text-foreground">{topics.length}</strong> total topics</span>
          <span><strong className="text-emerald-600">{published}</strong> published</span>
          <span><strong className="text-amber-600">{topics.length - published}</strong> draft</span>
        </div>
        <Button size="sm" onClick={onNewTopic} className="gap-1">
          <Plus className="w-3.5 h-3.5" /> New Topic
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Search topics…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-8 text-xs" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterModule} onValueChange={setFilterModule}>
          <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="All Modules" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modules</SelectItem>
            <SelectItem value="global">Global</SelectItem>
            {Object.entries(MODULE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterPublished} onValueChange={setFilterPublished}>
          <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft Only</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground self-center">{filtered.length} shown</span>
      </div>

      {/* Topics grouped by type */}
      {isLoading ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Loading topics…</div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/20 mb-3" />
          <p className="text-muted-foreground text-sm">No topics match your filters.</p>
        </Card>
      ) : (
        <div className="space-y-1.5 max-h-[600px] overflow-y-auto">
          {filtered.map(topic => (
            <Card key={topic.id} className={`hover:border-primary/30 transition-all group ${!topic.is_published ? "opacity-75" : ""}`}>
              <CardContent className="p-3 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-sm font-medium">{topic.topic_title}</span>
                    <Badge className={`text-[8px] ${TYPE_COLORS[topic.topic_type] || "bg-slate-100 text-slate-600"}`}>
                      {TYPE_LABELS[topic.topic_type] || topic.topic_type}
                    </Badge>
                    {topic.module_code && (
                      <Badge className="text-[8px] bg-blue-50 text-blue-700">{MODULE_LABELS[topic.module_code] || topic.module_code}</Badge>
                    )}
                    {topic.is_published
                      ? <Badge className="text-[8px] bg-emerald-100 text-emerald-700 flex items-center gap-0.5"><Globe className="w-2 h-2" /> Published</Badge>
                      : <Badge className="text-[8px] bg-slate-100 text-slate-600 flex items-center gap-0.5"><Lock className="w-2 h-2" /> Draft</Badge>
                    }
                  </div>
                  {topic.topic_summary && <p className="text-xs text-muted-foreground line-clamp-1">{topic.topic_summary}</p>}
                  <div className="flex items-center gap-3 mt-0.5">
                    <p className="text-[10px] font-mono text-muted-foreground">{topic.topic_code}</p>
                    {topic.view_count > 0 && <span className="text-[10px] text-muted-foreground">{topic.view_count} views</span>}
                    {topic.sort_order > 0 && <span className="text-[10px] text-muted-foreground">Order: {topic.sort_order}</span>}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onEditTopic(topic)} title="Edit">
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title={topic.is_published ? "Unpublish" : "Publish"}
                    onClick={() => togglePublish.mutate({ id: topic.id, current: topic.is_published })}>
                    {topic.is_published ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" title="Delete"
                    onClick={() => { if (confirm("Delete this topic?")) deleteMutation.mutate(topic.id); }}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}