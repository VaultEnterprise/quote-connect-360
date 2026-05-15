import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, Mail, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function SendReminderDialog({ proposal, open, onClose }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [emailTo, setEmailTo] = useState(proposal?.primary_contact_email || "");
  const [message, setMessage] = useState(
    `Hi,\n\nJust following up on the benefits proposal we sent over for ${proposal?.employer_name || "your group"}. Please let us know if you have any questions or would like to discuss the options.\n\nThank you!`
  );
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!emailTo || !proposal) return;
    setSending(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: emailTo,
        subject: `Reminder: Benefits Proposal — ${proposal.title}`,
        body: message,
      });
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      toast({ title: "Reminder sent!", description: `Follow-up email delivered to ${emailTo}` });
      onClose();
    } catch (err) {
      toast({ title: "Send failed", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  if (!proposal) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-500" /> Send Follow-Up Reminder
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Send a reminder about <span className="font-medium text-foreground">{proposal.title}</span>.
          </p>
          <div>
            <Label>Send To</Label>
            <Input type="email" value={emailTo} onChange={e => setEmailTo(e.target.value)} className="mt-1.5" placeholder="employer@company.com" />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea value={message} onChange={e => setMessage(e.target.value)} className="mt-1.5" rows={5} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSend} disabled={!emailTo || sending} className="gap-1.5">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {sending ? "Sending..." : "Send Reminder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}