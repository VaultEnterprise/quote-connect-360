// components/census/DuplicateMemberHandler.tsx
// Detect and resolve duplicate members (Phase 2)

import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Users } from 'lucide-react';

interface Duplicate {
  type: 'same_person' | 'similar_name' | 'same_ssn';
  confidence: number;
  member1: any;
  member2: any;
  reason: string;
}

interface DuplicateMemberHandlerProps {
  censusVersionId: string;
  caseId: string;
  onResolved?: () => void;
}

export default function DuplicateMemberHandler({
  censusVersionId,
  caseId,
  onResolved,
}: DuplicateMemberHandlerProps) {
  const [duplicates, setDuplicates] = useState<Duplicate[]>([]);
  const [selectedDuplicate, setSelectedDuplicate] = useState<Duplicate | null>(null);
  const [mergeAction, setMergeAction] = useState<'keep_new' | 'keep_old' | 'merge'>('merge');
  const [isProcessing, setIsProcessing] = useState(false);

  const detectDuplicates = async () => {
    const members = await base44.entities.CensusMember.filter({
      census_version_id: censusVersionId,
    });

    const detected: Duplicate[] = [];

    // Check against prior versions
    const allVersions = await base44.entities.CensusVersion.filter({
      case_id: caseId,
    });

    const priorVersionIds = allVersions
      .filter(v => v.id !== censusVersionId)
      .map(v => v.id);

    for (const version of priorVersionIds) {
      const priorMembers = await base44.entities.CensusMember.filter({
        census_version_id: version,
      });

      for (const newMember of members) {
        for (const oldMember of priorMembers) {
          // SSN match (exact)
          if (newMember.ssn_last4 && oldMember.ssn_last4 && newMember.ssn_last4 === oldMember.ssn_last4) {
            detected.push({
              type: 'same_ssn',
              confidence: 0.99,
              member1: newMember,
              member2: oldMember,
              reason: `Same SSN last 4: ${newMember.ssn_last4}`,
            });
          }

          // Name + DOB match
          if (
            newMember.first_name?.toLowerCase() === oldMember.first_name?.toLowerCase() &&
            newMember.last_name?.toLowerCase() === oldMember.last_name?.toLowerCase() &&
            newMember.date_of_birth === oldMember.date_of_birth
          ) {
            detected.push({
              type: 'same_person',
              confidence: 0.95,
              member1: newMember,
              member2: oldMember,
              reason: `Same name and DOB`,
            });
          }

          // Similar name (Levenshtein distance)
          const fullNameNew = `${newMember.first_name} ${newMember.last_name}`.toLowerCase();
          const fullNameOld = `${oldMember.first_name} ${oldMember.last_name}`.toLowerCase();
          const distance = levenshteinDistance(fullNameNew, fullNameOld);
          if (distance < 3 && newMember.date_of_birth === oldMember.date_of_birth) {
            detected.push({
              type: 'similar_name',
              confidence: 0.8,
              member1: newMember,
              member2: oldMember,
              reason: `Similar name (${fullNameNew} vs ${fullNameOld})`,
            });
          }
        }
      }
    }

    setDuplicates(detected);
  };

  const handleMergeDuplicate = async () => {
    if (!selectedDuplicate) return;
    setIsProcessing(true);

    try {
      if (mergeAction === 'keep_new') {
        // Delete old member
        await base44.entities.CensusMember.delete(selectedDuplicate.member2.id);
      } else if (mergeAction === 'keep_old') {
        // Delete new member
        await base44.entities.CensusMember.delete(selectedDuplicate.member1.id);
      } else {
        // Merge: keep new, mark old as merged
        await base44.entities.CensusMember.update(selectedDuplicate.member2.id, {
          validation_status: 'merged',
        });
      }

      setDuplicates(duplicates.filter(d => d !== selectedDuplicate));
      setSelectedDuplicate(null);

      if (duplicates.length === 1) {
        onResolved?.();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (duplicates.length === 0) {
    return (
      <Button onClick={detectDuplicates} variant="outline" size="sm">
        <Users className="w-4 h-4 mr-2" />
        Check for Duplicates
      </Button>
    );
  }

  return (
    <>
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            {duplicates.length} Potential Duplicate(s) Found
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {duplicates.slice(0, 5).map((dup, idx) => (
            <div key={idx} className="border rounded-lg p-3 bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {dup.member1.first_name} {dup.member1.last_name} ↔ {dup.member2.first_name} {dup.member2.last_name}
                </span>
                <Badge variant="outline">{Math.round(dup.confidence * 100)}% match</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{dup.reason}</p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedDuplicate(dup)}
                className="text-xs"
              >
                Resolve
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {selectedDuplicate && (
        <Dialog open={!!selectedDuplicate} onOpenChange={() => setSelectedDuplicate(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resolve Duplicate</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">{selectedDuplicate.reason}</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">New Member</p>
                  <p className="font-medium">{selectedDuplicate.member1.first_name} {selectedDuplicate.member1.last_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedDuplicate.member1.date_of_birth}</p>
                </div>
                <div className="border rounded-lg p-3 bg-muted/30">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Prior Member</p>
                  <p className="font-medium">{selectedDuplicate.member2.first_name} {selectedDuplicate.member2.last_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedDuplicate.member2.date_of_birth}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="action"
                    value="keep_new"
                    checked={mergeAction === 'keep_new'}
                    onChange={() => setMergeAction('keep_new')}
                  />
                  <span>Keep new member, delete prior</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="action"
                    value="keep_old"
                    checked={mergeAction === 'keep_old'}
                    onChange={() => setMergeAction('keep_old')}
                  />
                  <span>Keep prior member, delete new</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="action"
                    value="merge"
                    checked={mergeAction === 'merge'}
                    onChange={() => setMergeAction('merge')}
                  />
                  <span>Merge (keep both, mark as merged)</span>
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedDuplicate(null)}>
                Cancel
              </Button>
              <Button onClick={handleMergeDuplicate} disabled={isProcessing}>
                {isProcessing ? 'Processing...' : 'Resolve'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] =
        b[i - 1] === a[j - 1]
          ? matrix[i - 1][j - 1]
          : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}