/**
 * BrokerApprovalModal
 * Admin approval workflow for broker agencies
 */

import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export default function BrokerApprovalModal({ broker, open, onOpenChange, onComplete }) {
  const { user } = useAuth();
  const [action, setAction] = useState(null); // 'approve' or 'reject'
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!broker) return null;

  const handleApprove = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await base44.functions.invoke('approveBrokerProfile', {
        broker_agency_id: broker.id,
        approver_email: user.email,
        approver_role: user.role,
        notes
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          onOpenChange(false);
          onComplete();
        }, 1500);
      } else {
        setError(response.data.error || 'Failed to approve broker');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to approve broker');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await base44.functions.invoke('rejectBrokerProfile', {
        broker_agency_id: broker.id,
        rejection_reason: notes,
        rejected_by_email: user.email,
        rejected_by_role: user.role
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          onOpenChange(false);
          onComplete();
        }, 1500);
      } else {
        setError(response.data.error || 'Failed to reject broker');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to reject broker');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex flex-col items-center gap-4 py-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
            <p className="text-sm text-muted-foreground">
              {action === 'approve' ? 'Broker approved successfully' : 'Broker rejected'}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review Broker Application</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="font-semibold text-sm">{broker.legal_name}</p>
            <p className="text-xs text-muted-foreground mt-1">{broker.primary_contact_email}</p>
          </div>

          {error && (
            <div className="flex gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              {action === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason (Required)'}
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={action === 'approve' ? 'Any notes for the broker...' : 'Explain why this application is being rejected...'}
              className="h-32"
            />
          </div>
        </div>

        <DialogFooter>
          {!action ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => setAction('reject')}
                disabled={loading}
              >
                Reject
              </Button>
              <Button
                onClick={() => setAction('approve')}
                disabled={loading}
              >
                Approve
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setAction(null)} disabled={loading}>
                Back
              </Button>
              <Button
                onClick={action === 'approve' ? handleApprove : handleReject}
                disabled={loading || (action === 'reject' && !notes)}
                variant={action === 'approve' ? 'default' : 'destructive'}
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {action === 'approve' ? 'Approve Broker' : 'Reject Application'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}