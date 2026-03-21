// components/census/CensusImportProgress.tsx
// Real-time progress tracking during bulk import

import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface ProgressState {
  step: 'validating' | 'scoring' | 'creating' | 'completed';
  total: number;
  processed: number;
  errors: number;
  high_risk_count: number;
}

interface CensusImportProgressProps {
  caseId: string;
  censusVersionId: string;
  membersData: any[];
  mapping: Record<string, string>;
  onComplete: (result: any) => void;
}

export default function CensusImportProgress({
  caseId,
  censusVersionId,
  membersData,
  mapping,
  onComplete,
}: CensusImportProgressProps) {
  const [progress, setProgress] = useState<ProgressState>({
    step: 'validating',
    total: membersData.length,
    processed: 0,
    errors: 0,
    high_risk_count: 0,
  });

  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    if (!isRunning) return;

    const runImport = async () => {
      try {
        const response = await base44.functions.invoke('processCensusImport', {
          case_id: caseId,
          census_version_id: censusVersionId,
          members_data: membersData,
          mapping,
        });

        if (response.data.success) {
          setProgress(response.data.progress);
          onComplete(response.data);
        } else {
          console.error('Import failed:', response.data.error);
        }
      } catch (error) {
        console.error('Import error:', error);
      } finally {
        setIsRunning(false);
      }
    };

    runImport();
  }, [isRunning]);

  const percentComplete = Math.round((progress.processed / progress.total) * 100);

  const stepLabels = {
    validating: 'Validating data...',
    scoring: 'Scoring risk with AI...',
    creating: 'Creating members...',
    completed: 'Complete!',
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {progress.step !== 'completed' ? (
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            )}
            <span className="font-semibold">{stepLabels[progress.step]}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {progress.processed} of {progress.total}
          </span>
        </div>

        <Progress value={percentComplete} className="h-2" />

        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-lg bg-muted p-3">
            <p className="text-2xl font-bold">{percentComplete}%</p>
            <p className="text-xs text-muted-foreground">Progress</p>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <p className="text-2xl font-bold">{progress.total}</p>
            <p className="text-xs text-muted-foreground">Total Members</p>
          </div>
          {progress.errors > 0 && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-2xl font-bold text-red-600">{progress.errors}</p>
              <p className="text-xs text-red-700">Errors</p>
            </div>
          )}
          {progress.high_risk_count > 0 && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-2xl font-bold text-amber-600">{progress.high_risk_count}</p>
              <p className="text-xs text-amber-700">High Risk</p>
            </div>
          )}
        </div>

        {progress.step === 'completed' && (
          <div className="flex items-start gap-2 text-sm bg-green-50 border border-green-200 rounded-lg p-3">
            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-green-700">Import successful</p>
              <p className="text-green-600 text-xs mt-0.5">
                {progress.total} members imported with {progress.errors} errors and {progress.high_risk_count} high-risk flagged.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}