import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Mail, MessageCircle } from "lucide-react";

export default function HelpContactCard({ brokerName, brokerEmail, brokerPhone, employerName }) {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-primary" />
          <p className="font-semibold text-sm">Need Help?</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Contact your benefits administrator or broker with questions about your coverage.
        </p>
        <div className="space-y-2">
          {brokerName && (
            <div className="p-2.5 rounded-lg bg-muted/40">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Your Broker</p>
              <p className="text-sm font-medium">{brokerName}</p>
              {brokerPhone && (
                <a href={`tel:${brokerPhone}`} className="flex items-center gap-1.5 text-xs text-primary hover:underline mt-1">
                  <Phone className="w-3 h-3" /> {brokerPhone}
                </a>
              )}
              {brokerEmail && (
                <a href={`mailto:${brokerEmail}`} className="flex items-center gap-1.5 text-xs text-primary hover:underline mt-1">
                  <Mail className="w-3 h-3" /> {brokerEmail}
                </a>
              )}
            </div>
          )}
          {!brokerName && (
            <div className="p-2.5 rounded-lg bg-muted/40">
              <p className="text-xs text-muted-foreground">Contact your HR department for benefits support.</p>
            </div>
          )}
          <div className="p-2.5 rounded-lg bg-muted/40">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">General Support</p>
            <a href="mailto:benefits@yourcompany.com" className="flex items-center gap-1.5 text-xs text-primary hover:underline">
              <Mail className="w-3 h-3" /> benefits@yourcompany.com
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}