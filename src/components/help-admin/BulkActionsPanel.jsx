import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Trash2, Archive, Eye, EyeOff, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { HELP_TARGETS } from "@/lib/helpTargetRegistry";

export default function BulkActionsPanel({ contentMap }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedTargets, setSelectedTargets] = useState(new Set());
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterModule, setFilterModule] = useState("all");
  const [action, setAction] = useState(null);
  const [loading, setLoading] = useState(false);

  const filteredTargets = HELP_TARGETS.filter(t => {
    const content = contentMap[t.target_code];
    const hasContent = !!content;
    
    if (filterStatus === "active" && (!content || content.content_status !== "active")) return false;
    if (filterStatus === "inactive" && (!content || content.content_status === "active")) return false;
    if (filterStatus === "missing" && hasContent) return false;
    if (filterModule !== "all" && t.module_code !== filterModule) return false;
    
    return true;
  });

  const toggleAllSelected = () => {
    if (selectedTargets.size === filteredTargets.length) {
      setSelectedTargets(new Set());
    } else {
      setSelectedTargets(new Set(filteredTargets.map(t => t.target_code)));
    }
  };

  const toggleTarget = (code) => {
    const newSet = new Set(selectedTargets);
    if (newSet.has(code)) {
      newSet.delete(code);
    } else {
      newSet.add(code);
    }
    setSelectedTargets(newSet);
  };

  const executeBulkAction = async () => {
    if (!action || selectedTargets.size === 0) return;
    
    setLoading(true);
    try {
      const targetIds = Array.from(selectedTargets)
        .map(code => contentMap[code]?.id)
        .filter(Boolean);

      if (action === "delete") {
        for (const id of targetIds) {
          await base44.entities.HelpContent.delete(id);
        }
        toast({ title: "Deleted", description: `${targetIds.length} content items deleted.` });
      } else if (action === "archive") {
        for (const id of targetIds) {
          await base44.entities.HelpContent.update(id, { content_status: "archived" });
        }
        toast({ title: "Archived", description: `${targetIds.length} content items archived.` });
      } else if (action === "activate") {
        for (const id of targetIds) {
          await base44.entities.HelpContent.update(id, { content_status: "active", is_active: true });
        }
        toast({ title: "Activated", description: `${targetIds.length} content items activated.` });
      } else if (action === "deactivate") {
        for (const id of targetIds) {
          await base44.entities.HelpContent.update(id, { content_status: "inactive", is_active: false });
        }
        toast({ title: "Deactivated", description: `${targetIds.length} content items deactivated.` });
      }

      queryClient.invalidateQueries({ queryKey: ["help-contents-admin"] });
      setSelectedTargets(new Set());
      setAction(null);
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Filters & Selection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="missing">Missing Content</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Module</label>
              <Select value={filterModule} onValueChange={setFilterModule}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  <SelectItem value="DASHBOARD">Dashboard</SelectItem>
                  <SelectItem value="CASES">Cases</SelectItem>
                  <SelectItem value="CENSUS">Census</SelectItem>
                  <SelectItem value="QUOTES">Quotes</SelectItem>
                  <SelectItem value="PROPOSALS">Proposals</SelectItem>
                  <SelectItem value="ENROLLMENT">Enrollment</SelectItem>
                  <SelectItem value="RENEWALS">Renewals</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Action</label>
              <Select value={action || ""} onValueChange={setAction}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select action..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="activate"><Eye className="w-3 h-3 inline mr-1" /> Activate</SelectItem>
                  <SelectItem value="deactivate"><EyeOff className="w-3 h-3 inline mr-1" /> Deactivate</SelectItem>
                  <SelectItem value="archive"><Archive className="w-3 h-3 inline mr-1" /> Archive</SelectItem>
                  <SelectItem value="delete"><Trash2 className="w-3 h-3 inline mr-1" /> Delete</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedTargets.size > 0 && selectedTargets.size === filteredTargets.length}
                onChange={toggleAllSelected}
                className="w-4 h-4 rounded"
              />
              <span className="text-xs font-medium">
                {selectedTargets.size} of {filteredTargets.length} selected
              </span>
            </div>
            <Button
              size="sm"
              onClick={executeBulkAction}
              disabled={selectedTargets.size === 0 || !action || loading}
              variant={action === "delete" ? "destructive" : "default"}
              className="gap-1"
            >
              {loading && <Loader2 className="w-3 h-3 animate-spin" />}
              Execute {action}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-1 max-h-96 overflow-y-auto">
        {filteredTargets.map(t => {
          const content = contentMap[t.target_code];
          const isSelected = selectedTargets.has(t.target_code);
          return (
            <Card key={t.target_code} className={isSelected ? "bg-primary/5 border-primary/20" : ""}>
              <CardContent className="p-3 flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleTarget(t.target_code)}
                  className="w-4 h-4 rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{t.target_label}</p>
                  <div className="flex gap-1 flex-wrap mt-0.5">
                    <Badge variant="outline" className="text-[8px]">{t.module_code}</Badge>
                    {!content && <Badge className="text-[8px] bg-amber-100 text-amber-700">Missing</Badge>}
                    {content?.content_status === "active" && <Badge className="text-[8px] bg-emerald-100 text-emerald-700">Active</Badge>}
                    {content?.content_status === "inactive" && <Badge className="text-[8px] bg-gray-100 text-gray-700">Inactive</Badge>}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}