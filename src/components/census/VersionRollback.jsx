// components/census/VersionRollback.tsx
// Rollback to previous census version (Phase 2)

import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertCircle } from 'lucide-react';

interface VersionRollbackProps {
  currentVersionId: string;
  caseId: string;
  versions: any[];
  onRolledBack?: () => void;
}

export default function VersionRollback({
  currentVersionId,
  caseId,
  versions,
  onRolledBack,
}: VersionRollbackProps) {
  const [selectedRollbackVersion, setSelectedRollbackVersion] = useState<string | null>(null);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const queryClient = useQueryClient();

  const currentVersion = versions.find(v => v.id === currentVersionId);
  const rollbackVersion = versions.find(v => v.id === selectedRollbackVersion);
  const priorVersions = versions.filter(v => v.id !== currentVersionId && v.version_number < (currentVersion?.version_number || 0));

  const handleRollback = async () => {
    if (!selectedRollbackVersion) return;

    setIsRollingBack(true);
    try {
      // Mark current version as inactive
      await base44.entities.CensusVersion.update(currentVersionId, {
        status: 'archived',
      });

      // Reactivate prior version
      await base44.entities.CensusVersion.update(selectedRollbackVersion, {
        status: 'validated',
      });

      // Update case to use prior version
      await base44.entities.BenefitCase.update(caseId, {
        census_status: 'validated',
        stage: 'census_validated',
      });

      // Delete members from current version (optional: archive instead)
      const currentMembers = await base44.entities.CensusMember.filter({
        census_version_id: currentVersionId,
      });

      for (const member of currentMembers) {
        await base44.entities.CensusMember.delete(member.id);
      }

      // Log rollback
      const user = await base44.auth.me();
      await base44.entities.ActivityLog.create({
        case_id: caseId,
        actor_email: user?.email || 'system',
        action: 'CENSUS_ROLLBACK',
        detail: `Rolled back from version ${currentVersion?.version_number} to ${rollbackVersion?.version_number}`,
        entity_type: 'CensusVersion',
        entity_id: currentVersionId,
      });

      queryClient.invalidateQueries({ queryKey: ['census-versions', caseId] });
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });

      onRolledBack?.();
      setSelectedRollbackVersion(null);
    } finally {
      setIsRollingBack(false);
    }
  };

  if (priorVersions.length === 0) {
    return null;
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setSelectedRollbackVersion(priorVersions[0].id)}
        className="text-xs text-destructive"
      >
        Rollback Version
      </Button>

      {selectedRollbackVersion && (
        <Dialog open={!!selectedRollbackVersion} onOpenChange={() => setSelectedRollbackVersion(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                Rollback Census Version
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-900">
                  This will deactivate version {currentVersion?.version_number} and restore version {rollbackVersion?.version_number}.
                </p>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Current Version</p>
                <div className="border rounded-lg p-3 bg-red-50">
                  <p className="font-medium text-sm">v{currentVersion?.version_number}</p>
                  <p className="text-xs text-muted-foreground">{currentVersion?.total_employees} members</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Rollback To</p>
                <div className="border rounded-lg p-3 bg-green-50">
                  <p className="font-medium text-sm">v{rollbackVersion?.version_number}</p>
                  <p className="text-xs text-muted-foreground">{rollbackVersion?.total_employees} members</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Members from version {currentVersion?.version_number} will be removed. This action can be undone by uploading a new census version.
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedRollbackVersion(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRollback}
                disabled={isRollingBack}
              >
                {isRollingBack ? 'Rolling back...' : 'Confirm Rollback'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}