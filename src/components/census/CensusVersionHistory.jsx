import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, AlertCircle, CheckCircle2, GitCompare } from "lucide-react";
import { format } from "date-fns";
import StatusBadge from "@/components/shared/StatusBadge";
import CensusVersionComparison from "./CensusVersionComparison";

export default function CensusVersionHistory({ versions, onViewMembers }) {
  const [compareMode, setCompareMode] = useState(false);
  const [version1Id, setVersion1Id] = useState(null);
  const [version2Id, setVersion2Id] = useState(null);
  const [showComparison, setShowComparison] = useState(false);

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
      <h3 className="text-sm font-semibold">Import History</h3>
      <div className="space-y-2">
        {versions.map((version) => (
          <Card key={version.id} className="hover:shadow-sm transition-shadow">
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewMembers?.(version)}
                  className="text-xs"
                >
                  View Members
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}