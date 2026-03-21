import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Copy, CheckCircle, Mail } from "lucide-react";

export default function SendProposalDialog({ proposal, open, onClose }) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [emailTo, setEmailTo] = useState(proposal?.broker_email || "");

  // Construct a sharable link (points to the employer portal with proposal ID as param)
  const shareLink = proposal
    ? `${window.location.origin}/employer-portal?proposal=${proposal.id}`
    : "";

  const markSent = useMutation({
    mutationFn: () => base44.entities.Proposal.update(proposal.id, {
      status: "sent",
      sent_at: new Date().toISOString(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      onClose();
    },
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleEmailCopy = () => {
    const subject = encodeURIComponent(`Benefits Proposal: ${proposal?.title}`);
    const body = encodeURIComponent(
      `Dear ${proposal?.employer_name || "Team"},\n\n` +
      `Please find your benefit proposal here:\n${shareLink}\n\n` +
      `Best regards,\n${proposal?.broker_name || "Your Broker"}`
    );
    window.open(`mailto:${emailTo}?subject=${subject}&body=${body}`);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-4 h-4 text-primary" /> Send Proposal
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Share <span className="font-medium text-foreground">{proposal?.title}</span> with the employer.
          </p>

          {/* Shareable Link */}
          <div>
            <Label>Shareable Link</Label>
            <div className="flex gap-2 mt-1.5">
              <Input value={shareLink} readOnly className="text-xs font-mono bg-muted/50" />
              <Button variant="outline" size="icon" onClick={handleCopy} className="flex-shrink-0">
                {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            {copied && <p className="text-xs text-green-600 mt-1">Link copied to clipboard!</p>}
          </div>

          {/* Email */}
          <div>
            <Label>Send via Email</Label>
            <div className="flex gap-2 mt-1.5">
              <Input
                type="email"
                placeholder="employer@company.com"
                value={emailTo}
                onChange={e => setEmailTo(e.target.value)}
              />
              <Button variant="outline" onClick={handleEmailCopy} disabled={!emailTo} className="flex-shrink-0 gap-1.5">
                <Mail className="w-4 h-4" /> Open
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Opens your email client with a pre-filled message.</p>
          </div>

          <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
            Clicking "Mark as Sent" will update the proposal status to <span className="font-medium text-foreground">Sent</span> and record the sent timestamp.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => markSent.mutate()} disabled={markSent.isPending} className="gap-1.5">
            <Send className="w-3.5 h-3.5" />
            {markSent.isPending ? "Marking..." : "Mark as Sent"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}