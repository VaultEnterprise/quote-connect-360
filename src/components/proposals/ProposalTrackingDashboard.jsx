import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Mail, Check, Clock } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export default function ProposalTrackingDashboard({ proposals = [] }) {
  const stats = useMemo(() => {
    let sent = 0, viewed = 0, approved = 0, expired = 0;
    const byStatus = [];

    proposals.forEach(p => {
      if (p.status === 'sent') sent++;
      else if (p.status === 'viewed') viewed++;
      else if (p.status === 'approved') approved++;
      else if (p.status === 'expired') expired++;
    });

    return { sent, viewed, approved, expired, total: proposals.length };
  }, [proposals]);

  const recentProposals = proposals.slice(0, 5);

  const getStatusIcon = (status) => {
    if (status === 'sent') return <Mail className="w-4 h-4 text-blue-500" />;
    if (status === 'viewed') return <Eye className="w-4 h-4 text-purple-500" />;
    if (status === 'approved') return <Check className="w-4 h-4 text-green-500" />;
    return <Clock className="w-4 h-4 text-red-500" />;
  };

  const getStatusBadge = (status) => {
    const map = {
      sent: 'outline',
      viewed: 'secondary',
      approved: { variant: 'default', className: 'bg-green-100 text-green-800' },
      expired: 'destructive',
    };
    return map[status] || 'outline';
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Sent</p>
          <p className="text-xl font-bold">{stats.sent}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Viewed</p>
          <p className="text-xl font-bold text-purple-600">{stats.viewed}</p>
        </Card>
        <Card className="p-3 text-center border-green-200 bg-green-50">
          <p className="text-xs text-muted-foreground mb-1">Approved</p>
          <p className="text-xl font-bold text-green-600">{stats.approved}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Expired</p>
          <p className="text-xl font-bold">{stats.expired}</p>
        </Card>
      </div>

      {/* Recent Proposals */}
      {recentProposals.length > 0 && (
        <Card className="p-4">
          <p className="text-sm font-semibold mb-3">Recent Proposals</p>
          <div className="space-y-2">
            {recentProposals.map(proposal => (
              <div key={proposal.id} className="flex items-center justify-between p-2 border rounded hover:bg-muted/50">
                <div className="flex items-center gap-3 flex-1">
                  {getStatusIcon(proposal.status)}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{proposal.employer_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(proposal.sent_at || Date.now()), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <Badge variant={getStatusBadge(proposal.status)} className="text-xs">
                  {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {recentProposals.length === 0 && (
        <Card className="p-4 text-center text-muted-foreground text-sm">
          No proposals yet.
        </Card>
      )}
    </div>
  );
}