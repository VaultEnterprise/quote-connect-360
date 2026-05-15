import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Send, Copy, CheckCircle, Mail, Download, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function SendProposalDialog({ proposal, open, onClose }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [emailTo, setEmailTo] = useState(proposal?.primary_contact_email || "");
  const [sending, setSending] = useState(false);
  const [exporting, setExporting] = useState(false);

  const shareLink = proposal
    ? `${window.location.origin}/employer-portal?proposal=${proposal.id}`
    : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendEmail = async () => {
    if (!emailTo || !proposal) return;
    setSending(true);
    try {
      const res = await base44.functions.invoke("sendProposalEmail", {
        proposal_id: proposal.id,
        to_email: emailTo,
      });
      if (res.data?.error) throw new Error(res.data.error);
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      toast({ title: "Proposal sent!", description: `Email delivered to ${emailTo}` });
      onClose();
    } catch (err) {
      toast({ title: "Send failed", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleExportPDF = async () => {
    if (!proposal) return;
    setExporting(true);
    try {
      const response = await base44.functions.invoke("exportProposalPDF", { proposal_id: proposal.id });
      // response.data is the raw PDF blob from axios
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `proposal-${(proposal.employer_name || "proposal").replace(/\s+/g, "-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "PDF exported", description: "Proposal downloaded successfully." });
    } catch (err) {
      toast({ title: "Export failed", description: err.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
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
            {copied && <p className="text-xs text-green-600 mt-1">Link copied!</p>}
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
              <Button onClick={handleSendEmail} disabled={!emailTo || sending} className="flex-shrink-0 gap-1.5">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                {sending ? "Sending..." : "Send"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Sends a branded email with a link to the employer portal.</p>
          </div>

          {/* PDF Export */}
          <div>
            <Label>Export as PDF</Label>
            <div className="mt-1.5">
              <Button variant="outline" onClick={handleExportPDF} disabled={exporting} className="gap-1.5 w-full">
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {exporting ? "Generating PDF..." : "Download PDF"}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}