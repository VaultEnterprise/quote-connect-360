import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Save, Bookmark } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

const PRESET_VIEWS = [
  { id: "recommended", name: "Recommended Scenarios", filters: { is_recommended: true } },
  { id: "expiring", name: "Expiring Soon", filters: { showExpiringOnly: true } },
  { id: "completed", name: "Completed", filters: { status: "completed" } },
  { id: "draft", name: "Drafts", filters: { status: "draft" } },
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

      {/* Preset Views Popover */}
      <div className="absolute top-12 right-0 bg-white rounded-lg border shadow-lg p-3 w-64 z-50 hidden group-hover:block">
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">Quick Views</p>
            <div className="space-y-1">
              {PRESET_VIEWS.map((view) => (
                <button
                  key={view.id}
                  onClick={() => onLoadPreset(view.filters)}
                  className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-muted transition-colors"
                >
                  <Bookmark className="w-2.5 h-2.5 inline mr-1" />
                  {view.name}
                </button>
              ))}
            </div>
          </div>

          {savedPresets.length > 0 && (
            <div className="border-t pt-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Saved Presets</p>
              <div className="space-y-1">
                {savedPresets.map((preset) => (
                  <div key={preset.id} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                    <button
                      onClick={() => onLoadPreset(preset.filters)}
                      className="text-xs text-left flex-1"
                    >
                      {preset.name}
                    </button>
                    <button
                      onClick={() => deletePreset.mutate(preset.id)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}