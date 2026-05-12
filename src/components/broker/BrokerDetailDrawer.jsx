/**
 * BrokerDetailDrawer
 * Displays broker agency profile details
 */

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

export default function BrokerDetailDrawer({ broker, open, onOpenChange, onApprove, onRefresh }) {
  if (!broker) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending_approval': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {broker.legal_name}
            <Badge className={getStatusColor(broker.onboarding_status)}>
              {broker.onboarding_status.replace(/_/g, ' ')}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-sm text-foreground mb-3">Contact Information</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Name:</span> {broker.primary_contact_name}</p>
              <p><span className="text-muted-foreground">Email:</span> {broker.primary_contact_email}</p>
              <p><span className="text-muted-foreground">Phone:</span> {broker.primary_phone}</p>
            </div>
          </div>

          <Separator />

          {/* Location & Operations */}
          <div>
            <h3 className="font-semibold text-sm text-foreground mb-3">Location & Operations</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Headquarters:</span> {broker.state} {broker.zip_code}</p>
              {broker.service_states?.length > 0 && (
                <p><span className="text-muted-foreground">Service States:</span> {broker.service_states.join(', ')}</p>
              )}
              {broker.service_radius_miles && (
                <p><span className="text-muted-foreground">Service Radius:</span> {broker.service_radius_miles} miles</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Insurance Lines */}
          <div>
            <h3 className="font-semibold text-sm text-foreground mb-3">Insurance Lines</h3>
            <div className="flex flex-wrap gap-2">
              {broker.insurance_lines?.map(line => (
                <Badge key={line} variant="outline" className="capitalize">
                  {line.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Capacity */}
          <div>
            <h3 className="font-semibold text-sm text-foreground mb-3">Capacity</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Cases:</span> {broker.current_open_case_count}/{broker.max_open_case_capacity || '—'}</p>
              <p><span className="text-muted-foreground">Quotes:</span> {broker.current_open_quote_count}/{broker.max_open_quote_capacity || '—'}</p>
              <p><span className="text-muted-foreground">Status:</span> <Badge variant="outline">{broker.capacity_status}</Badge></p>
            </div>
          </div>

          <Separator />

          {/* Licensing & Compliance */}
          <div>
            <h3 className="font-semibold text-sm text-foreground mb-3">Licensing & Compliance</h3>
            <div className="space-y-2 text-sm">
              {broker.license_states?.length > 0 && (
                <p><span className="text-muted-foreground">Licensed States:</span> {broker.license_states.join(', ')}</p>
              )}
              {broker.license_expiration_date && (
                <p><span className="text-muted-foreground">License Expires:</span> {format(new Date(broker.license_expiration_date), 'MMM d, yyyy')}</p>
              )}
              {broker.npn && (
                <p><span className="text-muted-foreground">NPN:</span> {broker.npn}</p>
              )}
              <p><span className="text-muted-foreground">Compliance:</span> <Badge variant="outline">{broker.compliance_status}</Badge></p>
            </div>
          </div>

          {broker.notes && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold text-sm text-foreground mb-2">Notes</h3>
                <p className="text-sm text-muted-foreground">{broker.notes}</p>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {broker.onboarding_status === 'pending_approval' && (
              <Button onClick={() => onApprove(broker)} className="flex-1">
                Review & Approve
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}