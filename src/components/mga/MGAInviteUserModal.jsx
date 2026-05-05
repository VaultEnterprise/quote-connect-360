/**
 * Gate 6A — User Invites (activated 2026-05-05)
 * Visible to mga_admin only. Uses userAdminService.inviteMGAUser.
 * Roles: mga_admin, mga_manager, mga_user, mga_read_only only.
 * No platform roles. scopeGate enforced in service layer.
 */
import React, { useState } from 'react';
import { inviteMGAUser } from '@/lib/mga/services/userAdminService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ALLOWED_ROLES = [
  { value: 'mga_admin', label: 'MGA Admin' },
  { value: 'mga_manager', label: 'MGA Manager' },
  { value: 'mga_user', label: 'MGA User' },
  { value: 'mga_read_only', label: 'MGA Read Only' },
];

export default function MGAInviteUserModal({ open, onClose, mgaId, scopeRequest, onSuccess }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('mga_user');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  function reset() {
    setEmail('');
    setRole('mga_user');
    setError(null);
    setResult(null);
    setSubmitting(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !role) return;
    setError(null);
    setResult(null);
    setSubmitting(true);

    const idempotencyKey = `invite-${mgaId}-${email}-${Date.now()}`;

    const res = await inviteMGAUser({
      ...scopeRequest,
      target_entity_id: mgaId,
      idempotency_key: idempotencyKey,
      payload: { user_email: email, role },
    });

    setSubmitting(false);

    if (!res?.success && res?.reason_code) {
      setError(`Invite failed: ${res.reason_code}`);
      return;
    }

    if (res?.idempotency_result === 'already_processed') {
      setResult('This user is already invited or active in this MGA.');
      return;
    }

    setResult(`Invite sent to ${email} as ${role.replace(/_/g, ' ')}.`);
    onSuccess?.();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite User to MGA</DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="py-4">
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">{result}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={submitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="invite-role">Role</Label>
              <Select value={role} onValueChange={setRole} disabled={submitting}>
                <SelectTrigger id="invite-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ALLOWED_ROLES.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}
          </form>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result && (
            <Button type="submit" onClick={handleSubmit} disabled={submitting || !email}>
              {submitting ? 'Sending...' : 'Send Invite'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}