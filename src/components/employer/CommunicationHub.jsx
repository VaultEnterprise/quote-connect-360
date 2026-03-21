import React, { useState } from "react";
import { MessageSquare, Plus, Calendar, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

// Mock communication log (would come from backend in production)
const MOCK_COMMUNICATIONS = [
  { id: 1, type: "email", action: "Proposal sent", actor: "Sarah Smith", timestamp: "2024-03-15 10:30 AM", detail: "Annual renewal proposal" },
  { id: 2, type: "call", action: "Initial consultation", actor: "Sarah Smith", timestamp: "2024-03-10 2:00 PM", detail: "Discussed coverage needs" },
  { id: 3, type: "email", action: "Census uploaded", actor: "System", timestamp: "2024-03-08 9:15 AM", detail: "145 employees" },
];

export default function CommunicationHub({ brokerName, brokerEmail, caseId }) {
  const [showScheduling, setShowScheduling] = useState(false);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Communication History</p>
          <Button size="icon" variant="ghost" className="h-7 w-7">
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {MOCK_COMMUNICATIONS.map(comm => (
            <div key={comm.id} className="flex gap-3 pb-3 border-b last:border-0">
              <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                {comm.type === "email" ? (
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                ) : (
                  <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{comm.action}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {comm.actor} • {comm.timestamp}
                </p>
                {comm.detail && <p className="text-xs text-muted-foreground mt-1">{comm.detail}</p>}
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="space-y-2 mt-4 pt-4 border-t">
          <Button variant="outline" size="sm" className="w-full text-xs justify-start">
            <Mail className="w-3.5 h-3.5 mr-2" />
            Send Email
          </Button>
          <Button variant="outline" size="sm" className="w-full text-xs justify-start" onClick={() => setShowScheduling(!showScheduling)}>
            <Calendar className="w-3.5 h-3.5 mr-2" />
            Schedule Call
          </Button>
        </div>

        {/* Open questions tracker */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Open Questions</p>
          <ul className="space-y-1.5 text-xs">
            <li className="flex items-start gap-2">
              <input type="checkbox" className="mt-0.5 flex-shrink-0" />
              <span>Confirm carrier preference</span>
            </li>
            <li className="flex items-start gap-2">
              <input type="checkbox" className="mt-0.5 flex-shrink-0" />
              <span>Review wellness program budget</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}