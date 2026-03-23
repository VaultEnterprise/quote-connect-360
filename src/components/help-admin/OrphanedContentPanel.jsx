import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, Archive } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { HELP_TARGETS } from "@/lib/helpTargetRegistry";

const KNOWN_CODES = new Set(HELP_TARGETS.map(t => t.target_code));

export default function OrphanedContentPanel({ contentMap }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const orphans = useMemo(() =>
    Object.values(contentMap).filter(c => c.help_target_code && !KNOWN_CODES.has(c.help_target_code)),
  [contentMap]);

  const deleteContent = useMutation({
    mutationFn: (id) => base44.entities.HelpContent.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["help-contents-admin"] });
      toast({ title: "Deleted orphaned content" });
    },
  });

  const archiveContent = useMutation({
    mutationFn: (id) => base44.entities.HelpContent.update(id, { content_status: "archived", is_active: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["help-contents-admin"] });
      toast({ title: "Archived" });
    },
  });

  const archiveAll = async () => {
    if (!confirm(`Archive all ${orphans.length} orphaned content records?`)) return;
    await Promise.all(orphans.map(c => base44.entities.HelpContent.update(c.id, { content_status: "archived", is_active: false })));
    queryClient.invalidateQueries({ queryKey: ["help-contents-admin"] });
    toast({ title: `Archived ${orphans.length} records` });
  };

  if (orphans.length === 0) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/30">
        <CardContent className="p-3 flex items-center gap-2 text-xs text-emerald-700">
          <AlertTriangle className="w-3.5 h-3.5" /> No orphaned content detected — all content maps to known targets.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 bg-amber-50/20">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <CardTitle className="text-sm text-amber-800">
            Orphaned Content <Badge className="bg-amber-100 text-amber-700 text-[10px] ml-1">{orphans.length}</Badge>
          </CardTitle>
        </div>
        <Button size="sm" variant="outline" className="h-7 text-xs border-amber-300 text-amber-700" onClick={archiveAll}>
          <Archive className="w-3 h-3 mr-1" /> Archive All
        </Button>
      </CardHeader>
      <CardContent className="space-y-1.5 pt-0 max-h-64 overflow-y-auto">
        <p className="text-xs text-amber-700 mb-2">These help content records reference target codes that no longer exist in the registry.</p>
        {orphans.map(c => (
          <div key={c.id} className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-100">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{c.help_title || "(No title)"}</p>
              <p className="text-[10px] font-mono text-amber-700 truncate">{c.help_target_code}</p>
            </div>
            <Badge variant="outline" className="text-[9px] border-amber-200 flex-shrink-0">{c.content_status}</Badge>
            <div className="flex gap-1 flex-shrink-0">
              <Button variant="ghost" size="icon" className="h-6 w-6" title="Archive"
                onClick={() => archiveContent.mutate(c.id)}>
                <Archive className="w-3 h-3 text-amber-600" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" title="Delete"
                onClick={() => { if (confirm("Permanently delete this orphaned content?")) deleteContent.mutate(c.id); }}>
                <Trash2 className="w-3 h-3 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}