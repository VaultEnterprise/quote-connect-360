import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Archive, RotateCcw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function BulkArchiveRestore({ plans }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState([]);

  const bulkArchive = useMutation({
    mutationFn: async () => {
      await Promise.all(selectedIds.map((id) => base44.entities.BenefitPlan.update(id, { status: "archived" })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["benefit-plans"] });
      toast({ title: `${selectedIds.length} plans archived` });
      setSelectedIds([]);
    },
  });

  const bulkRestore = useMutation({
    mutationFn: async () => {
      await Promise.all(selectedIds.map((id) => base44.entities.BenefitPlan.update(id, { status: "active" })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["benefit-plans"] });
      toast({ title: `${selectedIds.length} plans restored` });
      setSelectedIds([]);
    },
  });

  const allArchived = selectedIds.every((id) => plans.find((p) => p.id === id)?.status === "archived");

  return (
    <div className="flex items-center gap-2">
      {selectedIds.length > 0 && (
        <>
          <Badge variant="outline" className="text-xs">{selectedIds.length} selected</Badge>
          {!allArchived && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => bulkArchive.mutate()}
              disabled={bulkArchive.isPending}
              className="h-8 text-xs gap-1"
            >
              <Archive className="w-3 h-3" /> Archive
            </Button>
          )}
          {allArchived && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => bulkRestore.mutate()}
              disabled={bulkRestore.isPending}
              className="h-8 text-xs gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Restore
            </Button>
          )}
        </>
      )}
    </div>
  );
}