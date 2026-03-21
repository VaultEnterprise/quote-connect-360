// components/census/VersionComparison.tsx
// Compare two census versions (Phase 2)

import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, TrendingUp, TrendingDown, Plus, Minus } from 'lucide-react';

type VersionComparisonProps = {
  caseId: string;
  currentVersionId: string;
};

export default function VersionComparison({
  caseId,
  currentVersionId,
}: VersionComparisonProps) {
  const [compareToVersionId, setCompareToVersionId] = useState('');

  const { data: versions = [] } = useQuery({
    queryKey: ['census-versions', caseId],
    queryFn: () => base44.entities.CensusVersion.filter({ case_id: caseId }),
  });

  const { data: currentMembers = [] } = useQuery({
    queryKey: ['census-members', currentVersionId],
    queryFn: () => base44.entities.CensusMember.filter({ census_version_id: currentVersionId }),
    enabled: !!currentVersionId,
  });

  const { data: priorMembers = [] } = useQuery({
    queryKey: ['census-members', compareToVersionId],
    queryFn: () => base44.entities.CensusMember.filter({ census_version_id: compareToVersionId }),
    enabled: !!compareToVersionId,
  });

  const compareVersion = versions.find(v => v.id === compareToVersionId);
  const currentVersion = versions.find(v => v.id === currentVersionId);

  if (!compareVersion) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Compare Versions</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={compareToVersionId} onValueChange={setCompareToVersionId}>
            <SelectTrigger>
              <SelectValue placeholder="Select version to compare..." />
            </SelectTrigger>
            <SelectContent>
              {versions
                .filter(v => v.id !== currentVersionId)
                .map(v => (
                  <SelectItem key={v.id} value={v.id}>
                    Version {v.version_number} ({v.total_employees} members)
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    );
  }

  // Calculate differences
  const priorIds = new Set(priorMembers.map(m => `${m.first_name}${m.last_name}${m.date_of_birth}`));
  const currentIds = new Set(currentMembers.map(m => `${m.first_name}${m.last_name}${m.date_of_birth}`));

  const added = currentMembers.filter(m => !priorIds.has(`${m.first_name}${m.last_name}${m.date_of_birth}`));
  const removed = priorMembers.filter(m => !currentIds.has(`${m.first_name}${m.last_name}${m.date_of_birth}`));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            <span>Version Comparison</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCompareToVersionId('')}
              className="text-xs"
            >
              Clear
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {/* Prior Version */}
            <div className="border rounded-lg p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Version {compareVersion.version_number}</p>
              <p className="text-2xl font-bold">{priorMembers.length}</p>
              <p className="text-xs text-muted-foreground">Members</p>
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </div>

            {/* Current Version */}
            <div className="border rounded-lg p-4 bg-primary/5">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Version {currentVersion?.version_number}</p>
              <p className="text-2xl font-bold">{currentMembers.length}</p>
              <p className="text-xs text-muted-foreground">Members</p>
            </div>
          </div>

          {/* Changes */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Added */}
              <div className="border rounded-lg p-4 bg-green-50">
                <div className="flex items-center gap-2 mb-2">
                  <Plus className="w-4 h-4 text-green-600" />
                  <span className="font-semibold text-sm text-green-700">Added</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{added.length}</p>
                <p className="text-xs text-green-700 mt-2">
                  {((added.length / currentMembers.length) * 100).toFixed(1)}% of current census
                </p>
              </div>

              {/* Removed */}
              <div className="border rounded-lg p-4 bg-red-50">
                <div className="flex items-center gap-2 mb-2">
                  <Minus className="w-4 h-4 text-red-600" />
                  <span className="font-semibold text-sm text-red-700">Removed</span>
                </div>
                <p className="text-2xl font-bold text-red-600">{removed.length}</p>
                <p className="text-xs text-red-700 mt-2">
                  {((removed.length / priorMembers.length) * 100).toFixed(1)}% of prior census
                </p>
              </div>
            </div>
          </div>

          {/* Lists */}
          {added.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">New Members ({added.length})</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {added.slice(0, 5).map(m => (
                  <div key={m.id} className="text-xs p-2 bg-green-50 rounded">
                    {m.first_name} {m.last_name}
                  </div>
                ))}
                {added.length > 5 && <p className="text-xs text-muted-foreground p-2">+{added.length - 5} more</p>}
              </div>
            </div>
          )}

          {removed.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">Removed Members ({removed.length})</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {removed.slice(0, 5).map(m => (
                  <div key={m.id} className="text-xs p-2 bg-red-50 rounded">
                    {m.first_name} {m.last_name}
                  </div>
                ))}
                {removed.length > 5 && <p className="text-xs text-muted-foreground p-2">+{removed.length - 5} more</p>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}