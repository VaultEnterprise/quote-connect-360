/**
 * Gate 6A — User Invites (activated 2026-05-05)
 * Gate 6F — Broker / Agency Sub-Scope Assignment (activated 2026-05-12)
 *
 * Visible to mga_admin only. Uses userAdminService.inviteMGAUser.
 * Roles: mga_admin, mga_manager, mga_user, mga_read_only only.
 * No platform roles. scopeGate enforced in service layer.
 *
 * Gate 6F: Broker / Agency selector added.
 * - Sub-scoped roles (mga_manager, mga_user, mga_read_only) require Broker / Agency selection.
 * - MGA-wide roles (mga_admin) may optionally select a Broker / Agency.
 * - Internal field: master_group_id (preserved — not renamed).
 * - Broker / Agency list scoped to current MGA only (cross-MGA assignment blocked at service layer).
 */
import React, { useState, useEffect } from 'react';
import { inviteMGAUser } from '@/lib/mga/services/userAdminService';
import { listMasterGroups } from '@/lib/mga/services/masterGroupService';
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

// Gate 6F: Roles that require a Broker / Agency sub-scope assignment at invite time
const SUBSCOPE_REQUIRED_ROLES = ['mga_manager', 'mga_user', 'mga_read_only'];

export default function MGAInviteUserModal({ open, onClose, mgaId, scopeRequest, onSuccess }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('mga_user');
  // Gate 6F: master_group_id sub-scope assignment (internal field — not renamed)
  const [masterGroupId, setMasterGroupId] = useState('');
  const [masterGroups, setMasterGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Gate 6F: Determine if sub-scope selection is required or optional for current role
  const subscopeRequired = SUBSCOPE_REQUIRED_ROLES.includes(role);
  const subscopeVisible = true; // always show selector; required varies by role

  // Gate 6F: Load Broker / Agencies scoped to current MGA when modal opens
  useEffect(() => {
    if (!open || !mgaId) return;
    setLoadingGroups(true);
    listMasterGroups({ ...scopeRequest, target_entity_id: mgaId }).then(res => {
      setMasterGroups(res?.data || []);
      setLoadingGroups(false);
    });
  }, [open, mgaId]);

  function reset() {
    setEmail('');
    setRole('mga_user');
    setMasterGroupId('');
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

    // Gate 6F: Block submission if sub-scoped role has no Broker / Agency selected
    if (subscopeRequired && !masterGroupId) {
      setError('Broker / Agency selection is required for this role.');
      return;
    }

    setError(null);
    setResult(null);
    setSubmitting(true);

    const idempotencyKey = `invite-${mgaId}-${email}-${Date.now()}`;

    // Gate 6F: Include master_group_id in payload when selected
    const payload = {
      user_email: email,
      role,
      ...(masterGroupId ? { master_group_id: masterGroupId } : {}),
    };

    const res = await inviteMGAUser({
      ...scopeRequest,
      target_entity_id: mgaId,
      idempotency_key: idempotencyKey,
      payload,
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

    const brokerAgencyName = masterGroupId
      ? masterGroups.find(g => g.id === masterGroupId)?.name || 'selected Broker / Agency'
      : null;

    setResult(
      brokerAgencyName
        ? `Invite sent to ${email} as ${role.replace(/_/g, ' ')} — assigned to ${brokerAgencyName}.`
        : `Invite sent to ${email} as ${role.replace(/_/g, ' ')}.`
    );
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
              <Select value={role} onValueChange={v => { setRole(v); setMasterGroupId(''); }} disabled={submitting}>
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

            {/* Gate 6F: Broker / Agency sub-scope selector */}
            {subscopeVisible && (
              <div className="space-y-1.5">
                <Label htmlFor="invite-master-group">
                  Broker / Agency
                  {subscopeRequired
                    ? <span className="text-red-500 ml-1">*</span>
                    : <span className="text-muted-foreground text-xs ml-1">(optional for MGA Admin)</span>
                  }
                </Label>
                <Select
                  value={masterGroupId}
                  onValueChange={setMasterGroupId}
                  disabled={submitting || loadingGroups}
                >
                  <SelectTrigger id="invite-master-group">
                    <SelectValue placeholder={loadingGroups ? 'Loading...' : 'Select Broker / Agency'} />
                  </SelectTrigger>
                  <SelectContent>
                    {!subscopeRequired && (
                      <SelectItem value={null}>None (MGA-wide scope)</SelectItem>
                    )}
                    {masterGroups.filter(g => g.status === 'active').map(g => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                    {masterGroups.filter(g => g.status === 'active').length === 0 && !loadingGroups && (
                      <SelectItem value={null} disabled>No active Broker / Agencies</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Only Broker / Agencies within this MGA are shown. Cross-MGA assignment is blocked.
                </p>
              </div>
            )}

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