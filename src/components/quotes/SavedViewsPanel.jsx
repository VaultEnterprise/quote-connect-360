import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, Save, Bookmark, Plus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

const PRESET_VIEWS = [
  { id: "recommended", name: "Recommended Scenarios", filters: { statusFilter: "all", showExpiringOnly: false, search: "" } },
  { id: "expiring", name: "Expiring Soon", filters: { showExpiringOnly: true } },
  { id: "completed", name: "Completed", filters: { statusFilter: "completed" } },
  { id: "draft", name: "Drafts", filters: { statusFilter: "draft" } },
];

export default function SavedViewsPanel({ currentFilters, onLoadPreset, onSavePreset }) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [presetDescription, setPresetDescription] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: savedPresets = [] } = useQuery({
    queryKey: ["view-presets"],
    queryFn: () => base44.entities.ViewPreset.list(),
  });

  const savePreset = useMutation({
    mutationFn: async () => {
      await base44.entities.ViewPreset.create({
        name: presetName,
        description: presetDescription,
        filters: currentFilters,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["view-presets"] });
      toast({ title: "View saved", description: `Preset "${presetName}" created` });
      setPresetName("");
      setPresetDescription("");
      setShowSaveDialog(false);
    },
  });

  const deletePreset = useMutation({
    mutationFn: (id) => base44.entities.ViewPreset.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["view-presets"] });
      toast({ title: "Preset deleted" });
    },
  });

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="outline"
        size="sm"
        className="text-xs h-7"
        onClick={() => setShowSaveDialog(true)}
      >
        <Save className="w-3.5 h-3.5 mr-1" /> Save View
      </Button>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Filter View</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">View Name</label>
              <Input
                placeholder="e.g. 'My Recommended Quotes'"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Description (optional)</label>
              <Textarea
                placeholder="What does this view show?"
                value={presetDescription}
                onChange={(e) => setPresetDescription(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Current Filters</p>
              <pre className="text-[10px] whitespace-pre-wrap overflow-auto max-h-32">
                {JSON.stringify(currentFilters, null, 2)}
              </pre>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => savePreset.mutate()}
              disabled={!presetName || savePreset.isPending}
            >
              <Save className="w-4 h-4 mr-2" /> Save Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center gap-1.5">
        {PRESET_VIEWS.map((view) => (
          <Button
            key={view.id}
            variant="outline"
            size="sm"
            className="text-xs h-7"
            onClick={() => onLoadPreset(view.filters)}
          >
            <Bookmark className="w-3 h-3 mr-1" /> {view.name}
          </Button>
        ))}
        {savedPresets.map((preset) => (
          <div key={preset.id} className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => onLoadPreset(preset.filters)}
            >
              {preset.name}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => deletePreset.mutate(preset.id)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
    </>
  );
}