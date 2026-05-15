/**
 * MGABrokerAgencyEditModal — Gate 6H
 * Edit Broker / Agency profile fields
 */
import React, { useState } from 'react';
import { updateMasterGroup } from '@/lib/mga/services/masterGroupService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const ALLOWED_FIELDS = ['name', 'address', 'city', 'state', 'zip', 'phone', 'email', 'primary_contact_name', 'notes'];

export default function MGABrokerAgencyEditModal({
  open,
  onClose,
  org,
  scopeRequest,
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    name: org?.name || '',
    address: org?.address || '',
    city: org?.city || '',
    state: org?.state || '',
    zip: org?.zip || '',
    phone: org?.phone || '',
    email: org?.email || '',
    primary_contact_name: org?.primary_contact_name || '',
    notes: org?.notes || '',
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setError(null);
    if (!formData.name.trim()) {
      setError('Organization name is required');
      return;
    }

    setSaving(true);
    const payload = {};
    ALLOWED_FIELDS.forEach(field => {
      const value = formData[field];
      if (value !== undefined && value !== '') {
        payload[field] = value;
      }
    });

    // Retry with exponential backoff for rate limit (429)
    let result;
    let retryCount = 0;
    const maxRetries = 3;
    while (retryCount <= maxRetries) {
      result = await updateMasterGroup({
        ...scopeRequest,
        target_entity_id: org.id,
        payload,
        idempotency_key: `edit-${org.id}-${Date.now()}`,
        expected_updated_date: org.updated_date,
      });

      if (result?.success || (result?.reason_code && result.reason_code !== 'RATE_LIMIT')) {
        break;
      }

      if (retryCount < maxRetries) {
        const delayMs = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delayMs));
        retryCount++;
      } else {
        break;
      }
    }

    setSaving(false);
    if (result?.success) {
      onSuccess?.();
      onClose();
    } else {
      setError(result?.detail || 'Failed to update organization. Please try again.');
    }
  }

  if (!org) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Broker / Agency</DialogTitle>
          <DialogDescription>Update organization profile information</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">{error}</div>}

          <div>
            <Label htmlFor="name">Organization Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter organization name"
            />
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              placeholder="Street address"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                placeholder="City"
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={e => setFormData({ ...formData, state: e.target.value })}
                placeholder="ST"
                maxLength="10"
              />
            </div>
            <div>
              <Label htmlFor="zip">ZIP</Label>
              <Input
                id="zip"
                value={formData.zip}
                onChange={e => setFormData({ ...formData, zip: e.target.value })}
                placeholder="ZIP"
                maxLength="20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Phone number"
                type="tel"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="Email"
                type="email"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="contact">Primary Contact Name</Label>
            <Input
              id="contact"
              value={formData.primary_contact_name}
              onChange={e => setFormData({ ...formData, primary_contact_name: e.target.value })}
              placeholder="Contact person name"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Internal notes"
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}