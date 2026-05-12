/**
 * Broker Agency Signup Modal
 * Used in both MGA Command (admin creation) and Broker Page (self-service)
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function MGABrokerAgencySignupModal({ 
  open, 
  onClose, 
  onSubmit, 
  mode = 'mga' // 'mga' (admin) or 'broker' (self-service)
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    broker_name: '',
    primary_contact_email: '',
    primary_phone: '',
    business_address_json: '{}',
    service_states_json: '[]',
    service_zip_codes_json: '[]',
    insurance_lines_json: '[]',
    industry_specialties_json: '[]',
    license_states_json: '[]',
    compliance_status: 'pending_review',
    onboarding_status: 'not_started',
    relationship_status: 'prospect',
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.broker_name || !formData.primary_contact_email) {
      alert('Broker name and email are required');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      setFormData({
        broker_name: '',
        primary_contact_email: '',
        primary_phone: '',
        business_address_json: '{}',
        service_states_json: '[]',
        service_zip_codes_json: '[]',
        insurance_lines_json: '[]',
        industry_specialties_json: '[]',
        license_states_json: '[]',
        compliance_status: 'pending_review',
        onboarding_status: 'not_started',
        relationship_status: 'prospect',
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'mga' ? 'Add Broker Agency' : 'Create Your Broker Agency Profile'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Broker Agency Name *</Label>
            <Input
              value={formData.broker_name}
              onChange={(e) => handleChange('broker_name', e.target.value)}
              placeholder="Legal name of broker agency"
            />
          </div>

          <div>
            <Label>Primary Contact Email *</Label>
            <Input
              type="email"
              value={formData.primary_contact_email}
              onChange={(e) => handleChange('primary_contact_email', e.target.value)}
              placeholder="contact@broker.com"
            />
          </div>

          <div>
            <Label>Primary Phone</Label>
            <Input
              value={formData.primary_phone}
              onChange={(e) => handleChange('primary_phone', e.target.value)}
              placeholder="(555) 000-0000"
            />
          </div>

          <div>
            <Label>Service States (JSON array)</Label>
            <Textarea
              value={formData.service_states_json}
              onChange={(e) => handleChange('service_states_json', e.target.value)}
              placeholder='["CA", "NY", "TX"]'
              rows={2}
            />
          </div>

          <div>
            <Label>Insurance Lines (JSON array)</Label>
            <Textarea
              value={formData.insurance_lines_json}
              onChange={(e) => handleChange('insurance_lines_json', e.target.value)}
              placeholder='["Medical", "Dental", "Vision"]'
              rows={2}
            />
          </div>

          <div>
            <Label>Industry Specialties (JSON array)</Label>
            <Textarea
              value={formData.industry_specialties_json}
              onChange={(e) => handleChange('industry_specialties_json', e.target.value)}
              placeholder='["Technology", "Healthcare"]'
              rows={2}
            />
          </div>

          {mode === 'mga' && (
            <div>
              <Label>Relationship Status</Label>
              <select
                value={formData.relationship_status}
                onChange={(e) => handleChange('relationship_status', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="prospect">Prospect</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'mga' ? 'Add Broker Agency' : 'Create Profile'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}