import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquarePlus } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import { format } from "date-fns";
import { addCaseNote } from "@/services/cases/caseOps";
import { toast } from "@/components/ui/use-toast";

export default function CaseNotesPanel({ caseId }) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");

  const { data: notes = [] } = useQuery({
    queryKey: ["case-notes", caseId],
    queryFn: () => base44.entities.CaseNote.filter({ case_id: caseId }, "-created_date", 100),
    enabled: !!caseId,
  });

  const addNoteMutation = useMutation({
    mutationFn: () => addCaseNote(caseId, body.trim(), "note"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case-notes", caseId] });
      queryClient.invalidateQueries({ queryKey: ["activity", caseId] });
      setBody("");
      toast({ title: "Note added", description: "Your case note was saved successfully." });
    },
    onError: (error) => {
      toast({ title: "Note failed", description: error.message || "The note could not be saved.", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-3">
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Add an internal case note..."
            rows={4}
          />
          <div className="flex justify-end">
            <Button onClick={() => addNoteMutation.mutate()} disabled={!body.trim() || addNoteMutation.isPending}>
              <MessageSquarePlus className="w-4 h-4 mr-2" />
              {addNoteMutation.isPending ? "Saving..." : "Add Note"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {notes.length === 0 ? (
        <EmptyState icon={MessageSquarePlus} title="No Notes Yet" description="Add internal case notes and updates here." />
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <Card key={note.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="capitalize">{note.note_type}</span>
                  <span>{format(new Date(note.created_date), "MMM d, yyyy h:mm a")}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{note.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}