import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

/**
 * Relationship Audit / Activity Summary
 * Displays key relationship lifecycle events
 * Fail-closed: returns null if audit data is missing
 */
export default function MGARelationshipAuditPanel({ relationship }) {
  if (!relationship) {
    return null;
  }

  const events = [];

  if (relationship.proposed_date) {
    events.push({
      label: 'Proposed',
      date: relationship.proposed_date,
      actor: relationship.proposed_by_email,
      detail: `by ${relationship.proposed_by_role}`
    });
  }

  if (relationship.accepted_date) {
    events.push({
      label: 'Accepted',
      date: relationship.accepted_date,
      actor: relationship.accepted_by_email
    });
  }

  if (relationship.suspension_date) {
    events.push({
      label: 'Suspended',
      date: relationship.suspension_date,
      actor: relationship.suspended_by_email,
      detail: relationship.suspension_reason
    });
  }

  if (relationship.termination_date) {
    events.push({
      label: 'Terminated',
      date: relationship.termination_date,
      actor: relationship.terminated_by_email,
      detail: relationship.termination_reason
    });
  }

  if (events.length === 0) {
    return null;
  }

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Relationship History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {events.map((event, idx) => (
            <div key={idx} className="flex gap-4 text-sm border-l-2 border-slate-200 pl-3">
              <div className="flex flex-col">
                <span className="font-semibold text-slate-900">{event.label}</span>
                <span className="text-xs text-slate-600">
                  {format(new Date(event.date), 'MMM d, yyyy h:mm a')}
                </span>
              </div>
              <div className="flex flex-col">
                {event.actor && (
                  <span className="text-xs text-slate-600">{event.actor}</span>
                )}
                {event.detail && (
                  <span className="text-xs text-slate-500 italic">{event.detail}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}