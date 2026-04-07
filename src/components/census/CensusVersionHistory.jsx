import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, AlertCircle, GitCompare, Trash2 } from "lucide-react";
import { format } from "date-fns";
import StatusBadge from "@/components/shared/StatusBadge";
import CensusVersionComparison from "./CensusVersionComparison";

export default function CensusVersionHistory({ versions, onViewMembers, onDeleteVersion }) {
  const queryClient = useQueryClient();
  const [compareMode, setCompareMode] = useState(false);
  const [version1Id, setVersion1Id] = useState(null);
  const [version2Id, setVersion2Id] = useState(null);
  const [showComparison, setShowComparison] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async (version) => {
      const members = await base44.entities.CensusMember.filter({ census_version_id: version.id }, "-created_date", 1000);
      if (members.length) {
        await Promise.all(members.map((member) => base44.entities.CensusMember.delete(member.id)));
      }
      await base44.entities.CensusVersion.delete(version.id);
      return version;
    },
    onSuccess: (version) => {
      queryClient.invalidateQueries({ queryKey: ["census-all"] });
      onDeleteVersion?.(version);
    },
  });

  const handleCompare = (v1, v2) => {
    setVersion1Id(v1.id);
    setVersion2Id(v2.id);
    setShowComparison(true);
  };
  if (!versions || versions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Import History</h3>
        {versions.length > 1 && (
          <Button
            size="sm"
            variant={compareMode ? "default" : "outline"}
            onClick={() => setCompareMode(!compareMode)}
            className="text-xs"
          >
            <GitCompare className="w-3 h-3 mr-1" /> {compareMode ? "Done Comparing" : "Compare Versions"}
          </Button>
        )}
      </div>
      <div className="space-y-2">
        {versions.map((version, idx) => (
          <Card
            key={version.id}
            className={`hover:shadow-sm transition-all ${
              compareMode
                ? "cursor-pointer border-2 hover:border-primary"
                : "hover:shadow-sm"
            }`}
            onClick={compareMode ? () => {
              if (!version1Id) {
                setVersion1Id(version.id);
              } else if (!version2Id && version.id !== version1Id) {
                handleCompare(versions.find(v => v.id === version1Id), version);
                setCompareMode(false);
              }
            } : undefined}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-sm">v{version.version_number}</span>
                    <StatusBadge status={version.status} />
                    {version.validation_errors > 0 && (
                      <Badge className="bg-red-100 text-red-700 border-red-200">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {version.validation_errors} error{version.validation_errors !== 1 ? "s" : ""}
                      </Badge>
                    )}
                    {version.validation_warnings > 0 && (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                        {version.validation_warnings} warning{version.validation_warnings !== 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {version.total_employees || 0} employees
                    </span>
                    <span>
                      {version.total_dependents || 0} dependents
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(version.created_date), "MMM d, yyyy")}
                    </span>
                  </div>
                  {version.notes && (
                    <p className="text-xs text-muted-foreground mt-2 italic">{version.notes}</p>
                  )}
                </div>
                <div className="flex gap-2">
                   {compareMode && (
                     <Badge
                       variant={version1Id === version.id ? "default" : "outline"}
                       className="cursor-pointer text-xs"
                     >
                       {version1Id === version.id ? "✓ Selected" : "Select"}
                     </Badge>
                   )}
                   {!compareMode && (
                     <div className="flex gap-2">
                                             <Button
                                               variant="outline"
                                               size="sm"
                                               onClick={(event) => {
                                                 event.stopPropagation();
                                                 onViewMembers?.(version);
                                               }}
                                               className="text-xs"
                                             >
                                               View Members
                                             </Button>
                                             <Button
                                               variant="outline"
                                               size="sm"
                                               onClick={(event) => {
                                                 event.stopPropagation();
                                                 deleteMutation.mutate(version);
                                               }}
                                               disabled={deleteMutation.isPending}
                                               className="text-xs text-destructive hover:text-destructive"
                                             >
                                               <Trash2 className="w-3 h-3 mr-1" />
                                               Delete
                                             </Button>
                                           </div>
                   )}
                 </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Version Comparison */}
      <CensusVersionComparison
        version1Id={version1Id}
        version2Id={version2Id}
        open={showComparison}
        onOpenChange={setShowComparison}
      />
    </div>
  );
}