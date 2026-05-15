import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MessageSquare, User } from "lucide-react";

/**
 * BrokerContactCard
 * Displays assigned broker contact info with click-to-email/call actions.
 *
 * Props:
 *   brokerEmail   — string | null
 *   brokerName    — string | null (derived from assigned_to)
 *   agencyName    — string | null
 */
export default function BrokerContactCard({ brokerEmail, brokerName, agencyName }) {
  const displayName = brokerName || brokerEmail || "Your Broker";
  const initials = displayName
    .split(/[\s@.]+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || "")
    .join("");

  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Your Broker</p>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-primary">{initials || <User className="w-4 h-4" />}</span>
          </div>
          <div>
            <p className="text-sm font-semibold">{displayName}</p>
            {agencyName && <p className="text-xs text-muted-foreground">{agencyName}</p>}
          </div>
        </div>
        <div className="space-y-2">
          {brokerEmail && (
            <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs" asChild>
              <a href={`mailto:${brokerEmail}`}>
                <Mail className="w-3.5 h-3.5" /> {brokerEmail}
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs" asChild>
            <a href={brokerEmail ? `mailto:${brokerEmail}?subject=Benefits Question` : "#"}>
              <MessageSquare className="w-3.5 h-3.5" /> Send Message
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}