import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Mail, CheckCircle, Clock } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export default function ProposalCard({ proposal, onView, onSend }) {
  const metrics = useMemo(() => {
    const total = proposal.total_monthly_premium || 0;
    const employer = proposal.employer_monthly_cost || 0;
    const employee = proposal.employee_avg_cost || 0;

    return {
      totalMonthly: total.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
      employerMonthly: employer.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
      employeeMonthly: employee.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
    };
  }, [proposal]);

  const daysToExpire = useMemo(() => {
    if (!proposal.expires_at) return null;
    return Math.max(0, differenceInDays(new Date(proposal.expires_at), new Date()));
  }, [proposal.expires_at]);

  const statusColor = {
    draft: 'bg-slate-50 border-slate-200',
    sent: 'bg-blue-50 border-blue-200',
    viewed: 'bg-purple-50 border-purple-200',
    approved: 'bg-green-50 border-green-200',
    rejected: 'bg-red-50 border-red-200',
    expired: 'bg-gray-50 border-gray-200',
  };

  return (
    <Card className={`p-4 border ${statusColor[proposal.status]}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1 truncate">{proposal.title}</h3>
            <p className="text-xs text-muted-foreground">
              {proposal.employer_name || 'Employer'}
            </p>
          </div>
          <Badge variant="outline" className="text-xs flex-shrink-0 ml-2">
            {proposal.status.replace(/_/g, ' ').toUpperCase()}
          </Badge>
        </div>

        {/* Status Timeline */}
        <div className="space-y-2 text-xs">
          {proposal.sent_at && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span>Sent {format(new Date(proposal.sent_at), 'MMM d, yyyy')}</span>
            </div>
          )}
          {proposal.viewed_at && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Eye className="w-4 h-4" />
              <span>Viewed {format(new Date(proposal.viewed_at), 'MMM d, yyyy')}</span>
            </div>
          )}
          {proposal.approved_at && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>Approved {format(new Date(proposal.approved_at), 'MMM d, yyyy')}</span>
            </div>
          )}
        </div>

        {/* Financial Summary */}
        <div className="space-y-1 p-3 bg-white/50 rounded">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Total Monthly</span>
            <span className="font-semibold">{metrics.totalMonthly}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Employer</span>
            <span className="font-semibold text-blue-600">{metrics.employerMonthly}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Avg Employee</span>
            <span className="font-semibold text-purple-600">{metrics.employeeMonthly}</span>
          </div>
        </div>

        {/* Expiry Warning */}
        {daysToExpire !== null && proposal.status !== 'approved' && (
          <div className={`p-2 rounded text-xs font-medium ${
            daysToExpire <= 3 ? 'bg-red-100 text-red-900' : 'bg-yellow-100 text-yellow-900'
          }`}>
            {daysToExpire === 0 ? 'Expires today' : `Expires in ${daysToExpire} day${daysToExpire !== 1 ? 's' : ''}`}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button size="sm" className="flex-1" variant="outline" onClick={() => onView?.(proposal.id)}>
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
          {proposal.status === 'draft' && (
            <Button size="sm" className="flex-1" onClick={() => onSend?.(proposal.id)}>
              <Mail className="w-4 h-4 mr-1" />
              Send
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}