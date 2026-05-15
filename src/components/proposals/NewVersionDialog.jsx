import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GitBranch } from "lucide-react";

export default function NewVersionDialog({ proposal, open, onClose }) {
  const queryClient = useQueryClient();
  const newVersion = (proposal?.version || 1) + 1;
  const [title, setTitle] = useState(`${proposal?.title || ""} (v${newVersion})`);

  const create = useMutation({
    mutationFn: () => base44.entities.Proposal.create({
      ...proposal,
      id: undefined,
      created_date: undefined,
      updated_date: undefined,
      title,
      status: "draft",
      version: newVersion,
      sent_at: null,
      viewed_at: null,
      approved_at: null,
      // Keep case_id, scenario_id, employer_name etc. — this is a true revision
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      onClose();
    },
  });

  if (!proposal) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-primary" />
            Create New Version (v{newVersion})
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Creates a new draft linked to the same case and scenario as <span className="font-medium text-foreground">{proposal.title}</span>. The previous version is preserved.
          </p>
          <div>
            <Label>New Version Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} className="mt-1.5" />
          </div>
          <div className="p-3 rounded-lg bg-muted/40 border text-xs space-y-1 text-muted-foreground">
            <p>• Linked to: <span className="font-medium text-foreground">{proposal.employer_name}</span></p>
            <p>• Scenario preserved from v{proposal.version || 1}</p>
            <p>• New version starts as <span className="font-medium text-foreground">Draft</span></p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => create.mutate()} disabled={!title || create.isPending}>
            {create.isPending ? "Creating..." : `Create v${newVersion}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}