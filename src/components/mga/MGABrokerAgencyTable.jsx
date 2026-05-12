/**
 * Broker Agency Table
 * Displays broker agencies with edit/delete actions (MGA view)
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function MGABrokerAgencyTable({ 
  agencies, 
  loading, 
  onEdit, 
  onDelete 
}) {
  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading broker agencies...</div>;
  }

  if (!agencies || agencies.length === 0) {
    return <div className="p-8 text-center text-muted-foreground">No broker agencies added yet.</div>;
  }

  const statusColors = {
    prospect: 'bg-gray-100 text-gray-800',
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-600',
    suspended: 'bg-red-100 text-red-800',
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Broker Name</th>
            <th className="px-4 py-3 text-left font-medium">Contact Email</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-left font-medium">Created</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {agencies.map(agency => (
            <tr key={agency.id} className="hover:bg-muted/50">
              <td className="px-4 py-3 font-medium text-foreground">{agency.broker_name}</td>
              <td className="px-4 py-3 text-muted-foreground">{agency.primary_contact_email}</td>
              <td className="px-4 py-3">
                <Badge className={statusColors[agency.relationship_status]}>
                  {agency.relationship_status}
                </Badge>
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {agency.created_at ? format(new Date(agency.created_at), 'MMM d, yyyy') : '—'}
              </td>
              <td className="px-4 py-3 text-right space-x-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(agency)}
                  className="h-8 w-8 p-0"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(agency.id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}