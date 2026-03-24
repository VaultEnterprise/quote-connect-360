import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';

export default function CaseLifecycleStatus({ caseData }) {
  const status = useMemo(() => {
    if (!caseData) return null;

    const stages = [
      { stage: 'draft', label: 'Draft', complete: caseData.stage !== 'draft' },
      { stage: 'census_in_progress', label: 'Census Upload', complete: ['census_validated', 'ready_for_quote', 'quoting', 'proposal_ready', 'employer_review', 'approved_for_enrollment', 'enrollment_open', 'enrollment_complete', 'install_in_progress', 'active'].includes(caseData.stage) },
      { stage: 'census_validated', label: 'Census Validated', complete: ['ready_for_quote', 'quoting', 'proposal_ready', 'employer_review', 'approved_for_enrollment', 'enrollment_open', 'enrollment_complete', 'install_in_progress', 'active'].includes(caseData.stage) },
      { stage: 'ready_for_quote', label: 'Quote Ready', complete: ['quoting', 'proposal_ready', 'employer_review', 'approved_for_enrollment', 'enrollment_open', 'enrollment_complete', 'install_in_progress', 'active'].includes(caseData.stage) },
      { stage: 'quoting', label: 'Quoting', complete: ['proposal_ready', 'employer_review', 'approved_for_enrollment', 'enrollment_open', 'enrollment_complete', 'install_in_progress', 'active'].includes(caseData.stage) },
      { stage: 'proposal_ready', label: 'Proposal Ready', complete: ['employer_review', 'approved_for_enrollment', 'enrollment_open', 'enrollment_complete', 'install_in_progress', 'active'].includes(caseData.stage) },
      { stage: 'employer_review', label: 'Employer Review', complete: ['approved_for_enrollment', 'enrollment_open', 'enrollment_complete', 'install_in_progress', 'active'].includes(caseData.stage) },
      { stage: 'enrollment_open', label: 'Enrollment Open', complete: ['enrollment_complete', 'install_in_progress', 'active'].includes(caseData.stage) },
      { stage: 'enrollment_complete', label: 'Enrollment Done', complete: ['install_in_progress', 'active'].includes(caseData.stage) },
      { stage: 'active', label: 'Active', complete: caseData.stage === 'active' },
    ];

    const progress = Math.round((stages.filter(s => s.complete).length / stages.length) * 100);

    return { stages, progress, currentStage: caseData.stage };
  }, [caseData?.stage]);

  const timeMetrics = useMemo(() => {
    if (!caseData) return null;

    const daysActive = caseData.created_date ? differenceInDays(new Date(), new Date(caseData.created_date)) : 0;
    const daysToClose = caseData.target_close_date ? differenceInDays(new Date(caseData.target_close_date), new Date()) : null;

    return { daysActive, daysToClose };
  }, [caseData?.created_date, caseData?.target_close_date]);

  if (!status) return null;

  return (
    <div className="space-y-4">
      {/* Overview */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold">Case Lifecycle</p>
          <Badge variant="outline">{status.progress}% Complete</Badge>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
            style={{ width: `${status.progress}%` }}
          />
        </div>

        {/* Current Stage */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
          <p className="text-xs text-blue-900 font-semibold uppercase">Current Stage</p>
          <p className="text-sm font-semibold text-blue-900 mt-1">
            {status.stages.find(s => s.stage === status.currentStage)?.label}
          </p>
        </div>

        {/* Time Metrics */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-3 rounded border">
            <p className="text-xs text-muted-foreground mb-1">Days Since Start</p>
            <p className="font-bold text-lg">{timeMetrics?.daysActive || 0}</p>
          </div>
          <div className="p-3 rounded border">
            <p className="text-xs text-muted-foreground mb-1">Days to Target</p>
            <p className={`font-bold text-lg ${(timeMetrics?.daysToClose || 0) < 7 ? 'text-orange-600' : 'text-green-600'}`}>
              {timeMetrics?.daysToClose || 0 > 0 ? timeMetrics?.daysToClose : 'Overdue'}
            </p>
          </div>
        </div>
      </Card>

      {/* Stage Breakdown */}
      <Card className="p-4">
        <p className="text-sm font-semibold mb-3">Milestone Checklist</p>
        <div className="space-y-2">
          {status.stages.slice(0, 5).map(s => (
            <div key={s.stage} className="flex items-center gap-3">
              {s.complete ? (
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              ) : s.stage === status.currentStage ? (
                <Clock className="w-4 h-4 text-blue-600 flex-shrink-0 animate-spin" />
              ) : (
                <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              )}
              <span className={`text-sm ${s.complete ? 'text-green-600 line-through' : 'text-foreground'}`}>
                {s.label}
              </span>
            </div>
          ))}
          {status.stages.length > 5 && (
            <p className="text-xs text-muted-foreground mt-2">
              +{status.stages.length - 5} more milestones
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}