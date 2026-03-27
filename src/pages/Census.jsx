import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Users, FileUp, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import CensusUploadModal from "@/components/census/CensusUploadModal";
import CensusVersionHistory from "@/components/census/CensusVersionHistory";
import CensusMemberTable from "@/components/census/CensusMemberTable";
import RiskDashboard from "@/components/census/RiskDashboard";
import GradientAIAnalysisPanel from "@/components/census/GradientAIAnalysisPanel";
import useRouteContext from "@/hooks/useRouteContext";

export default function Census() {
  const routeContext = useRouteContext();
  const [search, setSearch] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState(routeContext.caseId || "");
  const [showUpload, setShowUpload] = useState(false);
  const [viewingVersionId, setViewingVersionId] = useState(null);

  // Fetch all cases
  const { data: cases = [] } = useQuery({
    queryKey: ["cases"],
    queryFn: () => base44.entities.BenefitCase.list("-created_date", 100),
  });

  // Fetch all versions
  const { data: allVersions = [] } = useQuery({
    queryKey: ["census-all"],
    queryFn: () => base44.entities.CensusVersion.list("-created_date", 100),
  });

  // Filter versions by selected case
  const filteredVersions = selectedCaseId
    ? allVersions.filter(v => v.case_id === selectedCaseId)
    : allVersions;

  // Filter cases by search
  const filteredCases = cases.filter(c =>
    c.employer_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.case_number?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedCase = cases.find(c => c.id === selectedCaseId);
  const selectedVersionCount = filteredVersions.length;
  const activeVersionId = viewingVersionId || filteredVersions[0]?.id || null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Census Management"
        description="Import, validate, and manage employee census data"
        actions={selectedCaseId ? <Button onClick={() => setShowUpload(true)} size="sm"><FileUp className="w-4 h-4 mr-2" /> Upload Census</Button> : undefined}
      />

      {/* Case Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search cases..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
            <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a case..." />
              </SelectTrigger>
              <SelectContent>
                {filteredCases.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.employer_name} {c.case_number && `(${c.case_number})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => { setSelectedCaseId(""); setSearch(""); }}
              className="text-xs"
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Selected Case Info */}
      {selectedCase && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">{selectedCase.employer_name}</h3>
                <p className="text-xs text-muted-foreground">
                  Case: {selectedCase.case_number} • Stage: {selectedCase.stage}
                </p>
              </div>
              <Button onClick={() => setShowUpload(true)} size="sm">
                <FileUp className="w-4 h-4 mr-2" /> Upload Census
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {!selectedCaseId ? (
        <EmptyState
          icon={Users}
          title="Select a Case"
          description="Choose a case from the list above to view and manage its census data"
        />
      ) : filteredVersions.length === 0 ? (
        <EmptyState
          icon={FileUp}
          title="No Census Data"
          description="This case has no census data yet"
          actionLabel="Upload Census"
          onAction={() => setShowUpload(true)}
        />
      ) : (
        <div className="space-y-6">
          {/* Version History */}
          <CensusVersionHistory
            versions={filteredVersions}
            onViewMembers={version => setViewingVersionId(version.id)}
          />

          {/* Risk Dashboard */}
          {activeVersionId && (
            <RiskDashboard censusVersionId={activeVersionId} caseId={selectedCaseId} />
          )}

          {/* GradientAI Analysis */}
          {activeVersionId && (
            <GradientAIAnalysisPanel 
              censusVersionId={activeVersionId} 
              caseId={selectedCaseId}
              onAnalysisComplete={() => {}}
            />
          )}

          {/* Member Table */}
          {viewingVersionId && (
            <div className="border rounded-lg p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-sm">Census Members</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewingVersionId(null)}
                  className="text-xs"
                >
                  Hide
                </Button>
              </div>
              <CensusMemberTable censusVersionId={viewingVersionId} caseId={selectedCaseId} />
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {selectedCaseId && (
        <CensusUploadModal
          caseId={selectedCaseId}
          currentVersionCount={selectedVersionCount}
          open={showUpload}
          onClose={(result) => {
            setShowUpload(false);
            if (result?.censusVersionId) {
              setViewingVersionId(result.censusVersionId);
            }
          }}
        />
      )}
    </div>
  );
}