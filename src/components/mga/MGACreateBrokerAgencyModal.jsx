/**
 * Gate 6E — Broker / Agency Organization Creation Modal
 * User-facing: "Broker / Agency" / "Add Broker / Agency"
 * Internal: MasterGroup / masterGroupService.createMasterGroup
 * Visible to mga_admin and platform_super_admin only.
 * Authorization enforced server-side via scopeGate + permissionResolver (mastergroup.create).
 */
import React, { useState } from 'react';
import { createMasterGroup } from '@/lib/mga/services/masterGroupService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function MGACreateBrokerAgencyModal({ open, onClose, mgaId, scopeRequest, onSuccess }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  function reset() {
    setName('');
    setCode('');
    setNotes('');
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
    if (!name.trim() || !code.trim()) return;
    setError(null);
    setResult(null);
    setSubmitting(true);

    // Idempotency key — stable per actor + mga + name + timestamp
    const idempotencyKey = `create-broker-agency-${mgaId}-${code.trim()}-${Date.now()}`;

    const res = await createMasterGroup({
      ...scopeRequest,
      target_entity_id: mgaId,
      idempotency_key: idempotencyKey,
      payload: {
        name: name.trim(),
        code: code.trim(),
        notes: notes.trim() || undefined,
        status: 'active',
      },
    });

    setSubmitting(false);

    if (!res?.success && res?.reason_code) {
      if (res.reason_code === 'already_processed') {
        setResult('A Broker / Agency with this code already exists in this MGA.');
      } else {
        setError(`Create failed: ${res.reason_code}`);
      }
      return;
    }

    if (res?.idempotency_result === 'already_processed') {
      setResult('A Broker / Agency with this code already exists in this MGA.');
      return;
    }

    setResult(`Broker / Agency "${name.trim()}" created successfully.`);
    onSuccess?.();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Broker / Agency</DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="py-4">
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">{result}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="ba-name">Broker / Agency Name <span className="text-destructive">*</span></Label>
              <Input
                id="ba-name"
                placeholder="e.g. Acme Insurance Partners"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                disabled={submitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ba-code">Code <span className="text-destructive">*</span></Label>
              <Input
                id="ba-code"
                placeholder="e.g. ACME-001"
                value={code}
                onChange={e => setCode(e.target.value)}
                required
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground">Unique business code for this Broker / Agency.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ba-notes">Notes</Label>
              <Input
                id="ba-notes"
                placeholder="Optional internal notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                disabled={submitting}
              />
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
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={submitting || !name.trim() || !code.trim()}
            >
              {submitting ? 'Creating...' : 'Create Broker / Agency'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}