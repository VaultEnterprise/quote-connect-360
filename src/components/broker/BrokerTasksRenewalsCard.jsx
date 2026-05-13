/**
 * Tasks and Renewals Card — Phase 7A-2.5
 * 
 * Displays tasks due and renewals due by channel.
 * Placeholder for future workflow expansion.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Calendar } from 'lucide-react';

export default function BrokerTasksRenewalsCard({ dashboard }) {
  if (!dashboard) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-4 h-4" />
              Tasks Due
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="w-4 h-4" />
              Renewals Due
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { alerts } = dashboard;
  const tasksDue = alerts?.tasks_due || 0;
  const renewalsDue = alerts?.renewals_due || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Tasks Due */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-4 h-4" />
            Tasks Due
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Due Soon</span>
              <span className={`text-2xl font-bold ${tasksDue > 0 ? 'text-accent' : 'text-foreground'}`}>
                {tasksDue}
              </span>
            </div>
          </div>
          {tasksDue === 0 && (
            <p className="text-xs text-muted-foreground mt-4">No tasks due soon</p>
          )}
        </CardContent>
      </Card>

      {/* Renewals Due */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="w-4 h-4" />
            Renewals Due
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Due Soon</span>
              <span className={`text-2xl font-bold ${renewalsDue > 0 ? 'text-accent' : 'text-foreground'}`}>
                {renewalsDue}
              </span>
            </div>
          </div>
          {renewalsDue === 0 && (
            <p className="text-xs text-muted-foreground mt-4">No renewals due soon</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}