/**
 * Broker Signup Page
 * Self-service broker signup form
 * Available to unauthenticated or broker users
 */

import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const INSURANCE_LINES = [
  'health', 'dental', 'vision', 'life', 'disability',
  'workers_comp', 'property_casualty', 'liability', 'epli'
];

export default function BrokerSignup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: identity, 2: contact, 3: lines, 4: confirm
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  const [form, setForm] = useState({
    legal_name: '',
    dba_name: '',
    primary_contact_name: '',
    primary_contact_email: '',
    primary_phone: '',
    zip_code: '',
    state: '',
    license_states: [],
    license_expiration_date: '',
    insurance_lines: [],
    industry_specialties: '',
    employer_size_min: '',
    employer_size_max: '',
    accepts_terms: false,
    accepts_compliance: false
  });

  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleLineToggle = (line) => {
    setForm(prev => ({
      ...prev,
      insurance_lines: prev.insurance_lines.includes(line)
        ? prev.insurance_lines.filter(l => l !== line)
        : [...prev.insurance_lines, line]
    }));
  };

  const handleStateToggle = (state) => {
    setForm(prev => ({
      ...prev,
      license_states: prev.license_states.includes(state)
        ? prev.license_states.filter(s => s !== state)
        : [...prev.license_states, state]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Get tenant context (assumes user is logged in or has tenant in session)
      const user = await base44.auth.me();
      const tenantId = user?.tenant_id || 'platform'; // Default to platform tenant

      // Call broker signup function
      const response = await base44.functions.invoke('brokerSignup', {
        tenant_id: tenantId,
        legal_name: form.legal_name,
        dba_name: form.dba_name,
        primary_contact_name: form.primary_contact_name,
        primary_contact_email: form.primary_contact_email,
        primary_phone: form.primary_phone,
        zip_code: form.zip_code,
        state: form.state,
        license_states: form.license_states,
        license_expiration_date: form.license_expiration_date,
        insurance_lines: form.insurance_lines,
        industry_specialties: form.industry_specialties.split(',').map(s => s.trim()),
        employer_size_min: form.employer_size_min ? parseInt(form.employer_size_min) : null,
        employer_size_max: form.employer_size_max ? parseInt(form.employer_size_max) : null,
        actor_user_email: user?.email || 'broker_signup'
      });

      setSuccess(true);
      setSubmitted(response.data);

      // Redirect to broker login after success
      setTimeout(() => {
        navigate('/broker/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to submit broker signup');
    } finally {
      setLoading(false);
    }
  };

  if (success && submitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-2">Signup Submitted</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Your broker profile has been submitted for review. We'll contact you within 2-3 business days.
                </p>
                <p className="text-xs text-muted-foreground">
                  Redirecting to login...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Broker Agency Signup</h1>
          <p className="text-muted-foreground">Join our platform as a standalone broker agency</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Step {step} of 4: {step === 1 ? 'Business Identity' : step === 2 ? 'Contact Information' : step === 3 ? 'Service Details' : 'Confirmation'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Step 1: Identity */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Legal Business Name *</label>
                    <Input
                      required
                      value={form.legal_name}
                      onChange={(e) => handleInputChange('legal_name', e.target.value)}
                      placeholder="Your legal entity name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">DBA Name (Optional)</label>
                    <Input
                      value={form.dba_name}
                      onChange={(e) => handleInputChange('dba_name', e.target.value)}
                      placeholder="Doing business as..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">State of Operation *</label>
                    <Select value={form.state} onValueChange={(value) => handleInputChange('state', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {US_STATES.map(state => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">ZIP Code *</label>
                    <Input
                      required
                      value={form.zip_code}
                      onChange={(e) => handleInputChange('zip_code', e.target.value)}
                      placeholder="00000"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Contact */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">First Name *</label>
                      <Input
                        required
                        value={form.primary_contact_name.split(' ')[0] || ''}
                        onChange={(e) => {
                          const last = form.primary_contact_name.split(' ').slice(1).join(' ');
                          handleInputChange('primary_contact_name', `${e.target.value} ${last}`.trim());
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Last Name *</label>
                      <Input
                        required
                        value={form.primary_contact_name.split(' ').slice(1).join(' ') || ''}
                        onChange={(e) => {
                          const first = form.primary_contact_name.split(' ')[0];
                          handleInputChange('primary_contact_name', `${first} ${e.target.value}`.trim());
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Email Address *</label>
                    <Input
                      required
                      type="email"
                      value={form.primary_contact_email}
                      onChange={(e) => handleInputChange('primary_contact_email', e.target.value)}
                      placeholder="contact@broker.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Phone *</label>
                    <Input
                      required
                      type="tel"
                      value={form.primary_phone}
                      onChange={(e) => handleInputChange('primary_phone', e.target.value)}
                      placeholder="(555) 000-0000"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Service Details */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">License Expiration Date *</label>
                    <Input
                      required
                      type="date"
                      value={form.license_expiration_date}
                      onChange={(e) => handleInputChange('license_expiration_date', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Licensed States *</label>
                    <div className="grid grid-cols-4 gap-2 p-3 border rounded-lg bg-muted/50">
                      {US_STATES.map(state => (
                        <label key={state} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={form.license_states.includes(state)}
                            onCheckedChange={() => handleStateToggle(state)}
                          />
                          <span className="text-xs text-foreground">{state}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Insurance Lines *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {INSURANCE_LINES.map(line => (
                        <label key={line} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={form.insurance_lines.includes(line)}
                            onCheckedChange={() => handleLineToggle(line)}
                          />
                          <span className="text-xs text-foreground capitalize">{line.replace(/_/g, ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Industry Specialties (Optional)</label>
                    <Input
                      value={form.industry_specialties}
                      onChange={(e) => handleInputChange('industry_specialties', e.target.value)}
                      placeholder="Healthcare, Tech, Manufacturing (comma-separated)"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Min Employer Size</label>
                      <Input
                        type="number"
                        value={form.employer_size_min}
                        onChange={(e) => handleInputChange('employer_size_min', e.target.value)}
                        placeholder="5"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Max Employer Size</label>
                      <Input
                        type="number"
                        value={form.employer_size_max}
                        onChange={(e) => handleInputChange('employer_size_max', e.target.value)}
                        placeholder="1000"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Confirmation */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="p-3 bg-muted rounded-lg space-y-2 text-sm">
                    <p><span className="font-medium">Business:</span> {form.legal_name}</p>
                    <p><span className="font-medium">Contact:</span> {form.primary_contact_name} ({form.primary_contact_email})</p>
                    <p><span className="font-medium">Location:</span> {form.state} {form.zip_code}</p>
                    <p><span className="font-medium">Licensed States:</span> {form.license_states.join(', ')}</p>
                    <p><span className="font-medium">Lines:</span> {form.insurance_lines.map(l => l.replace(/_/g, ' ')).join(', ')}</p>
                  </div>

                  <label className="flex items-start gap-2 cursor-pointer">
                    <Checkbox
                      checked={form.accepts_terms}
                      onCheckedChange={(val) => handleInputChange('accepts_terms', val)}
                    />
                    <span className="text-xs text-muted-foreground">
                      I agree to the Master Service Agreement and broker terms of service
                    </span>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer">
                    <Checkbox
                      checked={form.accepts_compliance}
                      onCheckedChange={(val) => handleInputChange('accepts_compliance', val)}
                    />
                    <span className="text-xs text-muted-foreground">
                      I acknowledge that my profile will be reviewed for compliance and licensing verification
                    </span>
                  </label>
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-3 pt-4">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                    disabled={loading}
                  >
                    Back
                  </Button>
                )}
                {step < 4 ? (
                  <Button
                    type="button"
                    onClick={() => setStep(step + 1)}
                    disabled={loading}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={loading || !form.accepts_terms || !form.accepts_compliance}
                  >
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Submit Application
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}