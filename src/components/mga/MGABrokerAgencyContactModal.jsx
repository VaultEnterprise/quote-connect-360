/**
 * MGABrokerAgencyContactModal — Gate 6L-A
 * Add/edit contact modal
 */
import React, { useState } from 'react';
import { createBrokerAgencyContact, updateBrokerAgencyContact } from '@/lib/mga/services/masterGroupService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export default function MGABrokerAgencyContactModal({
  open,
  onClose,
  masterGroupId,
  mgaId,
  scopeRequest,
  contact,
  onSave,
}) {
  const [data, setData] = useState(contact || {
    contact_type: 'other',
    full_name: '',
    email: '',
    title: '',
    phone: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSave() {
    if (!data.full_name || !data.email) {
      setError('Name and email are required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (contact?.id) {
        await updateBrokerAgencyContact({
          ...scopeRequest,
          target_entity_id: masterGroupId,
          contact_id: contact.id,
          payload: data,
          idempotency_key: `update-contact-${contact.id}`,
        });
      } else {
        await createBrokerAgencyContact({
          ...scopeRequest,
          target_entity_id: masterGroupId,
          payload: data,
          idempotency_key: `create-contact-${Date.now()}`,
        });
      }
      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{contact ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {error && <div className="text-sm text-red-600">{error}</div>}

          <div>
            <Label className="text-sm">Contact Type *</Label>
            <Select value={data.contact_type} onValueChange={v => setData({ ...data, contact_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">Primary</SelectItem>
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="operations">Operations</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm">Full Name *</Label>
            <Input
              value={data.full_name}
              onChange={e => setData({ ...data, full_name: e.target.value })}
              placeholder="John Doe"
            />
          </div>

          <div>
            <Label className="text-sm">Email *</Label>
            <Input
              type="email"
              value={data.email}
              onChange={e => setData({ ...data, email: e.target.value })}
              placeholder="john@example.com"
            />
          </div>

          <div>
            <Label className="text-sm">Title</Label>
            <Input
              value={data.title}
              onChange={e => setData({ ...data, title: e.target.value })}
              placeholder="Director of Benefits"
            />
          </div>

          <div>
            <Label className="text-sm">Phone</Label>
            <Input
              value={data.phone}
              onChange={e => setData({ ...data, phone: e.target.value })}
              placeholder="+1-555-0000"
            />
          </div>

          <div>
            <Label className="text-sm">Notes</Label>
            <Textarea
              value={data.notes}
              onChange={e => setData({ ...data, notes: e.target.value })}
              placeholder="Internal notes"
              className="h-20"
            />
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}