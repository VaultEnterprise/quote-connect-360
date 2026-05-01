import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const TXQUOTE_OPTIONS = [
  { id: "SUS", label: "Send to SUS" },
  { id: "AST", label: "Send to AST" },
  { id: "TRIAD", label: "Send to Triad" },
  { id: "MEC_MVP", label: "Get MEC/MVP" },
  { id: "VAULT_PLAN_OPEN_SLOT", label: "Send to Vault Plan Open Slot" },
];

export default function TxQuoteOptionsModal({ open, onClose }) {
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!open) {
      setIsProcessing(false);
      setProgress(0);
      setIsComplete(false);
    }
  }, [open]);

  useEffect(() => {
    if (!isProcessing) return;

    const interval = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 100) {
          window.clearInterval(interval);
          setIsProcessing(false);
          setIsComplete(true);
          return 100;
        }
        return Math.min(current + 10, 100);
      });
    }, 180);

    return () => window.clearInterval(interval);
  }, [isProcessing]);

  const hasSelection = useMemo(() => selectedOptions.length > 0, [selectedOptions]);

  const toggleOption = (optionId) => {
    if (isProcessing) return;
    setSelectedOptions((current) => current.includes(optionId)
      ? current.filter((item) => item !== optionId)
      : [...current, optionId]);
  };

  const handleProcess = () => {
    if (!hasSelection || isProcessing) return;
    setProgress(0);
    setIsComplete(false);
    setIsProcessing(true);
    // TODO: Wire TXQuote selected destinations to backend census routing service.
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>TXQuote Options</DialogTitle>
          <DialogDescription>Select one or more destinations, then process the census files.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                {TXQUOTE_OPTIONS.map((option) => (
                  <div key={option.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={option.id}
                      checked={selectedOptions.includes(option.id)}
                      onCheckedChange={() => toggleOption(option.id)}
                      disabled={isProcessing}
                    />
                    <Label htmlFor={option.id} className="cursor-pointer text-sm font-medium">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {(isProcessing || isComplete) && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Processing status</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-3" />
                {isComplete && <p className="text-sm font-medium text-primary">Census sent.</p>}
              </CardContent>
            </Card>
          )}

          <p className="text-xs text-muted-foreground">
            TODO: Wire TXQuote selected destinations to backend census routing service.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            {isComplete ? "Close" : "Back"}
          </Button>
          <Button onClick={handleProcess} disabled={!hasSelection || isProcessing}>
            {isProcessing ? "Processing..." : "Process Census Files"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}