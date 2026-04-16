import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Popover, PopoverContent, PopoverTrigger
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Save, Trash2, Bookmark } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

const QUICK_PRESETS = [
  { name: "Urgent Cases", filters: { priorityFilter: "urgent" } },
  { name: "Active Stage", filters: { stageFilter: "active" } },
  { name: "Renewal Pending", filters: { stageFilter: "renewal_pending" } },
  { name: "Enrollment Open", filters: { stageFilter: "enrollment_open" } },
  { name: "Rate Gaps", filters: { operationalPreset: "rate_gaps" } },
];

export default function SavedFiltersPanel({ currentFilters, onLoadPreset }) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: presets = [] } = useQuery({
    queryKey: ["case-filter-presets"],
    queryFn: () => base44.entities.CaseFilterPreset.list("-created_date", 20),
  });

  const savePreset = useMutation({
    mutationFn: async () => {
      await base44.entities.CaseFilterPreset.create({
        name: presetName,
        filters: currentFilters,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case-filter-presets"] });
      setPresetName("");
      setShowSaveDialog(false);
      toast({ title: "Preset saved", description: `"${presetName}" saved successfully` });
    },
  });

  const deletePreset = useMutation({
    mutationFn: (id) => base44.entities.CaseFilterPreset.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case-filter-presets"] });
      toast({ title: "Preset deleted" });
    },
  });

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 rounded-xl border-border/70 bg-background px-3 shadow-sm">
            <Bookmark className="mr-2 h-3.5 w-3.5" /> Presets
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 rounded-2xl border-border/70 p-3 shadow-lg">
          <div className="space-y-2">
            {QUICK_PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => onLoadPreset(p.filters)}
                className="w-full rounded-xl px-2.5 py-2 text-left text-xs font-medium transition-colors hover:bg-muted"
              >
                {p.name}
              </button>
            ))}

            {presets.length > 0 && (
              <>
                <div className="border-t my-2" />
                {presets.map((p) => (
                  <div key={p.id} className="flex items-center justify-between group">
                    <button
                      onClick={() => onLoadPreset(p.filters)}
                      className="text-left text-xs px-2 py-1.5 rounded hover:bg-muted transition-colors flex-1"
                    >
                      {p.name}
                    </button>
                    <button
                      onClick={() => deletePreset.mutate(p.id)}
                      className="rounded-lg p-1 opacity-0 transition-all hover:bg-destructive/10 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </button>
                  </div>
                ))}
              </>
            )}

            <button
              onClick={() => setShowSaveDialog(true)}
              className="mt-2 w-full rounded-xl bg-primary/10 px-2.5 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
            >
              <Save className="w-3 h-3 inline mr-1.5" /> Save Current
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Save Filter Preset</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Preset name..."
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
            <Button onClick={() => savePreset.mutate()} disabled={!presetName || savePreset.isPending}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}