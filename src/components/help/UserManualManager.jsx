import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Edit2, Trash2, Eye, EyeOff, Search, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const CATEGORY_COLORS = {
  getting_started: "bg-blue-100 text-blue-700",
  features: "bg-purple-100 text-purple-700",
  workflows: "bg-emerald-100 text-emerald-700",
  integrations: "bg-orange-100 text-orange-700",
  settings: "bg-slate-100 text-slate-700",
  troubleshooting: "bg-red-100 text-red-700",
  best_practices: "bg-pink-100 text-pink-700",
};

export default function UserManualManager() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [regeneratingId, setRegeneratingId] = useState(null);

  const { data: manuals = [] } = useQuery({
    queryKey: ["user-manuals-all"],
    queryFn: () => base44.entities.UserManual.list("-created_date", 200),
  });

  const togglePublish = useMutation({
    mutationFn: (id) => {
      const manual = manuals.find(m => m.id === id);
      return base44.entities.UserManual.update(id, { published: !manual.published });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user-manuals-all"] }),
  });

  const deleteManual = useMutation({
    mutationFn: (id) => base44.entities.UserManual.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user-manuals-all"] }),
  });

  const regenerateManual = async (manual) => {
    setRegeneratingId(manual.id);
    try {
      const res = await base44.functions.invoke("generateUserManual", {
        prompt: `Regenerate and expand the user manual for "${manual.title}". Include the latest features, capabilities, workflows, best practices, troubleshooting tips, and setup guidance. Make it comprehensive and up to date.`,
        title: manual.title,
        module: manual.module,
      });
      const generated = res.data;
      await base44.entities.UserManual.update(manual.id, {
        content: generated.content,
        description: generated.description || manual.description,
        last_updated: new Date().toISOString(),
      });
      queryClient.invalidateQueries({ queryKey: ["user-manuals-all"] });
      queryClient.invalidateQueries({ queryKey: ["user-manuals"] });
      toast({ title: "Manual Regenerated", description: `"${manual.title}" has been updated with the latest content.` });
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setRegeneratingId(null);
    }
  };

  const filtered = manuals.filter(m =>
    m.title?.toLowerCase().includes(search.toLowerCase()) ||
    m.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search manuals..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="text-center py-8">
          <BookOpen className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No manuals created yet.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(manual => (
            <Card key={manual.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">{manual.title}</h3>
                    <Badge className={`text-[9px] py-0 ${CATEGORY_COLORS[manual.category] || "bg-gray-100"}`}>
                      {manual.category}
                    </Badge>
                    {manual.published && <Badge className="text-[9px] py-0 bg-emerald-100 text-emerald-700">Published</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{manual.description}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{manual.module}</span>
                    <span>•</span>
                    <span>{manual.estimated_read_time || 5} min</span>
                    <span>•</span>
                    <span className="capitalize">{manual.difficulty_level}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-primary hover:text-primary"
                    title="Regenerate with AI"
                    onClick={() => regenerateManual(manual)}
                    disabled={regeneratingId === manual.id}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${regeneratingId === manual.id ? "animate-spin" : ""}`} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => togglePublish.mutate(manual.id)}
                    disabled={togglePublish.isPending}
                  >
                    {manual.published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    onClick={() => deleteManual.mutate(manual.id)}
                    disabled={deleteManual.isPending}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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