import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, FileText, Trash2, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import EmptyState from "@/components/shared/EmptyState";
import { format } from "date-fns";
import { useAuth } from "@/lib/AuthContext";

const DOC_TYPES = [
  { value: "census", label: "Census" },
  { value: "proposal", label: "Proposal" },
  { value: "sbc", label: "SBC" },
  { value: "application", label: "Application" },
  { value: "contract", label: "Contract" },
  { value: "correspondence", label: "Correspondence" },
  { value: "enrollment_form", label: "Enrollment Form" },
  { value: "other", label: "Other" },
];

export default function DocumentsTab({ caseId, employerName, docs = [] }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState("other");
  const [docName, setDocName] = useState("");

  const deleteDoc = useMutation({
    mutationFn: (id) => base44.entities.Document.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents", caseId] }),
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.Document.create({
      case_id: caseId,
      employer_name: employerName,
      name: docName || file.name,
      document_type: docType,
      file_url,
      file_name: file.name,
      file_size: file.size,
      uploaded_by: user?.email,
    });
    queryClient.invalidateQueries({ queryKey: ["documents", caseId] });
    setUploading(false);
    setDocName("");
    e.target.value = "";
  };

  return (
    <div className="space-y-4">
      {/* Upload */}
      <Card className="border-dashed">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <Label className="text-xs">Document Name</Label>
              <Input value={docName} onChange={e => setDocName(e.target.value)} placeholder="Optional name" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="block">
                <Button variant="outline" className="w-full" disabled={uploading} asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? "Uploading..." : "Choose File"}
                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                  </span>
                </Button>
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {docs.length === 0 ? (
        <EmptyState icon={FileText} title="No Documents" description="Upload files like proposals, census files, or applications" />
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{doc.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span className="capitalize">{doc.document_type?.replace(/_/g, " ")}</span>
                      <span>•</span>
                      <span>{format(new Date(doc.created_date), "MMM d, yyyy")}</span>
                      {doc.uploaded_by && <><span>•</span><span>{doc.uploaded_by}</span></>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-7 w-7"><ExternalLink className="w-3.5 h-3.5" /></Button>
                  </a>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteDoc.mutate(doc.id)}>
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